# 2D Pong Game — Step-by-Step Guide

## Step 1: Classic Pong Game

Build a basic two-player Pong game.

- A **start screen** with the game title and a "START GAME" button that launches the game
- A **game area** containing a ball and two paddles
- **Left player**: control the paddle with W (up) and S (down) keys
- **Right player**: control the paddle with ↑ (up) and ↓ (down) keys
- The ball bounces off the top/bottom walls and paddles; paddle hits change the angle based on where the ball strikes
- When the ball passes the left or right boundary, the opponent scores and the ball resets to the center
- Display the **score** at the top
- **Control bar**: Start, Pause, and Restart buttons; Space also toggles pause/resume
- Split into three files: HTML structure + CSS styles + JS logic

## Step 2: Player Mode Selection (Human vs AI)

Add mode switching for each player.

- Display two **mode panels** inside the game area (Left Player / Right Player)
- Each panel has two buttons: **Human** (manual control) and **PC** (AI auto-play)
- In AI mode, the paddle automatically tracks the ball's Y position to intercept it
- AI movement speed should be limited — it should not teleport instantly to the ball
- The currently active mode button should have a highlighted state
- Modes can be switched at any time, before or during gameplay

## Step 3: Buff Power-up System

Random power-up blocks appear on both sides of the field; touching them with a paddle activates the effect.

**Five Buff Types:**

| Buff | Effect | Duration |
|------|--------|----------|
| Slow Down | Reduces ball speed | 3 rounds |
| Split | Ball splits into multiple copies, making defense harder for the opponent | Permanent |
| Color Change | Ball changes to a random color | 5 rounds |
| Enlarge Paddle | Your own paddle becomes larger | 3 rounds |
| Shrink Opponent | The opponent's paddle becomes smaller | 3 rounds |

- Buffs appear as **colored blocks** on the left and right sides, refreshing at a set interval
- When a paddle touches a block, the block disappears and the effect activates
- Buff durations are measured in **rounds** (one round = ball travels to the far side and back); effects auto-expire
- Active buffs and their remaining rounds are displayed below each paddle

## Step 4: Settings Panel

Add a full-screen settings panel for configuring game parameters.

- Click the **Settings** button in the control bar to open the panel (game auto-pauses)
- The panel has three sections:

**Buff Settings:**
- Buff refresh frequency (slider from 0 to 5; 0 = no buffs generated)

**Ball Settings:**
- Base speed, minimum speed, maximum speed
- Speed increase multiplier after each paddle hit

**Paddle Settings:**
- Minimum and maximum paddle length
- Size change multiplier applied by buffs

- Each setting includes a **tooltip** explaining what it does
- **Save & Resume** applies settings and returns to the game; **Cancel** discards changes
- Settings use sliders or number inputs with reasonable value ranges
