import Anthropic from '@anthropic-ai/sdk'

function anthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

const SYSTEM_PROMPT = `You generate self-contained single-file HTML prototypes. Return ONLY a raw JSON array with exactly one file object. No markdown, no explanation, nothing else before or after the JSON array.`

export async function generatePrototype({ name, slug, oneLiner, brief }) {
  const prompt = `Generate a single self-contained index.html prototype for: "${name}" — ${oneLiner || ''}

MVP concept: ${brief?.mvp_scope || 'Demonstrate the core value proposition'}

Requirements:
- Single HTML file with all CSS and JS embedded
- Clean, white, minimal design (#1A1A1A text, #FFFFFF bg, #E8E8E4 borders)
- Geist font from Google Fonts
- Shows real representative content (not Lorem Ipsum)
- Interactive where appropriate (JS is fine)
- Mobile responsive

Return exactly this JSON array:
[{"path":"index.html","content":"<!DOCTYPE html>...complete html..."}]`

  const messages = [{ role: 'user', content: prompt }]
  let result = ''

  console.log('[generate] Calling Claude API (streaming)...')
  const stream = anthropic().messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages,
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
      result += event.delta.text
    }
  }

  const finalMsg = await stream.finalMessage()
  console.log(`[generate] Done: stop_reason=${finalMsg.stop_reason}, length=${result.length} chars`)

  if (finalMsg.stop_reason === 'max_tokens') {
    throw new Error('Response truncated at max_tokens')
  }

  if (!result) throw new Error('No response from code generator')

  const match = result.match(/\[[\s\S]*\]/)
  if (!match) throw new Error(`No JSON array found. Got: ${result.slice(0, 300)}`)

  const files = JSON.parse(match[0])
  if (!Array.isArray(files) || files.length === 0) throw new Error('Empty file list')

  // Add vercel.json so Vercel serves it as a static site
  files.push({
    path: 'vercel.json',
    content: JSON.stringify({ buildCommand: '', outputDirectory: '.' }, null, 2)
  })

  console.log(`[generate] Generated ${files.length} files: ${files.map(f => f.path).join(', ')}`)
  return files
}
