/**
 * Plane Shooter - Player Controller
 * Handles player spaceship movement and shooting
 */

class Player {
    constructor(x, y, controls, color, game) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 50;
        this.speed = 5;
        this.color = color;
        this.game = game;
        this.controls = controls;
        this.active = true;
        this.lives = 3;
        this.score = 0;
        
        // Shooting
        this.canShoot = true;
        this.shootDelay = 200;
        this.lastShot = 0;
        
        // Power-ups
        this.powerUps = {
            rapidFire: { active: false, timer: 0 },
            shield: { active: false, timer: 0 },
            multiShot: { active: false, timer: 0 }
        };
        
        // Invincibility after hit
        this.invincible = false;
        this.invincibleTimer = 0;
        
        // Animation
        this.frame = 0;
    }

    update(keys, deltaTime) {
        if (!this.active) return;

        // Movement
        if (keys[this.controls.up] && this.y > 0) {
            this.y -= this.speed;
        }
        if (keys[this.controls.down] && this.y < this.game.height - this.height) {
            this.y += this.speed;
        }
        if (keys[this.controls.left] && this.x > 0) {
            this.x -= this.speed;
        }
        if (keys[this.controls.right] && this.x < this.game.width - this.width) {
            this.x += this.speed;
        }

        // Shooting
        if (keys[this.controls.shoot]) {
            this.shoot();
        }

        // Update power-up timers
        this.updatePowerUps(deltaTime);

        // Update invincibility
        if (this.invincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        // Animation frame
        this.frame += 0.1;
    }

    draw(ctx) {
        if (!this.active) return;

        // Blink when invincible
        if (this.invincible && Math.floor(this.frame * 10) % 2 === 0) {
            return;
        }

        ctx.save();

        // Draw shield if active
        if (this.powerUps.shield.active) {
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 40, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(78, 205, 196, 0.3)';
            ctx.fill();
            ctx.strokeStyle = '#4ecdc4';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Draw spaceship body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height - 15);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // Draw cockpit
        ctx.fillStyle = '#87ceeb';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 10, 0, Math.PI * 2);
        ctx.fill();

        // Draw engine flame
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2 - 10, this.y + this.height - 10);
        ctx.lineTo(this.x + this.width / 2 + 10, this.y + this.height - 10);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height + Math.sin(this.frame) * 15 + 5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    shoot() {
        const now = Date.now();
        const delay = this.powerUps.rapidFire.active ? this.shootDelay / 2 : this.shootDelay;

        if (now - this.lastShot >= delay) {
            this.lastShot = now;

            if (this.powerUps.multiShot.active) {
                // Triple shot
                this.game.bullets.push(new Bullet(this.x + this.width / 2, this.y, 0, -10, 'player'));
                this.game.bullets.push(new Bullet(this.x + this.width / 2, this.y, -3, -9, 'player'));
                this.game.bullets.push(new Bullet(this.x + this.width / 2, this.y, 3, -9, 'player'));
            } else {
                // Single shot
                this.game.bullets.push(new Bullet(this.x + this.width / 2, this.y, 0, -10, 'player'));
            }

            audioManager.play('shoot');
        }
    }

    activatePowerUp(type, duration) {
        if (type === 'extraLife' || type === 'bomb') return;
        
        this.powerUps[type] = {
            active: true,
            timer: duration
        };
    }

    updatePowerUps(deltaTime) {
        for (const type in this.powerUps) {
            if (this.powerUps[type].active && type !== 'extraLife' && type !== 'bomb') {
                this.powerUps[type].timer -= deltaTime;
                if (this.powerUps[type].timer <= 0) {
                    this.powerUps[type].active = false;
                }
            }
        }
    }

    hit() {
        if (this.invincible || this.powerUps.shield.active) return false;

        this.lives--;
        this.invincible = true;
        this.invincibleTimer = 2000; // 2 seconds invincibility

        audioManager.play('hit');

        if (this.lives <= 0) {
            this.active = false;
            audioManager.play('explosion');
        }

        return true;
    }

    getActivePowerUps() {
        const active = [];
        for (const type in this.powerUps) {
            if (this.powerUps[type].active && type !== 'extraLife' && type !== 'bomb') {
                active.push(type);
            }
        }
        return active;
    }
}

/**
 * Bullet class
 */
class Bullet {
    constructor(x, y, vx, vy, owner) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = 6;
        this.height = 15;
        this.owner = owner; // 'player' or 'enemy'
        this.active = true;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Remove if off screen
        if (this.y < -20 || this.y > 620 || this.x < -20 || this.x > 820) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();
        
        if (this.owner === 'player') {
            // Player bullets are blue
            ctx.fillStyle = '#00d4ff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00d4ff';
        } else {
            // Enemy bullets are red
            ctx.fillStyle = '#ff006e';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff006e';
        }

        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    collidesWith(target) {
        return this.x < target.x + target.width &&
               this.x + this.width > target.x &&
               this.y < target.y + target.height &&
               this.y + this.height > target.y;
    }
}
