# Phase 4 — Add File I/O

## Goal
Enable the AI to read and write files

## Features
- `read_file` — Read file contents
- `list_files` — List files in directory
- `write_file` — Write content to a file
- `delete_file` — Delete a file

## Use Cases
- Browse files before operating (list first, then act)
- Ask the AI to generate code and save it
- Ask the AI to read and modify existing files
- Ask the AI to delete unwanted files

## Example
```
User: Create an index.html file for me
Agent: [calls write_file] File created

User: Delete the old photo
Agent: [calls list_files] → [calls delete_file] File deleted
```

## Extra Feature: Voice Input
- Voice input via microphone button
- Uses browser Web Speech API
- Speech recognition results fill the input box in real time
- Supports continuous Mandarin Chinese recognition
