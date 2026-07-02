let scene, camera, renderer;
const clock = new THREE.Clock();
let player;
let playerTeamNPCs = [];
let enemyTeamNPCs = [];
let allNPCs = [];
let npcAIs = [];

let frameCount = 0;
let fpsTime = 0;
let currentFPS = 0;

const ARENA_SIZE = 60;
const WALL_HEIGHT = 3;
const WALL_THICKNESS = 0.5;

const obstacles = [];

let gameConfig = {
    playerTeamColor: 0x4444ff,
    playerTeamNpcs: 5,
    enemyTeamColor: 0xff4444,
    enemyTeamNpcs: 5,
    playerHealth: 10,
    npcHealth: 10,
    hitRate: {
        closeRange: 0.8,
        midRange: 0.5,
        farRange: 0.2,
        targetMovePenalty: 0.5,
        npcMovePenalty: 0.5
    }
};

function parseConfig() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('playerColor')) {
        gameConfig.playerTeamColor = parseInt(params.get('playerColor'));
    }
    if (params.has('playerNpcs')) {
        gameConfig.playerTeamNpcs = parseInt(params.get('playerNpcs'));
    }
    if (params.has('enemyColor')) {
        gameConfig.enemyTeamColor = parseInt(params.get('enemyColor'));
    }
    if (params.has('enemyNpcs')) {
        gameConfig.enemyTeamNpcs = parseInt(params.get('enemyNpcs'));
    }
    if (params.has('closeRange')) {
        gameConfig.hitRate.closeRange = parseInt(params.get('closeRange')) / 100;
    }
    if (params.has('midRange')) {
        gameConfig.hitRate.midRange = parseInt(params.get('midRange')) / 100;
    }
    if (params.has('farRange')) {
        gameConfig.hitRate.farRange = parseInt(params.get('farRange')) / 100;
    }
    if (params.has('targetMove')) {
        gameConfig.hitRate.targetMovePenalty = parseInt(params.get('targetMove')) / 100;
    }
    if (params.has('npcMove')) {
        gameConfig.hitRate.npcMovePenalty = parseInt(params.get('npcMove')) / 100;
    }
    if (params.has('playerHealth')) {
        gameConfig.playerHealth = parseInt(params.get('playerHealth'));
    }
    if (params.has('npcHealth')) {
        gameConfig.npcHealth = parseInt(params.get('npcHealth'));
    }
}

function init() {
    parseConfig();

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
    createWalls();
    createTrees();
    createGrass();
    createBoxes();

    const fpsUI = document.createElement('div');
    fpsUI.id = 'fps-ui';
    fpsUI.style.position = 'fixed';
    fpsUI.style.top = '10px';
    fpsUI.style.right = '10px';
    fpsUI.style.color = '#00ff00';
    fpsUI.style.fontSize = '16px';
    fpsUI.style.fontFamily = 'monospace';
    fpsUI.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)';
    fpsUI.style.zIndex = '1000';
    fpsUI.textContent = 'FPS: 0';
    document.body.appendChild(fpsUI);

    const wallXPositions = [-19.44, -6.48, 6.48, 19.44];

    const playerWallIndex = Math.floor(Math.random() * 4);
    const playerPos = new THREE.Vector3(wallXPositions[playerWallIndex], SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength, -25);
    player = new Player(scene, playerPos, 'player', gameConfig.playerTeamColor);
    player.setMaxHealth(gameConfig.playerHealth);

    const playerTeamNPCCount = gameConfig.playerTeamNpcs;
    const enemyTeamNPCCount = gameConfig.enemyTeamNpcs;

    for (let i = 0; i < playerTeamNPCCount; i++) {
        const wallIndex = Math.floor(Math.random() * 4);
        const npcPos = new THREE.Vector3(
            wallXPositions[wallIndex],
            SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength,
            -25
        );
        const npc = new NPC(scene, npcPos, 'player', gameConfig.playerTeamColor, i + 1);
        npc.setMaxHealth(gameConfig.npcHealth);
        playerTeamNPCs.push(npc);
    }

    for (let i = 0; i < enemyTeamNPCCount; i++) {
        const wallIndex = Math.floor(Math.random() * 4);
        const npcPos = new THREE.Vector3(
            wallXPositions[wallIndex],
            SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength,
            25
        );
        const npc = new NPC(scene, npcPos, 'enemy', gameConfig.enemyTeamColor, i + 1);
        npc.setMaxHealth(gameConfig.npcHealth);
        enemyTeamNPCs.push(npc);
    }

    allNPCs = [...playerTeamNPCs, ...enemyTeamNPCs];

    const allCharacters = [player, ...allNPCs];

    player.onHealthChange = () => updateHealthUI();
    allNPCs.forEach(npc => {
        npc.onHealthChange = () => updateHealthUI();
        npc.players = allCharacters.filter(c => c !== npc);
        const ai = new NPCAI(npc, null, gameConfig.hitRate);
        npcAIs.push(ai);
    });

    obstacles.forEach(obstacle => {
        allCharacters.forEach(char => {
            char.addObstacle(obstacle);
        });
    });

    for (let i = 0; i < allCharacters.length; i++) {
        for (let j = i + 1; j < allCharacters.length; j++) {
            allCharacters[i].addCharacterCollisionTarget(allCharacters[j]);
            allCharacters[j].addCharacterCollisionTarget(allCharacters[i]);
        }
    }

    audioManager.init();
    audioManager.initVoice();

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

function createWalls() {
    const wallGeometry = new THREE.BoxGeometry(4.8, 2.4, 0.6);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

    const wallPositions = [
        { pos: [-19.44, 1.2, -22] },
        { pos: [-6.48, 1.2, -22] },
        { pos: [6.48, 1.2, -22] },
        { pos: [19.44, 1.2, -22] },
        { pos: [-19.44, 1.2, 22] },
        { pos: [-6.48, 1.2, 22] },
        { pos: [6.48, 1.2, 22] },
        { pos: [19.44, 1.2, 22] }
    ];

    wallPositions.forEach(wall => {
        const mesh = new THREE.Mesh(wallGeometry, wallMaterial);
        mesh.position.set(...wall.pos);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        obstacles.push(mesh);
    });
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

    const gridSize = 6;
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
            if (position.z < -22 || position.z > 22) {
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
    document.addEventListener('click', (e) => {
        if (e.button === 2) return;
        if (!player.isDead) {
            player.shoot(allNPCs);
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
        npcHealthUI.style.zIndex = '1000';
        npcHealthUI.style.textAlign = 'right';
        document.body.appendChild(npcHealthUI);
    }

    function getHealthColor(health, maxHealth) {
        const ratio = health / maxHealth;
        const r = Math.round(255 * (1 - ratio));
        const g = Math.round(255 * ratio);
        return `rgb(${r}, ${g}, 0)`;
    }

    function createHealthBar(health, maxHealth, width = 100) {
        const ratio = health / maxHealth;
        const color = getHealthColor(health, maxHealth);
        return `<div style="display:inline-block;width:${width}px;height:16px;background:#333;border:2px solid #888;border-radius:3px;vertical-align:middle;position:relative;box-sizing:border-box;">
            <div style="width:${Math.round(ratio * 100)}%;height:100%;background:${color};border-radius:1px;box-sizing:border-box;"></div>
        </div>`;
    }

    function createGrenadeIcon(count) {
        const canvas = document.createElement('canvas');
        canvas.width = 20;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(10, 12, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.fillRect(8, 4, 4, 4);
        
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(10, 4, 3, Math.PI, 0);
        ctx.stroke();
        
        const dataURL = canvas.toDataURL();
        return `<img src="${dataURL}" style="width:20px;height:20px;vertical-align:middle;" />`;
    }

    const playerHealthHTML = player.isDead 
        ? `<div style="color:#ff4444;font-size:14px;font-family:Arial;text-shadow:1px 1px 2px rgba(0,0,0,0.8);">玩家: 已阵亡</div>`
        : `<div style="display:flex;align-items:center;gap:8px;font-family:Arial;color:white;text-shadow:1px 1px 2px rgba(0,0,0,0.8);font-size:14px;">
            <span>玩家</span>
            ${createHealthBar(player.health, player.maxHealth)}
            <span>${player.health}/${player.maxHealth}</span>
            ${createGrenadeIcon(player.grenadeCount)}
            <span>x${player.grenadeCount}</span>
        </div>`;

    let playerTeamHTML = '<div style="color:#44ff44;font-size:14px;font-family:Arial;text-shadow:1px 1px 2px rgba(0,0,0,0.8);margin-bottom:4px;">我方:</div>';
    playerTeamNPCs.forEach(npc => {
        if (npc.isDead) {
            playerTeamHTML += `<div style="color:#888;font-size:12px;font-family:Arial;margin-bottom:3px;">NPC ${npc.npcId}: 已阵亡</div>`;
        } else {
            playerTeamHTML += `<div style="display:flex;align-items:center;gap:6px;font-family:Arial;color:white;font-size:12px;margin-bottom:3px;">
                <span style="width:40px;">NPC ${npc.npcId}</span>
                ${createHealthBar(npc.health, npc.maxHealth, 100)}
                <span>${npc.health}/${npc.maxHealth}</span>
            </div>`;
        }
    });

    let enemyTeamHTML = '<div style="color:#ff4444;font-size:14px;font-family:Arial;text-shadow:1px 1px 2px rgba(0,0,0,0.8);margin-bottom:4px;">敌方:</div>';
    enemyTeamNPCs.forEach(npc => {
        if (npc.isDead) {
            enemyTeamHTML += `<div style="color:#888;font-size:12px;font-family:Arial;margin-bottom:3px;">NPC ${npc.npcId}: 已阵亡</div>`;
        } else {
            enemyTeamHTML += `<div style="display:flex;align-items:center;gap:6px;font-family:Arial;color:white;font-size:12px;justify-content:flex-end;margin-bottom:3px;">
                <span>${npc.health}/${npc.maxHealth}</span>
                ${createHealthBar(npc.health, npc.maxHealth, 100)}
                <span style="width:40px;text-align:right;">NPC ${npc.npcId}</span>
            </div>`;
        }
    });

    healthUI.innerHTML = playerHealthHTML + '<br>' + playerTeamHTML;
    npcHealthUI.innerHTML = enemyTeamHTML;

    const playerTeamAlive = (player.isDead ? 0 : 1) + playerTeamNPCs.filter(npc => !npc.isDead).length;
    const enemyTeamAlive = enemyTeamNPCs.filter(npc => !npc.isDead).length;
    const playerTeamTotal = 1 + playerTeamNPCs.length;
    const enemyTeamTotal = enemyTeamNPCs.length;

    if (playerTeamAlive === 0 || enemyTeamAlive === 0) {
        if (playerTeamAlive === 0) {
            showGameOver('lose');
        } else {
            showGameOver('win');
        }
    }
}

function showGameOver(result) {
    let gameOverUI = document.getElementById('game-over-ui');
    if (gameOverUI) return;

    gameOverUI = document.createElement('div');
    gameOverUI.id = 'game-over-ui';
    gameOverUI.style.position = 'fixed';
    gameOverUI.style.top = '0';
    gameOverUI.style.left = '0';
    gameOverUI.style.width = '100%';
    gameOverUI.style.height = '100%';
    gameOverUI.style.background = 'rgba(0,0,0,0.7)';
    gameOverUI.style.display = 'flex';
    gameOverUI.style.flexDirection = 'column';
    gameOverUI.style.justifyContent = 'center';
    gameOverUI.style.alignItems = 'center';
    gameOverUI.style.zIndex = '2000';

    const title = document.createElement('div');
    title.style.color = 'white';
    title.style.fontSize = '48px';
    title.style.fontFamily = 'Arial';
    title.style.textShadow = '2px 2px 8px rgba(0,0,0,0.8)';
    title.style.marginBottom = '30px';
    title.textContent = result === 'win' ? '🎉 你赢了!' : '💀 你输了!';

    const message = document.createElement('div');
    message.style.color = '#cccccc';
    message.style.fontSize = '24px';
    message.style.fontFamily = 'Arial';
    message.style.marginBottom = '30px';
    message.textContent = '是否重新开始？';

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '20px';

    const restartBtn = document.createElement('button');
    restartBtn.textContent = '🔄 重新开始';
    restartBtn.style.padding = '15px 30px';
    restartBtn.style.fontSize = '20px';
    restartBtn.style.fontFamily = 'Arial';
    restartBtn.style.background = 'linear-gradient(135deg, #00d4ff, #0099cc)';
    restartBtn.style.border = 'none';
    restartBtn.style.borderRadius = '10px';
    restartBtn.style.color = '#fff';
    restartBtn.style.cursor = 'pointer';
    restartBtn.addEventListener('click', () => {
        location.reload();
    });

    const configBtn = document.createElement('button');
    configBtn.textContent = '⚙️ 重新配置';
    configBtn.style.padding = '15px 30px';
    configBtn.style.fontSize = '20px';
    configBtn.style.fontFamily = 'Arial';
    configBtn.style.background = 'linear-gradient(135deg, #ff6b6b, #cc4444)';
    configBtn.style.border = 'none';
    configBtn.style.borderRadius = '10px';
    configBtn.style.color = '#fff';
    configBtn.style.cursor = 'pointer';
    configBtn.addEventListener('click', () => {
        window.location.href = 'config.html';
    });

    buttonContainer.appendChild(restartBtn);
    buttonContainer.appendChild(configBtn);
    gameOverUI.appendChild(title);
    gameOverUI.appendChild(message);
    gameOverUI.appendChild(buttonContainer);
    document.body.appendChild(gameOverUI);
}

function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    
    frameCount++;
    fpsTime += deltaTime;
    if (fpsTime >= 1.0) {
        currentFPS = Math.round(frameCount / fpsTime);
        frameCount = 0;
        fpsTime = 0;
        
        let fpsUI = document.getElementById('fps-ui');
        if (fpsUI) {
            fpsUI.textContent = `FPS: ${currentFPS}`;
        }
    }
    
    if (!player.isDead) {
        player.update(deltaTime);
    } else {
        player.update(deltaTime);
    }
    
    npcAIs.forEach((ai, index) => {
        const npc = allNPCs[index];
        if (!npc.isDead) {
            ai.update(deltaTime);
        } else {
            npc.update(deltaTime);
        }
    });
    
    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', init);
