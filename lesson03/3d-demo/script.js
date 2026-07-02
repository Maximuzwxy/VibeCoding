// Scene Demo - Three.js Interactive Application
// Main application logic for adding and managing 3D geometries

// Global variables
let scene, camera, renderer, controls;
let axesHelper, gridHelper, originMarker;
let objects = [];
let objectCounter = 0;

// Object selection variables
let selectedObject = null;
let selectedObjectOutline = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Rotation speed step
const ROTATION_SPEED_STEP = 0.01;

// Render control flag
let needsRender = true;

// FPS mode variables
let currentMode = 'orbit'; // 'orbit' or 'fps'
let fpsObjects = []; // Store randomly generated objects in FPS mode
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
const GRID_BOUNDARY = 10; // Grid boundary for FPS movement
const CAMERA_HEIGHT = 1.6; // Eye level height
const MOVE_SPEED = 0.15; // Movement speed
let euler = null; // For FPS camera rotation (initialized in init)
const PI_2 = Math.PI / 2;

// Global variables for FPS player
let playerCylinder = null;  // Player's body cylinder
const PLAYER_RADIUS = 0.5;   // Player cylinder radius (diameter 1)
const PLAYER_HEIGHT = 2;     // Player cylinder height
const CAMERA_OFFSET_Y = 1.6; // Camera height from player feet (eye level)
let isThirdPerson = false;   // Toggle for third-person view (false = first-person, true = third-person)

// Physics variables for jumping
let velocityY = 0;           // Vertical velocity
let isJumping = false;       // Whether player is currently in the air
const GRAVITY = 9.8;         // Gravity acceleration (m/s^2)
const JUMP_FORCE = 5;        // Initial jump velocity (m/s)

// Initialize the application
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // Create camera
    camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    // Create renderer
    const canvas = document.getElementById('scene-canvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Add OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.addEventListener('change', () => {
        needsRender = true;
    });

    // Initialize FPS euler angles
    euler = new THREE.Euler(0, 0, 0, 'YXZ');

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Add origin marker
    addOriginMarker();

    // Add axes helper (lifted slightly to avoid Z-fighting)
    axesHelper = new THREE.AxesHelper(5);
    axesHelper.position.y = 0.01;
    scene.add(axesHelper);

    // Add grid helper
    gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x5a5a5a);
    scene.add(gridHelper);

    // Setup event listeners
    setupEventListeners();

    // Add click event for object selection
    renderer.domElement.addEventListener('click', onSceneClick);

    // Start animation loop
    animate();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

// Add origin marker at (0, 0, 0)
function addOriginMarker() {
    const geometry = new THREE.SphereGeometry(0.1, 16, 16);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.5
    });
    originMarker = new THREE.Mesh(geometry, material);
    originMarker.name = 'Origin Marker';
    scene.add(originMarker);

    // Add label using sprite
    const label = createTextSprite('Origin (0,0,0)', '#ffd700');
    label.position.set(0, 0.3, 0);
    scene.add(label);
}

// Create text sprite for labels
function createTextSprite(text, color) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;

    context.fillStyle = color;
    context.font = 'Bold 24px Arial';
    context.textAlign = 'center';
    context.fillText(text, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1, 0.25, 1);

    return sprite;
}

// Setup all event listeners
function setupEventListeners() {
    // Mode switch buttons
    document.getElementById('orbit-mode-btn').addEventListener('click', () => switchMode('orbit'));
    document.getElementById('fps-mode-btn').addEventListener('click', () => switchMode('fps'));

    // Geometry type change
    document.getElementById('geometry-type').addEventListener('change', updateSizeInputs);

    // Random color button
    document.getElementById('random-color-btn').addEventListener('click', setRandomColor);

    // Background color change
    document.getElementById('bg-color').addEventListener('input', updateBackgroundColor);

    // Reset background color button
    document.getElementById('reset-bg-btn').addEventListener('click', resetBackgroundColor);

    // Object property inputs
    document.getElementById('prop-pos-x').addEventListener('input', updateSelectedObjectTransform);
    document.getElementById('prop-pos-y').addEventListener('input', updateSelectedObjectTransform);
    document.getElementById('prop-pos-z').addEventListener('input', updateSelectedObjectTransform);
    document.getElementById('prop-rot-x').addEventListener('input', updateSelectedObjectTransform);
    document.getElementById('prop-rot-y').addEventListener('input', updateSelectedObjectTransform);
    document.getElementById('prop-rot-z').addEventListener('input', updateSelectedObjectTransform);
    document.getElementById('prop-scale-x').addEventListener('input', updateSelectedObjectTransform);
    document.getElementById('prop-scale-y').addEventListener('input', updateSelectedObjectTransform);
    document.getElementById('prop-scale-z').addEventListener('input', updateSelectedObjectTransform);

    // Reset transform button
    document.getElementById('reset-transform-btn').addEventListener('click', resetSelectedObjectTransform);

    // Add object button
    document.getElementById('add-object-btn').addEventListener('click', addObject);

    // Reset scene button
    document.getElementById('reset-scene-btn').addEventListener('click', resetScene);

    // Toggle axes button
    document.getElementById('toggle-axes-btn').addEventListener('click', toggleAxes);

    // Toggle grid button
    document.getElementById('toggle-grid-btn').addEventListener('click', toggleGrid);

    // Camera parameter inputs
    document.getElementById('cam-pos-x').addEventListener('input', updateCameraFromUI);
    document.getElementById('cam-pos-y').addEventListener('input', updateCameraFromUI);
    document.getElementById('cam-pos-z').addEventListener('input', updateCameraFromUI);
    document.getElementById('cam-target-x').addEventListener('input', updateCameraFromUI);
    document.getElementById('cam-target-y').addEventListener('input', updateCameraFromUI);
    document.getElementById('cam-target-z').addEventListener('input', updateCameraFromUI);
    document.getElementById('cam-fov').addEventListener('input', updateCameraFromUI);

    // Reset camera button
    document.getElementById('reset-camera-btn').addEventListener('click', resetCamera);

    // FPS mode keyboard events
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Pointer lock change event
    document.addEventListener('pointerlockchange', onPointerLockChange);
}

// Update size inputs based on selected geometry type
function updateSizeInputs() {
    const type = document.getElementById('geometry-type').value;
    
    // Hide all size inputs
    document.getElementById('box-size').style.display = 'none';
    document.getElementById('sphere-size').style.display = 'none';
    document.getElementById('cylinder-size').style.display = 'none';
    document.getElementById('cone-size').style.display = 'none';

    // Show relevant size inputs
    if (type === 'box') {
        document.getElementById('box-size').style.display = 'flex';
    } else if (type === 'sphere') {
        document.getElementById('sphere-size').style.display = 'flex';
    } else if (type === 'cylinder') {
        document.getElementById('cylinder-size').style.display = 'flex';
    } else if (type === 'cone') {
        document.getElementById('cone-size').style.display = 'flex';
    }
}

// Set random color
function setRandomColor() {
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    document.getElementById('object-color').value = randomColor;
}

// Update background color
function updateBackgroundColor() {
    const color = document.getElementById('bg-color').value;
    scene.background = new THREE.Color(color);
    showToast(`Background color changed to ${color}`);
    needsRender = true;
}

// Reset background color to default
function resetBackgroundColor() {
    const defaultColor = '#1a1a1a';
    document.getElementById('bg-color').value = defaultColor;
    scene.background = new THREE.Color(defaultColor);
    showToast('Background color reset to default');
    needsRender = true;
}

// Add new object to scene
function addObject() {
    const type = document.getElementById('geometry-type').value;
    const x = parseFloat(document.getElementById('pos-x').value) || 0;
    const y = parseFloat(document.getElementById('pos-y').value) || 0;
    const z = parseFloat(document.getElementById('pos-z').value) || 0;
    const color = document.getElementById('object-color').value;
    let name = document.getElementById('object-name').value.trim();

    // Generate default name if empty
    if (!name) {
        objectCounter++;
        name = `${type.charAt(0).toUpperCase() + type.slice(1)}${objectCounter}`;
    }

    // Create geometry based on type
    let geometry;
    switch(type) {
        case 'box':
            const width = parseFloat(document.getElementById('box-width').value) || 1;
            const height = parseFloat(document.getElementById('box-height').value) || 1;
            const depth = parseFloat(document.getElementById('box-depth').value) || 1;
            geometry = new THREE.BoxGeometry(width, height, depth);
            break;
        
        case 'sphere':
            const radius = parseFloat(document.getElementById('sphere-radius').value) || 0.5;
            geometry = new THREE.SphereGeometry(radius, 32, 32);
            break;
        
        case 'cylinder':
            const cylRadius = parseFloat(document.getElementById('cylinder-radius').value) || 0.5;
            const cylHeight = parseFloat(document.getElementById('cylinder-height').value) || 1;
            geometry = new THREE.CylinderGeometry(cylRadius, cylRadius, cylHeight, 32);
            break;
        
        case 'cone':
            const coneRadius = parseFloat(document.getElementById('cone-radius').value) || 0.5;
            const coneHeight = parseFloat(document.getElementById('cone-height').value) || 1;
            geometry = new THREE.ConeGeometry(coneRadius, coneHeight, 32);
            break;
    }

    // Create material and mesh
    const material = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.5,
        metalness: 0.3
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.name = name;

    // Add to scene
    scene.add(mesh);
    
    // Store object with initial state and rotation speed
    const objectData = {
        mesh: mesh,
        name: name,
        initialTransform: {
            position: { x: x, y: y, z: z },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
        },
        rotationSpeed: { x: 0, y: 0, z: 0 }
    };
    objects.push(objectData);

    // Update object list
    updateObjectList();

    // Show toast notification
    showToast(`Added ${name} at (${x}, ${y}, ${z})`);

    // Clear name input for next object
    document.getElementById('object-name').value = '';
    
    // Mark scene as needing render
    needsRender = true;
}

// Update the object list UI
function updateObjectList() {
    const listContainer = document.getElementById('object-list');
    const countElement = document.getElementById('object-count');
    
    countElement.textContent = objects.length;

    if (objects.length === 0) {
        listContainer.innerHTML = '<p class="empty-message">No objects added yet</p>';
        return;
    }

    listContainer.innerHTML = '';
    objects.forEach((obj, index) => {
        const item = document.createElement('div');
        item.className = 'object-item';
        
        const info = document.createElement('div');
        info.className = 'object-info';
        
        const nameSpan = document.createElement('div');
        nameSpan.className = 'object-name';
        nameSpan.textContent = obj.name;
        
        const posSpan = document.createElement('div');
        posSpan.className = 'object-position';
        posSpan.textContent = `(${obj.mesh.position.x.toFixed(1)}, ${obj.mesh.position.y.toFixed(1)}, ${obj.mesh.position.z.toFixed(1)})`;
        
        info.appendChild(nameSpan);
        info.appendChild(posSpan);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteObject(index);

        item.appendChild(info);
        item.appendChild(deleteBtn);
        listContainer.appendChild(item);
    });
}

// Delete object from scene
function deleteObject(index) {
    const objData = objects[index];
    
    // Dispose geometry and material to prevent memory leaks
    objData.mesh.geometry.dispose();
    if (Array.isArray(objData.mesh.material)) {
        objData.mesh.material.forEach(mat => mat.dispose());
    } else {
        objData.mesh.material.dispose();
    }
    
    scene.remove(objData.mesh);
    objects.splice(index, 1);
    updateObjectList();
    showToast(`Deleted ${objData.name}`);
    needsRender = true;
}

// Reset scene (remove all user-added objects)
function resetScene() {
    objects.forEach(objData => {
        // Dispose geometry and material
        objData.mesh.geometry.dispose();
        if (Array.isArray(objData.mesh.material)) {
            objData.mesh.material.forEach(mat => mat.dispose());
        } else {
            objData.mesh.material.dispose();
        }
        scene.remove(objData.mesh);
    });
    objects = [];
    objectCounter = 0;
    updateObjectList();
    showToast('Scene reset');
    needsRender = true;
}

// Toggle axes visibility
function toggleAxes() {
    const btn = document.getElementById('toggle-axes-btn');
    if (axesHelper.visible) {
        axesHelper.visible = false;
        btn.textContent = 'Show Axes';
        btn.classList.remove('active');
    } else {
        axesHelper.visible = true;
        btn.textContent = 'Hide Axes';
        btn.classList.add('active');
    }
    needsRender = true;
}

// Toggle grid visibility
function toggleGrid() {
    const btn = document.getElementById('toggle-grid-btn');
    if (gridHelper.visible) {
        gridHelper.visible = false;
        btn.textContent = 'Show Grid';
        btn.classList.remove('active');
    } else {
        gridHelper.visible = true;
        btn.textContent = 'Hide Grid';
        btn.classList.add('active');
    }
    needsRender = true;
}

// Toggle collapsible panel
function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    const parent = panel.parentElement;
    parent.classList.toggle('collapsed');
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    toast.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Handle window resize
function onWindowResize() {
    const canvas = document.getElementById('scene-canvas');
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
}

// Handle scene click for object selection
function onSceneClick(event) {
    // Calculate mouse position in normalized device coordinates
    const canvas = renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Get mesh array for raycasting
    const meshArray = objects.map(obj => obj.mesh);
    
    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(meshArray);

    if (intersects.length > 0) {
        // Select the first intersected object
        selectObject(intersects[0].object);
    } else {
        // Deselect if clicked on empty space
        deselectObject();
    }
}

// Select an object
function selectObject(object) {
    // Remove outline from previously selected object
    if (selectedObject && selectedObjectOutline) {
        selectedObject.remove(selectedObjectOutline);
        // Dispose outline geometry and material
        selectedObjectOutline.geometry.dispose();
        selectedObjectOutline.material.dispose();
        selectedObjectOutline = null;
    }

    // Set new selected object
    selectedObject = object;

    // Find the objectData for this mesh
    const objData = objects.find(obj => obj.mesh === object);

    // Add outline to selected object
    const outlineGeometry = new THREE.EdgesGeometry(object.geometry);
    const outlineMaterial = new THREE.LineBasicMaterial({ 
        color: 0xffff00, 
        linewidth: 2 
    });
    selectedObjectOutline = new THREE.LineSegments(outlineGeometry, outlineMaterial);
    selectedObject.add(selectedObjectOutline);

    // Update properties panel with rotation speed
    updatePropertiesPanel(objData);
    
    // Show properties content, hide hint
    document.getElementById('selection-hint').style.display = 'none';
    document.getElementById('properties-content').style.display = 'block';
    
    showToast(`Selected: ${objData.name}`);
    needsRender = true;
}

// Deselect object
function deselectObject() {
    if (selectedObject && selectedObjectOutline) {
        selectedObject.remove(selectedObjectOutline);
        // Dispose outline geometry and material
        selectedObjectOutline.geometry.dispose();
        selectedObjectOutline.material.dispose();
        selectedObjectOutline = null;
    }
    selectedObject = null;

    // Hide properties content, show hint
    document.getElementById('selection-hint').style.display = 'block';
    document.getElementById('properties-content').style.display = 'none';
    needsRender = true;
}

// Update properties panel with selected object's data
function updatePropertiesPanel(objData) {
    if (!selectedObject || !objData) return;

    // Update position
    document.getElementById('prop-pos-x').value = selectedObject.position.x.toFixed(2);
    document.getElementById('prop-pos-y').value = selectedObject.position.y.toFixed(2);
    document.getElementById('prop-pos-z').value = selectedObject.position.z.toFixed(2);

    // Update rotation speed (not rotation angle)
    document.getElementById('prop-rot-x').value = objData.rotationSpeed.x.toFixed(2);
    document.getElementById('prop-rot-y').value = objData.rotationSpeed.y.toFixed(2);
    document.getElementById('prop-rot-z').value = objData.rotationSpeed.z.toFixed(2);

    // Update scale
    document.getElementById('prop-scale-x').value = selectedObject.scale.x.toFixed(2);
    document.getElementById('prop-scale-y').value = selectedObject.scale.y.toFixed(2);
    document.getElementById('prop-scale-z').value = selectedObject.scale.z.toFixed(2);
}

// Update selected object transform based on input values
function updateSelectedObjectTransform() {
    if (!selectedObject) return;

    const objData = objects.find(obj => obj.mesh === selectedObject);
    if (!objData) return;

    // Update position
    selectedObject.position.x = parseFloat(document.getElementById('prop-pos-x').value) || 0;
    selectedObject.position.y = parseFloat(document.getElementById('prop-pos-y').value) || 0;
    selectedObject.position.z = parseFloat(document.getElementById('prop-pos-z').value) || 0;

    // Update rotation speed
    let rotX = parseFloat(document.getElementById('prop-rot-x').value) || 0;
    let rotY = parseFloat(document.getElementById('prop-rot-y').value) || 0;
    let rotZ = parseFloat(document.getElementById('prop-rot-z').value) || 0;
    
    // Store rotation speed
    objData.rotationSpeed.x = rotX;
    objData.rotationSpeed.y = rotY;
    objData.rotationSpeed.z = rotZ;

    // Update scale
    selectedObject.scale.x = parseFloat(document.getElementById('prop-scale-x').value) || 1;
    selectedObject.scale.y = parseFloat(document.getElementById('prop-scale-y').value) || 1;
    selectedObject.scale.z = parseFloat(document.getElementById('prop-scale-z').value) || 1;
}

// Reset selected object transform to initial values
function resetSelectedObjectTransform() {
    if (!selectedObject) return;

    const objData = objects.find(obj => obj.mesh === selectedObject);
    if (!objData) return;

    // Reset to initial position
    selectedObject.position.set(
        objData.initialTransform.position.x,
        objData.initialTransform.position.y,
        objData.initialTransform.position.z
    );
    
    // Reset rotation (angle)
    selectedObject.rotation.set(0, 0, 0);
    
    // Reset to initial scale
    selectedObject.scale.set(
        objData.initialTransform.scale.x,
        objData.initialTransform.scale.y,
        objData.initialTransform.scale.z
    );
    
    // Reset rotation speed
    objData.rotationSpeed.x = 0;
    objData.rotationSpeed.y = 0;
    objData.rotationSpeed.z = 0;

    // Update panel
    updatePropertiesPanel(objData);
    
    showToast('Transform reset to initial values');
    needsRender = true;
}

// Update camera from UI inputs
function updateCameraFromUI() {
    // Update camera position
    const posX = parseFloat(document.getElementById('cam-pos-x').value) || 5;
    const posY = parseFloat(document.getElementById('cam-pos-y').value) || 5;
    const posZ = parseFloat(document.getElementById('cam-pos-z').value) || 5;
    camera.position.set(posX, posY, posZ);

    // Update camera target
    const targetX = parseFloat(document.getElementById('cam-target-x').value) || 0;
    const targetY = parseFloat(document.getElementById('cam-target-y').value) || 0;
    const targetZ = parseFloat(document.getElementById('cam-target-z').value) || 0;
    controls.target.set(targetX, targetY, targetZ);

    // Update FOV
    const fov = parseFloat(document.getElementById('cam-fov').value) || 75;
    camera.fov = fov;
    camera.updateProjectionMatrix();

    needsRender = true;
}

// Update UI from camera state
function updateUIFromCamera() {
    // Update camera position inputs
    document.getElementById('cam-pos-x').value = camera.position.x.toFixed(2);
    document.getElementById('cam-pos-y').value = camera.position.y.toFixed(2);
    document.getElementById('cam-pos-z').value = camera.position.z.toFixed(2);

    // Update camera target inputs
    document.getElementById('cam-target-x').value = controls.target.x.toFixed(2);
    document.getElementById('cam-target-y').value = controls.target.y.toFixed(2);
    document.getElementById('cam-target-z').value = controls.target.z.toFixed(2);

    // Update FOV input
    document.getElementById('cam-fov').value = camera.fov.toFixed(0);
}

// Reset camera to default position
function resetCamera() {
    camera.position.set(5, 5, 5);
    controls.target.set(0, 0, 0);
    camera.fov = 75;
    camera.updateProjectionMatrix();
    controls.update();
    
    updateUIFromCamera();
    showToast('Camera reset to default');
    needsRender = true;
}

// Switch between Orbit and FPS modes
function switchMode(mode) {
    if (mode === currentMode) return;
    
    currentMode = mode;
    
    // Update button states
    document.getElementById('orbit-mode-btn').classList.toggle('active', mode === 'orbit');
    document.getElementById('fps-mode-btn').classList.toggle('active', mode === 'fps');
    
    if (mode === 'fps') {
        enterFPSMode();
    } else {
        exitFPSMode();
    }
}

// Enter FPS mode
function enterFPSMode() {
    // Hide control panel
    document.getElementById('control-panel').classList.add('fps-hidden');
    
    // Hide camera panel
    const cameraPanel = document.querySelector('.camera-panel');
    if (cameraPanel) {
        cameraPanel.classList.add('fps-hidden');
    }
    
    // Make canvas container fill the entire viewport
    document.getElementById('canvas-container').classList.add('fps-fullscreen');
    
    // Show crosshair
    document.getElementById('fps-crosshair').classList.remove('hidden');
    
    // Hide FPS instructions
    document.getElementById('fps-instructions').classList.add('hidden');
    
    // Disable and reset orbit controls to prevent interference
    controls.enabled = false;
    controls.reset();
    
    // Create player cylinder (visible for third-person view)
    const playerGeometry = new THREE.CylinderGeometry(PLAYER_RADIUS, PLAYER_RADIUS, PLAYER_HEIGHT, 16);
    const playerMaterial = new THREE.MeshStandardMaterial({
        color: 0x4CAF50,  // Green color
        transparent: true,
        opacity: 0.8,
        roughness: 0.5,
        metalness: 0.1
    });
    playerCylinder = new THREE.Mesh(playerGeometry, playerMaterial);
    playerCylinder.position.set(0, PLAYER_HEIGHT / 2, 0);
    scene.add(playerCylinder);
    
    // Initialize to first-person view
    isThirdPerson = false;
    
    // Set camera to first-person position (at player's head)
    camera.position.set(0, PLAYER_HEIGHT, 0);
    
    // Reset euler angles for fresh start
    euler.set(0, 0, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);
    
    // Generate random objects on the grid
    generateRandomObjects();
    
    // Request pointer lock on the canvas
    renderer.domElement.requestPointerLock();
    
    // Add mouse move listener specifically for FPS
    document.addEventListener('mousemove', onMouseMove);
    
    // Update canvas size after DOM update
    setTimeout(() => {
        const canvas = document.getElementById('scene-canvas');
        const container = document.getElementById('canvas-container');
        
        // Force canvas to match container size
        canvas.style.width = container.clientWidth + 'px';
        canvas.style.height = container.clientHeight + 'px';
        
        // Update renderer
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        
        needsRender = true;
    }, 100);
    
    showToast('Entered FPS Mode - WASD to move, Mouse to look, Enter to toggle view');
    needsRender = true;
}

// Exit FPS mode
function exitFPSMode() {
    // Remove mouse move listener
    document.removeEventListener('mousemove', onMouseMove);
    
    // Show control panel
    document.getElementById('control-panel').classList.remove('fps-hidden');
    
    // Show camera panel
    const cameraPanel = document.querySelector('.camera-panel');
    if (cameraPanel) {
        cameraPanel.classList.remove('fps-hidden');
    }
    
    // Restore canvas container size
    document.getElementById('canvas-container').classList.remove('fps-fullscreen');
    
    // Hide crosshair
    document.getElementById('fps-crosshair').classList.add('hidden');
    
    // Hide FPS instructions
    document.getElementById('fps-instructions').classList.add('hidden');
    
    // Exit pointer lock
    if (document.pointerLockElement) {
        document.exitPointerLock();
    }
    
    // Remove player cylinder
    if (playerCylinder) {
        scene.remove(playerCylinder);
        playerCylinder.geometry.dispose();
        playerCylinder.material.dispose();
        playerCylinder = null;
    }
    
    // Remove randomly generated objects
    removeRandomObjects();
    
    // Re-enable orbit controls
    controls.enabled = true;
    
    // Reset camera to default orbit position
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
    
    updateUIFromCamera();
    
    // Update canvas size after DOM update
    setTimeout(() => {
        const canvas = document.getElementById('scene-canvas');
        const container = document.getElementById('canvas-container');
        
        // Reset canvas styles
        canvas.style.width = '';
        canvas.style.height = '';
        
        // Update renderer to match container
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        
        needsRender = true;
    }, 100);
    
    // Reset third-person view flag
    isThirdPerson = false;
    
    // Reset jumping state
    velocityY = 0;
    isJumping = false;
    
    showToast('Exited FPS Mode');
    needsRender = true;
}

// Generate random objects on the XZ plane
function generateRandomObjects() {
    const objectCount = 15; // Number of random objects
    const geometries = [
        () => new THREE.BoxGeometry(
            Math.random() * 1.5 + 0.5,
            Math.random() * 2 + 0.5,
            Math.random() * 1.5 + 0.5
        ),
        () => new THREE.SphereGeometry(Math.random() * 0.8 + 0.3, 16, 16),
        () => new THREE.CylinderGeometry(
            Math.random() * 0.5 + 0.2,
            Math.random() * 0.5 + 0.2,
            Math.random() * 1.5 + 0.5,
            16
        )
    ];
    
    for (let i = 0; i < objectCount; i++) {
        // Random position within grid boundary
        const x = (Math.random() - 0.5) * GRID_BOUNDARY * 1.8;
        const z = (Math.random() - 0.5) * GRID_BOUNDARY * 1.8;
        
        // Random geometry type
        const geometryFunc = geometries[Math.floor(Math.random() * geometries.length)];
        const geometry = geometryFunc();
        
        // Random color
        const color = new THREE.Color(Math.random(), Math.random(), Math.random());
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7,
            metalness: 0.2
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Calculate the height offset to place object on the ground
        // Geometry bounding box gives us the dimensions
        geometry.computeBoundingBox();
        const height = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
        const yOffset = height / 2; // Center is at half height
        
        mesh.position.set(x, yOffset, z);
        
        scene.add(mesh);
        fpsObjects.push(mesh);
    }
    
    needsRender = true;
}

// Remove randomly generated objects
function removeRandomObjects() {
    fpsObjects.forEach(obj => {
        scene.remove(obj);
        obj.geometry.dispose();
        obj.material.dispose();
    });
    fpsObjects = [];
    needsRender = true;
}

// Handle keydown events for FPS movement
function onKeyDown(event) {
    if (currentMode !== 'fps') return;
    
    switch (event.code) {
        case 'KeyW':
            moveForward = true;
            break;
        case 'KeyS':
            moveBackward = true;
            break;
        case 'KeyA':
            moveLeft = true;
            break;
        case 'KeyD':
            moveRight = true;
            break;
        case 'Space':
            // Jump when on the ground
            if (!isJumping) {
                velocityY = JUMP_FORCE;
                isJumping = true;
            }
            break;
        case 'Enter':
            // Toggle between first-person and third-person view
            isThirdPerson = !isThirdPerson;
            if (isThirdPerson) {
                showToast('Switched to Third-Person View');
                document.getElementById('fps-crosshair').classList.add('hidden');
            } else {
                showToast('Switched to First-Person View');
                document.getElementById('fps-crosshair').classList.remove('hidden');
            }
            needsRender = true;
            break;
        case 'Escape':
            switchMode('orbit');
            break;
    }
}

// Handle keyup events for FPS movement
function onKeyUp(event) {
    if (currentMode !== 'fps') return;
    
    switch (event.code) {
        case 'KeyW':
            moveForward = false;
            break;
        case 'KeyS':
            moveBackward = false;
            break;
        case 'KeyA':
            moveLeft = false;
            break;
        case 'KeyD':
            moveRight = false;
            break;
    }
}

// Handle mouse movement for FPS camera rotation
function onMouseMove(event) {
    if (currentMode !== 'fps') return;
    
    // Only process movement if pointer is locked
    if (!document.pointerLockElement) return;
    
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
    
    // Update euler angles for camera rotation
    euler.y -= movementX * 0.002;
    euler.x -= movementY * 0.002;
    
    // Clamp vertical rotation to prevent flipping
    euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
    
    // Apply rotation to camera
    camera.quaternion.setFromEuler(euler);
    
    needsRender = true;
}

// Handle pointer lock change
function onPointerLockChange() {
    // If pointer lock is lost, exit FPS mode completely
    if (currentMode === 'fps' && !document.pointerLockElement) {
        exitFPSMode();
    }
}

// Check collision between player and objects
function checkCollision(newX, newZ) {
    if (!playerCylinder) return false;
    
    // Create temporary player position
    const playerPos = new THREE.Vector3(newX, PLAYER_HEIGHT / 2, newZ);
    
    // Check collision with each FPS object
    for (const obj of fpsObjects) {
        // Get object bounding box
        const objBox = new THREE.Box3().setFromObject(obj);
        
        // Create player bounding cylinder approximation (as a box for simplicity)
        const playerBox = new THREE.Box3(
            new THREE.Vector3(newX - PLAYER_RADIUS, 0, newZ - PLAYER_RADIUS),
            new THREE.Vector3(newX + PLAYER_RADIUS, PLAYER_HEIGHT, newZ + PLAYER_RADIUS)
        );
        
        // Check if boxes intersect
        if (playerBox.intersectsBox(objBox)) {
            return true;  // Collision detected
        }
    }
    
    return false;  // No collision
}

// Update FPS camera movement with collision detection
function updateFPSCamera() {
    if (currentMode !== 'fps' || !playerCylinder) return;
    
    // === STEP 1: Calculate movement direction based on player's facing direction (euler.y) ===
    // Forward vector: direction the player is facing
    const forward = new THREE.Vector3();
    forward.set(
        -Math.sin(euler.y),  // X component
        0,
        -Math.cos(euler.y)   // Z component
    );
    forward.normalize();
    
    // Right vector: perpendicular to forward (on XZ plane)
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    
    // === STEP 2: Calculate movement vector based on WASD keys ===
    const moveVector = new THREE.Vector3();
    
    if (moveForward) {
        moveVector.add(forward);
    }
    if (moveBackward) {
        moveVector.sub(forward);
    }
    if (moveLeft) {
        moveVector.sub(right);
    }
    if (moveRight) {
        moveVector.add(right);
    }
    
    // === STEP 3: Move player cylinder (not camera) ===
    if (moveVector.length() > 0) {
        moveVector.normalize().multiplyScalar(MOVE_SPEED);
        
        // Calculate new player position
        const newX = playerCylinder.position.x + moveVector.x;
        const newZ = playerCylinder.position.z + moveVector.z;
        
        // Apply boundary constraints
        const boundedX = Math.max(-GRID_BOUNDARY + PLAYER_RADIUS, Math.min(GRID_BOUNDARY - PLAYER_RADIUS, newX));
        const boundedZ = Math.max(-GRID_BOUNDARY + PLAYER_RADIUS, Math.min(GRID_BOUNDARY - PLAYER_RADIUS, newZ));
        
        // Check collision with objects
        if (!checkCollision(boundedX, boundedZ)) {
            // Update player cylinder position
            playerCylinder.position.x = boundedX;
            playerCylinder.position.z = boundedZ;
            
            needsRender = true;
        }
    }
    
    // === STEP 3.5: Apply gravity and update vertical position ===
    if (isJumping) {
        // Apply gravity: velocity decreases over time
        velocityY -= GRAVITY * 0.016; // Assuming ~60fps (16ms per frame)
        
        // Update player's Y position
        playerCylinder.position.y += velocityY * 0.016;
        
        // Check if player landed on ground
        if (playerCylinder.position.y <= PLAYER_HEIGHT / 2) {
            // Landed on ground
            playerCylinder.position.y = PLAYER_HEIGHT / 2;
            velocityY = 0;
            isJumping = false;
        }
        
        needsRender = true;
    }
    
    // === STEP 4: Update camera position based on view mode ===
    if (isThirdPerson) {
        // Third-person view: camera behind and above player
        const cameraDistance = 5;  // Distance behind player
        const cameraHeightOffset = 3;    // Height offset from ground
        
        // Calculate camera position behind player based on player's rotation
        const yaw = euler.y;
        const offsetX = Math.sin(yaw) * cameraDistance;
        const offsetZ = Math.cos(yaw) * cameraDistance;
        
        camera.position.x = playerCylinder.position.x + offsetX;
        camera.position.y = playerCylinder.position.y + cameraHeightOffset - PLAYER_HEIGHT / 2;
        camera.position.z = playerCylinder.position.z + offsetZ;
        
        // Camera looks at player's head
        const lookTarget = new THREE.Vector3(
            playerCylinder.position.x,
            playerCylinder.position.y + PLAYER_HEIGHT * 0.8 - PLAYER_HEIGHT / 2,
            playerCylinder.position.z
        );
        camera.lookAt(lookTarget);
    } else {
        // First-person view: camera at player's head
        camera.position.x = playerCylinder.position.x;
        camera.position.y = playerCylinder.position.y + PLAYER_HEIGHT / 2;
        camera.position.z = playerCylinder.position.z;
        
        // Apply rotation from euler angles directly to camera
        camera.quaternion.setFromEuler(euler);
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    let hasRotation = false;
    // Update rotation for all objects based on their rotation speed
    objects.forEach(objData => {
        if (objData.rotationSpeed.x !== 0 || objData.rotationSpeed.y !== 0 || objData.rotationSpeed.z !== 0) {
            objData.mesh.rotation.x += objData.rotationSpeed.x;
            objData.mesh.rotation.y += objData.rotationSpeed.y;
            objData.mesh.rotation.z += objData.rotationSpeed.z;
            hasRotation = true;
        }
    });
    
    // Only update orbit controls in orbit mode
    if (currentMode === 'orbit') {
        controls.update();
    }
    
    // Update FPS camera movement
    if (currentMode === 'fps') {
        updateFPSCamera();
    }
    
    // Update UI from camera state (only in orbit mode)
    if (currentMode === 'orbit') {
        updateUIFromCamera();
    }
    
    // Only render when needed
    if (needsRender || hasRotation) {
        render();
        needsRender = false;
    }
}

// Render the scene
function render() {
    renderer.render(scene, camera);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
