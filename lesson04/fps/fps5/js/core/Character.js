class Character {
    constructor(scene, position) {
        this.scene = scene;
        this.skeleton = SkeletonFactory.create(scene, position);
        this.animTime = 0;
        this.isJumping = false;
        this.jumpTime = 0;
        this.jumpHeight = 0;
        this.isCrouching = false;
        this.isLyingDown = false;
        this.isMoving = false;
        
        this.obstacles = [];
        this.collisionRadius = 0.6;
        
        this.collisionCylinder = this.createCollisionCylinder();
        this.skeleton.root.add(this.collisionCylinder);
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

    setLieDownPose() {
        SkeletonAnimator.setLieDownPose(this.skeleton);
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
}
