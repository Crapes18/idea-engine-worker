import { createClient } from '@supabase/supabase-js'

function client() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
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

export async function setStatus(ideaId, status) {
  const { error } = await client().from('ideas').update({ status }).eq('id', ideaId)
  if (error) throw new Error(`setStatus failed: ${error.message}`)
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
