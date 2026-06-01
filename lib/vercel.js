const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID // optional
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'Crapes18'

function headers() {
  return {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

export async function createProject(slug, description) {
  const url = VERCEL_TEAM_ID
    ? `https://api.vercel.com/v10/projects?teamId=${VERCEL_TEAM_ID}`
    : 'https://api.vercel.com/v10/projects'

  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      name: slug,
      framework: null,
      gitRepository: {
        type: 'github',
        repo: `${GITHUB_USERNAME}/${slug}`,
      },
      environmentVariables: [
        { key: 'NEXT_PUBLIC_SUPABASE_URL',      value: process.env.SUPABASE_URL,              target: ['production', 'preview', 'development'], type: 'plain' },
        { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.SUPABASE_ANON_KEY,         target: ['production', 'preview', 'development'], type: 'plain' },
        { key: 'ANTHROPIC_API_KEY',             value: process.env.ANTHROPIC_API_KEY,         target: ['production', 'preview', 'development'], type: 'encrypted' },
      ],
    }),
  })

  const data = await res.json()
  if (data.error) {
    // Project may already exist
    if (data.error.code === 'project_already_exists') return { name: slug }
    throw new Error(`Vercel createProject: ${data.error.message}`)
  }
  return data
}

export async function triggerAndWaitForDeploy(slug) {
  // Trigger deploy via deploy hook if configured
  const hookUrl = process.env.ROG_VERCEL_DEPLOY_HOOK
  if (hookUrl) {
    console.log(`[vercel] Triggering deploy hook for ${slug}...`)
    await fetch(hookUrl, { method: 'POST' })
  } else {
    console.log(`[vercel] No deploy hook set — deployment must be triggered manually`)
  }

  // Use known static URL if no hook configured — deployment is async
  const staticUrl = process.env.ROG_VERCEL_URL
  if (staticUrl) {
    // Wait a short moment then return the known URL
    await new Promise(r => setTimeout(r, 5000))
    return staticUrl
  }

  // Fall back to polling
  const url = VERCEL_TEAM_ID
    ? `https://api.vercel.com/v6/deployments?app=${slug}&teamId=${VERCEL_TEAM_ID}&limit=1&target=production`
    : `https://api.vercel.com/v6/deployments?app=${slug}&limit=5`

  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 10000))
    const res = await fetch(url, { headers: headers() })
    const data = await res.json()
    const deployment = data.deployments?.[0]
    if (deployment?.state === 'READY') return `https://${deployment.url}`
    if (deployment?.state === 'ERROR') throw new Error('Vercel deployment failed')
  }
  throw new Error('Vercel deployment timed out')
}
