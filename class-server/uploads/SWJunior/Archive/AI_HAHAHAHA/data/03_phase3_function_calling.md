# Phase 3 — Add Function Calling

## Goal
Enable the LLM to call tools. The backend executes tools and feeds results back to the LLM in a loop.

## Features
- Tool definitions passed to DeepSeek with each request
- When LLM returns tool_calls, backend executes them
- Tool results are sent back to LLM for final response
- Loop continues until LLM returns a text response (max 5 iterations)
- Agent messages show inline processing steps
- Detail panel shows request/response JSON per round

## Architecture
```
User → POST /api/chat
  → Send to DeepSeek (with tools)
  → LLM returns tool_calls? → Execute tools → Send results back → Repeat
  → LLM returns text → Return to user
```

## request_response_pairs (with tool calls)
```json
[
  {
    "request": { ... },
    "response": { "role": "assistant", "content": null, "tool_calls": [...] },
    "tool_executions": [{ "name": "get_weather", "arguments": {...}, "result": "...", "success": true }]
  },
  {
    "request": { ... },
    "response": { "role": "assistant", "content": "It's sunny in Beijing!" },
    "tool_executions": []
  }
]
```

## Frontend — Processing Steps
Without tool calls (2 steps):
- → Send request to LLM
- ← LLM returns final reply

With tool calls (looped):
- → Send request to LLM (round 1)
- ← LLM returns, preparing to call tools
- ✓ Called xxx... success
- → Send request to LLM (round 2)
- ← LLM returns final reply

## Backend Changes
- Define TOOLS list with schemas
- Implement tool execution loop
- Return request_response_pairs per round
- Tool results include success flag for frontend display

## Frontend Changes
- Agent messages show processing-steps block above reply
- Click agent message → detail panel shows JSON
- Two-column layout: chat + detail panel

## Files Changed
- app.py — tool definitions, execution loop, executor functions
- templates/index.html — two-column layout, detail panel
- static/main.js — processing steps, detail panel logic
- static/style.css — step styling, detail panel styles
