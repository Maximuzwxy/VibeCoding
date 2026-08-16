// ==================== AUDIO ENGINE ====================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let musicOn = true, sfxOn = true;
let musicGain, musicOsc1, musicOsc2, musicInterval;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
}

function playSfx(freq, type, duration, vol) {
  if (!sfxOn || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol || 0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playTagSound() {
  playSfx(800, 'square', 0.1, 0.2);
  setTimeout(function () { playSfx(400, 'square', 0.1, 0.2); }, 100);
}

function playCountdownBeep() { playSfx(660, 'sine', 0.15, 0.1); }

function playGameOverSound() {
  playSfx(200, 'sawtooth', 0.5, 0.2);
  setTimeout(function () { playSfx(150, 'sawtooth', 0.4, 0.2); }, 200);
  setTimeout(function () { playSfx(100, 'sawtooth', 0.3, 0.3); }, 400);
}

function startMusic() {
  if (!audioCtx || !musicOn) return;
  stopMusic();
  musicGain = audioCtx.createGain();
  musicGain.gain.value = 0.06;
  musicGain.connect(audioCtx.destination);
  musicOsc1 = audioCtx.createOscillator();
  musicOsc1.type = 'sine';
  musicOsc1.frequency.value = 220;
  musicOsc1.connect(musicGain);
  musicOsc1.start();
  musicOsc2 = audioCtx.createOscillator();
  musicOsc2.type = 'triangle';
  musicOsc2.frequency.value = 330;
  const g2 = audioCtx.createGain();
  g2.gain.value = 0.5;
  musicOsc2.connect(g2);
  g2.connect(musicGain);
  musicOsc2.start();
  musicInterval = setInterval(function () {
    if (musicOsc1) musicOsc1.frequency.value = 220 + Math.sin(Date.now() / 3000) * 10;
    if (musicOsc2) musicOsc2.frequency.value = 330 + Math.cos(Date.now() / 4000) * 15;
  }, 200);
}

function stopMusic() {
  if (musicInterval) clearInterval(musicInterval);
  try { if (musicOsc1) musicOsc1.stop(); if (musicOsc2) musicOsc2.stop(); } catch (e) { }
  musicOsc1 = null; musicOsc2 = null;
}

// ==================== DOM REFS ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = 960, H = 540;
const GRAVITY = 0.6, FRICTION = 0.85;

const settingsBtn = document.getElementById('settingsBtn');
const countdownEl = document.getElementById('countdown');
const hudEl = document.getElementById('hud');
const taggerLabel = document.getElementById('taggerLabel');
const timerDisplay = document.getElementById('timerDisplay');
const gameOverEl = document.getElementById('gameOver');
const gameOverTitle = document.getElementById('gameOverTitle');
const gameOverMsg = document.getElementById('gameOverMsg');
const bodyEl = document.getElementById('bodyEl');

// Menu panels
const menuMain = document.getElementById('menuMain');
const menuMode = document.getElementById('menuMode');
const menuMap = document.getElementById('menuMap');
const menuTime = document.getElementById('menuTime');
const menuSettings = document.getElementById('menuSettings');
const mapButtons = document.getElementById('mapButtons');
const toggleLight = document.getElementById('toggleLight');
const toggleMusicEl = document.getElementById('toggleMusic');
const toggleSfx = document.getElementById('toggleSfx');

// ==================== GAME STATE ====================
let gameState = 'menu';
let playerCount = 2, aiMode = false;
let selectedMap = 0, gameTime = 60;
let players = [], platforms = [], mapTheme = {};
let timeLeft = 0, timerInterval;
let countdownValue = 0;
let keys = {};

// ==================== MAP DEFINITIONS ====================
const maps = [
  {
    name: 'Forest',
    bgTop: '#87CEEB', bgBot: '#228B22',
    platTop: '#5a3a1a', platBot: '#3a2510', platStroke: 'rgba(0,0,0,0.3)',
    platforms: [
      { x: 0, y: 500, w: 960, h: 40 }, { x: 40, y: 420, w: 150, h: 16 },
      { x: 250, y: 370, w: 180, h: 16 }, { x: 500, y: 340, w: 140, h: 16 },
      { x: 700, y: 400, w: 200, h: 16 }, { x: 350, y: 250, w: 120, h: 16 },
      { x: 100, y: 300, w: 100, h: 16 }, { x: 600, y: 220, w: 160, h: 16 },
      { x: 800, y: 300, w: 100, h: 16 }, { x: 0, y: 200, w: 80, h: 16 }
    ],
    playerStart: [{ x: 80, y: 460 }, { x: 450, y: 300 }, { x: 750, y: 360 }]
  },
  {
    name: 'Desert',
    bgTop: '#F4A460', bgBot: '#D2691E',
    platTop: '#c4956a', platBot: '#a07040', platStroke: 'rgba(0,0,0,0.3)',
    platforms: [
      { x: 0, y: 500, w: 960, h: 40 }, { x: 50, y: 430, w: 200, h: 16 },
      { x: 320, y: 380, w: 150, h: 16 }, { x: 550, y: 430, w: 180, h: 16 },
      { x: 780, y: 360, w: 140, h: 16 }, { x: 150, y: 310, w: 120, h: 16 },
      { x: 420, y: 270, w: 160, h: 16 }, { x: 680, y: 300, w: 100, h: 16 },
      { x: 30, y: 230, w: 100, h: 16 }, { x: 860, y: 250, w: 80, h: 16 }
    ],
    playerStart: [{ x: 100, y: 460 }, { x: 400, y: 340 }, { x: 800, y: 320 }]
  },
  {
    name: 'City',
    bgTop: '#2c3e50', bgBot: '#34495e',
    platTop: '#7f8c8d', platBot: '#5a6268', platStroke: 'rgba(0,0,0,0.3)',
    platforms: [
      { x: 0, y: 500, w: 960, h: 40 }, { x: 30, y: 440, w: 100, h: 16 },
      { x: 180, y: 400, w: 90, h: 16 }, { x: 320, y: 440, w: 100, h: 16 },
      { x: 470, y: 380, w: 90, h: 16 }, { x: 610, y: 440, w: 100, h: 16 },
      { x: 760, y: 390, w: 90, h: 16 }, { x: 100, y: 320, w: 120, h: 16 },
      { x: 350, y: 300, w: 110, h: 16 }, { x: 600, y: 310, w: 130, h: 16 },
      { x: 850, y: 280, w: 90, h: 16 }, { x: 200, y: 230, w: 100, h: 16 }
    ],
    playerStart: [{ x: 60, y: 460 }, { x: 350, y: 400 }, { x: 650, y: 400 }]
  },
  {
    name: 'Ice Cave',
    bgTop: '#1a3a5c', bgBot: '#0d2137',
    platTop: '#a0d8ef', platBot: '#70b8d8', platStroke: 'rgba(200,230,255,0.4)',
    platforms: [
      { x: 0, y: 500, w: 960, h: 40 }, { x: 60, y: 410, w: 130, h: 16 },
      { x: 240, y: 440, w: 150, h: 16 }, { x: 450, y: 380, w: 120, h: 16 },
      { x: 630, y: 430, w: 160, h: 16 }, { x: 830, y: 370, w: 100, h: 16 },
      { x: 120, y: 320, w: 100, h: 16 }, { x: 300, y: 290, w: 140, h: 16 },
      { x: 520, y: 310, w: 110, h: 16 }, { x: 720, y: 270, w: 100, h: 16 },
      { x: 880, y: 230, w: 60, h: 16 }, { x: 30, y: 240, w: 80, h: 16 }
    ],
    playerStart: [{ x: 80, y: 460 }, { x: 500, y: 340 }, { x: 850, y: 330 }]
  },
  {
    name: 'Space',
    bgTop: '#0a0a1a', bgBot: '#0a0a1a',
    platTop: '#6c3483', platBot: '#4a235a', platStroke: 'rgba(180,100,255,0.4)',
    platforms: [
      { x: 0, y: 500, w: 960, h: 40 }, { x: 80, y: 430, w: 120, h: 14 },
      { x: 280, y: 450, w: 100, h: 14 }, { x: 450, y: 400, w: 100, h: 14 },
      { x: 620, y: 440, w: 120, h: 14 }, { x: 800, y: 380, w: 100, h: 14 },
      { x: 150, y: 340, w: 90, h: 14 }, { x: 350, y: 310, w: 110, h: 14 },
      { x: 550, y: 330, w: 90, h: 14 }, { x: 720, y: 280, w: 100, h: 14 },
      { x: 880, y: 310, w: 60, h: 14 }, { x: 30, y: 260, w: 70, h: 14 }
    ],
    playerStart: [{ x: 100, y: 460 }, { x: 500, y: 360 }, { x: 820, y: 340 }]
  }
];

// ==================== PLAYER CLASS ====================
function Player(id, x, y, color, name, skinType) {
  this.id = id;
  this.x = x;
  this.y = y;
  this.w = 28;
  this.h = 38;
  this.vx = 0;
  this.vy = 0;
  this.color = color;
  this.name = name;
  this.skinType = skinType;
  this.isTagger = false;
  this.cooldown = 0;
  this.tagCooldown = 0;
  this.onGround = false;
  this.facingRight = true;
}

// ==================== SKINS ====================
// Each player gets a unique skin with different visual accessories
const playerSkins = {
  three: [
    { color: '#e74c3c', name: 'P1', type: 'warrior' },   // Red - spiky hair
    { color: '#3498db', name: 'P2', type: 'ninja' },      // Blue - headband
    { color: '#2ecc71', name: 'P3', type: 'robot' }       // Green - antenna
  ],
  two: [
    { color: '#e74c3c', name: 'P1', type: 'warrior' },
    { color: '#3498db', name: 'P2', type: 'ninja' }
  ],
  ai: [
    { color: '#e74c3c', name: 'You', type: 'warrior' },
    { color: '#f39c12', name: 'AI', type: 'alien' }       // Orange - alien eyes
  ]
};

function getPlayerConfigs() {
  if (playerCount === 3) return playerSkins.three;
  if (aiMode) return playerSkins.ai;
  return playerSkins.two;
}

// ==================== MAP RENDERING ====================
function drawMapBackground() {
  const t = mapTheme;
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, t.bgTop);
  grad.addColorStop(1, t.bgBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Map-specific decorations
  if (selectedMap === 0) {
    ctx.fillStyle = '#1a5c1a';
    [50, 200, 400, 600, 800].forEach(function (x) {
      ctx.fillRect(x - 8, 420, 16, 80);
      ctx.beginPath(); ctx.arc(x, 400, 30, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x - 15, 420, 25, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 15, 420, 25, 0, Math.PI * 2); ctx.fill();
    });
  } else if (selectedMap === 1) {
    ctx.fillStyle = '#c4956a';
    [0, 300, 600].forEach(function (x) {
      ctx.beginPath(); ctx.arc(x + 100, 510, 80, Math.PI, 0); ctx.fill();
    });
  } else if (selectedMap === 2) {
    ctx.fillStyle = '#f1c40f';
    [60, 120, 200, 280, 360, 440, 520, 600, 680, 760, 840].forEach(function (x) {
      if ((x > 200 && x < 400) || (x > 550 && x < 700)) return;
      ctx.fillRect(x + 5, 440, 10, 12);
      ctx.fillRect(x + 20, 440, 10, 12);
    });
  } else if (selectedMap === 3) {
    ctx.fillStyle = 'rgba(100,200,255,0.3)';
    [100, 350, 600, 850].forEach(function (x) {
      ctx.beginPath(); ctx.moveTo(x, 400); ctx.lineTo(x + 20, 360); ctx.lineTo(x + 40, 400); ctx.fill();
    });
  } else if (selectedMap === 4) {
    ctx.fillStyle = 'white';
    const seed = 42; // fixed seed for stars
    for (let i = 0; i < 60; i++) {
      const sx = ((seed * (i + 1) * 73) % W);
      const sy = ((seed * (i + 1) * 137) % (H * 0.7));
      ctx.globalAlpha = 0.3 + ((i * 7) % 100) / 100 * 0.7;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  // Draw platforms
  platforms.forEach(function (p) {
    const pg = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    pg.addColorStop(0, t.platTop);
    pg.addColorStop(1, t.platBot);
    ctx.fillStyle = pg;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = t.platStroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(p.x, p.y, p.w, 3);
  });
}

// ==================== SKIN RENDERING ====================
function drawPlayerSkin(p) {
  const px = p.x + p.w / 2;
  const py = p.y + p.h / 2;
  const headY = p.y + 8;
  const headR = 12;

  // == BODY ==
  ctx.fillStyle = p.color;
  ctx.fillRect(p.x + 3, p.y + 12, p.w - 6, p.h - 12);

  // Skin-specific accessories
  if (p.skinType === 'warrior') {
    // Spiky hair on top
    ctx.fillStyle = p.color;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(px + i * 6, headY - headR);
      ctx.lineTo(px + i * 6 - 3, headY - headR - 8 - Math.abs(i) * 3);
      ctx.lineTo(px + i * 6 + 3, headY - headR - 8 - Math.abs(i) * 3);
      ctx.fill();
    }
    // Belt
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(p.x + 3, p.y + 22, p.w - 6, 4);
  } else if (p.skinType === 'ninja') {
    // Headband
    ctx.fillStyle = '#fff';
    ctx.fillRect(px - 10, headY - headR - 3, 20, 5);
    const bandEnd = p.facingRight ? px + 12 : px - 12;
    ctx.fillRect(bandEnd, headY - headR - 6, 6, 8);
    // Dark body stripe
    ctx.fillStyle = darkenColor(p.color, 30);
    ctx.fillRect(p.x + 8, p.y + 14, 4, p.h - 16);
  } else if (p.skinType === 'robot') {
    // Antenna
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, headY - headR); ctx.lineTo(px + 4, headY - headR - 10); ctx.stroke();
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath(); ctx.arc(px + 4, headY - headR - 10, 3, 0, Math.PI * 2); ctx.fill();
    // Square body panel
    ctx.fillStyle = '#222';
    ctx.fillRect(p.x + 6, p.y + 16, p.w - 12, 10);
  } else if (p.skinType === 'alien') {
    // Bigger eyes
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(px - 5, headY - 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px + 5, headY - 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(px - 5, headY - 2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px + 5, headY - 2, 3, 0, Math.PI * 2); ctx.fill();
    // Return early for alien (eyes drawn in body context)
    return true; // Signal that eyes were already drawn
  }
  return false;
}

function darkenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - percent);
  const g = Math.max(0, ((num >> 8) & 0x00FF) - percent);
  const b = Math.max(0, (num & 0x0000FF) - percent);
  return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function drawPlayer(p) {
  ctx.save();
  const px = p.x + p.w / 2;
  const py = p.y + p.h / 2;
  const headY = p.y + 8;
  const headR = 12;

  // Cooldown transparency (being tagged protection)
  if (p.cooldown > 0) {
    ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.2;
  }

  // Tag cooldown — tagger flashes red tint
  if (p.tagCooldown > 0) {
    ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 80) * 0.3;
  }

  // == BODY ==
  ctx.fillStyle = p.color;
  ctx.fillRect(p.x + 3, p.y + 12, p.w - 6, p.h - 12);

  // == HEAD ==
  ctx.fillStyle = p.color;
  ctx.beginPath(); ctx.arc(px, headY, headR, 0, Math.PI * 2); ctx.fill();

  // == SKIN-SPECIFIC DETAILS (before eyes so eyes go on top) ==
  const alienEyes = drawPlayerSkin(p);

  // == EYES (unless alien already drew them) ==
  if (!alienEyes) {
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(px - 4, headY - 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px + 4, headY - 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    const eyeDir = p.facingRight ? 1.5 : -1.5;
    ctx.beginPath(); ctx.arc(px - 4 + eyeDir, headY - 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px + 4 + eyeDir, headY - 2, 2, 0, Math.PI * 2); ctx.fill();
  }

  // == Tagger Halo (pulsing ring at feet) ==
  if (p.isTagger) {
    const time = Date.now() / 150;
    // Inner ring
    ctx.globalAlpha = 0.6 + Math.sin(time) * 0.4;
    ctx.strokeStyle = '#ffd740';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(px, p.y + p.h + 2, 16, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Middle ring
    ctx.globalAlpha = 0.4 + Math.sin(time + 1) * 0.35;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(px, p.y + p.h + 2, 20, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Outer ring
    ctx.globalAlpha = 0.2 + Math.sin(time + 2) * 0.2;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(px, p.y + p.h + 2, 24, 9, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Glow dot particles around halo
    ctx.globalAlpha = 0.5 + Math.sin(time * 1.5) * 0.3;
    for (let i = 0; i < 6; i++) {
      const angle = (time * 0.8 + i * Math.PI / 3) % (Math.PI * 2);
      const rx = 22;
      const ry = 8;
      ctx.fillStyle = '#ffd740';
      ctx.beginPath();
      ctx.arc(px + Math.cos(angle) * rx, p.y + p.h + 2 + Math.sin(angle) * ry, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // == NAME LABEL ==
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'white';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(p.name, px, p.y - 10);
  if (p.isTagger) {
    ctx.fillStyle = '#ffd740';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('IT!', px, p.y - 24);
  }

  ctx.restore();
}

// ==================== PHYSICS & COLLISION ====================
function updatePlayer(p) {
  p.vy += GRAVITY;
  p.x += p.vx;
  p.y += p.vy;

  if (p.x < 0) { p.x = 0; p.vx = 0; }
  if (p.x + p.w > W) { p.x = W - p.w; p.vx = 0; }

  if (p.cooldown > 0) p.cooldown -= 1 / 60;
  if (p.tagCooldown > 0) p.tagCooldown -= 1 / 60;

  p.onGround = false;
  platforms.forEach(function (pl) {
    if (p.x + p.w > pl.x && p.x < pl.x + pl.w) {
      if (p.vy >= 0 && p.y + p.h >= pl.y && p.y + p.h <= pl.y + pl.h + 15) {
        p.y = pl.y - p.h;
        p.vy = 0;
        p.onGround = true;
      }
      if (p.vy < 0 && p.y <= pl.y + pl.h && p.y >= pl.y) {
        p.y = pl.y + pl.h;
        p.vy = 0;
      }
    }
  });

  if (p.y + p.h > H) { p.y = H - p.h; p.vy = 0; p.onGround = true; }

  if (p.onGround) p.vx *= FRICTION; else p.vx *= 0.95;
  if (Math.abs(p.vx) < 0.1) p.vx = 0;

  if (p.vx > 0.1) p.facingRight = true;
  if (p.vx < -0.1) p.facingRight = false;
}

function checkTag() {
  const tagger = players.find(function (p) { return p.isTagger; });
  if (!tagger) return;
  // Tagger on cooldown — cannot tag anyone yet
  if (tagger.tagCooldown > 0) return;

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    if (p === tagger || p.cooldown > 0) continue;
    // Enlarged hitbox for more generous tagging
    const margin = 6;
    if (p.x - margin < tagger.x + tagger.w + margin && p.x + p.w + margin > tagger.x - margin &&
      p.y - margin < tagger.y + tagger.h + margin && p.y + p.h + margin > tagger.y - margin) {
      // Tag! Transfer halo
      tagger.isTagger = false;
      p.isTagger = true;
      p.tagCooldown = 2; // new tagger cannot tag others for 2 seconds
      playTagSound();
      updateHUD();
      break;
    }
  }
}

// ==================== AI ====================
function aiControl(aiPlayer) {
  const tagger = players.find(function (p) { return p.isTagger; });
  const speed = 3.5;

  if (aiPlayer.isTagger) {
    // Chase nearest non-cooldown player
    let target = null, minDist = Infinity;
    players.forEach(function (p) {
      if (p === aiPlayer || p.cooldown > 0) return;
      const d = Math.abs(p.x - aiPlayer.x) + Math.abs(p.y - aiPlayer.y);
      if (d < minDist) { minDist = d; target = p; }
    });
    if (target) {
      if (target.x < aiPlayer.x - 10) aiPlayer.vx = -speed;
      else if (target.x > aiPlayer.x + 10) aiPlayer.vx = speed;
      if (target.y < aiPlayer.y - 40 && aiPlayer.onGround) aiPlayer.vy = -11;
    }
  } else {
    // Run away from tagger
    if (tagger) {
      if (tagger.x < aiPlayer.x) aiPlayer.vx = speed;
      else aiPlayer.vx = -speed;
      if (tagger.y < aiPlayer.y - 30 && aiPlayer.onGround) aiPlayer.vy = -11;
      if (Math.abs(tagger.x - aiPlayer.x) < 50 && aiPlayer.onGround && Math.random() < 0.1) aiPlayer.vy = -10;
    }
  }
  if (aiPlayer.onGround && Math.random() < 0.02) aiPlayer.vy = -10;
}

// ==================== GAME LOOP ====================
function gameLoop() {
  ctx.clearRect(0, 0, W, H);
  if (gameState === 'playing' || gameState === 'countdown') {
    drawMapBackground();
    for (let i = 0; i < players.length; i++) {
      if (aiMode && players[i].id === 1) aiControl(players[i]);
      updatePlayer(players[i]);
    }
    if (gameState === 'playing') checkTag();
    for (let i = 0; i < players.length; i++) drawPlayer(players[i]);

    // Cooldown countdown display above player
    for (let i = 0; i < players.length; i++) {
      if (players[i].cooldown > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(Math.ceil(players[i].cooldown) + 's', players[i].x + players[i].w / 2, players[i].y - 38);
      }
      if (players[i].tagCooldown > 0) {
        ctx.fillStyle = 'rgba(255,60,60,0.7)';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Wait ' + Math.ceil(players[i].tagCooldown) + 's', players[i].x + players[i].w / 2, players[i].y - 38);
      }
    }
  }
  requestAnimationFrame(gameLoop);
}

// ==================== INPUT ====================
document.addEventListener('keydown', function (e) {
  keys[e.key.toLowerCase()] = true;
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(e.key.toLowerCase()) !== -1) {
    e.preventDefault();
  }
});
document.addEventListener('keyup', function (e) {
  keys[e.key.toLowerCase()] = false;
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(e.key.toLowerCase()) !== -1) {
    e.preventDefault();
  }
});

function handleInput() {
  if (gameState !== 'playing') return;
  const speed = 5, jumpVel = -12;

  // Player 1: W/A/D
  const p1 = players[0];
  if (p1) {
    if (keys['a']) p1.vx = -speed;
    if (keys['d']) p1.vx = speed;
    if (keys['w'] && p1.onGround) p1.vy = jumpVel;
  }

  if (!aiMode) {
    if (playerCount === 3) {
      // P2: Y/G/J
      const p2 = players[1];
      if (p2) {
        if (keys['g']) p2.vx = -speed;
        if (keys['j']) p2.vx = speed;
        if (keys['y'] && p2.onGround) p2.vy = jumpVel;
      }
      // P3: Arrow keys
      const p3 = players[2];
      if (p3) {
        if (keys['arrowleft']) p3.vx = -speed;
        if (keys['arrowright']) p3.vx = speed;
        if (keys['arrowup'] && p3.onGround) p3.vy = jumpVel;
      }
    } else {
      // Two-player P2: Arrow keys
      const p2 = players[1];
      if (p2) {
        if (keys['arrowleft']) p2.vx = -speed;
        if (keys['arrowright']) p2.vx = speed;
        if (keys['arrowup'] && p2.onGround) p2.vy = jumpVel;
      }
    }
  }
}
setInterval(handleInput, 16);

// ==================== MENU FLOW ====================
function hideAllPanels() {
  const panels = document.getElementById('menu').children;
  for (let i = 0; i < panels.length; i++) {
    panels[i].classList.add('hidden');
  }
}

function showPanel(panel) {
  hideAllPanels();
  panel.classList.remove('hidden');
}

// Mode selection
menuMode.addEventListener('click', function (e) {
  if (!e.target.dataset.mode) return;
  const mode = e.target.dataset.mode;
  playerCount = mode === 'pvp3' ? 3 : 2;
  aiMode = mode === 'ai';

  // Build map buttons
  let html = '';
  maps.forEach(function (m, i) {
    html += '<button class="btn" data-map="' + i + '">' + m.name + '</button>';
  });
  mapButtons.innerHTML = html;

  showPanel(menuMap);
});

// Map selection
mapButtons.addEventListener('click', function (e) {
  if (!e.target.dataset.map) return;
  selectedMap = parseInt(e.target.dataset.map);
  showPanel(menuTime);
});

// Time selection
menuTime.addEventListener('click', function (e) {
  if (!e.target.dataset.time) return;
  gameTime = parseInt(e.target.dataset.time);
  startGame();
});

// Play button
document.getElementById('btnPlay').addEventListener('click', function () {
  showPanel(menuMode);
});

// Settings
document.getElementById('btnSettings').addEventListener('click', function () {
  showPanel(menuSettings);
});

// Back buttons
document.getElementById('btnBackMode').addEventListener('click', function () { showPanel(menuMain); });
document.getElementById('btnBackMap').addEventListener('click', function () { showPanel(menuMode); });
document.getElementById('btnBackTime').addEventListener('click', function () { showPanel(menuMap); });
document.getElementById('btnCloseSettings').addEventListener('click', function () { showPanel(menuMain); });

// Play Again
document.getElementById('btnPlayAgain').addEventListener('click', function () {
  gameOverEl.classList.add('hidden');
  gameState = 'menu';
  players = [];
  showPanel(menuMain);
  settingsBtn.style.display = 'none';
  hudEl.style.display = 'none';
});

// Settings button on game screen
settingsBtn.addEventListener('click', function () {
  if (gameState === 'playing') stopGame();
  gameOverEl.classList.add('hidden');
  settingsBtn.style.display = 'none';
  hudEl.style.display = 'none';
  showPanel(menuSettings);
});

// Toggle handlers
toggleLight.addEventListener('change', function () {
  bodyEl.classList.toggle('light', toggleLight.checked);
});

toggleMusicEl.addEventListener('change', function () {
  musicOn = toggleMusicEl.checked;
  if (musicOn) startMusic(); else stopMusic();
});

toggleSfx.addEventListener('change', function () {
  sfxOn = toggleSfx.checked;
});

// ==================== GAME FLOW ====================
function startGame() {
  initAudio();
  if (musicOn) startMusic();
  hideAllPanels();
  settingsBtn.style.display = 'block';
  hudEl.style.display = 'flex';

  timeLeft = gameTime;
  mapTheme = maps[selectedMap];
  platforms = maps[selectedMap].platforms;
  const configs = getPlayerConfigs();
  const starts = maps[selectedMap].playerStart;

  players = [];
  for (let i = 0; i < playerCount; i++) {
    const s = starts[i] || starts[0];
    players.push(new Player(i, s.x, s.y, configs[i].color, configs[i].name, configs[i].type));
  }

  // Random tagger
  const taggerIdx = Math.floor(Math.random() * playerCount);
  players[taggerIdx].isTagger = true;

  // Countdown
  gameState = 'countdown';
  countdownValue = 3;
  countdownEl.style.display = 'block';
  countdownEl.textContent = countdownValue;
  updateHUD();

  const cdInterval = setInterval(function () {
    countdownValue--;
    if (countdownValue > 0) {
      countdownEl.textContent = countdownValue;
      playCountdownBeep();
    } else {
      countdownEl.textContent = 'GO!';
      playSfx(880, 'sine', 0.2, 0.15);
      setTimeout(function () {
        countdownEl.style.display = 'none';
        gameState = 'playing';
        timerInterval = setInterval(function () {
          timeLeft--;
          updateHUD();
          if (timeLeft <= 0) endGame();
        }, 1000);
      }, 500);
      clearInterval(cdInterval);
    }
  }, 800);
}

function updateHUD() {
  timerDisplay.textContent = 'Time: ' + timeLeft + 's';
  const tagger = players.find(function (p) { return p.isTagger; });
  if (tagger) {
    taggerLabel.textContent = tagger.name + ' is IT!';
    taggerLabel.style.background = tagger.color;
    taggerLabel.style.color = '#fff';
  }
}

function endGame() {
  gameState = 'over';
  clearInterval(timerInterval);
  stopMusic();
  playGameOverSound();

  const tagger = players.find(function (p) { return p.isTagger; });
  const loserName = tagger ? tagger.name : 'Nobody';
  gameOverTitle.textContent = "Time's Up!";
  gameOverMsg.innerHTML =
    '<span style="color:' + (tagger ? tagger.color : '#fff') + '">' + loserName + '</span> was the tagger &mdash; <b>' + loserName + ' loses!</b>';
  gameOverEl.classList.remove('hidden');
  settingsBtn.style.display = 'none';
  hudEl.style.display = 'none';
}

function stopGame() {
  gameState = 'menu';
  clearInterval(timerInterval);
  stopMusic();
  players = [];
  countdownValue = 0;
  countdownEl.style.display = 'none';
}

// ==================== INIT ====================
gameLoop();
