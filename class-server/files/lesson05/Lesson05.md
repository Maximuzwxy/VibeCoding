# 05 HTML + Flask + DB (JSON)

## Your First Backend: app.py

Up until now, you've been opening HTML files directly in the browser. But real web apps work differently — a **server** sends the content to the browser.

### Try this prompt:

> Create a simple Flask app in app.py. When someone visits the root URL, return "Hello World! This is my first backend." Make sure to bind to host='0.0.0.0' so the server is accessible from other devices on the same WiFi network.

Run it with `python app.py`, then open `http://127.0.0.1:5000` (your own machine) or `http://<YOUR_IP>:5000` (from any device on the same WiFi) in your browser. No HTML file needed! The web page is generated entirely by Python code running on the server.

### Add a new route:

> Add a new route `/time` to the Flask app that shows the current server time.

### Render an HTML file:

> Create a `templates/` folder with a `hello.html` file inside. Then add a route `/hello` that uses `render_template('hello.html')` to serve it.

Flask requires HTML templates to be placed in a folder named `templates/` — this is a convention, not something you configure.

### Why this matters:
- This is how all real websites work — code runs on a server, not just a file on your computer
- You can return HTML, JSON, or any content you want
- Later you'll use this to serve your game files and handle API requests
- Using `host='0.0.0.0'` makes your server visible to all devices on the same WiFi — your phone, tablet, or classmates can access it using your local IP (e.g., `http://192.168.x.x:5000`)

## How Real Projects Work: Frontend, Backend & Database

Real applications are built in layers:

| Layer | What It Does | What We Use |
|-------|-------------|-------------|
| **Frontend** | What the user sees and interacts with | HTML + CSS + JavaScript |
| **Backend** | Logic running on the server, handles requests | Flask (Python). Other options: Express (Node.js), Spring (Java), Django (Python) |
| **Database** | Stores persistent data | JSON files. Other options: MySQL, PostgreSQL, MongoDB, SQLite |

### Why this separation?
- **Frontend** runs in the user's browser — fast, immediate interaction
- **Backend** runs on the server — handles data, authentication, and logic that shouldn't be exposed to the client
- **Database** keeps data permanent — even after the server restarts

### Why Flask + JSON for this class?
- Flask is simple to start with and uses Python you already know
- JSON files are human-readable — you can open them and see exactly what's stored
- No need to install extra database software

## DB Demo: CRUD Operations

CRUD = **C**reate / **R**ead / **U**pdate / **D**elete — the four basic operations every app needs.

### What to build:
- A simple Flask app that manages a list of items stored in a JSON file
- **Create**: POST a new item → saved to JSON
- **Read**: GET all items → returned as JSON
- **Update**: PUT to modify an item by ID
- **Delete**: DELETE to remove an item by ID
- A minimal HTML page to test all four operations with buttons

### Prompt suggestion:

> Create a Flask CRUD API that stores items in `data.json`. Each item has an id (auto-generated), name, and score. Include four routes: GET /items, POST /items, PUT /items/<id>, DELETE /items/<id>. Also create a simple index.html that lets me test all four operations.

## Update Project Memory

From now on, your projects have a new structure: frontend + backend + database. Let's update the project memory so AI remembers all the conventions.

Open Trae IDE **Settings** → **Rules & Memory** → **Rules**, edit your project-level rule, and replace the old rule with the following:

```
Rule: Project File Structure

All projects must follow these file organization conventions:

Frontend-only projects (no backend):
- Split into three files: index.html (structure), style.css (styling), script.js (logic).
- Inline <style> and <script> tags are not allowed. The original unsplit file must be preserved.
- index.html links to external CSS via <link rel="stylesheet" href="style.css"> and external JS via <script src="script.js"></script>.

Flask projects (frontend + backend):
- Frontend: /static/ for CSS and JS files, /templates/ for HTML files.
- Backend: app.py in the project root as the single entry point. Run with python app.py. Always bind to host='0.0.0.0' so the server is accessible from other devices on the same WiFi (e.g., http://192.168.x.x:5000).
- Database: .json files in the project root. Backend reads/writes them — frontend never touches them directly.
- HTML pages are served via render_template(), not opened directly in the browser.
- Frontend communicates with backend using fetch() calls. API routes return JSON via jsonify(), never HTML.
- Each API route handles one operation (GET=read, POST=create, PUT=update, DELETE=delete).
```

Once saved, the AI will automatically follow these rules in every new chat session for this workspace.

## Plane Shooter Game (Suggested Project)

Your main project for this lesson: build a **Plane Shooter** game with a backend.

### Core requirements:
- **User Login**: Simple login form (just a username/ID — no password needed for this exercise). The server saves the user ID and login timestamp to the JSON database.
- **Leaderboard**: A global high-score table stored on the server. Anyone can see it.
- **The Game**: A plane/ship shooting game. Each student runs the game locally in their browser (JavaScript), and the score is submitted to the backend when the game ends.

### Don't want to build a shooter? No problem.
You can build any game or app, as long as it includes:
1. User login (ID stored in the database)
2. A leaderboard or data display that reads from the server
3. The game/app itself runs in the browser

### What you'll learn:
- How a backend stores and serves data
- How the frontend communicates with the backend (fetch API calls)
- How to separate game logic (frontend) from persistent data (backend)

---

## Tips

- **Class Server**: http://192.168.3.47:6688
- **Starting a New Project**: Always create a new folder and start a fresh AI chat session. Make sure AI recognizes the new directory context and generates all subsequent code within it.
- **Submitting Homework**: At the end of class, submit your assignment by compressing (zipping) your project folder and uploading it.
- **Console Logs**: If the program behaves unexpectedly, always check the browser Console logs for error messages. Press F12 or Ctrl+Shift+J / Cmd+Option+C to open the Console.
