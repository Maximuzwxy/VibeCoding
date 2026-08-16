# Phase 4 — Add File I/O

## Goal
Enable the AI agent to read, write, and list files on the server.

## Tools Added
### read_file
- Parameter: `filename` (string)
- Reads file from `files/` directory
- Returns file content as string

### write_file
- Parameters: `filename` (string), `content` (string)
- Writes content to `files/` directory
- Creates parent directories if needed
- Returns success message with character count

### list_files
- No parameters
- Lists all files in `files/` directory recursively
- Returns relative paths with file sizes

## Security
- Path traversal protection: all file paths resolved and validated to be within `files/` directory
- UTF-8 encoding with error replacement on read

## Backend Changes
- Add 3 tool definitions to TOOLS list
- Implement read_file, write_file, list_files executors
- Path traversal guard using resolve() and startswith()

## Files Changed
- app.py — 3 new tool definitions + executors
- files/ directory — created if not exists

## Example Interactions
- User: "Write a poem about cats to cats.txt"
- User: "Read the file cats.txt"
- User: "List all files"
