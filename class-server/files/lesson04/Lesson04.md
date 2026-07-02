# 04 Speak the Language of 3D

## Tips

- **Class Server**: http://192.168.3.38:6688
- **Starting a New Project**: Always create a new folder and start a fresh AI chat session. Make sure AI recognizes the new directory context and generates all subsequent code within it.
- **Submitting Homework**: At the end of class, submit your assignment by compressing (zipping) your project folder and uploading it.
- **Console Logs**: If the program behaves unexpectedly, always check the browser Console logs for error messages. Press F12 or Ctrl+Shift+J / Cmd+Option+J to open the Console.

## From 2D to 3D: The Art of Describing to AI

You've built a 2D Pong game. Now the challenge: turn it into a 3D Pong game.

### Try the naive approach first

Just tell the AI: *"Turn my 2D Pong into 3D."* See what happens. Most likely, you'll get something that looks wrong — objects floating in the wrong places, the ball moving in unexpected directions, or the whole thing just not making sense.

### Why "make it 3D" fails

The AI doesn't know what "3D" means in *your* head. It doesn't know:
- What shape the court should be
- Where the paddles go relative to each other
- Which axis the ball travels along
- How the camera should look at the scene

### How to describe it precisely

To get a good result, you need to **paint a picture with words**. Here's what to tell the AI:

**The Court:**
- The game takes place inside a **transparent cube** (15 x 15 x 15 units) centered at the origin (0, 0, 0)
- Its 12 edges are visible as glowing lines so you can see the boundaries

**The Paddles:**
- Two flat paddles, each 4 x 4 units, positioned on opposite sides of the cube
- **Red paddle** (front): on the Z = +7.25 plane, facing the center
- **Green paddle** (back): on the Z = -7.25 plane, facing the center
- Paddles can move on the X and Y axes within the cube face (range: -5.5 to +5.5)

**The Ball:**
- A small sphere starting at the center (0, 0, 0)
- It flies primarily along the **Z-axis** (between the two paddles), bouncing off the X and Y walls
- When it passes through a paddle's Z-plane, the opponent scores

**The Camera:**
- Positioned on the X-axis at (25, 0, 0) looking at the origin
- Uses OrbitControls so the player can rotate around and observe the game from any angle

**The Lesson:**
The more precisely you describe a 3D space — positions, axes, ranges, directions — the better the AI can build it. Vague descriptions lead to vague results. This applies to *every* project, not just games.

## 3D Pong Game Steps

Build the 3D Pong in five phases. (For detailed requirements, see `exercise/3d-pong/requirement-en.md`.)

### Phase 1: The 3D Space
- Create a 3D scene with coordinate axes (X=red, Y=green, Z=blue)
- Build the transparent cube (15 x 15 x 15) with visible cyan edges
- Set up the camera at (25, 0, 0) with OrbitControls
- Add a starfield background for atmosphere

### Phase 2: Paddles & Controls
- Add two paddles: Red at Z=+7.25, Green at Z=-7.25
- Red paddle: WASD (moves on X/Y plane)
- Green paddle: Arrow keys (moves on X/Y plane)
- Constrain paddle movement within the cube face (-5.5 to +5.5)

### Phase 3: Ball Physics & Scoring
- Ball starts at center, flies mainly along the Z-axis
- Bounces off the four X/Y boundary walls
- Paddle collision: reverse Z direction, add angle and spin based on hit position
- Speed increases slightly with each paddle hit
- Scoring: ball passes Z=+7.5 → Green scores; passes Z=-7.5 → Red scores

### Phase 4: AI Opponent
- Toggle each paddle between Human and AI control
- AI predicts where the ball will arrive and moves to intercept
- AI returns to center when the ball is moving away

### Phase 5: Polish & Features
- **Buff system**: 4 power-up types (Enlarge, Shrink, Slow, Split) as rotating cubes
- **Visual effects**: hit rings, ball trail, pulsing buff glow
- **Sound effects**: paddle hit, wall bounce, and score sounds via Web Audio API
- **Game UI**: start screen, HUD with scores, settings panel, game over screen
