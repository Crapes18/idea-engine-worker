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
const SECTION_PATTERNS = {
  head:       { open: /<head[^>]*>/i,   close: /<\/head>/i,   wrapOpen: '<head>',   wrapClose: '</head>'   },
  styles:     { open: /<style[^>]*>/i,  close: /<\/style>/i,  wrapOpen: '<style>',  wrapClose: '</style>'  },
  body:       { open: /<body[^>]*>/i,   close: /<\/body>/i,   wrapOpen: '<body>',   wrapClose: '</body>'   },
  javascript: { open: /<script[^>]*>/i, close: /<\/script>/i, wrapOpen: '<script>', wrapClose: '</script>' },
}

function extractSection(html, sectionName) {
  const p = SECTION_PATTERNS[sectionName]
  if (!p) return null
  const openMatch = html.match(p.open)
  if (!openMatch) return null
  const openIdx = openMatch.index
  const openTag = openMatch[0]
  const contentStart = openIdx + openTag.length
  // Find the matching close tag — use lastIndexOf for script (multiple scripts possible)
  const closeTag = p.wrapClose
  const contentEnd = sectionName === 'javascript'
    ? html.lastIndexOf(closeTag)
    : html.indexOf(closeTag, contentStart)
  if (contentEnd <= contentStart) return null
  return {
    before: html.slice(0, contentStart),
    content: html.slice(contentStart, contentEnd),
    after: html.slice(contentEnd),
    openTag,
  }
}

function stripWrapperTags(content, sectionName) {
  const p = SECTION_PATTERNS[sectionName]
  if (!p) return content
  // Strip opening and closing wrapper tags if Claude included them
  let result = content.trim()
  const openRe = new RegExp(`^${p.open.source}`, 'i')
  const closeRe = new RegExp(`${p.close.source}$`, 'i')
  result = result.replace(openRe, '').replace(closeRe, '')
  return result.trim()
}

function replaceSection(html, sectionName, newContent) {
  const extracted = extractSection(html, sectionName)
  if (!extracted) return null
  const cleaned = stripWrapperTags(newContent, sectionName)
  return extracted.before + '\n' + cleaned + '\n' + extracted.after
}

// ── Classify which single section a spec change primarily touches ──────────────
function classifySection(spec) {
  const lower = spec.toLowerCase()

  // Logic/behavior first (most specific)
  if (lower.includes('click') || lower.includes('function') || lower.includes('behavior') ||
      lower.includes('animation') || lower.includes('storage') || lower.includes('data') ||
      lower.includes('sort') || lower.includes('filter') || lower.includes('search') ||
      lower.includes('navigate') || lower.includes('modal') || lower.includes('toggle')) {
    return 'javascript'
  }

  // CSS/visual changes
  if (lower.includes('color') || lower.includes('font') || lower.includes('style') ||
      lower.includes('border') || lower.includes('padding') || lower.includes('margin') ||
      lower.includes('background') || lower.includes('css') || lower.includes('theme') ||
      lower.includes('shadow') || lower.includes('radius') || lower.includes('spacing') ||
      lower.includes('typeface') || lower.includes('serif') || lower.includes('dark mode')) {
    return 'styles'
  }

  // HTML structure — default for most content changes
  return 'body'
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
  const sectionName = classifySection(spec)
  console.log('[section] Updating section:', sectionName)

  const extracted = extractSection(html, sectionName)
  if (!extracted) throw new Error(`Could not extract ${sectionName} section from HTML`)

  const currentContent = extracted.content
  console.log(`[section] Section size: ${currentContent.length} chars`)

  const updated = await streamClaude(
    SECTION_SYSTEM,
    `Update the ${sectionName} section of this web app to implement the spec below.\n\nSPEC: ${spec}\n\nCURRENT ${sectionName.toUpperCase()} CONTENT (between the ${sectionName} tags, not including the tags themselves):\n${currentContent}\n\nReturn ONLY the updated content — do NOT include the surrounding <${sectionName}> or </${sectionName}> tags.`,
    16000
  )

  const newHtml = replaceSection(html, sectionName, updated)
  if (!newHtml) throw new Error(`Could not splice updated ${sectionName} section back into HTML`)

  console.log(`[section] ${sectionName} updated — ${html.length} → ${newHtml.length} chars`)
  return newHtml
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
