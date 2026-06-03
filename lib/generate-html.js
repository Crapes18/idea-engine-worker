import Anthropic from '@anthropic-ai/sdk'

function anthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

const BUILD_SYSTEM = `You are an expert frontend developer who builds complete, production-quality web applications.

Rules:
- Return ONLY the complete HTML file — nothing before <!DOCTYPE html> or after </html>
- Fully self-contained — all CSS and JS inline
- External: Google Fonts, PDF.js CDN only when needed
- No placeholder code, no TODO comments, no "coming soon" text
- Every button must do something real
- Use localStorage for all data persistence
- Mobile responsive with touch-friendly tap targets`

const LOCATE_SYSTEM = `You identify which line ranges in an HTML file need to change to implement a spec.
Return ONLY a valid JSON array. No explanation, no markdown, nothing else.
Format: [{"start": N, "end": N, "what": "brief description of the change"}]
Line numbers are 1-based. Ranges are inclusive.`

const REPLACE_SYSTEM = `You replace a section of source code to implement a spec change.
Return ONLY the replacement lines — no explanation, no markdown, no line numbers.
The output will be spliced directly into the source file.`

const DESIGN_SYSTEM = `
DESIGN SYSTEM:
Background #FFFFFF, cards/inputs #F8F8F6, hover #F2F1EE
Text: #1A1A1A primary, #6B6B6B secondary, #A0A0A0 placeholder. Border: #E8E8E4
Buttons: #1A1A1A bg, white text, 8px radius. Font: Geist from Google Fonts, fallback system-ui
Spacing: multiples of 8px only`

function isFullRebuild(spec) {
  if (!spec) return false
  const lower = spec.toLowerCase()
  return lower.includes('rebuild') || lower.includes('redesign') ||
         lower.includes('start over') || lower.includes('from scratch') ||
         lower.includes('completely new') || lower.includes('entire app') ||
         lower.includes('whole app')
}

async function streamClaude(system, userMessage, maxTokens) {
  const stream = anthropic().messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: userMessage }],
  })
  const response = await stream.finalMessage()
  if (response.stop_reason === 'max_tokens') {
    throw new Error(`Claude response truncated at ${maxTokens} tokens — try a more focused spec`)
  }
  return response.content.filter(b => b.type === 'text').map(b => b.text).join('')
}

// ── Two-pass line-number patch ────────────────────────────────────────────────
async function twoPassPatch(html, spec) {
  const lines = html.split('\n')
  const numbered = lines.map((l, i) => `${i + 1}: ${l}`).join('\n')

  // Pass 1 — locate which line ranges need to change
  console.log('[patch] Pass 1: locating line ranges...')
  const locateResponse = await streamClaude(
    LOCATE_SYSTEM,
    `Spec to implement:\n${spec}\n\nHTML with line numbers:\n${numbered}`,
    2000
  )

  let ranges
  try {
    const match = locateResponse.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('No JSON array found')
    ranges = JSON.parse(match[0])
    if (!Array.isArray(ranges) || ranges.length === 0) throw new Error('Empty ranges')
  } catch (e) {
    throw new Error(`Pass 1 failed — could not parse line ranges: ${e.message}. Got: ${locateResponse.slice(0, 200)}`)
  }

  console.log(`[patch] Pass 1 found ${ranges.length} range(s):`, ranges.map(r => `${r.start}-${r.end} (${r.what})`).join(', '))

  // If any range is very large, fall back to full generation — patch won't help
  const maxRange = Math.max(...ranges.map(r => r.end - r.start))
  if (maxRange > 200) {
    console.log(`[patch] Range too large (${maxRange} lines) — falling back to full generation`)
    throw new Error('FALLBACK_TO_FULL_GENERATION')
  }

  // Sort ranges in reverse so splicing doesn't shift subsequent indices
  ranges.sort((a, b) => b.start - a.start)

  // Pass 2 — replace each range
  const result = [...lines]
  for (const range of ranges) {
    const start = Math.max(1, range.start)
    const end = Math.min(lines.length, range.end)
    const chunk = lines.slice(start - 1, end).join('\n')

    console.log(`[patch] Pass 2: replacing lines ${start}-${end} (${range.what})`)
    const replacement = await streamClaude(
      REPLACE_SYSTEM,
      `Implement this change: ${spec}\n\nCurrent lines ${start}-${end}:\n${chunk}\n\nReturn only the replacement lines.`,
      16000
    )

    result.splice(start - 1, end - start + 1, ...replacement.split('\n'))
    console.log(`[patch] Replaced lines ${start}-${end} with ${replacement.split('\n').length} lines`)
  }

  return result.join('\n')
}

// ── Full generation ────────────────────────────────────────────────────────────
async function fullGeneration(idea, brief, founderNotes, founderAvoid) {
  const context = [
    brief?.target_customer ? `Target user: ${brief.target_customer}` : null,
    brief?.mvp_scope       ? `MVP scope: ${brief.mvp_scope}` : null,
    founderNotes           ? `\nBUILD SPEC:\n${founderNotes}` : null,
    founderAvoid           ? `\nDo NOT include: ${founderAvoid}` : null,
  ].filter(Boolean).join('\n')

  const text = await streamClaude(
    BUILD_SYSTEM,
    `Build a complete web app called "${idea.name}".\n\n${context}\n${DESIGN_SYSTEM}\n\nReturn the complete HTML file with every feature fully implemented.`,
    32000
  )

  const fenceMatch = text.match(/```(?:html)?\s*(<!DOCTYPE html>[\s\S]*<\/html>)\s*```/i)
  if (fenceMatch) return fenceMatch[1]

  const htmlMatch = text.match(/<!DOCTYPE html>[\s\S]*<\/html>/i)
  if (!htmlMatch) throw new Error('Claude did not return a valid HTML document. Got: ' + text.slice(0, 300))

  return htmlMatch[0]
}

// ── Main export ────────────────────────────────────────────────────────────────
export async function generateHtmlWithClaude({ idea, brief, founderNotes, founderAvoid, currentHtml }) {
  // Revision with existing HTML — use two-pass patch unless it's a full rebuild
  if (currentHtml && !isFullRebuild(founderNotes)) {
    console.log('[generate] Revision mode — using two-pass line-number patch')
    try {
      return await twoPassPatch(currentHtml, founderNotes || '')
    } catch (e) {
      if (e.message === 'FALLBACK_TO_FULL_GENERATION') {
        console.log('[generate] Patch too large — falling back to full generation with current HTML as base')
      } else {
        console.warn('[generate] Patch failed, falling back to full generation:', e.message)
      }
      // Fall through to full generation below
    }
  }

  // First build, explicit rebuild, or patch fallback — full generation
  console.log('[generate] Full generation mode')
  return fullGeneration(idea, brief, founderNotes, founderAvoid)
}
