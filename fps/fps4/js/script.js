let scene, camera, renderer;
let axesHelper, gridHelper;

const clock = new THREE.Clock();

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

    gridHelper = new THREE.GridHelper(30, 30, 0x444444, 0x5a5a5a);
    scene.add(gridHelper);

    npc = new NPC(scene, new THREE.Vector3(1, SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength, -5));
    player = new Player(scene, new THREE.Vector3(1, SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength, -9));

    const wallGeometry = new THREE.BoxGeometry(6, 1.5, 0.5);
    const wallMaterial = new THREE.MeshBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.3,
        depthWrite: false
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(0, 1.5, -7);
    scene.add(wall);

    player.addObstacle(wall);
    npc.addObstacle(wall);

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
