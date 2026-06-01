import express from 'express'
import { generatePrototype } from './lib/generate.js'
import { createRepo, pushFiles, repoUrl } from './lib/github.js'
import { createProject, getDeploymentUrl } from './lib/vercel.js'
import {
  getIdea, getBrief, setStatus, createApproval
} from './lib/supabase.js'

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
  const deployUrl = await getDeploymentUrl(idea.slug)
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

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`[worker] Listening on port ${PORT}`))
