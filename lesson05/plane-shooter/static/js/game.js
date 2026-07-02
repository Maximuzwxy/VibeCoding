/**
 * Plane Shooter - Main Game Logic
 * Handles game loop, state management, and rendering
 */

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// Game state
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver',
    LEVEL_COMPLETE: 'levelComplete'
};

// Main Game class
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        
        this.width = CANVAS_WIDTH;
        this.height = CANVAS_HEIGHT;
        
        this.state = GameState.MENU;
        this.level = 1;
        this.maxLevels = 6;

        this.players = [];
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.boss = null;
        this.powerUpManager = null;

        this.keys = {};
        this.keys2 = {}; // For player 2

        this.score = 0;
        this.player1Score = 0;
        this.player2Score = 0;

        this.lastTime = 0;
        this.gameMode = 1; // 1 or 2 players

        this.settings = {
            lives: 3,
            sounds: true,
            music: true
        };

        this.difficulty = 'normal';
        
        // Wave system
        this.currentWave = 0;
        this.totalWaves = 3;
        this.waveInProgress = false;
        this.waveTimer = 0;
        this.waveDelay = 2000; // 2 seconds between waves

        this.bindEvents();
        this.loadSettings();

        // Start render loop
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    bindEvents() {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Player 2 controls (WASD + F)
            if (e.code === 'KeyW') this.keys2['ArrowUp'] = true;
            if (e.code === 'KeyS') this.keys2['ArrowDown'] = true;
            if (e.code === 'KeyA') this.keys2['ArrowLeft'] = true;
            if (e.code === 'KeyD') this.keys2['ArrowRight'] = true;
            if (e.code === 'KeyF') this.keys2['Space'] = true;
            
            // Pause (single player only)
            if (e.code === 'KeyP' && this.state === GameState.PLAYING && this.gameMode === 1) {
                // Pause functionality disabled per requirements
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            
            if (e.code === 'KeyW') this.keys2['ArrowUp'] = false;
            if (e.code === 'KeyS') this.keys2['ArrowDown'] = false;
            if (e.code === 'KeyA') this.keys2['ArrowLeft'] = false;
            if (e.code === 'KeyD') this.keys2['ArrowRight'] = false;
            if (e.code === 'KeyF') this.keys2['Space'] = false;
        });
    }

    loadSettings() {
        const saved = localStorage.getItem('planeShooterSettings');
        if (saved) {
            this.settings = JSON.parse(saved);
        }
        
        // Apply settings
        audioManager.setSoundsEnabled(this.settings.sounds === 'on');
        audioManager.setMusicEnabled(this.settings.music === 'on');
    }

    saveSettings() {
        localStorage.setItem('planeShooterSettings', JSON.stringify(this.settings));
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(deltaTime) {
        if (this.state !== GameState.PLAYING) return;

        // Update players
        this.players.forEach((player, index) => {
            const controls = index === 0 ? 
                { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', shoot: 'Space' } :
                { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', shoot: 'KeyF' };
            
            const keySet = index === 0 ? this.keys : this.keys2;
            player.update(keySet, deltaTime);
        });
        
        // Update bullets
        this.bullets.forEach(bullet => bullet.update());
        this.bullets = this.bullets.filter(b => b.active);
        
        this.enemyBullets.forEach(bullet => bullet.update());
        this.enemyBullets = this.enemyBullets.filter(b => b.active);
        
        // Update enemies
        this.enemies.forEach(enemy => enemy.update(deltaTime));
        this.enemies = this.enemies.filter(e => e.active);
        
        // Update boss
        if (this.boss) {
            this.boss.update(deltaTime);
        }
        
        // Update power-ups
        if (this.powerUpManager) {
            this.powerUpManager.update(deltaTime);
            this.powerUpManager.checkCollisions(this.players);
        }
        
        // Wave management
        this.updateWaves(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Check win/lose conditions
        this.checkGameConditions();
        
        // Update HUD
        this.updateHUD();
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a2a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw starfield background
        this.drawStarfield();
        
        if (this.state === GameState.PLAYING) {
            // Draw game elements
            if (this.powerUpManager) {
                this.powerUpManager.draw(this.ctx);
            }
            
            this.bullets.forEach(bullet => bullet.draw(this.ctx));
            this.enemyBullets.forEach(bullet => bullet.draw(this.ctx));
            this.enemies.forEach(enemy => enemy.draw(this.ctx));
            
            if (this.boss) {
                this.boss.draw(this.ctx);
            }
            
            this.players.forEach(player => player.draw(this.ctx));
        }
    }

    drawStarfield() {
        this.ctx.fillStyle = '#fff';
        const time = Date.now() * 0.001;

        for (let i = 0; i < 50; i++) {
            const x = (Math.sin(i * 132.1 + time * 0.1) * 0.5 + 0.5) * this.width;
            const y = (Math.cos(i * 54.3 + time * 0.05) * 0.5 + 0.5) * this.height;
            const size = Math.sin(i + time) * 1.5 + 2;

            this.ctx.globalAlpha = Math.abs(Math.sin(time + i)) * 0.5 + 0.3;
            this.ctx.fillRect(x, y, size, size);
        }

        this.ctx.globalAlpha = 1;
    }

    /**
     * Wave Management System
     */
    updateWaves(deltaTime) {
        // Don't spawn waves if boss is active
        if (this.boss && this.boss.active) return;
        
        // Check if all enemies are cleared
        const activeEnemies = this.enemies.filter(e => e.active).length;
        
        if (activeEnemies === 0 && this.waveInProgress) {
            // Wave cleared
            this.waveInProgress = false;
            this.waveTimer = Date.now();
        }
        
        // Start next wave
        if (!this.waveInProgress && !this.boss) {
            if (Date.now() - this.waveTimer >= this.waveDelay) {
                this.startNextWave();
            }
        }
    }

    startNextWave() {
        if (this.currentWave >= this.totalWaves) {
            // All waves cleared, spawn boss
            this.spawnBoss();
            return;
        }
        
        this.currentWave++;
        this.waveInProgress = true;
        
        // Show wave notification
        this.showWaveNotification(this.currentWave, this.totalWaves);
        
        // Spawn enemies for this wave
        const enemyCount = 3 + this.currentWave * 2; // Increase enemies per wave
        
        for (let i = 0; i < enemyCount; i++) {
            setTimeout(() => {
                if (this.state === GameState.PLAYING) {
                    this.spawnEnemy();
                }
            }, i * 300); // Spawn enemies with delay
        }
    }

    spawnEnemy() {
        const x = Math.random() * (this.width - 50);
        
        // Determine enemy type based on level and wave
        const rand = Math.random();
        let type = 'small';
        
        if (this.level >= 2 && rand > 0.7) {
            type = 'medium';
        }
        if (this.level >= 4 && rand > 0.9) {
            type = 'large';
        }

        const enemy = new Enemy(x, -50, type, this);
        this.enemies.push(enemy);
    }

    spawnBoss() {
        this.boss = new Boss(this.level, this);
    }

    showWaveNotification(wave, total) {
        const notification = document.createElement('div');
        notification.style.position = 'absolute';
        notification.style.top = '20%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.background = 'rgba(0, 212, 255, 0.8)';
        notification.style.color = 'white';
        notification.style.padding = '15px 30px';
        notification.style.borderRadius = '10px';
        notification.style.fontSize = '1.5em';
        notification.style.fontWeight = 'bold';
        notification.style.zIndex = '300';
        notification.textContent = `⚔️ Wave ${wave}/${total}`;
        
        document.getElementById('game-container').appendChild(notification);
        
        setTimeout(() => notification.remove(), 2000);
    }

    checkCollisions() {
        // Player bullets vs enemies
        this.bullets.forEach(bullet => {
            if (!bullet.active || bullet.owner !== 'player') return;

            // Vs normal enemies
            this.enemies.forEach(enemy => {
                if (enemy.active && bullet.collidesWith(enemy)) {
                    bullet.active = false;
                    enemy.takeDamage(1);
                }
            });

            // Vs boss
            if (this.boss && this.boss.active && this.boss.collidesWith(bullet)) {
                bullet.active = false;
                this.boss.takeDamage(1);
            }
        });

        // Enemy bullets vs players
        this.enemyBullets.forEach(bullet => {
            if (!bullet.active || bullet.owner !== 'enemy') return;

            this.players.forEach(player => {
                if (player.active && bullet.collidesWith(player)) {
                    bullet.active = false;
                    player.hit();
                }
            });
        });

        // Enemies vs players
        this.enemies.forEach(enemy => {
            this.players.forEach(player => {
                if (player.active && enemy.active && enemy.collidesWithPlayer(player)) {
                    enemy.destroy();
                    player.hit();
                }
            });
        });

        // Boss vs players
        if (this.boss && this.boss.active) {
            this.players.forEach(player => {
                if (player.active && this.boss.collidesWithPlayer(player)) {
                    player.hit();
                }
            });
        }
    }

    checkGameConditions() {
        // Check if all players are dead
        const activePlayers = this.players.filter(p => p.active);

        if (activePlayers.length === 0) {
            this.gameOver();
        }

        // Check if boss is defeated
        if (this.boss && !this.boss.active) {
            this.boss = null;
            this.bossDefeated = true;
            // Level complete when boss is defeated
            setTimeout(() => {
                this.levelComplete();
            }, 1000);
        }
    }

    start(gameMode, difficulty) {
        // Initialize audio on first user interaction
        audioManager.init();
        audioManager.startMusic();

        this.gameMode = gameMode;
        this.difficulty = difficulty;
        this.level = 1;
        this.score = 0;
        this.player1Score = 0;
        this.player2Score = 0;

        // Get lives from settings
        const lives = parseInt(this.settings.lives) || 3;

        // Create players
        this.players = [];

        // Player 1
        this.players.push(new Player(
            this.width / 2 - 25,
            this.height - 100,
            { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', shoot: 'Space' },
            '#00d4ff',
            this
        ));
        this.players[0].lives = lives;

        // Player 2 (if multiplayer)
        if (gameMode === 2) {
            this.players.push(new Player(
                this.width / 2 + 25,
                this.height - 100,
                { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', shoot: 'KeyF' },
                '#ff006e',
                this
            ));
            this.players[1].lives = lives;
        }

        // Reset game objects
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.boss = null;
        this.bossDefeated = false;

        // Create power-up manager
        this.powerUpManager = new PowerUpManager(this);

        // Hide menus, show HUD
        document.querySelectorAll('.menu').forEach(el => el.style.display = 'none');
        document.getElementById('hud').style.display = 'flex';

        this.state = GameState.PLAYING;
        this.startLevel(1);
    }

    startLevel(levelNum) {
        this.level = levelNum;
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.boss = null;
        this.bossDefeated = false;
        
        // Initialize wave system
        this.currentWave = 0;
        this.totalWaves = 2 + levelNum; // More waves in later levels (3-8 waves)
        this.waveInProgress = false;
        this.waveTimer = Date.now();
        
        // Start first wave after short delay
        setTimeout(() => {
            if (this.state === GameState.PLAYING) {
                this.startNextWave();
            }
        }, 1000);
    }

    levelComplete() {
        if (this.level >= this.maxLevels) {
            // Game complete - all levels done
            this.gameOver(true);
            return;
        }

        this.state = GameState.LEVEL_COMPLETE;
        this.bossDefeated = true;

        document.getElementById('level-complete').style.display = 'block';
    }

    nextLevel() {
        document.getElementById('level-complete').style.display = 'none';
        
        // Reset players position
        this.players.forEach((player, index) => {
            if (player.active) {
                player.x = index === 0 ? this.width / 2 - 25 : this.width / 2 + 25;
                player.y = this.height - 100;
            }
        });
        
        // Clear all bullets and enemies
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.boss = null;
        this.bossDefeated = false;
        
        this.state = GameState.PLAYING;
        this.startLevel(this.level + 1);
    }

    gameOver(victory = false) {
        this.state = GameState.GAME_OVER;

        // Calculate total score
        const totalScore = this.players.reduce((sum, p) => sum + p.score, 0);
        const maxLevel = this.level;

        // Save score
        this.saveScore(totalScore, maxLevel);

        // Show game over screen
        document.getElementById('hud').style.display = 'none';
        document.getElementById('game-over').style.display = 'block';
        document.getElementById('final-score').textContent = totalScore;
        document.getElementById('final-level').textContent = maxLevel;

        // Get user's best score
        fetch('/api/get_user_best')
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('best-score').textContent = data.best_score;
                }
            });

        audioManager.stopMusic();
    }

    /**
     * Continue game from current level
     */
    continueGame() {
        // Get lives from settings
        const lives = parseInt(this.settings.lives) || 3;

        // Reset players
        this.players.forEach((player, index) => {
            player.active = true;
            player.lives = lives;
            player.x = index === 0 ? this.width / 2 - 25 : this.width / 2 + 25;
            player.y = this.height - 100;
            
            // Reset power-ups
            player.powerUps = {
                rapidFire: { active: false, timer: 0 },
                shield: { active: false, timer: 0 },
                multiShot: { active: false, timer: 0 }
            };
        });

        // Reset game objects
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.boss = null;
        this.bossDefeated = false;

        // Initialize wave system
        this.currentWave = 0;
        this.totalWaves = 2 + this.level;
        this.waveInProgress = false;
        this.waveTimer = Date.now();

        // Hide game over screen, show HUD
        document.getElementById('game-over').style.display = 'none';
        document.getElementById('hud').style.display = 'flex';

        this.state = GameState.PLAYING;

        // Start first wave after short delay
        setTimeout(() => {
            if (this.state === GameState.PLAYING) {
                this.startNextWave();
            }
        }, 1000);

        // Resume music
        audioManager.startMusic();
    }

    async saveScore(score, level) {
        try {
            await fetch('/api/save_score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ score, level })
            });
        } catch (e) {
            console.error('Failed to save score:', e);
        }
    }

    addScore(points) {
        this.score += points;
        if (this.players[0]) {
            this.players[0].score += points;
        }
    }

    updateHUD() {
        const player = this.players[0];
        if (!player) return;

        document.getElementById('hud-score').textContent = this.score;
        document.getElementById('hud-level').textContent = this.level;
        document.getElementById('hud-lives').textContent = player.lives;
        
        // Update wave display
        document.getElementById('hud-wave').textContent = `${this.currentWave}/${this.totalWaves}`;

        // Show active power-ups
        const powerUps = player.getActivePowerUps();
        const powerUpText = powerUps.length > 0 ?
            powerUps.map(p => p === 'rapidFire' ? '🔥' : p === 'shield' ? '🛡️' : '⭐').join(' ') :
            '-';
        document.getElementById('hud-powerup').textContent = powerUpText;
    }

    spawnPowerUpAt(x, y) {
        if (!this.powerUpManager) return;
        
        const types = ['rapidFire', 'shield', 'multiShot', 'extraLife', 'bomb'];
        const type = types[Math.floor(Math.random() * types.length)];
        const powerUp = new PowerUp(x, y, type);
        this.powerUpManager.powerUps.push(powerUp);
    }

    clearAllEnemies() {
        // Destroy all regular enemies
        this.enemies.forEach(enemy => {
            enemy.active = false;
            this.addScore(enemy.score);
        });
        this.enemies = [];
        
        // Damage boss if exists
        if (this.boss && this.boss.active) {
            this.boss.takeDamage(10);
        }
        
        audioManager.play('bomb');
    }
}

// Global game instance
let game = null;

// Menu functions
function showModeSelect() {
    audioManager.init();
    audioManager.resume();
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('mode-menu').style.display = 'block';
}

function startGame(mode) {
    audioManager.init();
    audioManager.resume();
    document.getElementById('mode-menu').style.display = 'none';
    document.getElementById('difficulty-menu').style.display = 'block';
}

function selectDifficulty(difficulty) {
    audioManager.init();
    audioManager.resume();
    document.getElementById('difficulty-menu').style.display = 'none';

    // Create and start game
    game = new Game();
    game.settings.lives = document.getElementById('lives-setting').value;
    game.settings.sounds = document.getElementById('sound-setting').value;
    game.settings.music = document.getElementById('music-setting').value;
    game.saveSettings();
    
    // Apply audio settings
    audioManager.setSoundsEnabled(game.settings.sounds === 'on');
    audioManager.setMusicEnabled(game.settings.music === 'on');

    game.start(1, difficulty);
}

function showMainMenu() {
    document.querySelectorAll('.menu').forEach(el => el.style.display = 'none');
    document.getElementById('main-menu').style.display = 'block';
    document.getElementById('hud').style.display = 'none';
}

function showLeaderboard() {
    window.location.href = '/leaderboard';
}

function showRules() {
    window.location.href = '/rules';
}

function showSettings() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('settings-menu').style.display = 'block';
}

function saveSettings() {
    if (game) {
        game.settings.lives = document.getElementById('lives-setting').value;
        game.settings.sounds = document.getElementById('sound-setting').value;
        game.settings.music = document.getElementById('music-setting').value;
        game.saveSettings();

        audioManager.setSoundsEnabled(game.settings.sounds === 'on');
        audioManager.setMusicEnabled(game.settings.music === 'on');
    } else {
        // Save settings even if game hasn't started
        const settings = {
            lives: document.getElementById('lives-setting').value,
            sounds: document.getElementById('sound-setting').value,
            music: document.getElementById('music-setting').value
        };
        localStorage.setItem('planeShooterSettings', JSON.stringify(settings));
        
        audioManager.setSoundsEnabled(settings.sounds === 'on');
        audioManager.setMusicEnabled(settings.music === 'on');
    }

    showMainMenu();
}

// Next level function (global)
function nextLevel() {
    if (game) {
        game.nextLevel();
    }
}

// Continue game function (global)
function continueGame() {
    if (game) {
        game.continueGame();
    }
}

// Initialize when page loads
window.addEventListener('load', () => {
    console.log('🚀 Plane Shooter loaded!');
});
