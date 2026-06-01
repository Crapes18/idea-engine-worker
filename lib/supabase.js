import { createClient } from '@supabase/supabase-js'

function client() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function getIdea(ideaId) {
  const { data } = await client().from('ideas').select('*').eq('id', ideaId).single()
  return data
}

export async function getBrief(ideaId) {
  const { data } = await client()
    .from('briefs')
    .select('*')
    .eq('idea_id', ideaId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data
}

export async function setStatus(ideaId, status) {
  await client().from('ideas').update({ status }).eq('id', ideaId)
}

export async function setStageAndStatus(ideaId, stage, status) {
  await client().from('ideas').update({ stage, status }).eq('id', ideaId)
}

export async function createApproval({ ideaId, stage, type, summary, payload }) {
  const { data } = await client().from('approvals').insert({
    idea_id: ideaId,
    stage,
    type,
    summary,
    payload: payload ?? null,
    status: 'pending',
  }).select().single()
  return data
}
