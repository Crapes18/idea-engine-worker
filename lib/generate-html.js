import Anthropic from '@anthropic-ai/sdk'

function anthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

// ── System prompts ────────────────────────────────────────────────────────────
const BUILD_SYSTEM = `You are an expert frontend developer who builds complete, production-quality web applications.
Return ONLY the complete HTML file — nothing before <!DOCTYPE html> or after </html>.
Fully self-contained (all CSS and JS inline). Mobile responsive. Every button works. Use localStorage for persistence.`

const SECTION_SYSTEM = `You update a section of an HTML file to implement a spec change.
Return ONLY the updated section content — no explanation, no markdown fences.
Preserve all existing functionality unless the spec explicitly removes it.`

const DESIGN_SYSTEM = `DESIGN SYSTEM:
Background #FFFFFF, cards/inputs #F8F8F6. Text: #1A1A1A primary, #6B6B6B secondary. Border: #E8E8E4
Buttons: #1A1A1A bg, white text, 8px radius. Font: Geist from Google Fonts, fallback system-ui. Spacing: 8px grid`

// ── Section extraction ────────────────────────────────────────────────────────
function extractSection(html, sectionName) {
  const patterns = {
    head: { open: /<head[^>]*>/i, close: /<\/head>/i },
    styles: { open: /<style[^>]*>/i, close: /<\/style>/i },
    body: { open: /<body[^>]*>/i, close: /<\/body>/i },
    javascript: { open: /<script[^>]*>/i, close: /<\/script>/i },
  }
  const p = patterns[sectionName]
  if (!p) return null
  const openMatch = html.match(p.open)
  const closeMatch = html.match(p.close)
  if (!openMatch || !closeMatch) return null
  const start = openMatch.index + openMatch[0].length
  const end = html.lastIndexOf(closeMatch[0].replace('/', '\\/').replace(/\\/g, ''))
  // Use a cleaner approach
  const openIdx = html.search(p.open)
  const openTag = html.match(p.open)[0]
  const closeTag = html.match(p.close)[0]
  const contentStart = openIdx + openTag.length
  const contentEnd = html.lastIndexOf(closeTag)
  if (contentEnd <= contentStart) return null
  return {
    before: html.slice(0, contentStart),
    content: html.slice(contentStart, contentEnd),
    after: html.slice(contentEnd),
  }
}

function replaceSection(html, sectionName, newContent) {
  const extracted = extractSection(html, sectionName)
  if (!extracted) return null
  return extracted.before + '\n' + newContent.trim() + '\n' + extracted.after
}

// ── Classify which sections a spec change touches ─────────────────────────────
function classifySections(spec) {
  const lower = spec.toLowerCase()
  const sections = []

  // CSS/visual changes → styles
  if (lower.includes('color') || lower.includes('font') || lower.includes('style') ||
      lower.includes('border') || lower.includes('padding') || lower.includes('margin') ||
      lower.includes('background') || lower.includes('size') || lower.includes('css') ||
      lower.includes('design') || lower.includes('layout') || lower.includes('spacing') ||
      lower.includes('shadow') || lower.includes('radius') || lower.includes('width') ||
      lower.includes('height') || lower.includes('theme') || lower.includes('dark mode')) {
    sections.push('styles')
  }

  // Font imports → head
  if (lower.includes('font') || lower.includes('import') || lower.includes('google') ||
      lower.includes('typeface')) {
    if (!sections.includes('head')) sections.push('head')
  }

  // HTML structure changes → body
  if (lower.includes('button') || lower.includes('screen') || lower.includes('page') ||
      lower.includes('section') || lower.includes('header') || lower.includes('footer') ||
      lower.includes('nav') || lower.includes('add ') || lower.includes('remove ') ||
      lower.includes('text') || lower.includes('label') || lower.includes('title') ||
      lower.includes('icon') || lower.includes('image') || lower.includes('link')) {
    if (!sections.includes('body')) sections.push('body')
  }

  // Behavior/logic changes → javascript
  if (lower.includes('click') || lower.includes('function') || lower.includes('logic') ||
      lower.includes('behavior') || lower.includes('animation') || lower.includes('feature') ||
      lower.includes('storage') || lower.includes('data') || lower.includes('save') ||
      lower.includes('load') || lower.includes('sort') || lower.includes('filter') ||
      lower.includes('search') || lower.includes('navigate') || lower.includes('modal')) {
    if (!sections.includes('javascript')) sections.push('javascript')
  }

  // Default to body if nothing matched
  if (sections.length === 0) sections.push('body')

  return sections
}

// ── Detect full rebuild ────────────────────────────────────────────────────────
function isFullRebuild(spec) {
  if (!spec) return false
  const lower = spec.toLowerCase()
  return lower.includes('rebuild') || lower.includes('redesign') ||
         lower.includes('start over') || lower.includes('from scratch') ||
         lower.includes('completely new') || lower.includes('entire app') ||
         lower.includes('whole app')
}

// ── Claude calls ──────────────────────────────────────────────────────────────
async function streamClaude(system, userMessage, maxTokens) {
  const stream = anthropic().messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: userMessage }],
  })
  const response = await stream.finalMessage()
  if (response.stop_reason === 'max_tokens') {
    throw new Error(`Response truncated at ${maxTokens} tokens — try a more focused spec`)
  }
  return response.content.filter(b => b.type === 'text').map(b => b.text).join('')
}

// ── Section-based revision ────────────────────────────────────────────────────
async function sectionRevision(html, spec) {
  const sections = classifySections(spec)
  console.log('[section] Detected sections to update:', sections.join(', '))

  let result = html

  for (const sectionName of sections) {
    const extracted = extractSection(result, sectionName)
    if (!extracted) {
      console.warn(`[section] Could not extract section: ${sectionName}`)
      continue
    }

    const currentContent = extracted.content
    console.log(`[section] Updating ${sectionName} section (${currentContent.length} chars)`)

    const updated = await streamClaude(
      SECTION_SYSTEM,
      `Update the ${sectionName} section of this web app to implement the following spec.\n\nSPEC: ${spec}\n\nCURRENT ${sectionName.toUpperCase()} SECTION:\n${currentContent}\n\nReturn only the updated ${sectionName} section content.`,
      16000
    )

    const newHtml = replaceSection(result, sectionName, updated)
    if (!newHtml) {
      console.warn(`[section] Could not splice section: ${sectionName}`)
      continue
    }
    result = newHtml
    console.log(`[section] ${sectionName} updated successfully`)
  }

  return result
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
    `Build a complete web app called "${idea.name}".\n\n${context}\n${DESIGN_SYSTEM}\n\nReturn the complete HTML file.`,
    32000
  )

  const fenceMatch = text.match(/```(?:html)?\s*(<!DOCTYPE html>[\s\S]*<\/html>)\s*```/i)
  if (fenceMatch) return fenceMatch[1]
  const htmlMatch = text.match(/<!DOCTYPE html>[\s\S]*<\/html>/i)
  if (!htmlMatch) throw new Error('Claude did not return valid HTML. Got: ' + text.slice(0, 300))
  return htmlMatch[0]
}

// ── Main export ────────────────────────────────────────────────────────────────
export async function generateHtmlWithClaude({ idea, brief, founderNotes, founderAvoid, currentHtml }) {
  if (currentHtml && !isFullRebuild(founderNotes)) {
    console.log('[generate] Revision — using semantic section update')
    try {
      return await sectionRevision(currentHtml, founderNotes || '')
    } catch (e) {
      console.warn('[generate] Section revision failed, falling back to full generation:', e.message)
    }
  }

  console.log('[generate] Full generation mode')
  return fullGeneration(idea, brief, founderNotes, founderAvoid)
}
