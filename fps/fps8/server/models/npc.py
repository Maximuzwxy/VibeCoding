import math
import random
from models.vector3 import Vector3

class NPC:
    def __init__(self, npc_id, team, position, health):
        self.id = npc_id
        self.team = team
        self.position = list(position)
        self.yaw = 0
        self.health = health
        self.max_health = health
        self.is_dead = False
        self.is_moving = False
        self.is_crouching = False
        self.grenade_cooldown = 5 + random.random() * 15
        self.players = []
        self.obstacles = []
        self.ai = None
        self.collision_radius = 0.6
        self.cover_seek_range = 15
        self.avoid_obstacle_timer = 0
        self.avoid_obstacle_direction = None
        self.last_pos = Vector3(position[0], position[1], position[2])
        self.stuck_timer = 0
        self.is_stuck = False
        self.avoid_state = 'normal'
        self.avoid_timer = 0
        self.avoid_target = None

    def get_position(self):
        return Vector3(self.position[0], self.position[1], self.position[2])

    def get_players(self):
        return self.players

    def get_obstacles(self):
        return self.obstacles

    def play_gunshot(self):
        pass

    def check_shot_line_of_sight(self, target, is_npc):
        muzzle_pos = self.get_position()
        muzzle_pos.y = 1.2
        target_pos = target['position'] if isinstance(target, dict) else target.get_position()
        target_pos.y = 1.2

        direction = (target_pos - muzzle_pos)
        distance = direction.length()
        direction = direction.normalize()

        for obstacle in self.obstacles:
            if self._ray_intersects_box(muzzle_pos, direction, obstacle, distance):
                return {'blocked': True, 'distance': distance}

        return {'blocked': False, 'distance': distance}

    def _ray_intersects_box(self, ray_origin, ray_dir, box, max_dist):
        box_center = box['position']
        box_size = box['size']
        half_size = Vector3(box_size['x'] / 2, box_size['y'] / 2, box_size['z'] / 2)

        box_min = Vector3(box_center[0] - half_size.x, box_center[1] - half_size.y, box_center[2] - half_size.z)
        box_max = Vector3(box_center[0] + half_size.x, box_center[1] + half_size.y, box_center[2] + half_size.z)

        t_min = 0.0
        t_max = max_dist

        for i in range(3):
            if i == 0:
                ray_comp = ray_dir.x
                orig_comp = ray_origin.x
                b_min_comp = box_min.x
                b_max_comp = box_max.x
            elif i == 1:
                ray_comp = ray_dir.y
                orig_comp = ray_origin.y
                b_min_comp = box_min.y
                b_max_comp = box_max.y
            else:
                ray_comp = ray_dir.z
                orig_comp = ray_origin.z
                b_min_comp = box_min.z
                b_max_comp = box_max.z

            if abs(ray_comp) < 1e-8:
                if orig_comp < b_min_comp or orig_comp > b_max_comp:
                    return False
            else:
                inv_d = 1.0 / ray_comp
                t1 = (b_min_comp - orig_comp) * inv_d
                t2 = (b_max_comp - orig_comp) * inv_d

                if t1 > t2:
                    t1, t2 = t2, t1

                t_min = max(t_min, t1)
                t_max = min(t_max, t2)

                if t_min > t_max:
                    return False

        return t_min > 0 and t_min < max_dist

    def calculate_hit_rate(self, target, distance, hit_rate_config):
        if distance < 10:
            base = hit_rate_config.get('closeRange', 0.8)
        elif distance < 25:
            base = hit_rate_config.get('midRange', 0.5)
        else:
            base = hit_rate_config.get('farRange', 0.2)
        return base

    def set_aim_target(self, target_pos):
        old_yaw = self.yaw
        direction = (target_pos - self.get_position()).normalize()
        if direction.length() > 0:
            self.yaw = math.atan2(direction.x, direction.z)

    def navigate_to_target(self, target_pos, delta_time, speed, chase_target):
        npc_pos = self.get_position()
        to_target = target_pos - npc_pos
        to_target.y = 0
        dist_to_target = to_target.length()

        if dist_to_target < 1.5:
            self.is_moving = False
            self.last_pos = npc_pos.copy()
            self.avoid_state = 'normal'
            self.avoid_timer = 0
            return

        if self.avoid_state == 'avoiding':
            self.avoid_timer += delta_time

            to_avoid = self.avoid_target - npc_pos
            to_avoid.y = 0
            dist_to_avoid = to_avoid.length()

            if dist_to_avoid < 0.3:
                self.avoid_state = 'normal'
                self.avoid_timer = 0
                self.avoid_target = None
                return

            if self.avoid_timer >= 0.8:
                self.avoid_state = 'normal'
                self.avoid_timer = 0
                self.avoid_target = None
                return

            avoid_dir = to_avoid.normalize()
            move_vec = avoid_dir * speed * delta_time
            self.position[0] += move_vec.x
            self.position[2] += move_vec.z
            self.is_moving = True
            return

        direction = to_target.normalize()
        move_vec = direction * speed * delta_time
        new_x = self.position[0] + move_vec.x
        new_z = self.position[2] + move_vec.z

        if not self._check_collision(new_x, new_z):
            self.position[0] = new_x
            self.position[2] = new_z
        self.is_moving = True

        pos_diff = npc_pos.distance_to(self.last_pos)
        if pos_diff < 0.05:
            self.stuck_timer += delta_time
        else:
            self.stuck_timer = 0
            self.is_stuck = False

        if self.stuck_timer > 0.2 and not self.is_stuck:
            self.is_stuck = True
            self.avoid_timer = 0

            obstacle_center = self._find_closest_obstacle_center(npc_pos)
            if obstacle_center:
                to_obstacle = obstacle_center - npc_pos
                to_obstacle.y = 0

                to_target_dir = (target_pos - npc_pos).normalize()
                strafe_dir = -1 if to_obstacle.x > 0 else 1

                back_offset = to_target_dir * -0.3
                strafe_offset = Vector3(strafe_dir * 1.0, 0, 0)
                self.avoid_target = Vector3(
                    self.position[0] + back_offset.x + strafe_offset.x,
                    self.position[1],
                    self.position[2] + back_offset.z + strafe_offset.z
                )
                self.avoid_state = 'avoiding'
            else:
                self.is_stuck = False

            self.stuck_timer = 0

        self.last_pos = npc_pos.copy()

        if chase_target:
            to_enemy = chase_target - npc_pos
            to_enemy.y = 0
            if to_enemy.length() > 0:
                self.yaw = math.atan2(to_enemy.x, to_enemy.z)
        else:
            if to_target.length() > 0:
                self.yaw = math.atan2(to_target.x, to_target.z)

    def _raycast_check_obstacle(self, origin, direction, max_dist):
        for obstacle in self.obstacles:
            box_center = obstacle['position']
            box_size = obstacle['size']
            half_w = box_size['x'] / 2 + self.collision_radius
            half_h = box_size['y'] / 2
            half_d = box_size['z'] / 2 + self.collision_radius

            box_min = Vector3(box_center[0] - half_w, box_center[1] - half_h, box_center[2] - half_d)
            box_max = Vector3(box_center[0] + half_w, box_center[1] + half_h, box_center[2] + half_d)

            if self._ray_box_intersect(origin, direction, max_dist, box_min, box_max):
                return obstacle
        return None

    def _ray_box_intersect(self, origin, direction, max_dist, box_min, box_max):
        tmin = 0.0
        tmax = max_dist

        for i in range(3):
            if abs(direction.to_list()[i]) < 1e-6:
                if origin.to_list()[i] < box_min.to_list()[i] or origin.to_list()[i] > box_max.to_list()[i]:
                    return False
            else:
                d = 1.0 / direction.to_list()[i]
                t1 = (box_min.to_list()[i] - origin.to_list()[i]) * d
                t2 = (box_max.to_list()[i] - origin.to_list()[i]) * d
                if t1 > t2:
                    t1, t2 = t2, t1
                tmin = max(tmin, t1)
                tmax = min(tmax, t2)
                if tmin > tmax:
                    return False
        return tmin > 0.01

    def _find_closest_obstacle_center(self, npc_pos):
        closest = None
        closest_dist = float('inf')
        for obstacle in self.obstacles:
            obs_pos = obstacle.get('position')
            if not obs_pos:
                continue
            obs_vector = Vector3(*obs_pos)
            dist = npc_pos.distance_to(obs_vector)
            if dist < closest_dist and dist < 5:
                closest_dist = dist
                closest = obs_vector
        return closest

    def strafe_around(self, target_pos, delta_time, direction):
        to_target = (target_pos - self.get_position()).normalize()
        perpendicular = Vector3(-to_target.z * direction, 0, to_target.x * direction)
        if perpendicular.length() > 0:
            move_vec = perpendicular * 2.0 * delta_time
            new_x = self.position[0] + move_vec.x
            new_z = self.position[2] + move_vec.z
            if not self._check_collision(new_x, new_z):
                self.position[0] = new_x
                self.position[2] = new_z
            self.is_moving = True
            self.yaw = math.atan2(to_target.x, to_target.z)

    def crouch(self):
        if not self.is_crouching:
            pass
        self.is_crouching = True
        self.is_moving = False

    def stand(self):
        if self.is_crouching:
            pass
        self.is_crouching = False

    def run(self):
        if not self.is_moving:
            pass
        self.is_moving = True

    def move(self, direction, delta_time, speed):
        if direction.length() > 0:
            move_vec = direction.normalize() * speed * delta_time
            new_x = self.position[0] + move_vec.x
            new_z = self.position[2] + move_vec.z
            if not self._check_collision(new_x, new_z):
                self.position[0] = new_x
                self.position[2] = new_z
            self.is_moving = True

    def _check_collision(self, new_x, new_z):
        npc_radius = self.collision_radius
        for obstacle in self.obstacles:
            box_center = obstacle['position']
            box_size = obstacle['size']
            half_x = box_size['x'] / 2 + npc_radius
            half_z = box_size['z'] / 2 + npc_radius

            dx = abs(new_x - box_center[0])
            dz = abs(new_z - box_center[2])

            if dx < half_x and dz < half_z:
                return True
        return False

    def face_direction(self, direction):
        if direction.length() > 0:
            self.yaw = math.atan2(direction.x, direction.z)

    def strafe_around(self, target_pos, delta_time, strafe_direction, speed):
        to_target = target_pos - self.get_position()
        to_target.y = 0
        if to_target.length() > 0:
            to_target = to_target.normalize()
            self.face_direction(to_target)
            strafe_dir = Vector3(-to_target.z, 0, to_target.x) * strafe_direction
            self.run()
            self.move(strafe_dir, delta_time, speed)

    def retreat_from(self, target_pos, delta_time, speed):
        to_target = target_pos - self.get_position()
        to_target.y = 0
        if to_target.length() > 0:
            retreat_dir = to_target.normalize() * -1
            self.face_direction(to_target)
            self.run()
            self.move(retreat_dir, delta_time, speed)

    def update(self, delta_time):
        pass

    def can_throw_grenade(self, target):
        if self.grenade_cooldown > 0 or self.is_dead or not target or target.get('is_dead', True):
            return False
        target_pos = target['position'] if isinstance(target, dict) else target.get_position()
        dist = self.get_position().distance_to(target_pos)
        return 15 <= dist <= 35

    def throw_grenade(self, target, grenade_damage=1):
        if self.grenade_cooldown > 0 or self.is_dead or not target:
            return None

        target_pos = target['position'] if isinstance(target, dict) else target.get_position()
        target_pos = Vector3(target_pos.x, 0, target_pos.z)

        npc_pos = self.get_position()
        npc_pos = Vector3(npc_pos.x, 0, npc_pos.z)

        direction = target_pos - npc_pos
        dist = direction.length()
        if dist > 0:
            direction = direction.normalize()

        final_dist = max(5, min(20, dist))
        impact_pos = Vector3(
            npc_pos.x + direction.x * final_dist,
            0,
            npc_pos.z + direction.z * final_dist
        )

        grenade_info = {
            'npc_id': self.id,
            'npc_team': self.team,
            'target_position': [impact_pos.x, impact_pos.y, impact_pos.z],
            'hits': []
        }

        return grenade_info

    def update_grenade_cooldown(self, delta_time):
        self.grenade_cooldown -= delta_time