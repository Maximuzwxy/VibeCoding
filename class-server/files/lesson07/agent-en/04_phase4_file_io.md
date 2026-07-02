# Phase 4 — Add File I/O

## Goal
Enable the AI to read and write files

## Features
- `read_file` — Read file contents
- `write_file` — Write content to a file

## Use Cases
- Ask the AI to generate code and save it
- Ask the AI to read and modify existing files

## Example
```
User: Create an index.html file for me
Agent: [calls write_file] File created
```

## Extra Feature: Voice Input
- Voice input via microphone button
- Uses browser Web Speech API
- Speech recognition results fill the input box in real time
- Supports continuous Mandarin Chinese recognition
