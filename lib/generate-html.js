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
- Mobile responsive with touch-friendly tap targets
- Build the complete app — not a mockup`

const PATCH_SYSTEM = `You apply targeted changes to HTML files. Return ONLY a series of patches in this exact format:

<<<FIND>>>
exact text to find (copy verbatim from the source)
<<<REPLACE>>>
replacement text
<<<END>>>

Rules:
- Each patch is a FIND/REPLACE/END block
- FIND must match exactly — copy character-for-character from the source HTML
- Make minimal changes — only what the spec requires
- Multiple patches allowed, one block each
- Return NOTHING else — no explanation, no markdown, no commentary`

const DESIGN_SYSTEM = `
DESIGN SYSTEM:
Background #FFFFFF, cards/inputs #F8F8F6, hover #F2F1EE
Text: #1A1A1A primary, #6B6B6B secondary, #A0A0A0 placeholder. Border: #E8E8E4
Buttons: #1A1A1A bg, white text, 8px radius. Cards: white bg, 1px solid #E8E8E4, 12px radius
Inputs: #F8F8F6 bg, 1px solid #E8E8E4, 8px radius. Font: Geist from Google Fonts, fallback system-ui
Spacing: multiples of 8px only`

// Detect if spec requires a full rebuild vs targeted patch
function isFullRebuild(spec) {
  if (!spec) return false
  const lower = spec.toLowerCase()
  return lower.includes('rebuild') || lower.includes('redesign') ||
         lower.includes('start over') || lower.includes('from scratch') ||
         lower.includes('completely') || lower.includes('entire app') ||
         lower.includes('whole app') || lower.includes('new design')
}

async function callClaude(systemPrompt, userMessage, maxTokens) {
  const stream = anthropic().messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })
  const response = await stream.finalMessage()
  if (response.stop_reason === 'max_tokens') {
    throw new Error('Generation was truncated — try a more focused spec')
  }
  return response.content.filter(b => b.type === 'text').map(b => b.text).join('')
}

function applyPatches(html, patchText) {
  const patchRegex = /<<<FIND>>>([\s\S]*?)<<<REPLACE>>>([\s\S]*?)<<<END>>>/g
  let result = html
  let count = 0
  let match
  while ((match = patchRegex.exec(patchText)) !== null) {
    const find = match[1].trim()
    const replace = match[2].trim()
    if (result.includes(find)) {
      result = result.replace(find, replace)
      count++
    } else {
      console.warn('[patcher] Could not find text:', find.slice(0, 80))
    }
  }
  if (count === 0) {
    throw new Error('No patches could be applied — text not found. Try rephrasing the request.')
  }
  console.log(`[patcher] Applied ${count} patch(es)`)
  return result
}

export async function generateHtmlWithClaude({ idea, brief, founderNotes, founderAvoid, currentHtml }) {
  const context = [
    brief?.target_customer ? `Target user: ${brief.target_customer}` : null,
    brief?.mvp_scope       ? `MVP scope: ${brief.mvp_scope}` : null,
    founderNotes           ? `\nCHANGES REQUESTED:\n${founderNotes}` : null,
    founderAvoid           ? `\nDo NOT include: ${founderAvoid}` : null,
  ].filter(Boolean).join('\n')

  // PATCH MODE — fast targeted changes to existing HTML
  if (currentHtml && !isFullRebuild(founderNotes)) {
    console.log('[generate] Using patch mode for revision')
    const patchPrompt = `Apply these changes to the web app:\n\n${context}\n\nCURRENT HTML:\n${currentHtml}`
    const patchText = await callClaude(PATCH_SYSTEM, patchPrompt, 4000)
    return applyPatches(currentHtml, patchText)
  }

  // FULL GENERATION MODE — first build or explicit rebuild
  console.log('[generate] Using full generation mode')
  const buildPrompt = currentHtml
    ? `Rebuild this web app from scratch with the following changes:\n\nAPP: ${idea.name}\n${context}\n${DESIGN_SYSTEM}\n\nReturn the complete HTML file.`
    : `Build a complete web app called "${idea.name}".\n\n${context}\n${DESIGN_SYSTEM}\n\nReturn the complete HTML file with every feature fully implemented.`

  const text = await callClaude(BUILD_SYSTEM, buildPrompt, 32000)

  const fenceMatch = text.match(/```(?:html)?\s*(<!DOCTYPE html>[\s\S]*<\/html>)\s*```/i)
  if (fenceMatch) return fenceMatch[1]

  const htmlMatch = text.match(/<!DOCTYPE html>[\s\S]*<\/html>/i)
  if (!htmlMatch) throw new Error('Claude did not return a valid HTML document. Got: ' + text.slice(0, 300))

  return htmlMatch[0]
}
