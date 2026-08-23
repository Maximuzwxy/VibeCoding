let scene, camera, renderer;
const clock = new THREE.Clock();
let npcAggressive;
let npcConservative;
let player;
let npcAIs = [];

const ARENA_SIZE = 60;
const WALL_HEIGHT = 3;
const WALL_THICKNESS = 0.5;

const obstacles = [];

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 30, 60);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const canvas = document.getElementById('scene-canvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(15, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    scene.add(directionalLight);

    createGround();
    createBoundaryWalls();
    createClouds();
    createPlayerWalls();
    createNPCWalls();
    createTrees();
    createGrass();
    createBoxes();

    const playerPos = new THREE.Vector3(-6.48, SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength, -25);
    const npcAggPos = new THREE.Vector3(-6.48, SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength, 25);
    const npcConPos = new THREE.Vector3(6.48, SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength, 25);

    npcAggressive = new NPC(scene, npcAggPos, 'aggressive');
    npcConservative = new NPC(scene, npcConPos, 'conservative');
    player = new Player(scene, playerPos);

    npcAggressive.players = [player];
    npcConservative.players = [player];

    const aiAggressive = new NPCAI(npcAggressive, player);
    const aiConservative = new NPCAI(npcConservative, player);
    npcAIs = [aiAggressive, aiConservative];

    obstacles.forEach(obstacle => {
        player.addObstacle(obstacle);
        npcAggressive.addObstacle(obstacle);
        npcConservative.addObstacle(obstacle);
    });

    player.addCharacterCollisionTarget(npcAggressive);
    player.addCharacterCollisionTarget(npcConservative);
    npcAggressive.addCharacterCollisionTarget(player);
    npcAggressive.addCharacterCollisionTarget(npcConservative);
    npcConservative.addCharacterCollisionTarget(player);
    npcConservative.addCharacterCollisionTarget(npcAggressive);

    audioManager.init();

    setupShooting();
    updateHealthUI();

    animate();
    window.addEventListener('resize', onWindowResize);
}

function createGround() {
    const groundGeometry = new THREE.PlaneGeometry(ARENA_SIZE, ARENA_SIZE);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(ARENA_SIZE, 50, 0x3d8b40, 0x3d8b40);
    gridHelper.position.y = 0.01;
    gridHelper.material.opacity = 0.15;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);
}

function createBoundaryWalls() {
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    const halfSize = ARENA_SIZE / 2;

    const walls = [
        { size: [ARENA_SIZE, WALL_HEIGHT, WALL_THICKNESS], pos: [0, WALL_HEIGHT / 2, -halfSize] },
        { size: [ARENA_SIZE, WALL_HEIGHT, WALL_THICKNESS], pos: [0, WALL_HEIGHT / 2, halfSize] },
        { size: [WALL_THICKNESS, WALL_HEIGHT, ARENA_SIZE], pos: [-halfSize, WALL_HEIGHT / 2, 0] },
        { size: [WALL_THICKNESS, WALL_HEIGHT, ARENA_SIZE], pos: [halfSize, WALL_HEIGHT / 2, 0] }
    ];

    walls.forEach(wall => {
        const geometry = new THREE.BoxGeometry(...wall.size);
        const mesh = new THREE.Mesh(geometry, wallMaterial);
        mesh.position.set(...wall.pos);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        obstacles.push(mesh);
    });
}

function createClouds() {
    const cloudMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    
    for (let i = 0; i < 20; i++) {
        const cloud = new THREE.Group();
        const numPuffs = 3 + Math.floor(Math.random() * 4);
        
        for (let j = 0; j < numPuffs; j++) {
            const size = 2 + Math.random() * 3;
            const puffGeometry = new THREE.SphereGeometry(size, 8, 8);
            const puff = new THREE.Mesh(puffGeometry, cloudMaterial);
            puff.position.set(
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 4
            );
            puff.scale.y = 0.6;
            cloud.add(puff);
        }
        
        cloud.position.set(
            (Math.random() - 0.5) * 80,
            15 + Math.random() * 10,
            (Math.random() - 0.5) * 80
        );
        
        scene.add(cloud);
    }
}

function createPlayerWalls() {
    const wallGeometry = new THREE.BoxGeometry(4.8, 2.4, 0.6);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

    const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall1.position.set(-19.44, 1.2, -22);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    scene.add(wall1);
    obstacles.push(wall1);

    const wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall2.position.set(-6.48, 1.2, -22);
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    scene.add(wall2);
    obstacles.push(wall2);

    const wall3 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall3.position.set(6.48, 1.2, -22);
    wall3.castShadow = true;
    wall3.receiveShadow = true;
    scene.add(wall3);
    obstacles.push(wall3);

    const wall4 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall4.position.set(19.44, 1.2, -22);
    wall4.castShadow = true;
    wall4.receiveShadow = true;
    scene.add(wall4);
    obstacles.push(wall4);
}

function createNPCWalls() {
    const wallGeometry = new THREE.BoxGeometry(4.8, 2.4, 0.6);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

    const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall1.position.set(-19.44, 1.2, 22);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    scene.add(wall1);
    obstacles.push(wall1);

    const wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall2.position.set(-6.48, 1.2, 22);
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    scene.add(wall2);
    obstacles.push(wall2);

    const wall3 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall3.position.set(6.48, 1.2, 22);
    wall3.castShadow = true;
    wall3.receiveShadow = true;
    scene.add(wall3);
    obstacles.push(wall3);

    const wall4 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall4.position.set(19.44, 1.2, 22);
    wall4.castShadow = true;
    wall4.receiveShadow = true;
    scene.add(wall4);
    obstacles.push(wall4);
}

function createTree(position) {
    const tree = new THREE.Group();

    const trunkHeight = 2 + Math.random() * 1.5;
    const trunkRadius = 0.15 + Math.random() * 0.1;
    const trunkGeometry = new THREE.CylinderGeometry(trunkRadius * 0.7, trunkRadius, trunkHeight, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    tree.add(trunk);

    const crownLayers = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < crownLayers; i++) {
        const crownRadius = 1.2 - i * 0.3 + Math.random() * 0.3;
        const crownHeight = 1.5 - i * 0.3;
        const crownGeometry = new THREE.ConeGeometry(crownRadius, crownHeight, 8);
        const crownMaterial = new THREE.MeshLambertMaterial({ 
            color: new THREE.Color().setHSL(0.28 + Math.random() * 0.08, 0.6, 0.3 + Math.random() * 0.15) 
        });
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.position.y = trunkHeight + i * 0.8;
        crown.castShadow = true;
        tree.add(crown);
    }

    tree.position.copy(position);
    scene.add(tree);
    obstacles.push(trunk);
}

function createTrees() {
    const treePositions = [];
    const minDistance = 5;
    const numTrees = 30;

    const gridSize = 8;
    const halfArena = (ARENA_SIZE - 10) / 2;
    const gridCells = Math.ceil((ARENA_SIZE - 10) / gridSize);

    for (let i = 0; i < numTrees; i++) {
        let position;
        let valid;
        let attempts = 0;

        do {
            const gridX = Math.floor(Math.random() * gridCells);
            const gridZ = Math.floor(Math.random() * gridCells);
            
            position = new THREE.Vector3(
                -halfArena + gridX * gridSize + Math.random() * gridSize,
                0,
                -halfArena + gridZ * gridSize + Math.random() * gridSize
            );

            valid = true;
            if (Math.abs(position.z) < 10) {
                valid = false;
            }

            for (const existing of treePositions) {
                if (position.distanceTo(existing) < minDistance) {
                    valid = false;
                    break;
                }
            }

            attempts++;
        } while (!valid && attempts < 50);

        if (valid) {
            treePositions.push(position);
            createTree(position);
        }
    }
}

function createGrass() {
    const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x66BB6A });
    const numGrassPatches = 100;

    for (let i = 0; i < numGrassPatches; i++) {
        const grassGeometry = new THREE.SphereGeometry(0.25, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
        const grass = new THREE.Mesh(grassGeometry, grassMaterial);
        
        grass.position.set(
            (Math.random() - 0.5) * ARENA_SIZE * 0.9,
            0,
            (Math.random() - 0.5) * ARENA_SIZE * 0.9
        );
        
        const scale = 0.5 + Math.random() * 1;
        grass.scale.set(scale, scale * 0.6, scale);
        scene.add(grass);
    }
}

function createBoxes() {
    const boxMaterial = new THREE.MeshLambertMaterial({ color: 0xD2691E });
    const tallHeight = 1.8;
    const shortHeight = 1.25;

    const boxPositions = [
        { pos: [-12, tallHeight / 2, -8], size: [1.5, tallHeight, 1.5] },
        { pos: [12, tallHeight / 2, -8], size: [1.5, tallHeight, 1.5] },
        { pos: [-12, tallHeight / 2, 8], size: [1.5, tallHeight, 1.5] },
        { pos: [12, tallHeight / 2, 8], size: [1.5, tallHeight, 1.5] },
        { pos: [-6, tallHeight / 2, 0], size: [1.5, tallHeight, 1.5] },
        { pos: [6, tallHeight / 2, 0], size: [1.5, tallHeight, 1.5] },

        { pos: [-15, shortHeight / 2, 0], size: [1.5, shortHeight, 1.5] },
        { pos: [15, shortHeight / 2, 0], size: [1.5, shortHeight, 1.5] },
        { pos: [-8, shortHeight / 2, -12], size: [1.5, shortHeight, 1.5] },
        { pos: [8, shortHeight / 2, -12], size: [1.5, shortHeight, 1.5] },
        { pos: [-8, shortHeight / 2, 12], size: [1.5, shortHeight, 1.5] },
        { pos: [8, shortHeight / 2, 12], size: [1.5, shortHeight, 1.5] }
    ];

    boxPositions.forEach(box => {
        const geometry = new THREE.BoxGeometry(...box.size);
        const mesh = new THREE.Mesh(geometry, boxMaterial);
        mesh.position.set(...box.pos);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        obstacles.push(mesh);
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupShooting() {
    document.addEventListener('click', () => {
        if (!player.isDead) {
            player.shoot([npcAggressive, npcConservative]);
            updateHealthUI();
        }
    });
}

function updateHealthUI() {
    let healthUI = document.getElementById('health-ui');
    if (!healthUI) {
        healthUI = document.createElement('div');
        healthUI.id = 'health-ui';
        healthUI.style.position = 'fixed';
        healthUI.style.bottom = '20px';
        healthUI.style.left = '20px';
        healthUI.style.color = 'white';
        healthUI.style.fontSize = '24px';
        healthUI.style.fontFamily = 'Arial';
        healthUI.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        healthUI.style.zIndex = '1000';
        document.body.appendChild(healthUI);
    }

    let npcHealthUI = document.getElementById('npc-health-ui');
    if (!npcHealthUI) {
        npcHealthUI = document.createElement('div');
        npcHealthUI.id = 'npc-health-ui';
        npcHealthUI.style.position = 'fixed';
        npcHealthUI.style.bottom = '20px';
        npcHealthUI.style.right = '20px';
        npcHealthUI.style.color = 'white';
        npcHealthUI.style.fontSize = '24px';
        npcHealthUI.style.fontFamily = 'Arial';
        npcHealthUI.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        npcHealthUI.style.zIndex = '1000';
        document.body.appendChild(npcHealthUI);
    }

    healthUI.innerHTML = '玩家: ❤️ × ' + player.health;
    npcHealthUI.innerHTML = '激进(A): ' + '❤️'.repeat(npcAggressive.health) + '🖤'.repeat(3 - npcAggressive.health) + '<br>' +
                            '保守(C): ' + '❤️'.repeat(npcConservative.health) + '🖤'.repeat(3 - npcConservative.health);

    if (player.isDead || (npcAggressive.isDead && npcConservative.isDead)) {
        let gameOverUI = document.getElementById('game-over-ui');
        if (!gameOverUI) {
            gameOverUI = document.createElement('div');
            gameOverUI.id = 'game-over-ui';
            gameOverUI.style.position = 'fixed';
            gameOverUI.style.top = '50%';
            gameOverUI.style.left = '50%';
            gameOverUI.style.transform = 'translate(-50%, -50%)';
            gameOverUI.style.color = 'white';
            gameOverUI.style.fontSize = '48px';
            gameOverUI.style.fontFamily = 'Arial';
            gameOverUI.style.textShadow = '2px 2px 8px rgba(0,0,0,0.8)';
            gameOverUI.style.zIndex = '1000';
            gameOverUI.style.textAlign = 'center';
            document.body.appendChild(gameOverUI);
        }

        if (player.isDead) {
            gameOverUI.innerHTML = '你输了!<br><span style="font-size:24px">点击重新开始</span>';
        } else {
            gameOverUI.innerHTML = '你赢了!<br><span style="font-size:24px">点击重新开始</span>';
        }

        document.addEventListener('click', () => {
            location.reload();
        }, { once: true });
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    
    if (!player.isDead) {
        player.update(deltaTime);
    } else {
        player.update(deltaTime);
    }
    
    npcAIs.forEach((ai, index) => {
        const npc = index === 0 ? npcAggressive : npcConservative;
        if (!npc.isDead) {
            ai.update(deltaTime);
        } else {
            npc.update(deltaTime);
        }
    });
    
    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', init);
