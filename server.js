import express from 'express'
import { generateGameData, generateReleaseNotes } from './lib/generate.js'
import { generateQuizExplorerContent, generateLandingPageContent } from './lib/content-gen.js'
import { applyTemplate, detectTemplate, TEMPLATE_IDS } from './lib/templates.js'
import { validateHTML } from './lib/validate.js'
import { patchAndValidate } from './lib/patcher.js'
import { createRepo, pushFiles, repoUrl, readFile, updateFile, enableGitHubPages } from './lib/github.js'
import { createProject, triggerAndWaitForDeploy } from './lib/vercel.js'
import {
  getIdea, getBrief, setStatus, createApproval, recoverStuckBuilds
} from './lib/supabase.js'

const ROG_REPO = process.env.ROG_REPO || 'rules-of-games'
const ROG_VERCEL_PROJECT = process.env.ROG_VERCEL_PROJECT || 'app'

const app = express()
app.use(express.json())

const WORKER_SECRET = process.env.WORKER_SECRET

function auth(req, res, next) {
  if (req.headers['x-worker-secret'] !== WORKER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }))

// Diagnostic endpoint
app.get('/test', auth, async (req, res) => {
  const results = {}

  // Test Anthropic
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    await client.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] })
    results.anthropic = 'OK'
  } catch (e) { results.anthropic = e.message }

  // Test Supabase
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
    const { error } = await sb.from('ideas').select('id').limit(1)
    results.supabase = error ? error.message : 'OK'
  } catch (e) { results.supabase = e.message }

  // Test GitHub
  try {
    const r = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } })
    const d = await r.json()
    results.github = d.login ? `OK (${d.login})` : d.message
  } catch (e) { results.github = e.message }

  results.env = {
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    anthropicKeyPrefix: process.env.ANTHROPIC_API_KEY?.slice(0, 20),
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasGithubToken: !!process.env.GITHUB_TOKEN,
    hasVercelToken: !!process.env.VERCEL_TOKEN,
  }

  res.json(results)
})

// Main build endpoint
app.post('/build', auth, async (req, res) => {
  const { ideaId, jobType } = req.body
  if (!ideaId || !jobType) return res.status(400).json({ error: 'Missing ideaId or jobType' })

  // Acknowledge immediately — work happens async
  res.json({ accepted: true, ideaId, jobType })

  try {
    const { founderNotes, monetization, gameName, gameDescription } = req.body
    if (jobType === 'prototype') await buildPrototype(ideaId, { founderNotes, founderAvoid: req.body.founderAvoid, imageUrls: req.body.imageUrls, monetization })
    else if (jobType === 'revise_prototype') await revisePrototype(ideaId, { founderNotes, founderAvoid: req.body.founderAvoid, imageUrls: req.body.imageUrls, previousDeployUrl: req.body.previousDeployUrl })
    else if (jobType === 'patch_prototype') await patchPrototype(ideaId, { spec: founderNotes, previousDeployUrl: req.body.previousDeployUrl })
    else if (jobType === 'add_game') await addGame(ideaId, gameName, gameDescription)
    else console.warn(`[worker] Unknown jobType: ${jobType}`)
  } catch (err) {
    const errMsg = err?.message || String(err)
    console.error(`[worker] Job failed for ${ideaId}:`, errMsg)
    await setStatus(ideaId, 'draft', null).catch(e => console.warn('[worker] Failed to reset status:', e.message))
    // Create a build_failed approval so the error is visible in the dashboard
    await createApproval({
      ideaId,
      stage: 'prototype',
      type: 'build_failed',
      summary: `Build failed: ${errMsg.slice(0, 200)}`,
      payload: { error: errMsg, jobType: req?.body?.jobType || 'unknown', timestamp: new Date().toISOString() },
    }).catch(() => {})
  }
})

// Auto-recover stuck builds on a schedule
app.post('/recover', auth, async (req, res) => {
  await recoverStuckBuilds()
  res.json({ ok: true })
})

// Run recovery on startup and every 10 minutes
recoverStuckBuilds().catch(() => {})
setInterval(() => recoverStuckBuilds().catch(() => {}), 10 * 60 * 1000)

async function buildFromTemplate(ideaId, { founderNotes, founderAvoid, imageUrls, monetization, isRevision = false } = {}) {
  const label = isRevision ? 'revise' : 'prototype'
  console.log(`[${label}] Starting for idea ${ideaId}`)

  const [idea, brief] = await Promise.all([getIdea(ideaId), getBrief(ideaId)])
  if (!idea) throw new Error('Idea not found')

  await setStatus(ideaId, 'building')

  // 1. Detect which template to use based on idea type
  const templateId = detectTemplate(brief, founderNotes, idea.name)
  console.log(`[${label}] Using template: ${templateId}`)
  if (founderNotes) console.log(`[${label}] Founder notes: ${founderNotes.slice(0, 100)}`)

  // 2. Generate content JSON for the chosen template (short, reliable — no HTML syntax risk)
  console.log(`[${label}] Generating content JSON...`)
  let appData
  if (templateId === TEMPLATE_IDS.QUIZ_EXPLORER) {
    appData = await generateQuizExplorerContent({ name: idea.name, brief, founderNotes, founderAvoid, imageUrls })
  } else {
    appData = await generateLandingPageContent({ name: idea.name, brief, founderNotes, founderAvoid })
  }
  console.log(`[${label}] Content generated: ${appData.careers?.length || 0} careers, ${appData.categories?.length || 0} categories`)

  // 3. Apply template (pre-validated HTML + JS, just inject data)
  console.log(`[${label}] Applying template...`)
  const html = applyTemplate(templateId, appData)

  // 4. Validate generated HTML (JS syntax check via Node.js)
  console.log(`[${label}] Validating HTML...`)
  const validation = validateHTML(html)
  if (!validation.valid) {
    throw new Error(`HTML validation failed: ${validation.errors.join('; ')}`)
  }
  console.log(`[${label}] Validation passed`)

  const files = [
    { path: 'index.html', content: html },
    { path: 'vercel.json', content: JSON.stringify({ buildCommand: '', outputDirectory: '.' }, null, 2) },
  ]

  // 5. Create/update GitHub repo
  console.log(`[${label}] Creating/updating GitHub repo: ${idea.slug}`)
  await createRepo(idea.slug, idea.one_liner || idea.name)
  await pushFiles(idea.slug, files)
  const githubUrl = repoUrl(idea.slug)
  console.log(`[${label}] Pushed: ${githubUrl}`)

  // 6. Enable GitHub Pages and wait for it to be live
  console.log(`[${label}] Enabling GitHub Pages...`)
  const deployUrl = await enableGitHubPages(idea.slug)
  console.log(`[${label}] Live at: ${deployUrl}`)

  // 7. Create approval
  const summary = isRevision
    ? `"${idea.name}" revised prototype is live. Review and approve to advance, or request further changes.`
    : `"${idea.name}" prototype is live and ready for review.`

  await createApproval({
    ideaId,
    stage: 'prototype',
    type: 'prototype',
    summary,
    payload: { deployUrl, githubUrl, templateId, isRevision },
  })

  await setStatus(ideaId, 'in_review', null)
  console.log(`[${label}] Done for "${idea.name}" — ${deployUrl}`)
}

async function patchPrototype(ideaId, { spec, previousDeployUrl } = {}) {
  console.log(`[patch] Starting for idea ${ideaId}`)
  if (!spec) throw new Error('No spec provided for patch_prototype job')

  const idea = await getIdea(ideaId)
  if (!idea) throw new Error('Idea not found')

  await setStatus(ideaId, 'building')
  console.log(`[patch] Spec: ${spec.slice(0, 100)}`)

  // Read current file from GitHub
  console.log(`[patch] Reading current index.html from ${idea.slug}...`)
  const { content: currentHtml, sha } = await readFile(idea.slug, 'index.html')
  console.log(`[patch] Read ${currentHtml.length} chars`)

  // Generate and apply patches
  const { html: patchedHtml, changed } = await patchAndValidate(currentHtml, spec)

  if (!changed) {
    console.log('[patch] No changes needed — spec already implemented')
    const deployUrl = previousDeployUrl || `https://${(process.env.GITHUB_USERNAME || 'crapes18').toLowerCase()}.github.io/${idea.slug}`
    await createApproval({
      ideaId,
      stage: 'prototype',
      type: 'prototype',
      summary: `"${idea.name}" — the requested changes are already implemented in the current prototype.`,
      payload: { deployUrl, githubUrl: repoUrl(idea.slug), alreadyImplemented: true },
    })
    await setStatus(ideaId, 'in_review', null)
    return
  }

  // Push patched file
  console.log('[patch] Pushing patched file to GitHub...')
  const commitMsg = `fix: ${spec.slice(0, 60).replace(/\n/g, ' ')}`
  await import('./lib/github.js').then(gh =>
    gh.updateFile(idea.slug, 'index.html', patchedHtml, sha, commitMsg)
  )
  console.log('[patch] Pushed')

  // Wait for GitHub Pages
  const deployUrl = await enableGitHubPages(idea.slug)
  console.log(`[patch] Live at: ${deployUrl}`)

  await createApproval({
    ideaId,
    stage: 'prototype',
    type: 'prototype',
    summary: `"${idea.name}" prototype updated. Review the changes and approve to advance, or request further changes.`,
    payload: { deployUrl, githubUrl: repoUrl(idea.slug), isPatch: true },
  })

  await setStatus(ideaId, 'in_review', null)
  console.log(`[patch] Done for "${idea.name}"`)
}

async function buildPrototype(ideaId, opts = {}) {
  return buildFromTemplate(ideaId, { ...opts, isRevision: false })
}

async function revisePrototype(ideaId, opts = {}) {
  return buildFromTemplate(ideaId, { ...opts, isRevision: true })
}

async function addGame(ideaId, gameName, gameDescription) {
  console.log(`[add_game] Starting for game: ${gameName}`)
  await setStatus(ideaId, 'building')

  // 1. Generate game data with Claude
  const gameData = await generateGameData(gameName, gameDescription)

  // 2. Read current games.ts from GitHub
  console.log(`[add_game] Reading games.ts from ${ROG_REPO}...`)
  const { content: gamesTs, sha } = await readFile(ROG_REPO, 'lib/games.ts')

  // Check for duplicate — if slug already exists, skip insert and go straight to release notes
  if (gamesTs.includes(`slug: '${gameData.slug}'`) || gamesTs.includes(`slug: "${gameData.slug}"`)) {
    console.log(`[add_game] "${gameData.name}" already exists in games.ts — skipping insert`)
    const deployUrl = process.env.ROG_VERCEL_URL || `https://${process.env.GITHUB_USERNAME || 'crapes18'}.github.io/${ROG_REPO}`
    const release = await generateReleaseNotes(gameName, '0.1.2')
    await createApproval({
      ideaId,
      stage: 'live',
      type: 'release_ready',
      summary: `"${gameName}" is already in the app and deployed. Review the live app, then mark as shipped.`,
      payload: { gameName, deployUrl, githubUrl: `https://github.com/${process.env.GITHUB_USERNAME || 'Crapes18'}/${ROG_REPO}`, releaseNotes: release.releaseNotes, testChecklist: release.testChecklist, versionBump: release.version },
    })
    await setStatus(ideaId, 'in_review', null)
    console.log(`[add_game] Duplicate handled for "${gameName}"`)
    return
  }

  // 3. Read package.json for current version
  const { content: pkgJson, sha: pkgSha } = await readFile(ROG_REPO, 'package.json')
  const pkg = JSON.parse(pkgJson)
  const currentVersion = pkg.version || '1.0.0'

  // 4. Insert new game into games array (before the closing bracket)
  const gameEntry = `  {
    slug: '${gameData.slug}',
    name: '${gameData.name}',
    category: '${gameData.category}',
    players: '${gameData.players}',
    duration: '${gameData.duration}',
    description: '${gameData.description.replace(/'/g, "\\'")}',
    quickRef: [
${gameData.quickRef.map(r => `      '${r.replace(/'/g, "\\'")}'`).join(',\n')}
    ],
    rules: [
${gameData.rules.map(r => `      { title: '${r.title.replace(/'/g, "\\'")}', body: '${r.body.replace(/'/g, "\\'")}' }`).join(',\n')}
    ],
    tools: [${gameData.tools.map(t => `'${t}'`).join(', ')}],
  },`

  // Find the closing of the games array and insert before it
  const insertMarker = '\n]\n\nexport function getGame'
  if (!gamesTs.includes(insertMarker)) {
    throw new Error('Could not find insertion point in games.ts')
  }
  const updatedGamesTs = gamesTs.replace(insertMarker, `\n${gameEntry}${insertMarker}`)

  // 5. Bump version in package.json
  const [major, minor, patch] = currentVersion.split('.').map(Number)
  const newVersion = `${major}.${minor}.${patch + 1}`
  const updatedPkg = JSON.stringify({ ...pkg, version: newVersion }, null, 2) + '\n'

  // 6. Commit both files
  console.log(`[add_game] Committing ${gameName} to GitHub (v${newVersion})...`)
  await updateFile(ROG_REPO, 'lib/games.ts', updatedGamesTs, sha, `feat: add ${gameName} rules`)
  const { content: _, sha: newPkgSha } = await readFile(ROG_REPO, 'package.json')
  await updateFile(ROG_REPO, 'package.json', updatedPkg, newPkgSha, `chore: bump version to ${newVersion}`)

  // 7. Wait for Vercel to deploy
  console.log(`[add_game] Waiting for Vercel deploy...`)
  const deployUrl = await getDeploymentUrl(ROG_VERCEL_PROJECT)
  console.log(`[add_game] Deployed: ${deployUrl}`)

  // 8. Generate release notes
  console.log(`[add_game] Generating release notes...`)
  const release = await generateReleaseNotes(gameName, currentVersion)

  // 9. Create release_ready approval
  await createApproval({
    ideaId,
    stage: 'live',
    type: 'release_ready',
    summary: `"${gameName}" has been added and deployed. Review the release notes, test the live app, then mark as shipped.`,
    payload: {
      gameName,
      deployUrl,
      githubUrl: `https://github.com/Crapes18/${ROG_REPO}`,
      releaseNotes: release.releaseNotes,
      testChecklist: release.testChecklist,
      versionBump: release.version,
    },
  })

  console.log(`[add_game] Done — ${gameName} is live at ${deployUrl}`)
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`[worker] Listening on port ${PORT}`))
