// ─── DOM ────────────────────────────────────────────
var startOverlay = document.getElementById('start-overlay');
var startBtn = document.getElementById('start-btn');
var gameoverOverlay = document.getElementById('gameover-overlay');
var restartBtn = document.getElementById('restart-btn');
var scoreEl = document.getElementById('score');
var lengthEl = document.getElementById('length');
var finalScoreEl = document.getElementById('final-score');
var crosshair = document.getElementById('crosshair');

// ─── Three.js Setup ────────────────────────────────
var scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510);
scene.fog = new THREE.Fog(0x050510, 40, 160);

var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.5, 200);
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// ─── Shared Geometries ─────────────────────────────
var BODY_RADIUS = 0.4;
var SEGMENT_SPACING = 1.6;
var TRAIL_RECORD_DISTANCE = 0.3;
var bodyGeo = new THREE.SphereGeometry(BODY_RADIUS, 10, 10);

// ─── Pointer Lock ──────────────────────────────────
var isLocked = false;
var euler = new THREE.Euler(0, 0, 0, 'YXZ');
var PI_2 = Math.PI / 2;

startBtn.addEventListener('click', function () {
  renderer.domElement.requestPointerLock();
});

document.addEventListener('pointerlockchange', function () {
  isLocked = document.pointerLockElement === renderer.domElement;
  if (isLocked) {
    startOverlay.classList.add('hidden');
    crosshair.classList.remove('hidden');
    if (gameState === 'idle') startGame();
    gameState = 'playing';
  } else if (gameState === 'playing') {
    startOverlay.classList.remove('hidden');
    crosshair.classList.add('hidden');
  }
});

document.addEventListener('mousemove', function (e) {
  if (!isLocked) return;
  var sensitivity = 0.002;
  euler.setFromQuaternion(camera.quaternion);
  euler.y -= e.movementX * sensitivity;
  euler.x -= e.movementY * sensitivity;
  euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
  camera.quaternion.setFromEuler(euler);
});

restartBtn.addEventListener('click', function () {
  gameoverOverlay.classList.add('hidden');
  renderer.domElement.requestPointerLock();
  resetGame();
});

// ─── Lighting ──────────────────────────────────────
var ambientLight = new THREE.AmbientLight(0x111133, 0.8);
scene.add(ambientLight);

var pointLight = new THREE.PointLight(0x00ffff, 80, 50);
scene.add(pointLight);

// ─── Ground Grid ───────────────────────────────────
var gridHelper = new THREE.PolarGridHelper(80, 80, 40, 256, 0x003333, 0x001111);
scene.add(gridHelper);

// ─── Boundary Wireframe ────────────────────────────
var boundaryGeo = new THREE.BoxGeometry(100, 100, 100);
var boundaryWire = new THREE.EdgesGeometry(boundaryGeo);
var boundaryLine = new THREE.LineSegments(
  boundaryWire,
  new THREE.LineBasicMaterial({ color: 0x003344, transparent: true, opacity: 0.4 })
);
scene.add(boundaryLine);

// ─── Particles ─────────────────────────────────────
var particlesGeo = new THREE.BufferGeometry();
var particleCount = 600;
var positions = new Float32Array(particleCount * 3);
for (var i = 0; i < particleCount * 3; i += 3) {
  positions[i] = (Math.random() - 0.5) * 120;
  positions[i + 1] = (Math.random() - 0.5) * 120;
  positions[i + 2] = (Math.random() - 0.5) * 120;
}
particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
var particlesMat = new THREE.PointsMaterial({
  color: 0x00aacc,
  size: 0.15,
  transparent: true,
  opacity: 0.6,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
var particles = new THREE.Points(particlesGeo, particlesMat);
scene.add(particles);

// ─── Food ──────────────────────────────────────────
var foodGeo = new THREE.SphereGeometry(0.6, 16, 16);
var foodMat = new THREE.MeshStandardMaterial({
  color: 0xff2266,
  emissive: 0xff2266,
  emissiveIntensity: 2,
  roughness: 0.2,
  metalness: 0.1,
});
var food = new THREE.Mesh(foodGeo, foodMat);

var ringGeo = new THREE.TorusGeometry(0.85, 0.08, 8, 32);
var ringMat = new THREE.MeshBasicMaterial({ color: 0xff6688, transparent: true, opacity: 0.7 });
var foodRing = new THREE.Mesh(ringGeo, ringMat);
food.add(foodRing);

scene.add(food);

// ─── Player Snake ──────────────────────────────────
var bodySegments = [];

function makePlayerMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x00ffcc,
    emissive: 0x006644,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.15,
  });
}

function createPlayerSegment() {
  var mesh = new THREE.Mesh(bodyGeo, makePlayerMaterial());
  scene.add(mesh);
  return mesh;
}

// ─── Game State ────────────────────────────────────
var gameState = 'idle';
var score = 0;
var INITIAL_LENGTH = 18;
var snakeLength = INITIAL_LENGTH;
var BASE_SPEED = 12;
var MAX_SPEED = 22;
var MIN_SPEED = 4;
var currentSpeed = BASE_SPEED;

var trail = [];
var totalDistance = 0;

// ─── AI Snake System ───────────────────────────────
var AI_COUNT = 10;
var AI_LENGTH = 12;
var AI_SPEED_MIN = 5;
var AI_SPEED_MAX = 11;
var aiSnakes = [];

var AI_COLORS = [
  { main: 0xff4488, emissive: 0x660022 },
  { main: 0x44ff88, emissive: 0x006622 },
  { main: 0x4488ff, emissive: 0x002266 },
  { main: 0xffaa00, emissive: 0x663300 },
  { main: 0xff44ff, emissive: 0x660066 },
  { main: 0x44ffff, emissive: 0x006666 },
  { main: 0xffff44, emissive: 0x666600 },
  { main: 0xff6644, emissive: 0x661100 },
  { main: 0x88ff44, emissive: 0x226600 },
  { main: 0xaa44ff, emissive: 0x330066 },
];

function createAISnake(index) {
  var color = AI_COLORS[index];
  var pos = new THREE.Vector3(
    (Math.random() - 0.5) * 70,
    (Math.random() - 0.5) * 70,
    (Math.random() - 0.5) * 70
  );

  // Random starting direction
  var quat = new THREE.Quaternion();
  var axis = new THREE.Vector3(
    Math.random() - 0.5,
    Math.random() - 0.5,
    Math.random() - 0.5
  ).normalize();
  quat.setFromAxisAngle(axis, Math.random() * Math.PI * 2);

  var segments = [];
  for (var i = 0; i < AI_LENGTH; i++) {
    var mat = new THREE.MeshStandardMaterial({
      color: color.main,
      emissive: color.emissive,
      emissiveIntensity: 1.2,
      roughness: 0.3,
      metalness: 0.1,
    });
    var mesh = new THREE.Mesh(bodyGeo, mat);
    mesh.visible = false;
    scene.add(mesh);
    segments.push(mesh);
  }

  var snake = {
    position: pos,
    quaternion: quat,
    speed: AI_SPEED_MIN + Math.random() * (AI_SPEED_MAX - AI_SPEED_MIN),
    color: color,
    segments: segments,
    trail: [{ position: pos.clone(), distance: 0 }],
    totalDist: 0,
    turnTimer: 1 + Math.random() * 3,
    targetYaw: 0,
    targetPitch: 0,
    currentYaw: 0,
    currentPitch: 0,
  };

  // Pre-fill trail so body is visible from start
  var back = new THREE.Vector3(0, 0, 1);
  back.applyQuaternion(quat);
  for (var j = 1; j <= AI_LENGTH * 2; j++) {
    snake.trail.push({
      position: pos.clone().addScaledVector(back, -j * TRAIL_RECORD_DISTANCE),
      distance: -j * TRAIL_RECORD_DISTANCE
    });
  }

  return snake;
}

function initAISnakes() {
  // Remove old AI snakes
  for (var i = 0; i < aiSnakes.length; i++) {
    var segs = aiSnakes[i].segments;
    for (var j = 0; j < segs.length; j++) {
      scene.remove(segs[j]);
      segs[j].material.dispose();
    }
  }
  aiSnakes = [];
  for (var k = 0; k < AI_COUNT; k++) {
    aiSnakes.push(createAISnake(k));
  }
}

function updateAISnake(snake, dt) {
  // Random turning
  snake.turnTimer -= dt;
  if (snake.turnTimer <= 0) {
    snake.turnTimer = 1.5 + Math.random() * 4;
    snake.targetYaw = (Math.random() - 0.5) * Math.PI * 1.5;
    snake.targetPitch = (Math.random() - 0.5) * Math.PI * 0.8;
  }

  // Smooth rotation
  snake.currentYaw += (snake.targetYaw - snake.currentYaw) * 1.5 * dt;
  snake.currentPitch += (snake.targetPitch - snake.currentPitch) * 1.5 * dt;

  var yawQ = new THREE.Quaternion();
  yawQ.setFromAxisAngle(new THREE.Vector3(0, 1, 0), snake.currentYaw * dt);
  var pitchQ = new THREE.Quaternion();
  pitchQ.setFromAxisAngle(new THREE.Vector3(1, 0, 0), snake.currentPitch * dt);
  snake.quaternion.multiplyQuaternions(yawQ, snake.quaternion);
  snake.quaternion.multiply(pitchQ);
  snake.quaternion.normalize();

  // Move forward
  var forward = new THREE.Vector3(0, 0, -1);
  forward.applyQuaternion(snake.quaternion);
  forward.multiplyScalar(snake.speed * dt);
  snake.position.add(forward);

  // Bounce off walls
  var pos = snake.position;
  var bounced = false;
  var bounceStrength = 2.5;
  if (pos.x > 47) { pos.x = 47; snake.targetYaw = -bounceStrength; snake.turnTimer = 0.8; bounced = true; }
  if (pos.x < -47) { pos.x = -47; snake.targetYaw = bounceStrength; snake.turnTimer = 0.8; bounced = true; }
  if (pos.y > 47) { pos.y = 47; snake.targetPitch = -bounceStrength; snake.turnTimer = 0.8; bounced = true; }
  if (pos.y < -47) { pos.y = -47; snake.targetPitch = bounceStrength; snake.turnTimer = 0.8; bounced = true; }
  if (pos.z > 47) { pos.z = 47; snake.targetYaw = Math.PI; snake.turnTimer = 0.8; bounced = true; }
  if (pos.z < -47) { pos.z = -47; snake.targetYaw = Math.PI; snake.turnTimer = 0.8; bounced = true; }

  // Record trail
  snake.totalDist += snake.speed * dt;
  var last = snake.trail[snake.trail.length - 1];
  if (!last || snake.totalDist - last.distance > TRAIL_RECORD_DISTANCE) {
    snake.trail.push({ position: snake.position.clone(), distance: snake.totalDist });
  }

  // Trim
  var maxTD = snake.totalDist - AI_LENGTH * SEGMENT_SPACING - 5;
  while (snake.trail.length > 1 && snake.trail[1].distance < maxTD) {
    snake.trail.shift();
  }

  // Place segments
  for (var i = 0; i < AI_LENGTH; i++) {
    var targetDist = snake.totalDist - (i + 1) * SEGMENT_SPACING;
    if (targetDist < 0) {
      snake.segments[i].visible = false;
      continue;
    }
    snake.segments[i].visible = true;

    var lo = 0, hi = snake.trail.length - 1;
    while (lo < hi - 1) {
      var mid = (lo + hi) >> 1;
      if (snake.trail[mid].distance < targetDist) lo = mid;
      else hi = mid;
    }
    var a = snake.trail[lo];
    var b = snake.trail[hi];
    var t = (targetDist - a.distance) / (b.distance - a.distance + 0.0001);
    t = Math.max(0, Math.min(1, t));
    snake.segments[i].position.lerpVectors(a.position, b.position, t);
  }
}

// ─── Input ─────────────────────────────────────────
var keys = {};
window.addEventListener('keydown', function (e) { keys[e.code] = true; });
window.addEventListener('keyup', function (e) { keys[e.code] = false; });

// ─── Helpers ───────────────────────────────────────
function randomPosition() {
  return new THREE.Vector3(
    (Math.random() - 0.5) * 80,
    (Math.random() - 0.5) * 80,
    (Math.random() - 0.5) * 80
  );
}

function spawnFood() {
  var pos, tooClose;
  var tries = 0;
  do {
    pos = randomPosition();
    tooClose = pos.distanceTo(camera.position) < 10;
    // Avoid player body
    for (var i = 0; i < bodySegments.length; i++) {
      if (bodySegments[i].visible && pos.distanceTo(bodySegments[i].position) < 3) {
        tooClose = true;
        break;
      }
    }
    // Avoid AI snakes
    for (var j = 0; j < aiSnakes.length && !tooClose; j++) {
      if (pos.distanceTo(aiSnakes[j].position) < 3) {
        tooClose = true;
      }
    }
    tries++;
  } while (tooClose && tries < 50);
  food.position.copy(pos);
  food.visible = true;
}

function rebuildPlayerBody() {
  while (bodySegments.length > snakeLength) {
    var seg = bodySegments.pop();
    scene.remove(seg);
    seg.geometry.dispose();
    seg.material.dispose();
  }
  while (bodySegments.length < snakeLength) {
    bodySegments.push(createPlayerSegment());
  }
}

function placePlayerBody() {
  if (trail.length < 2) return;

  for (var i = 0; i < snakeLength; i++) {
    var targetDist = totalDistance - (i + 1) * SEGMENT_SPACING;
    if (targetDist < 0) {
      bodySegments[i].visible = false;
      continue;
    }
    bodySegments[i].visible = true;

    var lo = 0, hi = trail.length - 1;
    while (lo < hi - 1) {
      var mid = (lo + hi) >> 1;
      if (trail[mid].distance < targetDist) lo = mid;
      else hi = mid;
    }

    var a = trail[lo];
    var b = trail[hi];
    var t = (targetDist - a.distance) / (b.distance - a.distance + 0.0001);
    t = Math.max(0, Math.min(1, t));

    bodySegments[i].position.lerpVectors(a.position, b.position, t);
  }
}

// ─── Game Loop ─────────────────────────────────────
var clock = new THREE.Clock();

function startGame() {
  score = 0;
  snakeLength = INITIAL_LENGTH;
  currentSpeed = BASE_SPEED;
  totalDistance = 0;
  trail = [{ position: camera.position.clone(), distance: 0 }];

  // Pre-fill trail so the body appears from the start
  var back = new THREE.Vector3(0, 0, 1);
  back.applyQuaternion(camera.quaternion);
  for (var j = 1; j <= INITIAL_LENGTH * 2; j++) {
    trail.push({
      position: camera.position.clone().addScaledVector(back, -j * TRAIL_RECORD_DISTANCE),
      distance: -j * TRAIL_RECORD_DISTANCE
    });
  }

  rebuildPlayerBody();
  spawnFood();
  initAISnakes();
  updateHUD();
}

function resetGame() {
  while (bodySegments.length) {
    var seg = bodySegments.pop();
    scene.remove(seg);
  }
  camera.position.set(0, 0, 0);
  camera.quaternion.identity();
  euler.set(0, 0, 0);
  startGame();
  gameState = 'playing';
}

function updateHUD() {
  scoreEl.textContent = score;
  lengthEl.textContent = snakeLength;
}

function gameOver() {
  gameState = 'over';
  document.exitPointerLock();
  gameoverOverlay.classList.remove('hidden');
  finalScoreEl.textContent = score;
  crosshair.classList.add('hidden');
}

function update() {
  if (gameState !== 'playing') return;

  var dt = Math.min(clock.getDelta(), 0.1);

  // ── Update AI Snakes ──
  for (var s = 0; s < aiSnakes.length; s++) {
    updateAISnake(aiSnakes[s], dt);
  }

  // ── Player speed control ──
  var targetSpeed = keys['KeyW'] || keys['ArrowUp'] ? MAX_SPEED
    : keys['KeyS'] || keys['ArrowDown'] ? MIN_SPEED
    : BASE_SPEED;
  currentSpeed += (targetSpeed - currentSpeed) * 3 * dt;

  // ── Move forward ──
  var forward = new THREE.Vector3(0, 0, -1);
  forward.applyQuaternion(camera.quaternion);
  forward.multiplyScalar(currentSpeed * dt);
  camera.position.add(forward);

  // ── Record trail ──
  totalDistance += currentSpeed * dt;
  var lastRecord = trail[trail.length - 1];
  if (!lastRecord || totalDistance - lastRecord.distance > TRAIL_RECORD_DISTANCE) {
    trail.push({ position: camera.position.clone(), distance: totalDistance });
  }

  // ── Trim old trail ──
  var maxTrailDist = totalDistance - snakeLength * SEGMENT_SPACING - 5;
  while (trail.length > 1 && trail[1].distance < maxTrailDist) {
    trail.shift();
  }

  // ── Place body segments ──
  placePlayerBody();

  // ── Food collision ──
  if (food.visible && camera.position.distanceTo(food.position) < 2.5) {
    score += 10;
    snakeLength += 1;
    rebuildPlayerBody();
    spawnFood();
    updateHUD();
  }

  // ── Self collision (skip first few segments near head) ──
  for (var i = 10; i < bodySegments.length; i++) {
    if (bodySegments[i].visible && camera.position.distanceTo(bodySegments[i].position) < BODY_RADIUS * 1.8) {
      gameOver();
      return;
    }
  }

  // ── AI collision ──
  for (var a = 0; a < aiSnakes.length; a++) {
    var ais = aiSnakes[a];
    // Head-on-head
    if (camera.position.distanceTo(ais.position) < BODY_RADIUS * 2) {
      gameOver();
      return;
    }
    // Player head hits AI body
    for (var b = 0; b < ais.segments.length; b++) {
      if (ais.segments[b].visible && camera.position.distanceTo(ais.segments[b].position) < BODY_RADIUS * 1.8) {
        gameOver();
        return;
      }
    }
  }

  // ── Boundary collision ──
  var pos = camera.position;
  if (Math.abs(pos.x) > 49 || Math.abs(pos.y) > 49 || Math.abs(pos.z) > 49) {
    gameOver();
    return;
  }

  // ── Food animation ──
  foodRing.rotation.x += dt * 2;
  foodRing.rotation.y += dt * 1.5;
  food.scale.setScalar(1 + Math.sin(Date.now() * 0.004) * 0.15);

  updateHUD();

  // ── Particles ──
  particles.rotation.y += dt * 0.03;
  particles.rotation.x += dt * 0.01;
}

function render() {
  renderer.render(scene, camera);
  pointLight.position.copy(camera.position);
  pointLight.position.y += 2;
}

function loop() {
  requestAnimationFrame(loop);
  update();
  render();
}

// ─── Resize ────────────────────────────────────────
window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Start ─────────────────────────────────────────
rebuildPlayerBody();
initAISnakes();
loop();
