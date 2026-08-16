// ========== DOM 元素 ==========
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");
const btnStart = document.getElementById("btnStart");
const btnPause = document.getElementById("btnPause");
const btnRestart = document.getElementById("btnRestart");

const leftHumanBtn = document.getElementById("leftHuman");
const leftAIBtn = document.getElementById("leftAI");
const rightHumanBtn = document.getElementById("rightHuman");
const rightAIBtn = document.getElementById("rightAI");

const W = canvas.width;
const H = canvas.height;

// ========== 游戏状态 ==========
const STATE = { IDLE: "idle", PLAYING: "playing", PAUSED: "paused" };
let gameState = STATE.IDLE;
let leftMode = "human";
let rightMode = "human";
let scoreLeft = 0;
let scoreRight = 0;

// ========== 球系统 ==========
let ballColor = "#FFF";
let ballSlowdown = 1.0; // 减速倍率（1.0 = 正常）
let roundsSinceLastCross = 0; // 用于回合计数

let balls = []; // 主球 + 分裂球
function createBall(x, y, vx, vy, speed) {
    return { x, y, radius: 8, vx, vy, speed, isSplit: false };
}
function getMainBall() { return balls[0]; }

function resetBall() {
    balls = [];
    let speed = ballBaseSpeed;
    let angle = (Math.random() * Math.PI / 3) - Math.PI / 6;
    let dir = Math.random() < 0.5 ? 1 : -1;
    balls.push(createBall(W / 2, H / 2,
        speed * Math.cos(angle) * dir,
        speed * Math.sin(angle),
        speed));
    ballColor = "#FFF";
    ballSlowdown = 1.0;
    roundsSinceLastCross = 0;
}

// ========== 挡板系统 ==========
let paddleLeft = {
    x: 20, y: H / 2 - 40, w: 12,
    h: 80, baseH: 80,
    speed: 6, aiSpeed: 3.5
};
let paddleRight = {
    x: W - 32, y: H / 2 - 40, w: 12,
    h: 80, baseH: 80,
    speed: 6, aiSpeed: 3.5
};

// ========== Buff 系统 ==========
const BUFF_TYPES = [
    { id: "slowdown",   name: "Slow Down",      color: "#3498DB", rounds: 3 },
    { id: "split",      name: "Split",           color: "#E74C3C", rounds: 0 },    // 0 = permanent
    { id: "colorchange",name: "Color Change",    color: "#F1C40F", rounds: 5 },
    { id: "enlarge",    name: "Enlarge Paddle",  color: "#2ECC71", rounds: 3 },
    { id: "shrink",     name: "Shrink Opponent", color: "#E67E22", rounds: 3 }
];

let buffBlocks = [];       // { x, y, size, typeId, color, side }  side: 'left'|'right'
let leftBuffs = [];        // { typeId, roundsLeft, name, color }
let rightBuffs = [];
let buffSpawnTimer = 0;
let buffSpawnInterval = 200; // 帧间隔（由 settings 控制）
const BUFF_BLOCK_SIZE = 14;

// 可配置参数（通过 Settings 面板修改）
let ballBaseSpeed = 5;
let ballMinSpeed = 3;
let ballMaxSpeed = 10;
let ballSpeedInc = 0.15;
let paddleBaseLength = 80;
let paddleMaxLength = 120;
let paddleMinLength = 40;
let buffSizeMult = 1.6;
let buffFrequency = 3; // 0-5

// 回合追踪：球上次在哪个半场
let lastBallSide = "center";

function spawnBuffBlock() {
    let type = BUFF_TYPES[Math.floor(Math.random() * BUFF_TYPES.length)];
    let side = Math.random() < 0.5 ? "left" : "right";
    let x = side === "left"
        ? 50 + Math.random() * (W / 2 - 100)
        : W / 2 + 50 + Math.random() * (W / 2 - 100);
    let y = 40 + Math.random() * (H - 80);
    buffBlocks.push({ x, y, size: BUFF_BLOCK_SIZE, typeId: type.id, color: type.color, side });
}

// ========== 键盘 ==========
let keys = {};
let animId = null;

// ========== 初始化 ==========
function init() {
    scoreLeft = 0;
    scoreRight = 0;
    paddleLeft.baseH = paddleBaseLength;
    paddleRight.baseH = paddleBaseLength;
    paddleLeft.h = paddleLeft.baseH;
    paddleRight.h = paddleRight.baseH;
    paddleLeft.y = H / 2 - paddleLeft.h / 2;
    paddleRight.y = H / 2 - paddleRight.h / 2;
    buffBlocks = [];
    leftBuffs = [];
    rightBuffs = [];
    buffSpawnTimer = buffSpawnInterval;
    lastBallSide = "center";
    resetBall();
}

// ========== AI 逻辑 ==========
function updateAI(paddle, isLeft) {
    let mainBall = getMainBall();
    if (!mainBall) return;
    let shouldTrack = isLeft ? mainBall.vx < 0 : mainBall.vx > 0;
    let targetY = shouldTrack ? mainBall.y - paddle.h / 2 : H / 2 - paddle.h / 2;
    let diff = targetY - paddle.y;
    let maxMove = paddle.aiSpeed;
    if (Math.abs(diff) < maxMove) {
        paddle.y = targetY;
    } else {
        paddle.y += Math.sign(diff) * maxMove;
    }
    paddle.y = Math.max(0, Math.min(H - paddle.h, paddle.y));
}

// ========== 碰撞检测 ==========
function ballHitsPaddle(ball, paddle) {
    return (
        ball.x - ball.radius < paddle.x + paddle.w &&
        ball.x + ball.radius > paddle.x &&
        ball.y + ball.radius > paddle.y &&
        ball.y - ball.radius < paddle.y + paddle.h
    );
}

function paddleHitsBuffBlock(paddle, block) {
    // 挡板矩形 与 buff块矩形 碰撞
    let px = paddle.x, py = paddle.y, pw = paddle.w, ph = paddle.h;
    let bx = block.x - block.size, by = block.y - block.size, bw = block.size * 2, bh = block.size * 2;
    return !(px + pw < bx || px > bx + bw || py + ph < by || py > by + bh);
}

// ========== Buff 激活 ==========
function activateBuff(side, typeId) {
    let type = BUFF_TYPES.find(t => t.id === typeId);
    if (!type) return;
    let buffEntry = { typeId: type.id, roundsLeft: type.rounds, name: type.name, color: type.color };
    let buffs = side === "left" ? leftBuffs : rightBuffs;
    let opponentSide = side === "left" ? "right" : "left";
    let opponentBuffs = side === "left" ? rightBuffs : leftBuffs;
    let myPaddle = side === "left" ? paddleLeft : paddleRight;
    let oppPaddle = side === "left" ? paddleRight : paddleLeft;

    switch (typeId) {
        case "slowdown":
            ballSlowdown = 0.5;
            // 立即减速所有球
            for (let b of balls) {
                let spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                let ratio = 0.5 / spd;
                b.vx *= ratio; b.vy *= ratio;
            }
            buffs.push(buffEntry);
            break;
        case "split":
            buffs.push(buffEntry);
            break;
        case "colorchange":
            ballColor = "#" + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, "0");
            buffs.push(buffEntry);
            break;
        case "enlarge":
            myPaddle.h = Math.min(myPaddle.baseH * buffSizeMult, paddleMaxLength);
            myPaddle.y = Math.max(0, Math.min(H - myPaddle.h, myPaddle.y));
            buffs.push(buffEntry);
            break;
        case "shrink":
            oppPaddle.h = Math.max(oppPaddle.baseH * (1 / buffSizeMult), paddleMinLength);
            oppPaddle.y = Math.max(0, Math.min(H - oppPaddle.h, oppPaddle.y));
            buffs.push({ ...buffEntry, opponentSide });
            break;
    }
}

// ========== Buff 过期 ==========
function expireBuff(side, buffEntry) {
    let buffs = side === "left" ? leftBuffs : rightBuffs;
    let myPaddle = side === "left" ? paddleLeft : paddleRight;
    let oppPaddle = side === "left" ? paddleRight : paddleLeft;
    let oppBuffs = side === "left" ? rightBuffs : leftBuffs;

    switch (buffEntry.typeId) {
        case "slowdown":
            ballSlowdown = 1.0;
            break;
        case "split":
            // permanent, never expires via rounds
            break;
        case "colorchange":
            ballColor = "#FFF";
            break;
        case "enlarge":
            myPaddle.h = myPaddle.baseH;
            myPaddle.y = Math.max(0, Math.min(H - myPaddle.h, myPaddle.y));
            break;
        case "shrink":
            // opponentSide 是对方，恢复对方挡板
            oppPaddle.h = oppPaddle.baseH;
            oppPaddle.y = Math.max(0, Math.min(H - oppPaddle.h, oppPaddle.y));
            break;
    }
}

// ========== 回合制 Buff 递减 ==========
function processRound() {
    let allBuffs = [
        { arr: leftBuffs, side: "left" },
        { arr: rightBuffs, side: "right" }
    ];
    for (let group of allBuffs) {
        for (let i = group.arr.length - 1; i >= 0; i--) {
            if (group.arr[i].typeId === "split") continue; // permanent
            group.arr[i].roundsLeft--;
            if (group.arr[i].roundsLeft <= 0) {
                expireBuff(group.side, group.arr[i]);
                group.arr.splice(i, 1);
            }
        }
    }
}

// ========== 主更新 ==========
function update() {
    if (gameState !== STATE.PLAYING) return;

    // --- 挡板输入 ---
    if (leftMode === "human") {
        if (keys["w"]) paddleLeft.y -= paddleLeft.speed;
        if (keys["s"]) paddleLeft.y += paddleLeft.speed;
        paddleLeft.y = Math.max(0, Math.min(H - paddleLeft.h, paddleLeft.y));
    } else {
        updateAI(paddleLeft, true);
    }
    if (rightMode === "human") {
        if (keys["arrowup"]) paddleRight.y -= paddleRight.speed;
        if (keys["arrowdown"]) paddleRight.y += paddleRight.speed;
        paddleRight.y = Math.max(0, Math.min(H - paddleRight.h, paddleRight.y));
    } else {
        updateAI(paddleRight, false);
    }

    // 球拍大小控制（持续按住，无延迟）
    if (leftMode === "human") {
        if (keys["b"]) {
            paddleLeft.h += 1.5;
            paddleLeft.y = Math.max(0, Math.min(H - paddleLeft.h, paddleLeft.y));
        }
        if (keys["y"]) {
            paddleLeft.h = Math.max(10, paddleLeft.h - 1.5);
            paddleLeft.y = Math.max(0, Math.min(H - paddleLeft.h, paddleLeft.y));
        }
    }
    if (rightMode === "human") {
        if (keys["x"]) {
            paddleRight.h += 1.5;
            paddleRight.y = Math.max(0, Math.min(H - paddleRight.h, paddleRight.y));
        }
        if (keys["u"]) {
            paddleRight.h = Math.max(10, paddleRight.h - 1.5);
            paddleRight.y = Math.max(0, Math.min(H - paddleRight.h, paddleRight.y));
        }
    }

    // 球大小控制（左6变大/P变小，右8变大/L变小，持续按住无延迟）
    if (leftMode === "human" && keys["6"]) {
        for (let b of balls) b.radius += 0.5;
    }
    if (leftMode === "human" && keys["p"]) {
        for (let b of balls) b.radius = Math.max(2, b.radius - 0.5);
    }
    if (rightMode === "human" && keys["8"]) {
        for (let b of balls) b.radius += 0.5;
    }
    if (rightMode === "human" && keys["l"]) {
        for (let b of balls) b.radius = Math.max(2, b.radius - 0.5);
    }

    // --- Buff 块生成 ---
    if (buffFrequency > 0) {
        buffSpawnTimer--;
        if (buffSpawnTimer <= 0) {
            if (buffBlocks.length < 4) {
                spawnBuffBlock();
            }
            buffSpawnTimer = buffSpawnInterval + Math.floor(Math.random() * 120);
        }
    }

    // --- Buff 块碰撞检测（球碰到 Buff 块）---
    for (let bi = buffBlocks.length - 1; bi >= 0; bi--) {
        let block = buffBlocks[bi];
        for (let b of balls) {
            let dx = b.x - block.x;
            let dy = b.y - block.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < b.radius + block.size) {
                activateBuff(block.side, block.typeId);
                buffBlocks.splice(bi, 1);
                break;
            }
        }
    }

    // --- 球移动 ---
    for (let bi = balls.length - 1; bi >= 0; bi--) {
        let b = balls[bi];
        b.x += b.vx * ballSlowdown;
        b.y += b.vy * ballSlowdown;

        // 碰上下墙
        if (b.y - b.radius <= 0) { b.y = b.radius; b.vy = -b.vy; }
        if (b.y + b.radius >= H) { b.y = H - b.radius; b.vy = -b.vy; }

        // 回合检测（球越过中线）
        let currentSide = b.x < W / 2 ? "left" : "right";
        if (lastBallSide !== "center" && currentSide !== lastBallSide && Math.abs(b.x - W / 2) < 20) {
            processRound();
            lastBallSide = currentSide;
        }

        // 碰左挡板
        if (ballHitsPaddle(b, paddleLeft)) {
            b.x = paddleLeft.x + paddleLeft.w + b.radius;
            hitPaddle(b, paddleLeft, "left");
        }
        // 碰右挡板
        if (ballHitsPaddle(b, paddleRight)) {
            b.x = paddleRight.x - b.radius;
            hitPaddle(b, paddleRight, "right");
        }

        // 出界 → 删除球（分裂球直接移除，主球重置）
        if (b.x - b.radius < -20 || b.x + b.radius > W + 20) {
            if (bi === 0) {
                // 主球出界 → 得分
                if (b.x < 0) scoreRight++; else scoreLeft++;
                resetBall();
                lastBallSide = "center";
            } else {
                // 分裂球出界 → 只删除
                balls.splice(bi, 1);
            }
        }
    }
}

function hitPaddle(b, paddle, side) {
    let hitPos = (b.y - (paddle.y + paddle.h / 2)) / (paddle.h / 2);
    hitPos = Math.max(-1, Math.min(1, hitPos));
    let angle = hitPos * (Math.PI / 3);
    let dir = side === "left" ? 1 : -1;
    let speed = b.speed;
    b.vx = dir * speed * Math.cos(angle);
    b.vy = speed * Math.sin(angle);
    speed = Math.min(speed + ballSpeedInc, ballMaxSpeed);
    speed = Math.max(speed, ballMinSpeed);
    let currentAngle = Math.atan2(b.vy, b.vx);
    b.vx = Math.cos(currentAngle) * speed;
    b.vy = Math.sin(currentAngle) * speed;
    b.speed = speed;

    // 记录半场位置用于回合检测
    lastBallSide = side;

    // Split buff：检查击球方是否有 split buff
    let buffs = side === "left" ? leftBuffs : rightBuffs;
    if (buffs.some(bf => bf.typeId === "split") && !b.isSplit && balls.length < 8) {
        // 生成分裂球
        for (let i = 0; i < 2; i++) {
            let sAngle = angle + (i === 0 ? -0.4 : 0.4);
            let sSpeed = speed * 0.85;
            let nb = createBall(b.x, b.y,
                dir * sSpeed * Math.cos(sAngle),
                sSpeed * Math.sin(sAngle),
                sSpeed);
            nb.isSplit = true;
            nb.radius = 5;
            balls.push(nb);
        }
    }
}

// ========== 绘制 ==========
function draw() {
    ctx.clearRect(0, 0, W, H);

    // 背景
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // 中线
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Buff 块
    for (let block of buffBlocks) {
        ctx.fillStyle = block.color;
        ctx.fillRect(block.x - block.size, block.y - block.size, block.size * 2, block.size * 2);
        ctx.strokeStyle = "#FFF";
        ctx.lineWidth = 2;
        ctx.strokeRect(block.x - block.size, block.y - block.size, block.size * 2, block.size * 2);
        // 图标缩写
        ctx.fillStyle = "#FFF";
        ctx.font = "bold 10px 'Segoe UI'";
        ctx.textAlign = "center";
        let icon = "";
        switch (block.typeId) {
            case "slowdown": icon = "S"; break;
            case "split": icon = "X"; break;
            case "colorchange": icon = "C"; break;
            case "enlarge": icon = "E"; break;
            case "shrink": icon = "R"; break;
        }
        ctx.fillText(icon, block.x, block.y + 4);
        ctx.textAlign = "start";
    }

    // 球
    for (let b of balls) {
        ctx.fillStyle = ballColor;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 左挡板
    ctx.fillStyle = leftMode === "ai" ? "#9B59B6" : "#3498DB";
    ctx.fillRect(paddleLeft.x, paddleLeft.y, paddleLeft.w, paddleLeft.h);
    if (leftMode === "human") {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "bold 9px 'Segoe UI'";
        ctx.textAlign = "left";
        ctx.fillText("B:+ Y:-  6/P:Ball", paddleLeft.x, paddleLeft.y + paddleLeft.h + 12);
    } else {
        ctx.fillStyle = "#FFF";
        ctx.font = "bold 10px 'Segoe UI'";
        ctx.textAlign = "center";
        ctx.fillText("AI", paddleLeft.x + paddleLeft.w / 2, paddleLeft.y - 6);
    }

    // 右挡板
    ctx.fillStyle = rightMode === "ai" ? "#9B59B6" : "#E74C3C";
    ctx.fillRect(paddleRight.x, paddleRight.y, paddleRight.w, paddleRight.h);
    if (rightMode === "human") {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "bold 9px 'Segoe UI'";
        ctx.textAlign = "right";
        ctx.fillText("X:+ U:-  8/L:Ball", paddleRight.x + paddleRight.w, paddleRight.y + paddleRight.h + 12);
    } else {
        ctx.fillStyle = "#FFF";
        ctx.font = "bold 10px 'Segoe UI'";
        ctx.textAlign = "center";
        ctx.fillText("AI", paddleRight.x + paddleRight.w / 2, paddleRight.y - 6);
    }

    // 分数
    ctx.fillStyle = "#FFF";
    ctx.font = "bold 40px 'Segoe UI', monospace";
    ctx.textAlign = "center";
    ctx.fillText(scoreLeft, W / 2 - 60, 60);
    ctx.fillText(scoreRight, W / 2 + 60, 60);

    // --- 下方 Buff 状态显示 ---
    drawBuffStatus(leftBuffs, paddleLeft.x, paddleLeft.y + paddleLeft.h + 6, "left");
    drawBuffStatus(rightBuffs, paddleRight.x, paddleRight.y + paddleRight.h + 6, "right");

    // 暂停覆盖
    if (gameState === STATE.PAUSED) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#FFF";
        ctx.font = "bold 42px 'Segoe UI'";
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", W / 2, H / 2);
        ctx.font = "16px 'Segoe UI'";
        ctx.fillText("Press Space or click Pause to resume", W / 2, H / 2 + 40);
        ctx.textAlign = "start";
    }
}

function drawBuffStatus(buffs, x, y, side) {
    ctx.textAlign = side === "left" ? "left" : "right";
    let startY = y + 14;
    for (let i = 0; i < buffs.length; i++) {
        let bf = buffs[i];
        let ty = startY + i * 16;
        // 小色块
        ctx.fillStyle = bf.color;
        ctx.fillRect(x, ty - 8, 10, 10);
        // 文字
        ctx.fillStyle = bf.color;
        ctx.font = "bold 11px 'Segoe UI'";
        let textX = side === "left" ? x + 14 : x - 14;
        let text = bf.name + (bf.typeId === "split" ? "" : " (" + bf.roundsLeft + ")");
        ctx.fillText(text, textX, ty);
    }
    ctx.textAlign = "start";
}

// ========== 游戏循环 ==========
function gameLoop() {
    update();
    draw();
    animId = requestAnimationFrame(gameLoop);
}

// ========== 控制 ==========
function startGame() {
    startScreen.classList.add("hidden");
    init();
    gameState = STATE.PLAYING;
}
function pauseGame() {
    if (gameState === STATE.PLAYING) {
        gameState = STATE.PAUSED;
        btnPause.textContent = "Resume";
    } else if (gameState === STATE.PAUSED) {
        gameState = STATE.PLAYING;
        btnPause.textContent = "Pause";
    }
}
function restartGame() {
    init();
    gameState = STATE.PLAYING;
    btnPause.textContent = "Pause";
}

// ========== 设置面板 ==========
const settingsOverlay = document.getElementById("settingsOverlay");
const btnSettings = document.getElementById("btnSettings");
const btnSaveSettings = document.getElementById("btnSaveSettings");
const btnCancelSettings = document.getElementById("btnCancelSettings");

// 滑块与值显示
const sliders = {
    buffFreq:       { slider: document.getElementById("setBuffFreq"),       val: document.getElementById("valBuffFreq") },
    ballBaseSpeed:  { slider: document.getElementById("setBallBaseSpeed"),  val: document.getElementById("valBallBaseSpeed") },
    ballMinSpeed:   { slider: document.getElementById("setBallMinSpeed"),   val: document.getElementById("valBallMinSpeed") },
    ballMaxSpeed:   { slider: document.getElementById("setBallMaxSpeed"),   val: document.getElementById("valBallMaxSpeed") },
    ballSpeedInc:   { slider: document.getElementById("setBallSpeedInc"),   val: document.getElementById("valBallSpeedInc") },
    paddleMin:      { slider: document.getElementById("setPaddleMin"),      val: document.getElementById("valPaddleMin") },
    paddleMax:      { slider: document.getElementById("setPaddleMax"),      val: document.getElementById("valPaddleMax") },
    buffMult:       { slider: document.getElementById("setBuffMult"),       val: document.getElementById("valBuffMult") }
};

// 设置前的备份（Cancel 时恢复）
let settingsBackup = {};

function backupSettings() {
    settingsBackup = {
        buffFrequency, ballBaseSpeed, ballMinSpeed, ballMaxSpeed, ballSpeedInc,
        paddleBaseLength, paddleMaxLength, paddleMinLength, buffSizeMult, buffSpawnInterval
    };
    // 更新滑块到当前值
    sliders.buffFreq.slider.value = buffFrequency;
    sliders.buffFreq.val.textContent = buffFrequency;
    sliders.ballBaseSpeed.slider.value = ballBaseSpeed;
    sliders.ballBaseSpeed.val.textContent = ballBaseSpeed;
    sliders.ballMinSpeed.slider.value = ballMinSpeed;
    sliders.ballMinSpeed.val.textContent = ballMinSpeed;
    sliders.ballMaxSpeed.slider.value = ballMaxSpeed;
    sliders.ballMaxSpeed.val.textContent = ballMaxSpeed;
    sliders.ballSpeedInc.slider.value = ballSpeedInc;
    sliders.ballSpeedInc.val.textContent = ballSpeedInc;
    sliders.paddleMin.slider.value = paddleMinLength;
    sliders.paddleMin.val.textContent = paddleMinLength;
    sliders.paddleMax.slider.value = paddleMaxLength;
    sliders.paddleMax.val.textContent = paddleMaxLength;
    sliders.buffMult.slider.value = buffSizeMult;
    sliders.buffMult.val.textContent = buffSizeMult;
}

// 滑块实时联动
Object.values(sliders).forEach(s => {
    s.slider.addEventListener("input", () => {
        s.val.textContent = s.slider.value;
    });
});

function openSettings() {
    let wasPlaying = gameState === STATE.PLAYING;
    if (wasPlaying) {
        gameState = STATE.PAUSED;
        btnPause.textContent = "Resume";
    }
    settingsOverlay._wasPlaying = wasPlaying;
    backupSettings();
    settingsOverlay.classList.add("visible");
}

function applySettings() {
    buffFrequency = parseFloat(sliders.buffFreq.slider.value);
    ballBaseSpeed = parseFloat(sliders.ballBaseSpeed.slider.value);
    ballMinSpeed = parseFloat(sliders.ballMinSpeed.slider.value);
    ballMaxSpeed = parseFloat(sliders.ballMaxSpeed.slider.value);
    ballSpeedInc = parseFloat(sliders.ballSpeedInc.slider.value);
    paddleMinLength = parseInt(sliders.paddleMin.slider.value);
    paddleMaxLength = parseInt(sliders.paddleMax.slider.value);
    buffSizeMult = parseFloat(sliders.buffMult.slider.value);

    // 根据 frequency 重新计算 spawn interval：freq 0→不发，freq 5→最短间隔
    buffSpawnInterval = buffFrequency <= 0 ? 99999 : Math.round(400 / buffFrequency);
}

function saveSettings() {
    applySettings();
    settingsOverlay.classList.remove("visible");
    if (settingsOverlay._wasPlaying) {
        gameState = STATE.PLAYING;
        btnPause.textContent = "Pause";
    }
}

function cancelSettings() {
    buffFrequency = settingsBackup.buffFrequency;
    ballBaseSpeed = settingsBackup.ballBaseSpeed;
    ballMinSpeed = settingsBackup.ballMinSpeed;
    ballMaxSpeed = settingsBackup.ballMaxSpeed;
    ballSpeedInc = settingsBackup.ballSpeedInc;
    paddleBaseLength = settingsBackup.paddleBaseLength;
    paddleMaxLength = settingsBackup.paddleMaxLength;
    paddleMinLength = settingsBackup.paddleMinLength;
    buffSizeMult = settingsBackup.buffSizeMult;
    buffSpawnInterval = settingsBackup.buffSpawnInterval;

    // 恢复滑块显示
    backupSettings();

    settingsOverlay.classList.remove("visible");
    if (settingsOverlay._wasPlaying) {
        gameState = STATE.PLAYING;
        btnPause.textContent = "Pause";
    }
}

btnSettings.addEventListener("click", openSettings);
btnSaveSettings.addEventListener("click", saveSettings);
btnCancelSettings.addEventListener("click", cancelSettings);

// ========== 模式切换 ==========
function setMode(player, mode) {
    if (player === "left") {
        leftMode = mode;
        leftHumanBtn.classList.toggle("active", mode === "human");
        leftAIBtn.classList.toggle("active", mode === "ai");
    } else {
        rightMode = mode;
        rightHumanBtn.classList.toggle("active", mode === "human");
        rightAIBtn.classList.toggle("active", mode === "ai");
    }
}

// ========== 事件监听 ==========
startBtn.addEventListener("click", startGame);
btnStart.addEventListener("click", startGame);
btnPause.addEventListener("click", pauseGame);
btnRestart.addEventListener("click", restartGame);
leftHumanBtn.addEventListener("click", () => setMode("left", "human"));
leftAIBtn.addEventListener("click", () => setMode("left", "ai"));
rightHumanBtn.addEventListener("click", () => setMode("right", "human"));
rightAIBtn.addEventListener("click", () => setMode("right", "ai"));

window.addEventListener("keydown", (e) => {
    let key = e.key.toLowerCase();
    keys[key] = true;
    if (key === " ") {
        e.preventDefault();
        if (gameState === STATE.PLAYING || gameState === STATE.PAUSED) pauseGame();
    }
    if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) e.preventDefault();
});
window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

// ========== 启动 ==========
init();
gameLoop();
