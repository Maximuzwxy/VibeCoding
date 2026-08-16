# Phase 2 — Add History

## Goal
Persist chat history and enable multi-turn conversations.

## Features
- Chat history saved to data/history.json
- Each request includes previous conversation context
- GET /api/history — retrieve chat history
- POST /api/clear — clear chat history
- History sidebar shows past conversations
- "New Chat" button to start fresh

## API
### GET /api/history
Response: `[{ "user": "...", "assistant": "...", "timestamp": "..." }, ...]`

### POST /api/clear
Response: `{ "status": "ok" }`

## Backend Changes
- Load history from data/history.json on each request
- Send history + current message to DeepSeek
- Save new exchange to history after response
- Add GET /api/history and POST /api/clear routes

## Frontend Changes
- Add sidebar with history list
- Load history on page load
- "New Chat" button clears history
- Each history item shows a preview of the user's message

## Files Changed
- app.py — history loading/saving, new routes
- data/history.json — new file for persistence
- templates/index.html — sidebar with history list
- static/main.js — history API calls, sidebar logic
- static/style.css — sidebar styles
