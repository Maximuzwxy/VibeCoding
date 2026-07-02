# Phase 5 — Mercury + Scene Switching Framework

## Goal
Implement scene switching from the solar system overview to a close-up planet view, and establish the standardized process for adding new planets. Mercury is the first example.

## Requirements

### Scene Switching
- Click a planet icon in the bottom selector → switch to close-up view with that planet centered
- Click the Sun icon → return to solar system overview
- Theme color updates based on the selected planet (affects InfoPanel, QuizPanel, ChatPanel styling)

### Mercury Specifics
- Grey cratered surface texture (procedurally generated)
- Caloris Basin feature visible
- Slow rotation, nearly zero axial tilt (0.034°)
- No moons or atmosphere
- Camera positioned close for detailed viewing

### Standard Planet Addition Process
Adding any new planet follows the same 3-step process. No framework changes needed.
