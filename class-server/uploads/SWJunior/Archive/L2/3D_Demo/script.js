// ==================== DOM REFS ====================
const canvas = document.getElementById("game");
const panel = document.getElementById("panel");
const crosshair = document.getElementById("crosshair");
const canvasContainer = document.getElementById("canvas-container");
const objectList = document.getElementById("object-list");
const propsSection = document.getElementById("props-section");
const propsContent = document.getElementById("props-content");
const toastContainer = document.getElementById("toast-container");
const fpsHint = document.getElementById("fps-hint");

// ==================== TOAST ====================
function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 2500);
}

// ==================== THREE.JS SETUP ====================
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#111122");

const camera = new THREE.PerspectiveCamera(75, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 200);
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);

// Lighting
const ambient = new THREE.AmbientLight(0x445577, 1.2);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(10, 15, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 80;
dirLight.shadow.camera.left = -20;
dirLight.shadow.camera.right = 20;
dirLight.shadow.camera.top = 20;
dirLight.shadow.camera.bottom = -20;
scene.add(dirLight);

// Grid
const grid = new THREE.GridHelper(20, 20, 0x444466, 0x222244);
scene.add(grid);

// Axes
const axesGroup = new THREE.Group();
scene.add(axesGroup);
(function createAxes() {
    const len = 10;
    const red = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(len, 0, 0)]),
        new THREE.LineBasicMaterial({ color: 0xff0000 })
    );
    const green = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, len, 0)]),
        new THREE.LineBasicMaterial({ color: 0x00ff00 })
    );
    const blue = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, len)]),
        new THREE.LineBasicMaterial({ color: 0x0066ff })
    );
    axesGroup.add(red, green, blue);
})();

// Origin marker
const originGeo = new THREE.SphereGeometry(0.15, 16, 16);
const originMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x444444 });
const originMarker = new THREE.Mesh(originGeo, originMat);
scene.add(originMarker);

// ==================== MANUAL ORBIT CONTROLS ====================
let orbitTarget = new THREE.Vector3(0, 0, 0);
let spherical = new THREE.Spherical();
let isDragging = false;
let isPanning = false;
let prevMouse = { x: 0, y: 0 };

// Init spherical from camera position relative to target
function updateSpherical() {
    const offset = camera.position.clone().sub(orbitTarget);
    spherical.setFromVector3(offset);
}
updateSpherical();

canvas.addEventListener("mousedown", (e) => {
    if (mode !== "orbit") return;
    if (e.button === 0) { isDragging = true; } // Left = rotate
    if (e.button === 2) { isPanning = true; }  // Right = pan
    prevMouse.x = e.clientX;
    prevMouse.y = e.clientY;
});

window.addEventListener("mouseup", () => { isDragging = false; isPanning = false; });

window.addEventListener("mousemove", (e) => {
    if (mode !== "orbit") return;
    const dx = e.clientX - prevMouse.x;
    const dy = e.clientY - prevMouse.y;
    prevMouse.x = e.clientX;
    prevMouse.y = e.clientY;

    if (isDragging) {
        spherical.theta -= dx * 0.01;
        spherical.phi -= dy * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
    }
    if (isPanning) {
        const right = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);
        camera.getWorldDirection(new THREE.Vector3());
        right.crossVectors(camera.getWorldDirection(new THREE.Vector3()), up).normalize();
        const panSpeed = 0.01 * spherical.radius;
        orbitTarget.addScaledVector(right, -dx * panSpeed);
        orbitTarget.addScaledVector(up, dy * panSpeed);
    }
});

canvas.addEventListener("wheel", (e) => {
    if (mode !== "orbit") return;
    e.preventDefault();
    spherical.radius *= 1 + e.deltaY * 0.001;
    spherical.radius = Math.max(1, Math.min(50, spherical.radius));
}, { passive: false });

canvas.addEventListener("contextmenu", (e) => { e.preventDefault(); });

function updateCameraFromSpherical() {
    const offset = new THREE.Vector3().setFromSpherical(spherical);
    camera.position.copy(orbitTarget).add(offset);
    camera.lookAt(orbitTarget);
}

// ==================== OBJECT SYSTEM ====================
const userObjects = [];
const initialStates = new Map();
let selectedObject = null;
const outlineObjects = [];

function getGeoType() { return document.getElementById("geo-type").value; }
function getObjName() { return document.getElementById("obj-name").value || getGeoType() + "_" + (userObjects.length + 1); }
function getPos() {
    return [
        parseFloat(document.getElementById("pos-x").value) || 0,
        parseFloat(document.getElementById("pos-y").value) || 0,
        parseFloat(document.getElementById("pos-z").value) || 0,
    ];
}
function getColor() { return document.getElementById("obj-color").value; }

function getSizeParams() {
    const t = getGeoType();
    if (t === "box") return {
        w: parseFloat(document.getElementById("s-w").value) || 1,
        h: parseFloat(document.getElementById("s-h").value) || 1,
        d: parseFloat(document.getElementById("s-d").value) || 1
    };
    if (t === "sphere") return { r: parseFloat(document.getElementById("s-r").value) || 0.5 };
    if (t === "cylinder") return {
        rt: parseFloat(document.getElementById("s-rt").value) || 0.5,
        rb: parseFloat(document.getElementById("s-rb").value) || 0.5,
        h: parseFloat(document.getElementById("s-ht").value) || 1
    };
    if (t === "cone") return {
        r: parseFloat(document.getElementById("s-cr").value) || 0.5,
        h: parseFloat(document.getElementById("s-ch").value) || 1
    };
}

function createGeo(type, params) {
    switch (type) {
        case "box": return new THREE.BoxGeometry(params.w, params.h, params.d);
        case "sphere": return new THREE.SphereGeometry(params.r, 32, 32);
        case "cylinder": return new THREE.CylinderGeometry(params.rt, params.rb, params.h, 32);
        case "cone": return new THREE.ConeGeometry(params.r, params.h, 32);
    }
}

function addObject() {
    const type = getGeoType();
    const params = getSizeParams();
    const [px, py, pz] = getPos();
    const color = getColor();
    const name = getObjName();

    const geo = createGeo(type, params);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { name, type, params, color, origPos: new THREE.Vector3(px, py, pz), rotSpeed: new THREE.Vector3(0, 0, 0) };

    scene.add(mesh);
    userObjects.push(mesh);
    initialStates.set(mesh, { pos: mesh.position.clone(), scale: mesh.scale.clone(), color });

    document.getElementById("obj-name").value = "";
    refreshObjectList();
    toast("Added " + name + " (" + type + ")");
}

function deleteObject(mesh) {
    if (selectedObject === mesh) deselectObject();
    scene.remove(mesh);
    const idx = userObjects.indexOf(mesh);
    if (idx >= 0) userObjects.splice(idx, 1);
    initialStates.delete(mesh);
    refreshObjectList();
    toast("Deleted " + mesh.userData.name);
}

function refreshObjectList() {
    if (userObjects.length === 0) {
        objectList.innerHTML = '<p class="muted">No objects added yet</p>';
    } else {
        objectList.innerHTML = userObjects.map((m, i) => {
            const p = m.position;
            return '<div class="obj-item"><span>' + m.userData.name + ' (' + p.x.toFixed(1) + ', ' + p.y.toFixed(1) + ', ' + p.z.toFixed(1) + ')</span><button data-idx="' + i + '">X</button></div>';
        }).join("");
        objectList.querySelectorAll("button").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                deleteObject(userObjects[parseInt(btn.dataset.idx)]);
            });
        });
        objectList.querySelectorAll(".obj-item").forEach((div, i) => {
            div.addEventListener("click", () => selectObject(userObjects[i]));
        });
    }
}

// ==================== SELECTION ====================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function selectObject(mesh) {
    if (selectedObject === mesh) return;
    deselectObject();
    selectedObject = mesh;
    outlineObject(mesh);
    showProperties(mesh);
    toast("Selected " + mesh.userData.name);
}

function deselectObject() {
    clearOutlines();
    selectedObject = null;
    propsSection.style.display = "none";
}

function outlineObject(mesh) {
    clearOutlines();
    const geo = mesh.geometry.clone();
    const outlineMat = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: false, transparent: true, opacity: 0.3, side: THREE.BackSide });
    const outline = new THREE.Mesh(geo, outlineMat);
    outline.scale.set(1.15, 1.15, 1.15);
    outline.position.copy(mesh.position);
    outline.rotation.copy(mesh.rotation);
    outline.userData.isOutline = true;
    scene.add(outline);
    outlineObjects.push(outline);

    const edgeGeo = new THREE.EdgesGeometry(mesh.geometry);
    const edgeLine = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0xffff00 }));
    edgeLine.position.copy(mesh.position);
    edgeLine.rotation.copy(mesh.rotation);
    edgeLine.userData.isOutline = true;
    scene.add(edgeLine);
    outlineObjects.push(edgeLine);
}

function clearOutlines() {
    outlineObjects.forEach(o => scene.remove(o));
    outlineObjects.length = 0;
}

function showProperties(mesh) {
    propsSection.style.display = "block";
    const p = mesh.position;
    const rs = mesh.userData.rotSpeed;
    const s = mesh.scale;
    propsContent.innerHTML =
        '<label>Position</label>' +
        '<div class="row3">' +
        '<input type="number" id="prop-px" value="' + p.x.toFixed(2) + '" step="0.1">' +
        '<input type="number" id="prop-py" value="' + p.y.toFixed(2) + '" step="0.1">' +
        '<input type="number" id="prop-pz" value="' + p.z.toFixed(2) + '" step="0.1">' +
        '</div>' +
        '<label>Rotation Speed</label>' +
        '<div class="row3">' +
        '<input type="number" id="prop-rx" value="' + rs.x.toFixed(2) + '" step="0.1">' +
        '<input type="number" id="prop-ry" value="' + rs.y.toFixed(2) + '" step="0.1">' +
        '<input type="number" id="prop-rz" value="' + rs.z.toFixed(2) + '" step="0.1">' +
        '</div>' +
        '<label>Scale</label>' +
        '<div class="row3">' +
        '<input type="number" id="prop-sx" value="' + s.x.toFixed(2) + '" step="0.1">' +
        '<input type="number" id="prop-sy" value="' + s.y.toFixed(2) + '" step="0.1">' +
        '<input type="number" id="prop-sz" value="' + s.z.toFixed(2) + '" step="0.1">' +
        '</div>' +
        '<button id="btn-apply-props" class="btn-primary">Apply</button>' +
        '<button id="btn-reset-props" class="btn-danger">Reset Transform</button>';

    document.getElementById("btn-apply-props").addEventListener("click", () => {
        mesh.position.set(
            parseFloat(document.getElementById("prop-px").value) || 0,
            parseFloat(document.getElementById("prop-py").value) || 0,
            parseFloat(document.getElementById("prop-pz").value) || 0
        );
        mesh.userData.rotSpeed.set(
            parseFloat(document.getElementById("prop-rx").value) || 0,
            parseFloat(document.getElementById("prop-ry").value) || 0,
            parseFloat(document.getElementById("prop-rz").value) || 0
        );
        mesh.scale.set(
            parseFloat(document.getElementById("prop-sx").value) || 1,
            parseFloat(document.getElementById("prop-sy").value) || 1,
            parseFloat(document.getElementById("prop-sz").value) || 1
        );
        outlineObject(mesh);
        toast("Properties updated");
    });

    document.getElementById("btn-reset-props").addEventListener("click", () => {
        const init = initialStates.get(mesh);
        if (init) {
            mesh.position.copy(init.pos);
            mesh.scale.copy(init.scale);
            mesh.userData.rotSpeed.set(0, 0, 0);
            outlineObject(mesh);
            showProperties(mesh);
            toast("Transform reset");
        }
    });
}

canvas.addEventListener("click", (e) => {
    if (mode === "fps") return;
    if (isDragging || isPanning) return;
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(userObjects, false);
    if (hits.length > 0) {
        selectObject(hits[0].object);
    } else {
        deselectObject();
    }
});

// ==================== GEOMETRY TYPE CHANGE ====================
document.getElementById("geo-type").addEventListener("change", (e) => {
    document.querySelectorAll(".size-fields").forEach(f => f.style.display = "none");
    document.getElementById("size-" + e.target.value).style.display = "flex";
});

// ==================== RANDOM COLOR ====================
document.getElementById("btn-random-color").addEventListener("click", () => {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    document.getElementById("obj-color").value = "#" + [r, g, b].map(c => c.toString(16).padStart(2, "0")).join("");
});

// ==================== SCENE CONTROLS ====================
document.getElementById("bg-color").addEventListener("input", (e) => {
    scene.background = new THREE.Color(e.target.value);
});
document.getElementById("btn-reset-bg").addEventListener("click", () => {
    document.getElementById("bg-color").value = "#111122";
    scene.background = new THREE.Color("#111122");
});

let axesVisible = true;
document.getElementById("btn-toggle-axes").addEventListener("click", function () {
    axesVisible = !axesVisible;
    axesGroup.visible = axesVisible;
    this.textContent = axesVisible ? "Hide Axes" : "Show Axes";
});

let gridVisible = true;
document.getElementById("btn-toggle-grid").addEventListener("click", function () {
    gridVisible = !gridVisible;
    grid.visible = gridVisible;
    this.textContent = gridVisible ? "Hide Grid" : "Show Grid";
});

document.getElementById("btn-reset-scene").addEventListener("click", () => {
    deselectObject();
    while (userObjects.length > 0) scene.remove(userObjects.pop());
    initialStates.clear();
    refreshObjectList();
    propsSection.style.display = "none";
    toast("Scene reset");
});

// ==================== CAMERA CONTROLS ====================
function syncCamUI() {
    document.getElementById("cam-x").value = camera.position.x.toFixed(1);
    document.getElementById("cam-y").value = camera.position.y.toFixed(1);
    document.getElementById("cam-z").value = camera.position.z.toFixed(1);
    document.getElementById("look-x").value = orbitTarget.x.toFixed(1);
    document.getElementById("look-y").value = orbitTarget.y.toFixed(1);
    document.getElementById("look-z").value = orbitTarget.z.toFixed(1);
    document.getElementById("cam-fov").value = camera.fov;
    document.getElementById("fov-val").textContent = camera.fov;
}

document.getElementById("cam-x").addEventListener("input", () => { camera.position.x = parseFloat(document.getElementById("cam-x").value) || 0; updateSpherical(); });
document.getElementById("cam-y").addEventListener("input", () => { camera.position.y = parseFloat(document.getElementById("cam-y").value) || 0; updateSpherical(); });
document.getElementById("cam-z").addEventListener("input", () => { camera.position.z = parseFloat(document.getElementById("cam-z").value) || 0; updateSpherical(); });
document.getElementById("look-x").addEventListener("input", () => { orbitTarget.x = parseFloat(document.getElementById("look-x").value) || 0; });
document.getElementById("look-y").addEventListener("input", () => { orbitTarget.y = parseFloat(document.getElementById("look-y").value) || 0; });
document.getElementById("look-z").addEventListener("input", () => { orbitTarget.z = parseFloat(document.getElementById("look-z").value) || 0; });
document.getElementById("cam-fov").addEventListener("input", (e) => {
    camera.fov = parseInt(e.target.value);
    camera.updateProjectionMatrix();
    document.getElementById("fov-val").textContent = e.target.value;
});

// ==================== COLLAPSIBLE SECTIONS ====================
document.querySelectorAll(".collapsible").forEach(hdr => {
    hdr.addEventListener("click", () => {
        hdr.classList.toggle("collapsed");
        hdr.nextElementSibling.classList.toggle("collapsed");
    });
});

// ==================== ADD OBJECT BUTTON ====================
document.getElementById("btn-add").addEventListener("click", addObject);

// ==================== MODE SWITCHING ====================
let mode = "orbit";
const btnOrbit = document.getElementById("btn-orbit");
const btnFps = document.getElementById("btn-fps");

btnOrbit.addEventListener("click", () => switchMode("orbit"));
btnFps.addEventListener("click", () => switchMode("fps"));

function switchMode(newMode) {
    mode = newMode;
    if (mode === "orbit") {
        btnOrbit.classList.add("active");
        btnFps.classList.remove("active");
        panel.classList.remove("hidden");
        canvasContainer.classList.remove("fullscreen");
        crosshair.classList.remove("visible");
        fpsHint.classList.remove("visible");
        document.exitPointerLock();
        camera.position.set(5, 5, 5);
        orbitTarget.set(0, 0, 0);
        updateSpherical();
        camera.lookAt(orbitTarget);
        syncCamUI();
        deselectObject();
        removeObstacles();
        toast("Orbit mode");
    } else {
        btnFps.classList.add("active");
        btnOrbit.classList.remove("active");
        panel.classList.add("hidden");
        canvasContainer.classList.add("fullscreen");
        crosshair.classList.add("visible");
        fpsHint.classList.add("visible");
        deselectObject();
        playerVelocity.set(0, 0, 0);
        playerOnGround = false;
        isThirdPerson = false;
        camera.position.set(0, 1.7, 8);
        fpsYaw = 0;
        fpsPitch = 0;
        canvas.requestPointerLock();
        spawnObstacles();
        toast("FPS mode — WASD move, mouse look, Space jump, Enter toggle view, Esc back to Orbit");
    }
}

// ==================== FPS MODE ====================
let fpsYaw = 0, fpsPitch = 0;
const playerVelocity = new THREE.Vector3(0, 0, 0);
let playerOnGround = false;
let isThirdPerson = false;

const playerGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 16);
const playerMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.4 });
const playerBody = new THREE.Mesh(playerGeo, playerMat);
playerBody.position.y = 0.75;
playerBody.visible = false;
playerBody.castShadow = true;
scene.add(playerBody);

const obstacles = [];
let obstaclesSpawned = false;

function spawnObstacles() {
    if (obstaclesSpawned) return;
    obstaclesSpawned = true;
    for (let i = 0; i < 15; i++) {
        const types = ["box", "sphere", "cylinder"];
        const type = types[Math.floor(Math.random() * 3)];
        let geo;
        if (type === "box") {
            geo = new THREE.BoxGeometry(0.5 + Math.random() * 1.2, 0.5 + Math.random() * 1.2, 0.5 + Math.random() * 1.2);
        } else if (type === "sphere") {
            geo = new THREE.SphereGeometry(0.35 + Math.random() * 0.7, 16, 16);
        } else {
            geo = new THREE.CylinderGeometry(0.3 + Math.random() * 0.5, 0.3 + Math.random() * 0.5, 0.6 + Math.random() * 1.2, 16);
        }
        const mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
            roughness: 0.5,
            metalness: 0.1
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            (Math.random() - 0.5) * 16,
            0.3 + Math.random() * 0.5,
            (Math.random() - 0.5) * 16
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { isObstacle: true, name: "obstacle_" + i };
        scene.add(mesh);
        obstacles.push(mesh);
    }
}

function removeObstacles() {
    obstacles.forEach(o => scene.remove(o));
    obstacles.length = 0;
    obstaclesSpawned = false;
}

const fpsKeys = {};
window.addEventListener("keydown", (e) => {
    fpsKeys[e.key.toLowerCase()] = true;
    if (mode === "fps" && e.key === "Enter") {
        isThirdPerson = !isThirdPerson;
        toast(isThirdPerson ? "Third-person view" : "First-person view");
    }
    if (mode === "fps" && e.key === "Escape") {
        switchMode("orbit");
    }
});
window.addEventListener("keyup", (e) => { fpsKeys[e.key.toLowerCase()] = false; });

document.addEventListener("mousemove", (e) => {
    if (mode !== "fps" || document.pointerLockElement !== canvas) return;
    const sens = 0.004;
    fpsYaw -= e.movementX * sens;
    fpsPitch -= e.movementY * sens;
    fpsPitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, fpsPitch));
});

function updateFPS(dt) {
    dt = Math.min(dt, 0.1);
    const forward = new THREE.Vector3(-Math.sin(fpsYaw), 0, -Math.cos(fpsYaw)).normalize();
    const right = new THREE.Vector3(Math.cos(fpsYaw), 0, -Math.sin(fpsYaw)).normalize();
    const speed = 6;

    const moveDir = new THREE.Vector3(0, 0, 0);
    if (fpsKeys["w"]) moveDir.add(forward);
    if (fpsKeys["s"]) moveDir.sub(forward);
    if (fpsKeys["a"]) moveDir.sub(right);
    if (fpsKeys["d"]) moveDir.add(right);
    if (moveDir.length() > 0) moveDir.normalize();

    playerVelocity.x = moveDir.x * speed;
    playerVelocity.z = moveDir.z * speed;

    if (!playerOnGround) playerVelocity.y -= 20 * dt;
    else playerVelocity.y = 0;

    if (fpsKeys[" "] && playerOnGround) {
        playerVelocity.y = 8;
        playerOnGround = false;
    }

    const newX = camera.position.x + playerVelocity.x * dt;
    const newY = camera.position.y + playerVelocity.y * dt;
    const newZ = camera.position.z + playerVelocity.z * dt;

    if (newY <= 1.7) { camera.position.y = 1.7; playerOnGround = true; }
    else { camera.position.y = newY; playerOnGround = false; }

    camera.position.x = Math.max(-10, Math.min(10, newX));
    camera.position.z = Math.max(-10, Math.min(10, newZ));

    const playerPos2D = new THREE.Vector2(camera.position.x, camera.position.z);
    for (const obs of obstacles) {
        const obsPos2D = new THREE.Vector2(obs.position.x, obs.position.z);
        const dist = playerPos2D.distanceTo(obsPos2D);
        if (dist < 1.0) {
            const pushDir = playerPos2D.clone().sub(obsPos2D).normalize();
            camera.position.x += pushDir.x * (1.0 - dist);
            camera.position.z += pushDir.y * (1.0 - dist);
        }
    }

    playerBody.position.set(camera.position.x, camera.position.y - 0.75, camera.position.z);

    const lookDir = new THREE.Vector3(-Math.sin(fpsYaw) * Math.cos(fpsPitch), Math.sin(fpsPitch), -Math.cos(fpsYaw) * Math.cos(fpsPitch));

    if (isThirdPerson) {
        playerBody.visible = true;
        const camOffset = lookDir.clone().multiplyScalar(-3);
        camOffset.y += 1.5;
        const thirdPos = camera.position.clone().add(camOffset);
        thirdPos.x = Math.max(-10, Math.min(10, thirdPos.x));
        thirdPos.z = Math.max(-10, Math.min(10, thirdPos.z));
        if (thirdPos.y < 0.5) thirdPos.y = 0.5;
        camera.position.copy(thirdPos);
    } else {
        playerBody.visible = false;
    }
    camera.lookAt(camera.position.clone().add(lookDir));
}

// ==================== UPDATE OUTLINES ====================
function updateOutlines() {
    if (!selectedObject) return;
    outlineObjects.forEach(o => {
        o.position.copy(selectedObject.position);
        o.rotation.copy(selectedObject.rotation);
        if (o.userData.isOutline && o.material.opacity !== undefined) {
            o.scale.copy(selectedObject.scale).multiplyScalar(1.15);
        }
    });
}

// ==================== ANIMATION LOOP ====================
const clock = new THREE.Clock();

function animate() {
    const dt = clock.getDelta();
    requestAnimationFrame(animate);

    if (mode === "orbit") {
        updateCameraFromSpherical();
        syncCamUI();
        userObjects.forEach(m => {
            const rs = m.userData.rotSpeed;
            if (rs.x !== 0 || rs.y !== 0 || rs.z !== 0) {
                m.rotation.x += rs.x * dt;
                m.rotation.y += rs.y * dt;
                m.rotation.z += rs.z * dt;
            }
        });
        updateOutlines();
        playerBody.visible = false;
    } else {
        updateFPS(dt);
    }

    renderer.render(scene, camera);
}

// ==================== RESIZE ====================
window.addEventListener("resize", () => {
    const w = canvasContainer.clientWidth;
    const h = canvasContainer.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
});

animate();
syncCamUI();
toast("Ready — Orbit mode active. Drag to rotate, scroll to zoom, right-drag to pan.");
