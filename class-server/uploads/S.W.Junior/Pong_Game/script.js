const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const WIDTH = 800;
const HEIGHT = 500;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// Paddles
const PADDLE_W = 12;
const PADDLE_H = 80;
const PADDLE_SPEED = 6;

let player = { x: 20, y: HEIGHT / 2 - PADDLE_H / 2, w: PADDLE_W, h: PADDLE_H };
let cpu = { x: WIDTH - 20 - PADDLE_W, y: HEIGHT / 2 - PADDLE_H / 2, w: PADDLE_W, h: PADDLE_H };

// Ball
const BALL_SIZE = 20;
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
let difficulty = null;  // 0=Easy, 1=Normal, 2=Devil
let lastHitter = null;  // "player" or "cpu" — who last hit the ball

// Power-ups
let powerUps = [];
let freezeOpponent = 0;      // timestamp when freeze ends
let autoPlay = 0;            // timestamp when auto-play ends
let speedBoost = 0;          // timestamp when speed boost ends

function spawnPowerUp() {
    if (gameOver || !gameStarted) return;
    let px = WIDTH / 4 + Math.random() * WIDTH / 2;
    let py = HEIGHT / 4 + Math.random() * HEIGHT / 2;
    let maxType = difficulty === 2 ? 4 : 3; // Devil gets gift box too
    let type = Math.floor(Math.random() * maxType);
    let colors = ["#00BFFF", "#FF4500", "#32CD32", "#FF69B4"];
    let labels = ["FREEZE", "SPEED", "AUTO", "GIFT"];
    powerUps.push({ x: px, y: py, type: type, color: colors[type], label: labels[type], born: Date.now() });
}

setInterval(() => {
    if (gameStarted && !gameOver) spawnPowerUp();
}, 5000);

// Remove expired power-ups (older than 10 seconds)
setInterval(() => {
    let now = Date.now();
    powerUps = powerUps.filter(p => now - p.born < 10000);
}, 1000);

document.addEventListener("keydown", e => {
    if (!gameStarted && !gameOver) {
        if (difficulty === null) return; // Must select difficulty first
        gameStarted = true;
        let diffNames = ["EASY", "NORMAL", "DEVIL"];
        let diffColors = ["#32CD32", "#FFD700", "#FF4444"];
        let dd = document.getElementById("diffDisplay");
        dd.textContent = diffNames[difficulty];
        dd.style.color = diffColors[difficulty];
        resetBall();
        return;
    }
    keys[e.key] = true;
});
document.addEventListener("keyup", e => { keys[e.key] = false; });

canvas.addEventListener("click", (e) => {
    if (!gameStarted && !gameOver) {
        if (difficulty === null) {
            // Check difficulty selection clicks
            let rect = canvas.getBoundingClientRect();
            let cx = e.clientX - rect.left;
            let cy = e.clientY - rect.top;
            // Three buttons at y=190, y=250, y=310
            let btnW = 200, btnH = 45;
            let btns = [
                { x: WIDTH / 2 - btnW / 2, y: 190, level: 0 },
                { x: WIDTH / 2 - btnW / 2, y: 250, level: 1 },
                { x: WIDTH / 2 - btnW / 2, y: 310, level: 2 },
            ];
            for (let b of btns) {
                if (cx >= b.x && cx <= b.x + btnW && cy >= b.y && cy <= b.y + btnH) {
                    difficulty = b.level;
                    return;
                }
            }
        } else {
            gameStarted = true;
            let diffNames = ["EASY", "NORMAL", "DEVIL"];
            let diffColors = ["#32CD32", "#FFD700", "#FF4444"];
            let dd = document.getElementById("diffDisplay");
            dd.textContent = diffNames[difficulty];
            dd.style.color = diffColors[difficulty];
            resetBall();
        }
    }
});

function resetBall() {
    ball.x = WIDTH / 2;
    ball.y = HEIGHT / 2;
    ballSpeed = difficulty === 0 ? 4 : difficulty === 2 ? 12 : 5;
    ballVX = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
    ballVY = ballSpeed * (Math.random() * 2 - 1);
    lastHitter = null;
}

function update() {
    if (gameOver || !gameStarted) return;

    // Player movement (W/S)
    if (keys["w"] && player.y > 0) player.y -= PADDLE_SPEED;
    if (keys["s"] && player.y < HEIGHT - player.h) player.y += PADDLE_SPEED;

    // CPU movement (follows ball with some delay, unless frozen)
    if (Date.now() < freezeOpponent) {
        // CPU is frozen - don't move
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

    // Auto-play: AI helps player
    if (Date.now() < autoPlay) {
        let playerCenter = player.y + player.h / 2;
        let playerTarget = ball.y;
        let autoSpeed = 5;
        if (Math.abs(playerCenter - playerTarget) > 8) {
            if (playerCenter < playerTarget && player.y < HEIGHT - player.h) player.y += autoSpeed;
            if (playerCenter > playerTarget && player.y > 0) player.y -= autoSpeed;
        }
    }

    // Speed boost effect
    let speedMultiplier = Date.now() < speedBoost ? 1.8 : 1;
    ball.x += ballVX * speedMultiplier;
    ball.y += ballVY * speedMultiplier;

    // Ball bounce off top/bottom
    if (ball.y <= 0 || ball.y + ball.h >= HEIGHT) {
        ballVY = -ballVY;
    }

    // Ball hits left wall (CPU scores)
    if (ball.x <= 0) {
        cpuScore++;
        document.getElementById("cpuScore").textContent = cpuScore;
        if (cpuScore >= WIN_SCORE) {
            gameOver = true;
            return;
        }
        resetBall();
    }

    // Ball hits right wall (Player scores)
    if (ball.x + ball.w >= WIDTH) {
        playerScore++;
        document.getElementById("playerScore").textContent = playerScore;
        if (playerScore >= WIN_SCORE) {
            gameOver = true;
            return;
        }
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
        let angle = (hitPos - 0.5) * Math.PI / 3; // -60deg to +60deg
        ballSpeed += 0.3;
        ballVX = ballSpeed * Math.cos(angle);
        ballVY = ballSpeed * Math.sin(angle);
        ball.x = player.x + player.w + 1;
        lastHitter = "player";
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
    }

    // Check power-up collision
    let bx = ball.x + ball.w / 2;
    let by = ball.y + ball.h / 2;
    for (let i = powerUps.length - 1; i >= 0; i--) {
        let p = powerUps[i];
        let dx = bx - p.x;
        let dy = by - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < ball.w / 2 + 18) {
            // Activate ability based on type
            let now = Date.now();
            if (p.type === 0) {
                freezeOpponent = now + 3000; // Freeze CPU for 3 seconds
            } else if (p.type === 1) {
                speedBoost = now + 5000; // Speed boost for 5 seconds
            } else if (p.type === 2) {
                autoPlay = now + 5000; // AI auto-plays for 5 seconds
            } else if (p.type === 3) {
                // Gift box: reduces 1 point from the hitter
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

function drawField() {
    // Field outer border (white)
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    ctx.strokeRect(8, 8, WIDTH - 16, HEIGHT - 16);

    // Center area (subtle lighter band)
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fillRect(WIDTH / 2 - 4, 0, 8, HEIGHT);

    // Center line (white, solid)
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, 0);
    ctx.lineTo(WIDTH / 2, HEIGHT);
    ctx.stroke();

    // Center circle (football pitch style)
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(WIDTH / 2, HEIGHT / 2, 50, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(WIDTH / 2, HEIGHT / 2, 4, 0, Math.PI * 2);
    ctx.fill();
}

function drawRacket(x, y, w, h, headSide) {
    let headCX, headCY, headRX, headRY, handleX, handleY, handleW, handleH;

    if (headSide === "right") {
        // Head on the right, handle on the left
        headCX = x + w - 6;
        headCY = y + h / 2;
        headRX = 6;
        headRY = h / 2 - 3;
        handleX = x;
        handleY = y + h / 2 - 3;
        handleW = w - headRX;
        handleH = 6;
    } else {
        // Head on the left, handle on the right
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

    // Grip wrap lines
    ctx.strokeStyle = "#6B3410";
    ctx.lineWidth = 0.5;
    for (let i = 4; i < handleW - 4; i += 4) {
        ctx.beginPath();
        ctx.moveTo(handleX + i, handleY);
        ctx.lineTo(handleX + i + 2, handleY + handleH);
        ctx.stroke();
    }

    // Racket head (outer frame)
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(headCX, headCY, headRX, headRY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner string area
    ctx.fillStyle = "rgba(240, 240, 240, 0.4)";
    ctx.beginPath();
    ctx.ellipse(headCX, headCY, headRX - 2, headRY - 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Strings (grid)
    ctx.strokeStyle = "rgba(200, 200, 200, 0.6)";
    ctx.lineWidth = 0.5;
    let innerRX = headRX - 2;
    let innerRY = headRY - 2;
    // Vertical strings
    for (let i = -3; i <= 3; i++) {
        let sx = headCX + i * (innerRX / 4);
        // Calculate intersection with ellipse
        let maxY = innerRY * Math.sqrt(Math.max(0, 1 - ((i * innerRX / 4) ** 2) / (innerRX ** 2)));
        if (maxY > 0) {
            ctx.beginPath();
            ctx.moveTo(sx, headCY - maxY);
            ctx.lineTo(sx, headCY + maxY);
            ctx.stroke();
        }
    }
    // Horizontal strings
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

    // Field surface (navy blue)
    ctx.fillStyle = "#0A1628";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Start screen
    if (!gameStarted) {
        drawField();
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 42px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText("Pong Game", WIDTH / 2, 70);

        if (difficulty === null) {
            // Difficulty selection
            ctx.fillStyle = "#fff";
            ctx.font = "20px 'Courier New'";
            ctx.fillText("Select Difficulty:", WIDTH / 2, 140);

            let btnW = 200, btnH = 45;
            let btns = [
                { x: WIDTH / 2 - btnW / 2, y: 170, label: "EASY", color: "#32CD32", desc: "Slow CPU, chill vibes" },
                { x: WIDTH / 2 - btnW / 2, y: 230, label: "NORMAL", color: "#FFD700", desc: "Fair fight" },
                { x: WIDTH / 2 - btnW / 2, y: 290, label: "DEVIL", color: "#FF4444", desc: "CPU is ruthless + Gift box" },
            ];
            for (let b of btns) {
                ctx.fillStyle = b.color;
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 2;
                ctx.fillRect(b.x, b.y, btnW, btnH);
                ctx.strokeRect(b.x, b.y, btnW, btnH);

                ctx.fillStyle = "#000";
                ctx.font = "bold 18px 'Courier New'";
                ctx.fillText(b.label, WIDTH / 2, b.y + 28);

                ctx.fillStyle = "#ccc";
                ctx.font = "11px 'Courier New'";
                ctx.fillText(b.desc, WIDTH / 2, b.y + btnH + 16);
            }
        } else {
            // Difficulty selected — show start prompt
            let diffNames = ["EASY", "NORMAL", "DEVIL"];
            let diffColors = ["#32CD32", "#FFD700", "#FF4444"];
            ctx.fillStyle = diffColors[difficulty];
            ctx.font = "bold 28px 'Courier New'";
            ctx.fillText(diffNames[difficulty], WIDTH / 2, HEIGHT / 2 - 70);

            ctx.fillStyle = "#FFD700";
            ctx.font = "bold 36px 'Courier New'";
            ctx.fillText(":)", WIDTH / 2, HEIGHT / 2 - 10);

            ctx.fillStyle = "#fff";
            ctx.font = "18px 'Courier New'";
            ctx.fillText("Press any key or click to start", WIDTH / 2, HEIGHT / 2 + 50);

            ctx.fillStyle = "#aaa";
            ctx.font = "14px 'Courier New'";
            ctx.fillText("W / S to move paddle | First to 7 wins", WIDTH / 2, HEIGHT / 2 + 80);
        }

        return;
    }

    // Field markings
    drawField();

    // Update power status HUD
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

        // Glow
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;

        // Box
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 18, p.y - 18, 36, 36);

        // Border
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x - 18, p.y - 18, 36, 36);

        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText(p.label, p.x, p.y + 4);

        ctx.restore();
    }

    // Player paddle (tennis racket)
    drawRacket(player.x, player.y, player.w, player.h, "right");

    // CPU paddle (tennis racket)
    drawRacket(cpu.x, cpu.y, cpu.w, cpu.h, "left");

    // Ball
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(ball.x + ball.w / 2, ball.y + ball.h / 2, ball.w / 2, 0, Math.PI * 2);
    ctx.fill();

    // Game Over overlay
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
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
