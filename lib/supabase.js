import { createClient } from '@supabase/supabase-js'

function client() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) throw new Error(`Missing Supabase env vars — URL: ${!!url}, KEY: ${!!key}`)
  return createClient(url, key)
}

export async function getIdea(ideaId) {
  const { data, error } = await client().from('ideas').select('*').eq('id', ideaId).single()
  if (error) throw new Error(`getIdea failed: ${error.message} (code: ${error.code})`)
  return data
}

export async function getBrief(ideaId) {
  const { data, error } = await client()
    .from('briefs')
    .select('*')
    .eq('idea_id', ideaId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  if (error && error.code !== 'PGRST116') throw new Error(`getBrief failed: ${error.message}`)
  return data
}

export async function setStatus(ideaId, status, buildingContext = null) {
  const update = { status }
  if (buildingContext !== undefined) update.building_context = buildingContext
  const { error } = await client().from('ideas').update(update).eq('id', ideaId)
  if (error) throw new Error(`setStatus failed: ${error.message}`)
}

export async function recoverStuckBuilds(retriggerFn = null) {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const { data, error } = await client()
    .from('ideas')
    .select('id, name, slug')
    .eq('status', 'building')
    .lt('updated_at', cutoff)
  if (error) { console.warn('[recover] Query failed:', error.message); return }

  for (const idea of (data ?? [])) {
    console.log(`[recover] Stuck build detected: "${idea.name}" (${idea.id})`)

    // Find the latest approved build_spec to re-trigger
    const { data: specs } = await client()
      .from('approvals')
      .select('summary, payload')
      .eq('idea_id', idea.id)
      .eq('type', 'build_spec')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)

    const spec = specs?.[0]
    if (spec && retriggerFn) {
      console.log(`[recover] Re-triggering build for "${idea.name}"`)
      // Always use revise_prototype for recovery — patch requires exact file context
      const jobType = 'revise_prototype'
      await client().from('ideas').update({
        status: 'building',
        building_context: `Auto-recovery re-trigger for ${idea.name}`
      }).eq('id', idea.id)
      retriggerFn(idea.id, jobType, spec.summary)
    } else {
      // No spec to re-trigger — just reset to draft
      console.log(`[recover] No spec found, resetting to draft: "${idea.name}"`)
      await client().from('ideas').update({ status: 'draft', building_context: null }).eq('id', idea.id)
    }
  }
  if (data?.length) console.log(`[recover] Handled ${data.length} stuck build(s)`)
}

export async function setStageAndStatus(ideaId, stage, status) {
  const { error } = await client().from('ideas').update({ stage, status }).eq('id', ideaId)
  if (error) throw new Error(`setStageAndStatus failed: ${error.message}`)
}

export async function createApproval({ ideaId, stage, type, summary, payload }) {
  const { data, error } = await client().from('approvals').insert({
    idea_id: ideaId,
    stage,
    type,
    summary,
    payload: payload ?? null,
    status: 'pending',
  }).select().single()
  if (error) throw new Error(`createApproval failed: ${error.message}`)
  return data
}
