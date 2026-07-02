# Phase 3 — QuizPanel Quiz System

## Goal
Implement a quiz panel with two modes: local question bank and LLM-generated questions. Online questions can be saved to the local bank.

## Requirements

### QuizPanel
- **Two modes**: Local (pre-made questions) and Online (LLM-generated via DeepSeek)
- **Mode switching**: Switching preserves state for each mode independently
- **Duplicate prevention**: Guard against multiple simultaneous LLM requests; cache generated questions
- **Save questions**: Online questions can be saved to the local question bank
- **Bilingual**: Full Chinese/English support, all text switches on language change

### Local Mode
- Load questions from server, shuffle order
- Show "All questions completed" when done

### Online Mode
- Generate questions via DeepSeek V4 Flash
- Continue generating more after finishing current batch
- Cache prevents re-generation when switching modes

### Language Switching
- Title, mode buttons, question text, options, feedback all update on language change
- Quiz history is not re-translated
