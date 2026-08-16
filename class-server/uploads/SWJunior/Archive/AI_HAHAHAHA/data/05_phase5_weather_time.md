# Phase 5 — Add Time, Location, Weather

## Goal
Enable the AI agent to answer time, location, and weather questions using real data.

## Tools Added
### get_current_time
- No parameters
- Returns current date and time (server local time)
- Format: "YYYY-MM-DD HH:MM:SS"

### get_current_location
- No parameters
- Uses ip-api.com free geolocation API
- Returns city, region, country, lat, lon, timezone
- Falls back gracefully on API failure

### get_weather
- Parameter: `city` (string, default "Beijing")
- Uses wttr.in free weather API
- Returns weather condition, temperature, humidity, wind
- Format: "Weather in {city}: {condition} {temp} {humidity} {wind}"

## External APIs Used
| Tool | API | Rate Limit |
|------|-----|-----------|
| get_current_location | http://ip-api.com/json/ | 45 req/min (free) |
| get_weather | https://wttr.in/ | No strict limit |

## Backend Changes
- Add 3 tool definitions to TOOLS list
- Implement get_current_time, get_current_location, get_weather executors
- Error handling for API failures (returns error message, not crash)

## Files Changed
- app.py — 3 new tool definitions + executors

## Example Interactions
- User: "What time is it?"
- User: "Where am I?"
- User: "What's the weather in Tokyo?"
