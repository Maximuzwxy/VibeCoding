# Development Guidelines

## Backend
- Flask app runs as single entry point `app.py` with `python app.py`
- Bind to `host='0.0.0.0'` for LAN accessibility
- API routes return JSON via `jsonify()`, never HTML
- Each API route handles one operation (GET=read, POST=create, PUT=update, DELETE=delete)
- Sensitive config in `.env` file, loaded via `python-dotenv`

## Frontend
- `/static/` for CSS and JS files, `/templates/` for HTML files
- HTML pages served via `render_template()`
- Frontend communicates with backend using `fetch()` calls

## Data
- `.json` files in project root `data/` folder
- Backend reads/writes JSON files — frontend never touches them directly

## Function Calling
- Tools are defined as JSON schemas passed to DeepSeek
- When DeepSeek returns `tool_calls`, execute them and feed results back
- Loop until no more tool calls, then return final response
