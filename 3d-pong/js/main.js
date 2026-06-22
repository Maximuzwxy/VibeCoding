

// Game configuration
let gameConfig = {
    buffFrequency: 3, // 0-5 (0 = no buffs, 5 = very frequent)
    ballBaseSpeed: 0.05,
    ballMaxSpeed: 0.3,
    ballSpeedRatio: 1.05,
    maxScore: 5
};

// Game state variables
let gameState = {
    isGameRunning: false,
    isGamePaused: false,
    player1Score: 0,
    player2Score: 0,
    maxScore: 5, // First to 5 points wins
    ballSpeedMultiplier: 1.0 // Initial speed multiplier
};

// Ball clones for split buff
let ballClones = [];

// Visual effects
let hitEffects = []; // Paddle hit effects
let ballTrails = []; // Ball trail particles

// Paddle control modes
let paddleModes = {
    frontPaddle: 'human', // 'human' or 'ai'
    backPaddle: 'human'   // 'human' or 'ai'
};

// DOM elements
const startScreen = document.getElementById('start-screen');
const startGameBtn = document.getElementById('start-game-btn');
const hud = document.getElementById('hud');
const redScoreElement = document.getElementById('red-score').querySelector('.score-value');
const greenScoreElement = document.getElementById('green-score').querySelector('.score-value');
const winnerTextElement = document.getElementById('winner-text');
const gameOverElement = document.getElementById('game-over');
const finalRedScore = document.getElementById('final-red');
const finalGreenScore = document.getElementById('final-green');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const restartBtn = document.getElementById('restart-btn');
const redHumanBtn = document.getElementById('red-human');
const redAIBtn = document.getElementById('red-ai');
const greenHumanBtn = document.getElementById('green-human');
const greenAIBtn = document.getElementById('green-ai');

// Settings elements
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const saveSettingsBtn = document.getElementById('save-settings');
const cancelSettingsBtn = document.getElementById('cancel-settings');
const buffFrequencySlider = document.getElementById('buff-frequency');
const buffFrequencyValue = document.getElementById('buff-frequency-value');
const ballBaseSpeedInput = document.getElementById('ball-base-speed');
const ballMaxSpeedInput = document.getElementById('ball-max-speed');
const ballSpeedRatioInput = document.getElementById('ball-speed-ratio');
const maxScoreInput = document.getElementById('max-score');

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a); // Deep dark blue-black

// Camera - positioned along x-axis, looking at origin
const camera = new THREE.PerspectiveCamera(
    65, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000
);
camera.position.set(25, 0, 0); // Position on positive x-axis
camera.lookAt(0, 0, 0); // Looking at origin

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();

// Create starfield background (outside the cube)
const starGeometry = new THREE.BufferGeometry();
const starCount = 500;
const starPositions = new Float32Array(starCount * 3);
const starPhases = new Float32Array(starCount); // Random phase for each star
const starSpeeds = new Float32Array(starCount); // Random speed for each star

for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    // Random position outside the cube (20-50 units away)
    const radius = 20 + Math.random() * 30;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    starPositions[i3 + 2] = radius * Math.cos(phi);
    
    // Random twinkle phase and speed for each star
    starPhases[i] = Math.random() * Math.PI * 2;
    starSpeeds[i] = 0.5 + Math.random() * 2; // Random speed between 0.5 and 2.5
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

// Use vertex colors to control each star's brightness individually
const starColors = new Float32Array(starCount * 3);
starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

const starMaterial = new THREE.PointsMaterial({
    size: 0.15,
    transparent: true,
    opacity: 1,
    vertexColors: true // Enable individual colors per star
});

const starField = new THREE.Points(starGeometry, starMaterial);
scene.add(starField);

// Create a 15x15x15 cube with transparent material and visible edges
const cubeSize = 15;
const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

// Transparent material for the cube faces - darker, more subtle
// Use FrontSide only to prevent z-fighting with paddle from behind
const cubeMaterial = new THREE.MeshBasicMaterial({
    color: 0x1a1a2e,
    transparent: true,
    opacity: 0.15,
    side: THREE.FrontSide
});

const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.renderOrder = -1; // Render cube first (behind everything else)
scene.add(cube);

// Add glowing edges to the cube (directly to scene, not as child of cube to avoid depth issues)
const edgesGeometry = new THREE.EdgesGeometry(cubeGeometry);
const edgesMaterial = new THREE.LineBasicMaterial({ 
    color: 0x48dbfb, // Cyan glow color
    transparent: true,
    opacity: 0.6,
    depthTest: false
});
const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
scene.add(edges);

// Add a subtle grid on the floor
const gridHelper = new THREE.GridHelper(15, 15, 0x48dbfb, 0x16213e);
gridHelper.position.y = -7.5;
gridHelper.material.transparent = true;
gridHelper.material.opacity = 0.3;
scene.add(gridHelper);

// Add a subtle grid on the ceiling
const ceilingGrid = new THREE.GridHelper(15, 15, 0x48dbfb, 0x16213e);
ceilingGrid.position.y = 7.5;
ceilingGrid.material.transparent = true;
ceilingGrid.material.opacity = 0.15;
scene.add(ceilingGrid);

// Create paddles with glow effect
const paddleGeometry = new THREE.BoxGeometry(4, 4, 0.3); // Updated size: 4x4x0.3

// Front paddle (red) - on the +Z side, completely inside the cube
const redMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff6666
}); // Bright red, no transparency to avoid flickering
const frontPaddle = new THREE.Mesh(paddleGeometry, redMaterial);
frontPaddle.position.x = 0;
frontPaddle.position.y = 0;
frontPaddle.position.z = 7.5 - 0.25; // Move slightly inward to avoid z-fighting with cube edge
scene.add(frontPaddle);

// No glow effect - using bright color instead to avoid flickering

// Back paddle (green) - on the -Z side, completely inside the cube
const greenMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x66ff66
}); // Bright green, no transparency to avoid flickering
const backPaddle = new THREE.Mesh(paddleGeometry, greenMaterial);
backPaddle.position.x = 0;
backPaddle.position.y = 0;
backPaddle.position.z = -7.5 + 0.25; // Move slightly inward to avoid z-fighting with cube edge
scene.add(backPaddle);

// No glow effect - using bright color instead to avoid flickering

// Add keyboard controls for paddles
const keyState = {};

window.addEventListener('keydown', (event) => {
    keyState[event.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (event) => {
    keyState[event.key.toLowerCase()] = false;
});

// Buff system
const BUFF_TYPES = {
    ENLARGE: { color: 0x2ecc71, name: 'enlarge', duration: 3 },      // Green - paddle larger
    SHRINK: { color: 0xf39c12, name: 'shrink', duration: 3 },        // Orange - opponent smaller
    SLOW: { color: 0x3498db, name: 'slow', duration: 3 },             // Blue - ball slower
    SPLIT: { color: 0xe74c3c, name: 'split', duration: Infinity }    // Red - ball splits into 3
};

let activeBuffBlocks = [];
let activeBuffs = {
    player1: {},
    player2: {}
};
let roundsCompleted = 0;
let lastBuffCheckRound = 0;
const ROUND_DURATION = 300; // frames (~5 seconds at 60fps)
let roundFrameCounter = 0;

function createBuffBlock(type, zPosition) {
    const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const material = new THREE.MeshBasicMaterial({ 
        color: type.color,
        transparent: true,
        opacity: 0.9,
        depthTest: false
    });
    const block = new THREE.Mesh(geometry, material);
    
    // Determine which paddle to avoid
    const isFront = zPosition > 0;
    const targetPaddle = isFront ? frontPaddle : backPaddle;
    const paddleRadius = 2; // Half of paddle size (4/2)
    const safeDistance = paddleRadius + 0.3; // Safe distance from paddle center
    
    // Random position within paddle movement area, avoiding paddle current position
    let x, y;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
        x = (Math.random() - 0.5) * 11; // -5.5 to 5.5
        y = (Math.random() - 0.5) * 11; // -5.5 to 5.5
        attempts++;
    } while (
        attempts < maxAttempts &&
        Math.abs(x - targetPaddle.position.x) < safeDistance &&
        Math.abs(y - targetPaddle.position.y) < safeDistance
    );
    
    block.position.x = x;
    block.position.y = y;
    block.position.z = zPosition;
    
    // Add a glow effect with a point light
    const light = new THREE.PointLight(type.color, 0.5, 3);
    light.position.set(0, 0, 0.2);
    block.add(light);
    
    // Add a glow mesh around the buff block
    const glowGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: type.color,
        transparent: true,
        opacity: 0.2,
        depthTest: false
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    block.add(glowMesh);
    
    block.userData = { type: type.name, duration: type.duration, glowMesh: glowMesh };
    scene.add(block);
    activeBuffBlocks.push(block);
    
    return block;
}

function clearBuffBlocks() {
    activeBuffBlocks.forEach(block => {
        scene.remove(block);
        block.geometry.dispose();
        block.material.dispose();
    });
    activeBuffBlocks = [];
}

function generateBuffBlocks() {
    const buffTypes = Object.values(BUFF_TYPES);
    
    // Generate 1 buff for front paddle side (same Z plane as paddle at 7.25)
    const frontType = buffTypes[Math.floor(Math.random() * buffTypes.length)];
    createBuffBlock(frontType, 7.25);
    
    // Generate 1 buff for back paddle side (same Z plane as paddle at -7.25)
    const backType = buffTypes[Math.floor(Math.random() * buffTypes.length)];
    createBuffBlock(backType, -7.25);
}

function checkBuffCollisions() {
    const paddleRadius = 2; // Half of paddle size (4/2)
    const buffRadius = 0.4; // Half of buff block size (0.8/2)
    
    for (let i = activeBuffBlocks.length - 1; i >= 0; i--) {
        const block = activeBuffBlocks[i];
        const blockZ = block.position.z;
        
        // Check which paddle this buff is near
        let targetPaddle, playerNum;
        if (blockZ > 0) {
            targetPaddle = frontPaddle;
            playerNum = 1;
        } else {
            targetPaddle = backPaddle;
            playerNum = 2;
        }
        
        // Check Z distance (buff at 6.5, paddle at 7.25, distance = 0.75)
        const zDistance = Math.abs(blockZ - targetPaddle.position.z);
        if (zDistance > 1.5) continue; // Too far in Z axis
        
        // Check collision (2D distance on XY plane)
        const dx = block.position.x - targetPaddle.position.x;
        const dy = block.position.y - targetPaddle.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < paddleRadius + buffRadius) {
            // Apply buff
            applyBuff(block.userData.type, playerNum);
            
            // Remove block
            scene.remove(block);
            block.geometry.dispose();
            block.material.dispose();
            activeBuffBlocks.splice(i, 1);
        }
    }
}

function applyBuff(buffType, player) {
    const opponent = player === 1 ? 2 : 1;
    const playerKey = `player${player}`;
    
    switch(buffType) {
        case 'enlarge':
            // Make player's paddle 50% larger
            const paddleToEnlarge = player === 1 ? frontPaddle : backPaddle;
            const originalScale = paddleToEnlarge.userData.originalScale || 1;
            paddleToEnlarge.scale.set(1.5, 1.5, 1);
            
            activeBuffs[playerKey].enlarge = {
                duration: BUFF_TYPES.ENLARGE.duration,
                originalScale: originalScale
            };
            break;
            
        case 'shrink':
            // Make opponent's paddle 40% smaller
            const paddleToShrink = opponent === 1 ? frontPaddle : backPaddle;
            const oppOriginalScale = paddleToShrink.userData.originalScale || 1;
            paddleToShrink.scale.set(0.6, 0.6, 1);
            
            activeBuffs[`player${opponent}`].shrink = {
                duration: BUFF_TYPES.SHRINK.duration,
                originalScale: oppOriginalScale,
                appliedBy: player
            };
            break;
            
        case 'slow':
            // Slow down ball by 30%
            ballVelocity.multiplyScalar(0.7);
            
            activeBuffs[playerKey].slow = {
                duration: BUFF_TYPES.SLOW.duration,
                originalSpeed: ballVelocity.length()
            };
            break;
            
        case 'split':
            // Split ball into 3 copies
            createBallClones();
            
            activeBuffs[playerKey].split = {
                duration: Infinity
            };
            break;
    }
    
    updateBuffDisplay();
}

function updateBuffs() {
    let needsUpdate = false;
    
    // Decrement buff durations and remove expired ones
    for (const player of ['player1', 'player2']) {
        for (const [key, buff] of Object.entries(activeBuffs[player])) {
            if (buff.duration !== Infinity) {
                buff.duration--;
                if (buff.duration <= 0) {
                    removeBuff(player, key, buff);
                    delete activeBuffs[player][key];
                    needsUpdate = true;
                }
            }
        }
    }
    
    if (needsUpdate) {
        updateBuffDisplay();
    }
}

function removeBuff(player, buffKey, buff) {
    const playerNum = player === 'player1' ? 1 : 2;
    
    switch(buffKey) {
        case 'enlarge':
            const enlargedPaddle = playerNum === 1 ? frontPaddle : backPaddle;
            enlargedPaddle.scale.set(1, 1, 1);
            break;
            
        case 'shrink':
            const shrunkPaddle = playerNum === 1 ? frontPaddle : backPaddle;
            shrunkPaddle.scale.set(1, 1, 1);
            break;
            
        case 'slow':
            // Speed will naturally increase with hits, no need to restore
            break;
    }
}

function updateBuffDisplay() {
    const player1List = document.querySelector('#player1-buffs .buff-list');
    const player2List = document.querySelector('#player2-buffs .buff-list');
    
    if (!player1List || !player2List) return;
    
    // Clear current display
    player1List.innerHTML = '';
    player2List.innerHTML = '';
    
    // Display player 1 buffs
    for (const [key, buff] of Object.entries(activeBuffs.player1)) {
        const buffElement = document.createElement('div');
        buffElement.className = `buff-item buff-${key}`;
        const durationText = buff.duration === Infinity ? '∞' : `${buff.duration}r`;
        buffElement.textContent = `${getBuffDisplayName(key)} (${durationText})`;
        player1List.appendChild(buffElement);
    }
    
    // Display player 2 buffs
    for (const [key, buff] of Object.entries(activeBuffs.player2)) {
        const buffElement = document.createElement('div');
        buffElement.className = `buff-item buff-${key}`;
        const durationText = buff.duration === Infinity ? '∞' : `${buff.duration}r`;
        buffElement.textContent = `${getBuffDisplayName(key)} (${durationText})`;
        player2List.appendChild(buffElement);
    }
    
    // Show "None" if no buffs
    if (Object.keys(activeBuffs.player1).length === 0) {
        player1List.innerHTML = '<div class="buff-item">None</div>';
    }
    if (Object.keys(activeBuffs.player2).length === 0) {
        player2List.innerHTML = '<div class="buff-item">None</div>';
    }
}

function getBuffDisplayName(buffKey) {
    const names = {
        'enlarge': 'Enlarge',
        'shrink': 'Shrink',
        'slow': 'Slow',
        'split': 'Split'
    };
    return names[buffKey] || buffKey;
}

// Ball clone functions for split buff
function createBallClones() {
    clearBallClones();
    
    // Create 2 additional balls (total 3)
    for (let i = 0; i < 2; i++) {
        const cloneGeometry = new THREE.SphereGeometry(0.3, 32, 32);
        const cloneMaterial = new THREE.MeshBasicMaterial({ 
            color: Math.random() * 0xffffff 
        });
        const clone = new THREE.Mesh(cloneGeometry, cloneMaterial);
        
        clone.position.copy(ball.position);
        
        // Slightly different trajectories
        const angle = (i === 0) ? -0.3 : 0.3;
        const speed = ballVelocity.length();
        
        scene.add(clone);
        
        ballClones.push({
            mesh: clone,
            velocity: new THREE.Vector3(
                ballVelocity.x * (1 + angle * 0.5),
                ballVelocity.y + angle * speed * 0.5,
                ballVelocity.z
            )
        });
    }
}

function clearBallClones() {
    ballClones.forEach(clone => {
        scene.remove(clone.mesh);
        clone.mesh.geometry.dispose();
        clone.mesh.material.dispose();
    });
    ballClones = [];
}

function updateBallClones() {
    for (let i = ballClones.length - 1; i >= 0; i--) {
        const clone = ballClones[i];
        
        // Move clone
        clone.mesh.position.x += clone.velocity.x;
        clone.mesh.position.y += clone.velocity.y;
        clone.mesh.position.z += clone.velocity.z;
        
        // Wall collisions (X and Y walls)
        if (Math.abs(clone.mesh.position.x) >= 7.0) {
            clone.velocity.x = -clone.velocity.x;
            clone.mesh.position.x = Math.sign(clone.mesh.position.x) * 7.0;
        }
        if (Math.abs(clone.mesh.position.y) >= 7.0) {
            clone.velocity.y = -clone.velocity.y;
            clone.mesh.position.y = Math.sign(clone.mesh.position.y) * 7.0;
        }
        
        // Clone scored - same logic as main ball
        if (clone.mesh.position.z > 8) {
            // Clone passed front paddle (Red), Green scores
            gameState.player2Score++;
            updateScoreDisplay();
            playScoreSound();
            
            scene.remove(clone.mesh);
            clone.mesh.geometry.dispose();
            clone.mesh.material.dispose();
            ballClones.splice(i, 1);
            
            checkGameOver();
            continue;
        }
        
        if (clone.mesh.position.z < -8) {
            // Clone passed back paddle (Green), Red scores
            gameState.player1Score++;
            updateScoreDisplay();
            playScoreSound();
            
            scene.remove(clone.mesh);
            clone.mesh.geometry.dispose();
            clone.mesh.material.dispose();
            ballClones.splice(i, 1);
            
            checkGameOver();
            continue;
        }
        
        // Simple paddle collision for clones
        if (clone.mesh.position.z + 0.3 >= 7.25 &&
            clone.mesh.position.z <= 7.5 &&
            Math.abs(clone.mesh.position.x - frontPaddle.position.x) <= 2 &&
            Math.abs(clone.mesh.position.y - frontPaddle.position.y) <= 2) {
            clone.velocity.z = -Math.abs(clone.velocity.z);
            playPaddleHitSound();
        }
        
        if (clone.mesh.position.z - 0.3 <= -7.25 &&
            clone.mesh.position.z >= -7.5 &&
            Math.abs(clone.mesh.position.x - backPaddle.position.x) <= 2 &&
            Math.abs(clone.mesh.position.y - backPaddle.position.y) <= 2) {
            clone.velocity.z = Math.abs(clone.velocity.z);
            playPaddleHitSound();
        }
    }
}

// Visual effect functions
function createHitEffect(position, color) {
    // Create a ring effect instead of a sphere
    const geometry = new THREE.RingGeometry(0.2, 0.4, 32);
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1.0,
        depthTest: false,
        side: THREE.DoubleSide
    });
    const effect = new THREE.Mesh(geometry, material);
    effect.position.copy(position);
    effect.lookAt(camera.position);
    scene.add(effect);
    
    hitEffects.push({
        mesh: effect,
        startTime: Date.now(),
        duration: 1000 // 1 second
    });
}

function updateHitEffects() {
    const now = Date.now();
    for (let i = hitEffects.length - 1; i >= 0; i--) {
        const effect = hitEffects[i];
        const elapsed = now - effect.startTime;
        const progress = elapsed / effect.duration;
        
        if (progress >= 1) {
            scene.remove(effect.mesh);
            effect.mesh.geometry.dispose();
            effect.mesh.material.dispose();
            hitEffects.splice(i, 1);
        } else {
            effect.mesh.material.opacity = 1.0 - progress;
            const scale = 1.0 + progress * 2; // Grow from 1x to 3x
            effect.mesh.scale.set(scale, scale, scale);
        }
    }
}

function createBallTrail(position) {
    const geometry = new THREE.SphereGeometry(0.2, 8, 8);
    const material = new THREE.MeshBasicMaterial({
        color: 0x48dbfb, // Cyan trail
        transparent: true,
        opacity: 0.4,
        depthTest: false
    });
    const trail = new THREE.Mesh(geometry, material);
    trail.position.copy(position);
    scene.add(trail);
    
    ballTrails.push({
        mesh: trail,
        startTime: Date.now(),
        duration: 600 // 0.6 second trail
    });
}

function updateBallTrails() {
    const now = Date.now();
    for (let i = ballTrails.length - 1; i >= 0; i--) {
        const trail = ballTrails[i];
        const elapsed = now - trail.startTime;
        const progress = elapsed / trail.duration;
        
        if (progress >= 1) {
            scene.remove(trail.mesh);
            trail.mesh.geometry.dispose();
            trail.mesh.material.dispose();
            ballTrails.splice(i, 1);
        } else {
            trail.mesh.material.opacity = 0.6 * (1.0 - progress);
            const scale = 1.0 - progress * 0.5;
            trail.mesh.scale.set(scale, scale, scale);
        }
    }
}

// Web Audio API sound effects
let audioContext = null;

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

function playPaddleHitSound() {
    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
    } catch (e) {
        console.log("Audio play error:", e);
    }
}

function playWallHitSound() {
    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
    } catch (e) {
        console.log("Audio play error:", e);
    }
}

function playScoreSound() {
    try {
        const ctx = getAudioContext();
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        notes.forEach((freq, index) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.1);
            
            gainNode.gain.setValueAtTime(0.15, ctx.currentTime + index * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.1 + 0.2);
            
            oscillator.start(ctx.currentTime + index * 0.1);
            oscillator.stop(ctx.currentTime + index * 0.1 + 0.2);
        });
    } catch (e) {
        console.log("Audio play error:", e);
    }
}

// Create ball with glow effect
const ballGeometry = new THREE.SphereGeometry(0.3, 32, 32);
const ballMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffffff
}); // White color, no transparency to avoid flickering
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
scene.add(ball);

// Add ball glow (render after ball to avoid z-fighting)
const ballGlowGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const ballGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0x48dbfb,
    transparent: true,
    opacity: 0.3,
    depthTest: false
});
const ballGlow = new THREE.Mesh(ballGlowGeometry, ballGlowMaterial);
scene.add(ballGlow);

// Ball physics
const ballVelocity = new THREE.Vector3(
    (Math.random() > 0.5 ? 1 : -1) * gameConfig.ballBaseSpeed, // Random initial x direction
    (Math.random() > 0.5 ? 1 : -1) * gameConfig.ballBaseSpeed, // Random initial y direction
    gameConfig.ballBaseSpeed * 1.6 // Fixed z direction toward the back paddle
);

// AI paddle movement function
function moveAIControlledPaddle(paddle, targetX, targetY, speed = 0.05) {
    // Calculate distance to target
    const dx = targetX - paddle.position.x;
    const dy = targetY - paddle.position.y;

    // Move towards the target, but limit the movement to the speed
    paddle.position.x += Math.max(-speed, Math.min(speed, dx));
    paddle.position.y += Math.max(-speed, Math.min(speed, dy));

    // Constrain paddle movement within the cube
    paddle.position.x = Math.max(-5.5, Math.min(5.5, paddle.position.x));
    paddle.position.y = Math.max(-5.5, Math.min(5.5, paddle.position.y));
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize game state
function initGameState() {
    gameState.isGameRunning = false;
    gameState.isGamePaused = false;
    gameState.player1Score = 0; // Red paddle
    gameState.player2Score = 0; // Green paddle
    gameState.ballSpeedMultiplier = 1.0;

    // Reset buff system
    clearBuffBlocks();
    clearBallClones();
    activeBuffs = { player1: {}, player2: {} };
    roundsCompleted = 0;
    lastBuffCheckRound = 0;
    roundFrameCounter = 0;
    
    // Clear visual effects
    hitEffects.forEach(effect => {
        scene.remove(effect.mesh);
        effect.mesh.geometry.dispose();
        effect.mesh.material.dispose();
    });
    hitEffects = [];
    
    ballTrails.forEach(trail => {
        scene.remove(trail.mesh);
        trail.mesh.geometry.dispose();
        trail.mesh.material.dispose();
    });
    ballTrails = [];
    
    // Reset paddle scales
    frontPaddle.scale.set(1, 1, 1);
    backPaddle.scale.set(1, 1, 1);

    // Update UI
    updateScoreDisplay();
    gameOverElement.classList.add('hidden');
    pauseBtn.innerHTML = '<span class="btn-icon">⏸</span><span>Pause</span>';
}

// Update score display
function updateScoreDisplay() {
    redScoreElement.textContent = gameState.player1Score;
    greenScoreElement.textContent = gameState.player2Score;
}

// Reset ball to center
function resetBall() {
    ball.position.set(0, 0, 0);

    // Set new random velocity with reset speed multiplier
    gameState.ballSpeedMultiplier = 1.0; // Reset speed multiplier

    ballVelocity.set(
        (Math.random() > 0.5 ? 1 : -1) * gameConfig.ballBaseSpeed * gameState.ballSpeedMultiplier,
        (Math.random() > 0.5 ? 1 : -1) * gameConfig.ballBaseSpeed * gameState.ballSpeedMultiplier,
        gameConfig.ballBaseSpeed * 1.6 * gameState.ballSpeedMultiplier
    );

    // Randomize z direction to either front or back paddle
    if (Math.random() > 0.5) {
        ballVelocity.z = -ballVelocity.z; // Reverse z direction
    }
}

// Check if game is over
function checkGameOver() {
    if (gameState.player1Score >= gameState.maxScore || gameState.player2Score >= gameState.maxScore) {
        gameState.isGameRunning = false;

        // Update final scores
        finalRedScore.textContent = gameState.player1Score;
        finalGreenScore.textContent = gameState.player2Score;

        // Determine winner
        if (gameState.player1Score >= gameState.maxScore) {
            winnerTextElement.textContent = '🔴 Red Player Wins!';
            winnerTextElement.style.color = '#ff6b6b';
        } else {
            winnerTextElement.textContent = '🟢 Green Player Wins!';
            winnerTextElement.style.color = '#2ecc71';
        }

        gameOverElement.classList.remove('hidden');
    }
}

// Button event handlers
startGameBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    gameState.isGameRunning = true;
    gameState.isGamePaused = false;
    resetBall();
});

pauseBtn.addEventListener('click', () => {
    if (gameState.isGameRunning) {
        gameState.isGamePaused = !gameState.isGamePaused;
        pauseBtn.innerHTML = gameState.isGamePaused ? 
            '<span class="btn-icon">▶</span><span>Resume</span>' : 
            '<span class="btn-icon">⏸</span><span>Pause</span>';
    }
});

resetBtn.addEventListener('click', () => {
    initGameState();
    resetBall();
});

restartBtn.addEventListener('click', () => {
    gameOverElement.classList.add('hidden');
    initGameState();
    resetBall();
});

// Paddle mode toggle buttons
redHumanBtn.addEventListener('click', () => {
    paddleModes.frontPaddle = 'human';
    redHumanBtn.classList.add('active');
    redAIBtn.classList.remove('active');
});

redAIBtn.addEventListener('click', () => {
    paddleModes.frontPaddle = 'ai';
    redAIBtn.classList.add('active');
    redHumanBtn.classList.remove('active');
});

greenHumanBtn.addEventListener('click', () => {
    paddleModes.backPaddle = 'human';
    greenHumanBtn.classList.add('active');
    greenAIBtn.classList.remove('active');
});

greenAIBtn.addEventListener('click', () => {
    paddleModes.backPaddle = 'ai';
    greenAIBtn.classList.add('active');
    greenHumanBtn.classList.remove('active');
});

// ==================== SETTINGS ====================

// Open settings
settingsBtn.addEventListener('click', () => {
    gameState.isGamePaused = true;
    pauseBtn.innerHTML = '<span class="btn-icon">▶</span><span>Resume</span>';
    settingsPanel.classList.remove('hidden');
});

// Close settings (cancel)
cancelSettingsBtn.addEventListener('click', () => {
    settingsPanel.classList.add('hidden');
    gameState.isGamePaused = false;
    pauseBtn.innerHTML = '<span class="btn-icon">⏸</span><span>Pause</span>';
});

// Save settings
saveSettingsBtn.addEventListener('click', () => {
    // Update game config
    gameConfig.buffFrequency = parseInt(buffFrequencySlider.value);
    gameConfig.ballBaseSpeed = parseFloat(ballBaseSpeedInput.value) / 100;
    gameConfig.ballMaxSpeed = parseFloat(ballMaxSpeedInput.value) / 100;
    gameConfig.ballSpeedRatio = parseFloat(ballSpeedRatioInput.value);
    gameConfig.maxScore = parseInt(maxScoreInput.value);
    
    // Update game state
    gameState.maxScore = gameConfig.maxScore;
    
    // Close settings
    settingsPanel.classList.add('hidden');
    gameState.isGamePaused = false;
    pauseBtn.innerHTML = '<span class="btn-icon">⏸</span><span>Pause</span>';
});

// Slider value display update
buffFrequencySlider.addEventListener('input', () => {
    buffFrequencyValue.textContent = buffFrequencySlider.value;
});

// Initialize settings UI with current values
function initSettingsUI() {
    buffFrequencySlider.value = gameConfig.buffFrequency;
    buffFrequencyValue.textContent = gameConfig.buffFrequency;
    ballBaseSpeedInput.value = (gameConfig.ballBaseSpeed * 100).toFixed(0);
    ballMaxSpeedInput.value = (gameConfig.ballMaxSpeed * 100).toFixed(0);
    ballSpeedRatioInput.value = gameConfig.ballSpeedRatio.toFixed(2);
    maxScoreInput.value = gameConfig.maxScore;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (!gameState.isGameRunning || gameState.isGamePaused) {
        controls.update();
        renderer.render(scene, camera);
        return;
    }

    // Store previous paddle positions for velocity calculation
    const prevFrontPaddlePos = {
        x: frontPaddle.position.x,
        y: frontPaddle.position.y
    };
    const prevBackPaddlePos = {
        x: backPaddle.position.x,
        y: backPaddle.position.y
    };

    // Human control for front paddle (if in human mode)
    if (paddleModes.frontPaddle === 'human') {
        const moveSpeed = 0.1;

        if (keyState['w']) {
            frontPaddle.position.y += moveSpeed;
        }
        if (keyState['s']) {
            frontPaddle.position.y -= moveSpeed;
        }
        if (keyState['a']) {
            frontPaddle.position.x += moveSpeed;  // A now moves right (positive X) - reversed
        }
        if (keyState['d']) {
            frontPaddle.position.x -= moveSpeed;  // D now moves left (negative X) - reversed
        }

        // Constrain front paddle movement within the cube
        frontPaddle.position.x = Math.max(-5.5, Math.min(5.5, frontPaddle.position.x));
        frontPaddle.position.y = Math.max(-5.5, Math.min(5.5, frontPaddle.position.y));
    } 
    // AI control for front paddle (if in AI mode)
    else if (paddleModes.frontPaddle === 'ai') {
        // AI predicts where the ball will be when it reaches the front paddle's Z position
        const timeToReachFront = (frontPaddle.position.z - ball.position.z) / ballVelocity.z;
        if (timeToReachFront > 0) { // Only predict if ball is moving toward the paddle
            const predictedBallX = ball.position.x + (timeToReachFront * ballVelocity.x);
            const predictedBallY = ball.position.y + (timeToReachFront * ballVelocity.y);
            moveAIControlledPaddle(frontPaddle, predictedBallX, predictedBallY);
        } else {
            // If ball is moving away, move toward center
            moveAIControlledPaddle(frontPaddle, 0, 0);
        }
    }

    // Human control for back paddle (if in human mode)
    if (paddleModes.backPaddle === 'human') {
        const moveSpeed = 0.1;

        if (keyState['arrowup']) {
            backPaddle.position.y += moveSpeed;
        }
        if (keyState['arrowdown']) {
            backPaddle.position.y -= moveSpeed;
        }
        if (keyState['arrowleft']) {
            backPaddle.position.x -= moveSpeed;  // Left arrow now moves left (negative X) - corrected
        }
        if (keyState['arrowright']) {
            backPaddle.position.x += moveSpeed;  // Right arrow now moves right (positive X) - corrected
        }

        // Constrain back paddle movement within the cube
        backPaddle.position.x = Math.max(-5.5, Math.min(5.5, backPaddle.position.x));
        backPaddle.position.y = Math.max(-5.5, Math.min(5.5, backPaddle.position.y));
    } 
    // AI control for back paddle (if in AI mode)
    else if (paddleModes.backPaddle === 'ai') {
        // AI predicts where the ball will be when it reaches the back paddle's Z position
        const timeToReachBack = (backPaddle.position.z - ball.position.z) / ballVelocity.z;
        if (timeToReachBack > 0) { // Only predict if ball is moving toward the paddle
            const predictedBallX = ball.position.x + (timeToReachBack * ballVelocity.x);
            const predictedBallY = ball.position.y + (timeToReachBack * ballVelocity.y);
            moveAIControlledPaddle(backPaddle, predictedBallX, predictedBallY);
        } else {
            // If ball is moving away, move toward center
            moveAIControlledPaddle(backPaddle, 0, 0);
        }
    }

    // Calculate paddle velocities for spin effect
    const frontPaddleVelX = frontPaddle.position.x - prevFrontPaddlePos.x;
    const frontPaddleVelY = frontPaddle.position.y - prevFrontPaddlePos.y;
    const backPaddleVelX = backPaddle.position.x - prevBackPaddlePos.x;
    const backPaddleVelY = backPaddle.position.y - prevBackPaddlePos.y;

    // Move the ball
    ball.position.x += ballVelocity.x;
    ball.position.y += ballVelocity.y;
    ball.position.z += ballVelocity.z;
    
    // Move ball clones
    updateBallClones();

    // Check collision with front paddle (red paddle) - at z = 7.25
    const frontPaddleRadius = 2; // Half of paddle size (4/2)
    // Using an extended collision boundary of 0.5 for better visual separation
    if (ball.position.z + 0.5 >= 7.25 && // Ball approaching front paddle (+0.5 accounts for extended collision boundary)
        ball.position.z <= 7.5 && // Ball still behind the front paddle plane
        Math.abs(ball.position.x - frontPaddle.position.x) <= frontPaddleRadius &&
        Math.abs(ball.position.y - frontPaddle.position.y) <= frontPaddleRadius) {

        // Bounce off the front paddle
        ballVelocity.z = -Math.abs(ballVelocity.z); // Ensure it bounces back
        // Increase speed slightly after each hit
        gameState.ballSpeedMultiplier *= gameConfig.ballSpeedRatio;
        ballVelocity.multiplyScalar(gameConfig.ballSpeedRatio);

        // Play paddle hit sound
        playPaddleHitSound();
        
        // Create hit effect at ball position
        createHitEffect(ball.position.clone(), 0xcccccc);

        // Adjust ball position to prevent it from sinking into paddle
        ball.position.z = 7.25 - 0.5; // Position the ball at the edge of our extended collision boundary

        // Calculate hit position relative to paddle center (range: -1 to 1)
        const hitPosRelX = (ball.position.x - frontPaddle.position.x) / frontPaddleRadius;
        const hitPosRelY = (ball.position.y - frontPaddle.position.y) / frontPaddleRadius;

        // Add spin effect based on paddle velocity
        const spinFactor = 0.3;
        ballVelocity.x += frontPaddleVelX * spinFactor;
        ballVelocity.y += frontPaddleVelY * spinFactor;

        // Add angle based on where the ball hit the paddle
        const angleFactor = 0.05;
        ballVelocity.x += hitPosRelX * angleFactor;
        ballVelocity.y += hitPosRelY * angleFactor;
    }

    // Check collision with back paddle (green paddle) - at z = -7.25
    const backPaddleRadius = 2; // Half of paddle size (4/2)
    // Using an extended collision boundary of 0.5 for better visual separation
    if (ball.position.z - 0.5 <= -7.25 && // Ball approaching back paddle (-0.5 accounts for extended collision boundary)
        ball.position.z >= -7.5 && // Ball still in front of the back paddle plane
        Math.abs(ball.position.x - backPaddle.position.x) <= backPaddleRadius &&
        Math.abs(ball.position.y - backPaddle.position.y) <= backPaddleRadius) {

        // Bounce off the back paddle
        ballVelocity.z = Math.abs(ballVelocity.z); // Ensure it bounces forward
        // Increase speed slightly after each hit
        gameState.ballSpeedMultiplier *= gameConfig.ballSpeedRatio;
        ballVelocity.multiplyScalar(gameConfig.ballSpeedRatio);

        // Play paddle hit sound
        playPaddleHitSound();
        
        // Create hit effect at ball position
        createHitEffect(ball.position.clone(), 0xcccccc);

        // Adjust ball position to prevent it from sinking into paddle
        ball.position.z = -7.25 + 0.5; // Position the ball at the edge of our extended collision boundary

        // Calculate hit position relative to paddle center (range: -1 to 1)
        const hitPosRelX = (ball.position.x - backPaddle.position.x) / backPaddleRadius;
        const hitPosRelY = (ball.position.y - backPaddle.position.y) / backPaddleRadius;

        // Add spin effect based on paddle velocity
        const spinFactor = 0.3;
        ballVelocity.x += backPaddleVelX * spinFactor;
        ballVelocity.y += backPaddleVelY * spinFactor;

        // Add angle based on where the ball hit the paddle
        const angleFactor = 0.05;
        ballVelocity.x += hitPosRelX * angleFactor;
        ballVelocity.y += hitPosRelY * angleFactor;
    }

    // Check collision with cube boundaries (walls)
    if (Math.abs(ball.position.x) >= 7.0) { // 7.5 (half cube size) - 0.5 (extended collision boundary)
        ballVelocity.x = -ballVelocity.x;
        // Adjust position to prevent the ball from getting stuck outside the cube
        ball.position.x = Math.sign(ball.position.x) * 7.0;
        
        // Play wall hit sound
        playWallHitSound();
    }

    if (Math.abs(ball.position.y) >= 7.0) { // 7.5 (half cube size) - 0.5 (extended collision boundary)
        ballVelocity.y = -ballVelocity.y;
        // Adjust position to prevent the ball from getting stuck outside the cube
        ball.position.y = Math.sign(ball.position.y) * 7.0;
        
        // Play wall hit sound
        playWallHitSound();
    }

    // Check if ball reaches the paddle planes without hitting the paddle
    // When ball touches the paddle planes (z = 7.5 or z = -7.5) but not on the paddle itself
    // Need to account for extended collision boundary (0.5) in the comparison
    if (ball.position.z + 0.5 >= 7.5) {  // Ball extended collision boundary reaches front wall
        // Check if the ball missed the front paddle
        const distanceToFrontPaddle = Math.sqrt(
            Math.pow(ball.position.x - frontPaddle.position.x, 2) +
            Math.pow(ball.position.y - frontPaddle.position.y, 2)
        );

        if (distanceToFrontPaddle > 2) { // 2 is half of the paddle size
            // Green paddle (back paddle) scores
            gameState.player2Score++;
            updateScoreDisplay();
            checkGameOver();

            if (!gameState.isGameRunning) {
                return; // Exit if game is over
            }
            
            // Play score sound
            playScoreSound();

            // Reset ball to center
            resetBall();
        }
    } else if (ball.position.z - 0.5 <= -7.5) {  // Ball extended collision boundary reaches back wall
        // Check if the ball missed the back paddle
        const distanceToBackPaddle = Math.sqrt(
            Math.pow(ball.position.x - backPaddle.position.x, 2) +
            Math.pow(ball.position.y - backPaddle.position.y, 2)
        );

        if (distanceToBackPaddle > 2) { // 2 is half of the paddle size
            // Red paddle (front paddle) scores
            gameState.player1Score++;
            updateScoreDisplay();
            checkGameOver();

            if (!gameState.isGameRunning) {
                return; // Exit if game is over
            }
            
            // Play score sound
            playScoreSound();

            // Reset ball to center
            resetBall();
        }
    }

    // Check buff collisions
    checkBuffCollisions();
    
    // Update visual effects
    updateHitEffects();
    updateBallTrails();
    
    // Create ball trail
    if (gameState.isGameRunning && !gameState.isGamePaused) {
        createBallTrail(ball.position);
    }
    
    // Update round timer and generate buffs
    if (gameState.isGameRunning && !gameState.isGamePaused) {
        roundFrameCounter++;
        if (roundFrameCounter >= ROUND_DURATION) {
            roundFrameCounter = 0;
            roundsCompleted++;
            updateBuffs();
            
            // Generate buff blocks based on frequency setting
            // Frequency 0 = no buffs, 5 = buff every round
            const roundsNeeded = gameConfig.buffFrequency === 0 ? Infinity : Math.max(1, 6 - gameConfig.buffFrequency);
            if (gameConfig.buffFrequency > 0 && roundsCompleted - lastBuffCheckRound >= roundsNeeded) {
                lastBuffCheckRound = roundsCompleted;
                generateBuffBlocks();
            }
        }
    }
    
    // Animate buff blocks (rotate and pulse)
    activeBuffBlocks.forEach((block, index) => {
        block.rotation.x += 0.02;
        block.rotation.y += 0.03;
        
        // Pulse effect
        const pulseScale = 1 + Math.sin(Date.now() * 0.005 + index) * 0.1;
        if (block.userData.glowMesh) {
            block.userData.glowMesh.scale.set(pulseScale, pulseScale, pulseScale);
        }
    });
    
    // Twinkle stars individually
    const time = Date.now() * 0.001;
    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        // Each star has its own phase and speed
        const brightness = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time * starSpeeds[i] + starPhases[i]));
        starColors[i3] = brightness;     // R
        starColors[i3 + 1] = brightness; // G
        starColors[i3 + 2] = brightness; // B
    }
    starGeometry.attributes.color.needsUpdate = true;
    
    // Update ball glow position
    ballGlow.position.copy(ball.position);

    controls.update();
    renderer.render(scene, camera);
}

// Initialize the game
initGameState();
resetBall();
initSettingsUI();

// Show start screen, hide HUD initially
hud.classList.add('hidden');
startScreen.classList.remove('hidden');

animate();