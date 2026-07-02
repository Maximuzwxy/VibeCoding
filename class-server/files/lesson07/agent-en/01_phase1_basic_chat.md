# Phase 1 — Basic Q&A (No History, No Function Calling)

## Goal
Implement the simplest LLM chat functionality

## Features
- User sends a message, LLM returns a reply
- Left side: chat conversation display
- Right side: Message Detail (request/response JSON)
- **Message flow display**: Agent messages show processing steps (→ Send request to LLM, ← LLM returns final reply)
- No chat history
- No Function Calling

## Technical Implementation
- Each request only sends the user's input
- No conversation history is saved
- No Function Calling support
- Agent messages show inline processing steps (2 steps when no Function Calling)

## Message Flow Display
Agent reply bubbles show processing steps above the final reply text. Without Function Calling: 2 steps. With Function Calling: steps auto-expand and support looped calls.

### Without Function Calling (2 steps)
```
→ Send request to LLM
← LLM returns final reply

[Final reply content]
```

### With Function Calling (multiple steps, looped calls)
```
→ Send request to LLM
← LLM returns, preparing to call tools
✓ Called xxx... success

→ Send request to LLM (round 2)
← LLM returns final reply

[Final reply content]
```

- `✓` / `✗` icons indicate tool call success/failure
- LLM may initiate multiple tool calls; each completed call triggers a new round
- `request_response_pairs` records each round's request and response
- Click an Agent message to expand the right-side JSON detail panel

## UI Layout
```
┌─────────────────────────────────────┬─────────────────┐
│           Chat Area                 │  Message Details │
│                                     │                  │
│  You: Hello                         │  Request:        │
│                                    │  { ... }        │
│  Agent:                             │                  │
│    → Send request to LLM            │  Response:       │
│    ← LLM returns final reply        │  { ... }        │
│    [Agent's reply content]          │                  │
└─────────────────────────────────────┴─────────────────┘
```
