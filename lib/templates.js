import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { pickPalette } from './content-gen.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const TEMPLATE_IDS = {
  QUIZ_EXPLORER: 'quiz-explorer',
  FLASHCARD_APP: 'flashcard-app',
  LANDING_PAGE:  'landing-page',
}

export function applyTemplate(templateId, appData) {
  const templatePath = join(__dirname, '..', 'templates', `${templateId}.html`)
  let html = readFileSync(templatePath, 'utf-8')

  const title = appData.home?.title || appData.app?.title || 'App'
  html = html.replace('{{APP_TITLE}}', title)
  html = html.replace('{{APP_DATA_JSON}}', JSON.stringify(appData))

  // Inject color palette placeholders for flashcard template
  const palette = appData.app || {}
  html = html.replace('{{PRIMARY}}', palette.primary || '#0F766E')
  html = html.replace('{{ACCENT}}',  palette.accent  || '#6366F1')

  return html
}

export function detectTemplate(brief, founderNotes, ideaName = '') {
  const text = [
    ideaName,
    brief?.mvp_scope || '',
    brief?.target_customer || '',
    founderNotes || '',
  ].join(' ').toLowerCase()

  // Flashcard / study apps
  if (
    text.includes('flashcard') || text.includes('flash card') ||
    text.includes('memorize') || text.includes('memorise') ||
    text.includes('vocabulary') || text.includes('vocab') ||
    text.includes('study card') || text.includes('memory card') ||
    text.includes('spaced repetition') || text.includes('deck of card') ||
    (text.includes('study') && text.includes('card'))
  ) {
    return TEMPLATE_IDS.FLASHCARD_APP
  }

  // Quiz / discovery / exploration apps
  if (
    text.includes('quiz') || text.includes('career') ||
    text.includes('discover') || text.includes('explore') ||
    text.includes('find your') || text.includes('personality') ||
    text.includes('recommendation') || text.includes('what am i') ||
    text.includes('what should i')
  ) {
    return TEMPLATE_IDS.QUIZ_EXPLORER
  }

  // Default: landing page (SaaS, tools, marketplaces, etc.)
  return TEMPLATE_IDS.LANDING_PAGE
}
