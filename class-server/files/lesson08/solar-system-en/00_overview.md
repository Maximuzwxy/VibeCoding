# Solar System — 3D Interactive Exploration Platform

## Goal
A Three.js + Flask interactive 3D solar system platform with orbit rendering, celestial info display, bilingual (zh/en) support, online quizzes, and AI chat.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Three.js (ES Module) + OrbitControls + CSS custom properties + vanilla JS |
| Backend | Flask 3.0 (Python) |
| LLM | DeepSeek V4 Flash (`deepseek-v4-flash`) |
| Database | JSON files |
| Tests | pytest |

---

## Development Phases

| Phase | File | Requirements |
|-------|------|-------------|
| Phase 1 | `01_phase1_celestial_system.md` | Reusable CelestialSystem base class: scene, camera, lights, starfield, orbit lines, animation loop. Solar system panorama with Sun + 8 orbiting planets. |
| Phase 2 | `02_phase2_info_language.md` | InfoPanel to display celestial body data. Bilingual language switcher (zh/en) with `localStorage` persistence. Bottom selector bar for all bodies. |
| Phase 3 | `03_phase3_quiz.md` | QuizPanel with dual mode: local (from JSON quiz bank) and online (LLM-generated). Save-to-bank, duplicate prevention, concurrent request guard. |
| Phase 4 | `04_phase4_chat.md` | ChatPanel with overlay UI. AI chat via DeepSeek with server-side context memory. Search box entry point. |
| Phase 5 | `05_phase5_mercury.md` | Mercury close-up view. Scene-switching framework for single-body focus mode. |
| Phase 6 | `06_phase6_venus.md` | Venus close-up with cloud layer. Retrograde rotation effect. |
| Phase 7 | `07_phase7_earth.md` | Earth close-up with cloud layer sub-object. Moon as orbiting body. |
| Phase 8 | `08_phase8_mars.md` | Mars close-up with thin atmosphere. Phobos and Deimos as orbiting bodies. |
| Phase 9 | `09_phase9_jupiter.md` | Jupiter gas giant close-up with banded cloud layer. 4 Galilean moons (Io, Europa, Ganymede, Callisto). |
| Phase 10 | `10_phase10_saturn.md` | Saturn close-up with multi-layer particle ring system. 7 orbiting moons. |
| Phase 11 | `11_phase11_uranus.md` | Uranus close-up with extreme axial tilt. 5 orbiting moons. Ring system. |
| Phase 12 | `12_phase12_neptune.md` | Neptune close-up. Triton as orbiting moon with retrograde orbit. |
| Phase 13 | `13_phase13_moon.md` | Moon texture generation system. Each moon gets a procedural Canvas 2D texture. |
| Phase 14 | `14_phase14_jupiter_moons.md` | Procedural textures for all 4 Galilean moons (Io, Europa, Ganymede, Callisto). |
| Phase 15 | `15_phase15_saturn_moons.md` | Procedural textures for all 7 Saturn moons (Titan, Enceladus, Mimas, Tethys, Dione, Rhea, Iapetus). |
| Phase 16 | `16_phase16_uranus_triton.md` | Procedural textures for 5 Uranian moons + Neptune's Triton. |
| Phase 17 | `17_phase17_martian_moons.md` | Procedural textures for Phobos and Deimos. Completes all 20 moon textures. |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/data/solar_system` | Solar system overview data |
| GET | `/api/data/celestial/<id>` | Universal celestial lookup (searches planets/ → moons/ → root) |
| GET | `/api/data/planet/<name>` | Specific planet data |
| GET | `/api/data/moon/<name>` | Specific moon data |
| GET | `/api/quiz/<type>` | Load local quiz bank |
| POST | `/api/quiz/generate` | Generate 10 bilingual quiz questions via LLM (with dedup) |
| POST | `/api/quiz/save` | Save a question to the local quiz bank |
| POST | `/api/chat` | AI chat with context memory |

---

## Design Principles

1. **Config-driven**: Celestial body parameters (color, size, tilt, texture, moons) defined in a single config object. No per-body rendering code duplication.
2. **Event-driven**: LanguageManager broadcasts language changes via `CustomEvent`. Panels self-update with no coupling.
3. **Pure JS rendering**: InfoPanel, QuizPanel, and ChatPanel all render dynamically via JS DOM operations. No static HTML templates.
4. **Cache-first**: Celestial data and online quiz questions are cached client-side. Switching back and forth requires no repeated network requests.
5. **Concurrency guard**: Online quiz generation protected by a loading flag to prevent duplicate LLM requests.
6. **Zero external images**: All celestial body textures are procedurally generated via Canvas 2D at runtime. The project is fully self-contained.
