import express from 'express'
import { generatePrototype, generateGameData, generateReleaseNotes } from './lib/generate.js'
import { createRepo, pushFiles, repoUrl, readFile, updateFile } from './lib/github.js'
import { createProject, triggerAndWaitForDeploy } from './lib/vercel.js'
import {
  getIdea, getBrief, setStatus, createApproval
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
    if (jobType === 'prototype') await buildPrototype(ideaId)
    else if (jobType === 'add_game') await addGame(ideaId, req.body.gameName, req.body.gameDescription)
    else console.warn(`[worker] Unknown jobType: ${jobType}`)
  } catch (err) {
    console.error(`[worker] Job failed for ${ideaId}:`, err)
    await setStatus(ideaId, 'draft').catch(() => {})
  }
})

async function buildPrototype(ideaId) {
  console.log(`[prototype] Starting for idea ${ideaId}`)

  const [idea, brief] = await Promise.all([getIdea(ideaId), getBrief(ideaId)])
  if (!idea) throw new Error('Idea not found')

  await setStatus(ideaId, 'building')

  // 1. Generate app files with Claude
  console.log(`[prototype] Generating files for "${idea.name}"...`)
  const files = await generatePrototype({
    name: idea.name,
    slug: idea.slug,
    oneLiner: idea.one_liner,
    brief,
  })
  console.log(`[prototype] Generated ${files.length} files`)

  // 2. Create GitHub repo
  console.log(`[prototype] Creating GitHub repo: ${idea.slug}`)
  await createRepo(idea.slug, idea.one_liner || idea.name)

  // 3. Push files
  console.log(`[prototype] Pushing files to GitHub...`)
  await pushFiles(idea.slug, files)
  const githubUrl = repoUrl(idea.slug)
  console.log(`[prototype] Pushed: ${githubUrl}`)

  // 4. Create Vercel project linked to GitHub repo
  console.log(`[prototype] Creating Vercel project...`)
  await createProject(idea.slug, idea.one_liner || idea.name)

  // 5. Wait for Vercel to deploy
  console.log(`[prototype] Waiting for Vercel deployment...`)
  const deployUrl = await triggerAndWaitForDeploy(idea.slug)
  console.log(`[prototype] Deployed: ${deployUrl}`)

  // 6. Create approval in dashboard
  await createApproval({
    ideaId,
    stage: 'prototype',
    type: 'prototype',
    summary: `"${idea.name}" prototype is live and ready for review. ${deployUrl}`,
    payload: { deployUrl, githubUrl, fileCount: files.length },
  })

  await setStatus(ideaId, 'in_review')
  console.log(`[prototype] Done for "${idea.name}" — ${deployUrl}`)
}

async function addGame(ideaId, gameName, gameDescription) {
  console.log(`[add_game] Starting for game: ${gameName}`)
  await setStatus(ideaId, 'building')

  // 1. Generate game data with Claude
  const gameData = await generateGameData(gameName, gameDescription)

  // 2. Read current games.ts from GitHub
  console.log(`[add_game] Reading games.ts from ${ROG_REPO}...`)
  const { content: gamesTs, sha } = await readFile(ROG_REPO, 'lib/games.ts')

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
