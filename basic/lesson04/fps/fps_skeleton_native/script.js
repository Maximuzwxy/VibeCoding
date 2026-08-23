let scene, camera, renderer, controls;
let skeleton, skeletonHelper;
let bones = {};

const SKELETON_CONFIG = {
    pelvisLength: 0.27,
    torsoLength: 0.5,
    headRadius: 0.1,
    upperArmLength: 0.3,
    forearmLength: 0.3,
    thighLength: 0.45,
    shinLength: 0.45,
    shoulderWidth: 0.18,
    boneRadius: 0.04
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

    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x5a5a5a);
    scene.add(gridHelper);

    createNativeSkeleton();

    setupControls();

    camera.position.set(3, 2, 4);
    camera.lookAt(0, 1, 0);

    animate();

    window.addEventListener('resize', onWindowResize);
}

function createBone(length, radius, color) {
    const geometry = new THREE.CylinderGeometry(radius, radius, length, 8);
    geometry.translate(0, length / 2, 0);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
}

function createJoint(radius, color) {
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: color });
    return new THREE.Mesh(geometry, material);
}

function createNativeSkeleton() {
    const boneGroup = new THREE.Group();
    scene.add(boneGroup);

    const halfPelvis = SKELETON_CONFIG.pelvisLength / 2;
    const halfShoulder = SKELETON_CONFIG.shoulderWidth;

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

    const rootBone = new THREE.Bone();
    rootBone.position.set(0, 0, 0);
    boneGroup.add(rootBone);
    bones.root = rootBone;

    const pelvisBone = new THREE.Bone();
    pelvisBone.position.set(0, 0, 0);
    rootBone.add(pelvisBone);
    bones.pelvis = pelvisBone;

    const pelvisMesh = createBone(SKELETON_CONFIG.pelvisLength, SKELETON_CONFIG.boneRadius, colors.pelvis);
    pelvisMesh.rotation.z = Math.PI / 2;
    pelvisBone.add(pelvisMesh);

    const pelvisJoint = createJoint(SKELETON_CONFIG.boneRadius * 1.5, colors.joint);
    pelvisJoint.position.set(0, 0, 0);
    pelvisBone.add(pelvisJoint);

    const leftHipPos = new THREE.Vector3(halfPelvis, 0, 0);
    const rightHipPos = new THREE.Vector3(-halfPelvis, 0, 0);
    bones.leftHipPos = leftHipPos.clone();
    bones.rightHipPos = rightHipPos.clone();

    const leftHipJoint = createJoint(SKELETON_CONFIG.boneRadius, colors.joint);
    leftHipJoint.position.copy(leftHipPos);
    pelvisBone.add(leftHipJoint);

    const rightHipJoint = createJoint(SKELETON_CONFIG.boneRadius, colors.joint);
    rightHipJoint.position.copy(rightHipPos);
    pelvisBone.add(rightHipJoint);

    const spineBone = new THREE.Bone();
    spineBone.position.set(0, 0, 0);
    pelvisBone.add(spineBone);
    bones.spine = spineBone;

    const spineMesh = createBone(SKELETON_CONFIG.torsoLength, SKELETON_CONFIG.boneRadius, colors.spine);
    spineBone.add(spineMesh);

    const spineTopJoint = createJoint(SKELETON_CONFIG.boneRadius, colors.joint);
    spineTopJoint.position.set(0, SKELETON_CONFIG.torsoLength, 0);
    spineBone.add(spineTopJoint);

    const shoulderY = SKELETON_CONFIG.torsoLength;
    const shouldersBone = new THREE.Bone();
    shouldersBone.position.set(0, shoulderY, 0);
    spineBone.add(shouldersBone);
    bones.shoulders = shouldersBone;

    const leftShoulderPos = new THREE.Vector3(halfShoulder, 0, 0);
    const rightShoulderPos = new THREE.Vector3(-halfShoulder, 0, 0);
    bones.leftShoulderPos = leftShoulderPos.clone();
    bones.rightShoulderPos = rightShoulderPos.clone();

    const shoulderBarMesh = createBone(SKELETON_CONFIG.shoulderWidth * 2, SKELETON_CONFIG.boneRadius * 0.8, colors.spine);
    shoulderBarMesh.rotation.z = Math.PI / 2;
    shoulderBarMesh.position.set(0, 0, 0);
    shouldersBone.add(shoulderBarMesh);

    const shoulderCenterJoint = createJoint(SKELETON_CONFIG.boneRadius, colors.joint);
    shoulderCenterJoint.position.set(0, 0, 0);
    shouldersBone.add(shoulderCenterJoint);

    const leftShoulderJoint = createJoint(SKELETON_CONFIG.boneRadius, colors.joint);
    leftShoulderJoint.position.copy(leftShoulderPos);
    shouldersBone.add(leftShoulderJoint);

    const rightShoulderJoint = createJoint(SKELETON_CONFIG.boneRadius, colors.joint);
    rightShoulderJoint.position.copy(rightShoulderPos);
    shouldersBone.add(rightShoulderJoint);

    const headBone = new THREE.Bone();
    headBone.position.set(0, 0, 0);
    shouldersBone.add(headBone);
    bones.head = headBone;

    const headSphere = new THREE.Mesh(
        new THREE.SphereGeometry(SKELETON_CONFIG.headRadius, 16, 16),
        new THREE.MeshBasicMaterial({ color: colors.head })
    );
    headSphere.position.set(0, SKELETON_CONFIG.headRadius, 0);
    headBone.add(headSphere);

    const headTopJoint = createJoint(SKELETON_CONFIG.boneRadius, colors.joint);
    headTopJoint.position.set(0, SKELETON_CONFIG.headRadius * 2, 0);
    headBone.add(headTopJoint);

    const leftUpperArmBone = new THREE.Bone();
    leftUpperArmBone.position.copy(leftShoulderPos);
    shouldersBone.add(leftUpperArmBone);
    bones.leftUpperArm = leftUpperArmBone;

    const leftUpperArmMesh = createBone(SKELETON_CONFIG.upperArmLength, SKELETON_CONFIG.boneRadius, colors.leftArm);
    leftUpperArmBone.add(leftUpperArmMesh);

    const leftElbowJoint = createJoint(SKELETON_CONFIG.boneRadius, colors.joint);
    leftElbowJoint.position.set(0, -SKELETON_CONFIG.upperArmLength, 0);
    leftUpperArmBone.add(leftElbowJoint);

    const leftForearmBone = new THREE.Bone();
    leftForearmBone.position.set(0, -SKELETON_CONFIG.upperArmLength, 0);
    leftUpperArmBone.add(leftForearmBone);
    bones.leftForearm = leftForearmBone;

    const leftForearmMesh = createBone(SKELETON_CONFIG.forearmLength, SKELETON_CONFIG.boneRadius * 0.8, colors.leftArm);
    leftForearmBone.add(leftForearmMesh);

    const rightUpperArmBone = new THREE.Bone();
    rightUpperArmBone.position.copy(rightShoulderPos);
    shouldersBone.add(rightUpperArmBone);
    bones.rightUpperArm = rightUpperArmBone;

    const rightUpperArmMesh = createBone(SKELETON_CONFIG.upperArmLength, SKELETON_CONFIG.boneRadius, colors.rightArm);
    rightUpperArmBone.add(rightUpperArmMesh);

    const rightElbowJoint = createJoint(SKELETON_CONFIG.boneRadius, colors.joint);
    rightElbowJoint.position.set(0, -SKELETON_CONFIG.upperArmLength, 0);
    rightUpperArmBone.add(rightElbowJoint);

    const rightForearmBone = new THREE.Bone();
    rightForearmBone.position.set(0, -SKELETON_CONFIG.upperArmLength, 0);
    rightUpperArmBone.add(rightForearmBone);
    bones.rightForearm = rightForearmBone;

    const rightForearmMesh = createBone(SKELETON_CONFIG.forearmLength, SKELETON_CONFIG.boneRadius * 0.8, colors.rightArm);
    rightForearmBone.add(rightForearmMesh);

    const leftThighBone = new THREE.Bone();
    leftThighBone.position.copy(leftHipPos);
    pelvisBone.add(leftThighBone);
    bones.leftThigh = leftThighBone;

    const leftThighMesh = createBone(SKELETON_CONFIG.thighLength, SKELETON_CONFIG.boneRadius, colors.leftLeg);
    leftThighBone.add(leftThighMesh);

    const leftKneeJoint = createJoint(SKELETON_CONFIG.boneRadius, colors.joint);
    leftKneeJoint.position.set(0, -SKELETON_CONFIG.thighLength, 0);
    leftThighBone.add(leftKneeJoint);

    const leftShinBone = new THREE.Bone();
    leftShinBone.position.set(0, -SKELETON_CONFIG.thighLength, 0);
    leftThighBone.add(leftShinBone);
    bones.leftShin = leftShinBone;

    const leftShinMesh = createBone(SKELETON_CONFIG.shinLength, SKELETON_CONFIG.boneRadius * 0.8, colors.leftLeg);
    leftShinBone.add(leftShinMesh);

    const rightThighBone = new THREE.Bone();
    rightThighBone.position.copy(rightHipPos);
    pelvisBone.add(rightThighBone);
    bones.rightThigh = rightThighBone;

    const rightThighMesh = createBone(SKELETON_CONFIG.thighLength, SKELETON_CONFIG.boneRadius, colors.rightLeg);
    rightThighBone.add(rightThighMesh);

    const rightKneeJoint = createJoint(SKELETON_CONFIG.boneRadius, colors.joint);
    rightKneeJoint.position.set(0, -SKELETON_CONFIG.thighLength, 0);
    rightThighBone.add(rightKneeJoint);

    const rightShinBone = new THREE.Bone();
    rightShinBone.position.set(0, -SKELETON_CONFIG.thighLength, 0);
    rightThighBone.add(rightShinBone);
    bones.rightShin = rightShinBone;

    const rightShinMesh = createBone(SKELETON_CONFIG.shinLength, SKELETON_CONFIG.boneRadius * 0.8, colors.rightLeg);
    rightShinBone.add(rightShinMesh);

    skeleton = new THREE.Skeleton([
        rootBone,
        pelvisBone,
        spineBone,
        shouldersBone,
        headBone,
        leftUpperArmBone,
        leftForearmBone,
        rightUpperArmBone,
        rightForearmBone,
        leftThighBone,
        leftShinBone,
        rightThighBone,
        rightShinBone
    ]);

    const skeletonHelper = new THREE.SkeletonHelper(boneGroup);
    skeletonHelper.material.linewidth = 2;
    scene.add(skeletonHelper);

    boneGroup.position.y = SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength;

    window.bones = bones;
    window.skeleton = skeleton;
}

function setupControls() {
    document.getElementById('pelvisRotY').addEventListener('input', (e) => {
        const angle = parseFloat(e.target.value);
        if (bones.pelvis) {
            bones.pelvis.rotation.y = THREE.MathUtils.degToRad(angle);
        }
    });

    document.getElementById('spineRotY').addEventListener('input', (e) => {
        const angle = parseFloat(e.target.value);
        if (bones.shoulders) {
            bones.shoulders.rotation.y = THREE.MathUtils.degToRad(angle);
        }
    });

    document.getElementById('leftArmRotX').addEventListener('input', (e) => {
        const angle = parseFloat(e.target.value);
        if (bones.leftUpperArm) {
            bones.leftUpperArm.rotation.x = THREE.MathUtils.degToRad(angle);
        }
    });

    document.getElementById('rightArmRotX').addEventListener('input', (e) => {
        const angle = parseFloat(e.target.value);
        if (bones.rightUpperArm) {
            bones.rightUpperArm.rotation.x = THREE.MathUtils.degToRad(angle);
        }
    });

    document.getElementById('headRotY').addEventListener('input', (e) => {
        const angle = parseFloat(e.target.value);
        if (bones.head) {
            bones.head.rotation.y = THREE.MathUtils.degToRad(angle);
        }
    });

    document.getElementById('leftLegRotX').addEventListener('input', (e) => {
        const angle = parseFloat(e.target.value);
        if (bones.leftThigh) {
            bones.leftThigh.rotation.x = THREE.MathUtils.degToRad(angle);
        }
    });

    document.getElementById('rightLegRotX').addEventListener('input', (e) => {
        const angle = parseFloat(e.target.value);
        if (bones.rightThigh) {
            bones.rightThigh.rotation.x = THREE.MathUtils.degToRad(angle);
        }
    });

    document.addEventListener('keydown', (e) => {
        const rotationStep = 0.1;
        switch(e.code) {
            case 'KeyW':
                if (bones.pelvis) bones.pelvis.rotation.y += rotationStep;
                break;
            case 'KeyS':
                if (bones.pelvis) bones.pelvis.rotation.y -= rotationStep;
                break;
            case 'KeyA':
                if (bones.shoulders) bones.shoulders.rotation.y += rotationStep;
                break;
            case 'KeyD':
                if (bones.shoulders) bones.shoulders.rotation.y -= rotationStep;
                break;
            case 'KeyQ':
                if (bones.leftUpperArm) bones.leftUpperArm.rotation.x += rotationStep;
                break;
            case 'KeyE':
                if (bones.rightUpperArm) bones.rightUpperArm.rotation.x += rotationStep;
                break;
            case 'ArrowUp':
                if (bones.head) bones.head.rotation.x -= rotationStep;
                break;
            case 'ArrowDown':
                if (bones.head) bones.head.rotation.x += rotationStep;
                break;
        }
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', init);
