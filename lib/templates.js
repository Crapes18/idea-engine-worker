import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const TEMPLATE_IDS = {
  QUIZ_EXPLORER: 'quiz-explorer',
  LANDING_PAGE:  'landing-page',  // fallback for generic apps
}

export function applyTemplate(templateId, appData) {
  const templatePath = join(__dirname, '..', 'templates', `${templateId}.html`)
  let html = readFileSync(templatePath, 'utf-8')

  // Inject app title
  const title = appData.home?.title || 'App'
  html = html.replace('{{APP_TITLE}}', title)

  // Inject app data as JSON
  const jsonStr = JSON.stringify(appData)
  html = html.replace('{{APP_DATA_JSON}}', jsonStr)

  return html
}

export function detectTemplate(brief, founderNotes, ideaName = '') {
  const text = [
    brief?.mvp_scope || '',
    brief?.target_customer || '',
    founderNotes || '',
    ideaName || '',
  ].join(' ').toLowerCase()

  // Quiz/discovery/exploration apps
  if (
    text.includes('quiz') || text.includes('career') ||
    text.includes('explore') || text.includes('discover') ||
    text.includes('find your') || text.includes('match') ||
    text.includes('recommendation') || text.includes('personality')
  ) {
    return TEMPLATE_IDS.QUIZ_EXPLORER
  }

  // Default: landing page (works for SaaS, tools, marketplaces, games, anything else)
  return TEMPLATE_IDS.LANDING_PAGE
}
