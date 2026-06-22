class NPC extends Character {
    constructor(scene, position, aggressionMode = 'aggressive') {
        super(scene, position);
        this.health = 3;
        this.isDead = false;
        this.aggressionMode = aggressionMode;
        this.coverSeekRange = 15;
        this.avoidObstacleTimer = 0;
        this.avoidObstacleDirection = null;
        this.aimTarget = null;
        
        this.skeleton.root.rotation.y = Math.PI;
        
        this.label = this.createLabel();
        this.skeleton.root.add(this.label);
    }

    setAimTarget(target) {
        this.aimTarget = target;
    }

    update(deltaTime) {
        this.animTime += deltaTime * CHARACTER_CONFIG.animSpeed;
        
        this.updateJump(deltaTime);
        this.updateCollisionCylinder();
        this.updateCharacterCollisions();
        
        if (this.isLyingDown) {
            this.setLieDownPose();
        } else if (this.isMoving) {
            this.setRunningPose(this.animTime);
        } else if (this.isCrouching) {
            this.setCrouchPose();
            if (this.aimTarget) {
                const direction = new THREE.Vector3().subVectors(this.aimTarget, this.skeleton.root.position);
                direction.y = 0;
                this.faceDirection(direction);
                this.setAimPose(direction);
            }
        } else {
            this.setStandPose();
        }
    }

    createLabel() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        context.fillStyle = this.aggressionMode === 'aggressive' ? '#ff4444' : '#4444ff';
        context.fillRect(0, 0, 64, 64);
        
        context.fillStyle = '#ffffff';
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(this.aggressionMode === 'aggressive' ? 'A' : 'C', 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(0.8, 0.8, 1);
        sprite.position.y = this.standHeight + 0.5;
        
        return sprite;
    }

    updateLabel() {
        if (this.label) {
            this.label.position.y = (this.isCrouching ? this.crouchHeight : this.standHeight) + 0.5;
        }
    }

    takeDamage() {
        if (this.isDead) return;
        this.health--;
        if (this.health <= 0) {
            this.isDead = true;
            this.lieDown();
            if (this.label) {
                this.label.visible = false;
            }
        }
    }

    patrolTowards(target, deltaTime) {
        const direction = new THREE.Vector3().subVectors(target, this.skeleton.root.position);
        direction.y = 0;

        if (direction.length() > 2) {
            this.run();
            this.move(direction, deltaTime, CHARACTER_CONFIG.moveSpeed * 0.5);
            this.faceDirection(direction);
        } else {
            this.stand();
        }
    }

    chaseTowards(target, deltaTime) {
        const direction = new THREE.Vector3().subVectors(target, this.skeleton.root.position);
        direction.y = 0;

        this.run();
        this.move(direction, deltaTime);
        this.faceDirection(direction);
    }

    strafeAround(target, deltaTime, strafeDirection) {
        const direction = new THREE.Vector3().subVectors(target, this.skeleton.root.position);
        direction.y = 0;
        direction.normalize();

        this.faceDirection(direction);

        const strafeDir = new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(strafeDirection);
        this.move(strafeDir, deltaTime, CHARACTER_CONFIG.moveSpeed * 0.3);
    }

    moveToTarget(target, deltaTime, minDistance = 1.5) {
        const direction = new THREE.Vector3().subVectors(target, this.skeleton.root.position);
        direction.y = 0;

        if (direction.length() > minDistance) {
            this.run();
            this.move(direction, deltaTime);
            this.faceDirection(direction);
        } else {
            this.crouch();
        }
    }

    retreatFrom(target, deltaTime) {
        const direction = new THREE.Vector3().subVectors(this.skeleton.root.position, target);
        direction.y = 0;

        if (direction.length() > 2) {
            this.run();
            this.move(direction, deltaTime, CHARACTER_CONFIG.moveSpeed * 0.6);
            const faceTarget = new THREE.Vector3().subVectors(target, this.skeleton.root.position);
            faceTarget.y = 0;
            this.faceDirection(faceTarget);
        }
    }

    slideAlongObstacle(targetPos, deltaTime) {
        const npcPos = this.skeleton.root.position;
        const toTarget = new THREE.Vector3().subVectors(targetPos, npcPos);
        toTarget.y = 0;
        toTarget.normalize();

        const perpendicularLeft = new THREE.Vector3(-toTarget.z, 0, toTarget.x);
        const perpendicularRight = new THREE.Vector3(toTarget.z, 0, -toTarget.x);

        let closestObstacle = null;
        let closestDist = Infinity;

        for (const obstacle of this.obstacles) {
            const box = new THREE.Box3().setFromObject(obstacle);
            const center = new THREE.Vector3();
            box.getCenter(center);

            const toObstacle = new THREE.Vector3().subVectors(center, npcPos);
            toObstacle.y = 0;
            const obstacleDist = toObstacle.length();

            if (obstacleDist < closestDist && obstacleDist < 3) {
                closestDist = obstacleDist;
                closestObstacle = { box, center, dist: obstacleDist };
            }
        }

        if (!closestObstacle) {
            return false;
        }

        const toObstacleDir = new THREE.Vector3().subVectors(closestObstacle.center, npcPos).normalize();

        const slideDir = new THREE.Vector3(-toObstacleDir.z, 0, toObstacleDir.x);

        const leftTargetDist = npcPos.clone().add(slideDir.clone().multiplyScalar(2)).distanceTo(targetPos);
        const rightTargetDist = npcPos.clone().add(slideDir.clone().multiplyScalar(-2)).distanceTo(targetPos);

        const finalSlideDir = leftTargetDist < rightTargetDist ? slideDir : slideDir.clone().negate();

        this.run();
        this.move(finalSlideDir, deltaTime, CHARACTER_CONFIG.moveSpeed * 0.4);
        this.faceDirection(finalSlideDir);
        return true;
    }

    avoidObstacle(target, deltaTime, speed, enemyTarget) {
        const npcPos = this.skeleton.root.position;
        const toTarget = new THREE.Vector3().subVectors(target, npcPos);
        toTarget.y = 0;
        const distToTarget = toTarget.length();

        if (distToTarget < 1.5) {
            this.avoidObstacleDirection = null;
            return;
        }

        toTarget.normalize();

        this.avoidObstacleTimer -= deltaTime;

        if (this.avoidObstacleTimer <= 0) {
            this.avoidObstacleTimer = 0.2;

            const raycaster = new THREE.Raycaster(npcPos.clone().add(new THREE.Vector3(0, 1, 0)), toTarget, 0, distToTarget);
            const intersects = raycaster.intersectObjects(this.obstacles);

            if (intersects.length > 0) {
                if (!this.avoidObstacleDirection) {
                    const obstacle = intersects[0].object;
                    const box = new THREE.Box3().setFromObject(obstacle);
                    const size = box.getSize(new THREE.Vector3());

                    const isLongerInX = size.x > size.z;
                    const parallelDir = isLongerInX ? 
                        new THREE.Vector3(1, 0, 0) : 
                        new THREE.Vector3(0, 0, 1);

                    const leftTarget = npcPos.clone().add(parallelDir.clone().multiplyScalar(2));
                    const rightTarget = npcPos.clone().add(parallelDir.clone().multiplyScalar(-2));
                    const leftDist = leftTarget.distanceTo(target);
                    const rightDist = rightTarget.distanceTo(target);

                    this.avoidObstacleDirection = leftDist < rightDist ? parallelDir : parallelDir.clone().negate();
                }
            } else {
                this.avoidObstacleDirection = null;
            }
        }

        const moveDir = this.avoidObstacleDirection || toTarget;
        this.run();
        this.move(moveDir, deltaTime, speed);
        
        if (enemyTarget) {
            const toEnemy = new THREE.Vector3().subVectors(enemyTarget, npcPos);
            toEnemy.y = 0;
            this.faceDirection(toEnemy);
        } else {
            this.faceDirection(toTarget);
        }
    }
}
