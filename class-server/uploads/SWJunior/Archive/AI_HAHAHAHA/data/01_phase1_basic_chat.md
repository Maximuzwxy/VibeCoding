# Phase 1 — Basic Q&A

## Goal
User sends a message, LLM returns a reply. The simplest possible chat interaction.

## Features
- User sends a message via POST /api/chat
- Backend forwards the message to DeepSeek API (deepseek-chat)
- LLM reply is returned to the frontend
- No conversation context — each message is independent
- No tools, no history, no function calling

## API
### POST /api/chat
Request: `{ "message": "Hello" }`
Response: `{ "reply": "...", "request_response_pairs": [...] }`

## Backend
- Load system prompt from data/system_prompt.json
- Send [system_prompt, user_message] to DeepSeek
- Return the assistant's reply

## Frontend
- Text input + send button
- User message appears on right
- Agent message appears on left with reply text
- No sidebar, no detail panel (minimal UI)

## request_response_pairs
```json
[
  {
    "request": { "model": "deepseek-chat", "messages": [...] },
    "response": { "role": "assistant", "content": "Hello!" },
    "tool_executions": []
  }
]
```

## Files Changed
- app.py — /api/chat endpoint (basic)
- templates/index.html — minimal chat UI
- static/main.js — send message, display reply
- static/style.css — basic styling
