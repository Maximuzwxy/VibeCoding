/**
 * Plane Shooter - Enemy Logic
 * Handles enemy spawning, movement, and attacks
 */

class Enemy {
    constructor(x, y, type, game) {
        this.x = x;
        this.y = y;
        this.type = type; // 'small', 'medium', 'large'
        this.game = game;
        this.active = true;
        this.difficulty = game.difficulty || 'normal';

        // Set properties based on type
        this.setProperties();

        // Movement
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = this.baseSpeed;

        // Shooting
        this.canShoot = true;
        this.shootDelay = this.baseShootDelay;
        this.lastShot = 0;

        // Animation
        this.frame = 0;
    }

    setProperties() {
        // Difficulty multipliers
        const difficultyMultipliers = {
            easy: { speed: 0.7, spawnRate: 0.7, shootDelay: 1.3 },
            normal: { speed: 1, spawnRate: 1, shootDelay: 1 },
            hard: { speed: 1.4, spawnRate: 1.5, shootDelay: 0.7 }
        };

        const mult = difficultyMultipliers[this.difficulty] || difficultyMultipliers.normal;

        const properties = {
            small: {
                width: 30,
                height: 30,
                health: 1,
                baseSpeed: 2 * mult.speed,
                baseShootDelay: 3000 * mult.shootDelay,
                score: 100,
                color: '#ff6b6b'
            },
            medium: {
                width: 45,
                height: 40,
                health: 3,
                baseSpeed: 1.5 * mult.speed,
                baseShootDelay: 2000 * mult.shootDelay,
                score: 250,
                color: '#ff8e53'
            },
            large: {
                width: 60,
                height: 50,
                health: 5,
                baseSpeed: 1 * mult.speed,
                baseShootDelay: 1500 * mult.shootDelay,
                score: 500,
                color: '#f7971e'
            }
        };

        const props = properties[this.type];
        this.width = props.width;
        this.height = props.height;
        this.health = props.health;
        this.baseSpeed = props.baseSpeed;
        this.baseShootDelay = props.baseShootDelay;
        this.score = props.score;
        this.color = props.color;
    }

    update(deltaTime) {
        // Move enemy
        this.x += this.speedX;
        this.y += this.speedY;

        // Bounce off walls
        if (this.x <= 0 || this.x >= this.game.width - this.width) {
            this.speedX *= -1;
        }

        // Shoot at player
        this.tryShoot();

        // Animation
        this.frame += 0.05;

        // Remove if off screen
        if (this.y > this.game.height + 50) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();

        // Draw enemy ship
        ctx.fillStyle = this.color;
        
        // Different shapes for different types
        if (this.type === 'small') {
            // Small enemies are triangular
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + this.height);
            ctx.lineTo(this.x + this.width, this.y);
            ctx.lineTo(this.x, this.y);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'medium') {
            // Medium enemies are diamond-shaped
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + this.height);
            ctx.lineTo(this.x + this.width, this.y + this.height / 2);
            ctx.moveTo(this.x + this.width / 2, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height / 2);
            ctx.lineTo(this.x + this.width / 2, this.y + this.height);
            ctx.lineTo(this.x, this.y + this.height / 2);
            ctx.lineTo(this.x + this.width / 2, this.y);
            ctx.closePath();
            ctx.fill();
        } else {
            // Large enemies are more complex
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + this.height);
            ctx.lineTo(this.x + this.width, this.y + this.height / 2);
            ctx.lineTo(this.x + this.width * 0.7, this.y);
            ctx.lineTo(this.x + this.width * 0.3, this.y);
            ctx.lineTo(this.x, this.y + this.height / 2);
            ctx.closePath();
            ctx.fill();
        }

        // Draw glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        // Draw health indicator for larger enemies
        if (this.type !== 'small') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('❤️'.repeat(this.health), this.x + this.width / 2, this.y - 5);
        }

        ctx.restore();
    }

    tryShoot() {
        const now = Date.now();
        if (now - this.lastShot >= this.baseShootDelay) {
            this.lastShot = now;
            this.shoot();
        }
    }

    shoot() {
        // Calculate direction to player
        const player = this.game.players[0];
        if (!player || !player.active) return;

        const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
        const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Create bullet towards player
        const vx = (dx / distance) * 5;
        const vy = (dy / distance) * 5;

        this.game.enemyBullets.push(new Bullet(
            this.x + this.width / 2,
            this.y + this.height / 2,
            vx,
            vy,
            'enemy'
        ));
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
        
        // Small chance to drop power-up
        if (Math.random() < 0.1) {
            this.game.spawnPowerUpAt(this.x, this.y);
        }
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

/**
 * Enemy Spawner
 */
class EnemySpawner {
    constructor(game) {
        this.game = game;
        this.spawnTimer = 0;
        this.spawnInterval = 2000; // Base spawn interval
        this.wave = 0;
    }

    update(deltaTime) {
        this.spawnTimer += deltaTime;

        // Decrease spawn interval as level progresses
        const adjustedInterval = Math.max(500, this.spawnInterval - (this.game.level * 200));

        if (this.spawnTimer >= adjustedInterval) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }
    }

    spawnEnemy() {
        const x = Math.random() * (this.game.width - 50);
        
        // Determine enemy type based on level and randomness
        const rand = Math.random();
        let type = 'small';
        
        if (this.game.level >= 2 && rand > 0.7) {
            type = 'medium';
        }
        if (this.game.level >= 4 && rand > 0.9) {
            type = 'large';
        }

        const enemy = new Enemy(x, -50, type, this.game);
        this.game.enemies.push(enemy);
    }

    reset() {
        this.spawnTimer = 0;
        this.wave = 0;
    }
}
