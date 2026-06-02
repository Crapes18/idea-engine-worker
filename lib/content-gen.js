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
    {"id":"wind","cat":"builders","emoji":"🌬️","name":"Wind Turbine Technician","short":"Fix giant wind turbines that make clean energy!","detail":"Wind turbine technicians climb turbines as tall as a 20-story building. They keep the blades spinning to make electricity from the wind.","typicalDay":"Wake up early and drive to a wind farm. Climb up inside a giant turbine and check all the parts. Use tools to fix anything that is broken. Watch the blades start spinning again!","skills":["Climbing","Tool use","Problem solving","Safety awareness"],"funFact":"One wind turbine can power about 1,500 homes for a whole year!","education":"Trade Certificate","future":true,"wage":"$62,580/yr"},
    {"id":"solar","cat":"builders","emoji":"☀️","name":"Solar Installer","short":"Put solar panels on rooftops to catch sunlight!","detail":"Solar installers put panels on rooftops and fields to turn sunlight into electricity. Solar jobs are one of the fastest growing in America!","typicalDay":"Load solar panels into the truck and drive to a house. Climb up on the roof safely. Connect the panels together and wire them to the house. Test everything to make sure it works!","skills":["Working at heights","Electrical wiring","Teamwork","Math"],"funFact":"The sun sends more energy to Earth in one hour than all humans use in a whole year!","education":"High School Diploma","future":true,"wage":"$51,860/yr"},
    {"id":"electrician","cat":"builders","emoji":"⚡","name":"Electrician","short":"Wire up buildings so the lights turn on!","detail":"Electricians install and fix all the wires in homes, schools, and buildings. Without them nothing with a plug would work!","typicalDay":"Read the building plans to find where wires should go. Drill holes through walls to run cables. Connect wires to outlets and switches. Test everything to make sure it is safe!","skills":["Reading blueprints","Problem solving","Attention to detail","Safety"],"funFact":"The electricity in your home travels through wires at nearly the speed of light!","education":"Trade Certificate","future":false,"wage":"$61,590/yr"},
    {"id":"firefighter","cat":"builders","emoji":"🚒","name":"Firefighter","short":"Race to emergencies and rescue people!","detail":"Firefighters put out fires and rescue people from danger. They train every day to be ready to help in an instant.","typicalDay":"Start the day exercising and checking all the equipment. Cook meals with the team at the fire station. When the alarm rings, jump in the truck and race to help! After the emergency, clean everything and get ready for the next call.","skills":["Physical fitness","Teamwork","Staying calm under pressure","First aid"],"funFact":"Firefighters can be called to over 30 different types of emergencies, not just fires!","education":"High School Diploma","future":false,"wage":"$53,240/yr"},
    {"id":"chef","cat":"builders","emoji":"👨‍🍳","name":"Chef","short":"Create amazing meals that make people happy!","detail":"Chefs design menus and cook incredible food in restaurants and on TV. A great meal can make someone feel wonderful!","typicalDay":"Arrive at the restaurant and check fresh ingredients. Plan the day's menu with the team. Start cooking and tasting to make sure everything is delicious. Watch happy guests enjoy your food!","skills":["Creativity","Tasting and smell","Knife skills","Team leadership"],"funFact":"Some chefs travel the whole world just to learn new recipes and cooking techniques!","education":"No Degree Required","future":false,"wage":"$59,430/yr"},
    {"id":"data","cat":"discoverers","emoji":"📊","name":"Data Scientist","short":"Find hidden patterns in huge amounts of data!","detail":"Data scientists use math and computers to find patterns that help companies make smarter decisions. One of the fastest growing jobs!","typicalDay":"Open your computer and look at millions of numbers. Write code to find patterns nobody else can see. Create colorful charts to show what you discovered. Tell your team what the data says!","skills":["Math","Computer coding","Curiosity","Explaining ideas clearly"],"funFact":"Netflix uses data science to pick which shows to make — so data scientists helped create your favorite shows!","education":"Bachelor's Degree","future":true,"wage":"$108,020/yr"},
    {"id":"cybersecurity","cat":"discoverers","emoji":"🛡️","name":"Cybersecurity Analyst","short":"Protect computers from hackers!","detail":"Cybersecurity analysts are digital superheroes who stop hackers and keep computers safe. This job is growing super fast!","typicalDay":"Check the computer systems for any suspicious activity. Set up digital traps to catch hackers. Test the security by pretending to be a hacker yourself. Keep everything locked up tight!","skills":["Computer skills","Problem solving","Thinking like a bad guy","Patience"],"funFact":"There are over 3 billion cyber attacks every single day — cybersecurity experts stop most of them!","education":"Bachelor's Degree","future":true,"wage":"$120,360/yr"},
    {"id":"developer","cat":"discoverers","emoji":"💻","name":"Software Developer","short":"Write the code that makes apps and games work!","detail":"Software developers build everything you use on a phone or computer. From games to maps to video calls — a developer built it!","typicalDay":"Plan what you want to build by drawing it out. Write lines of code that tell the computer what to do. Test it to find any bugs. Fix the bugs and share your creation with the world!","skills":["Logical thinking","Coding","Creativity","Persistence"],"funFact":"The first computer bug was an actual bug — a moth got stuck inside a computer in 1947!","education":"Bachelor's Degree","future":true,"wage":"$132,270/yr"},
    {"id":"marine","cat":"discoverers","emoji":"🐬","name":"Marine Biologist","short":"Study dolphins and amazing ocean animals!","detail":"Marine biologists dive underwater and sail the seas to study ocean life. They discover new species and help protect our oceans.","typicalDay":"Wake up on a research boat and watch the sunrise over the ocean. Put on scuba gear and dive in to observe sea creatures. Take notes and photographs. Back on the boat, write about what you discovered!","skills":["Swimming","Observation","Science","Patience"],"funFact":"Over 80% of the ocean is still unexplored — marine biologists are discovering new creatures every year!","education":"Bachelor's Degree","future":false,"wage":"$67,760/yr"},
    {"id":"robotics","cat":"discoverers","emoji":"🤖","name":"Robotics Engineer","short":"Design and build amazing robots!","detail":"Robotics engineers build robots that perform surgery, explore Mars, and build cars. As robots get smarter, this job keeps growing!","typicalDay":"Sketch a new robot design on the computer. Build parts in the workshop with special machines. Program the robot to move and think. Test it and watch it do something amazing!","skills":["Engineering","Computer programming","Math","Creative thinking"],"funFact":"The Mars rovers are robots built by engineers — they have been exploring Mars for over 20 years!","education":"Bachelor's Degree","future":true,"wage":"$104,600/yr"},
    {"id":"game","cat":"creators","emoji":"🎮","name":"Game Designer","short":"Create the worlds and adventures in video games!","detail":"Game designers invent entire worlds for people to explore. Your favorite games were made by a team of passionate designers!","typicalDay":"Draw ideas for new characters and levels in your sketchbook. Meet with the art team to bring your ideas to life. Play the game to test if it is fun. Make changes until it feels just right!","skills":["Creativity","Storytelling","Drawing","Understanding what makes things fun"],"funFact":"The video game industry makes more money than movies and music combined!","education":"Bachelor's Degree","future":true,"wage":"$132,270/yr"},
    {"id":"animator","cat":"creators","emoji":"🎬","name":"Animator","short":"Bring cartoon characters to life!","detail":"Animators make characters move by drawing or using computers. Every Pixar movie and cartoon character was brought to life by an animator!","typicalDay":"Review the scene you need to animate today. Draw or move the character one tiny step at a time — sometimes hundreds of drawings for one second! Watch it play back and adjust until it looks perfect.","skills":["Drawing","Attention to detail","Storytelling","Patience"],"funFact":"One second of animation in a Pixar movie can take weeks to create!","education":"Bachelor's Degree","future":false,"wage":"$106,810/yr"},
    {"id":"architect","cat":"creators","emoji":"🏗️","name":"Architect","short":"Design beautiful buildings and skyscrapers!","detail":"Architects draw plans for buildings before they are built. They decide how a building looks, how rooms fit together, and how to make it safe.","typicalDay":"Meet with clients to hear what they want. Sketch the building design on paper and the computer. Calculate if the structure will be safe and strong. Watch your design slowly become a real building!","skills":["Drawing","Math","Creative thinking","Problem solving"],"funFact":"The ancient pyramids of Egypt are over 4,000 years old — and architects still study them today!","education":"Bachelor's Degree","future":false,"wage":"$95,560/yr"},
    {"id":"uxdesigner","cat":"creators","emoji":"📱","name":"UX Designer","short":"Design apps so they are fun and easy to use!","detail":"UX designers decide how apps look and feel. Every app you love had a UX designer who made sure the buttons were easy to find!","typicalDay":"Talk to real people to find out what confuses them about an app. Sketch new designs on paper. Build a simple version and watch people use it. Make improvements based on what you learn!","skills":["Empathy","Drawing","Problem solving","Understanding people"],"funFact":"A good UX designer can make an app 10 times faster to use just by moving one button!","education":"Bachelor's Degree","future":true,"wage":"$103,220/yr"},
    {"id":"photographer","cat":"creators","emoji":"📸","name":"Photographer","short":"Capture amazing moments with a camera!","detail":"Photographers take pictures at weddings, sports events, and for magazines. Wildlife photographers travel to jungles to capture animals!","typicalDay":"Pack your camera and lenses. Travel to an amazing location — maybe a wedding, a sports game, or a jungle! Wait patiently for the perfect moment. Click! Edit the photos to make them look beautiful.","skills":["Patience","Creativity","Technical camera knowledge","Storytelling through images"],"funFact":"Wildlife photographers sometimes wait in the same spot for days just to get one perfect shot!","education":"No Degree Required","future":false,"wage":"$40,760/yr"},
    {"id":"nurse","cat":"helpers","emoji":"👩‍⚕️","name":"Nurse Practitioner","short":"Diagnose and treat patients just like a doctor!","detail":"Nurse practitioners examine patients, figure out what is wrong, and give medicine to make them better. One of the fastest growing jobs!","typicalDay":"See patients one by one — listen to their hearts, check their temperature, ask how they feel. Figure out what might be wrong. Prescribe medicine or treatment. Make sure they leave feeling cared for!","skills":["Caring for others","Science","Listening","Staying calm"],"funFact":"Nurse practitioners see more patients every year than many doctors and often spend more time with each one!","education":"Master's Degree","future":true,"wage":"$129,210/yr"},
    {"id":"speech","cat":"helpers","emoji":"🗣️","name":"Speech Therapist","short":"Help people who have trouble speaking!","detail":"Speech therapists help kids and adults learn to speak clearly using fun games and exercises. They are incredibly patient helpers!","typicalDay":"Work with a child using fun games to practice sounds. Teach tongue exercises that strengthen mouth muscles. Celebrate every small improvement — saying one word correctly is a big victory!","skills":["Patience","Creativity with games","Science of language","Encouragement"],"funFact":"Speech therapists also help people learn to swallow safely after an injury — it is more complex than you think!","education":"Master's Degree","future":true,"wage":"$89,290/yr"},
    {"id":"teacher","cat":"helpers","emoji":"📚","name":"Teacher","short":"Help kids learn and discover the world!","detail":"Teachers help kids read, do math, and understand history. A great teacher can change a life forever — one of the most important jobs in the world!","typicalDay":"Prepare fun lessons the night before. Greet every student at the door with a smile. Teach, ask questions, and watch the moment something clicks for a student. Grade work and plan tomorrow!","skills":["Patience","Explaining clearly","Creativity","Caring about people"],"funFact":"The average teacher inspires over 3,000 students in their career — that is a lot of lives changed!","education":"Bachelor's Degree","future":false,"wage":"$65,220/yr"},
    {"id":"vet","cat":"helpers","emoji":"🐾","name":"Veterinarian","short":"Take care of sick and injured animals!","detail":"Veterinarians are doctors for animals — from puppies to zoo animals. They diagnose illnesses, do surgeries, and keep animals healthy!","typicalDay":"Check in nervous puppies getting their vaccines. Examine a cat with a sore paw. Perform surgery on an animal that needs help. See happy owners take their healthy pets back home!","skills":["Love of animals","Science","Steady hands","Calming nervous animals"],"funFact":"Zoo vets sometimes have to perform surgery on animals like elephants and giraffes!","education":"Doctorate","future":false,"wage":"$119,100/yr"},
    {"id":"socialworker","cat":"helpers","emoji":"🏡","name":"Social Worker","short":"Help families going through tough times!","detail":"Social workers connect families with food, housing, and support. They make sure children are safe and help adults through hard situations.","typicalDay":"Visit a family to check that children are safe and happy. Connect a struggling parent with free food and housing help. Talk with kids to make sure they feel loved. Write reports to keep records of who you helped.","skills":["Empathy","Listening","Problem solving","Staying strong emotionally"],"funFact":"Social workers helped create many of the safety programs that millions of families depend on today!","education":"Bachelor's Degree","future":true,"wage":"$58,380/yr"},
    {"id":"healthmanager","cat":"leaders","emoji":"🏥","name":"Health Manager","short":"Run hospitals so everything works perfectly!","detail":"Health managers keep hospitals and clinics running. They manage staff and budgets to make sure patients get excellent care. Growing fast!","typicalDay":"Meet with doctors and nurses to solve problems. Check that the hospital has enough medicines and equipment. Review patient feedback to improve care. Plan how to make the hospital even better!","skills":["Organization","Leadership","Problem solving","Understanding medical systems"],"funFact":"A big hospital is like a small city — it needs managers to keep hundreds of workers and systems running smoothly!","education":"Bachelor's Degree","future":true,"wage":"$110,680/yr"},
    {"id":"entrepreneur","cat":"leaders","emoji":"💡","name":"Entrepreneur","short":"Start your own business and make your ideas real!","detail":"Entrepreneurs see a problem and build a business to solve it. Every big company started with one person who believed in their dream!","typicalDay":"Wake up excited about your idea. Meet with your team and solve problems together. Talk to customers to understand what they need. Make decisions that shape the future of your company!","skills":["Creativity","Bravery","Problem solving","Never giving up"],"funFact":"Mark Zuckerberg started Facebook in his college dorm room — now it has over 3 billion users!","education":"No Degree Required","future":false,"wage":"Varies"},
    {"id":"coach","cat":"leaders","emoji":"🏆","name":"Sports Coach","short":"Train athletes and help your team win!","detail":"Sports coaches teach skills, develop strategies, and motivate teams to give their best. Great coaches make great champions!","typicalDay":"Run practice drills to sharpen skills. Watch video footage of last game to find ways to improve. Give a motivating speech before the big match. Cheer your team on and make adjustments during the game!","skills":["Understanding the sport","Leadership","Communication","Reading people"],"funFact":"The greatest coaches often say winning is not about talent — it is about teaching teamwork!","education":"Bachelor's Degree","future":false,"wage":"$48,140/yr"},
    {"id":"lawyer","cat":"leaders","emoji":"⚖️","name":"Lawyer","short":"Stand up for people and make sure justice is served!","detail":"Lawyers defend people in court and protect everyone rights. Some fight for the environment, some help families, some work in space law!","typicalDay":"Read through stacks of documents to build your case. Meet with your client to prepare them for court. Stand up in front of a judge and argue passionately for what is right. Wait for the verdict!","skills":["Reading and writing","Public speaking","Logic","Caring about fairness"],"funFact":"There is a real area of law called space law that governs what humans can do on the Moon and other planets!","education":"Doctorate (JD)","future":false,"wage":"$145,760/yr"},
    {"id":"pilot","cat":"leaders","emoji":"✈️","name":"Airline Pilot","short":"Fly giant planes full of passengers!","detail":"Airline pilots fly planes to cities all over the world. They train for years to safely carry hundreds of passengers at once.","typicalDay":"Arrive at the airport and check the weather and flight plan. Walk around the plane to inspect it. Greet the passengers and get permission from air traffic control. Take off and fly to an exciting destination!","skills":["Focus and concentration","Quick decisions","Teamwork with co-pilot","Staying calm"],"funFact":"Airline pilots see more sunrises than almost any other profession because they fly across time zones!","education":"Bachelor's Degree","future":false,"wage":"$171,210/yr"},
    {"id":"financialplanner","cat":"organizers","emoji":"💰","name":"Financial Planner","short":"Help families save money and plan for the future!","detail":"Financial planners help people figure out how to save for college, a house, or retirement. They turn confusing money questions into simple plans!","typicalDay":"Meet with a family and listen to their money goals. Look at their spending and find ways to save more. Create a simple plan that shows exactly what to do each month. Check in later to see how they are doing!","skills":["Math","Listening","Explaining clearly","Trustworthiness"],"funFact":"If you save just a small amount every month starting young, it can grow into a million dollars by retirement!","education":"Bachelor's Degree","future":false,"wage":"$99,580/yr"},
    {"id":"urbanplanner","cat":"organizers","emoji":"🏙️","name":"Urban Planner","short":"Design the layout of cities!","detail":"Urban planners decide where buildings, parks, and roads go in a city. They shape communities where thousands of people live!","typicalDay":"Study a map of the city and find areas that need improvement. Meet with residents to hear what they want more of — parks, bike lanes, or playgrounds. Create a plan and present it to city leaders!","skills":["Problem solving","Working with maps","Listening to people","Long-term thinking"],"funFact":"Some cities are designed so you can walk to everything you need — urban planners make that possible!","education":"Bachelor's Degree","future":false,"wage":"$81,800/yr"},
    {"id":"logistics","cat":"organizers","emoji":"📦","name":"Logistics Manager","short":"Make sure packages get where they need to go!","detail":"Logistics managers figure out the fastest way to move products around the world. Every package that arrives on time is thanks to them!","typicalDay":"Check the tracking systems to see where thousands of packages are. Solve problems when a truck breaks down or a storm delays a shipment. Coordinate with teams in different countries. Make sure everything arrives on time!","skills":["Organization","Problem solving","Math","Staying calm under pressure"],"funFact":"Amazon moves over 30 million packages every single day — logistics managers make that happen!","education":"Bachelor's Degree","future":false,"wage":"$103,380/yr"},
    {"id":"dba","cat":"organizers","emoji":"🗄️","name":"Database Admin","short":"Organize and protect huge amounts of information!","detail":"Database administrators organize millions of pieces of data so companies can find what they need in seconds. They also keep data safe!","typicalDay":"Check that all the databases are running smoothly. Set up backups so no data is ever lost. Help the team find the information they need quickly. Protect everything from hackers and accidents!","skills":["Attention to detail","Computer programming","Problem solving","Organization"],"funFact":"Google processes over 8 billion searches every day — that all runs on giant databases managed by experts!","education":"Bachelor's Degree","future":false,"wage":"$112,120/yr"},
    {"id":"accountant","cat":"organizers","emoji":"🧮","name":"Accountant","short":"Track money and make sure everything adds up!","detail":"Accountants keep track of money coming in and going out of businesses. They help companies stay healthy and make sure taxes are done right!","typicalDay":"Review the numbers from yesterday to make sure everything balances. Find any mistakes and fix them. Create reports that show how the business is doing. Help the boss make smart decisions with money!","skills":["Math","Attention to detail","Organization","Trustworthiness"],"funFact":"Accounting is one of the oldest professions in history — ancient Egyptians kept financial records over 5,000 years ago!","education":"Bachelor's Degree","future":false,"wage":"$79,880/yr"},
    {"id":"plumber","cat":"builders","emoji":"🔧","name":"Plumber","short":"Fix pipes so water flows where it should!","detail":"Plumbers install and fix the pipes that carry water and gas through homes, schools, and buildings. Without them we would have no running water or working toilets!","typicalDay":"Read the building plans to find where pipes go. Cut and connect pipes with special tools. Test for leaks to make sure everything is watertight. Fix a clogged drain and make a homeowner very happy!","skills":["Problem solving","Working with tools","Reading blueprints","Physical strength"],"funFact":"Ancient Romans were some of the first plumbers — they built massive pipe systems over 2,000 years ago!","education":"Trade Certificate","future":false,"wage":"$61,550/yr"},
    {"id":"hvac","cat":"builders","emoji":"❄️","name":"HVAC Technician","short":"Keep buildings warm in winter and cool in summer!","detail":"HVAC technicians install and fix heating, air conditioning, and ventilation systems. They make sure every building stays comfortable all year round!","typicalDay":"Drive to a home where the air conditioning stopped working. Diagnose the problem using special tools. Replace the broken part and test the system. Feel the cool air start flowing again!","skills":["Electrical knowledge","Problem solving","Tool use","Attention to detail"],"funFact":"HVAC technicians help save energy — a well-maintained system can cut electricity bills by 30%!","education":"Trade Certificate","future":true,"wage":"$57,300/yr"},
    {"id":"carpenter","cat":"builders","emoji":"🪚","name":"Carpenter","short":"Build houses, furniture, and amazing wooden structures!","detail":"Carpenters measure, cut, and shape wood to build houses, cabinets, decks, and furniture. Almost every building you have ever been in was partly built by a carpenter!","typicalDay":"Study the building blueprints in the morning. Measure and cut lumber to exact sizes. Nail and glue pieces together to build walls and floors. Step back and see a room taking shape!","skills":["Precision measuring","Tool safety","Spatial thinking","Physical strength"],"funFact":"Master carpenters can build an entire house frame using only hand tools — no power tools needed!","education":"Trade Certificate","future":false,"wage":"$56,350/yr"},
    {"id":"pa","cat":"discoverers","emoji":"🩺","name":"Physician Assistant","short":"Diagnose and treat patients with the skills of a doctor!","detail":"Physician assistants examine patients, order tests, and prescribe medicine — almost everything a doctor does. This is one of the fastest-growing and best-paid jobs in America!","typicalDay":"See patients back to back — check symptoms, order blood tests, prescribe medicine. Perform a minor procedure on one patient. Consult with a doctor on a tough case. Help 20 people feel better in one day!","skills":["Medical knowledge","Critical thinking","Compassion","Communication"],"funFact":"Physician assistants were first trained to help with the doctor shortage after World War II — and the shortage has never gone away!","education":"Master's Degree","future":true,"wage":"$130,020/yr"},
    {"id":"envsci","cat":"discoverers","emoji":"🌿","name":"Environmental Scientist","short":"Protect the planet by studying air, water, and soil!","detail":"Environmental scientists collect samples, run tests, and study pollution to protect our air, water, and land. They help make laws that keep our planet healthy for future generations!","typicalDay":"Drive to a river and collect water samples in special bottles. Test the samples in the lab for pollution. Write a report for the government. Help design a plan to clean up a contaminated site!","skills":["Science","Data analysis","Field work","Problem solving"],"funFact":"Environmental scientists discovered that a single tree can absorb up to 48 pounds of carbon dioxide per year!","education":"Bachelor's Degree","future":false,"wage":"$76,480/yr"},
    {"id":"forensicsci","cat":"discoverers","emoji":"🔍","name":"Forensic Scientist","short":"Solve crimes using science — just like a real detective!","detail":"Forensic scientists analyze fingerprints, DNA, and physical evidence from crime scenes to help solve mysteries. This job combines science with detective work!","typicalDay":"Receive evidence from a crime scene in a sealed bag. Examine fingerprints under a powerful microscope. Run DNA tests that take hours. Write a scientific report for the police and court!","skills":["Attention to detail","Chemistry","Patience","Scientific thinking"],"funFact":"Forensic scientists can identify a person from just 13 DNA markers — and no two people in the world share the same DNA!","education":"Bachelor's Degree","future":true,"wage":"$63,740/yr"},
    {"id":"astronaut","cat":"discoverers","emoji":"🚀","name":"Astronaut","short":"Travel to space and explore the universe!","detail":"Astronauts train for years to live and work in space. They conduct scientific experiments, repair spacecraft, and help humans learn how to survive beyond Earth!","typicalDay":"Exercise for two hours to stay strong in zero gravity. Conduct a science experiment floating in the space station. Do a spacewalk to fix a solar panel outside the station. Call your family on Earth!","skills":["Science and math","Physical fitness","Problem solving","Staying calm under pressure"],"funFact":"Astronauts on the International Space Station see 16 sunrises every single day because they orbit Earth every 90 minutes!","education":"Master's Degree","future":true,"wage":"$104,898/yr"},
    {"id":"interiordesigner","cat":"creators","emoji":"🛋️","name":"Interior Designer","short":"Design the inside of homes, offices, and restaurants!","detail":"Interior designers choose colors, furniture, lighting, and layouts to make indoor spaces beautiful and functional. Every room you love the look of was designed by someone!","typicalDay":"Meet a client and hear their dream vision for their new home. Create a mood board with colors and furniture ideas. Shop for the perfect couch. Visit the finished room and see their jaw drop!","skills":["Creativity","Color sense","Spatial thinking","Client communication"],"funFact":"The most expensive interior design project ever cost over $1 billion — it was a royal palace in the Middle East!","education":"Bachelor's Degree","future":false,"wage":"$64,040/yr"},
    {"id":"fashiondesigner","cat":"creators","emoji":"👗","name":"Fashion Designer","short":"Create clothes and accessories that people love to wear!","detail":"Fashion designers sketch outfits, choose fabrics, and work with seamstresses to bring their vision to life. Their collections end up in stores and on runways around the world!","typicalDay":"Sketch new outfit ideas in your notebook. Choose fabric samples and feel the textures. Work with a tailor to construct a prototype dress. Present your collection at a fashion show!","skills":["Drawing","Color and texture","Creativity","Trend awareness"],"funFact":"The average person buys about 68 new pieces of clothing per year — fashion designers make all of that possible!","education":"Bachelor's Degree","future":false,"wage":"$82,820/yr"},
    {"id":"soundengineer","cat":"creators","emoji":"🎚️","name":"Sound Engineer","short":"Mix music and create the perfect sound for songs and movies!","detail":"Sound engineers use technology to record, mix, and produce audio. Every song you have ever heard on the radio, every movie soundtrack — a sound engineer made it sound amazing!","typicalDay":"Set up microphones around a drum kit in the recording studio. Record a band playing their new song. Adjust levels on hundreds of knobs to get the perfect mix. Send the finished track to the musicians!","skills":["Listening carefully","Technology","Creativity","Patience"],"funFact":"It can take hundreds of hours of recording and mixing to produce a 3-minute pop song!","education":"Some College","future":false,"wage":"$57,500/yr"},
    {"id":"graphicdesigner","cat":"creators","emoji":"✏️","name":"Graphic Designer","short":"Create logos, posters, and digital art for brands and businesses!","detail":"Graphic designers use computers and artistic skills to create visual content — logos, websites, advertisements, and packaging. Everything you see that looks good was designed by someone!","typicalDay":"Get a brief from a client who needs a new logo. Sketch dozens of ideas on paper. Create the best ones on the computer. Present three options to the client and get feedback!","skills":["Drawing","Computer design software","Creativity","Understanding brands"],"funFact":"The Nike swoosh logo was designed by a college student in 1971 for just $35 — it is now worth billions!","education":"Bachelor's Degree","future":false,"wage":"$58,910/yr"},
    {"id":"dentalhygienist","cat":"helpers","emoji":"🦷","name":"Dental Hygienist","short":"Clean teeth and help people have healthy, bright smiles!","detail":"Dental hygienists clean teeth, take X-rays, and teach patients how to care for their mouths. Healthy teeth are important for overall health!","typicalDay":"Welcome a nervous patient and put them at ease. Clean their teeth thoroughly with special tools. Take X-rays to check for cavities. Teach them the right way to floss and brush!","skills":["Attention to detail","Gentle hands","Patience","Communication"],"funFact":"Dental hygienists help prevent heart disease — research shows that gum disease is linked to heart problems!","education":"Associate Degree","future":false,"wage":"$87,530/yr"},
    {"id":"ot","cat":"helpers","emoji":"🙌","name":"Occupational Therapist","short":"Help people relearn everyday tasks after illness or injury!","detail":"Occupational therapists help people who have had strokes, injuries, or disabilities relearn how to do everyday things like getting dressed, cooking, and working. Their creativity and patience changes lives!","typicalDay":"Work with a stroke patient on picking up objects with their weakened hand. Play adaptive games with a child who has developmental delays. Teach a veteran how to use a prosthetic arm. Celebrate every tiny victory!","skills":["Patience","Creativity","Medical knowledge","Encouragement"],"funFact":"Occupational therapists sometimes invent completely new tools and devices to help their patients — they are part therapist, part inventor!","education":"Master's Degree","future":true,"wage":"$96,370/yr"},
    {"id":"emt","cat":"helpers","emoji":"🚑","name":"EMT / Paramedic","short":"Race to emergencies and save lives in the field!","detail":"EMTs and paramedics respond to emergencies — car accidents, heart attacks, falls — and provide critical medical care before patients reach the hospital. Every second counts!","typicalDay":"Start the shift by checking all the equipment in the ambulance. Get a call about a car accident and race to the scene with lights and sirens. Stabilize an injured person and rush them to the hospital. Save a life!","skills":["Staying calm under pressure","Medical skills","Quick decisions","Physical strength"],"funFact":"Paramedics can perform over 40 different medical procedures in the field — including delivering babies!","education":"Trade Certificate","future":true,"wage":"$42,000/yr"},
    {"id":"geneticcounselor","cat":"helpers","emoji":"🧬","name":"Genetic Counselor","short":"Help families understand their DNA and health risks!","detail":"Genetic counselors analyze family medical history and DNA test results to help people understand their risk of inherited diseases. They guide families through some of the most important health decisions of their lives!","typicalDay":"Meet with a family worried about an inherited disease. Explain DNA test results in simple language they can understand. Help them decide on next steps. Provide emotional support during a scary time!","skills":["Science","Empathy","Communication","Ethics"],"funFact":"Every human has about 3 billion base pairs of DNA — genetic counselors help interpret what those differences mean for your health!","education":"Master's Degree","future":true,"wage":"$95,980/yr"},
    {"id":"emergencymgr","cat":"leaders","emoji":"🚨","name":"Emergency Manager","short":"Plan how cities and towns prepare for disasters!","detail":"Emergency managers plan for hurricanes, earthquakes, and other disasters before they happen. When disaster strikes, they coordinate the response to keep thousands of people safe!","typicalDay":"Run a practice drill simulating a hurricane evacuation. Update the city disaster plan based on last year's flood. Meet with police and fire chiefs to coordinate response teams. Brief the mayor on emergency preparedness!","skills":["Organization","Leadership","Communication","Thinking ahead"],"funFact":"Emergency managers helped save tens of thousands of lives by evacuating coastal areas before major hurricanes hit!","education":"Bachelor's Degree","future":false,"wage":"$81,690/yr"},
    {"id":"marketingmgr","cat":"leaders","emoji":"📣","name":"Marketing Manager","short":"Tell the world about amazing products in creative ways!","detail":"Marketing managers figure out how to get people excited about products and services. They create ad campaigns, use social media, and find creative ways to share stories that make people want to buy!","typicalDay":"Review the results of last week's social media campaign. Brainstorm creative ideas for a new advertisement. Meet with designers to create visual content. Watch the number of customers grow!","skills":["Creativity","Storytelling","Data analysis","Leadership"],"funFact":"Apple's famous 1984 Super Bowl commercial only aired once — but it is still considered the greatest ad ever made!","education":"Bachelor's Degree","future":false,"wage":"$156,580/yr"},
    {"id":"sportsagent","cat":"leaders","emoji":"🤝","name":"Sports Agent","short":"Represent athletes and negotiate their contracts!","detail":"Sports agents represent professional athletes, negotiate contracts, find sponsorship deals, and manage their clients careers. They help athletes earn millions and protect their interests!","typicalDay":"Call a team manager to negotiate a better contract for your athlete. Meet with a sportswear brand about a sponsorship deal. Advise your client on which team to sign with. Watch your player score a winning goal!","skills":["Negotiation","Communication","Business knowledge","Building relationships"],"funFact":"The most valuable sports contract ever negotiated was worth over $700 million — for a single baseball player!","education":"Bachelor's Degree","future":false,"wage":"Varies"},
    {"id":"hrmanager","cat":"organizers","emoji":"🤜","name":"HR Manager","short":"Help companies hire great people and build happy teams!","detail":"Human resources managers hire employees, resolve workplace conflicts, design benefits, and make sure everyone is treated fairly. They are the people who make a company a great place to work!","typicalDay":"Interview candidates for a new job opening. Help resolve a disagreement between two employees. Design a new wellness program for the whole company. Make sure everyone gets their paychecks on time!","skills":["Communication","Fairness","Organization","Understanding people"],"funFact":"Companies with great HR departments have employees who stay 40% longer — happy workers stick around!","education":"Bachelor's Degree","future":false,"wage":"$136,350/yr"},
    {"id":"eventplanner","cat":"organizers","emoji":"🎉","name":"Event Planner","short":"Organize unforgettable parties, weddings, and big events!","detail":"Event planners coordinate all the details of special occasions — from weddings to corporate conferences to music festivals. They make sure everything runs perfectly so clients can enjoy their big day!","typicalDay":"Visit a venue and measure the space for tables and a dance floor. Call the caterer to confirm the menu. Create a detailed timeline for the wedding day. Watch hundreds of guests have the time of their lives!","skills":["Organization","Creativity","Problem solving","Staying calm under pressure"],"funFact":"The most expensive wedding ever planned cost over $100 million — event planners love a big challenge!","education":"Bachelor's Degree","future":true,"wage":"$58,520/yr"}
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
