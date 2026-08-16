// ==================== SOUND ENGINE ====================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.musicOn = true;
    this.sfxOn = true;
    this.musicPlaying = false;
  }
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  playTone(freq, dur, type, vol) {
    if (!this.sfxOn || !this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + dur);
  }
  paddleHit() { this.playTone(440, 0.1, 'square', 0.15); }
  wallHit()   { this.playTone(220, 0.08, 'triangle', 0.1); }
  score()     { this.playTone(660, 0.3, 'sine', 0.12); setTimeout(() => this.playTone(880, 0.3, 'sine', 0.12), 150); }
  gameOver()  { this.playTone(330, 0.4, 'sawtooth', 0.1); setTimeout(() => this.playTone(220, 0.6, 'sawtooth', 0.1), 400); }
  startMusic() {
    if (!this.musicOn || !this.ctx || this.musicPlaying) return;
    this.musicPlaying = true;
    this.playMusicLoop();
  }
  playMusicLoop() {
    if (!this.musicPlaying || !this.musicOn) return;
    const notes = [261, 293, 329, 349, 392, 349, 329, 293];
    const now = this.ctx.currentTime;
    let t = 0;
    for (let i = 0; i < notes.length; i++) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine'; o.frequency.value = notes[i];
      g.gain.setValueAtTime(0.06, now + t);
      g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.25);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(now + t); o.stop(now + t + 0.25);
      t += 0.25;
    }
    setTimeout(() => this.playMusicLoop(), t * 1000);
  }
  stopMusic() { this.musicPlaying = false; }
}

const sound = new SoundEngine();

// ==================== PADDLE DESIGNS ====================
const PADDLE_DESIGNS = [
  { name: 'Classic', draw(ctx, w, h) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); } },
  { name: 'Neon', draw(ctx, w, h) { ctx.fillStyle = '#00ff88'; ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 15; ctx.fillRect(2, 2, w-4, h-4); ctx.shadowBlur = 0; } },
  { name: 'Diamond', draw(ctx, w, h) { ctx.fillStyle = '#ff69b4'; ctx.beginPath(); ctx.moveTo(w/2,0); ctx.lineTo(w,h/2); ctx.lineTo(w/2,h); ctx.lineTo(0,h/2); ctx.closePath(); ctx.fill(); } },
  { name: 'Round', draw(ctx, w, h) { ctx.fillStyle = '#ffaa00'; const r = h/2; ctx.beginPath(); ctx.moveTo(r,0); ctx.lineTo(w-r,0); ctx.arcTo(w,0,w,r,r); ctx.lineTo(w,h-r); ctx.arcTo(w,h,w-r,h,r); ctx.lineTo(r,h); ctx.arcTo(0,h,0,h-r,r); ctx.lineTo(0,r); ctx.arcTo(0,0,r,0,r); ctx.closePath(); ctx.fill(); } },
  { name: 'Flame', draw(ctx, w, h) { ctx.fillStyle = '#ff4500'; ctx.beginPath(); ctx.moveTo(0,h); for(let i=0;i<=w;i+=4) ctx.lineTo(i, h-Math.abs(Math.sin(i*0.3))*h*0.6); ctx.lineTo(w,h); ctx.closePath(); ctx.fill(); } },
  { name: 'Crystal', draw(ctx, w, h) { ctx.fillStyle = 'rgba(100,180,255,0.6)'; ctx.fillRect(0,0,w,h); ctx.strokeStyle = 'rgba(200,230,255,0.9)'; ctx.lineWidth = 2; ctx.strokeRect(0,0,w,h); } },
  { name: 'Metal', draw(ctx, w, h) { const g = ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#c0c0c0'); g.addColorStop(0.5,'#808080'); g.addColorStop(1,'#606060'); ctx.fillStyle = g; ctx.fillRect(0,0,w,h); } },
  { name: 'Wood', draw(ctx, w, h) { ctx.fillStyle = '#8B4513'; ctx.fillRect(0,0,w,h); ctx.strokeStyle = '#5c3317'; ctx.lineWidth = 0.5; for(let y=4;y<h;y+=6) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y+(Math.random()-0.5)*2); ctx.stroke(); } } },
  { name: 'Lightning', draw(ctx, w, h) { ctx.fillStyle = '#ffff00'; ctx.strokeStyle = '#ffff00'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w*0.3,0); ctx.lineTo(w*0.5,h*0.35); ctx.lineTo(w*0.35,h*0.35); ctx.lineTo(w*0.7,h*0.7); ctx.lineTo(w*0.5,h*0.7); ctx.lineTo(w*0.7,h); ctx.stroke(); } },
  { name: 'Pixel', draw(ctx, w, h) { ctx.fillStyle = '#00ffcc'; const pw=6; for(let px=0;px<w;px+=pw) for(let py=0;py<h;py+=pw) if(Math.random()>0.2) ctx.fillRect(px,py,pw-1,pw-1); } }
];

// ==================== GAME STATE ====================
const $ = (id) => document.getElementById(id);

let gameMode = null;
let aiDifficulty = 1;
let perspective = null;
let p1Paddle = 0, p2Paddle = 0;
let paddleStep = 1;

const CW = 800, CH = 500;
let p1Y, p2Y;
let ballX, ballY, ballVX, ballVY;
let p1Score = 0, p2Score = 0;
const WIN_SCORE = 7;

const PADDLE_H = 80, PADDLE_W = 14, BALL_SIZE = 12;

let canvasW = 800, canvasH = 500;
let gameRunning = false, gamePaused = false;

// ==================== NAVIGATION ====================
function show(id) { $(id).classList.remove('hidden'); }
function hide(id) { $(id).classList.add('hidden'); }

// ==================== INPUT ====================
const keys = {};
window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; e.preventDefault(); });
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; e.preventDefault(); });

// ==================== MAIN MENU ====================
$('btn-ai').onclick = () => {
  sound.init();
  hide('menu');
  show('difficulty-screen');
  document.querySelectorAll('.star-btn').forEach(b => b.classList.remove('selected'));
};

$('btn-pvp').onclick = () => {
  sound.init();
  gameMode = 'pvp';
  perspective = 'first';
  paddleStep = 1;
  $('paddle-title').textContent = 'Player 1 - Choose Your Paddle';
  $('btn-paddle-confirm').disabled = true;
  hide('menu');
  buildPaddleGrid();
  show('paddle-screen');
};

$('btn-settings-main').onclick = () => show('settings-screen');

// ==================== DIFFICULTY SCREEN ====================
document.querySelectorAll('.star-btn').forEach(btn => {
  btn.onclick = () => {
    aiDifficulty = parseInt(btn.dataset.level);
    document.querySelectorAll('.star-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    setTimeout(() => {
      hide('difficulty-screen');
      show('perspective-screen');
    }, 300);
  };
});

$('btn-diff-back').onclick = () => { hide('difficulty-screen'); show('menu'); };

// ==================== PERSPECTIVE SCREEN ====================
$('btn-first').onclick = () => {
  gameMode = 'ai';
  perspective = 'first';
  paddleStep = 1;
  $('paddle-title').textContent = 'Choose Your Paddle';
  $('btn-paddle-confirm').disabled = true;
  hide('perspective-screen');
  buildPaddleGrid();
  show('paddle-screen');
};

$('btn-third').onclick = () => {
  gameMode = 'ai';
  perspective = 'third';
  paddleStep = 1;
  $('paddle-title').textContent = 'Choose Your Paddle';
  $('btn-paddle-confirm').disabled = true;
  hide('perspective-screen');
  buildPaddleGrid();
  show('paddle-screen');
};

$('btn-persp-back').onclick = () => { hide('perspective-screen'); show('difficulty-screen'); };

// ==================== PADDLE SELECT ====================
function buildPaddleGrid() {
  $('paddle-grid').innerHTML = '';
  PADDLE_DESIGNS.forEach((d, i) => {
    const card = document.createElement('div');
    card.className = 'paddle-card';
    const cvs = document.createElement('canvas');
    cvs.width = 100; cvs.height = 40;
    d.draw(cvs.getContext('2d'), 100, 40);
    card.appendChild(cvs);
    const name = document.createElement('span');
    name.className = 'paddle-name';
    name.textContent = d.name;
    card.appendChild(name);
    card.onclick = () => {
      document.querySelectorAll('.paddle-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      if (paddleStep === 1) { p1Paddle = i; }
      else { p2Paddle = i; }
      $('btn-paddle-confirm').disabled = false;
    };
    $('paddle-grid').appendChild(card);
  });
}

$('btn-paddle-confirm').onclick = () => {
  if ($('btn-paddle-confirm').disabled) return;
  if (gameMode === 'pvp' && paddleStep === 1) {
    paddleStep = 2;
    $('paddle-title').textContent = 'Player 2 - Choose Your Paddle';
    $('btn-paddle-confirm').disabled = true;
    document.querySelectorAll('.paddle-card').forEach(c => c.classList.remove('selected'));
    return;
  }
  hide('paddle-screen');
  startGame();
};

$('btn-paddle-back').onclick = () => {
  hide('paddle-screen');
  if (gameMode === 'ai') show('perspective-screen');
  else show('menu');
};

// ==================== SETTINGS ====================
$('toggle-music').onchange = () => {
  sound.musicOn = $('toggle-music').checked;
  if (!sound.musicOn) sound.stopMusic();
  else if (gameRunning) sound.startMusic();
};

$('toggle-sfx').onchange = () => { sound.sfxOn = $('toggle-sfx').checked; };
$('btn-settings-close').onclick = () => hide('settings-screen');
$('btn-settings-game').onclick = () => show('settings-screen');

// ==================== GAME LOGIC ====================
function randBallSpeed() {
  const base = 8 + aiDifficulty * 1;
  const angle = (Math.random() * Math.PI / 3) - Math.PI / 6;
  const dir = Math.random() > 0.5 ? 1 : -1;
  return { vx: Math.cos(angle) * base * dir, vy: Math.sin(angle) * base };
}

function resetBall() {
  ballX = CW / 2; ballY = CH / 2;
  const sp = randBallSpeed();
  ballVX = sp.vx; ballVY = sp.vy;
}

function resetPositions() {
  p1Y = CH / 2 - PADDLE_H / 2;
  p2Y = CH / 2 - PADDLE_H / 2;
  resetBall();
}

function startGame() {
  p1Score = 0; p2Score = 0;
  updateScore();
  resetPositions();
  show('game-screen');
  if (sound.musicOn) sound.startMusic();
  gameRunning = true; gamePaused = false;
  requestAnimationFrame(gameLoop);
}

function updateScore() {
  $('score-p1').textContent = p1Score;
  $('score-p2').textContent = p2Score;
}

function checkWin() {
  if (p1Score >= WIN_SCORE || p2Score >= WIN_SCORE) {
    gameRunning = false;
    sound.stopMusic();
    sound.gameOver();
    const winner = p1Score >= WIN_SCORE ? 'Player 1' : (gameMode === 'ai' ? 'AI' : 'Player 2');
    $('game-over-title').textContent = winner + ' Wins!';
    $('game-over-score').textContent = p1Score + ' - ' + p2Score;
    show('game-over-screen');
  }
}

// ==================== AI ====================
function aiMove() {
  const reactSpeed = 0.03 + aiDifficulty * 0.015;
  const error = (6 - aiDifficulty) * 15;
  const targetY = ballY - PADDLE_H / 2 + (Math.random() - 0.5) * error;
  const diff = targetY - p2Y;
  const maxSpeed = 8 + aiDifficulty * 3;
  p2Y += Math.max(-maxSpeed, Math.min(maxSpeed, diff * reactSpeed));
  p2Y = Math.max(0, Math.min(CH - PADDLE_H, p2Y));
}

// ==================== RENDERING ====================
function drawPaddle(c, idx, x, y, w, h) {
  c.save(); c.translate(x, y);
  PADDLE_DESIGNS[idx].draw(c, w, h);
  c.restore();
}

function drawClassic(c) {
  c.fillStyle = '#0a0a2e'; c.fillRect(0, 0, CW, CH);
  c.setLineDash([8, 12]); c.strokeStyle = 'rgba(255,255,255,0.2)';
  c.lineWidth = 2; c.beginPath(); c.moveTo(CW/2, 0); c.lineTo(CW/2, CH); c.stroke();
  c.setLineDash([]);
  c.fillStyle = '#fff'; c.shadowColor = '#fff'; c.shadowBlur = 8;
  c.beginPath(); c.arc(ballX, ballY, BALL_SIZE/2, 0, Math.PI*2); c.fill();
  c.shadowBlur = 0;
  drawPaddle(c, p1Paddle, 10, p1Y, PADDLE_W, PADDLE_H);
  drawPaddle(c, p2Paddle, CW-10-PADDLE_W, p2Y, PADDLE_W, PADDLE_H);
}

function drawFirstPerson(c, isP1) {
  const py = isP1 ? p1Y : p2Y;
  const pp = isP1 ? p1Paddle : p2Paddle;
  const op = isP1 ? p2Paddle : p1Paddle;

  let depth, hp;
  if (isP1) { depth = ballX / CW; hp = ballY / CH; }
  else { depth = (CW - ballX) / CW; hp = ballY / CH; }

  const g = c.createLinearGradient(0, CH, 0, 0);
  g.addColorStop(0, '#050520'); g.addColorStop(0.5, '#0a0a2e'); g.addColorStop(1, '#151545');
  c.fillStyle = g; c.fillRect(0, 0, CW, CH);

  c.strokeStyle = 'rgba(255,255,255,0.06)'; c.lineWidth = 1;
  const vx = CW/2, vy = CH*0.3;
  for(let i=0;i<=10;i++) {
    const t = i/10;
    c.beginPath(); c.moveTo(CW*0.05*(1-t)+vx*t, CH); c.lineTo(vx, vy); c.stroke();
    c.beginPath(); c.moveTo(CW*0.95*(1-t)+vx*t, CH); c.lineTo(vx, vy); c.stroke();
  }

  const oppW = CW*0.3;
  c.save(); c.translate(vx-oppW/2+(hp-0.5)*CW*0.1, CH*0.15);
  c.scale(0.6, 1); PADDLE_DESIGNS[op].draw(c, oppW, 8); c.restore();

  const ballR = Math.max(3, BALL_SIZE/2*(0.3+depth*1.5));
  const bsx = vx+(hp-0.5)*CW*(0.2+depth*0.7);
  const bsy = CH*0.15+depth*CH*0.7;
  c.fillStyle = '#fff'; c.shadowColor = '#fff'; c.shadowBlur = 5+(1-depth)*10;
  c.beginPath(); c.arc(bsx, bsy, ballR, 0, Math.PI*2); c.fill(); c.shadowBlur = 0;

  c.fillStyle = 'rgba(255,255,255,0.03)'; c.fillRect(0, CH*0.88, CW, CH*0.12);

  const pw = CW*0.3;
  c.save(); c.translate((py/CH)*(CW-pw), CH-10-10);
  PADDLE_DESIGNS[pp].draw(c, pw, 10); c.restore();
}

function drawPvpSplit(c) {
  const hw = CW/2;

  c.save(); c.beginPath(); c.rect(0,0,hw,CH); c.clip();
  drawFirstPersonDirect(c, 0, 0, hw, CH, true); c.restore();

  c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(hw,0); c.lineTo(hw,CH); c.stroke();

  c.save(); c.beginPath(); c.rect(hw,0,hw,CH); c.clip();
  drawFirstPersonDirect(c, hw, 0, hw, CH, false); c.restore();

  c.fillStyle = 'rgba(255,255,255,0.5)'; c.font = '14px sans-serif'; c.textAlign = 'center';
  c.fillText('Player 1', hw/2, CH-5); c.fillText('Player 2', hw+hw/2, CH-5);
  c.textAlign = 'start';
}

function drawFirstPersonDirect(c, ox, oy, w, h, isP1) {
  const py = isP1 ? p1Y : p2Y;
  const pp = isP1 ? p1Paddle : p2Paddle;
  const op = isP1 ? p2Paddle : p1Paddle;

  let depth, hp;
  if (isP1) { depth = ballX / CW; hp = ballY / CH; }
  else { depth = (CW - ballX) / CW; hp = ballY / CH; }

  const g = c.createLinearGradient(ox, oy+h, ox, oy);
  g.addColorStop(0, '#050520'); g.addColorStop(0.5, '#0a0a2e'); g.addColorStop(1, '#151545');
  c.fillStyle = g; c.fillRect(ox, oy, w, h);

  c.strokeStyle = 'rgba(255,255,255,0.06)'; c.lineWidth = 1;
  const vx = ox + w/2, vy = oy + h*0.3;
  for(let i=0;i<=10;i++) {
    const t = i/10;
    c.beginPath(); c.moveTo(ox+w*0.05*(1-t)+vx*t-(ox), oy+h); c.lineTo(vx, vy); c.stroke();
    c.beginPath(); c.moveTo(ox+w*0.95*(1-t)+vx*t-(ox), oy+h); c.lineTo(vx, vy); c.stroke();
  }

  const oppW = w*0.3;
  c.save(); c.translate(vx-oppW/2+(hp-0.5)*w*0.08, oy+h*0.15);
  c.scale(0.6, 1); PADDLE_DESIGNS[op].draw(c, oppW, 8); c.restore();

  const ballR = Math.max(3, BALL_SIZE/2*(0.3+depth*1.5));
  const bsx = vx+(hp-0.5)*w*(0.2+depth*0.7);
  const bsy = oy+h*0.15+depth*h*0.7;
  c.fillStyle = '#fff'; c.shadowColor = '#fff'; c.shadowBlur = 5+(1-depth)*10;
  c.beginPath(); c.arc(bsx, bsy, ballR, 0, Math.PI*2); c.fill(); c.shadowBlur = 0;

  c.fillStyle = 'rgba(255,255,255,0.03)'; c.fillRect(ox, oy+h*0.88, w, h*0.12);

  const pw = w*0.3;
  c.save(); c.translate(ox+(py/CH)*(w-pw), oy+h-10-10);
  PADDLE_DESIGNS[pp].draw(c, pw, 10); c.restore();
}

// ==================== GAME LOOP ====================
function update() {
  if (!gameRunning || gamePaused) return;

  const pSpeed = 24;
  if (perspective === 'third') {
    if (keys['w']) p1Y -= pSpeed;
    if (keys['s']) p1Y += pSpeed;
  } else {
    if (keys['a']) p1Y -= pSpeed;
    if (keys['d']) p1Y += pSpeed;
  }
  p1Y = Math.max(0, Math.min(CH-PADDLE_H, p1Y));

  if (gameMode === 'ai') aiMove();
  else {
    if (keys['arrowup']) p2Y -= pSpeed;
    if (keys['arrowdown']) p2Y += pSpeed;
    p2Y = Math.max(0, Math.min(CH-PADDLE_H, p2Y));
  }

  ballX += ballVX; ballY += ballVY;

  if (ballY <= 0) { ballY = 0; ballVY = Math.abs(ballVY); sound.wallHit(); }
  if (ballY >= CH) { ballY = CH; ballVY = -Math.abs(ballVY); sound.wallHit(); }

  if (ballVX < 0 && ballX - BALL_SIZE/2 <= PADDLE_W+10 &&
      ballY + BALL_SIZE/2 >= p1Y && ballY - BALL_SIZE/2 <= p1Y+PADDLE_H) {
    ballX = PADDLE_W+10+BALL_SIZE/2;
    const speedMult = 0.85 + Math.random() * 0.4;
    ballVX = Math.abs(ballVX) * speedMult;
    const hitPos = (ballY-p1Y)/PADDLE_H; ballVY = (hitPos-0.5)*20;
    sound.paddleHit();
  }

  if (ballVX > 0 && ballX + BALL_SIZE/2 >= CW-PADDLE_W-10 &&
      ballY + BALL_SIZE/2 >= p2Y && ballY - BALL_SIZE/2 <= p2Y+PADDLE_H) {
    ballX = CW-PADDLE_W-10-BALL_SIZE/2;
    const speedMult = 0.85 + Math.random() * 0.4;
    ballVX = -Math.abs(ballVX) * speedMult;
    const hitPos = (ballY-p2Y)/PADDLE_H; ballVY = (hitPos-0.5)*20;
    sound.paddleHit();
  }

  if (ballX < 0) { p2Score++; sound.score(); checkWin(); resetPositions(); }
  if (ballX > CW) { p1Score++; sound.score(); checkWin(); resetPositions(); }

  updateScore();
}

function render() {
  const canvas = $('game-canvas');
  canvas.width = CW; canvas.height = CH;
  const c = canvas.getContext('2d');

  if (gameMode === 'pvp') drawPvpSplit(c);
  else if (perspective === 'third') drawClassic(c);
  else drawFirstPersonDirect(c, 0, 0, CW, CH, true);

  c.fillStyle = 'rgba(255,255,255,0.6)'; c.font = '28px sans-serif'; c.textAlign = 'center';
  c.fillText(p1Score + '  -  ' + p2Score, CW/2, 40);
  c.textAlign = 'start';
}

function gameLoop() {
  if (!gameRunning) return;
  update(); render(); requestAnimationFrame(gameLoop);
}

// ==================== PAUSE / RESUME ====================
$('btn-pause').onclick = () => {
  gamePaused = true;
  show('pause-screen');
};

$('btn-resume').onclick = () => {
  gamePaused = false;
  hide('pause-screen');
};

$('btn-quit').onclick = () => {
  gameRunning = false;
  sound.stopMusic();
  hide('pause-screen'); hide('game-screen');
  show('menu');
};

$('btn-restart').onclick = () => {
  hide('game-over-screen');
  startGame();
};

$('btn-main-menu').onclick = () => {
  gameRunning = false;
  sound.stopMusic();
  hide('game-over-screen'); hide('game-screen');
  show('menu');
};
