# Phase 2 — Add History (Memory)

## Goal
Enable the AI to remember conversation context

## Features
- Save chat history to `data/history.json`
- Include the full conversation history with every request
- The AI can remember user information (e.g., their name)

## Technical Implementation
- Persist history in a file
- Load history and send it to the LLM with each request
- Support clearing history

## Example
```
User: My name is Max
Agent: Nice to meet you, Max!

User: What's my name?
Agent: Your name is Max
```
