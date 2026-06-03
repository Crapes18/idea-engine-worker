import Anthropic from '@anthropic-ai/sdk'
import { validateHTML } from './validate.js'

function anthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

const SYSTEM_PROMPT = `You generate targeted code patches for HTML prototypes. Return ONLY a valid JSON array of patch objects. No markdown, no explanation. Each patch object has "find" (exact text from the file) and "replace" (replacement text). The "find" value must be copy-paste exact from the source file — character-for-character accurate including whitespace.`

// Extract the JS script content from HTML
function extractScript(html) {
  const start = html.indexOf('<script>') + 8
  const end = html.lastIndexOf('</script>')
  if (start < 8 || end < 0) return ''
  return html.slice(start, end)
}

// Extract specific functions by name from script content
function extractFunctions(script, names) {
  const result = []
  for (const name of names) {
    const pattern = new RegExp(`function ${name}\\s*\\([^)]*\\)\\s*\\{`)
    const match = pattern.exec(script)
    if (!match) continue
    // Find the matching closing brace
    let depth = 0
    let i = match.index
    for (; i < script.length; i++) {
      if (script[i] === '{') depth++
      else if (script[i] === '}') { depth--; if (depth === 0) break }
    }
    result.push(script.slice(match.index, i + 1))
  }
  return result.join('\n\n')
}

// Guess which functions are relevant based on the spec
function relevantFunctions(spec) {
  const s = spec.toLowerCase()
  const fns = []
  if (s.includes('result') || s.includes('quiz') || s.includes('match')) fns.push('showResult')
  if (s.includes('detail') || s.includes('profile') || s.includes('job card') || s.includes('click') || s.includes('tap')) fns.push('showDetail')
  if (s.includes('categor') || s.includes('list') || s.includes('browse')) fns.push('showCategory', 'buildCategories')
  if (s.includes('home') || s.includes('landing')) fns.push('buildHome')
  if (s.includes('nav') || s.includes('back') || s.includes('screen')) fns.push('show')
  // Always include showResult and showDetail as they're commonly involved
  if (!fns.includes('showResult')) fns.push('showResult')
  if (!fns.includes('showDetail')) fns.push('showDetail')
  return [...new Set(fns)]
}

export async function generatePatches(html, spec) {
  const script = extractScript(html)
  const fnNames = relevantFunctions(spec)
  const relevantCode = extractFunctions(script, fnNames)

  if (!relevantCode) {
    throw new Error('Could not extract relevant functions from HTML')
  }

  const prompt = `You need to make the following changes to a web app prototype:

SPEC:
${spec}

RELEVANT SOURCE CODE:
\`\`\`javascript
${relevantCode}
\`\`\`

Generate the minimal patches to implement the spec. Return a JSON array where each object has:
- "find": the EXACT text to find (must be verbatim from the source, character-perfect)
- "replace": the replacement text

Important rules:
1. "find" must match exactly — copy it directly from the source code above
2. Make minimal changes — only modify what the spec requires
3. Do not change unrelated code
4. If adding a click handler to a div, change it to a button with the handler
5. Return ONLY the JSON array, nothing else

Example format:
[{"find": "var div = document.createElement(\\"div\\");", "replace": "var btn = document.createElement(\\"button\\");"}]`

  const response = await anthropic().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  if (response.stop_reason === 'max_tokens') {
    throw new Error('Patch response was truncated (hit token limit) — spec may be too complex for patch mode')
  }

  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('')
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error(`Claude did not return a JSON array. Got: ${text.slice(0, 200)}`)

  const patches = JSON.parse(match[0])
  if (!Array.isArray(patches)) throw new Error('Response was not a JSON array')
  // Empty array = Claude says nothing needs changing (already implemented)
  return patches

  // Validate each patch has required fields
  for (const p of patches) {
    if (typeof p.find !== 'string' || typeof p.replace !== 'string') {
      throw new Error(`Invalid patch object: ${JSON.stringify(p)}`)
    }
    if (!p.find.trim()) throw new Error('Empty find string in patch')
  }

  return patches
}

export function applyPatches(html, patches) {
  let result = html
  const applied = []
  const failed = []

  for (const patch of patches) {
    if (result.includes(patch.find)) {
      result = result.replace(patch.find, patch.replace)
      applied.push(patch.find.slice(0, 50))
    } else {
      failed.push(patch.find.slice(0, 80))
    }
  }

  if (failed.length > 0) {
    throw new Error(`${failed.length} patch(es) could not be applied — text not found in file:\n${failed.map(f => `  - "${f}..."`).join('\n')}`)
  }

  console.log(`[patcher] Applied ${applied.length} patch(es)`)
  return result
}

export async function patchAndValidate(html, spec) {
  console.log('[patcher] Generating patches for spec:', spec.slice(0, 100))

  const patches = await generatePatches(html, spec)
  console.log(`[patcher] Got ${patches.length} patch(es) from Claude`)

  // No patches needed — spec is already implemented in the current file
  if (patches.length === 0) {
    console.log('[patcher] No changes needed — spec already implemented in current file')
    return { html, changed: false }
  }

  const patched = applyPatches(html, patches)

  const validation = validateHTML(patched)
  if (!validation.valid) {
    throw new Error(`Patched HTML failed validation: ${validation.errors.join('; ')}`)
  }

  console.log('[patcher] Patches applied and validated successfully')
  return { html: patched, changed: true }
}
