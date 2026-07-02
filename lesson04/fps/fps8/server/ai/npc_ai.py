import math
import random
from models import Vector3


class NPCAI:
    def __init__(self, npc, target, hit_rate_config=None, room_id=None):
        self.npc = npc
        self.target = target
        self.room_id = room_id
        self.hit_rate = hit_rate_config or {
            'closeRange': 0.8,
            'midRange': 0.5,
            'farRange': 0.2,
            'targetMovePenalty': 0.5,
            'npcMovePenalty': 0.5
        }
        self.state = 'NAVIGATING'
        self.state_time = 0
        self.shoot_cooldown = 0
        self.shoot_interval = 1.0
        self.detection_range = 60
        self.strafe_timer = 0
        self.strafe_direction = 1
        self.covers = []
        self.visited_covers = []
        self.current_cover = None
        self.cover_pos = None
        self.cover_wait_timer = 0
        self.is_peeking = False
        self.target_selection_timer = 0
        self.last_npc_pos = Vector3()
        self.stuck_timer = 0
        self.grenade_cooldown = 5 + random.random() * 15
        self.can_see_target = False
        self.target_lost_timer = 0
        self.cover_crouch_timer = 0
        self.shoot_events = []
        self.last_nearest_target = None
        self.grenade_event = None
        self.init_covers()

    def get_npc_position(self):
        return self.npc.get_position()

    def get_target_position(self, target):
        if hasattr(target, 'get_position'):
            return target.get_position()
        return target['position']

    def get_npc_players(self):
        return self.npc.get_players()

    def init_covers(self):
        obstacles = self.npc.get_obstacles()
        if obstacles and len(obstacles) > 0:
            self.covers = [obj for obj in obstacles if 1.0 <= obj.get('height', obj.get('size', {}).get('y', 0)) <= 3.0]

    def ensure_covers_initialized(self):
        if len(self.covers) == 0:
            self.init_covers()

    def select_strafe_direction(self):
        return 1 if random.random() > 0.5 else -1

    def find_nearest_target(self):
        players = self.get_npc_players()
        if not players or len(players) == 0:
            return None

        nearest_target = None
        nearest_dist = float('inf')
        npc_pos = self.get_npc_position()

        for potential_target in players:
            if potential_target['is_dead']:
                continue
            if potential_target['team'] == self.npc.team:
                continue

            dist = npc_pos.distance_to(potential_target['position'])
            if dist < nearest_dist:
                nearest_dist = dist
                nearest_target = potential_target

        return nearest_target

    def check_line_of_sight(self):
        if not self.target or self.target.get('is_dead', True):
            return False

        shot_result = self.npc.check_shot_line_of_sight(self.target, False)
        return not shot_result['blocked']

    def find_best_cover(self):
        self.ensure_covers_initialized()

        if len(self.covers) == 0:
            return None

        npc_pos = self.get_npc_position()
        target_pos = self.get_target_position(self.target)
        to_target_dir = (target_pos - npc_pos).normalize()
        dist_to_target = npc_pos.distance_to(target_pos)

        best_cover = None
        best_score = float('-inf')

        for cover in self.covers:
            if cover in self.visited_covers:
                continue

            cover_pos = Vector3(*cover['position'])
            to_cover_dir = (cover_pos - npc_pos).normalize()
            dot_product = to_target_dir.dot(to_cover_dir)

            if dot_product < 0.5:
                continue

            dist_to_cover = npc_pos.distance_to(cover_pos)
            if dist_to_cover > dist_to_target:
                continue

            score = dot_product * 10 - dist_to_cover * 0.1

            if score > best_score:
                best_score = score
                best_cover = cover

        return best_cover

    def calculate_cover_position(self, cover):
        cover_pos = Vector3(*cover['position'])
        target_pos = self.get_target_position(self.target)
        to_target_dir = (target_pos - cover_pos).normalize()

        half_depth = max(cover['size']['x'], cover['size']['z']) / 2
        collision_radius = self.npc.collision_radius

        behind_cover_pos = cover_pos + to_target_dir * (-(half_depth + collision_radius + 0.5))
        return behind_cover_pos

    def shoot_at_target(self, distance):
        self.npc.play_gunshot()
        shot_result = self.npc.check_shot_line_of_sight(self.target, True)

        npc_pos = self.npc.get_position()
        npc_pos.y = 1.2
        target_pos = self.npc.get_position()
        target_pos.y = 1.2

        if self.target:
            t_pos = self.target.get('position') if isinstance(self.target, dict) else self.target.get_position()
            if t_pos:
                if isinstance(t_pos, list):
                    target_pos = Vector3(t_pos[0], t_pos[1], t_pos[2])
                else:
                    target_pos = t_pos
                target_pos.y = 1.2

        direction = (target_pos - npc_pos)
        dist = direction.length()
        if dist > 0:
            direction = direction.normalize()
            end_point = npc_pos + direction * min(dist, 50)
        else:
            end_point = npc_pos

        shoot_event = {
            'type': 'npc_shot',
            'npc_id': self.npc.id,
            'team': self.npc.team,
            'start_point': [npc_pos.x, npc_pos.y, npc_pos.z],
            'end_point': [end_point.x, end_point.y, end_point.z],
            'blocked': shot_result['blocked']
        }

        if shot_result['blocked']:
            return shoot_event

        final_hit_rate = self.npc.calculate_hit_rate(self.target, distance, self.hit_rate)
        if random.random() < final_hit_rate:
            target_id = self.target.get('id', 'unknown')
            ref = self.target.get('_ref')
            if ref and isinstance(ref, dict):
                ref['health'] -= 1
                shoot_event['hit'] = True
                shoot_event['target_id'] = target_id
                if ref['health'] <= 0:
                    ref['is_dead'] = True
                    if 'is_alive' in ref:
                        ref['is_alive'] = False
                    print(f'[NPC_AI] NPC {self.npc.id} killed {target_id}')
            elif ref and hasattr(ref, 'health'):
                ref.health -= 1
                shoot_event['hit'] = True
                shoot_event['target_id'] = target_id
                if ref.health <= 0:
                    ref.is_dead = True
                    print(f'[NPC_AI] NPC {self.npc.id} killed {target_id}')

        return shoot_event

    def update(self, delta_time):
        self.state_time += delta_time
        self.shoot_cooldown -= delta_time
        self.strafe_timer -= delta_time
        self.target_selection_timer += delta_time
        self.npc.update_grenade_cooldown(delta_time)

        grenade_check = self.npc.can_throw_grenade(self.target)
        if grenade_check:
            if random.random() < 0.3:
                grenade_info = self.npc.throw_grenade(self.target)
                if grenade_info:
                    self.grenade_event = grenade_info
            self.npc.grenade_cooldown = 5 + random.random() * 15

        if self.target_selection_timer >= 1.0:
            self.target_selection_timer = 0
            new_target = self.find_nearest_target()
            if new_target and new_target.get('id') != self.target.get('id'):
                self.target = new_target
                self.visited_covers = []
                self.current_cover = None
                self.state = 'NAVIGATING'

        if not self.target or self.target.get('is_dead', True):
            new_target = self.find_nearest_target()
            if new_target:
                self.target = new_target
                self.visited_covers = []
                self.current_cover = None
                self.state = 'NAVIGATING'
            else:
                self.npc.update(delta_time)
                return

        dist_to_target = self.get_npc_position().distance_to(self.get_target_position(self.target))
        self.can_see_target = self.check_line_of_sight()

        if self.can_see_target:
            self.target_lost_timer = 0
        else:
            self.target_lost_timer += delta_time

        cover_seek_range = self.npc.cover_seek_range
        engage_range = 20
        retreat_range = 10

        if self.state == 'NAVIGATING':
            if dist_to_target < cover_seek_range:
                self.state = 'ENGAGING'
                self.strafe_direction = self.select_strafe_direction()
                self.strafe_timer = 3 + random.random() * 2
                self.npc.avoid_state = 'normal'
                self.npc.avoid_timer = 0
                self.npc.avoid_target = None
                self.npc.is_stuck = False
                self.npc.stuck_timer = 0
                self.current_cover = None
            else:
                self._handle_navigating(delta_time, dist_to_target)
        elif self.state == 'IN_COVER_CROUCH':
            if dist_to_target < cover_seek_range:
                self.state = 'ENGAGING'
                self.strafe_direction = self.select_strafe_direction()
                self.strafe_timer = 3 + random.random() * 2
                self.current_cover = None
                self.npc.avoid_state = 'normal'
                self.npc.avoid_timer = 0
                self.npc.avoid_target = None
                self.npc.is_stuck = False
                self.npc.stuck_timer = 0
                self.npc.stand()
            else:
                self._handle_in_cover_crouch(delta_time, dist_to_target)
        elif self.state == 'ENGAGING':
            if dist_to_target > engage_range:
                self.state = 'NAVIGATING'
                self.visited_covers = []
                self.current_cover = None
            self._handle_engaging(delta_time, dist_to_target)

        self.npc.update(delta_time)

    def _handle_navigating(self, delta_time, dist_to_target):
        if self.npc.is_crouching:
            self.npc.stand()

        if not self.current_cover:
            self.current_cover = self.find_best_cover()
            if self.current_cover:
                self.cover_pos = self.calculate_cover_position(self.current_cover)
                self.cover_wait_timer = 1 + random.random() * 2

        if not self.current_cover:
            self.npc.navigate_to_target(self.get_target_position(self.target), delta_time, 3.0, self.get_target_position(self.target))
            self.npc.set_aim_target(self.get_target_position(self.target))
            return

        target_pos = self.cover_pos if self.cover_pos else Vector3(*self.current_cover['position'])

        npc_pos = self.get_npc_position()
        dist_to_target_pos = npc_pos.distance_to(target_pos)

        if dist_to_target_pos > 1.6:
            self.npc.navigate_to_target(target_pos, delta_time, 3.0, self.get_target_position(self.target))
            self.npc.set_aim_target(self.get_target_position(self.target))

            if self.can_see_target and self.shoot_cooldown <= 0:
                evt = self.shoot_at_target(dist_to_target)
                if evt:
                    self.shoot_events.append(evt)
                self.shoot_cooldown = self.shoot_interval
        else:
            self.visited_covers.append(self.current_cover)
            self.state = 'IN_COVER_CROUCH'
            self.cover_crouch_timer = 3 + random.random() * 22
            self.target_lost_timer = 0
            self.npc.crouch()

    def _handle_in_cover_crouch(self, delta_time, dist_to_target):
        self.cover_crouch_timer -= delta_time

        nearest_target = None
        nearest_dist = float('inf')
        npc_pos = self.get_npc_position()
        players = self.get_npc_players()
        visible_enemies = []

        for potential_target in players:
            if potential_target['is_dead']:
                continue
            if potential_target['team'] == self.npc.team:
                continue

            shot_result = self.npc.check_shot_line_of_sight(potential_target, False)
            dist = npc_pos.distance_to(potential_target['position'])
            visible_enemies.append({
                'id': potential_target['id'],
                'dist': dist,
                'blocked': shot_result['blocked']
            })

            if shot_result['blocked']:
                continue

            if dist < nearest_dist:
                nearest_dist = dist
                nearest_target = potential_target

        current_target_id = nearest_target['id'] if nearest_target else None
        if current_target_id != self.last_nearest_target:
            self.last_nearest_target = current_target_id

        if nearest_target:
            self.target = nearest_target
            self.npc.set_aim_target(self.get_target_position(nearest_target))
            if self.shoot_cooldown <= 0:
                evt = self.shoot_at_target(nearest_dist)
                if evt:
                    self.shoot_events.append(evt)
                self.shoot_cooldown = self.shoot_interval

        if self.cover_crouch_timer > 0:
            return

        self.current_cover = None
        self.state = 'NAVIGATING'

    def _handle_engaging(self, delta_time, dist_to_target):
        if self.npc.is_crouching:
            self.npc.stand()

        target_pos = self.get_target_position(self.target)
        retreat_range = 10

        if dist_to_target < retreat_range:
            self.npc.retreat_from(target_pos, delta_time, 3.0 * 0.5)
        else:
            if self.strafe_timer <= 0:
                self.strafe_direction = self.select_strafe_direction()
                self.strafe_timer = 3 + random.random() * 2
            self.npc.strafe_around(target_pos, delta_time, self.strafe_direction, 3.0 * 0.3)

        self.npc.set_aim_target(target_pos)

        if self.shoot_cooldown <= 0 and self.can_see_target:
            evt = self.shoot_at_target(dist_to_target)
            if evt:
                self.shoot_events.append(evt)
            self.shoot_cooldown = self.shoot_interval