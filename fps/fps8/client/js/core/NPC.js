class NPC extends Character {
    constructor(scene, position, team, teamColor, npcId = 1) {
        super(scene, position, team, teamColor);
        this.npcId = npcId;
        this.coverSeekRange = 15;
        this.avoidObstacleTimer = 0;
        this.avoidObstacleDirection = null;
        this.aimTarget = null;
        
        this.grenadeCount = 3;
        this.grenadeCooldown = 5 + Math.random() * 15;
        
        this.skeleton.root.rotation.y = Math.PI;
        
        const hexColor = '#' + this.teamColor.toString(16).padStart(6, '0');
        this.label = this.createLabel(this.npcId.toString(), hexColor, { width: 64, height: 64 });
        this.label.scale.set(0.32, 0.32, 1);
        this.label.position.y = SKELETON_CONFIG.torsoLength + SKELETON_CONFIG.headRadius * 2 + 0.3;
        this.skeleton.root.add(this.label);
        
        this.players = [];
    }

    getPosition() {
        return this.skeleton.root.position;
    }

    getObstacles() {
        return this.obstacles;
    }

    getCollisionRadius() {
        return this.collisionRadius;
    }

    setAimTarget(target) {
        this.aimTarget = target;
    }

    getAimTarget() {
        return this.aimTarget;
    }

    getPlayers() {
        return this.players;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        if (this.isLyingDown) {
            this.setLieDownPose();
        } else if (this.throwAnimState.isPlaying) {
            this.playThrowAnimation(deltaTime);
        } else if (this.isMoving) {
            this.setRunningPose(this.animTime);
        } else if (this.isCrouching) {
            this.setCrouchPose();
        } else {
            this.setStandPose();
        }

        if (this.aimTarget) {
            const direction = new THREE.Vector3().subVectors(this.aimTarget, this.skeleton.root.position);
            direction.y = 0;
            this.faceDirection(direction);
            this.setAimPose(direction);
        }
    }

    updateLabel() {
        if (this.label) {
            const headTop = this.isCrouching ? (SKELETON_CONFIG.torsoLength + SKELETON_CONFIG.headRadius * 2) : (SKELETON_CONFIG.torsoLength + SKELETON_CONFIG.headRadius * 2);
            this.label.position.y = headTop + 0.3;
        }
    }

    onDeath() {
        if (this.label) {
            this.label.visible = false;
        }
    }

    throwGrenade(target) {
        if (this.grenadeCount <= 0 || this.throwAnimState.isPlaying) {
            return false;
        }
        
        const targetPos = target.skeleton.root.position.clone();
        targetPos.y = 0;
        
        const npcPos = this.skeleton.root.position.clone();
        npcPos.y = 0;
        const direction = new THREE.Vector3().subVectors(targetPos, npcPos).normalize();
        this.faceDirection(direction);
        
        this.startThrowAnimation();
        this.throwProjectile(15, targetPos);
        this.grenadeCount--;

        return true;
    }

    receiveGrenadeThrow(targetPositionArray) {
        if (this.grenadeCount <= 0 || this.throwAnimState.isPlaying) {
            return false;
        }

        const targetPos = new THREE.Vector3(
            targetPositionArray[0],
            0,
            targetPositionArray[2]
        );

        const npcPos = this.skeleton.root.position.clone();
        npcPos.y = 0;
        const direction = new THREE.Vector3().subVectors(targetPos, npcPos).normalize();
        this.faceDirection(direction);

        this.startThrowAnimation();
        this.throwProjectile(15, targetPos);
        this.grenadeCount--;

        return true;
    }

    updateGrenadeCooldown(deltaTime) {
        this.grenadeCooldown -= deltaTime;
    }

    canThrowGrenade(target) {
        if (this.grenadeCooldown > 0 || this.grenadeCount <= 0 || !target || target.isDead) {
            return false;
        }
        
        const distToTarget = this.skeleton.root.position.distanceTo(target.skeleton.root.position);
        return distToTarget >= 5 && distToTarget <= 20;
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
