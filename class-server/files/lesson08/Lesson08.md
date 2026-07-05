# 08 Solar System

## Design Phase: Think Before You Build

Today's project is our biggest yet — a **3D Solar System Exploration Platform**. It brings together everything we've learned:

- **3D rendering** (Three.js) — orbits, planets, textures, cameras
- **Frontend** (HTML/CSS/JS) — InfoPanel, QuizPanel, ChatPanel, language switching
- **Backend** (Flask) — serve data, handle API calls
- **Database** (JSON) — store celestial body data, quiz questions
- **LLM Integration** (DeepSeek) — generate quiz questions, answer chat queries

### Before we start coding, let's think:

- Look at all these features: solar system overview, planet close-ups, moon views, info panels, quizzes, AI chat... Can you just say "build me a solar system" and get all of this? **No.** That's not how it works.

- **Where does the data come from?** Every planet and moon has detailed info — diameter, temperature, orbital period, atmosphere... We use the **LLM** to generate this data in JSON format, then store it. The LLM becomes our research assistant.

- **Where do the quiz questions come from?** Also the LLM. But we need to avoid duplicates — so we save generated questions to the database and exclude existing ones when generating more.

- **How is the 3D scene structured?** A center body (Sun/planet) + orbiting bodies (planets/moons) + orbit lines + starfield. One reusable system, different configurations.

- **How do InfoPanel, QuizPanel, and ChatPanel work?** They all fetch data from the backend, render dynamically, and support Chinese/English switching. Same components, reused for every celestial body.

### The key insight: Design for reuse

You're not building one planet — you're building a **framework** that can render ANY celestial body just by changing parameters. Once the framework works for one planet, the rest is just data.

## Building the Framework

### Step 1: Start with one planet

Pick one planet — say **Jupiter** — and build the full pipeline around it:

1. Set up the 3D scene: center body + orbiting moons + orbit lines + starfield
2. Generate Jupiter's info data via LLM → save to JSON
3. Build the InfoPanel: load data → render sections → support language switching
4. Build the QuizPanel: load local questions → online LLM generation → save to database
5. Build the ChatPanel: search bar → chat overlay → context memory → LLM responses

Congrats! You now have a complete planet explorer for Jupiter.

### Step 2: Extract the reusable parts

Everything you built for Jupiter — the 3D scene, InfoPanel, QuizPanel, ChatPanel, language switching — works the **exact same way** for any other planet. The only difference is:
- The planet's parameters (size, color, axial tilt, texture)
- The planet's data (info JSON, quiz JSON)
- The planet's moons (number, names, orbits)

This is classic software engineering: **build once, reuse many times**.

### Step 3: Add more planets

With the framework in place, adding Saturn (rings! moons!), Earth (oceans! clouds!), or Mercury (craters! no moons!) is just:
1. Generate the new planet's data via LLM
2. Configure its 3D parameters
3. Add it to the selector

The framework handles everything else.

### Step 4: Keep going

Once all 8 planets are done, add their moons with detailed textures. The framework doesn't change — you're just feeding it new configurations.

## Development Phases

Detailed requirements for each phase are in the `solar-system/` folder (Chinese) or `solar-system-en/` folder (English).

| Phase | Topic |
|-------|-------|
| Phase 1 | CelestialSystem base class + solar system 3D orbits |
| Phase 2 | InfoPanel + language switching + celestial selector |
| Phase 3 | QuizPanel — local + online LLM-generated questions |
| Phase 4 | ChatPanel + AI conversation + context memory |
| Phase 5 | Mercury — scene switching framework |
| Phase 6–12 | All 8 planets with unique features |
| Phase 13–17 | Moon textures and close-up views |

---

## Tips

- **Class Server**: http://192.168.3.38:6688
- **Starting a New Project**: Always create a new folder and start a fresh AI chat session. Make sure AI recognizes the new directory context and generates all subsequent code within it.
- **Submitting Homework**: At the end of class, submit your assignment by compressing (zipping) your project folder and uploading it.
- **Console Logs**: If the program behaves unexpectedly, always check the browser Console logs for error messages. Press F12 or Ctrl+Shift+J / Cmd+Option+C to open the Console.
