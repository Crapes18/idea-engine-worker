import Anthropic from '@anthropic-ai/sdk'

function anthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

const SYSTEM_PROMPT = `You generate minimal Next.js prototypes as JSON file arrays. Every file must be complete and functional. No comments. No extra whitespace. Concise code only. Return ONLY a raw JSON array — no markdown, no explanation, nothing else.`

export async function generatePrototype({ name, slug, oneLiner, brief }) {
  const prompt = `Generate a minimal Next.js 14 App Router prototype for: "${name}" — ${oneLiner || ''}

MVP: ${brief?.mvp_scope || 'Show the core concept'}

Rules:
- Use inline styles only (no Tailwind, no config files needed)
- Static hardcoded data, no database
- White background, #1A1A1A text, clean minimal design
- Geist font from Google Fonts in layout

Return EXACTLY these 4 files as a JSON array:
1. package.json — only these deps: next, react, react-dom, lucide-react. scripts: {"dev":"next dev","build":"next build","start":"next start"}
2. app/layout.tsx — imports Geist font, sets html/body styles
3. app/globals.css — just: * { box-sizing: border-box; margin: 0; padding: 0; }
4. app/page.tsx — the main page demonstrating the core value prop with real content (not placeholders)

Format: [{"path":"package.json","content":"..."},{"path":"app/layout.tsx","content":"..."},{"path":"app/globals.css","content":"..."},{"path":"app/page.tsx","content":"..."}]`

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
    throw new Error('Response truncated — reduce prompt scope')
  }

  if (!result) throw new Error('No response from code generator')

  const match = result.match(/\[[\s\S]*\]/)
  if (!match) throw new Error(`No JSON array in response. Got: ${result.slice(0, 200)}`)

  const files = JSON.parse(match[0])
  if (!Array.isArray(files) || files.length === 0) throw new Error('Empty file list')

  console.log(`[generate] Generated ${files.length} files: ${files.map(f => f.path).join(', ')}`)
  return files
}
