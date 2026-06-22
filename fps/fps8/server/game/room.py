import time
import threading
import math
import random
from models import Vector3, NPC
from utils.map_generator import get_obstacle_boxes

ARENA_SIZE = 100
WALL_HEIGHT = 3
WALL_THICKNESS = 0.5
NPC_HEIGHT = 0.9
GAME_TICK_RATE = 1.0 / 60.0
PLAYER_DEFAULT_HEALTH = 10
NPC_DEFAULT_HEALTH = 10
SPAWN_WALL_X = [-32.4, -10.8, 10.8, 32.4]
BLUE_SPAWN_Z = -44
RED_SPAWN_Z = 44

socketio = None

def set_socketio(sio):
    global socketio
    socketio = sio


class Room:
    def __init__(self, room_id, host_id, host_name):
        self.room_id = room_id
        self.host_id = host_id
        self.host_name = host_name
        self.players = {}
        self.npcs = {}
        self.socket_sid_to_user_id = {}
        self.game_started = False
        self.game_over = False
        self.winner = None
        self.blue_team = []
        self.red_team = []
        self.map_data = None
        self.created_at = time.time()
        self.game_loop_thread = None
        self.game_loop_running = False
        self.events = []
        self.hit_rate_config = {
            'closeRange': 0.8,
            'midRange': 0.5,
            'farRange': 0.2,
            'targetMovePenalty': 0.5,
            'npcMovePenalty': 0.5
        }
        self.obstacle_boxes = []
        self.countdown_timer = 3
        self.countdown_active = False

    def add_player(self, user_id, player_name, team):
        wall_index = random.randint(0, 3)
        spawn_z = BLUE_SPAWN_Z if team == 'blue' else RED_SPAWN_Z
        self.players[user_id] = {
            'id': user_id,
            'name': player_name,
            'team': team,
            'user_id': user_id,
            'health': PLAYER_DEFAULT_HEALTH,
            'max_health': PLAYER_DEFAULT_HEALTH,
            'position': [SPAWN_WALL_X[wall_index], NPC_HEIGHT, spawn_z],
            'yaw': 0,
            'pitch': 0,
            'is_alive': True,
            'is_moving': False,
            'is_crouching': False
        }
        if team == 'blue':
            self.blue_team.append(user_id)
        else:
            self.red_team.append(user_id)

    def remove_player(self, user_id):
        if user_id in self.players:
            player = self.players[user_id]
            if player['team'] == 'blue' and user_id in self.blue_team:
                self.blue_team.remove(user_id)
            elif player['team'] == 'red' and user_id in self.red_team:
                self.red_team.remove(user_id)
            del self.players[user_id]

    def register_socket(self, socket_sid, user_id):
        self.socket_sid_to_user_id[socket_sid] = user_id

    def get_user_id_by_socket(self, socket_sid):
        return self.socket_sid_to_user_id.get(socket_sid)

    def unregister_socket(self, socket_sid):
        if socket_sid in self.socket_sid_to_user_id:
            del self.socket_sid_to_user_id[socket_sid]

    def create_npcs(self, blue_count, red_count):
        npc_id_counter = 1

        blue_wall_indices = list(range(len(SPAWN_WALL_X)))
        random.shuffle(blue_wall_indices)
        for i in range(blue_count):
            npc_id = f"npc_{npc_id_counter}"
            npc_id_counter += 1
            wall_index = blue_wall_indices[i % len(SPAWN_WALL_X)]
            offset = (i // len(SPAWN_WALL_X)) * 2.0
            position = [SPAWN_WALL_X[wall_index] + offset, NPC_HEIGHT, BLUE_SPAWN_Z]
            print(f'[NPC_SPAWN] {npc_id} (blue) wall_index={wall_index}, offset={offset:.1f}, position={position}')
            npc = NPC(npc_id, 'blue', position, NPC_DEFAULT_HEALTH)
            self.npcs[npc_id] = npc
            self.blue_team.append(npc_id)

        red_wall_indices = list(range(len(SPAWN_WALL_X)))
        random.shuffle(red_wall_indices)
        for i in range(red_count):
            npc_id = f"npc_{npc_id_counter}"
            npc_id_counter += 1
            wall_index = red_wall_indices[i % len(SPAWN_WALL_X)]
            offset = (i // len(SPAWN_WALL_X)) * 2.0
            position = [SPAWN_WALL_X[wall_index] + offset, NPC_HEIGHT, RED_SPAWN_Z]
            print(f'[NPC_SPAWN] {npc_id} (red) wall_index={wall_index}, offset={offset:.1f}, position={position}')
            npc = NPC(npc_id, 'red', position, NPC_DEFAULT_HEALTH)
            self.npcs[npc_id] = npc
            self.red_team.append(npc_id)

    def init_npc_ai(self):
        from ai.npc_ai import NPCAI
        for npc_id, npc in self.npcs.items():
            npc.obstacles = self.obstacle_boxes
            npc.players = self._get_all_characters()
            npc.ai = NPCAI(npc, None, self.hit_rate_config, self.room_id)

    def _get_all_characters(self):
        characters = []
        for pid, pdata in self.players.items():
            characters.append({
                'id': pid,
                'team': pdata['team'],
                'position': Vector3(*pdata['position']),
                'is_dead': not pdata['is_alive'],
                'is_moving': pdata.get('is_moving', False),
                'health': pdata['health'],
                'max_health': pdata.get('max_health', 10),
                '_ref': pdata
            })
        for nid, npc in self.npcs.items():
            characters.append({
                'id': nid,
                'team': npc.team,
                'position': npc.get_position(),
                'is_dead': npc.is_dead,
                'is_moving': npc.is_moving,
                'health': npc.health,
                'max_health': npc.max_health,
                '_ref': npc
            })
        return characters

    def update_npc_ai(self, delta_time):
        for npc_id, npc in self.npcs.items():
            if npc.is_dead or npc.ai is None:
                continue

            npc.players = self._get_all_characters()

            if npc.ai.target is None or npc.ai.target.get('is_dead', True):
                npc.ai.target = npc.ai.find_nearest_target()

            if npc.ai.target:
                npc.ai.update(delta_time)

                for evt in npc.ai.shoot_events:
                    self.events.append(evt)
                npc.ai.shoot_events = []

                if npc.ai.grenade_event:
                    grenade_info = npc.ai.grenade_event
                    self._handle_npc_grenade(grenade_info)
                    npc.ai.grenade_event = None

                npc_pos = npc.get_position()
                target_pos = npc.ai.get_target_position(npc.ai.target)
                direction = (target_pos - npc_pos).normalize()
                if direction.length() > 0:
                    npc.yaw = math.atan2(direction.x, direction.z)

    def _handle_npc_grenade(self, grenade_info):
        from models import Vector3

        grenade_pos = Vector3(*grenade_info['target_position'])
        grenade_radius_inner = 1.0
        grenade_radius_outer = 2.5
        grenade_damage = 1

        for pid, pdata in self.players.items():
            if not pdata['is_alive']:
                continue
            if pdata['team'] == grenade_info['npc_team']:
                continue

            player_pos = Vector3(*pdata['position'])
            dist = player_pos.distance_to(grenade_pos)
            if dist <= grenade_radius_outer:
                pdata['health'] -= grenade_damage
                print(f'[GRENADE] NPC {grenade_info["npc_id"]} hit player {pid}, damage={grenade_damage}, dist={dist:.1f}')
                hit_event = {
                    'type': 'hit',
                    'shooterId': grenade_info['npc_id'],
                    'targetId': pid,
                    'damage': grenade_damage,
                    'newHealth': pdata['health']
                }
                self.events.append(hit_event)
                if pdata['health'] <= 0:
                    pdata['health'] = 0
                    pdata['is_alive'] = False
                    death_event = {
                        'type': 'death',
                        'playerId': pid,
                        'killerId': grenade_info['npc_id']
                    }
                    self.events.append(death_event)

        for nid, npc in self.npcs.items():
            if npc.is_dead:
                continue
            if nid == grenade_info['npc_id']:
                continue
            if npc.team == grenade_info['npc_team']:
                continue

            npc_pos = npc.get_position()
            dist = npc_pos.distance_to(grenade_pos)
            if dist <= grenade_radius_outer:
                npc.health -= grenade_damage
                print(f'[GRENADE] NPC {grenade_info["npc_id"]} hit NPC {nid}, damage={grenade_damage}, dist={dist:.1f}')
                hit_event = {
                    'type': 'hit',
                    'shooterId': grenade_info['npc_id'],
                    'targetId': nid,
                    'damage': grenade_damage,
                    'newHealth': npc.health
                }
                self.events.append(hit_event)
                if npc.health <= 0:
                    npc.health = 0
                    npc.is_dead = True
                    death_event = {
                        'type': 'death',
                        'playerId': nid,
                        'killerId': grenade_info['npc_id']
                    }
                    self.events.append(death_event)

        grenade_event = {
            'type': 'grenade_thrown',
            'npc_id': grenade_info['npc_id'],
            'target_position': grenade_info['target_position'],
            'hits': grenade_info.get('hits', [])
        }
        socketio.emit('grenade_thrown', grenade_event, room=self.room_id)

    def check_game_end(self):
        blue_alive = any(
            (self.players[pid]['is_alive'] if pid in self.players else not self.npcs[pid].is_dead)
            for pid in self.blue_team
            if pid in self.players or pid in self.npcs
        )
        red_alive = any(
            (self.players[pid]['is_alive'] if pid in self.players else not self.npcs[pid].is_dead)
            for pid in self.red_team
            if pid in self.players or pid in self.npcs
        )

        if not blue_alive:
            self.game_over = True
            self.winner = 'red'
            print(f'[Game] Room {self.room_id} - Red team wins!')
            return True
        if not red_alive:
            self.game_over = True
            self.winner = 'blue'
            print(f'[Game] Room {self.room_id} - Blue team wins!')
            return True
        return False

    def build_obstacle_boxes(self):
        if self.map_data:
            raw_boxes = get_obstacle_boxes(self.map_data)
            self.obstacle_boxes = []
            for box in raw_boxes:
                min_pos = box['min']
                max_pos = box['max']
                center = [
                    (min_pos[0] + max_pos[0]) / 2,
                    (min_pos[1] + max_pos[1]) / 2,
                    (min_pos[2] + max_pos[2]) / 2
                ]
                size = [
                    max_pos[0] - min_pos[0],
                    max_pos[1] - min_pos[1],
                    max_pos[2] - min_pos[2]
                ]
                self.obstacle_boxes.append({
                    'position': center,
                    'size': {'x': size[0], 'y': size[1], 'z': size[2]},
                    'height': size[1]
                })

    def game_loop(self):
        self.game_loop_running = True
        self.countdown_active = True
        self.countdown_timer = 5
        last_time = time.time()
        tick_count = 0

        print(f'[GameLoop] Starting game loop for room {self.room_id}')

        try:
            while self.game_loop_running and not self.game_over:
                current_time = time.time()
                delta_time = current_time - last_time
                last_time = current_time

                if delta_time > 0.1:
                    delta_time = 0.1

                self.events = []

                if self.countdown_active:
                    self.countdown_timer -= delta_time
                    if self.countdown_timer <= 0:
                        self.countdown_timer = 0
                        self.countdown_active = False
                        print(f'[GameLoop] Countdown finished for room {self.room_id}')

                    game_update = {
                        'type': 'game_update',
                        'players': {},
                        'npcs': {},
                        'events': self.events,
                        'countdown': self.countdown_timer
                    }

                    for pid, pdata in self.players.items():
                        game_update['players'][pid] = {
                            'user_id': pdata.get('user_id'),
                            'position': pdata['position'],
                            'yaw': pdata.get('yaw', 0),
                            'pitch': pdata.get('pitch', 0),
                            'health': pdata['health'],
                            'is_moving': False,
                            'is_crouching': False
                        }

                    for nid, npc in self.npcs.items():
                        game_update['npcs'][nid] = {
                            'id': npc.id,
                            'team': npc.team,
                            'position': npc.position,
                            'yaw': npc.yaw,
                            'health': npc.health,
                            'max_health': npc.max_health,
                            'is_dead': npc.is_dead,
                            'is_moving': False,
                            'is_crouching': False
                        }

                    socketio.emit('game_update', game_update, room=self.room_id)
                    tick_count += 1
                    time.sleep(max(0, GAME_TICK_RATE - (time.time() - current_time)))
                    continue

                self.update_npc_ai(delta_time)

                self.check_game_end()

                game_update = {
                    'type': 'game_update',
                    'players': {},
                    'npcs': {},
                    'events': self.events
                }

                for pid, pdata in self.players.items():
                    game_update['players'][pid] = {
                        'user_id': pdata.get('user_id'),
                        'position': pdata['position'],
                        'yaw': pdata.get('yaw', 0),
                        'pitch': pdata.get('pitch', 0),
                        'health': pdata['health'],
                        'is_moving': pdata.get('is_moving', False),
                        'is_crouching': pdata.get('is_crouching', False)
                    }

                for nid, npc in self.npcs.items():
                    nearest_target_id = None
                    if npc.ai and npc.ai.last_nearest_target:
                        nearest_target_id = npc.ai.last_nearest_target
                    game_update['npcs'][nid] = {
                        'id': npc.id,
                        'team': npc.team,
                        'position': npc.position,
                        'yaw': npc.yaw,
                        'health': npc.health,
                        'max_health': npc.max_health,
                        'is_dead': npc.is_dead,
                        'is_moving': npc.is_moving,
                        'is_crouching': npc.is_crouching,
                        'is_stuck': npc.is_stuck,
                        'nearest_target_id': nearest_target_id
                    }

                socketio.emit('game_update', game_update, room=self.room_id)

                tick_count += 1

                if self.game_over:
                    print(f'[GameLoop] Game over in room {self.room_id}, winner={self.winner}')
                    socketio.emit('game_over', {
                        'winner': self.winner
                    }, room=self.room_id)
                    break

                time.sleep(max(0, GAME_TICK_RATE - (time.time() - current_time)))
        except Exception as e:
            print(f'[GameLoop] ERROR in room {self.room_id}: {e}')
            import traceback
            traceback.print_exc()

        self.game_loop_running = False
        print(f'[GameLoop] Game loop stopped for room {self.room_id}')

    def start_game_loop(self):
        print(f'[GameLoop] start_game_loop called for room {self.room_id}')
        if self.game_loop_thread is None or not self.game_loop_thread.is_alive():
            print(f'[GameLoop] Creating new thread for room {self.room_id}')
            self.game_loop_thread = threading.Thread(target=self.game_loop, daemon=True)
            self.game_loop_thread.start()
            print(f'[GameLoop] Thread started for room {self.room_id}')
        else:
            print(f'[GameLoop] Thread already running for room {self.room_id}')

    def stop_game_loop(self):
        self.game_loop_running = False

    def get_info(self):
        return {
            'room_id': self.room_id,
            'host_name': self.host_name,
            'player_count': len(self.players),
            'blue_count': len(self.blue_team),
            'red_count': len(self.red_team),
            'game_started': self.game_started
        }

    def get_state(self):
        return {
            'room_id': self.room_id,
            'host_id': self.host_id,
            'players': self.players,
            'npcs': {nid: {
                'id': npc.id,
                'team': npc.team,
                'position': npc.position,
                'health': npc.health,
                'max_health': npc.max_health,
                'is_dead': npc.is_dead
            } for nid, npc in self.npcs.items()},
            'game_started': self.game_started,
            'map_data': self.map_data,
            'blue_team': self.blue_team,
            'red_team': self.red_team
        }