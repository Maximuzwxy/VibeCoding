# Phase 4 — ChatPanel + Context Memory

## Goal
Implement an AI chat panel triggered from a top search bar, with server-side conversation memory and DeepSeek LLM integration.

## Requirements

### ChatPanel
- **Trigger**: Click the top search bar to open the chat panel overlay
- **Send message**: Type in the search bar or chat input, Enter or click send
- **Response**: Show thinking indicator, then display AI reply
- **Close**: Click close button or outside the panel
- **Language switching**: All labels update dynamically; existing chat history does not change

### Context Memory
- Server maintains conversation history in memory
- Each request includes full history so the AI remembers previous exchanges
- History is cleared when server restarts

### LLM Integration
- Uses DeepSeek V4 Flash model
- System prompt sets the AI as a solar system knowledge assistant
- Responses are in the user's current language
