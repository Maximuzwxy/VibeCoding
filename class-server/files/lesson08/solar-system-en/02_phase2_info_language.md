# Phase 2 — InfoPanel + Language Switching + Celestial Selector

## Goal
Implement a left-side info panel for celestial body data, global Chinese/English language switching, and a bottom celestial body selector.

## Requirements

### LanguageManager
- Toggle between Chinese and English
- Persist language choice in localStorage
- Notify all components via `CustomEvent('languageChanged')`
- Utility method to extract current language text from bilingual objects

### InfoPanel
- Pure JS dynamic rendering (no static HTML templates)
- Load celestial body data from server API
- Render data in sections (Basic Info, Orbital Parameters, etc.)
- Cache data on first load; re-render on language change without re-fetching

### Celestial Selector
- Bottom bar with icons for Sun + 8 planets + moon list button
- Hover shows celestial body name
- 10th button opens a moon list popup
