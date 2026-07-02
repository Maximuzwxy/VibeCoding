class Player extends Character {
    constructor(scene, position, name, teamColor, team = 'player') {
        super(scene, position, team, teamColor);

        this.playerName = name;
        this.yaw = Math.PI;
        this.pitch = 0;
        this.isThirdPerson = false;

        this.headHeight = SKELETON_CONFIG.torsoLength + SKELETON_CONFIG.headRadius * 2 - 0.1;
        this.crouchHeadHeight = SKELETON_CONFIG.torsoLength + SKELETON_CONFIG.headRadius * 2 - 0.1;

        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false
        };

        this.isRightMouseDown = false;

        this.cameraPivot = new THREE.Object3D();
        scene.add(this.cameraPivot);

        this.skeleton.root.rotation.y = Math.PI;

        this.footstepTimer = 0;
        this.footstepInterval = 0.35;

        this.isDead = false;

        this.swayTime = 0;
        this.swayAmount = 0.015;

        this.grenadeCount = 3;

        this.label = this.createLabel(this.playerName, '#44ff44', { width: 128, height: 64 });
        this.label.scale.set(1.2, 0.6, 1);
        this.label.position.y = this.standHeight + 0.5;
        this.skeleton.root.add(this.label);

        this.setupControls();
    }
    
    getCrosshairTarget() {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        
        const rayOrigin = raycaster.ray.origin.clone();
        const rayDir = raycaster.ray.direction.clone();
        
        if (rayDir.y >= 0) {
            const maxDistance = 20;
            const groundPoint = rayOrigin.clone().add(rayDir.clone().multiplyScalar(maxDistance));
            groundPoint.y = 0;
            return groundPoint;
        }
        
        const t = -rayOrigin.y / rayDir.y;
        const groundPoint = rayOrigin.clone().add(rayDir.multiplyScalar(t));
        
        return groundPoint;
    }

    updateLabel() {
        if (this.label) {
            this.label.position.y = (this.isCrouching ? this.crouchHeight : this.standHeight) + 0.5;
        }
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'KeyW': this.keys.w = true; break;
                case 'KeyA': this.keys.a = true; break;
                case 'KeyS': this.keys.s = true; break;
                case 'KeyD': this.keys.d = true; break;
                case 'Space':
                    e.preventDefault();
                    if (!this.isJumping && !this.isCrouching) {
                        this.isJumping = true;
                        this.jumpTime = 0;
                    }
                    break;
                case 'KeyQ':
                    if (!this.isJumping) {
                        this.isCrouching = !this.isCrouching;
                    }
                    break;
                case 'Enter':
                    this.isThirdPerson = !this.isThirdPerson;
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch(e.code) {
                case 'KeyW': this.keys.w = false; break;
                case 'KeyA': this.keys.a = false; break;
                case 'KeyS': this.keys.s = false; break;
                case 'KeyD': this.keys.d = false; break;
            }
        });
        
        document.addEventListener('click', () => {
            document.body.requestPointerLock();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === document.body) {
                this.yaw -= e.movementX * 0.002;
                this.pitch -= e.movementY * 0.002;
                this.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.pitch));
            }
        });
        
        document.addEventListener('mousedown', (e) => {
            if (e.button === 2) {
                this.isRightMouseDown = true;
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (e.button === 2) {
                const crosshairTarget = this.getCrosshairTarget();
                if (crosshairTarget && this.grenadeCount > 0) {
                    this.startThrowAnimation();
                    this.throwProjectile(15, crosshairTarget);
                    this.grenadeCount--;
                }
            }
        });
        
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        this.applyJumpPose();
        
        const forward = new THREE.Vector3(
            -Math.sin(this.yaw),
            0,
            -Math.cos(this.yaw)
        ).normalize();
        
        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
        
        const moveVector = new THREE.Vector3(0, 0, 0);
        
        if (this.keys.w) moveVector.add(forward);
        if (this.keys.s) moveVector.sub(forward);
        if (this.keys.a) moveVector.sub(right);
        if (this.keys.d) moveVector.add(right);
        
        if (!this.isCrouching && moveVector.length() > 0) {
            this.move(moveVector, deltaTime);
            
            this.footstepTimer += deltaTime;
            if (this.footstepTimer >= this.footstepInterval) {
                audioManager.playFootstep();
                this.footstepTimer = 0;
            }
        } else {
            this.stop();
            this.footstepTimer = 0;
        }
        
        this.swayTime += deltaTime;
        
        let swayYaw = 0;
        let swayPitch = 0;
        
        if (this.isMoving) {
            swayYaw = Math.sin(this.swayTime * 8) * this.swayAmount;
            swayPitch = Math.cos(this.swayTime * 6) * this.swayAmount * 0.5;
        }
        
        this.skeleton.root.rotation.y = this.yaw + Math.PI;
        
        const headY = this.isCrouching ? this.crouchHeadHeight : this.headHeight;
        const rootY = this.skeleton.root.position.y;
        
        if (this.isThirdPerson) {
            const behindDistance = 3;
            const heightOffset = 2;
            
            const forward = new THREE.Vector3(
                Math.sin(this.yaw + Math.PI),
                0,
                Math.cos(this.yaw + Math.PI)
            ).normalize();
            
            camera.position.set(
                this.skeleton.root.position.x - forward.x * behindDistance,
                rootY + heightOffset,
                this.skeleton.root.position.z - forward.z * behindDistance
            );
            
            const lookTarget = new THREE.Vector3(
                this.skeleton.root.position.x + forward.x * 5,
                rootY + headY,
                this.skeleton.root.position.z + forward.z * 5
            );
            
            camera.lookAt(lookTarget);
        } else {
            this.cameraPivot.position.set(
                this.skeleton.root.position.x,
                rootY + headY,
                this.skeleton.root.position.z
            );
            
            this.cameraPivot.rotation.set(0, 0, 0);
            this.cameraPivot.rotateY(this.yaw + swayYaw);
            this.cameraPivot.rotateX(this.pitch + swayPitch);
            
            camera.position.copy(this.cameraPivot.position);
            camera.quaternion.copy(this.cameraPivot.quaternion);
        }
        
        const gunAngle = -THREE.MathUtils.radToDeg(this.pitch);
        
        if (this.throwAnimState.isPlaying) {
            this.playThrowAnimation(deltaTime);
        } else {
            this.updatePose(gunAngle);
        }
        
        this.updateLabel();
    }

    playHitSound() {
        audioManager.playHit();
    }

    onDeath() {
        this.playHitSound();
    }

    shoot(npcs) {
        if (this.isDead) return null;

        audioManager.playGunshot();

        const cameraPos = camera.position.clone();
        const cameraDir = new THREE.Vector3();
        camera.getWorldDirection(cameraDir);

        const raycaster = new THREE.Raycaster(cameraPos, cameraDir, 0, 50);
        const npcObjects = [];
        const npcArray = Array.isArray(npcs) ? npcs : [npcs];

        npcArray.forEach(npc => {
            if (!npc.isDead) {
                npc.skeleton.root.traverse(child => {
                    if (child.isMesh) {
                        npcObjects.push(child);
                    }
                });
            }
        });

        const allObjects = [...npcObjects, ...this.obstacles];
        const intersects = raycaster.intersectObjects(allObjects);
        
        const endPoint = intersects.length > 0 ? intersects[0].point.clone() : cameraPos.clone().add(cameraDir.clone().multiplyScalar(50));
        const isBlocked = intersects.length > 0 && this.obstacles.includes(intersects[0].object);
        this.showDebugRay(cameraPos, endPoint, isBlocked);
        
        let hitTarget = null;
        if (intersects.length > 0) {
            const hitObject = intersects[0].object;
            const isObstacle = this.obstacles.includes(hitObject);
            
            if (!isObstacle) {
                npcArray.forEach(npc => {
                    npc.skeleton.root.traverse(child => {
                        if (child === hitObject) {
                            hitTarget = npc;
                        }
                    });
                });
            }
        }

        return {
            startPoint: [cameraPos.x, cameraPos.y, cameraPos.z],
            endPoint: [endPoint.x, endPoint.y, endPoint.z],
            isBlocked: isBlocked,
            target: hitTarget
        };
    }

    onThrowAnimationStart() {
        if (audioManager && audioManager.speak) {
            audioManager.speak('Fire in the hole');
        }
    }
}
