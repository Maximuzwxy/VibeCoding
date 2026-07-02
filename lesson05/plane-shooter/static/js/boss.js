/**
 * Plane Shooter - Boss Battles
 * Handles boss enemies for each level
 */

class Boss {
    constructor(level, game) {
        this.level = level;
        this.game = game;
        this.active = true;
        this.difficulty = game.difficulty || 'normal';

        // Set boss properties based on level
        this.setProperties();

        // Position
        this.x = this.game.width / 2 - this.width / 2;
        this.y = -100;
        this.targetY = 50;

        // Movement
        this.speedX = 2;
        this.speedY = 1;
        this.moveDirection = 1;
        this.entering = true;

        // Shooting
        this.canShoot = true;
        this.shootDelay = 1000;
        this.lastShot = 0;

        // Attack patterns
        this.attackPattern = 0;
        this.patternTimer = 0;

        // Animation
        this.frame = 0;

        // Alert player
        this.showAlert();
    }

    setProperties() {
        // Difficulty multipliers
        const difficultyMultipliers = {
            easy: { speed: 0.7, health: 0.7, shootDelay: 1.3 },
            normal: { speed: 1, health: 1, shootDelay: 1 },
            hard: { speed: 1.4, health: 1.5, shootDelay: 0.7 }
        };

        const mult = difficultyMultipliers[this.difficulty] || difficultyMultipliers.normal;

        const properties = {
            1: { name: 'Rock Destroyer', width: 120, height: 80, health: Math.floor(20 * mult.health), speed: 1.5 * mult.speed, score: 1000, color: '#8B4513' },
            2: { name: 'Battle Cruiser', width: 140, height: 90, health: Math.floor(30 * mult.health), speed: 1.8 * mult.speed, score: 1000, color: '#4a4a4a' },
            3: { name: 'Mothership', width: 160, height: 100, health: Math.floor(40 * mult.health), speed: 1.2 * mult.speed, score: 1000, color: '#2d5016' },
            4: { name: 'Station Core', width: 180, height: 120, health: Math.floor(50 * mult.health), speed: 1 * mult.speed, score: 1000, color: '#3d3d3d' },
            5: { name: 'Storm Bringer', width: 150, height: 100, health: Math.floor(60 * mult.health), speed: 2 * mult.speed, score: 1000, color: '#4b0082' },
            6: { name: 'Final Boss', width: 200, height: 140, health: Math.floor(100 * mult.health), speed: 1.5 * mult.speed, score: 1000, color: '#8b0000' }
        };

        const props = properties[this.level] || properties[1];
        this.name = props.name;
        this.width = props.width;
        this.height = props.height;
        this.maxHealth = props.health;
        this.health = props.health;
        this.speed = props.speed;
        this.score = props.score;
        this.color = props.color;
        this.shootDelay = 1000 * mult.shootDelay;
    }

    update(deltaTime) {
        if (!this.active) return;

        // Entry animation
        if (this.entering) {
            this.y += this.speedY;
            if (this.y >= this.targetY) {
                this.y = this.targetY;
                this.entering = false;
            }
            return;
        }

        // Horizontal movement
        this.x += this.speedX * this.moveDirection;
        
        // Bounce off walls
        if (this.x <= 0 || this.x >= this.game.width - this.width) {
            this.moveDirection *= -1;
        }

        // Shooting
        this.tryShoot();

        // Update attack pattern
        this.updateAttackPattern(deltaTime);

        // Animation
        this.frame += 0.05;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        // Draw boss body
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;

        // Different designs for different bosses
        ctx.beginPath();
        
        if (this.level === 6) {
            // Final Boss - More complex shape
            ctx.moveTo(this.x + this.width / 2, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height / 3);
            ctx.lineTo(this.x + this.width * 0.8, this.y + this.height);
            ctx.lineTo(this.x + this.width * 0.2, this.y + this.height);
            ctx.lineTo(this.x, this.y + this.height / 3);
            ctx.closePath();
        } else {
            // Other bosses - Ellipse shape
            ctx.ellipse(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.width / 2,
                this.height / 2,
                0, 0, Math.PI * 2
            );
        }
        
        ctx.fill();

        // Draw boss details
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 20, 0, Math.PI * 2);
        ctx.fill();

        // Draw health bar
        this.drawHealthBar(ctx);

        // Draw boss name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x + this.width / 2, this.y - 15);

        ctx.restore();
    }

    drawHealthBar(ctx) {
        const barWidth = this.width;
        const barHeight = 10;
        const x = this.x;
        const y = this.y - 30;

        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Health
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }

    tryShoot() {
        const now = Date.now();
        if (now - this.lastShot >= this.shootDelay) {
            this.lastShot = now;
            this.shoot();
        }
    }

    shoot() {
        const player = this.game.players[0];
        if (!player || !player.active) return;

        // Different attack patterns based on level
        switch (this.attackPattern) {
            case 0:
                // Single shot at player
                this.shootAtPlayer(player);
                break;
            case 1:
                // Spread shot
                this.shootSpread();
                break;
            case 2:
                // Circular pattern
                this.shootCircular();
                break;
        }
    }

    shootAtPlayer(player) {
        const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
        const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        const vx = (dx / distance) * 6;
        const vy = (dy / distance) * 6;

        this.game.enemyBullets.push(new Bullet(
            this.x + this.width / 2,
            this.y + this.height / 2,
            vx,
            vy,
            'enemy'
        ));
    }

    shootSpread() {
        const angles = [-0.3, -0.15, 0, 0.15, 0.3];
        
        angles.forEach(angle => {
            const vx = Math.sin(angle) * 5;
            const vy = Math.cos(angle) * 5;
            
            this.game.enemyBullets.push(new Bullet(
                this.x + this.width / 2,
                this.y + this.height,
                vx,
                vy,
                'enemy'
            ));
        });
    }

    shootCircular() {
        const bulletCount = this.level >= 4 ? 12 : 8;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = (Math.PI * 2 / bulletCount) * i;
            const vx = Math.cos(angle) * 4;
            const vy = Math.sin(angle) * 4;
            
            this.game.enemyBullets.push(new Bullet(
                this.x + this.width / 2,
                this.y + this.height / 2,
                vx,
                vy,
                'enemy'
            ));
        }
    }

    updateAttackPattern(deltaTime) {
        this.patternTimer += deltaTime;
        
        // Change pattern every 5 seconds
        if (this.patternTimer >= 5000) {
            this.patternTimer = 0;
            this.attackPattern = (this.attackPattern + 1) % 3;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        
        if (this.health <= 0) {
            this.destroy();
            return true;
        }
        return false;
    }

    destroy() {
        this.active = false;
        this.game.addScore(this.score);
        audioManager.play('explosion');
        
        // Drop multiple power-ups
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.game.spawnPowerUpAt(
                    this.x + Math.random() * this.width,
                    this.y + Math.random() * this.height
                );
            }, i * 200);
        }
        
        // Level complete
        setTimeout(() => {
            this.game.levelComplete();
        }, 1000);
    }

    showAlert() {
        audioManager.play('bossAlert');
        
        // Show alert message
        const alert = document.createElement('div');
        alert.style.position = 'absolute';
        alert.style.top = '30%';
        alert.style.left = '50%';
        alert.style.transform = 'translate(-50%, -50%)';
        alert.style.background = 'rgba(255, 0, 0, 0.8)';
        alert.style.color = 'white';
        alert.style.padding = '20px 40px';
        alert.style.borderRadius = '10px';
        alert.style.fontSize = '2em';
        alert.style.fontWeight = 'bold';
        alert.style.zIndex = '300';
        alert.textContent = `⚠️ ${this.name} APPEARS! ⚠️`;
        
        document.getElementById('game-container').appendChild(alert);
        
        setTimeout(() => alert.remove(), 2000);
    }

    collidesWith(bullet) {
        return bullet.x < this.x + this.width &&
               bullet.x + bullet.width > this.x &&
               bullet.y < this.y + this.height &&
               bullet.y + bullet.height > this.y;
    }

    collidesWithPlayer(player) {
        return this.x < player.x + player.width &&
               this.x + this.width > player.x &&
               this.y < player.y + player.height &&
               this.y + this.height > player.y;
    }
}
