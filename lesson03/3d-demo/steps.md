# Three.js Scene Demo — Step-by-Step Guide

## Step 1: 3D Scene Demo (Orbit Mode)

Build an interactive 3D scene where users can add, select, and manipulate geometric objects.

### Scene Setup
- Initialize a Three.js scene with a dark background, a perspective camera at (5, 5, 5), and a WebGL renderer
- Add ambient light and a directional light for proper 3D shading
- Add a grid helper (ground plane reference), coordinate axes (X=red, Y=green, Z=blue), and an origin marker at (0, 0, 0)
- Implement **OrbitControls** so the user can rotate, zoom, and pan the camera with the mouse
- Set up an animation loop with `requestAnimationFrame`

### Adding Geometry Objects
- A **control panel** on the left side with a form to add 3D objects
- Support four geometry types: **Box**, **Sphere**, **Cylinder**, and **Cone**
- Each object has customizable: position (X, Y, Z), size parameters (width/height/depth, radius, etc.), color (with a random color button), and an optional name
- The size input fields change dynamically based on the selected geometry type
- An **object list** showing all added objects with their names and positions, plus a delete button for each

### Object Interaction
- **Click-to-select**: use raycasting to detect which object the user clicks; selected objects get a yellow outline highlight
- A **properties panel** that shows and allows editing of the selected object's:
  - Position (X, Y, Z)
  - Rotation speed (continuous rotation on each axis)
  - Scale (X, Y, Z)
- A "Reset Transform" button to revert the selected object to its initial state

### Scene Controls
- **Background color** picker to change the scene background, with a reset button
- Buttons to **show/hide axes** and **show/hide grid**
- A **Reset Scene** button to remove all user-added objects
- A collapsible **Camera panel** for adjusting camera position, look-at target, and FOV
- A collapsible **Scene Concept** panel explaining the coordinate system
- Toast notifications for user actions

### UI Layout
- Left side: control panel with collapsible sections
- Right side: canvas showing the 3D view
- Responsive canvas that resizes with the window

## Step 2: FPS Mode

Add a first-person shooter mode where the user can walk around the scene.

### Mode Switching
- Add **Orbit / FPS** mode toggle buttons at the top of the control panel
- Switching to FPS mode: hide the control panel, expand the canvas to fullscreen, show a crosshair, disable orbit controls
- Switching back to Orbit mode: restore the control panel, re-enable orbit controls, reset the camera

### FPS Movement
- **WASD** keys for movement (forward, backward, strafe left/right)
- Movement direction follows the camera's facing direction, not world axes
- **Mouse look**: pointer lock for camera rotation, vertical angle clamped to prevent flipping
- **Space** to jump with gravity simulation (velocity decreases over time, landing detection)
- Grid boundary constraints to keep the player within the play area

### Player & Environment
- Create a **player cylinder** representing the player's body (visible in third-person view)
- Spawn **15 random 3D objects** (mixed boxes, spheres, cylinders) scattered across the grid as obstacles
- Implement **collision detection** between the player and these objects
- Press **Enter** to toggle between first-person and third-person view
- Press **Escape** to return to Orbit mode
