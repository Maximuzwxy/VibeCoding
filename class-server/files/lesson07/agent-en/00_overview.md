# Agent Demo — Development Plan

## Overview

A Flask-based AI Agent demo app with LLM chat and Function Calling capabilities.

---

## Tech Architecture

### Backend
- **Framework**: Flask
- **LLM**: DeepSeek (deepseek-chat)
- **API**: https://api.deepseek.com/chat/completions
- **Key**: Stored in `.env` file at project root
- **Persistence**: JSON file storage
- **Dependencies**: flask, requests, ddgs

### Frontend
- **Templates**: Jinja2
- **Styling**: CSS
- **Interaction**: Vanilla JavaScript

---

## Development Phases

This project is built in **6 phases**. Detailed specs for each phase can be found in individual documents:
- `01_phase1_basic_chat.md` — Basic Q&A
- `02_phase2_history.md` — Add History
- `03_phase3_function_calling.md` — Add Function Calling
- `04_phase4_file_io.md` — Add File I/O
- `05_phase5_weather_time.md` — Add Time, Location, Weather
- `06_phase6_search_download.md` — Add Search & Download

**Note**: Function Calling features are added gradually across phases — not all at once.

---

## Project Structure

```
agent-demo/
├── app.py              # Flask main app
├── spec.md             # This document
├── rules.md            # Development guidelines
├── requirements.txt    # Dependencies
├── data/               # Data folder
│   ├── history.json    # Chat history
│   └── system_prompt.json
├── files/              # File storage
├── templates/          # HTML templates
│   └── index.html
└── static/             # Static files
    ├── main.js
    └── style.css
```

---

## API Endpoints

### POST /api/chat
Send a message to the LLM

**Request**:
```json
{
  "message": "Hello"
}
```

**Response**:
```json
{
  "reply": "Hello! How can I help?",
  "request_response_pairs": [
    {
      "request": { ... },
      "response": { ... },
      "tool_executions": []
    }
  ]
}
```

### GET /api/history
Get chat history

### POST /api/clear
Clear chat history
