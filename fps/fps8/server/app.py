from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import uuid
import time
import threading
import math
import random
import json
import os
from models import Vector3, NPC
from utils.map_generator import generate_map_data, get_obstacle_boxes
from game import Room, set_socketio

app = Flask(__name__, static_folder='../client', static_url_path='')
app.config['SECRET_KEY'] = 'fps8_game_secret'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')
set_socketio(socketio)

USERS_FILE = os.path.join(os.path.dirname(__file__), 'users.json')

def load_users():
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_users(users):
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)

rooms = {}
users = load_users()


@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api/rooms', methods=['GET'])
def get_rooms():
    room_list = []
    for room_id, room in rooms.items():
        if not room.game_started:
            room_list.append(room.get_info())
    return jsonify(room_list)

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    player_name = data.get('player_name', '').strip()

    if not player_name:
        return jsonify({'success': False, 'message': '用户名不能为空'}), 400

    if len(player_name) > 12:
        return jsonify({'success': False, 'message': '用户名最多12个字符'}), 400

    for user_id, user_data in users.items():
        if user_data['name'] == player_name:
            return jsonify({
                'success': True,
                'user_id': user_id,
                'message': '登录成功'
            })

    user_id = 'u_' + str(uuid.uuid4())[:12]
    users[user_id] = {
        'name': player_name,
        'created_at': time.time()
    }
    save_users(users)

    print(f'[Server] New user registered: {player_name} (id={user_id})')

    return jsonify({
        'success': True,
        'user_id': user_id,
        'message': '注册成功'
    })

@app.route('/api/rooms', methods=['POST'])
def create_room():
    data = request.json
    room_id = str(uuid.uuid4())[:8]
    host_id = data.get('host_id', str(uuid.uuid4()))
    host_name = data.get('host_name', 'Host')

    room = Room(room_id, host_id, host_name)
    room.add_player(host_id, host_name, 'blue')
    rooms[room_id] = room

    print(f'[Server] Room created: {room_id} by {host_name}')

    return jsonify({
        'room_id': room_id,
        'host_id': host_id
    })


@socketio.on('connect')
def handle_connect():
    print(f'[Server] Client connected: {request.sid}')

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    print(f'[Server] Client disconnected: {sid}')

    for room_id, room in list(rooms.items()):
        user_id = room.get_user_id_by_socket(sid)
        if user_id and user_id in room.players:
            player_name = room.players[user_id].get('name', 'Unknown')
            is_host = (room.host_id == user_id)
            print(f'[Server] Disconnect: player={player_name}, user_id={user_id}, is_host={is_host}, game_started={room.game_started}, room={room_id}')

            if is_host:
                if room.game_started:
                    print(f'[Server] Host disconnected but game already started, keeping room alive for rejoin: {room_id}')
                    other_players = [pid for pid in room.players if pid != user_id and not pid.startswith('npc_')]
                    print(f'[Server] Other human players: {other_players}')
                    if other_players:
                        room.host_id = other_players[0]
                        print(f'[Server] New host: {other_players[0]}')
                    else:
                        print(f'[Server] Host disconnected, keeping room for 10s rejoin window: {room_id}')
                else:
                    print(f'[Server] Host disconnected before game start, dissolving room: {room_id}')
                    room.stop_game_loop()
                    socketio.emit('room_dissolved', {'room_id': room_id}, room=room_id)
                    del rooms[room_id]
            else:
                if room.game_started:
                    print(f'[Server] Player disconnected during game, keeping in room for rejoin: {room_id}')
                else:
                    room.remove_player(user_id)
                    room.unregister_socket(sid)
                    socketio.emit('player_left', {
                        'player_id': user_id,
                        'room_id': room_id
                    }, room=room_id)
            break

@socketio.on('join_room')
def handle_join_room(data):
    room_id = data.get('room_id')
    player_name = data.get('player_name', 'Player')
    team = data.get('team', 'blue')
    user_id = data.get('user_id')

    print(f'[Server] join_room request: player={player_name}, user_id={user_id}, team={team}, room={room_id}')

    if room_id not in rooms:
        print(f'[Server] Room {room_id} not found')
        emit('error', {'message': 'Room not found'})
        return

    room = rooms[room_id]
    print(f'[Server] Room found, game_started={room.game_started}, players={list(room.players.keys())}')

    if room.game_started:
        if user_id in room.players:
            print(f'[Server] Player {player_name} (user_id={user_id}) rejoining game')
            old_player_data = room.players[user_id]
            room.players[user_id]['position'] = old_player_data['position']
            room.players[user_id]['health'] = old_player_data['health']
            room.players[user_id]['yaw'] = old_player_data.get('yaw', 0)
            join_room(room_id)
        else:
            print(f'[Server] No matching player found for rejoin, rejecting')
            emit('error', {'message': 'Game already started'})
            return
    else:
        join_room(room_id)
        room.add_player(user_id, player_name, team)

    if room.host_id not in room.players:
        room.host_id = user_id

    print(f'[Server] {player_name} joined room {room_id} ({team} team), user_id={user_id}')
    print(f'[Server] room_state: players={list(room.players.keys())}, blue_team={room.blue_team}, red_team={room.red_team}')
    print(f'[Server] room_state full: {room.get_state()}')

    emit('room_joined', {
        'player_id': user_id,
        'room_state': room.get_state()
    }, room=room_id)

    room.register_socket(request.sid, user_id)

    if not room.game_started:
        socketio.emit('player_joined', {
            'player': room.players[user_id]
        }, room=room_id, include_self=False)

@socketio.on('leave_room')
def handle_leave_room(data):
    room_id = data.get('room_id')
    user_id = data.get('user_id')
    if room_id in rooms:
        room = rooms[room_id]
        if user_id in room.players:
            room.remove_player(user_id)
            room.unregister_socket(request.sid)
            leave_room(room_id)

            socketio.emit('player_left', {
                'player_id': user_id,
                'room_id': room_id
            }, room=room_id)

@socketio.on('start_game')
def handle_start_game(data):
    room_id = data.get('room_id')
    user_id = data.get('user_id')
    if room_id not in rooms:
        emit('error', {'message': 'Room not found'})
        return

    room = rooms[room_id]
    if room.host_id != user_id:
        emit('error', {'message': 'Only host can start game'})
        return

    blue_npcs = data.get('blue_npcs', 3)
    red_npcs = data.get('red_npcs', 3)

    print(f'[Game] Starting game in room {room_id}...')
    print(f'[Game] Generating map...')

    room.map_data = generate_map_data()
    room.build_obstacle_boxes()

    print(f'[Game] Creating NPCs: blue={blue_npcs}, red={red_npcs}...')

    room.create_npcs(blue_npcs, red_npcs)
    room.init_npc_ai()

    room.game_started = True

    print(f'[Game] Game started in room {room_id} (blue_npcs={blue_npcs}, red_npcs={red_npcs})')
    print(f'[Game] Broadcasting game_start to room {room_id}...')

    socketio.emit('game_start', {
        'room_state': room.get_state(),
        'my_player_id': room.get_user_id_by_socket(request.sid)
    }, room=room_id)

    print(f'[Game] Starting game loop for room {room_id}...')
    room.start_game_loop()
    print(f'[Game] start_game handler finished for room {room_id}')

@socketio.on('player_state')
def handle_player_state(data):
    room_id = data.get('room_id')
    user_id = data.get('user_id')
    if room_id in rooms and user_id:
        room = rooms[room_id]
        if user_id in room.players:
            room.players[user_id]['position'] = data.get('position', [0, 0, 0])
            room.players[user_id]['yaw'] = data.get('yaw', 0)
            room.players[user_id]['pitch'] = data.get('pitch', 0)
            room.players[user_id]['is_moving'] = data.get('is_moving', False)
            room.players[user_id]['is_crouching'] = data.get('is_crouching', False)

@socketio.on('player_shoot')
def handle_player_shoot(data):
    room_id = data.get('room_id')
    user_id = data.get('user_id')
    print(f'[Shoot] Received shoot event: room={room_id}, user_id={user_id}')
    if room_id in rooms:
        room = rooms[room_id]
        shooter = room.players.get(user_id)
        if shooter and shooter['is_alive']:
            target_id = data.get('target_id')
            damage = data.get('damage', 1)
            start_point = data.get('start_point')
            end_point = data.get('end_point')

            print(f'[Shoot] Shooter: {shooter["name"]}, target: {target_id}, damage: {damage}')
            print(f'[Shoot] Available NPCs: {list(room.npcs.keys())}')

            if target_id and target_id in room.npcs:
                npc = room.npcs[target_id]
                print(f'[Shoot] Found NPC: {target_id}, team: {npc.team}, current HP: {npc.health}')
                if npc.team != shooter['team'] and not npc.is_dead:
                    npc.health -= damage
                    print(f'[Shoot] HIT! {shooter["name"]} hit {target_id} for {damage} damage (HP: {npc.health}/{npc.max_health})')
                    if npc.health <= 0:
                        npc.health = 0
                        npc.is_dead = True
                        print(f'[Death] {target_id} ({npc.team}) killed by {shooter["name"]}')
                    room.events.append({
                        'type': 'hit',
                        'shooterId': user_id,
                        'targetId': target_id,
                        'damage': damage,
                        'newHealth': npc.health
                    })
                    if npc.is_dead:
                        room.events.append({
                            'type': 'death',
                            'playerId': target_id,
                            'killerId': user_id
                        })
                else:
                    print(f'[Shoot] MISS - team={npc.team} (same as shooter={shooter["team"]}) or dead={npc.is_dead}')
            else:
                print(f'[Shoot] Target not found: {target_id}')

            socketio.emit('player_shot', {
                'player_id': user_id,
                'target_id': target_id,
                'damage': damage,
                'start_point': start_point,
                'end_point': end_point
            }, room=room_id)

@socketio.on('player_grenade')
def handle_player_grenade(data):
    room_id = data.get('room_id')
    user_id = data.get('user_id')
    if room_id in rooms:
        room = rooms[room_id]
        thrower = room.players.get(user_id)
        if thrower and thrower['is_alive']:
            impact_pos = data.get('impact_position', [0, 0, 0])
            hits = data.get('hits', [])

            for hit in hits:
                target_id = hit.get('target_id')
                damage = hit.get('damage', 1)

                if target_id in room.npcs:
                    npc = room.npcs[target_id]
                    if npc.team != thrower['team'] and not npc.is_dead:
                        npc.health -= damage
                        if npc.health <= 0:
                            npc.health = 0
                            npc.is_dead = True
                        room.events.append({
                            'type': 'hit',
                            'shooterId': user_id,
                            'targetId': target_id,
                            'damage': damage,
                            'newHealth': npc.health
                        })
                        if npc.is_dead:
                            room.events.append({
                                'type': 'death',
                                'playerId': target_id,
                                'killerId': user_id
                            })

            socketio.emit('grenade_thrown', {
                'player_id': user_id,
                'impact_position': impact_pos,
                'hits': hits
            }, room=room_id)

@socketio.on('player_fire_in_hole')
def handle_fire_in_hole(data):
    room_id = data.get('room_id')
    user_id = data.get('user_id')
    if room_id in rooms:
        room = rooms[room_id]
        player = room.players.get(user_id)
        if player:
            socketio.emit('enemy_fire_in_hole', {
                'player_id': user_id,
                'player_name': player['name']
            }, room=room_id, include_self=False)


if __name__ == '__main__':
    print('[Server] Starting FPS8 game server...')
    print('[Server] http://localhost:5000')
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)