# Phase 6 — Add Search & Download

## Goal
Enable the AI agent to search the web and download files from URLs.

## Tools Added
### web_search
- Parameters: `query` (string), `max_results` (integer, default 5)
- Uses DuckDuckGo via ddgs library
- Returns title, URL, and body snippet for each result
- Falls back gracefully if ddgs is unavailable

### download_file
- Parameters: `url` (string), `filename` (string, optional)
- Downloads file from URL to `files/` directory
- Filename derived from URL if not provided
- Returns success message with file size in bytes
- 30-second timeout, streaming download

## Dependencies
- ddgs — DuckDuckGo search wrapper for Python

## Backend Changes
- Add 2 tool definitions to TOOLS list
- Implement web_search with DDGS context manager
- Implement download_file with streaming HTTP GET
- Path traversal protection for downloaded files

## Files Changed
- app.py — 2 new tool definitions + executors
- requirements.txt — add ddgs dependency

## Example Interactions
- User: "Search for Python async tutorials"
- User: "Download https://example.com/file.pdf"
- User: "Search for weather in Tokyo and download the results"
