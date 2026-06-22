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
        
        const moveVector = new THREE.Vector3(
            phase.moveDir.x * CHARACTER_CONFIG.moveSpeed * deltaTime,
            0,
            phase.moveDir.z * CHARACTER_CONFIG.moveSpeed * deltaTime
        );
        
        const resolvedMove = this.resolveCollision(moveVector);
        
        this.skeleton.root.position.x += resolvedMove.x;
        this.skeleton.root.position.z += resolvedMove.z;
        
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
