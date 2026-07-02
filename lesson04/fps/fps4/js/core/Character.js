class Character {
    constructor(scene, position) {
        this.scene = scene;
        this.skeleton = SkeletonFactory.create(scene, position);
        this.animTime = 0;
        this.isJumping = false;
        this.jumpTime = 0;
        this.jumpHeight = 0;
        this.isCrouching = false;
        
        this.obstacles = [];
        this.collisionRadius = 0.3;
        
        this.collisionCylinder = this.createCollisionCylinder();
        this.skeleton.root.add(this.collisionCylinder);
    }
    
    addObstacle(mesh) {
        this.obstacles.push(mesh);
    }
    
    resolveCollision(moveVector) {
        const pos = this.skeleton.root.position;
        let result = moveVector.clone();
        
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
        const radius = 0.3;
        
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
}
