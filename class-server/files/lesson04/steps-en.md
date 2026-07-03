# 3D Pong Game Development Plan

This document describes how to build a 3D Pong game from scratch, implemented in 5 phases step by step.

---

## Game Overview

A two-player competitive pong game inside a 3D cubic space. The red side (front) and green side (back) each control a paddle, and score by getting the ball past the opponent's paddle.

---

## Phase 1: Establish 3D Space Concepts

### Goals
- Create a 3D coordinate system (X, Y, Z axes) to help users build spatial awareness
- Create a visual cube
- Set up a suitable camera position

### Technical Details

#### Coordinate System
- Use THREE.js `ArrowHelper` to create coordinate axes with arrows
- X axis: Red, pointing right
- Y axis: Green, pointing up
- Z axis: Blue, pointing forward
- Axis length recommended at 20 units, origin at the cube center

#### Cube
- Size: 15 x 15 x 15 units
- Material: Transparent (`MeshBasicMaterial` with `transparent: true, opacity: 0.15`)
- Edges: Use `LineSegments` and `EdgesGeometry` to draw visible 12 edges
- Edge color: Cyan (0x48dbfb)
- Edge opacity: 0.6

#### Camera Setup
- Type: `PerspectiveCamera`
- FOV: 65 degrees
- Aspect ratio: window aspect ratio
- Near plane: 0.1, Far plane: 1000
- Position: (25, 0, 0) — on the positive X axis
- Look at origin: `camera.lookAt(0, 0, 0)`
- Add OrbitControls to allow the user to rotate the view

#### Starfield Background (Optional Decoration)
- Particle system of 500 stars
- Positions outside the cube (within a spherical space of radius 20-50 units)
- Each star has independent twinkling phase and speed

---

## Phase 2: Add Paddles

### Goals
- Place one paddle on each side of the cube
- Define paddle size and appearance
- Ensure paddles can move within a certain range
- Implement keyboard controls

### Technical Details

#### Paddle Geometry
- Size: 4 x 4 x 0.3 units (width, height, depth)
- Created using `BoxGeometry`

#### Front Paddle (Red Side)
- Position: Z = +7.25 (inside the front face of the cube)
- Color: 0xff6666 (bright red)
- Material: `MeshBasicMaterial` (no transparency, to avoid flickering)

#### Back Paddle (Green Side)
- Position: Z = -7.25 (inside the back face of the cube)
- Color: 0x66ff66 (bright green)
- Material: `MeshBasicMaterial` (no transparency, to avoid flickering)

#### Movement Range Limits
- X axis: -5.5 to +5.5 (leaving boundary margin)
- Y axis: -5.5 to +5.5
- Z axis: fixed position unchanged

#### Keyboard Controls
- **Front Paddle (Red Side)**:
  - W: Move up (+Y)
  - S: Move down (-Y)
  - A: Move left (-X)
  - D: Move right (+X)
- **Back Paddle (Green Side)**:
  - ↑: Move up (+Y)
  - ↓: Move down (-Y)
  - ←: Move left (-X)
  - →: Move right (+X)
- Movement speed: 0.1 units/frame

#### Controller Implementation
```javascript
const keyState = {};
window.addEventListener('keydown', (e) => keyState[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keyState[e.key.toLowerCase()] = false);
```

---

## Phase 3: Ball Physics and Collision

### Goals
- Create a ball at the cube center
- Implement ball movement logic
- Implement ball bounce off walls (4 vertical faces)
- Implement scoring logic (getting past the opponent's paddle)
- Implement paddle collision (changing ball direction and angle)

### Technical Details

#### Ball
- Geometry: Sphere, radius 0.3, 32 segments
- Material: White `MeshBasicMaterial`
- Initial position: (0, 0, 0)
- Add glow effect: larger semi-transparent sphere overlay

#### Ball Initial Velocity
```javascript
const ballVelocity = new THREE.Vector3(
    (Math.random() > 0.5 ? 1 : -1) * 0.05,  // Random X direction
    (Math.random() > 0.5 ? 1 : -1) * 0.05,  // Random Y direction
    0.05 * 1.6  // Z direction (1.6x fixed speed)
);
```

#### Collision Boundaries
- X axis boundary: ±7.0 (bounce on hit)
- Y axis boundary: ±7.0 (bounce on hit)
- Z axis boundary: ±7.5 (paddle plane)

#### Bounce Logic
- When the ball hits an X or Y boundary, negate the corresponding velocity component
- Position correction: prevent the ball from getting stuck outside the boundary

#### Paddle Collision Detection
- Collision zone: paddle center ±2 units (radius)
- Collision conditions:
  - Front: ball Z + 0.5 >= 7.25 AND ball Z <= 7.5
  - Back: ball Z - 0.5 <= -7.25 AND ball Z >= -7.5
  - X, Y coordinates within paddle range

#### Paddle Collision Effect
- Z velocity negated (bounce back in the original direction)
- Add angle offset based on hit position:
  ```javascript
  const hitPosRelX = (ball.position.x - paddle.position.x) / paddleRadius;
  const hitPosRelY = (ball.position.y - paddle.position.y) / paddleRadius;
  ballVelocity.x += hitPosRelX * 0.05;
  ballVelocity.y += hitPosRelY * 0.05;
  ```
- Add spin effect based on paddle movement speed:
  ```javascript
  ballVelocity.x += paddleVelX * 0.3;
  ballVelocity.y += paddleVelY * 0.3;
  ```

#### Speed Increment
- Each paddle hit multiplies speed by 1.05
- Maximum speed limit: 0.3

#### Scoring Logic
- Ball passes front paddle (Z > 7.5): Back paddle (green side) scores
- Ball passes back paddle (Z < -7.5): Front paddle (red side) scores
- After scoring, ball resets to center and velocity re-randomized

---

## Phase 4: AI Opponent

### Goals
- Implement AI control algorithm
- Allow players to choose manual or AI control for each paddle
- AI can predict ball trajectory and move accordingly

### Technical Details

#### AI Algorithm
```javascript
function moveAIPaddle(paddle, ballPos, ballVel, paddlePos) {
    // Calculate time for ball to reach the paddle position
    const timeToReach = (paddlePos - ballPos) / ballVel.z;

    if (timeToReach > 0 && ballVel.z !== 0) {
        // Predict ball position at arrival
        const predictedX = ballPos.x + timeToReach * ballVel.x;
        const predictedY = ballPos.y + timeToReach * ballVel.y;

        // Move paddle toward predicted position
        const dx = predictedX - paddle.position.x;
        const dy = predictedY - paddle.position.y;

        paddle.position.x += Math.max(-0.05, Math.min(0.05, dx));
        paddle.position.y += Math.max(-0.05, Math.min(0.05, dy));
    } else {
        // When ball is moving away, return to center
        paddle.position.x += Math.max(-0.05, Math.min(0.05, -paddle.position.x));
        paddle.position.y += Math.max(-0.05, Math.min(0.05, -paddle.position.y));
    }

    // Clamp movement range
    paddle.position.x = Math.max(-5.5, Math.min(5.5, paddle.position.x));
    paddle.position.y = Math.max(-5.5, Math.min(5.5, paddle.position.y));
}
```

#### Control Mode Switching
- Front-end UI provides Human/AI toggle buttons
- Store control mode: `paddleModes = { frontPaddle: 'human', backPaddle: 'ai' }`
- Use keyboard or AI control based on the selected mode

---

## Phase 5: Enrich Game Features

### 5.1 Buff System

#### Buff Types
| Name | Color | Effect | Duration |
|------|------|------|----------|
| ENLARGE | Green (0x2ecc71) | Paddle size +50% | 3 seconds |
| SHRINK | Orange (0xf39c12) | Opponent paddle size -40% | 3 seconds |
| SLOW | Blue (0x3498db) | Ball speed -30% | 3 seconds |
| SPLIT | Red (0xe74c3c) | Ball splits into 3 | Permanent |

#### Buff Blocks
- Size: 0.3 x 0.3 x 0.3
- Spawn at random positions on both sides of the cube
- Animation: rotation + pulse glow
- Spawn every 300 frames (~5 seconds)
- Spawn frequency configurable

### 5.2 Visual Effects

#### Hit Effect
- Type: Expanding ring
- Color: Gray
- Duration: 1 second
- Scale: from 1x to 3x

#### Ball Trail
- Type: Small ball particles
- Color: Cyan (0x48dbfb)
- Duration: 0.6 seconds
- Fade-out effect

#### Buff Block Effects
- Center point light
- Outer glow mesh (enlarged by 0.5 units)
- Pulse animation

### 5.3 Audio System (Web Audio API)

#### Paddle Hit Sound
- Type: Square wave oscillator
- Frequency: 800 → 400 Hz
- Duration: 0.1 seconds

#### Wall Bounce Sound
- Type: Sine wave oscillator
- Frequency: 300 → 150 Hz
- Duration: 0.15 seconds

#### Score Sound
- Type: Chord (C5, E5, G5)
- Frequencies: 523.25, 659.25, 783.99 Hz
- Played with staggered delay

### 5.4 Game UI

#### Interface Elements
- Start screen: Title + Start button
- HUD: Scores for both sides, pause button, settings button
- Settings panel: Buff frequency, ball speed, win score, etc.
- Game over screen: Winner display, restart button

#### Control Buttons
- Human/AI toggle: independent control mode for each paddle
- Pause/Resume
- Reset game
- Open/Close settings panel

---

## Project Structure

```text
3d-pong/
├── index.html      # Main page
├── css/
│   └── style.css   # Stylesheet
├── js/
│   └── main.js     # Main game logic
└── ROADMAP.md      # This document
```

---

## Tech Stack

- **Three.js**: 3D rendering engine
- **OrbitControls**: Camera control
- **Web Audio API**: Sound effects
- **Vanilla JavaScript**: Game logic
