import Anthropic from '@anthropic-ai/sdk'

function anthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

const SYSTEM_PROMPT = `You are an expert frontend developer who builds complete, production-quality web applications.

Rules:
- Return ONLY the complete HTML file — nothing before <!DOCTYPE html> or after </html>
- The file must be fully self-contained (all CSS and JS inline)
- External resources allowed: Google Fonts, PDF.js CDN, other CDN libraries when genuinely needed
- No placeholder code, no TODO comments, no "coming soon" text, no hardcoded lorem ipsum
- Every button must do something real — no dead UI
- Use localStorage for all data persistence
- Write clean readable JavaScript — no minification
- The app must work on mobile (responsive, touch-friendly tap targets)
- Build the complete app — not a mockup`

const DESIGN_SYSTEM = `
DESIGN SYSTEM — follow exactly:
Colors:
  Background: #FFFFFF (main surface), #F8F8F6 (cards, inputs, sidebar), #F2F1EE (hover states)
  Text: #1A1A1A (primary), #6B6B6B (secondary/meta), #A0A0A0 (placeholder/disabled)
  Border: #E8E8E4 (all borders and dividers)
  Accent: #1A1A1A (primary buttons, active states) / hover: #333333
  Success: #2D7D52 | Warning: #B87D2A | Danger: #C0392B | Info: #2B6CB0

Typography:
  Font: 'Geist' from Google Fonts (weights 300;400;500;600), fallback system-ui
  Headings: font-weight 500, letter-spacing -0.01em to -0.02em
  Body: 14px / weight 400 / line-height 1.6
  Labels: 11px / weight 500 / letter-spacing 0.06em / uppercase

Spacing: 8px grid — use 4, 8, 16, 24, 32, 48, 64px only

Components:
  Buttons — Primary: #1A1A1A bg, white text, 8px radius, 12px 20px padding, 14px/500
             Secondary: white bg, #E8E8E4 border, #1A1A1A text, same sizing
             No shadows. Hover: #333333. Active: scale(0.98)
  Cards — white bg, 1px solid #E8E8E4 border, 12px radius, 24px padding
          Elevated: add box-shadow 0 4px 24px rgba(0,0,0,0.06)
  Inputs — #F8F8F6 bg, 1px solid #E8E8E4 border, 8px radius, 10px 14px padding, 14px/#1A1A1A
           Focus: border-color #1A1A1A (no glow/ring)
  No gradients. No decorative shadows. No rounded corners > 12px on cards.`

export async function generateHtmlWithClaude({ idea, brief, founderNotes, founderAvoid, currentHtml }) {
  const context = [
    brief?.target_customer ? `Target user: ${brief.target_customer}` : null,
    brief?.mvp_scope       ? `MVP scope: ${brief.mvp_scope}` : null,
    founderNotes           ? `\nBUILD SPEC — implement every item exactly:\n${founderNotes}` : null,
    founderAvoid           ? `\nDo NOT include: ${founderAvoid}` : null,
  ].filter(Boolean).join('\n')

  let userMessage
  if (currentHtml) {
    userMessage = `Update this existing web app according to the build spec.

APP NAME: ${idea.name}
${context}

CURRENT HTML (update this — implement ALL spec items, preserve all existing working features unless the spec explicitly removes them):

${currentHtml}

Return the complete updated HTML file. Do not truncate. Implement every spec item fully.`
  } else {
    userMessage = `Build a complete web app called "${idea.name}".

${context}
${DESIGN_SYSTEM}

Return the complete HTML file. Build the full working app — every feature in the spec must be implemented and functional.`
  }

  const response = await anthropic().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  if (response.stop_reason === 'max_tokens') {
    throw new Error('HTML generation was truncated — spec may be too large for a single pass. Try splitting into smaller specs.')
  }

  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('')

  // Strip any markdown code fences if Claude wrapped the HTML
  const fenceMatch = text.match(/```(?:html)?\s*(<!DOCTYPE html>[\s\S]*<\/html>)\s*```/i)
  if (fenceMatch) return fenceMatch[1]

  const htmlMatch = text.match(/<!DOCTYPE html>[\s\S]*<\/html>/i)
  if (!htmlMatch) throw new Error('Claude did not return a valid HTML document. Got: ' + text.slice(0, 300))

  return htmlMatch[0]
}
