// ========== Canvas Setup ==========
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = 800, H = 500;

// ========== Constants ==========
const PADDLE_W_BASE = 14;
const PADDLE_H_BASE = 80;
const PADDLE_SPEED = 4.5;
const BALL_R = 8;
const INITIAL_SPEED_BASE = 2.5;
const SPEED_INCR = 0.08;
const MAX_SPEED_BASE = 5.5;
const WIN_SCORE_DEFAULT = 7;
const PADDLE_MARGIN = 30;

// Difficulty ball speed multipliers
const DIFF_SPEED = { easy: 1.0, medium: 1.25, hard: 1.5 };

// ========== Settings ==========
let settings = {
    volume: 0.7,
    speedMult: 1.0,
    paddleScale: 1.0,
    winScore: WIN_SCORE_DEFAULT,
    soundOn: true,
    bgmOn: true,
    particlesOn: true,
};

let PADDLE_W = PADDLE_W_BASE;
let PADDLE_H = PADDLE_H_BASE;
let INITIAL_SPEED = INITIAL_SPEED_BASE;
let MAX_SPEED = MAX_SPEED_BASE;
let WIN_SCORE = WIN_SCORE_DEFAULT;

function applySettings() {
    PADDLE_W = Math.round(PADDLE_W_BASE * settings.paddleScale);
    PADDLE_H = Math.round(PADDLE_H_BASE * settings.paddleScale);
    INITIAL_SPEED = INITIAL_SPEED_BASE * settings.speedMult;
    MAX_SPEED = MAX_SPEED_BASE * settings.speedMult;
    WIN_SCORE = settings.winScore;
    // Update paddle x positions
    p1.x = PADDLE_MARGIN;
    p2.x = W - PADDLE_MARGIN - PADDLE_W;
    // Clamp paddles
    p1.y = Math.min(p1.y, H - PADDLE_H);
    p2.y = Math.min(p2.y, H - PADDLE_H);
}

// ========== Audio System ==========
let audioCtx = null;
let bgmPlaying = false;
let bgmNodes = [];
let bgmGain = null;

function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

// --- Realistic meow helper: frequency curve + vibrato + harmonics ---
function meowVoice(now, dest, vol, freqStart, freqMid, freqEnd, duration) {
    const ctx = getAudioCtx();
    const half = duration * 0.4;
    // Vibrato LFO
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(5.5 + Math.random() * 2, now);
    lfoGain.gain.setValueAtTime(8, now);
    lfo.connect(lfoGain);

    // Main voice: sawtooth through bandpass for realistic timbre
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    lfoGain.connect(osc.frequency);
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(freqMid, now + half);
    osc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.Q.setValueAtTime(1.2, now);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(vol * 0.55, now + 0.02);
    g.gain.setValueAtTime(vol * 0.55, now + half * 0.7);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(filter);
    filter.connect(g);
    g.connect(dest);
    osc.start(now);
    osc.stop(now + duration + 0.02);
    lfo.start(now);
    lfo.stop(now + duration + 0.02);

    // Sub harmonic for body
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'triangle';
    lfoGain.connect(osc2.frequency);
    osc2.frequency.setValueAtTime(freqStart * 0.5, now);
    osc2.frequency.exponentialRampToValueAtTime(freqMid * 0.5, now + half);
    osc2.frequency.exponentialRampToValueAtTime(freqEnd * 0.5, now + duration);
    g2.gain.setValueAtTime(0, now);
    g2.gain.linearRampToValueAtTime(vol * 0.25, now + 0.03);
    g2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.9);
    osc2.connect(g2);
    g2.connect(dest);
    osc2.start(now);
    osc2.stop(now + duration + 0.02);
}

function playSound(type) {
    if (!settings.soundOn) return;
    try {
        const ctx = getAudioCtx();
        const now = ctx.currentTime;
        const vol = settings.volume * 0.55;
        const master = ctx.createGain();
        master.gain.setValueAtTime(vol, now);
        master.connect(ctx.destination);

        switch (type) {
            case 'paddle': {
                // Short playful mew (like "mew!")
                meowVoice(now, master, vol, 720, 560, 380, 0.18);
                break;
            }
            case 'wall': {
                // Soft plink (unchanged)
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(660, now);
                osc.frequency.exponentialRampToValueAtTime(440, now + 0.06);
                g.gain.setValueAtTime(vol * 0.3, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.connect(g); g.connect(master);
                osc.start(now); osc.stop(now + 0.1);
                break;
            }
            case 'score': {
                // Curious rising meow ("mrrrow?")
                meowVoice(now, master, vol * 1.2, 480, 620, 750, 0.32);
                break;
            }
            case 'victory': {
                // Happy multiple meows celebration
                meowVoice(now, master, vol, 520, 700, 900, 0.25);
                meowVoice(now + 0.2, master, vol * 0.9, 580, 760, 980, 0.25);
                meowVoice(now + 0.4, master, vol * 1.1, 650, 850, 1100, 0.35);
                // Final long proud meow
                meowVoice(now + 0.7, master, vol * 0.8, 700, 950, 1200, 0.5);
                break;
            }
            case 'defeat': {
                // Sad low meow
                meowVoice(now, master, vol * 0.7, 500, 350, 200, 0.55);
                meowVoice(now + 0.25, master, vol * 0.4, 380, 250, 130, 0.5);
                break;
            }
            case 'countdown': {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523, now);
                g.gain.setValueAtTime(vol * 0.3, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.connect(g); g.connect(master);
                osc.start(now); osc.stop(now + 0.12);
                break;
            }
            case 'go': {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(784, now);
                osc.frequency.exponentialRampToValueAtTime(1047, now + 0.18);
                g.gain.setValueAtTime(vol * 0.35, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.connect(g); g.connect(master);
                osc.start(now); osc.stop(now + 0.25);
                break;
            }
        }
    } catch (e) {
        // Audio not available, silently ignore
    }
}

// ========== Background Music ==========
function startBGM() {
    if (!settings.soundOn || !settings.bgmOn) return;
    if (bgmPlaying) return;
    try {
        const ctx = getAudioCtx();
        const vol = settings.volume * 0.12;
        bgmGain = ctx.createGain();
        bgmGain.gain.setValueAtTime(vol, ctx.currentTime);
        bgmGain.connect(ctx.destination);
        bgmPlaying = true;
        scheduleBGMLoop(ctx, bgmGain, vol);
    } catch (e) { /* ignore */ }
}

function stopBGM() {
    bgmPlaying = false;
    bgmNodes.forEach(n => { try { n.stop(); } catch (e) { /* */ } });
    bgmNodes = [];
    if (bgmGain) {
        try { bgmGain.disconnect(); } catch (e) { /* */ }
        bgmGain = null;
    }
}

// Cheerful melody in C major (chiptune style)
const BGM_NOTES = [
    // Intro phrase
    { f: 523, d: 0.25 }, { f: 659, d: 0.25 }, { f: 784, d: 0.25 }, { f: 659, d: 0.25 },
    { f: 523, d: 0.5 }, { f: 0, d: 0.25 }, { f: 392, d: 0.25 }, { f: 523, d: 0.25 },
    { f: 659, d: 0.25 }, { f: 784, d: 0.5 }, { f: 880, d: 0.25 }, { f: 784, d: 0.25 },
    { f: 659, d: 0.5 }, { f: 523, d: 0.25 }, { f: 587, d: 0.25 }, { f: 659, d: 0.25 },
    // Variation
    { f: 784, d: 0.25 }, { f: 659, d: 0.25 }, { f: 523, d: 0.25 }, { f: 784, d: 0.25 },
    { f: 880, d: 0.5 }, { f: 0, d: 0.25 }, { f: 784, d: 0.25 }, { f: 659, d: 0.25 },
    { f: 523, d: 0.25 }, { f: 587, d: 0.25 }, { f: 659, d: 0.5 }, { f: 523, d: 0.25 },
    { f: 440, d: 0.25 }, { f: 523, d: 0.5 }, { f: 0, d: 0.5 },
];

const BGM_BASS = [
    { f: 131, d: 1 }, { f: 165, d: 1 }, { f: 196, d: 1 }, { f: 165, d: 1 },
    { f: 131, d: 1 }, { f: 165, d: 1 }, { f: 196, d: 0.5 }, { f: 220, d: 0.5 },
    { f: 196, d: 1 }, { f: 165, d: 0.5 }, { f: 147, d: 0.5 }, { f: 131, d: 1 },
    { f: 165, d: 1 }, { f: 196, d: 1 }, { f: 147, d: 0.5 }, { f: 165, d: 0.5 },
    { f: 131, d: 1.5 }, { f: 0, d: 0.5 },
];

function scheduleBGMLoop(ctx, dest, vol) {
    if (!bgmPlaying) return;
    const now = ctx.currentTime;
    const beatDuration = 0.28; // ~107 BPM, cheerful tempo
    const loopLength = BGM_NOTES.reduce((s, n) => s + n.d, 0) * beatDuration;

    function scheduleNotes(noteArray, oscType, volMult, detune) {
        let t = now;
        for (let note of noteArray) {
            const dur = note.d * beatDuration;
            if (note.f > 0) {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = oscType;
                osc.frequency.setValueAtTime(note.f, t);
                if (detune) osc.detune.setValueAtTime(detune, t);
                const envDur = Math.min(dur * 0.85, 0.25);
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(vol * volMult, t + 0.02);
                g.gain.setValueAtTime(vol * volMult, t + envDur * 0.6);
                g.gain.exponentialRampToValueAtTime(0.001, t + envDur);
                osc.connect(g); g.connect(dest);
                osc.start(t); osc.stop(t + envDur + 0.02);
                bgmNodes.push(osc);
            }
            t += dur;
        }
        return t;
    }

    // Lead melody (triangle)
    scheduleNotes(BGM_NOTES, 'triangle', 0.7, 2);
    // Harmony (sine, offset)
    scheduleNotes(BGM_NOTES.map(n => ({ f: n.f > 0 ? n.f * 1.5 : 0, d: n.d })), 'sine', 0.2, -2);
    // Bass (square, -1 octave)
    scheduleNotes(BGM_BASS, 'square', 0.35, 0);

    // Clean up old nodes
    bgmNodes = bgmNodes.filter(n => {
        try { return n.context && n.playbackState !== 'finished'; } catch (e) { return false; }
    });

    // Schedule next loop
    const scheduleTime = (loopLength * 1000) - 100;
    setTimeout(() => scheduleBGMLoop(ctx, dest, vol), Math.max(scheduleTime, 500));
}

// ========== Game State ==========
let state = 'MENU'; // MENU | COUNTDOWN | PLAYING | PAUSED | GAMEOVER
let mode = '2P';    // 2P | AI
let difficulty = 'medium';
let gameTime = 0;
let frameCount = 0;

// Paddles
let p1 = { x: PADDLE_MARGIN, y: H / 2 - PADDLE_H / 2, vy: 0 };
let p2 = { x: W - PADDLE_MARGIN - PADDLE_W, y: H / 2 - PADDLE_H / 2, vy: 0 };

// Ball
let ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, speed: INITIAL_SPEED };
let ballActive = false;
let ballHitCount = 0;
let ballScored = false;

// Scores
let score1 = 0, score2 = 0;

// Keys
let keys = {};

// Particles & decorations
let particles = [];
let floatingStars = [];
let confetti = [];

// Countdown
let countdownValue = 3;
let countdownTimer = 0;

// Score pop animation
let scorePop1 = 0, scorePop2 = 0;

// ========== Cat Paw Drawing ==========
function drawCatPaw(x, y, w, h, color, facingRight) {
    ctx.save();
    const cx = x + w / 2;
    const cy = y + h / 2;
    const padR = w * 0.9; // main pad radius
    const toeR = padR * 0.45;
    const offsetY = h * 0.3;

    // Main pad
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, cy + offsetY, padR, padR * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3 toe beans on the facing side
    const toeSide = facingRight ? 1 : -1;
    const toeBaseX = cx + toeSide * padR * 0.4;
    for (let i = -1; i <= 1; i++) {
        const tx = toeBaseX + i * toeR * 0.5;
        const ty = cy - offsetY * 0.5 + i * toeR * 0.6;
        ctx.beginPath();
        ctx.arc(tx, ty, toeR, 0, Math.PI * 2);
        ctx.fill();
    }

    // Lighter pad center (pink pad detail)
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(cx, cy + offsetY, padR * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawCatPaws() {
    drawCatPaw(p1.x, p1.y, PADDLE_W + 6, PADDLE_H, '#f8a4c8', true);
    drawCatPaw(p2.x - 6, p2.y, PADDLE_W + 6, PADDLE_H, '#a4c8f8', false);
}

// ========== Yarn Ball Drawing ==========
function drawYarnBall(x, y, r, squish) {
    ctx.save();
    const sx = squish ? 0.85 : 1;
    const sy = squish ? 1.15 : 1;
    ctx.translate(x, y);
    ctx.scale(sx, sy);

    // Base circle
    const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.3, r * 0.1, 0, 0, r);
    grad.addColorStop(0, '#ffe0b2');
    grad.addColorStop(0.5, '#ffcc80');
    grad.addColorStop(1, '#f0a040');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Yarn texture lines
    ctx.strokeStyle = 'rgba(200,130,60,0.4)';
    ctx.lineWidth = 1;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3);
        ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
        ctx.stroke();
    }
    // Cross lines
    ctx.strokeStyle = 'rgba(200,130,60,0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
    ctx.stroke();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(-r * 0.25, -r * 0.25, r * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// ========== Background ==========
function drawBackground() {
    // Base
    ctx.fillStyle = '#e8f5e9';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(180,200,180,0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Center line (dashed)
    ctx.strokeStyle = '#e8d5d5';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 12]);
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    ctx.setLineDash([]);

    // Top / bottom borders
    ctx.fillStyle = '#f0e8d8';
    ctx.fillRect(0, 0, W, 3);
    ctx.fillRect(0, H - 3, W, 3);

    // Floating decorations
    for (let s of floatingStars) {
        ctx.globalAlpha = s.alpha;
        ctx.font = `${s.size}px serif`;
        ctx.fillText(s.char, s.x, s.y);
    }
    ctx.globalAlpha = 1;
}

// ========== Particles ==========
function spawnParticles(x, y, color) {
    if (!settings.particlesOn) return;
    const chars = ['★','✦','♥','·','✧','♦','●'];
    for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 30 + Math.random() * 20,
            maxLife: 50,
            char: chars[Math.floor(Math.random() * chars.length)],
            color: color || ['#f8a4c8','#a4c8f8','#ffcc80','#b8e0b8','#e8c8f0'][Math.floor(Math.random() * 5)],
            size: 8 + Math.random() * 10,
        });
    }
}

function spawnConfetti() {
    if (!settings.particlesOn) return;
    const colors = ['#f8a4c8','#a4c8f8','#ffcc80','#b8e0b8','#e8c8f0','#ffb8b8','#b8d8f8'];
    const chars = ['★','♥','✦','✿','●','♦','⭐'];
    for (let i = 0; i < 40; i++) {
        confetti.push({
            x: Math.random() * W,
            y: -20 - Math.random() * 100,
            vy: 1.5 + Math.random() * 2.5,
            vx: (Math.random() - 0.5) * 2,
            life: 80 + Math.random() * 60,
            maxLife: 140,
            char: chars[Math.floor(Math.random() * chars.length)],
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 10 + Math.random() * 16,
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 6,
        });
    }
}

function updateParticles() {
    for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life--;
    }
    particles = particles.filter(p => p.life > 0);

    for (let c of confetti) {
        c.x += c.vx;
        c.y += c.vy;
        c.rotation += c.rotSpeed;
        c.life--;
    }
    confetti = confetti.filter(c => c.life > 0);
}

function drawParticles() {
    for (let p of particles) {
        const alpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.font = `${p.size}px serif`;
        ctx.fillText(p.char, p.x, p.y);
    }

    for (let c of confetti) {
        const alpha = c.life / c.maxLife;
        ctx.fillStyle = c.color;
        ctx.globalAlpha = alpha;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation * Math.PI / 180);
        ctx.font = `${c.size}px serif`;
        ctx.fillText(c.char, 0, 0);
        ctx.restore();
    }
    ctx.globalAlpha = 1;
}

// ========== Floating Decorations ==========
function initFloatingStars() {
    floatingStars = [];
    const chars = ['⭐','✦','✧','·','✿','●'];
    for (let i = 0; i < 15; i++) {
        floatingStars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            size: 6 + Math.random() * 10,
            char: chars[Math.floor(Math.random() * chars.length)],
            alpha: 0.08 + Math.random() * 0.1,
            float: Math.random() * Math.PI * 2,
            speed: 0.2 + Math.random() * 0.4,
        });
    }
}

function updateFloatingStars() {
    for (let s of floatingStars) {
        s.float += s.speed * 0.02;
        s.y += Math.sin(s.float) * 0.3;
        s.alpha = 0.06 + Math.sin(s.float) * 0.04 + 0.04;
    }
}

// ========== Reset Ball ==========
function resetBall(direction) {
    ball.x = W / 2;
    ball.y = H / 2;
    const diffMult = DIFF_SPEED[difficulty] || 1.0;
    ball.speed = INITIAL_SPEED * diffMult;
    ballHitCount = 0;
    ballScored = false;
    const angle = (Math.random() * 0.8 - 0.4); // -0.4 to 0.4 rad (~ ±23°)
    ball.vx = direction * ball.speed * Math.cos(angle);
    ball.vy = ball.speed * Math.sin(angle);
}

function resetGame() {
    applySettings();
    p1.y = H / 2 - PADDLE_H / 2;
    p2.y = H / 2 - PADDLE_H / 2;
    score1 = 0;
    score2 = 0;
    gameTime = 0;
    frameCount = 0;
    ballHitCount = 0;
    ballScored = false;
    aiMemoryY = [];
    particles = [];
    confetti = [];
    scorePop1 = 0;
    scorePop2 = 0;
    updateHUD();
}

// ========== Ball Squish ==========
let ballSquish = 0;

// ========== Update ==========
function update() {
    if (state !== 'PLAYING') return;
    frameCount++;
    gameTime = Math.floor(frameCount / 60);

    // Score pop decay
    if (scorePop1 > 0) scorePop1--;
    if (scorePop2 > 0) scorePop2--;

    // Ball squish decay
    if (ballSquish > 0) ballSquish = Math.max(0, ballSquish - 0.1);

    // ---- Move Paddles ----
    // Player 1 (W/S)
    if (keys['KeyW']) p1.vy = -PADDLE_SPEED;
    else if (keys['KeyS']) p1.vy = PADDLE_SPEED;
    else p1.vy *= 0.7;

    p1.y += p1.vy;
    p1.y = Math.max(0, Math.min(H - PADDLE_H, p1.y));

    // Player 2 (↑/↓ or AI)
    if (mode === '2P') {
        if (keys['ArrowUp']) p2.vy = -PADDLE_SPEED;
        else if (keys['ArrowDown']) p2.vy = PADDLE_SPEED;
        else p2.vy *= 0.7;
    } else {
        // AI
        updateAI();
    }
    p2.y += p2.vy;
    p2.y = Math.max(0, Math.min(H - PADDLE_H, p2.y));

    // ---- Move Ball ----
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Wall bounce (top/bottom)
    if (ball.y - BALL_R <= 0) {
        ball.y = BALL_R;
        ball.vy = Math.abs(ball.vy);
        playSound('wall');
        spawnParticles(ball.x, ball.y, '#b8e0b8');
    }
    if (ball.y + BALL_R >= H) {
        ball.y = H - BALL_R;
        ball.vy = -Math.abs(ball.vy);
        playSound('wall');
        spawnParticles(ball.x, ball.y, '#b8e0b8');
    }

    // Paddle collision
    checkPaddleCollision(p1, 1);
    checkPaddleCollision(p2, -1);

    // Score (ball out of bounds)
    if (ball.x + BALL_R < 0 && !ballScored) {
        ballScored = true;
        score2++;
        playSound('score');
        spawnParticles(0, ball.y, '#f8a4c8');
        ball.vx = 0; ball.vy = 0;
        if (score2 >= WIN_SCORE) {
            endGame(2);
        } else {
            scorePop2 = 30;
            updateHUD();
            setTimeout(() => resetBall(1), 1200);
        }
    }
    if (ball.x - BALL_R > W && !ballScored) {
        ballScored = true;
        score1++;
        playSound('score');
        spawnParticles(W, ball.y, '#a4c8f8');
        ball.vx = 0; ball.vy = 0;
        if (score1 >= WIN_SCORE) {
            endGame(1);
        } else {
            scorePop1 = 30;
            updateHUD();
            setTimeout(() => resetBall(-1), 1200);
        }
    }

    updateParticles();
    updateFloatingStars();
    updateHUD();
}

function checkPaddleCollision(paddle, dir) {
    const pCenterY = paddle.y + PADDLE_H / 2;
    const pRight = paddle.x + PADDLE_W;
    const pLeft = paddle.x;

    // Check if ball is at paddle x-range
    if (dir === 1) {
        // Left paddle
        if (ball.x - BALL_R > pRight || ball.x - BALL_R > pRight + 4) return;
        if (ball.vx > 0) return;
        if (ball.x - BALL_R > pRight && ball.x + BALL_R > pLeft) {
            // Hit
        } else if (ball.x - BALL_R < pLeft) return;
    } else {
        // Right paddle
        if (ball.x + BALL_R < pLeft) return;
        if (ball.vx < 0) return;
    }

    // Y check
    if (ball.y + BALL_R < paddle.y || ball.y - BALL_R > paddle.y + PADDLE_H) return;

    // Hit! Calculate angle
    const hitPos = (ball.y - paddle.y) / PADDLE_H; // 0 to 1
    const angle = (hitPos - 0.5) * Math.PI / 2; // -45° to +45°
    ball.speed = Math.min(MAX_SPEED, ball.speed + SPEED_INCR);
    ball.vx = dir * ball.speed * Math.cos(angle);
    ball.vy = ball.speed * Math.sin(angle);

    // Push ball outside paddle
    if (dir === 1) ball.x = pRight + BALL_R;
    else ball.x = pLeft - BALL_R;

    ballHitCount++;
    ballSquish = 1;
    playSound('paddle');
    spawnParticles(ball.x, ball.y);
    updateHUD();
}

// ========== AI ==========
let aiMemoryY = []; // ring buffer for delayed ball tracking (easy/medium)

function updateAI() {
    const pCenter = p2.y + PADDLE_H / 2;

    // Store ball Y in memory ring (used for delay in easy/medium)
    aiMemoryY.push(ball.y);
    if (aiMemoryY.length > 45) aiMemoryY.shift();

    let targetY = ball.y;
    let reactionSpeed = PADDLE_SPEED;
    let smoothFactor = 8; // higher = snappier response
    let errorChance = 0;
    let onlyDefend = false;

    switch (difficulty) {
        case 'easy':
            reactionSpeed = PADDLE_SPEED * 0.35;
            smoothFactor = 3;
            errorChance = 0.12;
            // 400ms reaction delay: use ball Y from ~24 frames ago
            const delayIdx = Math.max(0, aiMemoryY.length - 24);
            targetY = aiMemoryY[delayIdx] || ball.y;
            // Only move when ball is approaching AI side
            if (ball.vx < 0 || ball.x < W * 0.3) targetY = H / 2;
            break;
        case 'medium':
            reactionSpeed = PADDLE_SPEED * 0.6;
            smoothFactor = 5;
            errorChance = 0.05;
            // 150ms reaction delay
            const medDelay = Math.max(0, aiMemoryY.length - 9);
            targetY = aiMemoryY[medDelay] || ball.y;
            // Start tracking when ball crosses center
            if (ball.vx < 0 && ball.x < W * 0.4) targetY = H / 2;
            break;
        case 'hard':
            reactionSpeed = PADDLE_SPEED * 1.08;
            smoothFactor = 10;
            errorChance = 0;
            // Predict trajectory
            if (ball.vx > 0) {
                let predictX = ball.x;
                let predictY = ball.y;
                let pvx = ball.vx, pvy = ball.vy;
                while (predictX < p2.x - 10) {
                    predictX += pvx;
                    predictY += pvy;
                    if (predictY <= BALL_R || predictY >= H - BALL_R) pvy = -pvy;
                }
                targetY = predictY;
            }
            break;
    }

    // Random positioning error (easy/medium)
    if (Math.random() < errorChance) {
        targetY += (Math.random() - 0.5) * PADDLE_H * 3;
    }

    // Smooth proportional movement
    const diff = (targetY - pCenter) / PADDLE_H;
    const deadZone = 0.015;
    if (Math.abs(diff) < deadZone) {
        p2.vy = 0;
    } else {
        p2.vy = Math.sign(diff) * Math.min(reactionSpeed, Math.abs(diff) * reactionSpeed * smoothFactor);
    }
}

// ========== Game Flow ==========
function startCountdown() {
    state = 'COUNTDOWN';
    countdownValue = 3;
    countdownTimer = 0;
    stopBGM();
    document.getElementById('overlay-countdown').style.display = 'flex';
    document.getElementById('overlay-menu').style.display = 'none';
    document.getElementById('overlay-pause').style.display = 'none';
    document.getElementById('overlay-gameover').style.display = 'none';

    function tick() {
        if (state !== 'COUNTDOWN') return;
        const el = document.getElementById('countdown-number');
        if (countdownValue > 0) {
            el.textContent = countdownValue;
            el.style.animation = 'none';
            void el.offsetWidth;
            el.style.animation = 'countPulse 0.9s ease-in-out';
            playSound('countdown');
            countdownValue--;
            setTimeout(tick, 900);
        } else {
            el.textContent = 'GO!';
            el.style.animation = 'none';
            void el.offsetWidth;
            el.style.animation = 'countPulse 0.9s ease-in-out';
            playSound('go');
            setTimeout(() => {
                document.getElementById('overlay-countdown').style.display = 'none';
                state = 'PLAYING';
                resetBall(Math.random() > 0.5 ? 1 : -1);
                startBGM();
            }, 700);
        }
    }
    tick();
}

function startGame(m, diff) {
    mode = m;
    if (diff) difficulty = diff;
    resetGame();
    document.getElementById('score1').textContent = '0';
    document.getElementById('score2').textContent = '0';
    if (mode === 'AI') {
        document.querySelector('.hud-right .hud-icon').textContent = '🤖';
        document.querySelector('.hud-right .hud-label').textContent = 'AI';
    } else {
        document.querySelector('.hud-right .hud-icon').textContent = '🫐';
        document.querySelector('.hud-right .hud-label').textContent = 'Player 2';
    }
    startCountdown();
}

function endGame(winner) {
    state = 'GAMEOVER';
    ball.vx = 0; ball.vy = 0;
    stopBGM();
    playSound(winner === 1 ? 'victory' : 'defeat');
    const mins = Math.floor(gameTime / 60);
    const secs = gameTime % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    document.getElementById('overlay-gameover').style.display = 'flex';
    document.getElementById('winner-cat').textContent = winner === 1 ? '🍓' : mode === 'AI' ? '🤖' : '🫐';
    document.getElementById('winner-text').textContent =
        mode === 'AI' ? (winner === 1 ? '你赢了！' : 'AI 获胜！') :
        `Player ${winner} 获胜！`;
    document.getElementById('fs1').textContent = score1;
    document.getElementById('fs2').textContent = score2;
    document.getElementById('game-time').textContent = `用时 ${timeStr}`;

    if (winner === 1) {
        document.getElementById('winner-text').style.color = '#e8a0b8';
    } else {
        document.getElementById('winner-text').style.color = '#90b8e0';
    }
    spawnConfetti();
    updateHUD();
}

// ========== HUD ==========
function updateHUD() {
    document.getElementById('score1').textContent = score1;
    document.getElementById('score2').textContent = score2;

    const s1 = document.getElementById('score1');
    const s2 = document.getElementById('score2');
    if (scorePop1 > 0) {
        s1.style.transform = `scale(${1 + scorePop1 / 60})`;
    } else {
        s1.style.transform = 'scale(1)';
    }
    if (scorePop2 > 0) {
        s2.style.transform = `scale(${1 + scorePop2 / 60})`;
    } else {
        s2.style.transform = 'scale(1)';
    }
}

function pauseGame() {
    if (state === 'PLAYING') {
        state = 'PAUSED';
        stopBGM();
        document.getElementById('overlay-pause').style.display = 'flex';
    }
}

function resumeGame() {
    if (state === 'PAUSED') {
        state = 'PLAYING';
        startBGM();
        document.getElementById('overlay-pause').style.display = 'none';
    }
}

function goToMenu() {
    state = 'MENU';
    ball.vx = 0; ball.vy = 0;
    stopBGM();
    document.getElementById('overlay-menu').style.display = 'flex';
    document.getElementById('overlay-pause').style.display = 'none';
    document.getElementById('overlay-gameover').style.display = 'none';
    document.getElementById('overlay-countdown').style.display = 'none';
    document.getElementById('difficulty-select').style.display = 'none';
    document.querySelector('.menu-buttons').style.display = 'flex';
    document.getElementById('score1').textContent = '0';
    document.getElementById('score2').textContent = '0';
    particles = [];
    confetti = [];
    scorePop1 = 0; scorePop2 = 0;
}

// ========== Draw ==========
function draw() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();

    // Paddles
    drawCatPaws();

    // Ball
    if (ball.vx !== 0 || ball.vy !== 0 || state === 'MENU') {
        drawYarnBall(ball.x, ball.y, BALL_R, ballSquish > 0);
    }

    drawParticles();

    // Ball shadow
    if (ballSquish > 0) {
        ctx.fillStyle = `rgba(0,0,0,${ballSquish * 0.08})`;
        ctx.beginPath();
        ctx.ellipse(ball.x, ball.y + BALL_R + 2, BALL_R * 0.8, BALL_R * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ========== Event Listeners ==========
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyS','KeyA','KeyD'].includes(e.code)) {
        e.preventDefault();
    }
    if (e.code === 'Space') {
        e.preventDefault();
        if (state === 'PLAYING') pauseGame();
        else if (state === 'PAUSED') resumeGame();
    }
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

// Visibility - auto pause
document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'PLAYING') pauseGame();
});

// Menu buttons
document.getElementById('btn-2p').addEventListener('click', () => startGame('2P'));
document.getElementById('btn-ai').addEventListener('click', () => {
    document.querySelector('.menu-buttons').style.display = 'none';
    document.getElementById('difficulty-select').style.display = 'block';
});
document.getElementById('btn-diff-back').addEventListener('click', () => {
    document.getElementById('difficulty-select').style.display = 'none';
    document.querySelector('.menu-buttons').style.display = 'flex';
});
document.querySelectorAll('.btn-diff').forEach(btn => {
    btn.addEventListener('click', () => startGame('AI', btn.dataset.diff));
});

// Pause / Resume / Restart
document.getElementById('btn-pause').addEventListener('click', () => {
    if (state === 'PLAYING') pauseGame();
});
document.getElementById('btn-restart').addEventListener('click', () => {
    resetGame();
    updateHUD();
    startCountdown();
});
document.getElementById('btn-resume').addEventListener('click', resumeGame);
document.getElementById('btn-quit').addEventListener('click', goToMenu);
document.getElementById('btn-replay').addEventListener('click', () => {
    resetGame();
    updateHUD();
    startCountdown();
});
document.getElementById('btn-menu').addEventListener('click', goToMenu);

// ========== Settings Panel ==========
const settingsOverlay = document.getElementById('overlay-settings');
let settingsPrevState = null;

function openSettings() {
    settingsPrevState = state;
    if (state === 'PLAYING') pauseGame();
    settingsOverlay.style.display = 'flex';
    // Sync UI
    document.getElementById('set-volume').value = Math.round(settings.volume * 100);
    document.getElementById('vol-val').textContent = Math.round(settings.volume * 100) + '%';
    document.getElementById('set-speed').value = Math.round(settings.speedMult * 100);
    document.getElementById('spd-val').textContent = settings.speedMult.toFixed(1) + 'x';
    document.getElementById('set-paddle').value = Math.round(settings.paddleScale * 100);
    document.getElementById('pad-val').textContent = Math.round(settings.paddleScale * 100) + '%';
    document.getElementById('set-winscore').value = settings.winScore;
    document.getElementById('win-val').textContent = settings.winScore;
    updateToggleBtn('set-sound', settings.soundOn);
    updateToggleBtn('set-bgm', settings.bgmOn);
    updateToggleBtn('set-particles', settings.particlesOn);
}

function closeSettings() {
    settingsOverlay.style.display = 'none';
    if (settingsPrevState === 'PAUSED' && state === 'PAUSED') {
        // stay paused
    } else if (settingsPrevState === 'PLAYING' && state === 'PAUSED') {
        // was auto-paused, resume
    }
}

function updateToggleBtn(id, on) {
    const btn = document.getElementById(id);
    btn.textContent = on ? 'ON' : 'OFF';
    btn.className = 'toggle-btn ' + (on ? 'on' : 'off');
}

document.getElementById('btn-settings').addEventListener('click', openSettings);
document.getElementById('btn-close-settings').addEventListener('click', closeSettings);

// Volume slider
document.getElementById('set-volume').addEventListener('input', (e) => {
    settings.volume = e.target.value / 100;
    document.getElementById('vol-val').textContent = Math.round(settings.volume * 100) + '%';
});
// Speed slider
document.getElementById('set-speed').addEventListener('input', (e) => {
    settings.speedMult = e.target.value / 100;
    document.getElementById('spd-val').textContent = settings.speedMult.toFixed(1) + 'x';
});
// Paddle size slider
document.getElementById('set-paddle').addEventListener('input', (e) => {
    settings.paddleScale = e.target.value / 100;
    document.getElementById('pad-val').textContent = Math.round(settings.paddleScale * 100) + '%';
});
// Win score slider
document.getElementById('set-winscore').addEventListener('input', (e) => {
    settings.winScore = parseInt(e.target.value);
    document.getElementById('win-val').textContent = settings.winScore;
});
// Sound toggle
document.getElementById('set-sound').addEventListener('click', () => {
    settings.soundOn = !settings.soundOn;
    updateToggleBtn('set-sound', settings.soundOn);
    if (settings.soundOn) playSound('countdown'); // preview beep
});
// BGM toggle
document.getElementById('set-bgm').addEventListener('click', () => {
    settings.bgmOn = !settings.bgmOn;
    updateToggleBtn('set-bgm', settings.bgmOn);
    if (settings.bgmOn) {
        if (state === 'PLAYING') startBGM();
    } else {
        stopBGM();
    }
});
// Particles toggle
document.getElementById('set-particles').addEventListener('click', () => {
    settings.particlesOn = !settings.particlesOn;
    updateToggleBtn('set-particles', settings.particlesOn);
});
// Reset defaults
document.getElementById('btn-reset-defaults').addEventListener('click', () => {
    settings = {
        volume: 0.7,
        speedMult: 1.0,
        paddleScale: 1.0,
        winScore: WIN_SCORE_DEFAULT,
        soundOn: true,
        bgmOn: true,
        particlesOn: true,
    };
    document.getElementById('set-volume').value = 70;
    document.getElementById('vol-val').textContent = '70%';
    document.getElementById('set-speed').value = 100;
    document.getElementById('spd-val').textContent = '1.0x';
    document.getElementById('set-paddle').value = 100;
    document.getElementById('pad-val').textContent = '100%';
    document.getElementById('set-winscore').value = WIN_SCORE_DEFAULT;
    document.getElementById('win-val').textContent = WIN_SCORE_DEFAULT;
    updateToggleBtn('set-sound', true);
    updateToggleBtn('set-bgm', true);
    updateToggleBtn('set-particles', true);
});

// ========== Game Loop ==========
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ========== Init ==========
initFloatingStars();
ball.x = W / 2; ball.y = H / 2;
ball.vx = 0; ball.vy = 0;
gameLoop();
