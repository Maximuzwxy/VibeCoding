class MultiPlayerAdapter {
    constructor() {
        this.networkManager = new NetworkManager();
        this.remotePlayers = {};
        this.remoteNPCs = {};
        this.localPlayer = null;
        this.scene = null;
        this.mapData = null;
        this.gameConfig = null;
    }

    initialize(roomState, scene) {
        console.log('[MultiPlayerAdapter] Initializing multiplayer adapter');
        this.scene = scene;
        this.mapData = roomState.map_data;

        const localPlayerData = roomState.players[this.networkManager.getPlayerId()];
        this.gameConfig = {
            blueNpcs: roomState.blue_team.filter(id => id.startsWith('npc_')).length,
            redNpcs: roomState.red_team.filter(id => id.startsWith('npc_')).length,
            playerTeam: localPlayerData.team === 'blue' ? 'blue' : 'red'
        };

        this.setupNetworkCallbacks();
        this.renderMap();
        this.createRemotePlayers(roomState.players);
        this.createRemoteNPCs(roomState.npcs);
    }

    setupNetworkCallbacks() {
        this.networkManager.on('game_update', (data) => {
            if (data.players) {
                for (const [id, playerData] of Object.entries(data.players)) {
                    if (this.remotePlayers[id]) {
                        const pos = new THREE.Vector3(...playerData.position);
                        this.remotePlayers[id].setPosition(pos);
                        this.remotePlayers[id].setYaw(playerData.yaw);
                    }
                }
            }

            if (data.npcs) {
                for (const [id, npcData] of Object.entries(data.npcs)) {
                    if (this.remoteNPCs[id]) {
                        const pos = new THREE.Vector3(...npcData.position);
                        this.remoteNPCs[id].setPosition(pos);
                        this.remoteNPCs[id].setYaw(npcData.yaw);
                        this.remoteNPCs[id].health = npcData.health;
                        this.remoteNPCs[id].isDead = npcData.is_dead;
                    }
                }
            }

            if (data.events) {
                data.events.forEach(event => {
                    if (event.type === 'hit') {
                        if (this.remotePlayers[event.targetId]) {
                            this.remotePlayers[event.targetId].takeDamage(event.damage);
                        }
                        if (this.remoteNPCs[event.targetId]) {
                            this.remoteNPCs[event.targetId].takeDamage(event.damage);
                        }
                    } else if (event.type === 'death') {
                        if (this.remotePlayers[event.playerId]) {
                            this.remotePlayers[event.playerId].die();
                        }
                        if (this.remoteNPCs[event.playerId]) {
                            this.remoteNPCs[event.playerId].die();
                        }
                    }
                });
            }
        });

        this.networkManager.on('game_over', (data) => {
            console.log('[MultiPlayerAdapter] Game over, winner:', data.winner);
        });

        this.networkManager.on('player_shot', (data) => {
            if (this.remotePlayers[data.player_id]) {
                this.remotePlayers[data.player_id].playShootAnimation();
            }
        });

        this.networkManager.on('grenade_thrown', (data) => {
            this.renderGrenadeExplosion(data.impact_position, data.hits);
        });

        this.networkManager.on('enemy_fire_in_hole', (data) => {
            this.playFireInTheHole(data.player_name);
        });

        this.networkManager.on('room_dissolved', () => {
            alert('房间已解散');
            window.location.href = 'lobby.html';
        });

        this.networkManager.on('disconnect', () => {
            console.log('[MultiPlayerAdapter] Disconnected');
        });

        this.networkManager.on('reconnect_failed', () => {
            alert('重连失败，请返回大厅');
            window.location.href = 'lobby.html';
        });
    }

    renderMap() {
        const obstacles = [];
        MapGenerator.renderMap(this.scene, this.mapData, obstacles);
        console.log('[MultiPlayerAdapter] Map rendered with', obstacles.length, 'obstacles');
    }

    createRemotePlayers(players) {
        for (const [id, playerData] of Object.entries(players)) {
            if (id === this.networkManager.getPlayerId()) continue;

            const position = new THREE.Vector3(...playerData.position);
            const remotePlayer = new Player(this.scene, position, playerData.name, playerData.team);
            this.remotePlayers[id] = remotePlayer;
        }
    }

    createRemoteNPCs(npcs) {
        for (const [id, npcData] of Object.entries(npcs)) {
            const position = new THREE.Vector3(...npcData.position);
            const remoteNPC = new NPC(this.scene, position, npcData.team, npcData.team === 'blue' ? 0x4444ff : 0xff4444, id);
            this.remoteNPCs[id] = remoteNPC;
        }
    }

    updateLocalPlayer(position, yaw, pitch, isMoving, isCrouching) {
        this.networkManager.sendPlayerState(
            [position.x, position.y, position.z],
            yaw,
            pitch,
            isMoving,
            isCrouching
        );
    }

    localPlayerShoot(targetId, damage) {
        this.networkManager.sendShoot(targetId, damage);
    }

    localPlayerThrowGrenade(impactPosition, hits) {
        this.networkManager.sendGrenade(
            [impactPosition.x, impactPosition.y, impactPosition.z],
            hits
        );
    }

    localPlayerFireInHole() {
        this.networkManager.sendFireInHole();
    }

    renderGrenadeExplosion(position, hits) {
        const pos = new THREE.Vector3(...position);
        console.log('[MultiPlayerAdapter] Grenade explosion at', pos);
        
        for (const hit of hits) {
            if (this.remotePlayers[hit.target_id]) {
                this.remotePlayers[hit.target_id].takeDamage(hit.damage);
            }
            if (this.remoteNPCs[hit.target_id]) {
                this.remoteNPCs[hit.target_id].takeDamage(hit.damage);
            }
        }
    }

    playFireInTheHole(playerName) {
        console.log('[MultiPlayerAdapter] Fire in the hole from', playerName);
        AudioManager.playVoice('fire_in_the_hole');
    }

    cleanup() {
        this.networkManager.leaveRoom();
        this.remotePlayers = {};
        this.remoteNPCs = {};
    }
}
