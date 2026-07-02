# 03 The 3D World, Built by You

## Tips

- **Class Server**: http://192.168.66.207:6688
- **Starting a New Project**: Always create a new folder and start a fresh AI chat session. Make sure AI recognizes the new directory context and generates all subsequent code within it.
- **Submitting Homework**: At the end of class, submit your assignment by compressing (zipping) your project folder and uploading it.
- **Console Logs**: If the program behaves unexpectedly, always check the browser Console logs for error messages. Press F12 or Ctrl+Shift+J / Cmd+Option+J to open the Console.

## 3D Concepts

Before building a 3D application, it helps to understand a few fundamental ideas:

### Scene
The **scene** is the container for everything in your 3D world. Think of it as an empty stage where you place objects, lights, and cameras. In Three.js, you create one with `new THREE.Scene()`.

### Objects (Meshes)
3D objects are called **meshes**. Each mesh has two parts:
- **Geometry** — the shape (box, sphere, cylinder, cone, etc.)
- **Material** — the appearance (color, texture, roughness, transparency)

You can position, rotate, and scale objects independently using their X, Y, Z properties.

### Coordinate System
Three.js uses a right-handed **3D coordinate system**:
- **X-axis (red)**: right (positive) / left (negative)
- **Y-axis (green)**: up (positive) / down (negative)
- **Z-axis (blue)**: toward the viewer (positive) / away (negative)

The point (0, 0, 0) is called the **origin** — the center of the scene.

### Camera
The camera defines *what the user sees*. It has its own position and orientation in 3D space:
- **Position**: where the camera is located (X, Y, Z)
- **Look-at target**: what point the camera is pointing at
- **FOV (Field of View)**: how wide the viewing angle is (in degrees) — wider = more peripheral vision, narrower = zoomed in
- Moving the camera is like moving your head in real life — you see the same scene from a different perspective.

### Three.js
Three.js is a JavaScript library that makes 3D graphics in the browser simple. It handles WebGL under the hood, letting you focus on scenes, objects, and cameras instead of low-level graphics code.

- Official site: [https://threejs.org/](https://threejs.org/)

## 3D Scene Demo Project

Build an interactive 3D scene in two steps. (For detailed requirements, see `lesson03/3d-demo/steps.md`.)

### Step 1: 3D Scene Demo (Orbit Mode)
- Set up a Three.js scene with lighting, grid, axes, and OrbitControls
- Add a control panel to create geometric objects (Box, Sphere, Cylinder, Cone)
- Click-to-select objects with a highlight outline
- Edit object properties: position, rotation speed, scale
- Object list with delete, scene reset
- Background color picker, camera parameter controls, toggle axes/grid
- Collapsible UI panels for clean layout

### Step 2: FPS Mode
- Toggle between Orbit mode and FPS mode
- WASD movement following camera direction, mouse look with pointer lock
- Jump with gravity simulation
- Player body (cylinder) with collision detection against random obstacles
- First-person / third-person view toggle
- Grid boundary constraints, random object spawning
