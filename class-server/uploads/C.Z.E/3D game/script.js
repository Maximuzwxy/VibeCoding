// ==================== THREE.JS SCENE ====================
const container = document.getElementById('canvas-container');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);
scene.fog = new THREE.Fog(0x0a0a1a, 25, 65);

const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.5, 60);
camera.position.set(0, 4, 11);
camera.lookAt(0, 2, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// OrbitControls — always enabled for mouse drag
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2, 1);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.maxPolarAngle = Math.PI * 0.55;
controls.minDistance = 5;
controls.maxDistance = 30;
controls.update();

// Lights
scene.add(new THREE.AmbientLight(0x334466, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(10, 20, -5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 60;
dirLight.shadow.camera.left = -20;
dirLight.shadow.camera.right = 20;
dirLight.shadow.camera.top = 20;
dirLight.shadow.camera.bottom = -5;
scene.add(dirLight);

const spot1 = new THREE.SpotLight(0x4488cc, 0.4);
spot1.position.set(-4, 10, 3); spot1.angle = 0.5;
scene.add(spot1);
const spot2 = new THREE.SpotLight(0xcc4444, 0.4);
spot2.position.set(4, 10, 3); spot2.angle = 0.5;
scene.add(spot2);

// ==================== COURT ====================
const COURT_W = 7, COURT_H = 5, COURT_D = 7;
const WALL_THICK = 0.3;
const FLOOR_Y = 0;
const FRONT_Z = 0;
const BACK_Z = COURT_D;

const wallMat = new THREE.MeshStandardMaterial({ color: 0x2a3050, roughness: 0.6, metalness: 0.2, transparent: true, opacity: 0.5 });
const floorMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7, metalness: 0.1 });
// Front wall: SOLID (opaque)
const frontWallMat = new THREE.MeshStandardMaterial({ color: 0x3a4060, roughness: 0.3, metalness: 0.3 });

// Floor
const floor = new THREE.Mesh(new THREE.PlaneGeometry(COURT_W, COURT_D), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.set(0, FLOOR_Y, COURT_D / 2);
floor.receiveShadow = true;
scene.add(floor);

// Back wall (transparent)
const backWall = new THREE.Mesh(new THREE.BoxGeometry(COURT_W + WALL_THICK * 2, COURT_H, WALL_THICK), wallMat);
backWall.position.set(0, COURT_H / 2, BACK_Z);
backWall.receiveShadow = true;
scene.add(backWall);

// Front wall (SOLID)
const frontWall = new THREE.Mesh(new THREE.BoxGeometry(COURT_W + WALL_THICK * 2, COURT_H, WALL_THICK), frontWallMat);
frontWall.position.set(0, COURT_H / 2, FRONT_Z);
frontWall.receiveShadow = true;
scene.add(frontWall);

// Left wall
const leftWall = new THREE.Mesh(new THREE.BoxGeometry(WALL_THICK, COURT_H, COURT_D), wallMat);
leftWall.position.set(-COURT_W / 2, COURT_H / 2, COURT_D / 2);
leftWall.receiveShadow = true;
scene.add(leftWall);

// Right wall
const rightWall = new THREE.Mesh(new THREE.BoxGeometry(WALL_THICK, COURT_H, COURT_D), wallMat);
rightWall.position.set(COURT_W / 2, COURT_H / 2, COURT_D / 2);
rightWall.receiveShadow = true;
scene.add(rightWall);

const TIN_HEIGHT = 2.1;

// Tin line
const tinGeo = new THREE.BoxGeometry(COURT_W + WALL_THICK * 2, 0.08, 0.12);
const tin = new THREE.Mesh(tinGeo, new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0x440000, roughness: 0.3 }));
tin.position.set(0, TIN_HEIGHT, FRONT_Z + 0.1);
scene.add(tin);

// Out line on top of front wall
const outGeo = new THREE.BoxGeometry(COURT_W + WALL_THICK * 2, 0.08, 0.12);
const outLine = new THREE.Mesh(outGeo, new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0x440000, roughness: 0.3 }));
outLine.position.set(0, COURT_H, FRONT_Z + 0.1);
scene.add(outLine);

// Court lines
function addLine(x1, z1, x2, z2, color) {
  const pts = [new THREE.Vector3(x1, FLOOR_Y + 0.02, z1), new THREE.Vector3(x2, FLOOR_Y + 0.02, z2)];
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color })));
}
addLine(-COURT_W / 2, COURT_D * 0.55, COURT_W / 2, COURT_D * 0.55, 0xcccccc);
addLine(0, COURT_D * 0.55, 0, COURT_D, 0xcccccc);
addLine(-COURT_W / 2, FRONT_Z, -COURT_W / 2, COURT_D, 0x444444);
addLine(COURT_W / 2, FRONT_Z, COURT_W / 2, COURT_D, 0x444444);

// ==================== AUDIENCE (all sides except front wall) ====================
const spectators = [];
const spectatorClapArms = [];
const STANDS_DIST = 5; // ~half-court distance from wall
const STANDS_D = 3.5;
const seatMat = new THREE.MeshStandardMaterial({ color: 0x444466, roughness: 0.5, metalness: 0.3 });

function createStands(x, z, rotY, standWidth) {
  const group = new THREE.Group();
  const tiers = 5;
  const bodyColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c, 0xe67e22, 0xecf0f1, 0xff6b6b, 0x4fc3f7];
  const skinColors = [0xf5cba7, 0xd4a574, 0xc68642, 0x8d5524, 0xf0d9b5];
  const aw = standWidth || (COURT_W + 5);

  for (let t = 0; t < tiers; t++) {
    const tierY = t * 1.1;
    const tierGeo = new THREE.BoxGeometry(aw, 0.7, STANDS_D);
    const tier = new THREE.Mesh(tierGeo, seatMat);
    tier.position.set(0, tierY, -STANDS_D / 2);
    tier.castShadow = true; tier.receiveShadow = true;
    group.add(tier);

    const count = t === 0 ? 14 : (t === 1 ? 12 : (t === 2 ? 10 : (t === 3 ? 8 : 6)));
    const spread = aw;
    for (let s = 0; s < count; s++) {
      const sx = (s - (count - 1) / 2) * (spread / count) * 0.95;
      const sz = -STANDS_D / 2 + 0.3;
      const body = new THREE.Group();

      const bodyColor = bodyColors[(t * 7 + s) % bodyColors.length];
      const skinColor = skinColors[(t * 3 + s) % skinColors.length];

      const torso = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.16, 0.45, 8),
        new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.6 })
      );
      torso.position.y = 0.4;
      body.add(torso);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 8, 8),
        new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.5 })
      );
      head.position.y = 0.72;
      body.add(head);

      const armGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.25, 6);
      const armMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.6 });
      const armL = new THREE.Mesh(armGeo, armMat);
      armL.position.set(-0.18, 0.5, 0);
      armL.rotation.z = 0.8;
      body.add(armL);
      const armR = new THREE.Mesh(armGeo, armMat);
      armR.position.set(0.18, 0.5, 0);
      armR.rotation.z = -0.8;
      body.add(armR);
      spectatorClapArms.push({ body, armL, armR });

      body.position.set(sx, tierY + 0.45, sz);
      body.rotation.y = Math.PI;
      spectators.push(body);
      group.add(body);
    }
  }

  group.position.set(x, FLOOR_Y, z);
  group.rotation.y = rotY;
  group.receiveShadow = true;
  scene.add(group);
}

// Back wall stands
createStands(0, BACK_Z + WALL_THICK + STANDS_DIST, 0);
// Left wall stands
createStands(-COURT_W / 2 - WALL_THICK - STANDS_DIST, COURT_D / 2, -Math.PI / 2, COURT_D + 5);
// Right wall stands
createStands(COURT_W / 2 + WALL_THICK + STANDS_DIST, COURT_D / 2, Math.PI / 2, COURT_D + 5);

// ==================== BALL ====================
const BALL_R = 0.12;
const ballGeo = new THREE.SphereGeometry(BALL_R, 16, 16);
const ballMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.1, emissive: 0x111111 });
const ball = new THREE.Mesh(ballGeo, ballMat);
ball.castShadow = true;
ball.position.set(0, 1.5, COURT_D * 0.7);
scene.add(ball);

const glowGeo = new THREE.TorusGeometry(BALL_R * 1.4, 0.03, 8, 16);
const glowMat = new THREE.MeshBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.6 });
const glowRing = new THREE.Mesh(glowGeo, glowMat);
ball.add(glowRing);

let ballV = new THREE.Vector3(0, 0, 0);
let ballBounces = 0;
let lastHitter = null;
let ballHitFront = false; // ball must hit front wall before opponent can hit

// ==================== PLAYERS (TENNIS RACKETS) ====================
function createRacket(color, emissiveColor) {
  const group = new THREE.Group();

  // Head frame — elliptical torus
  const frameGeo = new THREE.TorusGeometry(0.35, 0.04, 8, 24);
  const frame = new THREE.Mesh(frameGeo, new THREE.MeshStandardMaterial({
    color: 0xdddddd, roughness: 0.2, metalness: 0.7
  }));
  frame.scale.set(1, 1.25, 1); // elliptical shape
  group.add(frame);

  // Grip / Handle
  const gripGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.8, 12);
  const grip = new THREE.Mesh(gripGeo, new THREE.MeshStandardMaterial({
    color: 0x1a1a1a, roughness: 0.8
  }));
  grip.position.y = -0.7;
  group.add(grip);

  // Grip wrap rings
  for (let i = 0; i < 6; i++) {
    const ringGeo = new THREE.TorusGeometry(0.058, 0.008, 4, 12);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5 }));
    ring.position.y = -0.7 + i * 0.13;
    group.add(ring);
  }

  // Butt cap
  const capGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.06, 12);
  const cap = new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({ color: 0x333333 }));
  cap.position.y = -1.1;
  group.add(cap);

  // Racket glow — outline on floor
  const floorGlowGeo = new THREE.TorusGeometry(0.4, 0.04, 8, 24);
  const floorGlow = new THREE.Mesh(floorGlowGeo, new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.6
  }));
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.position.y = -1.2;
  floorGlow.scale.set(1, 1.25, 1);
  group.add(floorGlow);

  // Racket stands vertically, facing +z (toward front wall)
  group.castShadow = true;
  group.receiveShadow = true;
  return group;
}

const p1Mesh = createRacket(0x4fc3f7);
const p2Mesh = createRacket(0xff6b6b);

const RACKET_Y = FLOOR_Y + 2.0;

const player1 = { mesh: p1Mesh, x: -1.5, z: COURT_D * 0.7, score: 0, color: '#4fc3f7', name: 'P1' };
const player2 = { mesh: p2Mesh, x: 1.5, z: COURT_D * 0.7, score: 0, color: '#ff6b6b', name: 'P2' };

p1Mesh.position.set(player1.x, RACKET_Y, player1.z);
p2Mesh.position.set(player2.x, RACKET_Y, player2.z);
scene.add(p1Mesh);
scene.add(p2Mesh);

// ==================== GAME STATE ====================
let aiMode = false, aiDifficulty = 2;
let gameState = 'menu';
let servePlayer = 1;
let countdownVal = 0;
let keys = {};
const WIN_SCORE = 7;

// ==================== AUDIO ====================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let musicMuted = false;
let sfxMuted = false;
let bgmGain, bgmNodes = [];

function initAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (!bgmGain) {
    bgmGain = audioCtx.createGain();
    bgmGain.gain.value = 0.06;
    bgmGain.connect(audioCtx.destination);
  }
}
function playBeep(freq, dur, vol, type) {
  if (!audioCtx || sfxMuted) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type || 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(vol || 0.08, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + dur);
}
function playNoise(dur, vol) {
  if (!audioCtx || sfxMuted) return;
  const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * vol;
  const src = audioCtx.createBufferSource();
  const g = audioCtx.createGain();
  src.buffer = buf;
  g.gain.setValueAtTime(vol || 0.05, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  src.connect(g); g.connect(audioCtx.destination);
  src.start();
}

function sfxHit() { playBeep(600, 0.15, 0.1); setTimeout(() => playBeep(900, 0.1, 0.08), 60); }
function sfxWall() { playBeep(200, 0.12, 0.06); }
function sfxFrontWall() { playBeep(400, 0.15, 0.08); }
function sfxScore() { playBeep(300, 0.25, 0.08); setTimeout(() => playBeep(150, 0.3, 0.08), 150); }
function sfxCountdown() { playBeep(440, 0.15, 0.1); }
function sfxWin() { playBeep(523, 0.15, 0.1); setTimeout(() => playBeep(659, 0.15, 0.1), 150); setTimeout(() => playBeep(784, 0.25, 0.12), 300); }
function sfxClap() {
  // Multiple rapid claps — louder and more distinct
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      playNoise(0.08, 0.1);
      playBeep(800, 0.03, 0.06, 'square');
    }, i * 120 + Math.random() * 50);
  }
  playNoise(0.12, 0.15);
  playBeep(600, 0.04, 0.08, 'square');
}

function sfxCheer() {
  // Rising crowd cheer — layered noise + whoops
  for (let i = 0; i < 12; i++) {
    setTimeout(() => {
      playNoise(0.1, 0.08);
    }, i * 100 + Math.random() * 60);
  }
  // Rising "wooh!" tones
  [400, 520, 660, 800].forEach((freq, i) => {
    setTimeout(() => playBeep(freq, 0.2, 0.04, 'sawtooth'), i * 180);
  });
  // Sustained background roar
  playNoise(0.5, 0.06);
  setTimeout(() => playNoise(0.4, 0.05), 200);
  setTimeout(() => playNoise(0.35, 0.04), 400);
}

function sfxCrowdReact() {
  sfxClap();
  setTimeout(() => sfxCheer(), 100);
}

// ==================== BACKGROUND MUSIC ====================
const bgmNotes = [261, 329, 392, 329, 349, 293, 261, 293, 329, 261, 392, 440, 392, 349, 329, 293];
let bgmIndex = 0, bgmNextTime = 0;

function startBGM() {
  bgmIndex = 0;
}
function stopBGM() {
  bgmNodes.forEach(n => { try { n.stop(); } catch(e){} });
  bgmNodes = [];
}
function updateBGM(tSec) {
  if (!audioCtx || !bgmGain || musicMuted || gameState !== 'playing') { stopBGM(); return; }
  if (tSec < bgmNextTime) return;
  const note = bgmNotes[bgmIndex % bgmNotes.length];
  const duration = (bgmIndex % 4 === 0) ? 0.7 : 0.55;
  bgmIndex++;
  bgmNextTime = tSec + duration * 1.2;

  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'triangle';
  o.frequency.value = note;
  g.gain.setValueAtTime(0.06, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  o.connect(g); g.connect(bgmGain);
  o.start(); o.stop(audioCtx.currentTime + duration);
  bgmNodes.push(o);

  // Cleanup old nodes
  bgmNodes = bgmNodes.filter(n => {
    try { return n.context.currentTime < (n.stopTime || 0); } catch(e) { return false; }
  });
}

// ==================== AUDIENCE CLAP ====================
let clapTriggered = false;
let clapStartTime = 0;

function triggerClap() {
  clapTriggered = true;
  clapStartTime = performance.now() / 1000;
  sfxCrowdReact();
}
function animateClap(time) {
  if (!clapTriggered) return;
  const elapsed = time - clapStartTime;
  if (elapsed > 2.5) { clapTriggered = false; return; }
  const beatPeriod = 0.22;
  const beatIndex = Math.floor(elapsed / beatPeriod);
  const beatPhase = (elapsed % beatPeriod) / beatPeriod;
  spectatorClapArms.forEach((s, i) => {
    if ((i + beatIndex) % 3 === 0) {
      const angle = 0.7 + Math.sin(beatPhase * Math.PI * 2) * 0.45;
      s.armL.rotation.z = angle;
      s.armR.rotation.z = -angle;
    }
  });
}

// ==================== PHYSICS ====================
const GRAVITY = -12;
const BALL_BOUNCE = 0.7;
const HIT_POWER = 8;
const PLAYER_SPEED = 8;
const AI_SPEED = { 1: 4, 2: 6, 3: 9 };
const AI_REACTION = { 1: 0.3, 2: 0.6, 3: 0.85 };
const HIT_RADIUS = 1.4;

function courtBounds() {
  return {
    minX: -COURT_W / 2 + BALL_R,
    maxX: COURT_W / 2 - BALL_R,
    minY: BALL_R,
    maxY: COURT_H - BALL_R,
    minZ: FRONT_Z + BALL_R,
    maxZ: BACK_Z - BALL_R,
  };
}

function updateBall(dt) {
  // Sub-stepping to prevent tunneling through walls
  const subSteps = 3;
  const subDt = dt / subSteps;

  for (let s = 0; s < subSteps; s++) {
  ballV.y += GRAVITY * subDt;
  ball.position.x += ballV.x * subDt;
  ball.position.y += ballV.y * subDt;
  ball.position.z += ballV.z * subDt;

  const b = courtBounds();
  let hitWall = false;

  // Floor bounce — two bounces = fault
  if (ball.position.y <= b.minY) {
    ball.position.y = b.minY;
    ballV.y = Math.abs(ballV.y) * BALL_BOUNCE;
    ballV.x *= 0.92; ballV.z *= 0.92;
    ballBounces++;
    hitWall = true;
    if (ballBounces >= 2) { scorePoint(); return; }
  }
  if (ball.position.y >= b.maxY) { ball.position.y = b.maxY; ballV.y = -Math.abs(ballV.y) * BALL_BOUNCE; hitWall = true; }
  if (ball.position.x <= b.minX) { ball.position.x = b.minX; ballV.x = Math.abs(ballV.x) * BALL_BOUNCE; hitWall = true; }
  if (ball.position.x >= b.maxX) { ball.position.x = b.maxX; ballV.x = -Math.abs(ballV.x) * BALL_BOUNCE; hitWall = true; }
  // Front wall — marks ball as eligible for opponent to hit
  if (ball.position.z <= b.minZ) {
    ball.position.z = b.minZ;
    ballV.z = Math.abs(ballV.z) * BALL_BOUNCE;
    ballBounces = 0;
    ballHitFront = true;
    hitWall = true;
    sfxFrontWall();
  }
  if (ball.position.z >= b.maxZ) { ball.position.z = b.maxZ; ballV.z = -Math.abs(ballV.z) * BALL_BOUNCE; hitWall = true; }

  if (hitWall && !(ball.position.z <= b.minZ)) sfxWall();
  }

  // Ensure ball never comes to a dead stop
  if (ballV.length() < 0.5) {
    const rndAngle = Math.random() * Math.PI * 2;
    ballV.set(Math.cos(rndAngle) * 1.5, 2, ballV.z > 0 ? 1 : -1);
  }
}

function hitBall(player) {
  // Auto-fly toward the front wall (z=0)
  const dx = ball.position.x - player.x;
  ballV.x = dx * 2;                  // slight angle based on hit position
  ballV.z = -HIT_POWER;              // always toward front wall
  ballV.y = HIT_POWER * 0.5;
  ballBounces = 0;
  ballHitFront = false;
  lastHitter = player;
  sfxHit();
}

// Only allow hitting if ball has hit front wall (or it's the serve)
function checkPlayerHit(player) {
  // Must be a different player from last hitter (or no last hitter yet)
  if (lastHitter === player) return;
  // Ball must have hit front wall since last hit (or it's the serve: lastHitter is null)
  if (lastHitter !== null && !ballHitFront) return;

  const dx = ball.position.x - player.x;
  const dz = ball.position.z - player.z;
  const dy = ball.position.y - (FLOOR_Y + 0.9);
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (dist < HIT_RADIUS && ball.position.z < player.z + 1) {
    hitBall(player);
  }
}

function scorePoint() {
  if (gameState !== 'playing') return;
  // If ball hit front wall: returner failed → lastHitter scores
  // If ball never hit front wall: lastHitter's bad shot → opponent scores
  const scorer = ballHitFront ? lastHitter : (lastHitter === player1 ? player2 : player1);
  scorer.score++;
  sfxScore();
  triggerClap();
  updateHUD();

  if (scorer.score >= WIN_SCORE) { endGame(scorer); return; }

  ball.position.set(0, 1.5, COURT_D * 0.7);
  ballV.set(0, 0, 0);
  ballBounces = 0;
  lastHitter = null;
  ballHitFront = false;
  servePlayer = scorer === player1 ? 1 : 2;

  const si = document.getElementById('serve-indicator');
  si.style.display = 'block';
  si.textContent = scorer.name + ' serves';
  si.style.color = scorer.color;

  setTimeout(() => {
    if (gameState !== 'playing') return;
    document.getElementById('serve-indicator').style.display = 'none';
    const server = servePlayer === 1 ? player1 : player2;
    ball.position.set(server.x, 1.5, server.z - 0.5);
    ballV.set(0, 3, -HIT_POWER * 0.6);
    lastHitter = server;
    ballHitFront = false;
  }, 1500);
}

function updateHUD() {
  document.getElementById('score1').textContent = player1.score;
  document.getElementById('score2').textContent = player2.score;
}

// ==================== AI ====================
let aiReactionTimer = 0;

function updateAI(dt) {
  if (!aiMode || gameState !== 'playing') return;
  const speed = AI_SPEED[aiDifficulty];
  const diff = aiDifficulty;
  // diff 1=easy: slow reactions, inaccurate  |  diff 3=hard: fast, precise

  let targetX, targetZ;
  const isMyTurn = lastHitter === player1 && ballHitFront;
  // AI is player2

  if (isMyTurn) {
    // === MY TURN: intercept the ball ===
    // Add reaction delay: AI doesn't react instantly
    aiReactionTimer -= dt;
    if (aiReactionTimer > 0) {
      // Still hesitating, hold position
      targetX = player2.x;
      targetZ = player2.z;
    } else {
      // Predict where ball will be after it travels toward me
      const predictTime = (4 - diff) * 0.15 + 0.1; // easy=0.55s ahead, hard=0.25s ahead
      const px = ball.position.x + ballV.x * predictTime;
      const pz = ball.position.z + ballV.z * predictTime;
      const py = ball.position.y + ballV.y * predictTime + 0.5 * GRAVITY * predictTime * predictTime;

      // Inaccuracy: easy AI misjudges position
      const inaccuracy = (4 - diff) * 0.6;
      targetX = px + (Math.random() - 0.5) * inaccuracy;
      targetZ = Math.min(COURT_D - 1.2, Math.max(1, pz));
    }
  } else if (ballV.z < 0 && !ballHitFront) {
    // === Ball heading toward front wall (player1 just hit) ===
    // Predict where ball will bounce and come back
    const timeToFront = Math.abs(ball.position.z / Math.min(ballV.z, -0.5));
    const bounceX = ball.position.x + ballV.x * timeToFront;
    const returnVz = Math.abs(ballV.z) * BALL_BOUNCE;
    const returnVx = ballV.x * 0.9;

    // Predict where ball will be 0.5s after bouncing off front wall
    const afterBounceTime = 0.5;
    const predX = bounceX + returnVx * afterBounceTime;
    const predZ = returnVz * afterBounceTime;

    // High difficulty: position exactly at predicted intercept
    // Low difficulty: more toward center, react slower
    const anticipation = diff / 3;
    targetX = predX * anticipation + 0 * (1 - anticipation);
    targetZ = Math.min(COURT_D - 1, Math.max(COURT_D * 0.5, predZ));

    // Reset reaction timer for next interception
    aiReactionTimer = (4 - diff) * 0.25;
  } else {
    // === Neutral: return to center ready position ===
    targetX = 0;
    targetZ = COURT_D * 0.6;
    aiReactionTimer = 0;
  }

  // Move toward target with speed based on difficulty
  const dx = targetX - player2.x;
  const dz = targetZ - player2.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist > 0.05) {
    const moveSpeed = speed * (0.8 + diff * 0.1);
    player2.x += (dx / dist) * Math.min(moveSpeed * dt, dist);
    player2.z += (dz / dist) * Math.min(moveSpeed * dt, dist);
  }

  // Keep AI on the court
  player2.x = Math.max(-COURT_W / 2 + 0.5, Math.min(COURT_W / 2 - 0.5, player2.x));
  player2.z = Math.max(1, Math.min(COURT_D - 1, player2.z));
}

// ==================== INPUT ====================
document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

function handleInput(dt) {
  if (gameState !== 'playing') return;
  if (keys['a']) player1.x -= PLAYER_SPEED * dt;
  if (keys['d']) player1.x += PLAYER_SPEED * dt;
  if (keys['w']) player1.z -= PLAYER_SPEED * dt;
  if (keys['s']) player1.z += PLAYER_SPEED * dt;
  if (!aiMode) {
    if (keys['arrowleft']) player2.x -= PLAYER_SPEED * dt;
    if (keys['arrowright']) player2.x += PLAYER_SPEED * dt;
    if (keys['arrowup']) player2.z -= PLAYER_SPEED * dt;
    if (keys['arrowdown']) player2.z += PLAYER_SPEED * dt;
  }
  const clampP = (p) => {
    p.x = Math.max(-COURT_W / 2 + 0.5, Math.min(COURT_W / 2 - 0.5, p.x));
    p.z = Math.max(1, Math.min(COURT_D - 1, p.z));
  };
  clampP(player1);
  clampP(player2);
}

// ==================== GAME LOOP ====================
let lastTime = performance.now();

function gameLoop(time) {
  requestAnimationFrame(gameLoop);
  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;
  const tSec = time / 1000;

  if (gameState === 'playing') {
    handleInput(dt);
    if (aiMode) updateAI(dt);
    updateBall(dt);
    checkPlayerHit(player1);
    checkPlayerHit(player2);

    player1.mesh.position.set(player1.x, RACKET_Y, player1.z);
    player2.mesh.position.set(player2.x, RACKET_Y, player2.z);

    const speed = ballV.length();
    glowMat.opacity = 0.3 + Math.min(speed / 20, 0.7);
    glowRing.rotation.z += dt * 3;
    glowRing.rotation.x += dt * 2;

  }

  animateClap(tSec);
  updateBGM(tSec);
  controls.update();
  renderer.render(scene, camera);
}

// ==================== MENU FLOW ====================
const menuMain = document.getElementById('menuMain');
const menuMode = document.getElementById('menuMode');
const menuDiff = document.getElementById('menuDifficulty');
const gameOverEl = document.getElementById('gameOver');
const hudEl = document.getElementById('hud');
const countdownEl = document.getElementById('countdown');
const serveIndicator = document.getElementById('serve-indicator');

function hideAll() {
  [menuMain, menuMode, menuDiff, gameOverEl].forEach(el => el.classList.add('hidden'));
}
function show(el) { hideAll(); el.classList.remove('hidden'); }

document.getElementById('btnPlay').addEventListener('click', () => show(menuMode));
document.getElementById('btnBackMode').addEventListener('click', () => show(menuMain));

menuMode.addEventListener('click', (e) => {
  if (!e.target.dataset.mode) return;
  aiMode = e.target.dataset.mode === 'ai';
  if (aiMode) { show(menuDiff); }
  else { initAudio(); startGame(); }
});

document.getElementById('btnBackDiff').addEventListener('click', () => show(menuMode));

menuDiff.addEventListener('click', (e) => {
  if (!e.target.dataset.diff) return;
  aiDifficulty = parseInt(e.target.dataset.diff);
  initAudio();
  startGame();
});

document.getElementById('btnRestart').addEventListener('click', () => {
  gameOverEl.classList.add('hidden');
  player1.score = 0; player2.score = 0;
  updateHUD();
  startGame();
});
document.getElementById('btnQuit').addEventListener('click', () => {
  gameOverEl.classList.add('hidden');
  hudEl.style.display = 'none';
  btnPause.style.display = 'none';
  btnSettings.style.display = 'none';
  stopBGM();
  player1.score = 0; player2.score = 0;
  updateHUD();
  gameState = 'menu';
  show(menuMain);
});

function startGame() {
  gameState = 'countdown';
  countdownVal = 3;
  hudEl.style.display = 'flex';
  hideAll();
  updateHUD();
  btnPause.style.display = 'flex';
  btnSettings.style.display = 'flex';

  player1.x = -1.5; player1.z = COURT_D * 0.7;
  player2.x = 1.5; player2.z = COURT_D * 0.7;
  ball.position.set(0, 1.5, COURT_D * 0.7);
  ballV.set(0, 0, 0);
  ballBounces = 0;
  lastHitter = null;
  ballHitFront = false;
  serveIndicator.style.display = 'none';
  clapTriggered = false;

  player1.mesh.position.set(player1.x, RACKET_Y, player1.z);
  player2.mesh.position.set(player2.x, RACKET_Y, player2.z);

  countdownEl.style.display = 'block';
  countdownEl.textContent = countdownVal;

  // Reset camera to default view
  camera.position.set(0, 10, -3);
camera.lookAt(0, 1.5, 2);
controls.target.set(0, 1.5, 2);
  controls.update();

  const cd = setInterval(() => {
    countdownVal--;
    if (countdownVal > 0) { countdownEl.textContent = countdownVal; sfxCountdown(); }
    else {
      countdownEl.textContent = 'GO!';
      playBeep(880, 0.2, 0.1);
      setTimeout(() => {
        countdownEl.style.display = 'none';
        gameState = 'playing';
        startBGM();
        serveIndicator.style.display = 'block';
        serveIndicator.textContent = 'P1 serves';
        serveIndicator.style.color = player1.color;
        setTimeout(() => {
          if (gameState !== 'playing') return;
          serveIndicator.style.display = 'none';
          ball.position.set(player1.x, 1.5, player1.z - 0.5);
          ballV.set(0, 3, -HIT_POWER * 0.6);
          lastHitter = player1;
          ballHitFront = false;
        }, 1000);
      }, 500);
      clearInterval(cd);
    }
  }, 800);
}

function endGame(winner) {
  gameState = 'over';
  document.getElementById('btnPause').style.display = 'none';
  document.getElementById('btnSettings').style.display = 'none';
  document.getElementById('pauseOverlay').classList.add('hidden');
  document.getElementById('settingsOverlay').classList.add('hidden');
  document.getElementById('winTitle').textContent = winner.name + ' Wins!';
  document.getElementById('winTitle').style.color = winner.color;
  document.getElementById('winMsg').textContent = winner.score + ' - ' + (winner === player1 ? player2.score : player1.score);
  show(gameOverEl);
  hudEl.style.display = 'none';
  sfxWin();
  triggerClap();
}

// ==================== PAUSE / SETTINGS ====================
const pauseOverlay = document.getElementById('pauseOverlay');
const settingsOverlay = document.getElementById('settingsOverlay');
const btnPause = document.getElementById('btnPause');
const btnSettings = document.getElementById('btnSettings');

btnPause.addEventListener('click', togglePause);
btnSettings.addEventListener('click', openSettings);

document.getElementById('btnResume').addEventListener('click', togglePause);
document.getElementById('btnRestartFromPause').addEventListener('click', () => {
  pauseOverlay.classList.add('hidden');
  gameState = 'playing';
  player1.score = 0; player2.score = 0;
  updateHUD();
  startGame();
});
document.getElementById('btnMenuFromPause').addEventListener('click', () => {
  pauseOverlay.classList.add('hidden');
  btnPause.style.display = 'none';
  btnSettings.style.display = 'none';
  hudEl.style.display = 'none';
  player1.score = 0; player2.score = 0;
  updateHUD();
  gameState = 'menu';
  stopBGM();
  show(menuMain);
});

document.getElementById('btnCloseSettings').addEventListener('click', () => {
  settingsOverlay.classList.add('hidden');
});

function togglePause() {
  if (gameState === 'playing') {
    gameState = 'paused';
    pauseOverlay.classList.remove('hidden');
  } else if (gameState === 'paused') {
    gameState = 'playing';
    pauseOverlay.classList.add('hidden');
  }
}

function openSettings() {
  if (gameState === 'playing') {
    gameState = 'paused';
  }
  settingsOverlay.classList.remove('hidden');
}

document.getElementById('toggleMusic').addEventListener('change', function() {
  musicMuted = !this.checked;
  if (musicMuted) { stopBGM(); } else { startBGM(); }
  bgmGain.gain.value = musicMuted ? 0 : 0.06;
});

document.getElementById('toggleSFX').addEventListener('change', function() {
  sfxMuted = !this.checked;
});

// Esc key to toggle pause
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && (gameState === 'playing' || gameState === 'paused')) {
    togglePause();
  }
});

// ==================== RESIZE ====================
window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// ==================== INIT ====================
requestAnimationFrame(gameLoop);
