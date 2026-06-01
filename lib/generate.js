import Anthropic from '@anthropic-ai/sdk'

function anthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

const DESIGN_SYSTEM = `
## Design System (follow exactly)

Colors:
- Background: #FFFFFF (primary), #F8F8F6 (secondary), #F2F1EE (tertiary)
- Text: #1A1A1A (primary), #6B6B6B (secondary), #A0A0A0 (tertiary)
- Border: #E8E8E4
- Accent: #1A1A1A (black buttons), hover: #333333
- Success: #2D7D52, Warning: #B87D2A, Danger: #C0392B

Typography:
- Font: Geist (from Google Fonts), fallback system-ui
- Headings: weight 500, letter-spacing -0.02em
- Body: 14px, weight 400, line-height 1.6

Components:
- Buttons: black bg, white text, 8px radius, 12px 20px padding. Secondary: white bg, border #E8E8E4
- Cards: white bg, 1px solid #E8E8E4, 12px radius, 24px padding
- Inputs: #F8F8F6 bg, 1px solid #E8E8E4, 8px radius, focus border #1A1A1A
- No shadows on regular elements. Spacing on 8px grid.
- Mobile-first, responsive.
`

const SYSTEM_PROMPT = `You are an expert Next.js developer. You generate complete, working Next.js 14 (App Router) applications. You write clean, production-quality code. You follow the design system provided exactly. You always return a JSON array of files — each file has a "path" (relative to project root) and "content" (the full file content as a string). No placeholders, no TODOs — every file must be complete and functional.`

export async function generatePrototype({ name, slug, oneLiner, brief }) {
  const prompt = `Build a complete Next.js 14 (App Router) prototype for this idea:

Name: ${name}
Description: ${oneLiner || ''}

Brief:
- Target customer: ${brief?.target_customer || ''}
- MVP scope: ${brief?.mvp_scope || ''}
- Monetization: ${brief?.monetization_model || ''}

${DESIGN_SYSTEM}

Tech stack:
- Next.js 14 App Router with TypeScript
- Tailwind CSS
- Lucide React for icons
- No database — use static/hardcoded data for the prototype

Requirements:
- Mobile-responsive, clean, minimal design following the design system above
- At least 3 pages/views that demonstrate the core value proposition
- Working navigation between pages
- No auth required

Return a JSON array of files. Be concise — minimal working code only, no comments, no extra whitespace. Include exactly:
- package.json (dependencies only, no scripts bloat)
- next.config.js (minimal)
- app/layout.tsx
- app/globals.css (import Geist font + CSS variables only)
- app/page.tsx (home page)
- Up to 3 additional page or component files maximum

Format: [{"path": "app/page.tsx", "content": "..."}, ...]

Return ONLY the JSON array, no markdown, no explanation.`

  const messages = [{ role: 'user', content: prompt }]
  let result = ''

  console.log('[generate] Calling Claude API (streaming)...')
  const stream = anthropic().messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
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
    throw new Error('Response truncated at max_tokens — reduce prompt scope')
  }

  if (!result) throw new Error('No response from code generator')

  // Extract JSON array from response
  const match = result.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('No file array in generator response')

  const files = JSON.parse(match[0])
  if (!Array.isArray(files) || files.length === 0) throw new Error('Empty file list')

  return files
}
