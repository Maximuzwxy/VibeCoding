# Phase 6 — Add Search & Download

## Goal
Enable the AI to search the web and download resources

## Features
- `web_search` — Web search
- `news_search` — News search (falls back to web search)
- `download_image` — Download an image to the files directory

## Use Cases
```
User: Search for Python tutorials
Agent: [calls web_search] → Returns search results

User: Download a picture of the Forbidden City
Agent: [calls download_image] → Image saved to files/
```
