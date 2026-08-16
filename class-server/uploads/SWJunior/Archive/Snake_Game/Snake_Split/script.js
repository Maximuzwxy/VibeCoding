// ==================== LOGIN ====================
let selectedAvatar = 'fox';
let playerName = '';
let playerBirth = '';

function selectAvatar(el) {
    document.querySelectorAll('.avatar-option').forEach(a => a.classList.remove('selected'));
    el.classList.add('selected');
    selectedAvatar = el.dataset.avatar;
}

function handleLogin() {
    const name = document.getElementById('loginName').value.trim();
    const birth = document.getElementById('loginBirth').value;
    const err = document.getElementById('loginError');

    if (!name) { err.textContent = 'Please enter your name.'; return; }
    if (!birth) { err.textContent = 'Please enter your birth date.'; return; }

    playerName = name;
    playerBirth = birth;
    err.textContent = '';

    // Transition to settings page
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('settingsPage').style.display = '';
}

// ==================== SETTINGS ====================
document.getElementById('startBtn').addEventListener('click', () => {
    gameStarted = true;
    document.getElementById('settingsPage').style.display = 'none';
    document.getElementById('gamePage').style.display = '';
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    if (!musicNodes.length) playMusicLoop();
    loadLeaderboard();
    scheduleSilverApple();
});

document.getElementById('musicBtn').addEventListener('click', toggleMusic);

// ==================== GAME ====================
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const TILE = 20;
const COLS = 30;
const ROWS = 25;
canvas.width = COLS * TILE;
canvas.height = ROWS * TILE;

// Music system
let musicOn = true;
let audioCtx = null;
let musicNodes = [];

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function stopMusic() {
    musicNodes.forEach(n => { try { n.stop(); } catch(e) {} });
    musicNodes = [];
}

function playNote(freq, startTime, duration, type = "square", vol = 0.04) {
    if (!audioCtx || !musicOn) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
    musicNodes.push(osc);
}

function playMusicLoop() {
    if (!musicOn || !audioCtx) return;
    stopMusic();
    let now = audioCtx.currentTime;
    let b = 0.2; // beat duration

    // "7 Rings" - Ariana Grande (approximation)
    // Interpolates "My Favorite Things" melody
    // C# minor: C#5=554, D#5=622, E5=659, F#5=740, G#5=831, A4=440, B4=494
    let melody = [
        // "Raindrops on roses and whiskers on kittens"
        659, 740, 831, 659, 554, 622, 659, 554,
        440, 494, 554, 440, 370, 415, 440, 370,
        // "Bright copper kettles and warm woolen mittens"
        659, 740, 831, 659, 554, 622, 659, 554,
        659, 740, 831, 880, 831, 740, 659, 554,
        // "I want it, I got it" hook
        554, 554, 554, 659, 554, 0, 554, 554,
        554, 659, 554, 0, 554, 554, 554, 659,
        // "You like my hair? Gee thanks, just bought it"
        554, 494, 440, 370, 330, 370, 440, 370,
        330, 294, 330, 370, 440, 554, 494, 440,
    ];

    // Trap-style 808 bassline
    let bassline = [];
    for (let i = 0; i < 64; i++) {
        if (i % 16 === 0 || i % 16 === 8) bassline.push(139); // C#2
        else if (i % 16 === 4 || i % 16 === 12) bassline.push(175); // F2
        else bassline.push(0);
    }

    // Sub bass (808 feel)
    for (let i = 0; i < bassline.length; i++) {
        if (bassline[i] > 0) {
            playNote(bassline[i], now + i * b, b * 2.5, "sine", 0.08);
        }
    }

    // Trap hi-hat rhythm
    for (let i = 0; i < 128; i++) {
        let hiFreq = 8000 + Math.random() * 2000;
        playNote(hiFreq, now + i * b/2, 0.03, "square", 0.015);
    }

    // Snare on 3rd beat
    for (let i = 0; i < 64; i++) {
        if (i % 8 === 4) {
            playNote(200, now + i * b, 0.06, "square", 0.025);
            playNote(80, now + i * b, 0.08, "sine", 0.04);
        }
    }

    // Soft pad chords
    for (let i = 0; i < 16; i++) {
        if (i % 4 === 0) {
            playNote(277, now + i * b * 4, b * 3.5, "sine", 0.02);
            playNote(415, now + i * b * 4, b * 3.5, "sine", 0.015);
        }
    }

    // Melody
    for (let i = 0; i < melody.length; i++) {
        if (melody[i] > 0) {
            playNote(melody[i], now + i * b, b * 0.7, "square", 0.04);
        }
    }

    // Loop
    musicNodes.push({stop: () => {}});
    let loopLength = melody.length * b;
    setTimeout(() => { if (musicOn) playMusicLoop(); }, loopLength * 1000);
}

function toggleMusic() {
    initAudio();
    musicOn = !musicOn;
    document.getElementById("musicBtn").textContent = "Music: " + (musicOn ? "ON" : "OFF");
    document.getElementById("musicBtn").style.background = musicOn ? "#228B22" : "#555";
    if (musicOn) {
        if (audioCtx.state === "suspended") audioCtx.resume();
        playMusicLoop();
    } else {
        stopMusic();
    }
}

const appleColors = ["#FFD700", "#800080", "#FFFFFF"];
const appleNames = { "#FFD700": "Golden", "#800080": "Purple", "#FFFFFF": "White" };

let snake = [{x: 10, y: 12}, {x: 9, y: 12}, {x: 8, y: 12}];
let dir = {x: 1, y: 0};
let nextDir = {x: 1, y: 0};
let apple = {x: 15, y: 12, color: "#FFD700"};
let applesEaten = 0;
let gameOver = false;
let gameWon = false;
let gameStarted = false;
let winRecorded = false;
let levelRecorded = false;
let lastBiteEffect = "—";
let speed = 120;
let snakeColor = "#FFD700";
let monsters = [];
let level = 1;
let silverApple = null;
let silverAppleTimeout = null;
let lastAppleTime = Date.now();
let hungerTimer = null;
let level3SnakeState = null;

// Level 4: Meteors
let meteors = [];
let meteorSpawnInterval = null;

// Level 5: Poison & potions
let bigMonsters = [];
let poisonApples = [];
let magicPotion = null;
let magicPotionTimeout = null;
let poisonEaten = 0;

const snakeColors = ["#800080", "#FFD700", "#4169E1", "#FFFFFF"];
setInterval(() => {
    snakeColor = snakeColors[Math.floor(Math.random() * snakeColors.length)];
}, 5000);

function isOccupied(x, y) {
    if (snake.some(s => s.x === x && s.y === y)) return true;
    if (monsters.some(m => m.x === x && m.y === y)) return true;
    if (apple.x === x && apple.y === y) return true;
    // 2x2 big monsters
    for (let bm of bigMonsters) {
        if (x >= bm.x && x <= bm.x + 1 && y >= bm.y && y <= bm.y + 1) return true;
    }
    // Meteors (3x3)
    for (let mt of meteors) {
        if (x >= mt.x && x <= mt.x + 2 && y >= mt.y && y <= mt.y + 2) return true;
    }
    // Poison apples
    if (poisonApples.some(p => p.x === x && p.y === y)) return true;
    // Magic potion
    if (magicPotion && magicPotion.x === x && magicPotion.y === y) return true;
    return false;
}

function spawnMonster() {
    if (!gameStarted || gameOver || gameWon) return;
    let pos;
    let tries = 0;
    do {
        pos = {x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS)};
        tries++;
    } while (isOccupied(pos.x, pos.y) && tries < 100);
    if (tries >= 100) return;
    let dirs = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
    monsters.push({x: pos.x, y: pos.y, dir: dirs[Math.floor(Math.random() * 4)], born: Date.now()});
}

function moveMonsters() {
    if (!gameStarted || gameOver || gameWon) return;
    let head = snake[0];
    for (let m of monsters) {
        let d;
        if (level >= 2) {
            // Chase the snake head
            let dx = head.x - m.x;
            let dy = head.y - m.y;
            let dirs = [];
            if (dx > 0) dirs.push({x: 1, y: 0});
            if (dx < 0) dirs.push({x: -1, y: 0});
            if (dy > 0) dirs.push({x: 0, y: 1});
            if (dy < 0) dirs.push({x: 0, y: -1});
            if (dirs.length === 0) dirs = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
            // Prefer horizontal or vertical based on bigger distance
            if (Math.abs(dx) >= Math.abs(dy) && dirs.some(d => d.y === 0)) {
                dirs = dirs.filter(d => d.y === 0).concat(dirs.filter(d => d.y !== 0));
            } else {
                dirs = dirs.filter(d => d.y !== 0).concat(dirs.filter(d => d.y === 0));
            }
            d = dirs[0];
        } else {
            d = m.dir;
        }

        let nx = m.x + d.x;
        let ny = m.y + d.y;

        // Bounce off walls or choose alternative direction
        if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
            let alts = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
            if (level >= 2) {
                let head = snake[0];
                alts.sort((a, b) => {
                    let da = Math.abs(m.x + a.x - head.x) + Math.abs(m.y + a.y - head.y);
                    let db = Math.abs(m.x + b.x - head.x) + Math.abs(m.y + b.y - head.y);
                    return da - db;
                });
            }
            for (let alt of alts) {
                let ax = m.x + alt.x, ay = m.y + alt.y;
                if (ax >= 0 && ax < COLS && ay >= 0 && ay < ROWS) {
                    d = alt; nx = ax; ny = ay; break;
                }
            }
        }

        m.dir = d;
        m.x = nx;
        m.y = ny;
    }
}

function checkMonsterSnakeCollision() {
    if (!gameStarted || gameOver || gameWon) return;
    for (let i = monsters.length - 1; i >= 0; i--) {
        let m = monsters[i];
        let collisionIdx = snake.findIndex(s => s.x === m.x && s.y === m.y);
        if (collisionIdx !== -1) {
            if (snake.length > 2) {
                snake.pop();
            } else {
                gameOver = true;
                return;
            }
            monsters.splice(i, 1);
            lastBiteEffect = `-1 (Monster!)`;
            document.getElementById("length").textContent = snake.length;
        }
    }
}

// Monster spawning: up to 1 per 3 seconds (Level 3: 2 at once)
setInterval(() => {
    if (Math.random() < 0.5) {
        spawnMonster();
        if (level >= 3) spawnMonster();
    }
}, 3000);

// Monster movement: 3 per second = every ~333ms
setInterval(() => {
    moveMonsters();
    checkMonsterSnakeCollision();
    // Remove monsters older than 10 seconds
    let now = Date.now();
    monsters = monsters.filter(m => now - m.born < 10000);
}, 333);

function spawnSilverApple() {
    if (!gameStarted || gameOver || gameWon || silverApple) return;
    let pos;
    let tries = 0;
    do {
        pos = {x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS)};
        tries++;
    } while (isOccupied(pos.x, pos.y) && tries < 100);
    if (tries >= 100) return;
    silverApple = pos;
    // Disappear after 5 seconds
    silverAppleTimeout = setTimeout(() => { silverApple = null; }, 5000);
}

// Silver apple spawns every 5 seconds
function scheduleSilverApple() {
    if (!gameStarted || gameOver || gameWon) return;
    let delay = 5000;
    setTimeout(() => {
        spawnSilverApple();
        scheduleSilverApple();
    }, delay);
}

function startHungerTimer() {
    if (level < 3) {
        document.getElementById("hungerDisplay").style.display = "none";
        return;
    }
    document.getElementById("hungerDisplay").style.display = "block";
    clearTimeout(hungerTimer);
    hungerTimer = setTimeout(() => {
        if (gameOver || gameWon || level < 3) return;
        let elapsed = Date.now() - lastAppleTime;
        if (elapsed >= 10000 && level3SnakeState) {
            lastBiteEffect = "HUNGER! Restarting Level 3...";
            snake = level3SnakeState.map(s => ({...s}));
            monsters = [];
            silverApple = null;
            clearTimeout(silverAppleTimeout);
            lastAppleTime = Date.now();
            startHungerTimer();
        }
    }, 10000);
}

function randomPos() {
    return {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
        color: appleColors[Math.floor(Math.random() * 3)]
    };
}

function spawnApple() {
    let pos;
    do {
        pos = randomPos();
    } while (isOccupied(pos.x, pos.y));
    apple = pos;
}

function moveAppleAway() {
    if (!gameStarted || gameOver || gameWon) return;
    let head = snake[0];
    let directions = [
        {x: -1, y: 0}, {x: 1, y: 0}, {x: 0, y: -1}, {x: 0, y: 1}
    ];
    // Sort by distance from snake head (furthest first)
    directions.sort((a, b) => {
        let da = Math.pow(apple.x + a.x - head.x, 2) + Math.pow(apple.y + a.y - head.y, 2);
        let db = Math.pow(apple.x + b.x - head.x, 2) + Math.pow(apple.y + b.y - head.y, 2);
        return db - da;
    });
    for (let d of directions) {
        let nx = apple.x + d.x;
        let ny = apple.y + d.y;
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS &&
            !snake.some(s => s.x === nx && s.y === ny)) {
            apple.x = nx;
            apple.y = ny;
            return;
        }
    }
}

// Apple runs away 2 times per second
setInterval(moveAppleAway, 500);

// ==================== LEVEL 4: METEORS ====================
function spawnMeteor() {
    if (gameOver || gameWon || level < 4) return;
    let x = Math.floor(Math.random() * (COLS - 2));
    meteors.push({ x, y: 0 });
}

function moveMeteors() {
    if (!gameStarted || gameOver || gameWon) return;
    for (let i = meteors.length - 1; i >= 0; i--) {
        meteors[i].y++;
        // Off screen → remove
        if (meteors[i].y >= ROWS) {
            meteors.splice(i, 1);
        }
    }
}

function checkMeteorSnakeCollision() {
    if (!gameStarted || gameOver || gameWon) return;
    for (let i = meteors.length - 1; i >= 0; i--) {
        let mt = meteors[i];
        let hit = false;
        for (let dx = 0; dx < 3; dx++) {
            for (let dy = 0; dy < 3; dy++) {
                let hx = mt.x + dx, hy = mt.y + dy;
                if (snake.some(s => s.x === hx && s.y === hy)) {
                    hit = true;
                    break;
                }
            }
            if (hit) break;
        }
        if (hit) {
            // Delete 3 snake blocks
            for (let d = 0; d < 3; d++) {
                if (snake.length > 2) snake.pop();
                else { gameOver = true; return; }
            }
            meteors.splice(i, 1);
            lastBiteEffect = "METEOR! -3 blocks";
            document.getElementById("length").textContent = snake.length;
        }
    }
}

// Meteor spawns every 5 seconds when level >= 4
setInterval(() => {
    if (!gameOver && !gameWon && level >= 4) spawnMeteor();
}, 5000);

// Meteor movement every 400ms
setInterval(() => {
    moveMeteors();
    checkMeteorSnakeCollision();
}, 400);

// ==================== LEVEL 5: 2x2 MONSTERS ====================
function spawnBigMonster() {
    if (gameOver || gameWon || level < 5) return;
    if (bigMonsters.length >= 2) return; // Max 2 big monsters
    let pos;
    let tries = 0;
    do {
        pos = { x: Math.floor(Math.random() * (COLS - 1)), y: Math.floor(Math.random() * (ROWS - 1)) };
        tries++;
    } while (isOccupied(pos.x, pos.y) && tries < 100);
    if (tries >= 100) return;
    bigMonsters.push({ x: pos.x, y: pos.y, born: Date.now() });
}

function moveBigMonsters() {
    if (!gameStarted || gameOver || gameWon) return;
    let head = snake[0];
    for (let bm of bigMonsters) {
        let dx = head.x - bm.x;
        let dy = head.y - bm.y;
        if (Math.abs(dx) >= Math.abs(dy)) {
            bm.x += (dx > 0 ? 1 : -1);
        } else {
            bm.y += (dy > 0 ? 1 : -1);
        }
        // Clamp
        if (bm.x < 0) bm.x = 0;
        if (bm.x > COLS - 2) bm.x = COLS - 2;
        if (bm.y < 0) bm.y = 0;
        if (bm.y > ROWS - 2) bm.y = ROWS - 2;
    }
}

function checkBigMonsterSnakeCollision() {
    if (!gameStarted || gameOver || gameWon) return;
    for (let i = bigMonsters.length - 1; i >= 0; i--) {
        let bm = bigMonsters[i];
        let collisionIdx = -1;
        for (let dx = 0; dx < 2; dx++) {
            for (let dy = 0; dy < 2; dy++) {
                let idx = snake.findIndex(s => s.x === bm.x + dx && s.y === bm.y + dy);
                if (idx !== -1) { collisionIdx = idx; break; }
            }
            if (collisionIdx !== -1) break;
        }
        if (collisionIdx !== -1) {
            if (snake.length > 2) {
                snake.pop();
            } else {
                gameOver = true;
                return;
            }
            bigMonsters.splice(i, 1);
            lastBiteEffect = "-1 (Big Monster!)";
            document.getElementById("length").textContent = snake.length;
        }
    }
}

// Big monsters spawn every 8 seconds
setInterval(() => {
    if (!gameOver && !gameWon && level >= 5) spawnBigMonster();
}, 8000);

// Big monsters move every 500ms
setInterval(() => {
    moveBigMonsters();
    checkBigMonsterSnakeCollision();
    // Remove big monsters older than 12 seconds
    let now = Date.now();
    bigMonsters = bigMonsters.filter(m => now - m.born < 12000);
}, 500);

// ==================== LEVEL 5: POISON APPLES & MAGIC POTIONS ====================
function spawnPoisonApple() {
    if (gameOver || gameWon || level < 5) return;
    if (poisonApples.length >= 2) return;
    let pos;
    let tries = 0;
    do {
        pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
        tries++;
    } while (isOccupied(pos.x, pos.y) && tries < 100);
    if (tries >= 100) return;
    poisonApples.push(pos);
}

// Poison apples spawn every 6 seconds
setInterval(() => {
    if (!gameOver && !gameWon && level >= 5) spawnPoisonApple();
}, 6000);

function spawnMagicPotion() {
    if (gameOver || gameWon || level < 5 || magicPotion) return;
    let pos;
    let tries = 0;
    do {
        pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
        tries++;
    } while (isOccupied(pos.x, pos.y) && tries < 100);
    if (tries >= 100) return;
    magicPotion = pos;
    magicPotionTimeout = setTimeout(() => { magicPotion = null; }, 5000);
}

// Magic potion spawns every 10 seconds
setInterval(() => {
    if (!gameOver && !gameWon && level >= 5) spawnMagicPotion();
}, 10000);

function update() {
    if (!gameStarted || gameOver || gameWon) return;

    dir = {...nextDir};
    let head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};

    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        gameOver = true;
        return;
    }

    // Self collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
        gameOver = true;
        return;
    }

    snake.unshift(head);

    // Check apple
    if (head.x === apple.x && head.y === apple.y) {
        applesEaten++;

        // Random growth/shrink: -3 to +5 segments
        let change = Math.floor(Math.random() * 9) - 3;
        if (change > 0) {
            for (let i = 0; i < change; i++) {
                snake.push({...snake[snake.length - 1]});
            }
            lastBiteEffect = `+${change} (${appleNames[apple.color]})`;
        } else if (change < 0) {
            let remove = Math.min(Math.abs(change), snake.length - 1);
            for (let i = 0; i < remove; i++) {
                snake.pop();
            }
            lastBiteEffect = `${change} (${appleNames[apple.color]})`;
        } else {
            lastBiteEffect = `+0 (${appleNames[apple.color]})`;
        }

        if (snake.length < 2) {
            gameOver = true;
            return;
        }

        // Level 2 transition at 5 apples
        if (applesEaten === 5 && level === 1) {
            level = 2;
            lastBiteEffect = "LEVEL 2! Monsters hunt!";
            document.getElementById("level").textContent = "2";
            document.getElementById("level").style.color = "#FF4444";
            if (musicOn) playMusicLoop();
        }

        // Level 3 transition at 10 apples
        if (applesEaten === 10 && level === 2) {
            level = 3;
            lastBiteEffect = "LEVEL 3! Double monsters + hunger!";
            document.getElementById("level").textContent = "3";
            document.getElementById("level").style.color = "#FF0000";
            level3SnakeState = snake.map(s => ({...s}));
            lastAppleTime = Date.now();
            startHungerTimer();
            if (musicOn) playMusicLoop();
        }

        // Level 4 transition at 15 apples
        if (applesEaten === 15 && level === 3) {
            level = 4;
            lastBiteEffect = "LEVEL 4! Meteors!";
            document.getElementById("level").textContent = "4";
            document.getElementById("level").style.color = "#FF6600";
            lastAppleTime = Date.now();
            startHungerTimer();
            if (musicOn) playMusicLoop();
        }

        // Level 5 transition at 20 apples
        if (applesEaten === 20 && level === 4) {
            level = 5;
            lastBiteEffect = "LEVEL 5! Big monsters + poison!";
            document.getElementById("level").textContent = "5";
            document.getElementById("level").style.color = "#FF00FF";
            poisonEaten = 0;
            lastAppleTime = Date.now();
            startHungerTimer();
            if (musicOn) playMusicLoop();
        }

        // Reset hunger timer on any apple eaten in level 3
        if (level >= 3) {
            lastAppleTime = Date.now();
            startHungerTimer();
        }

        // Win check
        if (applesEaten >= 25) {
            gameWon = true;
            if (!winRecorded) { winRecorded = true; recordLevel(); }
            return;
        }

        speed = Math.max(55, 120 - applesEaten);

        spawnApple();
    } else {
        snake.pop();
    }

    // Check green apple
    if (silverApple && head.x === silverApple.x && head.y === silverApple.y) {
        clearTimeout(silverAppleTimeout);
        silverApple = null;
        if (level === 1) {
            applesEaten = 10;
            level = 2;
            lastBiteEffect = "GREEN APPLE! Level 2! +10";
            document.getElementById("level").textContent = "2";
            document.getElementById("level").style.color = "#FF4444";
            for (let i = 0; i < 10; i++) snake.push({...snake[snake.length - 1]});
        } else if (level === 2) {
            applesEaten = 20;
            level = 3;
            lastBiteEffect = "GREEN APPLE! Level 3! +10";
            document.getElementById("level").textContent = "3";
            document.getElementById("level").style.color = "#FF0000";
            level3SnakeState = snake.map(s => ({...s}));
            lastAppleTime = Date.now();
            startHungerTimer();
            for (let i = 0; i < 10; i++) snake.push({...snake[snake.length - 1]});
        } else if (level === 3) {
            applesEaten = 30;
            level = 4;
            lastBiteEffect = "GREEN APPLE! Level 4! +10";
            document.getElementById("level").textContent = "4";
            document.getElementById("level").style.color = "#FF6600";
            startHungerTimer();
            for (let i = 0; i < 10; i++) snake.push({...snake[snake.length - 1]});
        } else if (level === 4) {
            applesEaten = 40;
            level = 5;
            lastBiteEffect = "GREEN APPLE! Level 5! +10";
            document.getElementById("level").textContent = "5";
            document.getElementById("level").style.color = "#FF00FF";
            poisonEaten = 0;
            startHungerTimer();
            for (let i = 0; i < 10; i++) snake.push({...snake[snake.length - 1]});
        } else {
            applesEaten = 25;
            gameWon = true;
            if (!winRecorded) { winRecorded = true; recordLevel(); }
            lastBiteEffect = "GREEN APPLE! You win! +10";
            for (let i = 0; i < 10; i++) snake.push({...snake[snake.length - 1]});
        }
    }

    // Check poison apples (Level 5)
    for (let i = poisonApples.length - 1; i >= 0; i--) {
        let p = poisonApples[i];
        if (head.x === p.x && head.y === p.y) {
            poisonApples.splice(i, 1);
            poisonEaten++;
            lastBiteEffect = `POISON! ${poisonEaten}/3`;
            if (poisonEaten >= 3) {
                gameOver = true;
                lastBiteEffect = "POISONED TO DEATH!";
                return;
            }
        }
    }

    // Check magic potion (Level 5)
    if (magicPotion && head.x === magicPotion.x && head.y === magicPotion.y) {
        clearTimeout(magicPotionTimeout);
        magicPotion = null;
        poisonEaten = 0;
        lastBiteEffect = "POTION! Poison cured!";
    }

    document.getElementById("score").textContent = applesEaten;
    document.getElementById("length").textContent = snake.length;
    document.getElementById("lastBite").textContent = lastBiteEffect;
    if (level >= 3) {
        let remaining = Math.max(0, Math.ceil((10000 - (Date.now() - lastAppleTime)) / 1000));
        document.getElementById("hunger").textContent = remaining + "s";
        document.getElementById("hunger").style.color = remaining <= 3 ? "#FF4444" : "#FFD700";
    }
    // Poison display
    if (level >= 5 && poisonApples.length > 0) {
        document.getElementById("poisonDisplay").style.display = "block";
        document.getElementById("poisonCounter").textContent = poisonEaten + "/3";
        document.getElementById("poisonCounter").style.color = poisonEaten >= 2 ? "#FF4444" : "#FF6600";
    } else if (level >= 5 && poisonEaten > 0) {
        document.getElementById("poisonDisplay").style.display = "block";
        document.getElementById("poisonCounter").textContent = poisonEaten + "/3";
        document.getElementById("poisonCounter").style.color = "#FFD700";
    } else {
        document.getElementById("poisonDisplay").style.display = "none";
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = "#0E1222";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * TILE, 0);
        ctx.lineTo(x * TILE, ROWS * TILE);
        ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * TILE);
        ctx.lineTo(COLS * TILE, y * TILE);
        ctx.stroke();
    }

    // Apple
    let ax = apple.x * TILE + TILE/2;
    let ay = apple.y * TILE + TILE/2;
    let r = TILE/2 - 2;

    // Glow
    ctx.shadowColor = apple.color;
    ctx.shadowBlur = 8;

    // Apple body
    ctx.fillStyle = apple.color;
    ctx.beginPath();
    ctx.ellipse(ax, ay + 1, r - 1, r - 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Highlight / shine
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.ellipse(ax - 2, ay - 3, 3, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Stem
    ctx.strokeStyle = "#5C3A1E";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ax, ay - r + 1);
    ctx.lineTo(ax + 1, ay - r - 3);
    ctx.stroke();

    // Leaf
    ctx.fillStyle = "#3CB043";
    ctx.beginPath();
    ctx.ellipse(ax + 3, ay - r - 1, 3, 1.5, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2B7A2B";
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.lineWidth = 1;

    // Silver Apple
    if (silverApple) {
        let sx = silverApple.x * TILE + TILE/2;
        let sy = silverApple.y * TILE + TILE/2;
        ctx.shadowColor = "#32CD32";
        ctx.shadowBlur = 12;
        let grad = ctx.createRadialGradient(sx - 2, sy - 2, 1, sx, sy, TILE/2);
        grad.addColorStop(0, "#90EE90");
        grad.addColorStop(0.4, "#32CD32");
        grad.addColorStop(1, "#228B22");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(sx, sy + 1, TILE/2 - 2, TILE/2 - 1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Stem
        ctx.strokeStyle = "#5C3A1E";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy - TILE/2 + 3);
        ctx.lineTo(sx + 1, sy - TILE/2 - 2);
        ctx.stroke();
        // Sparkle
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.beginPath();
        ctx.arc(sx - 3, sy - 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1;
    }

    // Monsters
    for (let m of monsters) {
        let mx = m.x * TILE + TILE/2;
        let my = m.y * TILE + TILE/2;
        ctx.shadowColor = "#FF0000";
        ctx.shadowBlur = 6;
        ctx.fillStyle = "#CC0000";
        ctx.beginPath();
        ctx.arc(mx, my, TILE/2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Yellow dot in center
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(mx, my, 3, 0, Math.PI * 2);
        ctx.fill();
        // Angry eyes
        ctx.fillStyle = "white";
        ctx.fillRect(mx - 5, my - 3, 3, 2);
        ctx.fillRect(mx + 2, my - 3, 3, 2);
        ctx.fillStyle = "black";
        ctx.fillRect(mx - 4, my - 3, 1.5, 2);
        ctx.fillRect(mx + 3, my - 3, 1.5, 2);
    }

    // Meteors (Level 4)
    for (let mt of meteors) {
        let mx = mt.x * TILE;
        let my = mt.y * TILE;
        ctx.shadowColor = "#FF4400";
        ctx.shadowBlur = 10;
        // Red/orange gradient
        let grad = ctx.createLinearGradient(mx, my, mx + TILE * 3, my + TILE * 3);
        grad.addColorStop(0, "#FF6600");
        grad.addColorStop(0.5, "#FF3300");
        grad.addColorStop(1, "#CC0000");
        ctx.fillStyle = grad;
        ctx.fillRect(mx + 1, my + 1, TILE * 3 - 2, TILE * 3 - 2);
        // Crater details
        ctx.fillStyle = "#FFAA00";
        ctx.beginPath();
        ctx.arc(mx + TILE, my + TILE, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FF5500";
        ctx.beginPath();
        ctx.arc(mx + TILE * 2, my + TILE * 1.5, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Big 2x2 Monsters (Level 5)
    for (let bm of bigMonsters) {
        let mx = bm.x * TILE;
        let my = bm.y * TILE;
        ctx.shadowColor = "#FF00FF";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#9900CC";
        ctx.beginPath();
        ctx.roundRect(mx + 2, my + 2, TILE * 2 - 4, TILE * 2 - 4, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Eyes
        ctx.fillStyle = "white";
        ctx.fillRect(mx + 8, my + 8, 6, 5);
        ctx.fillRect(mx + 24, my + 8, 6, 5);
        ctx.fillStyle = "black";
        ctx.fillRect(mx + 10, my + 9, 3, 3);
        ctx.fillRect(mx + 26, my + 9, 3, 3);
        // Mouth
        ctx.fillStyle = "#FF00FF";
        ctx.fillRect(mx + 10, my + 22, TILE * 2 - 20, 4);
    }

    // Poison Apples (Level 5)
    for (let p of poisonApples) {
        let px = p.x * TILE + TILE / 2;
        let py = p.y * TILE + TILE / 2;
        ctx.shadowColor = "#9900CC";
        ctx.shadowBlur = 8;
        // Purple apple body
        ctx.fillStyle = "#7700AA";
        ctx.beginPath();
        ctx.ellipse(px, py + 1, TILE / 2 - 2, TILE / 2 - 1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Skull
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(px, py - 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#7700AA";
        ctx.fillRect(px - 1.5, py - 1, 3, 4);
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(px, py + 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = "black";
        ctx.fillRect(px - 2, py - 3, 1.5, 2);
        ctx.fillRect(px + 1, py - 3, 1.5, 2);
        // Stem
        ctx.strokeStyle = "#5C3A1E";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, py - TILE / 2 + 3);
        ctx.lineTo(px + 1, py - TILE / 2 - 2);
        ctx.stroke();
        ctx.lineWidth = 1;
    }

    // Magic Potion (Level 5)
    if (magicPotion) {
        let px = magicPotion.x * TILE + TILE / 2;
        let py = magicPotion.y * TILE + TILE / 2;
        ctx.shadowColor = "#00CCFF";
        ctx.shadowBlur = 12;
        // Bottle body
        ctx.fillStyle = "#00CCFF";
        ctx.beginPath();
        ctx.roundRect(px - 5, py - 4, 10, 12, 3);
        ctx.fill();
        // Bottle neck
        ctx.fillStyle = "#0088AA";
        ctx.fillRect(px - 2, py - 8, 4, 5);
        // Cork
        ctx.fillStyle = "#8B5E3C";
        ctx.fillRect(px - 3, py - 11, 6, 4);
        // Shine
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillRect(px - 4, py - 2, 2, 6);
        ctx.shadowBlur = 0;
    }

    // Snake
    for (let i = 0; i < snake.length; i++) {
        let s = snake[i];
        let alpha = 1 - (i / (snake.length + 10)) * 0.6;
        let r, g, b;
        if (snakeColor.startsWith("#")) {
            let hex = snakeColor;
            if (hex.length === 4) {
                r = parseInt(hex[1]+hex[1], 16);
                g = parseInt(hex[2]+hex[2], 16);
                b = parseInt(hex[3]+hex[3], 16);
            } else {
                r = parseInt(hex.slice(1,3), 16);
                g = parseInt(hex.slice(3,5), 16);
                b = parseInt(hex.slice(5,7), 16);
            }
        }
        ctx.fillStyle = i === 0 ? snakeColor : `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fillRect(s.x * TILE + 1, s.y * TILE + 1, TILE - 2, TILE - 2);
        if (i === 0) {
            ctx.fillStyle = snakeColor === "#FFFFFF" ? "#222" : "white";
            ctx.fillRect(s.x * TILE + 5, s.y * TILE + 3, 4, 4);
            ctx.fillRect(s.x * TILE + 11, s.y * TILE + 3, 4, 4);
        }
    }

    // Game Over overlay
    if (gameOver && gameStarted) {
        if (!levelRecorded) { levelRecorded = true; recordLevel(); }
        document.getElementById("replayBtn").style.display = "block";
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#FF4444";
        ctx.font = "bold 36px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2 - 10);
        ctx.fillStyle = "#aaa";
        ctx.font = "16px 'Courier New'";
        ctx.fillText(`Apples eaten: ${applesEaten} / 25`, canvas.width/2, canvas.height/2 + 30);
    }

    // Win overlay
    if (gameWon && gameStarted) {
        document.getElementById("replayBtn").style.display = "block";
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 34px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText("YOU WIN!", canvas.width/2, canvas.height/2 - 15);
        ctx.font = "18px 'Courier New'";
        ctx.fillText(`50 Apples Devoured!`, canvas.width/2, canvas.height/2 + 20);
        ctx.fillText(`Final Length: ${snake.length}`, canvas.width/2, canvas.height/2 + 45);
    }
}

function gameLoop() {
    update();
    draw();
    setTimeout(gameLoop, speed);
}

document.addEventListener("keydown", e => {
    if (!gameStarted || gameOver || gameWon) return;
    switch (e.key) {
        case "ArrowUp": if (dir.y !== 1) nextDir = {x: 0, y: -1}; break;
        case "ArrowDown": if (dir.y !== -1) nextDir = {x: 0, y: 1}; break;
        case "ArrowLeft": if (dir.x !== 1) nextDir = {x: -1, y: 0}; break;
        case "ArrowRight": if (dir.x !== -1) nextDir = {x: 1, y: 0}; break;
    }
});

spawnApple();
gameLoop();

// Auto-start music on first user interaction
function autoStartMusic() {
    initAudio();
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    if (!musicNodes.length) playMusicLoop();
}
autoStartMusic();
canvas.addEventListener("click", function startOnce() {
    autoStartMusic();
    canvas.removeEventListener("click", startOnce);
});
window.addEventListener("keydown", function startOnceK() {
    autoStartMusic();
    window.removeEventListener("keydown", startOnceK);
}, { once: true });

// ==================== LEADERBOARD ====================
function loadLeaderboard() {
    fetch('/api/leaderboard')
        .then(r => r.json())
        .then(data => {
            const list = document.getElementById('leaderboardList');
            if (!data.length) {
                list.innerHTML = '<li class="empty">No one yet — be the first!</li>';
                return;
            }
            list.innerHTML = data.map((p, i) => {
                const medals = ['', '', ''];
                const prefix = i < 3 ? medals[i] + ' ' : '';
                return `<li>${prefix}${escape(p.name)} <span class="wins">Highest Lv ${p.level}</span></li>`;
            }).join('');
        })
        .catch(() => {
            document.getElementById('leaderboardList').innerHTML = '<li class="empty">Could not load leaderboard</li>';
        });
}

function recordLevel() {
    if (!playerName) return;
    fetch('/api/level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, level: level })
    }).then(() => loadLeaderboard());
}

function escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ==================== REPLAY ====================
function resetGame() {
    gameOver = false;
    gameWon = false;
    gameStarted = true;
    winRecorded = false;
    levelRecorded = false;
    snake = [{x: 10, y: 12}, {x: 9, y: 12}, {x: 8, y: 12}];
    dir = {x: 1, y: 0};
    nextDir = {x: 1, y: 0};
    applesEaten = 0;
    level = 1;
    speed = 120;
    lastBiteEffect = "—";
    snakeColor = "#FFD700";
    monsters = [];
    meteors = [];
    bigMonsters = [];
    poisonApples = [];
    poisonEaten = 0;
    if (magicPotionTimeout) clearTimeout(magicPotionTimeout);
    magicPotion = null;
    if (silverAppleTimeout) clearTimeout(silverAppleTimeout);
    silverApple = null;
    if (hungerTimer) clearTimeout(hungerTimer);
    lastAppleTime = Date.now();
    level3SnakeState = null;

    document.getElementById("level").textContent = "1";
    document.getElementById("level").style.color = "";
    document.getElementById("score").textContent = "0";
    document.getElementById("length").textContent = "3";
    document.getElementById("lastBite").textContent = "—";
    document.getElementById("hungerDisplay").style.display = "none";
    document.getElementById("poisonDisplay").style.display = "none";
    document.getElementById("replayBtn").style.display = "none";

    spawnApple();
    if (musicOn) playMusicLoop();
}

document.getElementById("replayBtn").addEventListener("click", resetGame);
