# Plane Shooter — 2D Shooting Game

## Overview

A 2D vertical scrolling shooter. Players control a fighter jet, defeat waves of enemies and bosses across multiple levels.

## Tech Stack

- **Frontend**: HTML5 Canvas + JavaScript (no image files — all drawn via Canvas API)
- **Backend**: Flask (Python)
- **Audio**: Web Audio API (no audio files)
- **Database**: JSON file

## Phase 1: Core Game

### Player
- Arrow keys or WASD to move
- One key to shoot
- Multiple lives, brief invincibility after being hit

### Enemies
- Three enemy types (small, medium, large) with different HP
- Enemies move side to side and slowly descend
- Enemies fire bullets randomly

### Wave System
- Multiple waves per level, increasing in difficulty
- Each wave spawns more enemies than the last

### Boss
- A boss appears after all waves are cleared
- Bosses have multiple attack patterns that switch periodically
- 6 levels, each with a unique boss

### Power-ups
- Randomly drop from destroyed enemies
- Types: faster fire rate, shield, spread shot, extra life, screen-clear bomb
- Temporary effects with countdown timers

### HUD
- Show lives, score, current wave, current level, active power-ups

### Scoring
- Points for defeating enemies, bosses, and completing waves
- Bonus for finishing a level

### Difficulty Levels
- Easy / Normal / Hard — affects enemy speed, HP, and fire rate

## Phase 2: Audio & Settings

### Sound Effects
- All sounds generated programmatically (no audio files)
- Shoot, explosion, power-up, boss alert, hit, bomb, victory

### Background Music
- Procedurally generated ambient music

### Settings
- Number of lives
- Sound effects on/off
- Music on/off
- Difficulty selection

## Phase 3: User System & Leaderboard

### Login
- Simple username-based login (no password required)
- Auto-register if username doesn't exist
- Session management

### Data Storage
- Store users (ID, username, creation time)
- Store scores (username, score, level reached, timestamp)
- Save highest score after each game

### Leaderboard
- Show top 10 players
- Display username, score, level, and time
- Accessible from a dedicated page

### API Endpoints
- Login / Logout
- Save score
- Get user best score
- Get leaderboard data

## Deployment
- Bind to `0.0.0.0` so other devices on the same WiFi can access it
