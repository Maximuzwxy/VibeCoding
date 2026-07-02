class NPCAI {
    constructor(npc, target, hitRateConfig) {
        this.npc = npc;
        this.target = target;
        this.hitRate = hitRateConfig || {
            closeRange: 0.8,
            midRange: 0.5,
            farRange: 0.2,
            targetMovePenalty: 0.5,
            npcMovePenalty: 0.5
        };
        this.state = 'NAVIGATING';
        this.stateTime = 0;
        this.shootCooldown = 0;
        this.shootInterval = 1.0;
        this.detectionRange = 60;
        this.strafeTimer = 0;
        this.strafeDirection = 1;
        this.covers = [];
        this.visitedCovers = [];
        this.currentCover = null;
        this.coverPos = null;
        this.coverWaitTimer = 0;
        this.isPeeking = false;
        this.targetSelectionTimer = 0;
        this.lastNpcPos = new THREE.Vector3();
        this.stuckTimer = 0;
        this.isSliding = false;
        this.slideTimer = 0;
        this.slideTarget = null;
        this.grenadeCooldown = 5 + Math.random() * 15;
        this.canSeeTarget = false;
        this.targetLostTimer = 0;
        this.coverCrouchTimer = 0;
        this.coverMovingTimer = 0;
        this.movingDirection = null;
        this.movingTargetPos = null;
        this.isCrouchShooting = false;
        this.initCovers();
    }

    initCovers() {
        const obstacles = this.npc.getObstacles ? this.npc.getObstacles() : this.npc.obstacles;
        if (obstacles && obstacles.length > 0) {
            this.covers = obstacles.filter(obj => {
                const box = new THREE.Box3().setFromObject(obj);
                const size = box.getSize(new THREE.Vector3());
                return size.y >= 1.0 && size.y <= 3.0;
            });
        }
    }

    getNpcPosition() {
        return this.npc.getPosition ? this.npc.getPosition() : this.npc.skeleton.root.position;
    }

    getTargetPosition(target) {
        return target.getPosition ? target.getPosition() : target.skeleton.root.position;
    }

    getNpcPlayers() {
        return this.npc.getPlayers ? this.npc.getPlayers() : this.npc.players;
    }

    ensureCoversInitialized() {
        if (this.covers.length === 0) {
            this.initCovers();
        }
    }

    findNearestTarget() {
        const players = this.getNpcPlayers();
        if (!players || players.length === 0) {
            return null;
        }

        let nearestTarget = null;
        let nearestDist = Infinity;
        const npcPos = this.getNpcPosition();

        for (const potentialTarget of players) {
            if (potentialTarget.isDead) continue;
            if (potentialTarget.team === this.npc.team) continue;

            const dist = npcPos.distanceTo(this.getTargetPosition(potentialTarget));
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestTarget = potentialTarget;
            }
        }

        return nearestTarget;
    }

    checkLineOfSight() {
        if (!this.target || this.target.isDead) {
            return false;
        }

        const shotResult = this.npc.checkShotLineOfSight(this.target, false);
        return !shotResult.blocked;
    }

    findBestCover() {
        this.ensureCoversInitialized();
        
        if (this.covers.length === 0) {
            return null;
        }

        const npcPos = this.getNpcPosition();
        const targetPos = this.getTargetPosition(this.target);
        const toTargetDir = new THREE.Vector3().subVectors(targetPos, npcPos).normalize();
        const distToTarget = npcPos.distanceTo(targetPos);

        let bestCover = null;
        let bestScore = -Infinity;

        this.covers.forEach(cover => {
            if (this.visitedCovers.includes(cover)) {
                return;
            }

            const coverPos = new THREE.Vector3();
            cover.getWorldPosition(coverPos);

            const toCoverDir = new THREE.Vector3().subVectors(coverPos, npcPos).normalize();
            const dotProduct = toTargetDir.dot(toCoverDir);

            if (dotProduct < 0.5) {
                return;
            }

            const distToCover = npcPos.distanceTo(coverPos);
            if (distToCover > distToTarget) {
                return;
            }

            const score = dotProduct * 10 - distToCover * 0.1;

            if (score > bestScore) {
                bestScore = score;
                bestCover = cover;
            }
        });

        return bestCover;
    }

    calculateCoverPosition(cover) {
        const coverPos = new THREE.Vector3();
        cover.getWorldPosition(coverPos);

        const targetPos = this.getTargetPosition(this.target);
        const toTargetDir = new THREE.Vector3().subVectors(targetPos, coverPos).normalize();

        const box = new THREE.Box3().setFromObject(cover);
        const size = box.getSize(new THREE.Vector3());
        const halfDepth = Math.max(size.x, size.z) / 2;

        const behindCoverPos = coverPos.clone().add(
            toTargetDir.clone().multiplyScalar(-(halfDepth + this.npc.collisionRadius + 0.5))
        );

        return behindCoverPos;
    }

    selectStrafeDirection() {
        return Math.random() > 0.5 ? 1 : -1;
    }

    selectRetreatDirection() {
        const npcPos = this.getNpcPosition();
        const targetPos = this.getTargetPosition(this.target);
        const toTargetDir = new THREE.Vector3().subVectors(targetPos, npcPos).normalize();

        const perpendicularLeft = new THREE.Vector3(-toTargetDir.z, 0, toTargetDir.x);
        const perpendicularRight = new THREE.Vector3(toTargetDir.z, 0, -toTargetDir.x);

        const leftTarget = npcPos.clone().add(perpendicularLeft.clone().multiplyScalar(3));
        const rightTarget = npcPos.clone().add(perpendicularRight.clone().multiplyScalar(3));

        const leftDist = leftTarget.distanceTo(targetPos);
        const rightDist = rightTarget.distanceTo(targetPos);

        return leftDist < rightDist ? 1 : -1;
    }

    handleStuckDetection(deltaTime, targetPos) {
        const currentPos = this.getNpcPosition().clone();
        const posDiff = currentPos.distanceTo(this.lastNpcPos);

        if (posDiff < 0.05) {
            this.stuckTimer += deltaTime;
        } else {
            this.stuckTimer = 0;
        }
        this.lastNpcPos.copy(currentPos);

        if (this.stuckTimer > 0.3 && !this.isSliding) {
            this.isSliding = true;
            this.slideTimer = 0;

            const toTargetDir = new THREE.Vector3().subVectors(targetPos, currentPos).normalize();
            const perpendicularLeft = new THREE.Vector3(-toTargetDir.z, 0, toTargetDir.x);
            const perpendicularRight = new THREE.Vector3(toTargetDir.z, 0, -toTargetDir.x);

            const leftTarget = currentPos.clone().add(perpendicularLeft.clone().multiplyScalar(2));
            const rightTarget = currentPos.clone().add(perpendicularRight.clone().multiplyScalar(2));

            const leftDist = leftTarget.distanceTo(targetPos);
            const rightDist = rightTarget.distanceTo(targetPos);

            this.slideTarget = leftDist < rightDist ? leftTarget : rightTarget;
        }

        if (this.isSliding) {
            this.slideTimer += deltaTime;

            if (this.slideTimer > 0.5) {
                this.isSliding = false;
                this.slideTimer = 0;
                this.slideTarget = null;
                this.stuckTimer = 0;
                return false;
            }

            if (this.slideTarget) {
                this.npc.moveToTarget(this.slideTarget, deltaTime, 0.5);
                this.npc.setAimTarget(this.getTargetPosition(this.target));
            }
            return true;
        }

        return false;
    }

    shootAtTarget(distance) {
        this.npc.playGunshot();
        const shotResult = this.npc.checkShotLineOfSight(this.target, true);
        if (shotResult.blocked) {
            return;
        }

        const finalHitRate = this.npc.calculateHitRate(this.target, distance, this.hitRate);
        if (Math.random() < finalHitRate) {
            this.target.takeDamage();
        }
    }

    update(deltaTime) {
        this.stateTime += deltaTime;
        this.shootCooldown -= deltaTime;
        this.strafeTimer -= deltaTime;
        this.targetSelectionTimer += deltaTime;
        this.npc.updateGrenadeCooldown(deltaTime);

        if (this.npc.canThrowGrenade(this.target)) {
            if (Math.random() < 0.3) {
                this.npc.throwGrenade(this.target);
            }
            this.npc.grenadeCooldown = 5 + Math.random() * 15;
        }

        if (this.targetSelectionTimer >= 1.0) {
            this.targetSelectionTimer = 0;
            const newTarget = this.findNearestTarget();
            if (newTarget && newTarget !== this.target) {
                this.target = newTarget;
                this.visitedCovers = [];
                this.currentCover = null;
                this.state = 'NAVIGATING';
            }
        }

        if (!this.target || this.target.isDead) {
            const newTarget = this.findNearestTarget();
            if (newTarget) {
                this.target = newTarget;
                this.visitedCovers = [];
                this.currentCover = null;
                this.state = 'NAVIGATING';
            } else {
                this.npc.update(deltaTime);
                this.npc.updateLabel();
                return;
            }
        }

        const distToTarget = this.getNpcPosition().distanceTo(this.getTargetPosition(this.target));
        this.canSeeTarget = this.checkLineOfSight();

        if (this.canSeeTarget) {
            this.targetLostTimer = 0;
        } else {
            this.targetLostTimer += deltaTime;
        }

        if (distToTarget < 10) {
            if (this.state !== 'RETREATING') {
                this.state = 'RETREATING';
                this.strafeDirection = this.selectRetreatDirection();
                this.strafeTimer = 2 + Math.random() * 3;
            }
        } else if (distToTarget < this.npc.coverSeekRange) {
            if (this.state !== 'ENGAGING') {
                this.state = 'ENGAGING';
                this.strafeDirection = this.selectStrafeDirection();
                this.strafeTimer = 2 + Math.random() * 3;
            }
        } else {
            if (this.state === 'ENGAGING' || this.state === 'RETREATING') {
                this.state = 'NAVIGATING';
                this.visitedCovers = [];
                this.currentCover = null;
            }
        }

        switch (this.state) {
            case 'NAVIGATING':
                this.handleNavigating(deltaTime, distToTarget);
                break;

            case 'IN_COVER_CROUCH':
                this.handleInCoverCrouch(deltaTime, distToTarget);
                break;

            case 'IN_COVER_MOVING':
                this.handleInCoverMoving(deltaTime, distToTarget);
                break;

            case 'ENGAGING':
                this.handleEngaging(deltaTime, distToTarget);
                break;

            case 'RETREATING':
                this.handleRetreating(deltaTime, distToTarget);
                break;
        }

        this.npc.update(deltaTime);
        this.npc.updateLabel();
    }

    handleNavigating(deltaTime, distToTarget) {
        if (this.npc.isCrouching) {
            this.npc.stand();
        }

        if (!this.currentCover) {
            this.currentCover = this.findBestCover();

            if (this.currentCover) {
                this.coverPos = this.calculateCoverPosition(this.currentCover);
                this.coverWaitTimer = 1 + Math.random() * 2;
            }
        }

        if (!this.currentCover) {
            this.npc.chaseTowards(this.getTargetPosition(this.target), deltaTime);
            this.npc.setAimTarget(this.getTargetPosition(this.target));
            return;
        }

        const targetPos = this.coverPos || this.currentCover.position;

        if (this.handleStuckDetection(deltaTime, targetPos)) {
            return;
        }

        const npcPos = this.getNpcPosition();
        const distToTargetPos = npcPos.distanceTo(targetPos);

        if (distToTargetPos > 2.5) {
            this.npc.avoidObstacle(targetPos, deltaTime, CHARACTER_CONFIG.moveSpeed, this.getTargetPosition(this.target));
            this.npc.setAimTarget(this.getTargetPosition(this.target));

            if (this.canSeeTarget && this.shootCooldown <= 0) {
                this.shootAtTarget(distToTarget);
                this.shootCooldown = this.shootInterval;
            }
        } else {
            this.visitedCovers.push(this.currentCover);
            this.state = 'IN_COVER_CROUCH';
            this.coverCrouchTimer = 3 + Math.random() * 3;
            this.npc.crouch();
        }
    }

    handleInCoverCrouch(deltaTime, distToTarget) {
        if (distToTarget < this.npc.coverSeekRange) {
            this.state = 'ENGAGING';
            this.strafeDirection = this.selectStrafeDirection();
            this.strafeTimer = 2 + Math.random() * 3;
            this.currentCover = null;
            this.npc.stand();
            return;
        }

        if (!this.canSeeTarget && this.targetLostTimer > 5) {
            this.currentCover = null;
            this.state = 'NAVIGATING';
            this.npc.stand();
            return;
        }

        this.coverCrouchTimer -= deltaTime;

        this.npc.setAimTarget(this.getTargetPosition(this.target));

        if (this.canSeeTarget && this.shootCooldown <= 0) {
            this.shootAtTarget(distToTarget);
            this.shootCooldown = this.shootInterval;
        }

        if (this.coverCrouchTimer > 0) {
            return;
        }

        this.npc.stand();
        this.movingDirection = Math.random() > 0.5 ? 1 : -1;
        this.movingTargetPos = this.calculateCoverEdgePosition(this.movingDirection);
        this.coverMovingTimer = 5 + Math.random() * 20;
        this.isCrouchShooting = false;
        this.state = 'IN_COVER_MOVING';
    }

    calculateCoverEdgePosition(direction) {
        const coverPos = new THREE.Vector3();
        this.currentCover.getWorldPosition(coverPos);

        const box = new THREE.Box3().setFromObject(this.currentCover);
        const size = box.getSize(new THREE.Vector3());
        const halfWidth = Math.max(size.x, size.z) / 2;

        const targetPos = this.getTargetPosition(this.target);
        const toTargetDir = new THREE.Vector3().subVectors(targetPos, coverPos).normalize();
        const perpendicularDir = new THREE.Vector3(-toTargetDir.z, 0, toTargetDir.x);

        const edgePos = coverPos.clone().add(
            perpendicularDir.multiplyScalar(direction * (halfWidth + 1.5))
        );

        return edgePos;
    }

    handleInCoverMoving(deltaTime, distToTarget) {
        if (distToTarget < this.npc.coverSeekRange) {
            this.state = 'ENGAGING';
            this.strafeDirection = this.selectStrafeDirection();
            this.strafeTimer = 2 + Math.random() * 3;
            this.currentCover = null;
            this.npc.stand();
            return;
        }

        if (!this.canSeeTarget && this.targetLostTimer > 5) {
            this.currentCover = null;
            this.state = 'NAVIGATING';
            this.npc.stand();
            return;
        }

        this.coverMovingTimer -= deltaTime;

        if (this.canSeeTarget && !this.isCrouchShooting) {
            this.npc.crouch();
            this.isCrouchShooting = true;
        }

        if (this.isCrouchShooting) {
            this.npc.setAimTarget(this.getTargetPosition(this.target));
            if (this.canSeeTarget && this.shootCooldown <= 0) {
                this.shootAtTarget(distToTarget);
                this.shootCooldown = this.shootInterval;
            }

            if (this.coverMovingTimer <= 0) {
                this.currentCover = null;
                this.state = 'NAVIGATING';
                this.npc.stand();
                this.isCrouchShooting = false;
                this.movingDirection = null;
                this.movingTargetPos = null;
            }
            return;
        }

        if (this.movingTargetPos) {
            const npcPos = this.getNpcPosition();
            const distToMovingTarget = npcPos.distanceTo(this.movingTargetPos);

            if (distToMovingTarget > 1.0) {
                this.npc.avoidObstacle(this.movingTargetPos, deltaTime, CHARACTER_CONFIG.moveSpeed * 0.6, this.getTargetPosition(this.target));
            } else {
                this.movingTargetPos = this.calculateCoverEdgePosition(this.movingDirection);
            }
        }

        this.npc.setAimTarget(this.getTargetPosition(this.target));

        if (this.coverMovingTimer <= 0) {
            this.currentCover = null;
            this.state = 'NAVIGATING';
            this.npc.stand();
            this.isCrouchShooting = false;
            this.movingDirection = null;
            this.movingTargetPos = null;
        }
    }

    handleEngaging(deltaTime, distToTarget) {
        if (this.npc.isCrouching) {
            this.npc.stand();
        }

        if (this.strafeTimer <= 0) {
            this.strafeDirection = this.selectStrafeDirection();
            this.strafeTimer = 3 + Math.random() * 2;
        }

        this.npc.strafeAround(this.getTargetPosition(this.target), deltaTime, this.strafeDirection);
        this.npc.setAimTarget(this.getTargetPosition(this.target));

        if (this.shootCooldown <= 0 && this.canSeeTarget) {
            this.shootAtTarget(distToTarget);
            this.shootCooldown = this.shootInterval;
        }
    }

    handleRetreating(deltaTime, distToTarget) {
        if (this.npc.isCrouching) {
            this.npc.stand();
        }

        if (this.strafeTimer <= 0) {
            this.strafeDirection = this.selectRetreatDirection();
            this.strafeTimer = 2 + Math.random() * 3;
        }

        const toTargetDir = new THREE.Vector3().subVectors(
            this.getTargetPosition(this.target),
            this.getNpcPosition()
        ).normalize();

        const perpendicularDir = new THREE.Vector3(-toTargetDir.z, 0, toTargetDir.x).multiplyScalar(this.strafeDirection);
        const retreatDir = new THREE.Vector3().subVectors(
            this.getNpcPosition(),
            this.getTargetPosition(this.target)
        ).normalize().add(perpendicularDir).normalize();

        this.npc.run();
        this.npc.move(retreatDir, deltaTime, CHARACTER_CONFIG.moveSpeed * 0.5);
        this.npc.faceDirection(new THREE.Vector3().subVectors(
            this.getTargetPosition(this.target),
            this.getNpcPosition()
        ));
        this.npc.setAimTarget(this.getTargetPosition(this.target));

        if (this.shootCooldown <= 0 && this.canSeeTarget) {
            this.shootAtTarget(distToTarget);
            this.shootCooldown = this.shootInterval;
        }
    }
}
