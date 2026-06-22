# 3D Pong Game Requirements Document

This document describes how to build a 3D Pong game from scratch, implemented in 5 phases.

---

## Game Overview

A two-player competitive table tennis game played within a 3D cube space. Red side (front) and Green side (back) each control a paddle, scoring by getting the ball to pass through the opponent's paddle.

---

## Project Structure

To keep code organized, it's recommended to separate HTML, CSS, and JavaScript into different files:

```
3d-pong/
├── index.html    # Main HTML file
├── style.css     # Stylesheet
└── main.js       # JavaScript main logic
```

- `index.html`: Contains HTML structure and `importmap` configuration
- `style.css`: Contains all styles
- `main.js`: Contains all JavaScript code including Three.js scene, renderer, camera, controls, etc.

---

## Phase 1: Establishing the 3D Space Concept

### Objectives
- Create a 3D coordinate system (X, Y, Z axes) to help users understand spatial concepts
- Create a visible cube
- Set up an appropriate camera position

### Technical Details

#### Script Loading
- Use traditional `<script>` tags to load Three.js (r128 version)
- Three.js CDN: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`
- OrbitControls: `https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js`
- Reason: r128 version retains the traditional `examples/js` folder, allowing direct opening with `file://` protocol without HTTP server

#### Coordinate System
- Use THREE.js `ArrowHelper` to create coordinate axes with arrows
- X-axis: Red, pointing to the right
- Y-axis: Green, pointing upward
- Z-axis: Blue, pointing forward
- Axis length: 20 units recommended, origin at cube center

#### Cube
- Dimensions: 15 x 15 x 15 units
- Material: `MeshBasicMaterial` with `transparent: true, opacity: 0.15`
- Render properties: `side: THREE.DoubleSide` (to see through back faces), `depthWrite: false` (to avoid transparent object depth conflicts)
- Edges: Use `LineSegments` and `EdgesGeometry` to draw the 12 visible edges
- Edge color: Cyan (0x48dbfb)
- Edge opacity: 0.6
- Edge render order: `renderOrder = 1` (ensures edges render above cube faces)

#### Camera Settings
- Type: `PerspectiveCamera`
- FOV: 65 degrees
- Aspect ratio: Window aspect ratio
- Near plane: 0.1, Far plane: 1000
- Position: (25, 0, 0) - Located on the positive X-axis
- Look at origin: `camera.lookAt(0, 0, 0)`
- Add OrbitControls to allow users to rotate the view

---

## Phase 2: Adding Paddles

### Objectives
- Place a paddle on each side of the cube
- Define paddle size and appearance
- Ensure paddles can move within a certain range
- Implement keyboard controls

### Technical Details

#### Paddle Geometry
- Dimensions: 4 x 4 x 0.3 units (width, height, depth)
- Use `BoxGeometry` to create

#### Front Paddle (Red Side)
- Position: Z = +7.25 (inside the front of the cube)
- Color: 0xff6666 (bright red)
- Material: `MeshBasicMaterial` (no transparency to avoid flickering)

#### Back Paddle (Green Side)
- Position: Z = -7.25 (inside the back of the cube)
- Color: 0x66ff66 (bright green)
- Material: `MeshBasicMaterial` (no transparency to avoid flickering)

#### Movement Range Limits
- X-axis: -5.5 to +5.5 (leaving boundary distance)
- Y-axis: -5.5 to +5.5
- Z-axis: Fixed position

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

## Phase 3: Ball Physics and Collisions

### Objectives
- Create a ball at the center of the cube
- Implement ball movement logic
- Implement ball collision and bounce (4 vertical faces)
- Implement scoring logic (ball passes through opponent's paddle)
- Implement paddle collision (change ball's direction and angle)

### Technical Details

#### Ball
- Geometry: Sphere, radius 0.3, 32 segments
- Material: White `MeshBasicMaterial`
- Initial position: (0, 0, 0)
- Add glow effect: larger semi-transparent sphere overlay

#### Initial Ball Velocity
```javascript
const ballVelocity = new THREE.Vector3(
    (Math.random() > 0.5 ? 1 : -1) * 0.05,  // Random X direction
    (Math.random() > 0.5 ? 1 : -1) * 0.05,  // Random Y direction
    0.05 * 1.6  // Z direction (1.6x fixed speed)
);
```

#### Collision Boundaries
- X-axis boundary: ±7.0 (bounce on contact)
- Y-axis boundary: ±7.0 (bounce on contact)
- Z-axis boundary: ±7.5 (Paddle planes)

#### Bounce Logic
- When ball hits X or Y boundary, reverse the corresponding velocity component
- Position correction: Prevent ball from getting stuck outside boundary

#### Paddle Collision Detection
- Collision area: Paddle center ±2 units (radius)
- Collision conditions:
  - Front: ball Z + 0.5 >= 7.25 AND ball Z <= 7.5
  - Back: ball Z - 0.5 <= -7.25 AND ball Z >= -7.5
  - X, Y coordinates within paddle range

#### Paddle Collision Effects
- Reverse Z velocity (bounce back in original direction)
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

#### Speed Increase
- Multiply speed by 1.05 each time paddle is hit
- Maximum speed limit: 0.3

#### Scoring Logic
- Ball passes through front paddle (Z > 7.5): Back paddle (Green side) scores
- Ball passes through back paddle (Z < -7.5): Front paddle (Red side) scores
- After scoring, reset ball to center, reinitialize velocity randomly

---

## Phase 4: AI Opponent

### Objectives
- Implement AI control algorithm
- Allow players to select manual or AI control for each paddle
- AI should predict ball trajectory and move accordingly

### Technical Details

#### AI Algorithm
```javascript
function moveAIPaddle(paddle, ballPos, ballVel, paddlePos) {
    // Calculate time for ball to reach paddle position
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
        // Ball moving away, return to center position
        paddle.position.x += Math.max(-0.05, Math.min(0.05, -paddle.position.x));
        paddle.position.y += Math.max(-0.05, Math.min(0.05, -paddle.position.y));
    }

    // Limit movement range
    paddle.position.x = Math.max(-5.5, Math.min(5.5, paddle.position.x));
    paddle.position.y = Math.max(-5.5, Math.min(5.5, paddle.position.y));
}
```

#### Control Mode Switching
- Front-end UI provides Human/AI toggle buttons
- Store control modes: `paddleModes = { frontPaddle: 'human', backPaddle: 'ai' }`
- Select keyboard or AI control based on mode

---

## Phase 5: Enhanced Game Features

### 5.1 Buff System

#### Power-up Types
| Name | Color | Effect | Duration |
|------|-------|--------|----------|
| ENLARGE | Green (0x2ecc71) | Paddle enlarged 50% | 3 seconds |
| SHRINK | Orange (0xf39c12) | Opponent paddle shrinks 40% | 3 seconds |
| SLOW | Blue (0x3498db) | Ball speed reduced 30% | 3 seconds |
| SPLIT | Red (0xe74c3c) | Ball splits into 3 | Permanent |

#### Power-up Cubes
- Dimensions: 0.3 x 0.3 x 0.3
- Spawn at random positions on both sides of the cube
- Animation: Rotation + Pulsing glow
- Spawn every 300 frames (~5 seconds)
- Spawn frequency configurable

### 5.2 Visual Effects

#### Starry Background
- 500 stars as a particle system
- Positioned outside the cube (within a spherical space of 20-50 units radius)
- Each star has independent twinkling phase and speed

#### Hit Effect
- Type: Expanding ring
- Color: Gray
- Duration: 1 second
- Scale: From 1x to 3x

#### Ball Trail
- Type: Small ball particles
- Color: Cyan (0x48dbfb)
- Duration: 0.6 seconds
- Fade out effect

#### Power-up Cube Effects
- Center point light
- Outer glow mesh (scaled 0.5 units larger)
- Pulsing animation

### 5.3 Sound System (Web Audio API)

#### Hit Sound
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
- Play with staggered delay

### 5.4 Game UI

#### UI Elements
- Start screen: Title + Start button
- HUD: Both scores, Pause button, Settings button
- Settings panel: Buff frequency, ball speed, winning score, etc.
- Game over screen: Winner display, Restart button

#### Control Buttons
- Human/AI toggle: Independent control mode for each paddle
- Pause/Resume
- Reset game
- Open/Close settings panel

---

## Technology Stack

- **Three.js**: 3D rendering engine
- **OrbitControls**: Camera controls
- **Web Audio API**: Sound effects
- **Vanilla JavaScript**: Game logic

---

## Future Expansion Suggestions

1. **Difficulty Selection**: Different AI speed levels
2. **Skin System**: Custom paddle and ball colors/textures
3. **Multiplayer Mode**: Online play via network
4. **Level System**: Different cube sizes or special rules
