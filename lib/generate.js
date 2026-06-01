import Anthropic from '@anthropic-ai/sdk'

function anthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

const SYSTEM_PROMPT = `You generate self-contained single-file HTML prototypes. Return ONLY a raw JSON array with exactly one file object. No markdown, no explanation, nothing else before or after the JSON array.`

export async function generatePrototype({ name, slug, oneLiner, brief, founderNotes, founderAvoid, imageUrls, monetization }) {
  const founderContext = [
    monetization    ? `Monetization: ${monetization}` : null,
    founderNotes    ? `What to build: ${founderNotes}` : null,
    founderAvoid    ? `What to avoid: ${founderAvoid}` : null,
    imageUrls?.length ? `Visual references: ${imageUrls.length} image(s) provided above — match their style and layout.` : null,
  ].filter(Boolean).join('\n')

  const prompt = `Generate a single self-contained index.html prototype for: "${name}" — ${oneLiner || ''}

MVP concept: ${brief?.mvp_scope || 'Demonstrate the core value proposition'}
${founderContext ? `\nFounder direction:\n${founderContext}` : ''}

Requirements:
- Single HTML file with all CSS and JS embedded
- Clean, white, minimal design (#1A1A1A text, #FFFFFF bg, #E8E8E4 borders)
- Geist font from Google Fonts
- Shows real representative content (not Lorem Ipsum)
- Interactive where appropriate (JS is fine)
- Mobile responsive
- Reflect the founder's direction above in the design and copy
${imageUrls?.length ? '- Study the reference images carefully and match their visual style' : ''}

Return exactly this JSON array:
[{"path":"index.html","content":"<!DOCTYPE html>...complete html..."}]`

  // Build message content — prepend images if provided so Claude sees them first
  const userContent = []
  if (imageUrls?.length) {
    imageUrls.forEach(url => {
      userContent.push({ type: 'image', source: { type: 'url', url } })
    })
    console.log(`[generate] Including ${imageUrls.length} visual reference image(s)`)
  }
  userContent.push({ type: 'text', text: prompt })

  const messages = [{ role: 'user', content: userContent }]
  let result = ''

  console.log('[generate] Calling Claude API (streaming)...')
  const stream = anthropic().messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
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

  if (!result) throw new Error('No response from code generator')

  // Extract JSON — if truncated, try to salvage the HTML content directly
  let files
  const match = result.match(/\[[\s\S]*\]/)
  if (match) {
    try {
      files = JSON.parse(match[0])
    } catch {
      // JSON was truncated mid-string — extract the HTML portion and close it
      const htmlMatch = result.match(/"content"\s*:\s*"([\s\S]*?)(?:"\s*\}|$)/)
      if (htmlMatch) {
        let html = htmlMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
        if (!html.includes('</html>')) html += '\n</body></html>'
        files = [{ path: 'index.html', content: html }]
        console.log('[generate] Salvaged truncated HTML')
      }
    }
  }

  if (!files) throw new Error(`Could not parse response. Got: ${result.slice(0, 300)}`)
  if (!Array.isArray(files) || files.length === 0) throw new Error('Empty file list')

  // Add vercel.json so Vercel serves it as a static site
  files.push({
    path: 'vercel.json',
    content: JSON.stringify({ buildCommand: '', outputDirectory: '.' }, null, 2)
  })

  console.log(`[generate] Generated ${files.length} files: ${files.map(f => f.path).join(', ')}`)
  return files
}

export async function generateGameData(gameName, description) {
  console.log(`[generate] Researching game: ${gameName}`)
  const prompt = `Research the board/card game "${gameName}" and return a complete game data object for a rules reference app.
${description ? `Context: ${description}` : ''}

Return ONLY valid JSON matching this exact structure (no TypeScript, no markdown):
{
  "slug": "kebab-case-name",
  "name": "Full Game Name",
  "category": "Card|Dice|Board|Strategy",
  "players": "2-4",
  "duration": "30-60 min",
  "description": "One sentence description of the game",
  "quickRef": [
    "Key rule 1",
    "Key rule 2",
    "Key rule 3",
    "Key rule 4",
    "Key rule 5"
  ],
  "rules": [
    { "title": "Section Title", "body": "2-3 sentence explanation" },
    { "title": "Section Title", "body": "2-3 sentence explanation" },
    { "title": "Section Title", "body": "2-3 sentence explanation" },
    { "title": "Section Title", "body": "2-3 sentence explanation" }
  ],
  "tools": []
}

tools array may include: "dice", "timer", "spades-scorekeeper", "cribbage-scorekeeper" — only if directly relevant.
Return ONLY the JSON object.`

  const response = await anthropic().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('')
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`No JSON in game data response: ${text.slice(0, 200)}`)

  const gameData = JSON.parse(match[0])
  console.log(`[generate] Game data generated: ${gameData.name} (${gameData.category})`)
  return gameData
}

export async function generateReleaseNotes(gameName, currentVersion) {
  const [major, minor, patch] = (currentVersion || '1.0.0').split('.').map(Number)
  const newVersion = `${major}.${minor}.${patch + 1}`

  const prompt = `Write App Store release notes for a game rules reference app that just added "${gameName}".

Return ONLY valid JSON:
{
  "version": "${newVersion}",
  "releaseNotes": "Short, friendly What's New text for the App Store (2-4 sentences, no emojis in first sentence)",
  "testChecklist": [
    "Verify checklist item 1",
    "Verify checklist item 2",
    "Verify checklist item 3",
    "Verify checklist item 4"
  ]
}`

  const response = await anthropic().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('')
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in release notes response')
  return JSON.parse(match[0])
}
