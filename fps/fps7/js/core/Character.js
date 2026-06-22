class Character {
    static allCharacters = [];
    
    constructor(scene, position, team, teamColor) {
        this.scene = scene;
        this.team = team;
        this.teamColor = teamColor;
        this.maxHealth = 10;
        this.health = this.maxHealth;
        this.isDead = false;
        this.skeleton = SkeletonFactory.create(scene, position);
        this.animTime = 0;
        this.isJumping = false;
        this.jumpTime = 0;
        this.jumpHeight = 0;
        this.isCrouching = false;
        this.isLyingDown = false;
        this.isMoving = false;
        
        this.onHealthChange = null;
        
        this.obstacles = [];
        this.collisionRadius = 0.6;
        
        this.collisionCylinder = this.createCollisionCylinder();
        this.skeleton.root.add(this.collisionCylinder);
        
        this.throwAnimState = {
            isPlaying: false,
            time: 0,
            duration: 0.8,
            phase: 0
        };
        
        this.projectiles = [];
        
        Character.allCharacters.push(this);
    }
    
    playGunshot() {
        if (audioManager) {
            audioManager.playGunshot();
        }
    }

    calculateHitRate(target, distance, hitRateConfig) {
        let baseHitRate;
        if (distance < 10) {
            baseHitRate = hitRateConfig.closeRange;
        } else if (distance < 25) {
            baseHitRate = hitRateConfig.midRange;
        } else {
            baseHitRate = hitRateConfig.farRange;
        }

        let finalHitRate = baseHitRate;
        if (target.isMoving) {
            finalHitRate *= hitRateConfig.targetMovePenalty;
        }
        if (this.isMoving) {
            finalHitRate *= hitRateConfig.npcMovePenalty;
        }

        return finalHitRate;
    }

    takeDamage() {
        if (this.isDead) return;
        this.health--;
        if (this.health <= 0) {
            this.isDead = true;
            this.lieDown();
            this.onDeath();
        }
        if (this.onHealthChange) {
            this.onHealthChange(this);
        }
    }

    onDeath() {
    }
    
    getMuzzlePosition() {
        const pos = new THREE.Vector3();
        if (this.skeleton.shoulders) {
            this.skeleton.shoulders.getWorldPosition(pos);
        } else {
            this.skeleton.root.getWorldPosition(pos);
            pos.y = this.isCrouching ? this.crouchHeight * 0.7 : this.standHeight * 0.85;
        }
        return pos;
    }

    checkShotLineOfSight(target, showDebugLine = false) {
        const muzzlePos = this.getMuzzlePosition();
        const targetPos = target.getMuzzlePosition();

        const direction = new THREE.Vector3().subVectors(targetPos, muzzlePos);
        const distance = direction.length();
        direction.normalize();

        const raycaster = new THREE.Raycaster(muzzlePos, direction, 0, distance);
        const intersects = raycaster.intersectObjects(this.obstacles);

        if (showDebugLine) {
            this.showDebugRay(muzzlePos, intersects.length > 0 ? intersects[0].point : targetPos, intersects.length > 0);
        }

        return {
            blocked: intersects.length > 0,
            hitPoint: intersects.length > 0 ? intersects[0].point : null,
            distance: distance
        };
    }

    showDebugRay(startPoint, endPoint, blocked) {
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: blocked ? 0xff0000 : 0x00ff00 
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        this.scene.add(line);
        setTimeout(() => this.scene.remove(line), 200);
    }
    
    setMaxHealth(health) {
        this.maxHealth = health;
        this.health = health;
    }

    addObstacle(mesh) {
        this.obstacles.push(mesh);
    }

    addCharacterCollisionTarget(character) {
        this.characterCollisions = this.characterCollisions || [];
        if (!this.characterCollisions.includes(character)) {
            this.characterCollisions.push(character);
        }
    }

    updateCharacterCollisions() {
        if (!this.characterCollisions || this.characterCollisions.length === 0) {
            return;
        }

        const pos = this.skeleton.root.position;

        for (const otherChar of this.characterCollisions) {
            const otherPos = otherChar.skeleton.root.position;

            const dx = pos.x - otherPos.x;
            const dz = pos.z - otherPos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const minDist = this.collisionRadius + otherChar.collisionRadius;

            if (dist <= 0.001) {
                const randomAngle = Math.random() * Math.PI * 2;
                const pushDistance = minDist * 0.5;
                this.skeleton.root.position.x += Math.sin(randomAngle) * pushDistance;
                this.skeleton.root.position.z += Math.cos(randomAngle) * pushDistance;
                otherChar.skeleton.root.position.x -= Math.sin(randomAngle) * pushDistance;
                otherChar.skeleton.root.position.z -= Math.cos(randomAngle) * pushDistance;
            }
        }
    }

    resolveCharacterCollision(moveVector) {
        if (!this.characterCollisions || this.characterCollisions.length === 0) {
            return moveVector;
        }

        const pos = this.skeleton.root.position;
        let result = moveVector.clone();

        for (const otherChar of this.characterCollisions) {
            const otherPos = otherChar.skeleton.root.position;

            const toOtherX = otherPos.x - pos.x;
            const toOtherZ = otherPos.z - pos.z;
            const distSq = toOtherX * toOtherX + toOtherZ * toOtherZ;
            const dist = Math.sqrt(distSq);
            const minDist = this.collisionRadius + otherChar.collisionRadius;

            if (dist < minDist && dist > 0.001) {
                const dot = result.x * toOtherX + result.z * toOtherZ;

                if (dot > 0) {
                    const toOtherNX = toOtherX / dist;
                    const toOtherNZ = toOtherZ / dist;

                    const towardsAmount = dot / dist;
                    result.x -= towardsAmount * toOtherNX;
                    result.z -= towardsAmount * toOtherNZ;
                }
            }
        }

        return result;
    }
    
    resolveCollision(moveVector) {
        const pos = this.skeleton.root.position;
        let result = moveVector.clone();
        
        result = this.resolveCharacterCollision(result);
        
        for (const obstacle of this.obstacles) {
            const box = new THREE.Box3().setFromObject(obstacle);
            
            const minX = box.min.x - this.collisionRadius;
            const maxX = box.max.x + this.collisionRadius;
            const minZ = box.min.z - this.collisionRadius;
            const maxZ = box.max.z + this.collisionRadius;
            
            const newPos = new THREE.Vector3(
                pos.x + result.x,
                pos.y,
                pos.z + result.z
            );
            
            const inXRange = newPos.x >= minX && newPos.x <= maxX;
            const inZRange = newPos.z >= minZ && newPos.z <= maxZ;
            
            if (inXRange && inZRange) {
                const prevX = pos.x;
                const prevZ = pos.z;
                
                const testX = new THREE.Vector3(prevX + result.x, pos.y, prevZ);
                const inXRangeX = testX.x >= minX && testX.x <= maxX;
                const inZRangeX = testX.z >= minZ && testX.z <= maxZ;
                
                const testZ = new THREE.Vector3(prevX, pos.y, prevZ + result.z);
                const inXRangeZ = testZ.x >= minX && testZ.x <= maxX;
                const inZRangeZ = testZ.z >= minZ && testZ.z <= maxZ;
                
                if (inXRangeX && inZRangeX && !(inXRangeZ && inZRangeZ)) {
                    result.x = 0;
                } else if (!(inXRangeX && inZRangeX) && inXRangeZ && inZRangeZ) {
                    result.z = 0;
                } else {
                    result.x = 0;
                    result.z = 0;
                }
            }
        }
        
        return result;
    }
    
    createCollisionCylinder() {
        this.standHeight = SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength + SKELETON_CONFIG.torsoLength + SKELETON_CONFIG.headRadius * 2;
        this.crouchHeight = SKELETON_CONFIG.thighLength + SKELETON_CONFIG.torsoLength + SKELETON_CONFIG.headRadius * 2;
        const radius = this.collisionRadius;
        
        const geometry = new THREE.CylinderGeometry(radius, radius, this.standHeight, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0x888888,
            transparent: true,
            opacity: 0.3,
            depthWrite: false,
            visible: false
        });
        
        const cylinder = new THREE.Mesh(geometry, material);
        cylinder.position.y = this.standHeight / 2 - (SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength);
        
        return cylinder;
    }
    
    updateCollisionCylinder() {
        if (this.isCrouching) {
            const scale = this.crouchHeight / this.standHeight;
            this.collisionCylinder.scale.y = scale;
            this.collisionCylinder.position.y = this.crouchHeight / 2 - SKELETON_CONFIG.thighLength;
        } else {
            this.collisionCylinder.scale.y = 1;
            this.collisionCylinder.position.y = this.standHeight / 2 - (SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength);
        }
    }

    update(deltaTime) {
        this.animTime += deltaTime * CHARACTER_CONFIG.animSpeed;
        
        this.updateJump(deltaTime);
        this.updateCollisionCylinder();
        this.updateCharacterCollisions();
        this.updateProjectiles(deltaTime);
        this.updateExplosions(deltaTime);
        
        if (this.isLyingDown) {
            this.setLieDownPose();
        } else if (this.isMoving) {
            this.setRunningPose(this.animTime);
        } else if (this.isCrouching) {
            this.setCrouchPose();
        } else {
            this.setStandPose();
        }
    }

    move(direction, deltaTime, speed = CHARACTER_CONFIG.moveSpeed) {
        if (this.isCrouching) return;
        
        const moveVector = direction.clone().normalize().multiplyScalar(speed * deltaTime);
        const resolvedMove = this.resolveCollision(moveVector);
        this.skeleton.root.position.x += resolvedMove.x;
        this.skeleton.root.position.z += resolvedMove.z;
        this.isMoving = true;
    }

    stop() {
        this.isMoving = false;
    }

    faceDirection(direction) {
        const angle = Math.atan2(direction.x, direction.z);
        this.skeleton.root.rotation.y = angle;
    }

    stand() {
        if (this.isCrouching) {
            this.skeleton.root.position.y += SKELETON_CONFIG.shinLength;
        }
        this.isCrouching = false;
        this.isMoving = false;
    }

    crouch() {
        if (!this.isCrouching) {
            this.skeleton.root.position.y -= SKELETON_CONFIG.shinLength;
        }
        this.isCrouching = true;
        this.isMoving = false;
    }

    lieDown() {
        this.isCrouching = false;
        this.isMoving = false;
        this.isLyingDown = true;
    }

    run() {
        this.isCrouching = false;
        this.isMoving = true;
    }

    updatePose(gunAngle) {
        SkeletonAnimator.updatePose(this.skeleton, gunAngle);
    }

    setStandPose() {
        SkeletonAnimator.setStandPose(this.skeleton);
    }

    setRunningPose(animTime) {
        SkeletonAnimator.setRunningPose(this.skeleton, animTime);
    }

    setCrouchPose() {
        SkeletonAnimator.setCrouchPose(this.skeleton);
    }

    setJumpPose(jumpHeight) {
        SkeletonAnimator.setJumpPose(this.skeleton, jumpHeight);
    }

    createLabel(text, color, size = { width: 128, height: 64 }) {
        const canvas = document.createElement('canvas');
        canvas.width = size.width;
        canvas.height = size.height;
        const context = canvas.getContext('2d');
        
        context.fillStyle = color;
        context.fillRect(0, 0, size.width, size.height);
        
        context.fillStyle = '#ffffff';
        const fontSize = Math.min(size.width, size.height) * 0.5;
        context.font = `bold ${fontSize}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, size.width / 2, size.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(size.width / 100, size.height / 100, 1);
        
        return sprite;
    }

    setLieDownPose() {
        SkeletonAnimator.setLieDownPose(this.skeleton);
    }

    updateLabel() {
    }

    getPosition() {
        return this.skeleton.root.position;
    }

    setPosition(x, y, z) {
        this.skeleton.root.position.set(x, y, z);
    }

    updateJump(deltaTime, jumpDuration = CHARACTER_CONFIG.jumpDuration) {
        if (this.isJumping) {
            this.jumpTime += deltaTime;
            if (this.jumpTime >= jumpDuration) {
                this.isJumping = false;
                this.jumpTime = 0;
                this.jumpHeight = 0;
            } else {
                this.jumpHeight = Math.sin(this.jumpTime / jumpDuration * Math.PI) * CHARACTER_CONFIG.jumpHeight;
            }
        }
    }

    applyJumpPose() {
        if (this.isJumping) {
            this.setJumpPose(this.jumpHeight);
        }
    }

    updateGunPose(animTime, amplitude = CHARACTER_CONFIG.gunAngleAmplitude, frequency = CHARACTER_CONFIG.gunAngleFrequency) {
        const gunAngle = Math.sin(animTime * frequency) * amplitude;
        this.updatePose(gunAngle);
    }

    setAimPose(targetDir) {
        const gunAngle = -THREE.MathUtils.radToDeg(Math.atan2(targetDir.y, Math.sqrt(targetDir.x * targetDir.x + targetDir.z * targetDir.z)));
        this.updatePose(gunAngle);
    }

    playThrowAnimation(deltaTime) {
        if (!this.throwAnimState.isPlaying) {
            return;
        }

        this.throwAnimState.time += deltaTime;
        const progress = this.throwAnimState.time / this.throwAnimState.duration;

        if (progress >= 1.0) {
            this.throwAnimState.isPlaying = false;
            this.throwAnimState.time = 0;
            this.throwAnimState.projectileThrown = false;
            
            this.updatePose(0);
            return;
        }

        const rightUpperArm = this.skeleton.rightUpperArm;
        const rightForearm = this.skeleton.rightForearm;

        if (progress < 0.5) {
            const phaseProgress = progress / 0.5;
            const smoothProgress = phaseProgress * phaseProgress * (3 - 2 * phaseProgress);

            rightUpperArm.rotation.set(0, 0, 0);
            rightUpperArm.rotation.x = -Math.PI * 0.5 * smoothProgress;

            rightForearm.rotation.set(0, 0, 0);
            rightForearm.rotation.x = -Math.PI * 0.3 * smoothProgress;

        } else {
            const phaseProgress = (progress - 0.5) / 0.5;
            const smoothProgress = phaseProgress * phaseProgress * (3 - 2 * phaseProgress);

            rightUpperArm.rotation.set(0, 0, 0);
            rightUpperArm.rotation.x = -Math.PI * 0.5 + Math.PI * 0.5 * smoothProgress;

            rightForearm.rotation.set(0, 0, 0);
            rightForearm.rotation.x = -Math.PI * 0.3 + Math.PI * 0.3 * smoothProgress;
        }
    }

    startThrowAnimation() {
        if (this.throwAnimState.isPlaying) {
            return;
        }
        this.throwAnimState.isPlaying = true;
        this.throwAnimState.time = 0;
        this.onThrowAnimationStart();
    }

    onThrowAnimationStart() {
    }

    throwProjectile(distance, targetPosition = null) {
        const muzzlePos = this.getMuzzlePosition();
        
        let targetPos, finalDistance;
        
        if (targetPosition) {
            targetPos = targetPosition.clone();
            const horizontalDist = Math.sqrt(
                Math.pow(targetPos.x - muzzlePos.x, 2) + 
                Math.pow(targetPos.z - muzzlePos.z, 2)
            );
            finalDistance = Math.max(5, Math.min(20, horizontalDist));
            
            const direction = new THREE.Vector3(
                targetPos.x - muzzlePos.x,
                0,
                targetPos.z - muzzlePos.z
            ).normalize();
            
            targetPos.x = muzzlePos.x + direction.x * finalDistance;
            targetPos.z = muzzlePos.z + direction.z * finalDistance;
            targetPos.y = muzzlePos.y;
        } else {
            const forward = new THREE.Vector3(0, 0, 1);
            forward.applyQuaternion(this.skeleton.root.quaternion);
            forward.y = 0;
            forward.normalize();
            
            targetPos = new THREE.Vector3(
                muzzlePos.x + forward.x * distance,
                muzzlePos.y,
                muzzlePos.z + forward.z * distance
            );
            finalDistance = distance;
        }
        
        const gravity = 9.8;
        const launchAngle = Math.PI / 4;
        
        const v = Math.sqrt(gravity * finalDistance);
        
        const horizontalDir = new THREE.Vector3(
            targetPos.x - muzzlePos.x,
            0,
            targetPos.z - muzzlePos.z
        ).normalize();
        
        const initialVelocity = new THREE.Vector3(
            horizontalDir.x * v * Math.cos(launchAngle),
            v * Math.sin(launchAngle),
            horizontalDir.z * v * Math.cos(launchAngle)
        );
        
        const projectileGeometry = new THREE.SphereGeometry(0.075, 16, 16);
        const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
        projectile.position.copy(muzzlePos);
        this.scene.add(projectile);
        
        this.projectiles.push({
            mesh: projectile,
            velocity: initialVelocity,
            time: 0,
            active: true,
            exploded: false
        });
    }

    createExplosionEffect(position) {
        const explosionGroup = new THREE.Group();
        explosionGroup.position.copy(position);
        
        const particleCount = 20;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const size = 0.1 + Math.random() * 0.2;
            const particleGeometry = new THREE.SphereGeometry(size, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({ 
                color: new THREE.Color().setHSL(0.05 + Math.random() * 0.1, 1, 0.5 + Math.random() * 0.3),
                transparent: true,
                opacity: 1
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            const direction = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 0.8 + 0.2,
                (Math.random() - 0.5) * 2
            ).normalize();
            
            particle.userData.velocity = direction.multiplyScalar(2 + Math.random() * 3);
            particle.userData.life = 0.5 + Math.random() * 0.5;
            particle.userData.age = 0;
            
            explosionGroup.add(particle);
            particles.push(particle);
        }
        
        const flashGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const flashMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 1
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        explosionGroup.add(flash);
        particles.push(flash);
        
        this.scene.add(explosionGroup);
        
        return {
            group: explosionGroup,
            particles: particles,
            age: 0,
            duration: 1.0
        };
    }

    updateExplosions(deltaTime) {
        if (!this.explosions) {
            this.explosions = [];
        }
        
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.age += deltaTime;
            
            if (explosion.age >= explosion.duration) {
                this.scene.remove(explosion.group);
                explosion.group.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                this.explosions.splice(i, 1);
                continue;
            }
            
            const progress = explosion.age / explosion.duration;
            
            explosion.particles.forEach(particle => {
                if (particle.userData.velocity) {
                    particle.userData.age += deltaTime;
                    particle.position.add(particle.userData.velocity.clone().multiplyScalar(deltaTime));
                    particle.userData.velocity.y -= 9.8 * deltaTime * 0.3;
                    
                    const lifeProgress = particle.userData.age / particle.userData.life;
                    particle.material.opacity = Math.max(0, 1 - lifeProgress);
                } else {
                    const flashProgress = progress;
                    particle.material.opacity = Math.max(0, 1 - flashProgress * 2);
                    particle.scale.setScalar(1 + flashProgress * 3);
                }
            });
        }
    }

    triggerExplosion(position) {
        if (audioManager && audioManager.playExplosion) {
            audioManager.playExplosion();
        }
        
        const explosion = this.createExplosionEffect(position);
        if (!this.explosions) {
            this.explosions = [];
        }
        this.explosions.push(explosion);
        
        const innerRadius = 1;
        const outerRadius = 2.5;
        const segments = 36;
        const angleStep = (Math.PI * 2) / segments;
        
        const explosionCenter = new THREE.Vector3(position.x, 0.1, position.z);
        
        for (let i = 0; i < segments; i++) {
            const angle = i * angleStep;
            const nextAngle = (i + 1) * angleStep;
            
            const innerStart = new THREE.Vector3(
                explosionCenter.x + Math.cos(angle) * innerRadius,
                0.05,
                explosionCenter.z + Math.sin(angle) * innerRadius
            );
            const innerEnd = new THREE.Vector3(
                explosionCenter.x + Math.cos(nextAngle) * innerRadius,
                0.05,
                explosionCenter.z + Math.sin(nextAngle) * innerRadius
            );
            const outerStart = new THREE.Vector3(
                explosionCenter.x + Math.cos(angle) * outerRadius,
                0.05,
                explosionCenter.z + Math.sin(angle) * outerRadius
            );
            const outerEnd = new THREE.Vector3(
                explosionCenter.x + Math.cos(nextAngle) * outerRadius,
                0.05,
                explosionCenter.z + Math.sin(nextAngle) * outerRadius
            );
            
            const midAngle = (angle + nextAngle) / 2;
            const outerCheck = new THREE.Vector3(
                explosionCenter.x + Math.cos(midAngle) * outerRadius,
                0.1,
                explosionCenter.z + Math.sin(midAngle) * outerRadius
            );
            const innerCheck = new THREE.Vector3(
                explosionCenter.x + Math.cos(midAngle) * innerRadius,
                0.1,
                explosionCenter.z + Math.sin(midAngle) * innerRadius
            );
            
            const direction = new THREE.Vector3().subVectors(outerCheck, explosionCenter).normalize();
            const raycaster = new THREE.Raycaster(explosionCenter.clone(), direction, 0, outerRadius + 0.5);
            const intersects = raycaster.intersectObjects(this.obstacles);
            
            let isOuterBlocked = false;
            let isInnerBlocked = false;
            
            if (intersects.length > 0) {
                const hitDist = intersects[0].distance;
                isOuterBlocked = hitDist < outerRadius;
                isInnerBlocked = hitDist < innerRadius;
            }
            
            if (!isInnerBlocked) {
                const innerGeometry = new THREE.BufferGeometry();
                const vertices = new Float32Array([
                    explosionCenter.x, 0.05, explosionCenter.z,
                    innerStart.x, innerStart.y, innerStart.z,
                    innerEnd.x, innerEnd.y, innerEnd.z
                ]);
                innerGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                const innerMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xff0000, 
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.6
                });
                const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
                this.scene.add(innerMesh);
                
                setTimeout(() => {
                    this.scene.remove(innerMesh);
                    innerGeometry.dispose();
                    innerMaterial.dispose();
                }, 2000);
            }
            
            if (!isOuterBlocked) {
                const outerGeometry = new THREE.BufferGeometry();
                const vertices = new Float32Array([
                    innerStart.x, innerStart.y, innerStart.z,
                    outerStart.x, outerStart.y, outerStart.z,
                    outerEnd.x, outerEnd.y, outerEnd.z,
                    innerStart.x, innerStart.y, innerStart.z,
                    outerEnd.x, outerEnd.y, outerEnd.z,
                    innerEnd.x, innerEnd.y, innerEnd.z
                ]);
                outerGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                const outerMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xffaa00, 
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.6
                });
                const outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
                this.scene.add(outerMesh);
                
                setTimeout(() => {
                    this.scene.remove(outerMesh);
                    outerGeometry.dispose();
                    outerMaterial.dispose();
                }, 2000);
            }
        }

        for (const character of Character.allCharacters) {
            if (character === this || character.isDead) continue;
            
            const charPos = character.skeleton.root.position.clone();
            charPos.y = 0;
            const distToExplosion = explosionCenter.distanceTo(charPos);

            if (distToExplosion <= outerRadius) {
                const charDir = new THREE.Vector3().subVectors(charPos, explosionCenter).normalize();
                const charRaycaster = new THREE.Raycaster(explosionCenter.clone(), charDir, 0, distToExplosion);
                const charIntersects = charRaycaster.intersectObjects(this.obstacles);

                if (charIntersects.length === 0) {
                    if (distToExplosion <= innerRadius) {
                        character.takeDamage(2);
                    } else {
                        character.takeDamage(1);
                    }
                }
            }
        }
    }

    updateProjectiles(deltaTime) {
        const gravity = 9.8;
        
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            if (!proj.active || proj.exploded) continue;
            
            proj.time += deltaTime;
            
            proj.velocity.y -= gravity * deltaTime;
            
            proj.mesh.position.x += proj.velocity.x * deltaTime;
            proj.mesh.position.y += proj.velocity.y * deltaTime;
            proj.mesh.position.z += proj.velocity.z * deltaTime;
            
            if (proj.mesh.position.y <= 0.15) {
                proj.mesh.position.y = 0.15;
                this.triggerExplosion(proj.mesh.position.clone());
                this.removeProjectile(proj);
                continue;
            }
            
            const raycaster = new THREE.Raycaster(
                proj.mesh.position.clone().sub(new THREE.Vector3(proj.velocity.x, proj.velocity.y, proj.velocity.z).normalize().multiplyScalar(0.1)),
                new THREE.Vector3(proj.velocity.x, proj.velocity.y, proj.velocity.z).normalize(),
                0,
                proj.velocity.length() * deltaTime + 0.2
            );
            
            const intersects = raycaster.intersectObjects(this.obstacles);
            if (intersects.length > 0) {
                this.triggerExplosion(intersects[0].point.clone());
                this.removeProjectile(proj);
            }
        }
    }

    removeProjectile(proj) {
        proj.active = false;
        this.scene.remove(proj.mesh);
        proj.mesh.geometry.dispose();
        proj.mesh.material.dispose();
        const index = this.projectiles.indexOf(proj);
        if (index > -1) {
            this.projectiles.splice(index, 1);
        }
    }
}
