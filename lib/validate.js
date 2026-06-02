import { writeFileSync, unlinkSync } from 'fs'
import { execSync } from 'child_process'
import { randomBytes } from 'crypto'

export function validateHTML(html) {
  const errors = []

  // 1. Check script tags are balanced
  const scriptOpen  = (html.match(/<script/g)  || []).length
  const scriptClose = (html.match(/<\/script>/g) || []).length
  if (scriptOpen !== scriptClose) {
    errors.push(`Unbalanced script tags: ${scriptOpen} open, ${scriptClose} close`)
  }

  // 2. Check body has real content
  const bodyStart = html.indexOf('<body')
  if (bodyStart === -1) {
    errors.push('No <body> tag found')
  } else {
    const bodyContent = html.slice(bodyStart).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    if (bodyContent.length < 50) {
      errors.push(`Body has insufficient content (${bodyContent.length} chars after stripping tags)`)
    }
  }

  // 3. Extract and syntax-check JavaScript
  const jsStart = html.indexOf('<script>') + 8
  const jsEnd   = html.lastIndexOf('</script>')
  if (jsStart >= 8 && jsEnd > jsStart) {
    const js = html.slice(jsStart, jsEnd)
    const tmpFile = `/tmp/validate_${randomBytes(4).toString('hex')}.js`
    try {
      writeFileSync(tmpFile, js)
      execSync(`node --check "${tmpFile}"`, { timeout: 8000, stdio: 'pipe' })
    } catch (e) {
      const errMsg = (e.stderr || e.stdout || e.message || '').toString().slice(0, 300)
      errors.push(`JavaScript syntax error: ${errMsg}`)
    } finally {
      try { unlinkSync(tmpFile) } catch {}
    }
  } else if (scriptOpen > 0) {
    errors.push('Could not extract JavaScript for validation')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
