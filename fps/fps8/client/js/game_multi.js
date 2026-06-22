let scene, camera, renderer;
const clock = new THREE.Clock();

let player;
let playerTeamNPCs = [];
let enemyTeamNPCs = [];
let allNPCs = [];
let npcObjects = {};

let frameCount = 0;
let fpsTime = 0;
let currentFPS = 0;

const obstacles = [];

let networkManager = null;
let isMultiplayer = false;
let roomState = null;
let myPlayerId = null;
let myPlayerData = null;
let gameStateReceived = false;
let gameEnded = false;

let lastSentPosition = null;
let lastSentYaw = null;

const serverPlayerPositions = {};
const remotePlayers = {};
const socketIdToUserId = {};
const userIdToSocketId = {};

function parseGameState() {
    const gameStateStr = localStorage.getItem('fps8_game_state');
    if (gameStateStr) {
        roomState = JSON.parse(gameStateStr);
        isMultiplayer = true;
    }
}

function init() {
    parseGameState();

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

    if (isMultiplayer && roomState) {
        initMultiplayer();
    }

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

    audioManager.init();
    audioManager.initVoice();

    setupShooting();
    updateHealthUI();

    animate();
    window.addEventListener('resize', onWindowResize);
}

function initMultiplayer() {
    console.log('[game_multi] Initializing multiplayer mode');
    console.log('[game_multi] Room state:', roomState);
    console.log('[game_multi] Room ID:', roomState.room_id);

    console.log('[game_multi] Player list:');
    for (const [playerId, playerData] of Object.entries(roomState.players)) {
        if (!playerId.startsWith('npc_')) {
            console.log(`  - ${playerData.name} (${playerId}) - Team: ${playerData.team}`);
        }
    }

    console.log('[game_multi] Blue team NPCs:', roomState.blue_team.filter(id => id.startsWith('npc_')).length);
    console.log('[game_multi] Red team NPCs:', roomState.red_team.filter(id => id.startsWith('npc_')).length);

    const mapData = roomState.map_data;
    MapGenerator.renderMap(scene, mapData, obstacles);

    const wallXPositions = [-32.4, -10.8, 10.8, 32.4];

    const localUserId = localStorage.getItem('fps8_user_id');
    const playerKeys = Object.keys(roomState.players);
    const localPlayerKey = playerKeys.find(id => !id.startsWith('npc_') && roomState.players[id].user_id === localUserId);
    const localPlayerData = roomState.players[localPlayerKey];
    const teamColor = localPlayerData.team === 'blue' ? 0x4444ff : 0xff4444;

    const playerPos = new THREE.Vector3(
        localPlayerData.position[0],
        localPlayerData.position[1],
        localPlayerData.position[2]
    );

    player = new Player(scene, playerPos, localPlayerData.name, teamColor, localPlayerData.team);
    player.setMaxHealth(localPlayerData.max_health || localPlayerData.health);
    player.health = localPlayerData.health;
    player.onGrenadeHit = (shooterPos, targetPos, targetId, damage) => {
        if (networkManager) {
            networkManager.sendShoot(targetId, damage, shooterPos, targetPos);
        }
    };

    myPlayerId = localPlayerKey;
    myPlayerData = localPlayerData;

    const playerTeamColor = localPlayerData.team === 'blue' ? 0x4444ff : 0xff4444;
    const enemyTeamColor = localPlayerData.team === 'blue' ? 0xff4444 : 0x4444ff;

    const npcKeys = Object.keys(roomState.npcs || {});
    npcKeys.forEach(npcId => {
        const npcData = roomState.npcs[npcId];
        const isPlayerTeam = npcData.team === localPlayerData.team;
        const npcColor = isPlayerTeam ? playerTeamColor : enemyTeamColor;
        const teamName = isPlayerTeam ? 'player' : 'enemy';

        const displayId = npcId.replace('npc_', '');

        const npcPos = new THREE.Vector3(
            npcData.position[0],
            npcData.position[1],
            npcData.position[2]
        );

        const npc = new NPC(scene, npcPos, teamName, npcColor, displayId);
        npc.setMaxHealth(npcData.max_health || npcData.health);
        npc.health = npcData.health;
        npc.isDead = npcData.is_dead;
        if (npcData.is_dead) {
            npc.lieDown();
        }

        if (isPlayerTeam) {
            playerTeamNPCs.push(npc);
        } else {
            enemyTeamNPCs.push(npc);
        }
        allNPCs.push(npc);
        npcObjects[npcId] = npc;
    });

    for (const [playerId, playerData] of Object.entries(roomState.players)) {
        if (playerId.startsWith('npc_')) continue;
        if (playerId === localPlayerKey) continue;

        console.log('[game_multi] Creating remote player:', playerId, playerData.name, playerData.user_id);

        const remotePos = new THREE.Vector3(
            playerData.position[0],
            playerData.position[1],
            playerData.position[2]
        );
        const remoteColor = playerData.team === 'blue' ? 0x4444ff : 0xff4444;
        const remotePlayer = new RemotePlayer(scene, remotePos, playerData.name, remoteColor, playerData.team);
        remotePlayer.setMaxHealth(playerData.max_health || playerData.health);
        remotePlayer.health = playerData.health;
        remotePlayers[playerData.user_id] = remotePlayer;
        serverPlayerPositions[playerData.user_id] = remotePos;
    }

    obstacles.forEach(obstacle => {
        player.addObstacle(obstacle);
        allNPCs.forEach(npc => npc.addObstacle(obstacle));
    });

    const allCharacters = [player, ...allNPCs];
    for (let i = 0; i < allCharacters.length; i++) {
        for (let j = i + 1; j < allCharacters.length; j++) {
            allCharacters[i].addCharacterCollisionTarget(allCharacters[j]);
            allCharacters[j].addCharacterCollisionTarget(allCharacters[i]);
        }
    }

    networkManager = new NetworkManager();
    networkManager.connect(
        roomState.room_id,
        localPlayerData.name,
        localPlayerData.team,
        localPlayerData.user_id
    );

    setupNetworkCallbacks();
}

function setupNetworkCallbacks() {
    if (!networkManager) return;

    networkManager.on('game_update', (data) => {
        if (gameEnded) return;

        if (data.players && data.players[myPlayerId]) {
            const serverPlayerData = data.players[myPlayerId];
            const prevHealth = player.health;
            player.health = serverPlayerData.health;
            player.isDead = serverPlayerData.health <= 0;
            if (prevHealth !== player.health) {
                console.log('[game_multi] Player health changed:', prevHealth, '->', player.health);
            }
        }

        if (data.players) {
            for (const [playerId, playerData] of Object.entries(data.players)) {
                const userId = playerData.user_id;

                serverPlayerPositions[playerId] = {
                    x: playerData.position[0],
                    y: playerData.position[1],
                    z: playerData.position[2]
                };

                const remoteKey = userId || playerId;
                if (remotePlayers[remoteKey]) {
                    remotePlayers[remoteKey].skeleton.root.position.set(
                        playerData.position[0],
                        playerData.position[1],
                        playerData.position[2]
                    );
                    if (playerData.yaw !== undefined) {
                        remotePlayers[remoteKey].skeleton.root.rotation.y = playerData.yaw;
                    }
                    remotePlayers[remoteKey].health = playerData.health;
                    remotePlayers[remoteKey].isDead = playerData.health <= 0;
                }
            }
        }

        if (data.npcs) {
            for (const [npcId, npcData] of Object.entries(data.npcs)) {
                if (npcObjects[npcId]) {
                    const npc = npcObjects[npcId];
                    const prevHealth = npc.health;
                    const prevCrouching = npc.isCrouching;
                    const prevDead = npc.isDead;
                    const prevMoving = npc.isMoving;
                    const prevStuck = npc.isStuck;
                    const prevNearestTarget = npc.nearestTargetId;
                    npc.position = npcData.position;
                    npc.health = npcData.health;
                    npc.isDead = npcData.is_dead;
                    if (npc.isDead && !prevDead) {
                        npc.lieDown();
                    }
                    npc.isMoving = npcData.is_moving || false;
                    npc.isCrouching = npcData.is_crouching || false;
                    npc.isStuck = npcData.is_stuck || false;
                    npc.nearestTargetId = npcData.nearest_target_id || null;

                    if (npc.skeleton) {
                        npc.skeleton.root.position.set(npcData.position[0], npcData.position[1], npcData.position[2]);
                        npc.skeleton.root.rotation.y = npcData.yaw || 0;
                    }

                    if (npc.isDead && !prevDead) {
                        console.log('[game_multi] NPC', npcId, 'just died');
                    }
                    if (npc.isMoving !== prevMoving) {
                    }
                    if (npc.isStuck !== prevStuck) {
                    }
                    if (npc.nearestTargetId !== prevNearestTarget) {
                        
                        if (npc.nearestTargetId) {
                            let targetPos = null;
                            if (serverPlayerPositions[npc.nearestTargetId]) {
                                const pos = serverPlayerPositions[npc.nearestTargetId];
                                targetPos = new THREE.Vector3(pos.x, pos.y, pos.z);
                            } else if (npcObjects[npc.nearestTargetId]) {
                                targetPos = npcObjects[npc.nearestTargetId].skeleton.root.position.clone();
                            }
                            if (targetPos) {
                                npc.setAimTarget(targetPos);
                            }
                        } else {
                            npc.setAimTarget(null);
                        }
                    }

                    if (npc.isDead && !npc.deathHandled) {
                        npc.deathHandled = true;
                    }
                }
            }
        }

        if (data.events) {
            data.events.forEach(event => {
                if (event.type === 'death') {
                    console.log('[game_multi] Death event:', event.playerId, 'killed by', event.killerId);
                } else if (event.type === 'npc_shot') {
                    if (audioManager) {
                        audioManager.playGunshot();
                    }
                    const start = new THREE.Vector3(event.start_point[0], event.start_point[1], event.start_point[2]);
                    const end = new THREE.Vector3(event.end_point[0], event.end_point[1], event.end_point[2]);
                    const color = event.team === 'red' ? 0xff4444 : 0x4444ff;
                    showBulletTrail(start, end, color, event.blocked);
                } else if (event.type === 'hit') {
                    console.log('[game_multi] Hit event:', event.targetId, 'damage:', event.damage);
                }
            });
        }

        updateHealthUI();
    });

    networkManager.on('room_joined', (data) => {
        myPlayerId = data.player_id;
    });

    networkManager.on('game_over', (data) => {
        gameEnded = true;
        const winner = data.winner;
        const myTeam = myPlayerData.team;
        const result = (winner === myTeam) ? 'win' : 'lose';
        showGameOver(result);
    });

    networkManager.on('player_shot', (data) => {
        if (data.player_id === myPlayerId) return;
        if (data.start_point && data.end_point) {
            const start = new THREE.Vector3(data.start_point[0], data.start_point[1], data.start_point[2]);
            const end = new THREE.Vector3(data.end_point[0], data.end_point[1], data.end_point[2]);
            showBulletTrail(start, end, 0xffff00, false);
        }
    });

    networkManager.on('grenade_thrown', (data) => {
        if (data.npc_id) {
            const npc = npcObjects[data.npc_id];
            if (npc) {
                npc.receiveGrenadeThrow(data.target_position);
            }
        }
    });

    networkManager.on('enemy_fire_in_hole', (data) => {
        console.log('[game_multi] Enemy fire in the hole:', data.player_name);
        audioManager.playVoice('fire_in_the_hole');
    });

    networkManager.on('room_dissolved', () => {
        alert('房间已解散');
        window.location.href = 'lobby.html';
    });

    networkManager.on('reconnect_failed', () => {
        alert('重连失败，请返回大厅');
        window.location.href = 'lobby.html';
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupShooting() {
    let shootInterval = null;

    document.addEventListener('mousedown', (e) => {
        if (e.button === 0 && !player.isDead && isMultiplayer) {
            const hitResult = player.shoot(allNPCs);

            if (hitResult && hitResult.target) {
                let targetId = hitResult.target.npcId || hitResult.target.id;
                if (!targetId.toString().startsWith('npc_')) {
                    targetId = 'npc_' + targetId;
                }
                networkManager.sendShoot(targetId, 1, hitResult.startPoint, hitResult.endPoint);
            }

            shootInterval = setInterval(() => {
                if (!player.isDead) {
                    const hitResult = player.shoot(allNPCs);

                    if (hitResult && hitResult.target) {
                        let targetId = hitResult.target.npcId || hitResult.target.id;
                        if (!targetId.toString().startsWith('npc_')) {
                            targetId = 'npc_' + targetId;
                        }
                        networkManager.sendShoot(targetId, 1, hitResult.startPoint, hitResult.endPoint);
                    }
                }
            }, 200);
        } else if (e.button === 0 && !player.isDead && !isMultiplayer) {
            player.shoot(allNPCs);
            updateHealthUI();
            shootInterval = setInterval(() => {
                if (!player.isDead) {
                    player.shoot(allNPCs);
                    updateHealthUI();
                }
            }, 200);
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (e.button === 0 && shootInterval) {
            clearInterval(shootInterval);
            shootInterval = null;
        }
    });

    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
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

    let playerListHTML = '';
    
    const localPlayerHTML = player.isDead
        ? `<div style="color:#ff4444;font-size:14px;font-family:Arial;text-shadow:1px 1px 2px rgba(0,0,0,0.8);">${player.playerName} (你): 已阵亡</div>`
        : `<div style="display:flex;align-items:center;gap:8px;font-family:Arial;color:white;text-shadow:1px 1px 2px rgba(0,0,0,0.8);font-size:14px;">
            <span>${player.playerName} (你)</span>
            ${createHealthBar(player.health, player.maxHealth)}
            <span>${player.health}/${player.maxHealth}</span>
        </div>`;
    playerListHTML += localPlayerHTML;
    
    for (const userId in remotePlayers) {
        const remote = remotePlayers[userId];
        if (remote) {
            const remoteHTML = remote.isDead
                ? `<div style="color:#ff4444;font-size:14px;font-family:Arial;text-shadow:1px 1px 2px rgba(0,0,0,0.8);">${remote.playerName}: 已阵亡</div>`
                : `<div style="display:flex;align-items:center;gap:8px;font-family:Arial;color:white;text-shadow:1px 1px 2px rgba(0,0,0,0.8);font-size:14px;">
                    <span>${remote.playerName}</span>
                    ${createHealthBar(remote.health, remote.maxHealth)}
                    <span>${remote.health}/${remote.maxHealth}</span>
                </div>`;
            playerListHTML += remoteHTML;
        }
    }

    let playerTeamNPCsHTML = '<div style="color:#44ff44;font-size:14px;font-family:Arial;text-shadow:1px 1px 2px rgba(0,0,0,0.8);margin-bottom:4px;">我方NPC:</div>';
    playerTeamNPCs.forEach(npc => {
        if (npc.isDead) {
            playerTeamNPCsHTML += `<div style="color:#888;font-size:12px;font-family:Arial;margin-bottom:3px;">NPC ${npc.npcId}: 已阵亡</div>`;
        } else {
            playerTeamNPCsHTML += `<div style="display:flex;align-items:center;gap:6px;font-family:Arial;color:white;font-size:12px;margin-bottom:3px;">
                <span style="width:40px;">NPC ${npc.npcId}</span>
                ${createHealthBar(npc.health, npc.maxHealth, 100)}
                <span>${npc.health}/${npc.maxHealth}</span>
            </div>`;
        }
    });

    let enemyTeamNPCsHTML = '<div style="color:#ff4444;font-size:14px;font-family:Arial;text-shadow:1px 1px 2px rgba(0,0,0,0.8);margin-bottom:4px;">敌方NPC:</div>';
    enemyTeamNPCs.forEach(npc => {
        if (npc.isDead) {
            enemyTeamNPCsHTML += `<div style="color:#888;font-size:12px;font-family:Arial;margin-bottom:3px;">NPC ${npc.npcId}: 已阵亡</div>`;
        } else {
            enemyTeamNPCsHTML += `<div style="display:flex;align-items:center;gap:6px;font-family:Arial;color:white;font-size:12px;justify-content:flex-end;margin-bottom:3px;">
                <span>${npc.health}/${npc.maxHealth}</span>
                ${createHealthBar(npc.health, npc.maxHealth, 100)}
                <span style="width:40px;text-align:right;">NPC ${npc.npcId}</span>
            </div>`;
        }
    });

    healthUI.innerHTML = '<div style="margin-bottom:10px;">玩家:</div>' + playerListHTML + '<br>' + playerTeamNPCsHTML;
    npcHealthUI.innerHTML = enemyTeamNPCsHTML;
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
    message.textContent = '是否返回大厅？';

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '20px';

    const backBtn = document.createElement('button');
    backBtn.textContent = '🏠 返回大厅';
    backBtn.style.padding = '15px 30px';
    backBtn.style.fontSize = '20px';
    backBtn.style.fontFamily = 'Arial';
    backBtn.style.background = 'linear-gradient(135deg, #00d4ff, #0099cc)';
    backBtn.style.border = 'none';
    backBtn.style.borderRadius = '10px';
    backBtn.style.color = '#fff';
    backBtn.style.cursor = 'pointer';
    backBtn.addEventListener('click', () => {
        if (networkManager) {
            networkManager.leaveRoom();
        }
        window.location.href = 'lobby.html';
    });

    buttonContainer.appendChild(backBtn);
    gameOverUI.appendChild(title);
    gameOverUI.appendChild(message);
    gameOverUI.appendChild(buttonContainer);
    document.body.appendChild(gameOverUI);
}

function showBulletTrail(start, end, color, blocked) {
    const lineMaterial = new THREE.LineBasicMaterial({
        color: blocked ? 0xff0000 : color,
        linewidth: 2,
        transparent: true,
        opacity: 0.8
    });
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);
    setTimeout(() => scene.remove(line), 150);
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
        player.update(deltaTime, camera);

        if (isMultiplayer && networkManager && networkManager.isConnected) {
            const pos = player.skeleton.root.position;
            const yaw = player.skeleton.root.rotation.y;
            
            const posChanged = !lastSentPosition || 
                Math.abs(pos.x - lastSentPosition[0]) > 0.01 ||
                Math.abs(pos.y - lastSentPosition[1]) > 0.01 ||
                Math.abs(pos.z - lastSentPosition[2]) > 0.01;
            const yawChanged = !lastSentYaw || Math.abs(yaw - lastSentYaw) > 0.01;
            
            if (posChanged || yawChanged) {
                networkManager.sendPlayerState(
                    [pos.x, pos.y, pos.z],
                    yaw,
                    0,
                    false,
                    false
                );
                lastSentPosition = [pos.x, pos.y, pos.z];
                lastSentYaw = yaw;
            }
        }
    }

    allNPCs.forEach(npc => {
        if (npc.isDead) {
            if (!npc.deathHandled) {
                npc.deathHandled = true;
                npc.lieDown();
            }
            npc.update(deltaTime);
        } else {
            if (npc.nearestTargetId) {
                let targetPos = null;
                if (serverPlayerPositions[npc.nearestTargetId]) {
                    const pos = serverPlayerPositions[npc.nearestTargetId];
                    targetPos = new THREE.Vector3(pos.x, pos.y, pos.z);
                } else if (npcObjects[npc.nearestTargetId]) {
                    targetPos = npcObjects[npc.nearestTargetId].skeleton.root.position.clone();
                }
                if (targetPos) {
                    npc.setAimTarget(targetPos);
                }
            }
            npc.update(deltaTime);
        }
    });

    for (const userId in remotePlayers) {
        const remotePlayer = remotePlayers[userId];
        if (remotePlayer) {
            remotePlayer.update(deltaTime);
        }
    }

    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', init);
