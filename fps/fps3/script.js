let scene, camera, renderer, controls;
let axesHelper, gridHelper;

const clock = new THREE.Clock();

const SKELETON_CONFIG = {
    pelvisLength: 0.27,
    torsoLength: 0.5,
    headRadius: 0.1,
    upperArmLength: 0.3,
    forearmLength: 0.3,
    thighLength: 0.45,
    shinLength: 0.45,
    shoulderWidth: 0.18,
    hipWidth: 0.135,
    gunLength: 0.6,
    bodyDiameter: 0.1,
    lineWidth: 0.02,
    jointRadius: 0.04
};

class SkeletonFactory {
    static create(scene, position = new THREE.Vector3(0, 0, 0)) {
        const skeleton = {
            gunGroup: null,
            leftUpperArm: null,
            leftForearm: null,
            rightUpperArm: null,
            rightForearm: null,
            shoulders: null,
            leftThigh: null,
            leftShin: null,
            rightThigh: null,
            rightShin: null,
            root: null,
            leftShoulderPos: null,
            rightShoulderPos: null
        };

        const root = new THREE.Object3D();
        root.position.copy(position);
        scene.add(root);
        skeleton.root = root;

        const colors = {
            pelvis: 0xff0000,
            spine: 0xff4444,
            head: 0xffff00,
            leftArm: 0x0000ff,
            rightArm: 0x0088ff,
            leftLeg: 0x00ff00,
            rightLeg: 0x00aa00,
            joint: 0xffffff
        };

        const halfPelvis = SKELETON_CONFIG.pelvisLength / 2;
        const halfShoulder = SKELETON_CONFIG.shoulderWidth;

        const leftHipPos = new THREE.Vector3(halfPelvis, 0, 0);
        const rightHipPos = new THREE.Vector3(-halfPelvis, 0, 0);
        const leftShoulderPos = new THREE.Vector3(halfShoulder, 0, 0);
        const rightShoulderPos = new THREE.Vector3(-halfShoulder, 0, 0);

        const pelvis = new THREE.Object3D();
        pelvis.position.set(0, 0, 0);
        root.add(pelvis);

        SkeletonFactory.createBoneLine(pelvis, leftHipPos, rightHipPos, colors.pelvis);
        SkeletonFactory.createJointSphere(pelvis, new THREE.Vector3(0, 0, 0), SKELETON_CONFIG.jointRadius, colors.joint, 1);

        const spine = new THREE.Object3D();
        spine.position.set(0, 0, 0);
        pelvis.add(spine);
        SkeletonFactory.createBoneLine(spine, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, SKELETON_CONFIG.torsoLength, 0), colors.spine);

        const shoulderY = SKELETON_CONFIG.torsoLength;
        const shoulders = new THREE.Object3D();
        shoulders.position.set(0, shoulderY, 0);
        spine.add(shoulders);

        SkeletonFactory.createBoneLine(shoulders, leftShoulderPos, rightShoulderPos, colors.spine);
        SkeletonFactory.createJointSphere(shoulders, new THREE.Vector3(0, 0, 0), SKELETON_CONFIG.jointRadius, colors.joint, 2);

        const head = new THREE.Object3D();
        head.position.set(0, 0, 0);
        shoulders.add(head);
        SkeletonFactory.createBoneLine(head, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, SKELETON_CONFIG.headRadius * 2, 0), colors.head);

        SkeletonFactory.createJointSphere(head, new THREE.Vector3(0, SKELETON_CONFIG.headRadius * 2, 0), SKELETON_CONFIG.jointRadius, colors.joint, 3);

        const gunGroup = new THREE.Object3D();
        gunGroup.position.set(0, 0, 0);
        shoulders.add(gunGroup);
        skeleton.gunGroup = gunGroup;
        skeleton.shoulders = shoulders;

        const gunColor = 0xff8800;
        const gunSegLength = SKELETON_CONFIG.gunLength / 3;

        SkeletonFactory.createBoneLine(gunGroup, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, gunSegLength), gunColor);

        const gunMiddlePos = new THREE.Vector3(0, 0, gunSegLength);
        SkeletonFactory.createJointSphere(gunGroup, gunMiddlePos, SKELETON_CONFIG.jointRadius, colors.joint, 5);
        SkeletonFactory.createBoneLine(gunGroup, gunMiddlePos, new THREE.Vector3(0, 0, gunSegLength * 2), gunColor);

        const gunEndPos = new THREE.Vector3(0, 0, gunSegLength * 2);
        SkeletonFactory.createJointSphere(gunGroup, gunEndPos, SKELETON_CONFIG.jointRadius, colors.joint, 4);
        SkeletonFactory.createBoneLine(gunGroup, gunEndPos, new THREE.Vector3(0, 0, gunSegLength * 3), gunColor);

        SkeletonFactory.createJointSphere(shoulders, leftShoulderPos, SKELETON_CONFIG.jointRadius, colors.joint, 6);

        const leftUpperArm = new THREE.Object3D();
        leftUpperArm.position.copy(leftShoulderPos);
        shoulders.add(leftUpperArm);
        skeleton.leftUpperArm = leftUpperArm;

        SkeletonFactory.createBoneLine(leftUpperArm, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.upperArmLength, 0), colors.leftArm);
        SkeletonFactory.createJointSphere(leftUpperArm, new THREE.Vector3(0, -SKELETON_CONFIG.upperArmLength, 0), SKELETON_CONFIG.jointRadius, colors.joint, 7);

        const leftForearm = new THREE.Object3D();
        leftForearm.position.set(0, -SKELETON_CONFIG.upperArmLength, 0);
        leftUpperArm.add(leftForearm);
        skeleton.leftForearm = leftForearm;

        SkeletonFactory.createBoneLine(leftForearm, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.forearmLength, 0), colors.leftArm);

        SkeletonFactory.createJointSphere(shoulders, rightShoulderPos, SKELETON_CONFIG.jointRadius, colors.joint, 8);

        const rightUpperArm = new THREE.Object3D();
        rightUpperArm.position.copy(rightShoulderPos);
        shoulders.add(rightUpperArm);
        skeleton.rightUpperArm = rightUpperArm;

        SkeletonFactory.createBoneLine(rightUpperArm, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.upperArmLength, 0), colors.rightArm);
        SkeletonFactory.createJointSphere(rightUpperArm, new THREE.Vector3(0, -SKELETON_CONFIG.upperArmLength, 0), SKELETON_CONFIG.jointRadius, colors.joint, 9);

        const rightForearm = new THREE.Object3D();
        rightForearm.position.set(0, -SKELETON_CONFIG.upperArmLength, 0);
        rightUpperArm.add(rightForearm);
        skeleton.rightForearm = rightForearm;

        SkeletonFactory.createBoneLine(rightForearm, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.forearmLength, 0), colors.rightArm);

        SkeletonFactory.createJointSphere(pelvis, leftHipPos, SKELETON_CONFIG.jointRadius, colors.joint, 10);

        const leftThigh = new THREE.Object3D();
        leftThigh.position.copy(leftHipPos);
        pelvis.add(leftThigh);
        skeleton.leftThigh = leftThigh;

        SkeletonFactory.createBoneLine(leftThigh, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.thighLength, 0), colors.leftLeg);
        SkeletonFactory.createJointSphere(leftThigh, new THREE.Vector3(0, -SKELETON_CONFIG.thighLength, 0), SKELETON_CONFIG.jointRadius, colors.joint, 11);

        const leftShin = new THREE.Object3D();
        leftShin.position.set(0, -SKELETON_CONFIG.thighLength, 0);
        leftThigh.add(leftShin);
        skeleton.leftShin = leftShin;

        SkeletonFactory.createBoneLine(leftShin, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.shinLength, 0), colors.leftLeg);
        SkeletonFactory.createJointSphere(leftShin, new THREE.Vector3(0, -SKELETON_CONFIG.shinLength, 0), SKELETON_CONFIG.jointRadius, colors.joint, 12);

        SkeletonFactory.createJointSphere(pelvis, rightHipPos, SKELETON_CONFIG.jointRadius, colors.joint, 13);

        const rightThigh = new THREE.Object3D();
        rightThigh.position.copy(rightHipPos);
        pelvis.add(rightThigh);
        skeleton.rightThigh = rightThigh;

        SkeletonFactory.createBoneLine(rightThigh, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.thighLength, 0), colors.rightLeg);
        SkeletonFactory.createJointSphere(rightThigh, new THREE.Vector3(0, -SKELETON_CONFIG.thighLength, 0), SKELETON_CONFIG.jointRadius, colors.joint, 14);

        const rightShin = new THREE.Object3D();
        rightShin.position.set(0, -SKELETON_CONFIG.thighLength, 0);
        rightThigh.add(rightShin);
        skeleton.rightShin = rightShin;

        SkeletonFactory.createBoneLine(rightShin, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.shinLength, 0), colors.rightLeg);
        SkeletonFactory.createJointSphere(rightShin, new THREE.Vector3(0, -SKELETON_CONFIG.shinLength, 0), SKELETON_CONFIG.jointRadius, colors.joint, 15);

        skeleton.leftShoulderPos = leftShoulderPos.clone();
        skeleton.rightShoulderPos = rightShoulderPos.clone();

        return skeleton;
    }

    static createJointSphere(parent, position, radius, color, labelNumber) {
        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: color });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(position);
        parent.add(sphere);

        const label = SkeletonFactory.createJointLabel(labelNumber, position);
        parent.add(label);

        return sphere;
    }

    static createJointLabel(number, position) {
        const canvas = document.createElement('canvas');
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number.toString(), size / 2, size / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.copy(position);
        sprite.position.y += 0.08;
        sprite.scale.set(0.15, 0.15, 0.15);

        return sprite;
    }

    static createBoneLine(parent, start, end, color) {
        const points = [];
        points.push(start.clone());
        points.push(end.clone());

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
        const line = new THREE.Line(geometry, material);

        parent.add(line);
        return line;
    }
}

class SkeletonAnimator {
    static connectArmToTarget(upperArm, forearm, shoulderPos, targetPos, isLeftArm) {
        const upperArmLength = SKELETON_CONFIG.upperArmLength;
        const forearmLength = SKELETON_CONFIG.forearmLength;
        
        const dx = targetPos.x - shoulderPos.x;
        const dy = targetPos.y - shoulderPos.y;
        const dz = targetPos.z - shoulderPos.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        const targetDir = new THREE.Vector3(dx, dy, dz).normalize();
        
        const distFromShoulder = (upperArmLength * upperArmLength - forearmLength * forearmLength + distance * distance) / (2 * distance);
        const height = Math.sqrt(Math.max(0, upperArmLength * upperArmLength - distFromShoulder * distFromShoulder));
        
        const basePoint = new THREE.Vector3(
            shoulderPos.x + targetDir.x * distFromShoulder,
            shoulderPos.y + targetDir.y * distFromShoulder,
            shoulderPos.z + targetDir.z * distFromShoulder
        );
        
        const worldUp = new THREE.Vector3(0, 1, 0);
        const sideDir = new THREE.Vector3().crossVectors(targetDir, worldUp).normalize();
        if (sideDir.lengthSq() < 0.001) {
            sideDir.set(isLeftArm ? 1 : -1, 0, 0);
        }
        if ((isLeftArm && sideDir.x < 0) || (!isLeftArm && sideDir.x > 0)) {
            sideDir.negate();
        }
        
        const downDir = new THREE.Vector3().crossVectors(sideDir, targetDir).normalize();
        if (downDir.y > 0) {
            downDir.negate();
        }
        
        const blendFactor = 0.6;
        const elbowDir = new THREE.Vector3(
            sideDir.x * (1 - blendFactor) + downDir.x * blendFactor,
            sideDir.y * (1 - blendFactor) + downDir.y * blendFactor,
            sideDir.z * (1 - blendFactor) + downDir.z * blendFactor
        ).normalize();
        
        const elbowPos = new THREE.Vector3(
            basePoint.x + elbowDir.x * height,
            basePoint.y + elbowDir.y * height,
            basePoint.z + elbowDir.z * height
        );
        
        upperArm.rotation.set(0, 0, 0);
        const upperArmTarget = new THREE.Vector3(
            elbowPos.x - shoulderPos.x,
            elbowPos.y - shoulderPos.y,
            elbowPos.z - shoulderPos.z
        ).normalize();
        
        const defaultDir = new THREE.Vector3(0, -1, 0);
        const rotAxis = new THREE.Vector3().crossVectors(defaultDir, upperArmTarget).normalize();
        const rotAngle = Math.acos(Math.max(-1, Math.min(1, defaultDir.dot(upperArmTarget))));
        
        if (rotAxis.lengthSq() > 0.001) {
            upperArm.rotateOnAxis(rotAxis, rotAngle);
        }
        
        forearm.rotation.set(0, 0, 0);
        const forearmTarget = new THREE.Vector3(
            targetPos.x - elbowPos.x,
            targetPos.y - elbowPos.y,
            targetPos.z - elbowPos.z
        ).normalize();
        
        const localForearmTarget = forearmTarget.clone().applyQuaternion(upperArm.quaternion.clone().invert());
        
        const forearmRotAxis = new THREE.Vector3().crossVectors(defaultDir, localForearmTarget).normalize();
        const forearmRotAngle = Math.acos(Math.max(-1, Math.min(1, defaultDir.dot(localForearmTarget))));
        
        if (forearmRotAxis.lengthSq() > 0.001) {
            forearm.rotateOnAxis(forearmRotAxis, forearmRotAngle);
        }
    }

    static updatePose(skeleton, gunAngle) {
        const maxAngle = 60;
        const clampedAngle = Math.max(-maxAngle, Math.min(maxAngle, gunAngle));
        const gunAngleRad = THREE.MathUtils.degToRad(clampedAngle);
        
        skeleton.gunGroup.rotation.set(gunAngleRad, 0, 0);
        skeleton.gunGroup.updateMatrix();
        
        const gunMiddlePos = new THREE.Vector3(0, 0, SKELETON_CONFIG.gunLength / 3);
        const gunEndPos = new THREE.Vector3(0, 0, SKELETON_CONFIG.gunLength * 2 / 3);
        
        gunMiddlePos.applyMatrix4(skeleton.gunGroup.matrix);
        gunEndPos.applyMatrix4(skeleton.gunGroup.matrix);
        
        SkeletonAnimator.connectArmToTarget(
            skeleton.leftUpperArm, 
            skeleton.leftForearm, 
            skeleton.leftShoulderPos, 
            gunEndPos, 
            true
        );
        
        SkeletonAnimator.connectArmToTarget(
            skeleton.rightUpperArm, 
            skeleton.rightForearm, 
            skeleton.rightShoulderPos, 
            gunMiddlePos, 
            false
        );
    }

    static setStandPose(skeleton) {
        const baseRootY = SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength;
        skeleton.leftThigh.rotation.x = 0;
        skeleton.rightThigh.rotation.x = 0;
        skeleton.leftShin.rotation.x = 0;
        skeleton.rightShin.rotation.x = 0;
        skeleton.root.position.y = baseRootY;
    }

    static setRunningPose(skeleton, animTime) {
        const swingAngle = Math.sin(animTime) * CHARACTER_CONFIG.swingAngle;
        const swingAngleOpposite = Math.sin(animTime + Math.PI) * CHARACTER_CONFIG.swingAngle;
        
        skeleton.leftThigh.rotation.x = swingAngle;
        skeleton.rightThigh.rotation.x = swingAngleOpposite;
        
        const leftKneeBend = swingAngle > 0 ? swingAngle * CHARACTER_CONFIG.kneeBendFactor : 0;
        const rightKneeBend = swingAngleOpposite > 0 ? swingAngleOpposite * CHARACTER_CONFIG.kneeBendFactor : 0;
        
        skeleton.leftShin.rotation.x = leftKneeBend;
        skeleton.rightShin.rotation.x = rightKneeBend;
    }

    static setCrouchPose(skeleton) {
        const leftThighAngle = -Math.PI / 2;
        const leftShinAngle = Math.PI / 2;
        skeleton.leftThigh.rotation.x = leftThighAngle;
        skeleton.leftShin.rotation.x = leftShinAngle;
        
        const rightThighAngle = 0;
        const rightShinAngle = Math.PI / 2;
        skeleton.rightThigh.rotation.x = rightThighAngle;
        skeleton.rightShin.rotation.x = rightShinAngle;
        
        skeleton.root.position.y = SKELETON_CONFIG.thighLength;
    }

    static setJumpPose(skeleton, jumpHeight) {
        const baseRootY = SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength;
        const slightBend = 0.3;
        skeleton.leftThigh.rotation.x = -slightBend;
        skeleton.rightThigh.rotation.x = -slightBend;
        skeleton.leftShin.rotation.x = slightBend * 0.8;
        skeleton.rightShin.rotation.x = slightBend * 0.8;
        skeleton.root.position.y = baseRootY + jumpHeight;
    }
}

const CHARACTER_CONFIG = {
    animSpeed: 8,
    moveSpeed: 4.5,
    swingAngle: 0.6,
    jumpHeight: 0.8,
    jumpDuration: 0.96,
    kneeBendFactor: 0.8,
    gunAngleAmplitude: 40,
    gunAngleFrequency: 0.25
};

class Character {
    constructor(scene, position) {
        this.scene = scene;
        this.skeleton = SkeletonFactory.create(scene, position);
        this.animTime = 0;
        this.isJumping = false;
        this.jumpTime = 0;
        this.jumpHeight = 0;
        this.isCrouching = false;
        
        this.collisionCylinder = this.createCollisionCylinder();
        this.skeleton.root.add(this.collisionCylinder);
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
            depthWrite: false
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

const testPhases = [
    { name: 'forward', duration: 3, moveDir: new THREE.Vector3(0, 0, 1), isRunning: true },
    { name: 'backward', duration: 3, moveDir: new THREE.Vector3(0, 0, -1), isRunning: true },
    { name: 'stand', duration: 3, moveDir: new THREE.Vector3(0, 0, 0), isRunning: false },
    { name: 'crouch', duration: 3, moveDir: new THREE.Vector3(0, 0, 0), isRunning: false, isCrouching: true },
    { name: 'jump', duration: 1.2, moveDir: new THREE.Vector3(0, 0, 0), isRunning: false, isJumping: true },
    { name: 'forwardLeft', duration: 3, moveDir: new THREE.Vector3(1, 0, 1).normalize(), isRunning: true },
    { name: 'backwardRight', duration: 3, moveDir: new THREE.Vector3(-1, 0, -1).normalize(), isRunning: true }
];

class NPC extends Character {
    constructor(scene, position) {
        super(scene, position);
        this.testState = {
            phaseIndex: 0,
            phaseTime: 0
        };
    }

    update(deltaTime) {
        const phase = testPhases[this.testState.phaseIndex];
        
        this.testState.phaseTime += deltaTime;
        this.animTime += deltaTime * CHARACTER_CONFIG.animSpeed;
        
        if (phase.isJumping) {
            this.isJumping = true;
            this.updateJump(deltaTime, phase.duration);
        }
        
        if (this.testState.phaseTime >= phase.duration) {
            this.testState.phaseTime = 0;
            this.jumpTime = 0;
            this.isJumping = false;
            this.jumpHeight = 0;
            this.testState.phaseIndex = (this.testState.phaseIndex + 1) % testPhases.length;
        }
        
        this.skeleton.root.position.x += phase.moveDir.x * CHARACTER_CONFIG.moveSpeed * deltaTime;
        this.skeleton.root.position.z += phase.moveDir.z * CHARACTER_CONFIG.moveSpeed * deltaTime;
        
        if (phase.isJumping) {
            this.applyJumpPose();
        } else if (phase.isCrouching) {
            this.isCrouching = true;
            this.setCrouchPose();
        } else if (phase.isRunning) {
            this.isCrouching = false;
            this.setRunningPose(this.animTime);
        } else {
            this.isCrouching = false;
            this.setStandPose();
        }
        
        this.updateCollisionCylinder();
        
        this.updateGunPose(this.animTime);
    }
}

class Player extends Character {
    constructor(scene, position) {
        super(scene, position);
        
        this.yaw = Math.PI;
        this.pitch = 0;
        this.isThirdPerson = false;
        
        this.headHeight = SKELETON_CONFIG.torsoLength + SKELETON_CONFIG.headRadius * 2;
        this.crouchHeadHeight = SKELETON_CONFIG.torsoLength * 0.5 + SKELETON_CONFIG.headRadius * 2;
        
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false
        };
        
        this.cameraPivot = new THREE.Object3D();
        scene.add(this.cameraPivot);
        
        this.skeleton.root.rotation.y = Math.PI;
        
        this.setupControls();
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
    }
    
    update(deltaTime) {
        this.animTime += deltaTime * CHARACTER_CONFIG.animSpeed;
        
        this.updateJump(deltaTime);
        
        if (!this.isCrouching && !this.isJumping) {
            this.setStandPose();
        } else if (this.isCrouching) {
            this.setCrouchPose();
        }
        
        this.applyJumpPose();
        
        this.updateCollisionCylinder();
        
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
            moveVector.normalize().multiplyScalar(CHARACTER_CONFIG.moveSpeed * deltaTime);
            
            this.skeleton.root.position.x += moveVector.x;
            this.skeleton.root.position.z += moveVector.z;
            
            this.setRunningPose(this.animTime);
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
            this.cameraPivot.rotateY(this.yaw);
            this.cameraPivot.rotateX(this.pitch);
            
            camera.position.copy(this.cameraPivot.position);
            camera.quaternion.copy(this.cameraPivot.quaternion);
        }
        
        const gunAngle = -THREE.MathUtils.radToDeg(this.pitch);
        this.updatePose(gunAngle);
    }
}

let npc;
let player;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    const canvas = document.getElementById('scene-canvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    axesHelper = new THREE.AxesHelper(5);
    axesHelper.position.y = 0.01;
    scene.add(axesHelper);

    gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x5a5a5a);
    scene.add(gridHelper);

    npc = new NPC(scene, new THREE.Vector3(1, SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength, -5));
    player = new Player(scene, new THREE.Vector3(1, SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength, -7));

    animate();

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    npc.update(deltaTime);
    player.update(deltaTime);
    
    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', init);
