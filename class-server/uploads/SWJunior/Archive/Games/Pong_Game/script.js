// ==================== SETTINGS PAGE ====================
let soundEnabled = true;
let difficulty = 1;  // 0=Easy, 1=Normal, 2=Devil
let ballColor = "#FFD700"; // default gold
let racketColor = "#FFFFFF"; // default white
let racketSpeed = 50; // default middle

// Speed slider
const speedSlider = document.getElementById("speedSlider");
const speedValue = document.getElementById("speedValue");
speedSlider.addEventListener("input", () => {
    racketSpeed = parseInt(speedSlider.value);
    speedValue.textContent = racketSpeed;
});

const soundBtn = document.getElementById("soundBtn");
soundBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundBtn.textContent = soundEnabled ? "ON" : "OFF";
    soundBtn.classList.toggle("muted", !soundEnabled);
    soundBtn.classList.toggle("sound-on", soundEnabled);
});

// Difficulty buttons
document.querySelectorAll(".diff-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".diff-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        difficulty = parseInt(btn.dataset.diff);
    });
});

// Ball color buttons
document.querySelectorAll(".color-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".color-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        ballColor = btn.dataset.color;
    });
});

// Racket color buttons
document.querySelectorAll(".racket-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".racket-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        racketColor = btn.dataset.color;
    });
});

// Start button
document.getElementById("startBtn").addEventListener("click", () => {
    document.getElementById("settingsPage").style.display = "none";
    document.getElementById("gamePage").style.display = "flex";
    let diffNames = ["EASY", "NORMAL", "DEVIL"];
    let diffColors = ["#32CD32", "#FFD700", "#FF4444"];
    let dd = document.getElementById("diffDisplay");
    dd.textContent = diffNames[difficulty];
    dd.style.color = diffColors[difficulty];
    gameStarted = true;
    resetBall();
});

// ==================== AUDIO SYSTEM ====================
let audioCtx = null;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playSound(freq, duration, type = "square", vol = 0.08) {
    if (!audioCtx || !soundEnabled) return;
    if (audioCtx.state === "suspended") audioCtx.resume();
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Initialize audio on first interaction
document.addEventListener("click", () => initAudio(), { once: true });
document.addEventListener("keydown", () => initAudio(), { once: true });

// ==================== GAME ====================
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const WIDTH = 800;
const HEIGHT = 500;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// Paddles
const PADDLE_W = 12;
const PADDLE_H = 80;
function getPaddleSpeed() { return 1 + (racketSpeed / 100) * 11; } // 1 to 12

let player = { x: 20, y: HEIGHT / 2 - PADDLE_H / 2, w: PADDLE_W, h: PADDLE_H };
let cpu = { x: WIDTH - 20 - PADDLE_W, y: HEIGHT / 2 - PADDLE_H / 2, w: PADDLE_W, h: PADDLE_H };

// Ball
let BALL_SIZE = 20;
let ball = { x: WIDTH / 2, y: HEIGHT / 2, w: BALL_SIZE, h: BALL_SIZE };
let ballSpeed = 5;
let ballVX = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
let ballVY = ballSpeed * (Math.random() * 2 - 1);

// Scores
let playerScore = 0;
let cpuScore = 0;
const WIN_SCORE = 7;

// Input
let keys = {};
let gameOver = false;
let gameStarted = false;
let paused = false;
let lastHitter = null;

// Power-ups
let powerUps = [];
let freezeOpponent = 0;
let autoPlay = 0;
let speedBoost = 0;

function spawnPowerUp() {
    if (gameOver || !gameStarted) return;
    let px = WIDTH / 4 + Math.random() * WIDTH / 2;
    let py = HEIGHT / 4 + Math.random() * HEIGHT / 2;
    let maxType = difficulty === 2 ? 4 : 3;
    let type = Math.floor(Math.random() * maxType);
    let colors = ["#00BFFF", "#FF4500", "#32CD32", "#FF69B4"];
    let labels = ["FREEZE", "SPEED", "AUTO", "GIFT"];
    powerUps.push({ x: px, y: py, type: type, color: colors[type], label: labels[type], born: Date.now() });
}

setInterval(() => {
    if (gameStarted && !gameOver) spawnPowerUp();
}, 5000);

setInterval(() => {
    let now = Date.now();
    powerUps = powerUps.filter(p => now - p.born < 10000);
}, 1000);

document.addEventListener("keydown", e => {
    if (e.key === "w" || e.key === "s") e.preventDefault();
    if (e.key === "p" || e.key === "P") { paused = true; return; }
    if (e.key === "t" || e.key === "T") { paused = false; return; }
    if ((e.key === "b" || e.key === "B") && gameStarted) {
        BALL_SIZE = Math.min(HEIGHT, BALL_SIZE + 20);
        ball.w = BALL_SIZE; ball.h = BALL_SIZE;
        return;
    }
    if ((e.key === "k" || e.key === "K") && gameStarted) {
        BALL_SIZE = Math.max(20, BALL_SIZE - 20);
        ball.w = BALL_SIZE; ball.h = BALL_SIZE;
        return;
    }
    keys[e.key] = true;
});
document.addEventListener("keyup", e => { keys[e.key] = false; });

function resetBall() {
    ball.x = WIDTH / 2;
    ball.y = HEIGHT / 2;
    ballSpeed = difficulty === 0 ? 4 : difficulty === 2 ? 12 : 5;
    ballVX = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
    ballVY = ballSpeed * (Math.random() * 2 - 1);
    lastHitter = null;
}

function update() {
    if (gameOver || !gameStarted || paused) return;

    if (keys["w"] && player.y > 0) player.y -= getPaddleSpeed();
    if (keys["s"] && player.y < HEIGHT - player.h) player.y += getPaddleSpeed();

    // CPU movement
    if (Date.now() < freezeOpponent) {
        // frozen
    } else {
        let cpuCenter = cpu.y + cpu.h / 2;
        let cpuTarget = ball.y;
        let cpuSpeed = difficulty === 0 ? 3 : difficulty === 2 ? 7 : 4.5;
        cpuSpeed += cpuScore * (difficulty === 2 ? 0.8 : 0.4);
        if (Math.abs(cpuCenter - cpuTarget) > 10) {
            if (cpuCenter < cpuTarget && cpu.y < HEIGHT - cpu.h) cpu.y += cpuSpeed;
            if (cpuCenter > cpuTarget && cpu.y > 0) cpu.y -= cpuSpeed;
        }
    }

    // Auto-play
    if (Date.now() < autoPlay) {
        let playerCenter = player.y + player.h / 2;
        let playerTarget = ball.y;
        if (Math.abs(playerCenter - playerTarget) > 8) {
            if (playerCenter < playerTarget && player.y < HEIGHT - player.h) player.y += 5;
            if (playerCenter > playerTarget && player.y > 0) player.y -= 5;
        }
    }

    let speedMultiplier = Date.now() < speedBoost ? 1.8 : 1;
    ball.x += ballVX * speedMultiplier;
    ball.y += ballVY * speedMultiplier;

    // Wall bounce
    if (ball.y <= 0 || ball.y + ball.h >= HEIGHT) {
        ballVY = -ballVY;
        playSound(200, 0.06, "square", 0.05);
    }

    // CPU scores
    if (ball.x <= 0) {
        cpuScore++;
        document.getElementById("cpuScore").textContent = cpuScore;
        playSound(300, 0.15, "sawtooth", 0.06);
        setTimeout(() => playSound(200, 0.15, "sawtooth", 0.06), 150);
        if (cpuScore >= WIN_SCORE) { gameOver = true; return; }
        resetBall();
    }

    // Player scores
    if (ball.x + ball.w >= WIDTH) {
        playerScore++;
        document.getElementById("playerScore").textContent = playerScore;
        playSound(400, 0.15, "square", 0.06);
        setTimeout(() => playSound(500, 0.15, "square", 0.06), 150);
        if (playerScore >= WIN_SCORE) { gameOver = true; return; }
        resetBall();
    }

    // Ball hits player paddle
    if (
        ball.x <= player.x + player.w &&
        ball.x + ball.w >= player.x &&
        ball.y + ball.h >= player.y &&
        ball.y <= player.y + player.h
    ) {
        let hitPos = (ball.y + ball.h / 2 - player.y) / player.h;
        let angle = (hitPos - 0.5) * Math.PI / 3;
        ballSpeed += 0.3;
        ballVX = ballSpeed * Math.cos(angle);
        ballVY = ballSpeed * Math.sin(angle);
        ball.x = player.x + player.w + 1;
        lastHitter = "player";
        playSound(440, 0.08, "square", 0.06);
    }

    // Ball hits CPU paddle
    if (
        ball.x + ball.w >= cpu.x &&
        ball.x <= cpu.x + cpu.w &&
        ball.y + ball.h >= cpu.y &&
        ball.y <= cpu.y + cpu.h
    ) {
        let hitPos = (ball.y + ball.h / 2 - cpu.y) / cpu.h;
        let angle = (hitPos - 0.5) * Math.PI / 3;
        ballSpeed += 0.3;
        ballVX = -ballSpeed * Math.cos(angle);
        ballVY = ballSpeed * Math.sin(angle);
        ball.x = cpu.x - ball.w - 1;
        lastHitter = "cpu";
        playSound(350, 0.08, "triangle", 0.06);
    }

    // Power-up collision
    let bx = ball.x + ball.w / 2;
    let by = ball.y + ball.h / 2;
    for (let i = powerUps.length - 1; i >= 0; i--) {
        let p = powerUps[i];
        let dx = bx - p.x;
        let dy = by - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < ball.w / 2 + 18) {
            playSound(660, 0.1, "triangle", 0.08);
            setTimeout(() => playSound(880, 0.08, "triangle", 0.06), 80);
            let now = Date.now();
            if (p.type === 0) { freezeOpponent = now + 3000; }
            else if (p.type === 1) { speedBoost = now + 5000; }
            else if (p.type === 2) { autoPlay = now + 5000; }
            else if (p.type === 3) {
                playSound(150, 0.2, "sawtooth", 0.1);
                if (lastHitter === "player" && playerScore > 0) {
                    playerScore--;
                    document.getElementById("playerScore").textContent = playerScore;
                } else if (lastHitter === "cpu" && cpuScore > 0) {
                    cpuScore--;
                    document.getElementById("cpuScore").textContent = cpuScore;
                }
            }
            powerUps.splice(i, 1);
        }
    }
}

// ==================== DRAWING ====================

function drawField() {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    ctx.strokeRect(8, 8, WIDTH - 16, HEIGHT - 16);

    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fillRect(WIDTH / 2 - 4, 0, 8, HEIGHT);

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, 0);
    ctx.lineTo(WIDTH / 2, HEIGHT);
    ctx.stroke();

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(WIDTH / 2, HEIGHT / 2, 50, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(WIDTH / 2, HEIGHT / 2, 4, 0, Math.PI * 2);
    ctx.fill();
}

function drawRacket(x, y, w, h, headSide) {
    let headCX, headCY, headRX, headRY, handleX, handleY, handleW, handleH;

    if (headSide === "right") {
        headCX = x + w - 6;
        headCY = y + h / 2;
        headRX = 6;
        headRY = h / 2 - 3;
        handleX = x;
        handleY = y + h / 2 - 3;
        handleW = w - headRX;
        handleH = 6;
    } else {
        headCX = x + 6;
        headCY = y + h / 2;
        headRX = 6;
        headRY = h / 2 - 3;
        handleX = x + headRX;
        handleY = y + h / 2 - 3;
        handleW = w - headRX;
        handleH = 6;
    }

    // Handle
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(handleX, handleY, handleW, handleH);
    ctx.strokeStyle = "#5C2E00";
    ctx.lineWidth = 1;
    ctx.strokeRect(handleX, handleY, handleW, handleH);

    // Grip wrap
    ctx.strokeStyle = "#6B3410";
    ctx.lineWidth = 0.5;
    for (let i = 4; i < handleW - 4; i += 4) {
        ctx.beginPath();
        ctx.moveTo(handleX + i, handleY);
        ctx.lineTo(handleX + i + 2, handleY + handleH);
        ctx.stroke();
    }

    // Head frame
    ctx.fillStyle = racketColor;
    ctx.strokeStyle = racketColor === "#FFFFFF" ? "#ccc" : racketColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(headCX, headCY, headRX, headRY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner strings
    ctx.fillStyle = racketColor === "#FFFFFF" ? "rgba(240, 240, 240, 0.4)" : "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.ellipse(headCX, headCY, headRX - 2, headRY - 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = racketColor === "#FFFFFF" ? "rgba(200, 200, 200, 0.6)" : "rgba(255,255,255,0.4)";
    ctx.lineWidth = 0.5;
    let innerRX = headRX - 2;
    let innerRY = headRY - 2;
    for (let i = -3; i <= 3; i++) {
        let sx = headCX + i * (innerRX / 4);
        let maxY = innerRY * Math.sqrt(Math.max(0, 1 - ((i * innerRX / 4) ** 2) / (innerRX ** 2)));
        if (maxY > 0) {
            ctx.beginPath();
            ctx.moveTo(sx, headCY - maxY);
            ctx.lineTo(sx, headCY + maxY);
            ctx.stroke();
        }
    }
    for (let j = -3; j <= 3; j++) {
        let sy = headCY + j * (innerRY / 4);
        let maxX = innerRX * Math.sqrt(Math.max(0, 1 - ((j * innerRY / 4) ** 2) / (innerRY ** 2)));
        if (maxX > 0) {
            ctx.beginPath();
            ctx.moveTo(headCX - maxX, sy);
            ctx.lineTo(headCX + maxX, sy);
            ctx.stroke();
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Field surface
    ctx.fillStyle = "#0A1628";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    drawField();

    // Power status HUD
    let now = Date.now();
    let status = [];
    if (now < freezeOpponent) status.push(`FREEZE ${Math.ceil((freezeOpponent - now) / 1000)}s`);
    if (now < speedBoost) status.push(`SPEED ${Math.ceil((speedBoost - now) / 1000)}s`);
    if (now < autoPlay) status.push(`AUTO ${Math.ceil((autoPlay - now) / 1000)}s`);
    document.getElementById("powerStatus").textContent = status.length > 0 ? status.join(" | ") : "";

    // Power-up boxes
    for (let p of powerUps) {
        let remaining = Math.max(0, 10 - (Date.now() - p.born) / 1000);
        let alpha = remaining < 2 ? 0.3 + 0.7 * (remaining / 2) : 1;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;

        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 18, p.y - 18, 36, 36);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x - 18, p.y - 18, 36, 36);

        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText(p.label, p.x, p.y + 4);
        ctx.restore();
    }

    // Paddles
    drawRacket(player.x, player.y, player.w, player.h, "right");
    drawRacket(cpu.x, cpu.y, cpu.w, cpu.h, "left");

    // Ball (user-selected color)
    ctx.fillStyle = ballColor;
    ctx.beginPath();
    ctx.arc(ball.x + ball.w / 2, ball.y + ball.h / 2, ball.w / 2, 0, Math.PI * 2);
    ctx.fill();

    // Game Over
    if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = playerScore >= WIN_SCORE ? "#00FF00" : "#FF4444";
        ctx.font = "bold 36px 'Courier New'";
        ctx.textAlign = "center";
        let winner = playerScore >= WIN_SCORE ? "YOU WIN!" : "CPU WINS!";
        ctx.fillText(winner, WIDTH / 2, HEIGHT / 2 - 15);
        ctx.fillStyle = "#aaa";
        ctx.font = "18px 'Courier New'";
        ctx.fillText(`Final: ${playerScore} - ${cpuScore}`, WIDTH / 2, HEIGHT / 2 + 25);
        ctx.fillText("Refresh to play again", WIDTH / 2, HEIGHT / 2 + 55);
    }

    // Pause overlay
    if (paused && !gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 36px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", WIDTH / 2, HEIGHT / 2 - 10);
        ctx.fillStyle = "#fff";
        ctx.font = "16px 'Courier New'";
        ctx.fillText("Press T to resume", WIDTH / 2, HEIGHT / 2 + 30);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
