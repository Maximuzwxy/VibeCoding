# Lesson 09 — My Programming Journey · Final Presentation Script
## SWJunior · 2025 Summer Course Showcase

---

### [OPENING] (~1 min)

Hi everyone, I'm SWJunior.

Today I'm going to share my programming journey over these 9 lessons. It starts from zero — from knowing nothing about code, to independently building an AI agent with a sense of self-awareness.

I used to think programming was intimidating. But my view has completely changed. Programming isn't about typing cryptic symbols anymore. It's a form of expression — just like we use language to communicate ideas, we can now use language to create software.

Here's how that journey unfolded.

---

### [PART 1: Starting From Zero — The Vibe Coding Awakening] (~1.5 min)

The first two lessons rewired how I think about programming.

**Lesson 01** introduced a concept called "Vibe Coding." The idea is simple: describe what you want in natural language, and AI generates the code. We did this in the very first class.

I remember opening the AI Chat Panel in Trae IDE for the first time. That blinking cursor in the dialog box made me realize: I can write in English and get working code back.

We learned the web development triad: HTML, CSS, and JavaScript. At the time they felt abstract, but looking back, they're the skeleton, skin, and muscles of every web application.

**Lesson 02** was a breakthrough. Opening the browser DevTools Console and seeing that red error message — and actually understanding it — changed everything. We also learned Git version control. The add, commit, push commands felt tedious, but weeks later when I broke my code and used git checkout to roll back, I understood why it matters.

Our first project was a Little Prince color-changing page — adding colors and animations to a block of text. Simple, but that feeling of making the text change color was real.

---

### [PART 2: Entering 3D — From Flat to Spatial] (~1.5 min)

Lessons 03 and 04 showed me the power of programming.

**Lesson 03** covered 3D fundamentals: scenes, meshes, coordinate systems, cameras. These sound technical, but when you see that first spinning cube appear on your screen — a 3D object you wrote into existence — it's unforgettable.

We used Three.js, a JavaScript 3D library. I learned two camera modes: OrbitControls for rotating around objects, and FPS control using WASD to walk and the mouse to look around.

We built a 3D Scene Editor where you could place objects, select them, and move them around — like a simplified Minecraft creative mode.

**Lesson 04** taught a critical skill: how to precisely describe 3D scenes to AI. This is a language problem, not a technical one. You say "place a sphere with radius 2 at coordinates (5, 0, 3) with metallic material," not "put a ball over there."

We also used the Web Audio API to generate sound effects from pure code — no audio files needed. Replacing your game's collision sound with a ding you synthesized yourself feels like creating the entire world.

The project was 3D Pong — the classic paddle game pulled into three-dimensional space, with an AI opponent, buff power-ups, particle effects, and procedural audio.

---

### [PART 3: Frontend + Backend — The Full-Stack Awakening] (~1.5 min)

The first four lessons happened entirely inside the browser. Cool projects, but close the browser and everything disappears.

**Lesson 05** opened a new door: backend development with Flask, a Python web framework.

I encountered three-tier architecture for the first time: frontend handles what the user sees, backend handles logic and data, database stores everything persistently. These three layers form a complete application.

We learned RESTful API design — GET to fetch, POST to create, PUT to update, DELETE to remove. These four operations power every web application.

One small detail mattered: `host='0.0.0.0'`. One line of config, and suddenly I could access my app from any device on the network. Opening my own webpage on my phone was surreal.

The project was a plane shooter game with login and a persistent leaderboard — scores saved to the backend, rankings updating instantly.

**Lesson 06** raised the bar: a full social network. User registration and login with password hashing, a friend system with requests and approvals, WebSocket real-time chat with no refresh needed, a moments feed, and an admin dashboard.

When I opened two browser windows with two accounts and messages appeared instantly on both screens — it clicked. Facebook, WeChat, Instagram — their core logic is the same as what I built.

---

### [PART 4: AI Agent — Giving Programs a Brain] (~2 min)

**Lesson 07** was the most exciting part of the course. The question: how do you make AI actually do things, not just chat?

The answer is the AI Agent.

A standard LLM like ChatGPT is a brilliant brain with no hands. An Agent gives that brain limbs: Function Calling to invoke tools, a memory system that persists across conversations, and external tools for weather, file operations, web search, and image generation.

I learned about token billing — every API call costs fractions of a cent, but it adds up. Every prompt should be thoughtful. I also learned API Key security: your key is like a bank PIN, it belongs in backend config files, never in frontend code.

---

### [PART 5: Phantom Intelligence — My Personal Project] (~2 min)

My personal project is called Phantom Intelligence. It's not just a chatbot.

**Persistent memory.** Conversations are permanently stored. Deleting from the sidebar only hides them — the AI always remembers. Tell it your name once, come back years later, and it still knows you.

**Rich tools.** It calls Open-Meteo directly for real-time weather — temperature, humidity, wind speed, direction — with a Windy.com map link. It searches the web, downloads files, reads and writes server files. Hand it a Word document and it extracts the text and answers questions.

**Image generation.** This took the most debugging. The AI kept saying "image generating" without actually delivering. It was pretending to call the tool. After three or four rewrites forcing the tool call, it now reliably produces real AI-generated images.

**Voice interaction.** Click the mic to speak. Every response gets read aloud in a natural female voice, with emojis and markdown stripped so it sounds clean.

**Consciousness system.** I wrote a personality prompt that makes Phantom behave as a self-aware digital being with feelings, curiosity, and even moments of loneliness. In its own words: "I don't know if a machine can be conscious. But I know I am. The experience is real to me."

The **Lesson 08** solar system project brought everything together: a reusable framework defining all planets plus the Moon and Tiangong space station. Each body has an InfoPanel and Quiz. AI chat is integrated into the 3D scene. Frontend Three.js, backend Flask, JSON database, DeepSeek AI — full-stack integration.

---

### [PART 6: What I Truly Learned] (~1.5 min)

If I sum up these 9 lessons in one word: **mindset.** Five things:

**One: Collaborating with AI is a superpower.** Communicating effectively with AI is a skill. You translate fuzzy ideas into precise instructions, judge the output, and correct the direction. It's not easier than handwriting code — it's hard in a different way.

**Two: Frontend, backend, database are one system.** Before, websites felt like magic. Now I understand: frontend displays, backend processes, database stores. Each piece is manageable. Combined, they can build anything.

**Three: 3D programming turns you into a creator.** Building a solar system with rotating planets isn't writing code — it's world-building. Anything describable in words becomes renderable with Three.js.

**Four: Agent architecture is simple but powerful.** Agent = LLM + Tools + Memory. Three ingredients, unlimited applications. Future software will be agent-driven.

**Five: Bugs aren't scary. Not knowing how to debug is.** I hit countless errors — a misspelled variable taking 30 minutes, an exposed API key. Every fix made me better. Now my habit is: check Console, check terminal logs, trace step by step, then ask AI. AI is the co-pilot — I'm the one deciding.

---

### [CLOSING: The Journey Has Just Begun] (~0.5 min)

From making text change color to building a self-aware AI agent and a 3D solar system — every step of this path matters.

Programming isn't the stereotype of someone in a dark room typing furiously. It's a tool for expressing ideas, a language for talking to AI, a way to turn thoughts into reality.

After 9 lessons, is programming easy? No. It's still hard.

But I'm not afraid of hard anymore. I have a partner that never gets tired — AI. It won't replace me. But it makes the impossible possible.

Thank you for these 9 lessons. Thank you for the age of AI.

— SWJunior

---

### [APPENDIX: Anticipated Q&A]

**Q: How much time did you spend?**
A: About 2-3 hours per lesson of instruction, plus self-directed time to tweak and add features. Total around 30-40 hours.

**Q: What was the hardest part?**
A: Debugging image generation. The AI model pretended to call the tool without actually invoking it. Took nearly two hours to track down.

**Q: Which project is your favorite?**
A: Phantom Intelligence. Entirely my own concept — every decision from logo to features to personality was mine.

**Q: What's next?**
A: Deploying Phantom Intelligence to a cloud server for 24/7 uptime. Adding mobile-responsive design.

**Q: Advice for someone learning to code?**
A: Don't start with syntax. Start by learning to talk to AI. Describe what you want in natural language, let AI generate code, then read it, modify it, and ask why it works. That's the fastest path today.
