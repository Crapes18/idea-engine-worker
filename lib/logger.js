import { createClient } from '@supabase/supabase-js'

function supabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

async function write(ideaId, jobType, ideaName, step, status, message, errorDetail) {
  // Always log to console first — this can never fail
  const prefix = `[${jobType || 'worker'}][${step}]`
  if (status === 'error') {
    console.error(prefix, message, errorDetail ? '\n' + errorDetail.slice(0, 500) : '')
  } else {
    console.log(prefix, message)
  }

  // Then write to Supabase — wrap entirely so a DB failure never breaks jobs
  try {
    const client = supabase()
    if (!client) return
    await client.from('worker_logs').insert({
      idea_id:      ideaId  || null,
      job_type:     jobType || null,
      idea_name:    ideaName || null,
      step:         step,
      status:       status,
      message:      message?.slice(0, 500) || '',
      error_detail: errorDetail?.slice(0, 2000) || null,
    })
  } catch (e) {
    // Log DB failures to console only — never re-throw
    console.warn('[logger] DB write failed:', e.message)
  }
}

export function log(ideaId, jobType, ideaName, step, message) {
  return write(ideaId, jobType, ideaName, step, 'step', message, null)
}

export function logSuccess(ideaId, jobType, ideaName, message) {
  return write(ideaId, jobType, ideaName, 'done', 'success', message, null)
}

export function logError(ideaId, jobType, ideaName, step, error) {
  const message = error?.message || String(error)
  const detail  = error?.stack  || message
  return write(ideaId, jobType, ideaName, step, 'error', message, detail)
}
