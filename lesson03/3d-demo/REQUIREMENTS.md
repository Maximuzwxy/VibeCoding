# Three.js Scene Demo - Requirements Document

## 1. Project Overview

### 1.1 Purpose
An interactive educational demo application for teaching fundamental Three.js concepts, allowing students to visualize and manipulate 3D objects in real-time.

### 1.2 Target Audience
Students learning 3D graphics and web-based 3D development.

### 1.3 Technology Stack
- **Framework**: Three.js (r128+)
- **Language**: JavaScript (ES6+)
- **Styling**: CSS3
- **Structure**: HTML5 with separated files (HTML/CSS/JS)

---

## 2. Core Features

### 2.1 Dual Interaction Modes

#### Orbit Mode (Default)
- **Camera Control**: Mouse-based rotation, zoom, and pan using OrbitControls
- **Object Selection**: Click to select 3D objects via raycasting
- **Property Editing**: Real-time modification of selected object properties
- **UI Visibility**: Full control panel accessible

#### FPS Mode
- **Immersive Experience**: First-person perspective with pointer lock
- **Movement Controls**: WASD keys for movement based on camera direction
- **Mouse Look**: Mouse movement controls viewing angle
- **Boundary Constraints**: Movement limited within grid boundaries (-10 to 10 on XZ plane)
- **Initial Position**: Camera at (0, 1.6, 0) - eye level height
- **Obstacle Generation**: Randomly generate 10-20 geometric objects as obstacles
- **Exit Mechanism**: Press ESC to return to Orbit Mode and restore original scene
- **Crosshair Display**: Centered crosshair replaces default cursor
- **UI Hiding**: All control panels hidden during FPS mode

### 2.2 Scene Management

#### Background Configuration
- Color picker for scene background color
- Reset button to restore default color (#1a1a1a)

#### Object Creation
- **Supported Geometries**:
  - Box (Cube): Width, Height, Depth parameters
  - Sphere: Radius parameter
  - Cylinder: Radius and Height parameters
  - Cone: Radius and Height parameters
- **Customization Options**:
  - Position (X, Y, Z coordinates)
  - Size parameters (geometry-specific)
  - Color selection with random color option
  - Custom object naming
- **Ground Placement**: Objects automatically positioned to rest on ground plane (Y = height/2)

#### Object Management
- **Object List**: Display all created objects with count indicator
- **Selection Feedback**: Visual outline highlighting for selected objects
- **Property Panel**: Edit position, rotation, and scale of selected objects
- **Object Deletion**: Remove individual objects from scene
- **Resource Cleanup**: Proper disposal of geometry, materials, and textures

### 2.3 Educational Aids

#### Concept Explanation Panel
- Collapsible panel explaining:
  - Scene container concept
  - Origin point (0,0,0)
  - Coordinate axes (Red=X, Green=Y, Blue=Z)

#### Visual Helpers
- **Axes Helper**: RGB-colored coordinate axes (lifted 0.01 units to prevent Z-fighting)
- **Grid Helper**: 20x20 grid on XZ plane for spatial reference
- **Origin Marker**: Visual indicator at world origin

---

## 3. Technical Requirements

### 3.1 Performance Optimization
- **On-Demand Rendering**: Use `needsRender` flag to avoid unnecessary renders
- **Object Pooling**: Reuse temporary Vector3/Matrix4 objects to reduce GC pressure
- **Event Listener Management**: Properly add/remove listeners during mode switches
- **Resource Disposal**: Clean up geometries, materials, and textures when removing objects

### 3.2 State Synchronization
- **Bidirectional UI Binding**:
  - UI → Scene: Input changes update object properties immediately
  - Scene → UI: Controller changes (OrbitControls) update input values
- **Mode State Tracking**: Global `currentMode` variable tracks active mode
- **Selection State**: Maintain `selectedObject` reference for property editing

### 3.3 Physics & Collision (FPS Mode)
- **Gravity Simulation**: Realistic gravity using delta time (`GRAVITY = 9.8 m/s²`)
- **Jump Mechanics**: Jump force with vertical velocity calculation
- **Collision Detection**: Simplified AABB collision for player cylinder
- **Time-Based Movement**: Use `THREE.Clock.getDelta()` for frame-rate independent physics

### 3.4 Camera & View Control
- **OrbitControls Integration**: Damping enabled for smooth camera movement
- **FPS Euler Angles**: YXZ order rotation for proper pitch/yaw control
- **Pitch Limitation**: Restrict vertical rotation to ±90° to prevent gimbal lock
- **Third-Person Toggle**: Optional third-person view with camera offset

---

## 4. User Interface Specifications

### 4.1 Layout Structure
- **Left Control Panel**: Fixed-width collapsible sections
- **Main Canvas Area**: Full viewport 3D rendering area
- **Responsive Design**: Adapts to window resizing

### 4.2 Control Panel Sections
1. **Mode Switch**: Orbit/FPS toggle buttons
2. **Scene Concept**: Educational explanation (collapsible)
3. **Background Color**: Color picker with reset
4. **Add Geometry**: Object creation form (collapsible)
5. **Object List**: Inventory of created objects (collapsible)
6. **Object Properties**: Property editor for selected object (collapsible)

### 4.3 Styling Guidelines
- **Consistent Spacing**: Uniform padding across all panels
- **Border Radius**: Consistent rounded corners on buttons and inputs
- **Flexbox Layout**: Proper use of `min-width: 0` for flex children
- **Box Sizing**: All form controls use `border-box`
- **Scrollbar Hiding**: Hide scrollbars while maintaining scroll functionality
- **Collapsed State Animation**: Smooth transitions with reasonable `max-height`

### 4.4 Interactive Feedback
- **Real-Time Updates**: Property changes reflected immediately in scene
- **Visual Selection**: Outline effect on selected objects
- **Empty State Messages**: Clear messaging when no objects exist
- **Operation Hints**: Brief tooltips or hints for user actions

---

## 5. Code Quality Standards

### 5.1 Documentation
- **Comments**: All code comments in English
- **Function Descriptions**: Clear purpose and parameter explanations
- **Section Headers**: Organized code blocks with descriptive comments

### 5.2 Architecture
- **Separation of Concerns**: HTML structure, CSS styling, JS logic in separate files
- **Global Variables**: Minimized and clearly documented
- **Initialization Pattern**: `DOMContentLoaded` event listener for safe DOM access
- **Defensive Programming**: Null checks before DOM operations

### 5.3 Best Practices
- **No Hard-Coded Time Steps**: Always use `clock.getDelta()` for physics
- **Geometry Origin Handling**: Account for center-origin when placing objects on ground
- **Z-Fighting Prevention**: Offset overlapping helpers by small epsilon values
- **Event Cleanup**: Remove event listeners when switching modes or destroying objects

---

## 6. Known Constraints & Considerations

### 6.1 Browser Compatibility
- Requires WebGL support
- Pointer Lock API required for FPS mode
- Modern browser recommended (Chrome, Firefox, Edge, Safari)

### 6.2 Performance Limits
- Recommended object count: <100 for smooth performance
- Grid boundary: ±10 units for FPS mode
- Camera near/far planes: 0.1 to 1000

### 6.3 User Experience Notes
- FPS mode requires user interaction to activate pointer lock
- ESC key always exits FPS mode
- Object selection disabled in FPS mode
- UI panels default to collapsed state for clean interface

---

## 7. Future Enhancement Opportunities

- [ ] Import/export scene configurations (JSON)
- [ ] Undo/redo functionality for object operations
- [ ] Material library with presets (metallic, glass, etc.)
- [ ] Lighting controls (add/remove/modify lights)
- [ ] Animation timeline for object transformations
- [ ] Multi-object selection and batch operations
- [ ] Screenshot/export rendered image feature
- [ ] Mobile touch controls adaptation

---

## 8. File Structure

```
scene-demo/
├── index.html      # Main HTML structure and UI layout
├── style.css       # All styling and responsive design
└── script.js       # Three.js logic and application behavior
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-04-26  
**Status**: Active Implementation
