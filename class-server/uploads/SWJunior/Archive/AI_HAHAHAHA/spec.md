# AI Agent Demo — Project Specification

## Overview
A Doubao-like AI agent built with Flask + DeepSeek, supporting multi-turn chat with function calling capabilities.

## Tech Stack
- **Backend**: Flask, DeepSeek API (deepseek-chat)
- **Frontend**: Jinja2, Vanilla JS, CSS
- **Storage**: JSON files in `data/`
- **File Storage**: `files/` directory

## Phases

### Phase 1 — Basic Q&A
Simple chat with DeepSeek LLM. User sends message, gets reply.

### Phase 2 — History
Chat history persisted in `data/history.json`. Load on startup, save on each message. Clear endpoint.

### Phase 3 — Function Calling
Framework for tool calling. DeepSeek can request tool execution; backend executes and returns results.

### Phase 4 — File I/O
Tools: `read_file`, `write_file`, `list_files`. Agent can read/write files in `files/`.

### Phase 5 — Time, Location, Weather
Tools: `get_current_time`, `get_current_location`, `get_weather`. Agent knows time, user location, and weather.

### Phase 6 — Search & Download
Tools: `web_search` (via ddgs), `download_file`. Agent can search the web and download files.

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | / | Main page |
| POST | /api/chat | Send message |
| GET | /api/history | Get chat history |
| POST | /api/clear | Clear chat history |

## Project Structure
```
AI_HAHAHAHA/
├── app.py
├── spec.md
├── rules.md
├── requirements.txt
├── .env
├── data/
│   ├── history.json
│   └── system_prompt.json
├── files/
├── templates/
│   └── index.html
└── static/
    ├── main.js
    └── style.css
```
