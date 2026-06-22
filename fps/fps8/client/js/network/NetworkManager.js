class NetworkManager {
    constructor() {
        this.socket = null;
        this.roomId = null;
        this.playerId = null;
        this.myPlayerId = null;
        this.playerName = null;
        this.team = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.reconnectInterval = 3000;
        this.callbacks = {};
    }

    connect(roomId, playerName, team, userId) {
        this.roomId = roomId;
        this.playerName = playerName;
        this.team = team;
        this.userId = userId;

        console.log('[NetworkManager] Connecting to server, roomId:', roomId, 'playerName:', playerName, 'team:', team, 'userId:', userId);

        this.socket = io(window.location.origin);

        this.socket.on('connect', () => {
            console.log('[NetworkManager] Socket connected, sid:', this.socket.id, 'joining room:', this.roomId);
            this.isConnected = true;
            this.reconnectAttempts = 0;

            this.socket.emit('join_room', {
                room_id: this.roomId,
                player_name: this.playerName,
                team: this.team,
                user_id: this.userId
            });
        });

        this.socket.on('room_joined', (data) => {
            console.log('[NetworkManager] Room joined successfully, playerId:', data.player_id);
            this.playerId = data.player_id;
            this.triggerCallback('room_joined', data);
        });

        this.socket.on('game_start', (data) => {
            this.myPlayerId = data.my_player_id;
            this.triggerCallback('game_start', data);
        });

        this.socket.on('game_update', (data) => {
            this.triggerCallback('game_update', data);
        });

        this.socket.on('game_over', (data) => {
            console.log('[NetworkManager] Game over:', data);
            this.triggerCallback('game_over', data);
        });

        this.socket.on('player_joined', (data) => {
            this.triggerCallback('player_joined', data);
        });

        this.socket.on('player_left', (data) => {
            this.triggerCallback('player_left', data);
        });

        this.socket.on('player_moved', (data) => {
            this.triggerCallback('player_moved', data);
        });

        this.socket.on('player_shot', (data) => {
            this.triggerCallback('player_shot', data);
        });

        this.socket.on('grenade_thrown', (data) => {
            this.triggerCallback('grenade_thrown', data);
        });

        this.socket.on('enemy_fire_in_hole', (data) => {
            console.log('[NetworkManager] Enemy fire in the hole:', data);
            this.triggerCallback('enemy_fire_in_hole', data);
        });

        this.socket.on('room_dissolved', (data) => {
            console.log('[NetworkManager] Room dissolved');
            this.triggerCallback('room_dissolved', data);
        });

        this.socket.on('disconnect', () => {
            console.log('[NetworkManager] Disconnected from server');
            this.isConnected = false;
            this.triggerCallback('disconnect', {});
            this.tryReconnect();
        });

        this.socket.on('error', (data) => {
            console.error('[NetworkManager] Error:', data.message);
            this.triggerCallback('error', data);
        });
    }

    tryReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('[NetworkManager] Max reconnect attempts reached');
            this.triggerCallback('reconnect_failed', {});
            return;
        }

        this.reconnectAttempts++;
        console.log(`[NetworkManager] Reconnecting attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);

        setTimeout(() => {
            if (!this.isConnected) {
                this.connect(this.roomId, this.playerName, this.team);
            }
        }, this.reconnectInterval);
    }

    sendPlayerState(position, yaw, pitch, isMoving, isCrouching) {
        if (this.socket && this.isConnected) {
            this.socket.emit('player_state', {
                room_id: this.roomId,
                user_id: this.userId,
                position: position,
                yaw: yaw,
                pitch: pitch,
                is_moving: isMoving,
                is_crouching: isCrouching
            });
        }
    }

    sendShoot(targetId, damage, startPoint, endPoint) {
        if (this.socket && this.isConnected) {
            this.socket.emit('player_shoot', {
                room_id: this.roomId,
                user_id: this.userId,
                target_id: targetId,
                damage: damage,
                start_point: startPoint,
                end_point: endPoint
            });
        }
    }

    sendGrenade(impactPosition, hits) {
        if (this.socket && this.isConnected) {
            this.socket.emit('player_grenade', {
                room_id: this.roomId,
                user_id: this.userId,
                impact_position: impactPosition,
                hits: hits
            });
        }
    }

    sendFireInHole() {
        if (this.socket && this.isConnected) {
            this.socket.emit('player_fire_in_hole', {
                room_id: this.roomId,
                user_id: this.userId
            });
        }
    }

    leaveRoom() {
        if (this.socket) {
            this.socket.emit('leave_room', {
                room_id: this.roomId,
                user_id: this.userId
            });
            this.socket.disconnect();
            this.isConnected = false;
        }
    }

    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }

    triggerCallback(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(cb => cb(data));
        }
    }

    getPlayerId() {
        return this.playerId;
    }

    getMyPlayerId() {
        return this.myPlayerId;
    }

    getRoomId() {
        return this.roomId;
    }
}
