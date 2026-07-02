/**
 * Plane Shooter - Power-up System
 * Handles all power-up types and effects
 */

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.type = type; // 'rapidFire', 'shield', 'multiShot', 'extraLife', 'bomb'
        this.speed = 2;
        this.active = true;
        this.color = this.getColorForType(type);
        this.icon = this.getIconForType(type);
        this.duration = this.getDurationForType(type);
    }

    getColorForType(type) {
        const colors = {
            rapidFire: '#ff6b6b',
            shield: '#4ecdc4',
            multiShot: '#ffe66d',
            extraLife: '#ff85a2',
            bomb: '#95e1d3'
        };
        return colors[type] || '#ffffff';
    }

    getIconForType(type) {
        const icons = {
            rapidFire: '🔥',
            shield: '🛡️',
            multiShot: '⭐',
            extraLife: '❤️',
            bomb: '💣'
        };
        return icons[type] || '✨';
    }

    getDurationForType(type) {
        const durations = {
            rapidFire: 10000,      // 10 seconds
            shield: 8000,          // 8 seconds
            multiShot: 12000,      // 12 seconds
            extraLife: -1,         // Permanent
            bomb: 0                // Instant
        };
        return durations[type] || 5000;
    }

    update() {
        this.y += this.speed;
        
        // Remove if off screen
        if (this.y > 650) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();
        
        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        // Draw circle background
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 20, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // White inner circle
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 15, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        
        // Draw icon
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#333';
        ctx.fillText(this.icon, this.x + this.width / 2, this.y + this.height / 2);
        
        ctx.restore();
    }

    /**
     * Check collision with player
     */
    collidesWith(player) {
        return this.x < player.x + player.width &&
               this.x + this.width > player.x &&
               this.y < player.y + player.height &&
               this.y + this.height > player.y;
    }
}

/**
 * Power-up Manager
 */
class PowerUpManager {
    constructor(game) {
        this.game = game;
        this.powerUps = [];
        this.spawnTimer = 0;
        this.spawnInterval = 15000; // Spawn every 15 seconds
    }

    update(deltaTime) {
        // Spawn power-ups
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnPowerUp();
            this.spawnTimer = 0;
        }

        // Update power-ups
        this.powerUps.forEach(powerUp => powerUp.update());
        
        // Remove inactive power-ups
        this.powerUps = this.powerUps.filter(p => p.active);
    }

    draw(ctx) {
        this.powerUps.forEach(powerUp => powerUp.draw(ctx));
    }

    spawnPowerUp() {
        const x = Math.random() * (this.game.width - 40);
        const type = this.getRandomType();
        const powerUp = new PowerUp(x, -40, type);
        this.powerUps.push(powerUp);
        
        // Play power-up spawn sound
        audioManager.play('powerup');
    }

    getRandomType() {
        const types = ['rapidFire', 'shield', 'multiShot', 'extraLife', 'bomb'];
        const weights = [30, 25, 25, 10, 10]; // Different spawn rates
        
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < types.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return types[i];
            }
        }
        
        return types[0];
    }

    checkCollisions(players) {
        this.powerUps.forEach(powerUp => {
            if (!powerUp.active) return;
            
            players.forEach(player => {
                if (player.active && powerUp.collidesWith(player)) {
                    this.applyPowerUp(powerUp, player);
                    powerUp.active = false;
                }
            });
        });
    }

    applyPowerUp(powerUp, player) {
        switch (powerUp.type) {
            case 'rapidFire':
                player.activatePowerUp('rapidFire', powerUp.duration);
                break;
            
            case 'shield':
                player.activatePowerUp('shield', powerUp.duration);
                break;
            
            case 'multiShot':
                player.activatePowerUp('multiShot', powerUp.duration);
                break;
            
            case 'extraLife':
                player.lives++;
                this.game.updateHUD();
                break;
            
            case 'bomb':
                this.game.clearAllEnemies();
                break;
        }

        // Add score for collecting power-up
        this.game.addScore(50);
        
        // Play collection sound
        audioManager.play('powerup');
    }

    clear() {
        this.powerUps = [];
    }
}
