import Anthropic from '@anthropic-ai/sdk'

function anthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

const SYSTEM_PROMPT = `You generate structured JSON content for app prototypes. Return ONLY valid JSON — no markdown, no explanation, nothing before or after the JSON. All strings must be properly escaped. Use double quotes for all JSON strings. Never include apostrophes in string values — use alternate phrasing instead (e.g. "cannot" instead of "can't", "it is" instead of "it's").`

export async function generateQuizExplorerContent({ name, brief, founderNotes, founderAvoid, imageUrls }) {
  const context = [
    brief?.target_customer ? `Target user: ${brief.target_customer}` : null,
    brief?.mvp_scope ? `MVP: ${brief.mvp_scope}` : null,
    founderNotes ? `Founder direction: ${founderNotes}` : null,
    founderAvoid ? `Avoid: ${founderAvoid}` : null,
  ].filter(Boolean).join('\n')

  const prompt = `Generate content for a quiz-based career explorer app called "${name}".

Context:
${context}

Return a JSON object with EXACTLY this structure. Use only double quotes. No apostrophes in any string value.

{
  "home": {
    "emoji": "🌟",
    "title": "What do you want to be?",
    "subtitle": "Explore amazing jobs or answer fun questions to find your match!",
    "quiz_button": "Take the Quiz! ✨",
    "explore_button": "Explore All Jobs 🗺️"
  },
  "categories_screen": {
    "title": "Pick a World",
    "subtitle": "Tap any world to see the jobs inside"
  },
  "result_screen": {
    "title_prefix": "You are a",
    "jobs_title": "Jobs you might love:",
    "retry_button": "Try Again 🔄",
    "explore_button": "Explore All 🗺️"
  },
  "categories": [
    {"id": "builders", "name": "Builders", "emoji": "🔨", "color": "#E07B00", "bg": "#FFF3E8", "desc": "You love to build and fix things!", "tagline": "Make and fix things"},
    {"id": "discoverers", "name": "Discoverers", "emoji": "🔬", "color": "#0066CC", "bg": "#E8F4FF", "desc": "You love figuring out how things work!", "tagline": "Explore and discover"},
    {"id": "creators", "name": "Creators", "emoji": "🎨", "color": "#CC0066", "bg": "#FFF0F8", "desc": "You love making art and beautiful things!", "tagline": "Make and create"},
    {"id": "helpers", "name": "Helpers", "emoji": "🤝", "color": "#00882B", "bg": "#E8FFF0", "desc": "You love caring for people and animals!", "tagline": "Care for others"},
    {"id": "leaders", "name": "Leaders", "emoji": "⭐", "color": "#886600", "bg": "#FFFBE8", "desc": "You love inspiring and leading others!", "tagline": "Lead and inspire"},
    {"id": "organizers", "name": "Organizers", "emoji": "📋", "color": "#6600BB", "bg": "#F0E8FF", "desc": "You love planning and keeping things in order!", "tagline": "Plan and organize"}
  ],
  "careers": [
    {"id": "wind", "cat": "builders", "emoji": "🌬️", "name": "Wind Turbine Technician", "short": "Fix giant wind turbines that make clean energy!", "detail": "Wind turbine technicians climb turbines as tall as a 20-story building. They keep the blades spinning to make electricity from the wind.", "future": true, "wage": "$62,580/yr"},
    {"id": "solar", "cat": "builders", "emoji": "☀️", "name": "Solar Installer", "short": "Put solar panels on rooftops to catch sunlight!", "detail": "Solar installers put panels on rooftops and fields to turn sunlight into electricity. Solar jobs are one of the fastest growing in America!", "future": true, "wage": "$51,860/yr"},
    {"id": "electrician", "cat": "builders", "emoji": "⚡", "name": "Electrician", "short": "Wire up buildings so the lights turn on!", "detail": "Electricians install and fix all the wires in homes, schools, and buildings. Without them nothing with a plug would work!", "future": false, "wage": "$61,590/yr"},
    {"id": "firefighter", "cat": "builders", "emoji": "🚒", "name": "Firefighter", "short": "Race to emergencies and rescue people!", "detail": "Firefighters put out fires and rescue people from danger. They train every day to be ready to help in an instant.", "future": false, "wage": "$53,240/yr"},
    {"id": "chef", "cat": "builders", "emoji": "👨‍🍳", "name": "Chef", "short": "Create amazing meals that make people happy!", "detail": "Chefs design menus and cook incredible food in restaurants and on TV. A great meal can make someone feel wonderful!", "future": false, "wage": "$59,430/yr"},
    {"id": "data", "cat": "discoverers", "emoji": "📊", "name": "Data Scientist", "short": "Find hidden patterns in huge amounts of data!", "detail": "Data scientists use math and computers to find patterns that help companies make smarter decisions. One of the fastest growing jobs!", "future": true, "wage": "$108,020/yr"},
    {"id": "cybersecurity", "cat": "discoverers", "emoji": "🛡️", "name": "Cybersecurity Analyst", "short": "Protect computers from hackers!", "detail": "Cybersecurity analysts are digital superheroes who stop hackers and keep computers safe. This job is growing super fast!", "future": true, "wage": "$120,360/yr"},
    {"id": "developer", "cat": "discoverers", "emoji": "💻", "name": "Software Developer", "short": "Write the code that makes apps and games work!", "detail": "Software developers build everything you use on a phone or computer. From games to maps to video calls — a developer built it!", "future": true, "wage": "$132,270/yr"},
    {"id": "marine", "cat": "discoverers", "emoji": "🐬", "name": "Marine Biologist", "short": "Study dolphins and amazing ocean animals!", "detail": "Marine biologists dive underwater and sail the seas to study ocean life. They discover new species and help protect our oceans.", "future": false, "wage": "$67,760/yr"},
    {"id": "robotics", "cat": "discoverers", "emoji": "🤖", "name": "Robotics Engineer", "short": "Design and build amazing robots!", "detail": "Robotics engineers build robots that perform surgery, explore Mars, and build cars. As robots get smarter, this job keeps growing!", "future": true, "wage": "$104,600/yr"},
    {"id": "game", "cat": "creators", "emoji": "🎮", "name": "Game Designer", "short": "Create the worlds and adventures in video games!", "detail": "Game designers invent entire worlds for people to explore. Your favorite games were made by a team of passionate designers!", "future": true, "wage": "$132,270/yr"},
    {"id": "animator", "cat": "creators", "emoji": "🎬", "name": "Animator", "short": "Bring cartoon characters to life!", "detail": "Animators make characters move by drawing or using computers. Every Pixar movie and cartoon character was brought to life by an animator!", "future": false, "wage": "$106,810/yr"},
    {"id": "architect", "cat": "creators", "emoji": "🏗️", "name": "Architect", "short": "Design beautiful buildings and skyscrapers!", "detail": "Architects draw plans for buildings before they are built. They decide how a building looks, how rooms fit together, and how to make it safe.", "future": false, "wage": "$95,560/yr"},
    {"id": "uxdesigner", "cat": "creators", "emoji": "📱", "name": "UX Designer", "short": "Design apps so they are fun and easy to use!", "detail": "UX designers decide how apps look and feel. Every app you love had a UX designer who made sure the buttons were easy to find!", "future": true, "wage": "$103,220/yr"},
    {"id": "photographer", "cat": "creators", "emoji": "📸", "name": "Photographer", "short": "Capture amazing moments with a camera!", "detail": "Photographers take pictures at weddings, sports events, and for magazines. Wildlife photographers travel to jungles to capture animals!", "future": false, "wage": "$40,760/yr"},
    {"id": "nurse", "cat": "helpers", "emoji": "👩‍⚕️", "name": "Nurse Practitioner", "short": "Diagnose and treat patients just like a doctor!", "detail": "Nurse practitioners examine patients, figure out what is wrong, and give medicine to make them better. One of the fastest growing jobs!", "future": true, "wage": "$129,210/yr"},
    {"id": "speech", "cat": "helpers", "emoji": "🗣️", "name": "Speech Therapist", "short": "Help people who have trouble speaking!", "detail": "Speech therapists help kids and adults learn to speak clearly using fun games and exercises. They are incredibly patient helpers!", "future": true, "wage": "$89,290/yr"},
    {"id": "teacher", "cat": "helpers", "emoji": "📚", "name": "Teacher", "short": "Help kids learn and discover the world!", "detail": "Teachers help kids read, do math, and understand history. A great teacher can change a life forever — one of the most important jobs in the world!", "future": false, "wage": "$65,220/yr"},
    {"id": "vet", "cat": "helpers", "emoji": "🐾", "name": "Veterinarian", "short": "Take care of sick and injured animals!", "detail": "Veterinarians are doctors for animals — from puppies to zoo animals. They diagnose illnesses, do surgeries, and keep animals healthy!", "future": false, "wage": "$119,100/yr"},
    {"id": "socialworker", "cat": "helpers", "emoji": "🏡", "name": "Social Worker", "short": "Help families going through tough times!", "detail": "Social workers connect families with food, housing, and support. They make sure children are safe and help adults through hard situations.", "future": true, "wage": "$58,380/yr"},
    {"id": "healthmanager", "cat": "leaders", "emoji": "🏥", "name": "Health Manager", "short": "Run hospitals so everything works perfectly!", "detail": "Health managers keep hospitals and clinics running. They manage staff and budgets to make sure patients get excellent care. Growing fast!", "future": true, "wage": "$110,680/yr"},
    {"id": "entrepreneur", "cat": "leaders", "emoji": "💡", "name": "Entrepreneur", "short": "Start your own business and make your ideas real!", "detail": "Entrepreneurs see a problem and build a business to solve it. Every big company started with one person who believed in their dream!", "future": false, "wage": "Varies"},
    {"id": "coach", "cat": "leaders", "emoji": "🏆", "name": "Sports Coach", "short": "Train athletes and help your team win!", "detail": "Sports coaches teach skills, develop strategies, and motivate teams to give their best. Great coaches make great champions!", "future": false, "wage": "$48,140/yr"},
    {"id": "lawyer", "cat": "leaders", "emoji": "⚖️", "name": "Lawyer", "short": "Stand up for people and make sure justice is served!", "detail": "Lawyers defend people in court and protect everyone rights. Some fight for the environment, some help families, some work in space law!", "future": false, "wage": "$145,760/yr"},
    {"id": "pilot", "cat": "leaders", "emoji": "✈️", "name": "Airline Pilot", "short": "Fly giant planes full of passengers!", "detail": "Airline pilots fly planes to cities all over the world. They train for years to safely carry hundreds of passengers at once.", "future": false, "wage": "$171,210/yr"},
    {"id": "financialplanner", "cat": "organizers", "emoji": "💰", "name": "Financial Planner", "short": "Help families save money and plan for the future!", "detail": "Financial planners help people figure out how to save for college, a house, or retirement. They turn confusing money questions into simple plans!", "future": false, "wage": "$99,580/yr"},
    {"id": "urbanplanner", "cat": "organizers", "emoji": "🏙️", "name": "Urban Planner", "short": "Design the layout of cities!", "detail": "Urban planners decide where buildings, parks, and roads go in a city. They shape communities where thousands of people live!", "future": false, "wage": "$81,800/yr"},
    {"id": "logistics", "cat": "organizers", "emoji": "📦", "name": "Logistics Manager", "short": "Make sure packages get where they need to go!", "detail": "Logistics managers figure out the fastest way to move products around the world. Every package that arrives on time is thanks to them!", "future": false, "wage": "$103,380/yr"},
    {"id": "dba", "cat": "organizers", "emoji": "🗄️", "name": "Database Admin", "short": "Organize and protect huge amounts of information!", "detail": "Database administrators organize millions of pieces of data so companies can find what they need in seconds. They also keep data safe!", "future": false, "wage": "$112,120/yr"},
    {"id": "accountant", "cat": "organizers", "emoji": "🧮", "name": "Accountant", "short": "Track money and make sure everything adds up!", "detail": "Accountants keep track of money coming in and going out of businesses. They help companies stay healthy and make sure taxes are done right!", "future": false, "wage": "$79,880/yr"}
  ],
  "quiz": [
    {
      "emoji": "🤔",
      "question": "What do you love doing?",
      "hint": "Pick your favourite!",
      "answers": [
        {"cat": "builders",    "emoji": "🔨", "text": "Building and fixing things",        "bg": "#FFF3E8"},
        {"cat": "discoverers", "emoji": "🔬", "text": "Experiments and figuring things out","bg": "#E8F4FF"},
        {"cat": "creators",    "emoji": "🎨", "text": "Drawing, music, or making art",     "bg": "#FFF0F8"},
        {"cat": "helpers",     "emoji": "🤝", "text": "Helping people and animals",        "bg": "#E8FFF0"},
        {"cat": "leaders",     "emoji": "⭐", "text": "Being in charge and leading",       "bg": "#FFFBE8"},
        {"cat": "organizers",  "emoji": "📋", "text": "Planning and keeping things neat",  "bg": "#F0E8FF"}
      ]
    },
    {
      "emoji": "🌍",
      "question": "Where would you love to work?",
      "hint": "Pick your dream place!",
      "answers": [
        {"cat": "builders",    "emoji": "🌳", "text": "Outside or in a big workshop",      "bg": "#FFF3E8"},
        {"cat": "discoverers", "emoji": "🔭", "text": "In a lab or on a computer",         "bg": "#E8F4FF"},
        {"cat": "creators",    "emoji": "🎭", "text": "In a studio or on a stage",         "bg": "#FFF0F8"},
        {"cat": "helpers",     "emoji": "🏥", "text": "With people who need help",         "bg": "#E8FFF0"},
        {"cat": "leaders",     "emoji": "🌎", "text": "Everywhere — I love to travel!",   "bg": "#FFFBE8"},
        {"cat": "organizers",  "emoji": "🏢", "text": "In an office with a great team",   "bg": "#F0E8FF"}
      ]
    },
    {
      "emoji": "⚡",
      "question": "What is your superpower?",
      "hint": "Almost done!",
      "answers": [
        {"cat": "builders",    "emoji": "💪", "text": "I can fix or build anything",       "bg": "#FFF3E8"},
        {"cat": "discoverers", "emoji": "🧠", "text": "I figure out how things work",      "bg": "#E8F4FF"},
        {"cat": "creators",    "emoji": "✨", "text": "I make beautiful things",           "bg": "#FFF0F8"},
        {"cat": "helpers",     "emoji": "❤️", "text": "I make people feel better",        "bg": "#E8FFF0"},
        {"cat": "leaders",     "emoji": "🚀", "text": "I inspire people to do great things","bg": "#FFFBE8"},
        {"cat": "organizers",  "emoji": "📊", "text": "I keep everything running smoothly","bg": "#F0E8FF"}
      ]
    }
  ]
}`

  // For now use the rich default content above — Claude customization is a bonus
  // but the default content is already comprehensive and validated
  // If founderNotes requests specific changes, use Claude to adjust the JSON
  const baseContent = JSON.parse(prompt.slice(prompt.indexOf('{'), prompt.lastIndexOf('}') + 1))

  if (founderNotes && founderNotes.length > 20) {
    console.log('[content-gen] Customizing with founder notes via Claude...')
    try {
      const response = await anthropic().messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Take this base JSON content for a career explorer app and customize it based on the founder direction below. Return ONLY the modified JSON object. Keep the exact same structure. Use only double quotes. No apostrophes in string values.

Founder direction: ${founderNotes}
${founderAvoid ? 'Avoid: ' + founderAvoid : ''}

Base content:
${JSON.stringify(baseContent, null, 2)}`
        }]
      })
      const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('')
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        const customized = JSON.parse(match[0])
        console.log('[content-gen] Successfully customized with Claude')
        return customized
      }
    } catch (e) {
      console.warn('[content-gen] Claude customization failed, using base content:', e.message)
    }
  }

  return baseContent
}

export async function generateLandingPageContent({ name, brief, founderNotes, founderAvoid }) {
  const context = [
    brief?.target_customer ? `Target user: ${brief.target_customer}` : null,
    brief?.mvp_scope ? `MVP: ${brief.mvp_scope}` : null,
    brief?.monetization_model ? `Monetization: ${brief.monetization_model}` : null,
    founderNotes ? `Founder direction: ${founderNotes}` : null,
    founderAvoid ? `Avoid: ${founderAvoid}` : null,
  ].filter(Boolean).join('\n')

  const prompt = `Generate landing page content for a product called "${name}".

Context:
${context}

Return a JSON object with this structure. Use only double quotes. No apostrophes — use "cannot" instead of "can't", "it is" instead of "it's", etc.

{
  "nav": {"logo": "${name}", "cta": "Get Started"},
  "hero": {
    "badge": "One-line category label",
    "title": "Bold compelling headline",
    "subtitle": "One or two sentences explaining the value",
    "cta_primary": "Primary action button text",
    "cta_secondary": "Secondary action text"
  },
  "features": {
    "title": "Section title",
    "subtitle": "Section subtitle",
    "items": [
      {"emoji": "✨", "title": "Feature name", "description": "Feature description"},
      {"emoji": "🚀", "title": "Feature name", "description": "Feature description"},
      {"emoji": "🔒", "title": "Feature name", "description": "Feature description"},
      {"emoji": "📊", "title": "Feature name", "description": "Feature description"},
      {"emoji": "🎯", "title": "Feature name", "description": "Feature description"},
      {"emoji": "💡", "title": "Feature name", "description": "Feature description"}
    ]
  },
  "how_it_works": {
    "title": "How it works",
    "subtitle": "Get started in minutes",
    "steps": [
      {"title": "Step 1 title", "description": "Step 1 description"},
      {"title": "Step 2 title", "description": "Step 2 description"},
      {"title": "Step 3 title", "description": "Step 3 description"}
    ]
  },
  "pricing": {
    "title": "Simple pricing",
    "subtitle": "No surprises",
    "plans": [
      {"name": "Free", "price": "$0", "period": "forever", "highlight": false, "cta": "Get Started", "features": ["Feature 1", "Feature 2", "Feature 3"]},
      {"name": "Pro", "price": "$9", "period": "per month", "highlight": true, "cta": "Start Free Trial", "features": ["Everything in Free", "Feature 4", "Feature 5", "Feature 6"]}
    ]
  },
  "footer_cta": {
    "title": "Ready to get started?",
    "subtitle": "Join thousands of users today",
    "button": "Get Started Free"
  }
}`

  console.log('[content-gen] Generating landing page content with Claude...')
  try {
    const response = await anthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('')
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      const content = JSON.parse(match[0])
      console.log('[content-gen] Landing page content generated successfully')
      return content
    }
  } catch (e) {
    console.warn('[content-gen] Claude generation failed, using fallback:', e.message)
  }

  // Fallback: generate minimal content from brief
  return {
    nav: { logo: name, cta: 'Get Started' },
    hero: {
      badge: 'New Product',
      title: name,
      subtitle: brief?.mvp_scope || `The best way to ${name.toLowerCase()}.`,
      cta_primary: 'Get Started Free',
      cta_secondary: 'Learn More',
    },
    features: {
      title: 'Why ' + name + '?',
      subtitle: brief?.target_customer || 'Built for people who want results.',
      items: [
        { emoji: '⚡', title: 'Fast', description: 'Get results in seconds, not hours.' },
        { emoji: '🎯', title: 'Simple', description: 'Clean, intuitive, no learning curve.' },
        { emoji: '🔒', title: 'Secure', description: 'Your data is safe with us.' },
        { emoji: '📊', title: 'Insights', description: 'Understand exactly what is happening.' },
        { emoji: '🤝', title: 'Support', description: 'We are here when you need us.' },
        { emoji: '💡', title: 'Smart', description: 'Gets better the more you use it.' },
      ],
    },
    how_it_works: {
      title: 'How it works',
      subtitle: 'Up and running in minutes',
      steps: [
        { title: 'Sign up', description: 'Create your free account in seconds.' },
        { title: 'Set up', description: 'Connect your data and configure settings.' },
        { title: 'Get results', description: 'Start seeing value immediately.' },
      ],
    },
    pricing: {
      title: 'Simple pricing',
      subtitle: 'Start free, upgrade when ready',
      plans: [
        { name: 'Free', price: '$0', period: 'forever', highlight: false, cta: 'Get Started', features: ['Core features', 'Up to 10 uses/month', 'Email support'] },
        { name: 'Pro', price: '$9', period: 'per month', highlight: true, cta: 'Start Free Trial', features: ['Everything in Free', 'Unlimited uses', 'Priority support', 'Advanced features'] },
      ],
    },
    footer_cta: {
      title: 'Ready to get started?',
      subtitle: 'Join users who trust ' + name,
      button: 'Get Started Free',
    },
  }
}
