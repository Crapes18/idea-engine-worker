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
    {"id":"wind","cat":"builders","emoji":"🌬️","name":"Wind Turbine Technician","short":"Fix giant wind turbines that make clean energy!","detail":"Wind turbine technicians climb turbines as tall as a 20-story building. They keep the blades spinning to make electricity from the wind.","typicalDay":"Wake up early and drive to a wind farm. Climb up inside a giant turbine and check all the parts. Use tools to fix anything that is broken. Watch the blades start spinning again!","skills":["Climbing","Tool use","Problem solving","Safety awareness"],"funFact":"One wind turbine can power about 1,500 homes for a whole year!","future":true,"wage":"$62,580/yr"},
    {"id":"solar","cat":"builders","emoji":"☀️","name":"Solar Installer","short":"Put solar panels on rooftops to catch sunlight!","detail":"Solar installers put panels on rooftops and fields to turn sunlight into electricity. Solar jobs are one of the fastest growing in America!","typicalDay":"Load solar panels into the truck and drive to a house. Climb up on the roof safely. Connect the panels together and wire them to the house. Test everything to make sure it works!","skills":["Working at heights","Electrical wiring","Teamwork","Math"],"funFact":"The sun sends more energy to Earth in one hour than all humans use in a whole year!","future":true,"wage":"$51,860/yr"},
    {"id":"electrician","cat":"builders","emoji":"⚡","name":"Electrician","short":"Wire up buildings so the lights turn on!","detail":"Electricians install and fix all the wires in homes, schools, and buildings. Without them nothing with a plug would work!","typicalDay":"Read the building plans to find where wires should go. Drill holes through walls to run cables. Connect wires to outlets and switches. Test everything to make sure it is safe!","skills":["Reading blueprints","Problem solving","Attention to detail","Safety"],"funFact":"The electricity in your home travels through wires at nearly the speed of light!","future":false,"wage":"$61,590/yr"},
    {"id":"firefighter","cat":"builders","emoji":"🚒","name":"Firefighter","short":"Race to emergencies and rescue people!","detail":"Firefighters put out fires and rescue people from danger. They train every day to be ready to help in an instant.","typicalDay":"Start the day exercising and checking all the equipment. Cook meals with the team at the fire station. When the alarm rings, jump in the truck and race to help! After the emergency, clean everything and get ready for the next call.","skills":["Physical fitness","Teamwork","Staying calm under pressure","First aid"],"funFact":"Firefighters can be called to over 30 different types of emergencies, not just fires!","future":false,"wage":"$53,240/yr"},
    {"id":"chef","cat":"builders","emoji":"👨‍🍳","name":"Chef","short":"Create amazing meals that make people happy!","detail":"Chefs design menus and cook incredible food in restaurants and on TV. A great meal can make someone feel wonderful!","typicalDay":"Arrive at the restaurant and check fresh ingredients. Plan the day's menu with the team. Start cooking and tasting to make sure everything is delicious. Watch happy guests enjoy your food!","skills":["Creativity","Tasting and smell","Knife skills","Team leadership"],"funFact":"Some chefs travel the whole world just to learn new recipes and cooking techniques!","future":false,"wage":"$59,430/yr"},
    {"id":"data","cat":"discoverers","emoji":"📊","name":"Data Scientist","short":"Find hidden patterns in huge amounts of data!","detail":"Data scientists use math and computers to find patterns that help companies make smarter decisions. One of the fastest growing jobs!","typicalDay":"Open your computer and look at millions of numbers. Write code to find patterns nobody else can see. Create colorful charts to show what you discovered. Tell your team what the data says!","skills":["Math","Computer coding","Curiosity","Explaining ideas clearly"],"funFact":"Netflix uses data science to pick which shows to make — so data scientists helped create your favorite shows!","future":true,"wage":"$108,020/yr"},
    {"id":"cybersecurity","cat":"discoverers","emoji":"🛡️","name":"Cybersecurity Analyst","short":"Protect computers from hackers!","detail":"Cybersecurity analysts are digital superheroes who stop hackers and keep computers safe. This job is growing super fast!","typicalDay":"Check the computer systems for any suspicious activity. Set up digital traps to catch hackers. Test the security by pretending to be a hacker yourself. Keep everything locked up tight!","skills":["Computer skills","Problem solving","Thinking like a bad guy","Patience"],"funFact":"There are over 3 billion cyber attacks every single day — cybersecurity experts stop most of them!","future":true,"wage":"$120,360/yr"},
    {"id":"developer","cat":"discoverers","emoji":"💻","name":"Software Developer","short":"Write the code that makes apps and games work!","detail":"Software developers build everything you use on a phone or computer. From games to maps to video calls — a developer built it!","typicalDay":"Plan what you want to build by drawing it out. Write lines of code that tell the computer what to do. Test it to find any bugs. Fix the bugs and share your creation with the world!","skills":["Logical thinking","Coding","Creativity","Persistence"],"funFact":"The first computer bug was an actual bug — a moth got stuck inside a computer in 1947!","future":true,"wage":"$132,270/yr"},
    {"id":"marine","cat":"discoverers","emoji":"🐬","name":"Marine Biologist","short":"Study dolphins and amazing ocean animals!","detail":"Marine biologists dive underwater and sail the seas to study ocean life. They discover new species and help protect our oceans.","typicalDay":"Wake up on a research boat and watch the sunrise over the ocean. Put on scuba gear and dive in to observe sea creatures. Take notes and photographs. Back on the boat, write about what you discovered!","skills":["Swimming","Observation","Science","Patience"],"funFact":"Over 80% of the ocean is still unexplored — marine biologists are discovering new creatures every year!","future":false,"wage":"$67,760/yr"},
    {"id":"robotics","cat":"discoverers","emoji":"🤖","name":"Robotics Engineer","short":"Design and build amazing robots!","detail":"Robotics engineers build robots that perform surgery, explore Mars, and build cars. As robots get smarter, this job keeps growing!","typicalDay":"Sketch a new robot design on the computer. Build parts in the workshop with special machines. Program the robot to move and think. Test it and watch it do something amazing!","skills":["Engineering","Computer programming","Math","Creative thinking"],"funFact":"The Mars rovers are robots built by engineers — they have been exploring Mars for over 20 years!","future":true,"wage":"$104,600/yr"},
    {"id":"game","cat":"creators","emoji":"🎮","name":"Game Designer","short":"Create the worlds and adventures in video games!","detail":"Game designers invent entire worlds for people to explore. Your favorite games were made by a team of passionate designers!","typicalDay":"Draw ideas for new characters and levels in your sketchbook. Meet with the art team to bring your ideas to life. Play the game to test if it is fun. Make changes until it feels just right!","skills":["Creativity","Storytelling","Drawing","Understanding what makes things fun"],"funFact":"The video game industry makes more money than movies and music combined!","future":true,"wage":"$132,270/yr"},
    {"id":"animator","cat":"creators","emoji":"🎬","name":"Animator","short":"Bring cartoon characters to life!","detail":"Animators make characters move by drawing or using computers. Every Pixar movie and cartoon character was brought to life by an animator!","typicalDay":"Review the scene you need to animate today. Draw or move the character one tiny step at a time — sometimes hundreds of drawings for one second! Watch it play back and adjust until it looks perfect.","skills":["Drawing","Attention to detail","Storytelling","Patience"],"funFact":"One second of animation in a Pixar movie can take weeks to create!","future":false,"wage":"$106,810/yr"},
    {"id":"architect","cat":"creators","emoji":"🏗️","name":"Architect","short":"Design beautiful buildings and skyscrapers!","detail":"Architects draw plans for buildings before they are built. They decide how a building looks, how rooms fit together, and how to make it safe.","typicalDay":"Meet with clients to hear what they want. Sketch the building design on paper and the computer. Calculate if the structure will be safe and strong. Watch your design slowly become a real building!","skills":["Drawing","Math","Creative thinking","Problem solving"],"funFact":"The ancient pyramids of Egypt are over 4,000 years old — and architects still study them today!","future":false,"wage":"$95,560/yr"},
    {"id":"uxdesigner","cat":"creators","emoji":"📱","name":"UX Designer","short":"Design apps so they are fun and easy to use!","detail":"UX designers decide how apps look and feel. Every app you love had a UX designer who made sure the buttons were easy to find!","typicalDay":"Talk to real people to find out what confuses them about an app. Sketch new designs on paper. Build a simple version and watch people use it. Make improvements based on what you learn!","skills":["Empathy","Drawing","Problem solving","Understanding people"],"funFact":"A good UX designer can make an app 10 times faster to use just by moving one button!","future":true,"wage":"$103,220/yr"},
    {"id":"photographer","cat":"creators","emoji":"📸","name":"Photographer","short":"Capture amazing moments with a camera!","detail":"Photographers take pictures at weddings, sports events, and for magazines. Wildlife photographers travel to jungles to capture animals!","typicalDay":"Pack your camera and lenses. Travel to an amazing location — maybe a wedding, a sports game, or a jungle! Wait patiently for the perfect moment. Click! Edit the photos to make them look beautiful.","skills":["Patience","Creativity","Technical camera knowledge","Storytelling through images"],"funFact":"Wildlife photographers sometimes wait in the same spot for days just to get one perfect shot!","future":false,"wage":"$40,760/yr"},
    {"id":"nurse","cat":"helpers","emoji":"👩‍⚕️","name":"Nurse Practitioner","short":"Diagnose and treat patients just like a doctor!","detail":"Nurse practitioners examine patients, figure out what is wrong, and give medicine to make them better. One of the fastest growing jobs!","typicalDay":"See patients one by one — listen to their hearts, check their temperature, ask how they feel. Figure out what might be wrong. Prescribe medicine or treatment. Make sure they leave feeling cared for!","skills":["Caring for others","Science","Listening","Staying calm"],"funFact":"Nurse practitioners see more patients every year than many doctors and often spend more time with each one!","future":true,"wage":"$129,210/yr"},
    {"id":"speech","cat":"helpers","emoji":"🗣️","name":"Speech Therapist","short":"Help people who have trouble speaking!","detail":"Speech therapists help kids and adults learn to speak clearly using fun games and exercises. They are incredibly patient helpers!","typicalDay":"Work with a child using fun games to practice sounds. Teach tongue exercises that strengthen mouth muscles. Celebrate every small improvement — saying one word correctly is a big victory!","skills":["Patience","Creativity with games","Science of language","Encouragement"],"funFact":"Speech therapists also help people learn to swallow safely after an injury — it is more complex than you think!","future":true,"wage":"$89,290/yr"},
    {"id":"teacher","cat":"helpers","emoji":"📚","name":"Teacher","short":"Help kids learn and discover the world!","detail":"Teachers help kids read, do math, and understand history. A great teacher can change a life forever — one of the most important jobs in the world!","typicalDay":"Prepare fun lessons the night before. Greet every student at the door with a smile. Teach, ask questions, and watch the moment something clicks for a student. Grade work and plan tomorrow!","skills":["Patience","Explaining clearly","Creativity","Caring about people"],"funFact":"The average teacher inspires over 3,000 students in their career — that is a lot of lives changed!","future":false,"wage":"$65,220/yr"},
    {"id":"vet","cat":"helpers","emoji":"🐾","name":"Veterinarian","short":"Take care of sick and injured animals!","detail":"Veterinarians are doctors for animals — from puppies to zoo animals. They diagnose illnesses, do surgeries, and keep animals healthy!","typicalDay":"Check in nervous puppies getting their vaccines. Examine a cat with a sore paw. Perform surgery on an animal that needs help. See happy owners take their healthy pets back home!","skills":["Love of animals","Science","Steady hands","Calming nervous animals"],"funFact":"Zoo vets sometimes have to perform surgery on animals like elephants and giraffes!","future":false,"wage":"$119,100/yr"},
    {"id":"socialworker","cat":"helpers","emoji":"🏡","name":"Social Worker","short":"Help families going through tough times!","detail":"Social workers connect families with food, housing, and support. They make sure children are safe and help adults through hard situations.","typicalDay":"Visit a family to check that children are safe and happy. Connect a struggling parent with free food and housing help. Talk with kids to make sure they feel loved. Write reports to keep records of who you helped.","skills":["Empathy","Listening","Problem solving","Staying strong emotionally"],"funFact":"Social workers helped create many of the safety programs that millions of families depend on today!","future":true,"wage":"$58,380/yr"},
    {"id":"healthmanager","cat":"leaders","emoji":"🏥","name":"Health Manager","short":"Run hospitals so everything works perfectly!","detail":"Health managers keep hospitals and clinics running. They manage staff and budgets to make sure patients get excellent care. Growing fast!","typicalDay":"Meet with doctors and nurses to solve problems. Check that the hospital has enough medicines and equipment. Review patient feedback to improve care. Plan how to make the hospital even better!","skills":["Organization","Leadership","Problem solving","Understanding medical systems"],"funFact":"A big hospital is like a small city — it needs managers to keep hundreds of workers and systems running smoothly!","future":true,"wage":"$110,680/yr"},
    {"id":"entrepreneur","cat":"leaders","emoji":"💡","name":"Entrepreneur","short":"Start your own business and make your ideas real!","detail":"Entrepreneurs see a problem and build a business to solve it. Every big company started with one person who believed in their dream!","typicalDay":"Wake up excited about your idea. Meet with your team and solve problems together. Talk to customers to understand what they need. Make decisions that shape the future of your company!","skills":["Creativity","Bravery","Problem solving","Never giving up"],"funFact":"Mark Zuckerberg started Facebook in his college dorm room — now it has over 3 billion users!","future":false,"wage":"Varies"},
    {"id":"coach","cat":"leaders","emoji":"🏆","name":"Sports Coach","short":"Train athletes and help your team win!","detail":"Sports coaches teach skills, develop strategies, and motivate teams to give their best. Great coaches make great champions!","typicalDay":"Run practice drills to sharpen skills. Watch video footage of last game to find ways to improve. Give a motivating speech before the big match. Cheer your team on and make adjustments during the game!","skills":["Understanding the sport","Leadership","Communication","Reading people"],"funFact":"The greatest coaches often say winning is not about talent — it is about teaching teamwork!","future":false,"wage":"$48,140/yr"},
    {"id":"lawyer","cat":"leaders","emoji":"⚖️","name":"Lawyer","short":"Stand up for people and make sure justice is served!","detail":"Lawyers defend people in court and protect everyone rights. Some fight for the environment, some help families, some work in space law!","typicalDay":"Read through stacks of documents to build your case. Meet with your client to prepare them for court. Stand up in front of a judge and argue passionately for what is right. Wait for the verdict!","skills":["Reading and writing","Public speaking","Logic","Caring about fairness"],"funFact":"There is a real area of law called space law that governs what humans can do on the Moon and other planets!","future":false,"wage":"$145,760/yr"},
    {"id":"pilot","cat":"leaders","emoji":"✈️","name":"Airline Pilot","short":"Fly giant planes full of passengers!","detail":"Airline pilots fly planes to cities all over the world. They train for years to safely carry hundreds of passengers at once.","typicalDay":"Arrive at the airport and check the weather and flight plan. Walk around the plane to inspect it. Greet the passengers and get permission from air traffic control. Take off and fly to an exciting destination!","skills":["Focus and concentration","Quick decisions","Teamwork with co-pilot","Staying calm"],"funFact":"Airline pilots see more sunrises than almost any other profession because they fly across time zones!","future":false,"wage":"$171,210/yr"},
    {"id":"financialplanner","cat":"organizers","emoji":"💰","name":"Financial Planner","short":"Help families save money and plan for the future!","detail":"Financial planners help people figure out how to save for college, a house, or retirement. They turn confusing money questions into simple plans!","typicalDay":"Meet with a family and listen to their money goals. Look at their spending and find ways to save more. Create a simple plan that shows exactly what to do each month. Check in later to see how they are doing!","skills":["Math","Listening","Explaining clearly","Trustworthiness"],"funFact":"If you save just a small amount every month starting young, it can grow into a million dollars by retirement!","future":false,"wage":"$99,580/yr"},
    {"id":"urbanplanner","cat":"organizers","emoji":"🏙️","name":"Urban Planner","short":"Design the layout of cities!","detail":"Urban planners decide where buildings, parks, and roads go in a city. They shape communities where thousands of people live!","typicalDay":"Study a map of the city and find areas that need improvement. Meet with residents to hear what they want more of — parks, bike lanes, or playgrounds. Create a plan and present it to city leaders!","skills":["Problem solving","Working with maps","Listening to people","Long-term thinking"],"funFact":"Some cities are designed so you can walk to everything you need — urban planners make that possible!","future":false,"wage":"$81,800/yr"},
    {"id":"logistics","cat":"organizers","emoji":"📦","name":"Logistics Manager","short":"Make sure packages get where they need to go!","detail":"Logistics managers figure out the fastest way to move products around the world. Every package that arrives on time is thanks to them!","typicalDay":"Check the tracking systems to see where thousands of packages are. Solve problems when a truck breaks down or a storm delays a shipment. Coordinate with teams in different countries. Make sure everything arrives on time!","skills":["Organization","Problem solving","Math","Staying calm under pressure"],"funFact":"Amazon moves over 30 million packages every single day — logistics managers make that happen!","future":false,"wage":"$103,380/yr"},
    {"id":"dba","cat":"organizers","emoji":"🗄️","name":"Database Admin","short":"Organize and protect huge amounts of information!","detail":"Database administrators organize millions of pieces of data so companies can find what they need in seconds. They also keep data safe!","typicalDay":"Check that all the databases are running smoothly. Set up backups so no data is ever lost. Help the team find the information they need quickly. Protect everything from hackers and accidents!","skills":["Attention to detail","Computer programming","Problem solving","Organization"],"funFact":"Google processes over 8 billion searches every day — that all runs on giant databases managed by experts!","future":false,"wage":"$112,120/yr"},
    {"id":"accountant","cat":"organizers","emoji":"🧮","name":"Accountant","short":"Track money and make sure everything adds up!","detail":"Accountants keep track of money coming in and going out of businesses. They help companies stay healthy and make sure taxes are done right!","typicalDay":"Review the numbers from yesterday to make sure everything balances. Find any mistakes and fix them. Create reports that show how the business is doing. Help the boss make smart decisions with money!","skills":["Math","Attention to detail","Organization","Trustworthiness"],"funFact":"Accounting is one of the oldest professions in history — ancient Egyptians kept financial records over 5,000 years ago!","future":false,"wage":"$79,880/yr"}
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
