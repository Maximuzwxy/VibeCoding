let scene, camera, renderer, controls;
let axesHelper, gridHelper;

const clock = new THREE.Clock();

// Global references for animation
let skeleton = {
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
    root: null
};
let leftShoulderPosRef, rightShoulderPosRef;

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

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

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

    createSkeleton();

    camera.position.set(4, 3, 5);
    camera.lookAt(1, 1, 0);

    animate();

    window.addEventListener('resize', onWindowResize);
}

function createJointSphere(parent, position, radius, color, labelNumber) {
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(position);
    parent.add(sphere);

    const label = createJointLabel(labelNumber, position);
    parent.add(label);

    return sphere;
}

function createJointLabel(number, position) {
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

function createBoneLine(parent, start, end, color) {
    const points = [];
    points.push(start.clone());
    points.push(end.clone());

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
    const line = new THREE.Line(geometry, material);

    parent.add(line);
    return line;
}

function connectArmToTarget(upperArm, forearm, shoulderPos, targetPos, isLeftArm) {
    const upperArmLength = SKELETON_CONFIG.upperArmLength;
    const forearmLength = SKELETON_CONFIG.forearmLength;
    
    const dx = targetPos.x - shoulderPos.x;
    const dy = targetPos.y - shoulderPos.y;
    const dz = targetPos.z - shoulderPos.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    // Direction to target
    const targetDir = new THREE.Vector3(dx, dy, dz).normalize();
    
    // Calculate elbow position using triangle geometry
    // Elbow is at distance upperArmLength from shoulder and forearmLength from target
    const distFromShoulder = (upperArmLength * upperArmLength - forearmLength * forearmLength + distance * distance) / (2 * distance);
    const height = Math.sqrt(Math.max(0, upperArmLength * upperArmLength - distFromShoulder * distFromShoulder));
    
    // Base point on shoulder-target line
    const basePoint = new THREE.Vector3(
        shoulderPos.x + targetDir.x * distFromShoulder,
        shoulderPos.y + targetDir.y * distFromShoulder,
        shoulderPos.z + targetDir.z * distFromShoulder
    );
    
    // Build elbow plane: need two perpendicular directions
    const worldUp = new THREE.Vector3(0, 1, 0);
    const sideDir = new THREE.Vector3().crossVectors(targetDir, worldUp).normalize();
    if (sideDir.lengthSq() < 0.001) {
        sideDir.set(isLeftArm ? 1 : -1, 0, 0);
    }
    // Ensure left arm elbow points left, right arm elbow points right
    if ((isLeftArm && sideDir.x < 0) || (!isLeftArm && sideDir.x > 0)) {
        sideDir.negate();
    }
    
    // Down direction (projected onto elbow plane)
    const downDir = new THREE.Vector3().crossVectors(sideDir, targetDir).normalize();
    // Ensure downDir always points downward (negative Y)
    if (downDir.y > 0) {
        downDir.negate();
    }
    
    // Blend between side and down to make elbow lower and closer to body
    // 0 = pure side (original), 1 = pure down
    const blendFactor = 0.6; // How much to bias toward downward
    const elbowDir = new THREE.Vector3(
        sideDir.x * (1 - blendFactor) + downDir.x * blendFactor,
        sideDir.y * (1 - blendFactor) + downDir.y * blendFactor,
        sideDir.z * (1 - blendFactor) + downDir.z * blendFactor
    ).normalize();
    
    // Elbow position (maintains exact distance constraint)
    const elbowPos = new THREE.Vector3(
        basePoint.x + elbowDir.x * height,
        basePoint.y + elbowDir.y * height,
        basePoint.z + elbowDir.z * height
    );
    
    // Set upper arm rotation to point from shoulder to elbow
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
    
    // Set forearm rotation to point from elbow to target
    forearm.rotation.set(0, 0, 0);
    const forearmTarget = new THREE.Vector3(
        targetPos.x - elbowPos.x,
        targetPos.y - elbowPos.y,
        targetPos.z - elbowPos.z
    ).normalize();
    
    // Transform forearmTarget to upperArm's local space
    const localForearmTarget = forearmTarget.clone().applyQuaternion(upperArm.quaternion.clone().invert());
    
    const forearmRotAxis = new THREE.Vector3().crossVectors(defaultDir, localForearmTarget).normalize();
    const forearmRotAngle = Math.acos(Math.max(-1, Math.min(1, defaultDir.dot(localForearmTarget))));
    
    if (forearmRotAxis.lengthSq() > 0.001) {
        forearm.rotateOnAxis(forearmRotAxis, forearmRotAngle);
    }
}

function createSkeleton() {
    const root = new THREE.Object3D();
    root.position.set(1, SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength, 0);
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

    // Coordinate system: standing behind the character, looking forward (Z+)
    // Left/Right are from the character's perspective
    const leftHipPos = new THREE.Vector3(halfPelvis, 0, 0);
    const rightHipPos = new THREE.Vector3(-halfPelvis, 0, 0);
    const leftShoulderPos = new THREE.Vector3(halfShoulder, 0, 0);
    const rightShoulderPos = new THREE.Vector3(-halfShoulder, 0, 0);

    // 1. Pelvis Center (root node)
    const pelvis = new THREE.Object3D();
    pelvis.position.set(0, 0, 0);
    root.add(pelvis);

    createBoneLine(pelvis, leftHipPos, rightHipPos, colors.pelvis);
    createJointSphere(pelvis, new THREE.Vector3(0, 0, 0), SKELETON_CONFIG.jointRadius, colors.joint, 1);

    // Spine
    const spine = new THREE.Object3D();
    spine.position.set(0, 0, 0);
    pelvis.add(spine);
    createBoneLine(spine, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, SKELETON_CONFIG.torsoLength, 0), colors.spine);

    // 2. Shoulder Center (shared: spine top, head bottom, gun start)
    const shoulderY = SKELETON_CONFIG.torsoLength;
    const shoulders = new THREE.Object3D();
    shoulders.position.set(0, shoulderY, 0);
    spine.add(shoulders);

    createBoneLine(shoulders, leftShoulderPos, rightShoulderPos, colors.spine);
    createJointSphere(shoulders, new THREE.Vector3(0, 0, 0), SKELETON_CONFIG.jointRadius, colors.joint, 2);

    // Head
    const head = new THREE.Object3D();
    head.position.set(0, 0, 0);
    shoulders.add(head);
    createBoneLine(head, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, SKELETON_CONFIG.headRadius * 2, 0), colors.head);

    // 3. Head Top
    createJointSphere(head, new THREE.Vector3(0, SKELETON_CONFIG.headRadius * 2, 0), SKELETON_CONFIG.jointRadius, colors.joint, 3);

    // Gun Group (rotates around node 2 - shoulder center)
    const gunGroup = new THREE.Object3D();
    gunGroup.position.set(0, 0, 0);
    shoulders.add(gunGroup);
    skeleton.gunGroup = gunGroup;
    skeleton.shoulders = shoulders;

    const gunColor = 0xff8800;
    const gunSegLength = SKELETON_CONFIG.gunLength / 3;

    // Gun start bone (from 2 to 5)
    createBoneLine(gunGroup, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, gunSegLength), gunColor);

    // 5. Gun Middle / Right Hand (merged node)
    const gunMiddlePos = new THREE.Vector3(0, 0, gunSegLength);
    createJointSphere(gunGroup, gunMiddlePos, SKELETON_CONFIG.jointRadius, colors.joint, 5);
    createBoneLine(gunGroup, gunMiddlePos, new THREE.Vector3(0, 0, gunSegLength * 2), gunColor);

    // 4. Gun End / Left Hand (merged node)
    const gunEndPos = new THREE.Vector3(0, 0, gunSegLength * 2);
    createJointSphere(gunGroup, gunEndPos, SKELETON_CONFIG.jointRadius, colors.joint, 4);
    createBoneLine(gunGroup, gunEndPos, new THREE.Vector3(0, 0, gunSegLength * 3), gunColor);

    // 6. Left Shoulder
    createJointSphere(shoulders, leftShoulderPos, SKELETON_CONFIG.jointRadius, colors.joint, 6);

    // 7. Left Elbow
    const leftUpperArm = new THREE.Object3D();
    leftUpperArm.position.copy(leftShoulderPos);
    shoulders.add(leftUpperArm);
    skeleton.leftUpperArm = leftUpperArm;

    createBoneLine(leftUpperArm, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.upperArmLength, 0), colors.leftArm);
    createJointSphere(leftUpperArm, new THREE.Vector3(0, -SKELETON_CONFIG.upperArmLength, 0), SKELETON_CONFIG.jointRadius, colors.joint, 7);

    // Left Forearm (connects to node 4 - merged gun end/left hand)
    const leftForearm = new THREE.Object3D();
    leftForearm.position.set(0, -SKELETON_CONFIG.upperArmLength, 0);
    leftUpperArm.add(leftForearm);
    skeleton.leftForearm = leftForearm;

    createBoneLine(leftForearm, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.forearmLength, 0), colors.leftArm);

    // 8. Right Shoulder
    createJointSphere(shoulders, rightShoulderPos, SKELETON_CONFIG.jointRadius, colors.joint, 8);

    // 9. Right Elbow
    const rightUpperArm = new THREE.Object3D();
    rightUpperArm.position.copy(rightShoulderPos);
    shoulders.add(rightUpperArm);
    skeleton.rightUpperArm = rightUpperArm;

    createBoneLine(rightUpperArm, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.upperArmLength, 0), colors.rightArm);
    createJointSphere(rightUpperArm, new THREE.Vector3(0, -SKELETON_CONFIG.upperArmLength, 0), SKELETON_CONFIG.jointRadius, colors.joint, 9);

    // Right Forearm (connects to node 5 - merged gun middle/right hand)
    const rightForearm = new THREE.Object3D();
    rightForearm.position.set(0, -SKELETON_CONFIG.upperArmLength, 0);
    rightUpperArm.add(rightForearm);
    skeleton.rightForearm = rightForearm;

    createBoneLine(rightForearm, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.forearmLength, 0), colors.rightArm);

    // 10. Left Hip
    createJointSphere(pelvis, leftHipPos, SKELETON_CONFIG.jointRadius, colors.joint, 10);

    // 11. Left Knee
    const leftThigh = new THREE.Object3D();
    leftThigh.position.copy(leftHipPos);
    pelvis.add(leftThigh);
    skeleton.leftThigh = leftThigh;

    createBoneLine(leftThigh, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.thighLength, 0), colors.leftLeg);
    createJointSphere(leftThigh, new THREE.Vector3(0, -SKELETON_CONFIG.thighLength, 0), SKELETON_CONFIG.jointRadius, colors.joint, 11);

    // 12. Left Foot
    const leftShin = new THREE.Object3D();
    leftShin.position.set(0, -SKELETON_CONFIG.thighLength, 0);
    leftThigh.add(leftShin);
    skeleton.leftShin = leftShin;

    createBoneLine(leftShin, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.shinLength, 0), colors.leftLeg);
    createJointSphere(leftShin, new THREE.Vector3(0, -SKELETON_CONFIG.shinLength, 0), SKELETON_CONFIG.jointRadius, colors.joint, 12);

    // 13. Right Hip
    createJointSphere(pelvis, rightHipPos, SKELETON_CONFIG.jointRadius, colors.joint, 13);

    // 14. Right Knee
    const rightThigh = new THREE.Object3D();
    rightThigh.position.copy(rightHipPos);
    pelvis.add(rightThigh);
    skeleton.rightThigh = rightThigh;

    createBoneLine(rightThigh, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.thighLength, 0), colors.rightLeg);
    createJointSphere(rightThigh, new THREE.Vector3(0, -SKELETON_CONFIG.thighLength, 0), SKELETON_CONFIG.jointRadius, colors.joint, 14);

    // 15. Right Foot
    const rightShin = new THREE.Object3D();
    rightShin.position.set(0, -SKELETON_CONFIG.thighLength, 0);
    rightThigh.add(rightShin);
    skeleton.rightShin = rightShin;

    createBoneLine(rightShin, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -SKELETON_CONFIG.shinLength, 0), colors.rightLeg);
    createJointSphere(rightShin, new THREE.Vector3(0, -SKELETON_CONFIG.shinLength, 0), SKELETON_CONFIG.jointRadius, colors.joint, 15);

    // Save shoulder positions for animation
    leftShoulderPosRef = leftShoulderPos.clone();
    rightShoulderPosRef = rightShoulderPos.clone();
    
    // Initial pose
    updatePose(0);
}

const ANIM_SPEED = 8;
const SWING_ANGLE = 0.6;
const MOVE_SPEED = 4.5;

const baseRootY = SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength;

function updatePose(gunAngle) {
    const maxAngle = 60;
    const clampedAngle = Math.max(-maxAngle, Math.min(maxAngle, gunAngle));
    const gunAngleRad = THREE.MathUtils.degToRad(clampedAngle);
    
    skeleton.gunGroup.rotation.set(gunAngleRad, 0, 0);
    skeleton.gunGroup.updateMatrix();
    
    const gunMiddlePos = new THREE.Vector3(0, 0, SKELETON_CONFIG.gunLength / 3);
    const gunEndPos = new THREE.Vector3(0, 0, SKELETON_CONFIG.gunLength * 2 / 3);
    
    gunMiddlePos.applyMatrix4(skeleton.gunGroup.matrix);
    gunEndPos.applyMatrix4(skeleton.gunGroup.matrix);
    
    connectArmToTarget(
        skeleton.leftUpperArm, 
        skeleton.leftForearm, 
        leftShoulderPosRef, 
        gunEndPos, 
        true
    );
    
    connectArmToTarget(
        skeleton.rightUpperArm, 
        skeleton.rightForearm, 
        rightShoulderPosRef, 
        gunMiddlePos, 
        false
    );
}

function updateLegs(animTime, isRunning) {
    if (!isRunning) {
        skeleton.leftThigh.rotation.x = 0;
        skeleton.rightThigh.rotation.x = 0;
        skeleton.leftShin.rotation.x = 0;
        skeleton.rightShin.rotation.x = 0;
        return;
    }
    
    const swingAngle = Math.sin(animTime) * SWING_ANGLE;
    const swingAngleOpposite = Math.sin(animTime + Math.PI) * SWING_ANGLE;
    
    skeleton.leftThigh.rotation.x = swingAngle;
    skeleton.rightThigh.rotation.x = swingAngleOpposite;
    
    const leftKneeBend = swingAngle > 0 ? swingAngle * 0.8 : 0;
    const rightKneeBend = swingAngleOpposite > 0 ? swingAngleOpposite * 0.8 : 0;
    
    skeleton.leftShin.rotation.x = leftKneeBend;
    skeleton.rightShin.rotation.x = rightKneeBend;
}

function setCrouchPose() {
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

function setJumpPose(jumpHeight) {
    const slightBend = 0.3;
    skeleton.leftThigh.rotation.x = -slightBend;
    skeleton.rightThigh.rotation.x = -slightBend;
    skeleton.leftShin.rotation.x = slightBend * 0.8;
    skeleton.rightShin.rotation.x = slightBend * 0.8;
    skeleton.root.position.y = baseRootY + jumpHeight;
}

function testCrouchPose() {
    setCrouchPose();
    
    const gunAngle = 0;
    updatePose(gunAngle);
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

const testState = {
    phaseIndex: 0,
    phaseTime: 0,
    animTime: 0,
    jumpTime: 0
};

function updateTest(deltaTime) {
    const phase = testPhases[testState.phaseIndex];
    
    testState.phaseTime += deltaTime;
    testState.animTime += deltaTime * ANIM_SPEED;
    
    if (phase.isJumping) {
        testState.jumpTime += deltaTime;
    }
    
    if (testState.phaseTime >= phase.duration) {
        testState.phaseTime = 0;
        testState.jumpTime = 0;
        testState.phaseIndex = (testState.phaseIndex + 1) % testPhases.length;
    }
    
    skeleton.root.position.x += phase.moveDir.x * MOVE_SPEED * deltaTime;
    skeleton.root.position.z += phase.moveDir.z * MOVE_SPEED * deltaTime;
    
    if (phase.isJumping) {
        const jumpCycle = testState.jumpTime;
        const jumpHeight = Math.abs(Math.sin(jumpCycle * Math.PI / phase.duration)) * 0.5;
        const slightBend = 0.3;
        skeleton.leftThigh.rotation.x = -slightBend;
        skeleton.rightThigh.rotation.x = -slightBend;
        skeleton.leftShin.rotation.x = slightBend * 0.8;
        skeleton.rightShin.rotation.x = slightBend * 0.8;
        skeleton.root.position.y = baseRootY + jumpHeight;
    } else if (phase.isCrouching) {
        setCrouchPose();
    } else {
        skeleton.root.position.y = baseRootY;
        skeleton.leftThigh.rotation.x = 0;
        skeleton.rightThigh.rotation.x = 0;
        skeleton.leftShin.rotation.x = 0;
        skeleton.rightShin.rotation.x = 0;
    }
    
    if (!phase.isCrouching) {
        updateLegs(testState.animTime, phase.isRunning);
    }
    
    const gunAngle = Math.sin(testState.animTime * 0.25) * 40;
    updatePose(gunAngle);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    updateTest(deltaTime);
    
    controls.update();
    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', init);
