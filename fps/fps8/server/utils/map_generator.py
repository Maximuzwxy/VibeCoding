import random
import math

ARENA_SIZE = 100
WALL_HEIGHT = 3
WALL_THICKNESS = 0.5


def generate_map_data():
    tall_height = 1.8
    short_height = 1.25

    return {
        'arenaSize': ARENA_SIZE,
        'wallHeight': WALL_HEIGHT,
        'wallThickness': WALL_THICKNESS,

        'boundaryWalls': [
            {'size': [ARENA_SIZE, WALL_HEIGHT, WALL_THICKNESS], 'pos': [0, WALL_HEIGHT / 2, -ARENA_SIZE / 2]},
            {'size': [ARENA_SIZE, WALL_HEIGHT, WALL_THICKNESS], 'pos': [0, WALL_HEIGHT / 2, ARENA_SIZE / 2]},
            {'size': [WALL_THICKNESS, WALL_HEIGHT, ARENA_SIZE], 'pos': [-ARENA_SIZE / 2, WALL_HEIGHT / 2, 0]},
            {'size': [WALL_THICKNESS, WALL_HEIGHT, ARENA_SIZE], 'pos': [ARENA_SIZE / 2, WALL_HEIGHT / 2, 0]}
        ],

        'walls': [
            {'pos': [-32.4, 1.2, -42]},
            {'pos': [-10.8, 1.2, -42]},
            {'pos': [10.8, 1.2, -42]},
            {'pos': [32.4, 1.2, -42]},
            {'pos': [-32.4, 1.2, 42]},
            {'pos': [-10.8, 1.2, 42]},
            {'pos': [10.8, 1.2, 42]},
            {'pos': [32.4, 1.2, 42]}
        ],

        'boxes': [
            {'pos': [-35, tall_height / 2, -35], 'size': [1.5, tall_height, 1.5]},
            {'pos': [-20, tall_height / 2, -35], 'size': [1.5, tall_height, 1.5]},
            {'pos': [0, tall_height / 2, -35], 'size': [1.5, tall_height, 1.5]},
            {'pos': [20, tall_height / 2, -35], 'size': [1.5, tall_height, 1.5]},
            {'pos': [35, tall_height / 2, -35], 'size': [1.5, tall_height, 1.5]},

            {'pos': [-35, tall_height / 2, -20], 'size': [1.5, tall_height, 1.5]},
            {'pos': [-20, tall_height / 2, -20], 'size': [1.5, tall_height, 1.5]},
            {'pos': [0, tall_height / 2, -20], 'size': [1.5, tall_height, 1.5]},
            {'pos': [20, tall_height / 2, -20], 'size': [1.5, tall_height, 1.5]},
            {'pos': [35, tall_height / 2, -20], 'size': [1.5, tall_height, 1.5]},

            {'pos': [-35, tall_height / 2, 0], 'size': [1.5, tall_height, 1.5]},
            {'pos': [-20, tall_height / 2, 0], 'size': [1.5, tall_height, 1.5]},
            {'pos': [20, tall_height / 2, 0], 'size': [1.5, tall_height, 1.5]},
            {'pos': [35, tall_height / 2, 0], 'size': [1.5, tall_height, 1.5]},

            {'pos': [-35, tall_height / 2, 20], 'size': [1.5, tall_height, 1.5]},
            {'pos': [-20, tall_height / 2, 20], 'size': [1.5, tall_height, 1.5]},
            {'pos': [0, tall_height / 2, 20], 'size': [1.5, tall_height, 1.5]},
            {'pos': [20, tall_height / 2, 20], 'size': [1.5, tall_height, 1.5]},
            {'pos': [35, tall_height / 2, 20], 'size': [1.5, tall_height, 1.5]},

            {'pos': [-35, tall_height / 2, 35], 'size': [1.5, tall_height, 1.5]},
            {'pos': [-20, tall_height / 2, 35], 'size': [1.5, tall_height, 1.5]},
            {'pos': [0, tall_height / 2, 35], 'size': [1.5, tall_height, 1.5]},
            {'pos': [20, tall_height / 2, 35], 'size': [1.5, tall_height, 1.5]},
            {'pos': [35, tall_height / 2, 35], 'size': [1.5, tall_height, 1.5]},

            {'pos': [-28, short_height / 2, -28], 'size': [1.5, short_height, 1.5]},
            {'pos': [-10, short_height / 2, -28], 'size': [1.5, short_height, 1.5]},
            {'pos': [10, short_height / 2, -28], 'size': [1.5, short_height, 1.5]},
            {'pos': [28, short_height / 2, -28], 'size': [1.5, short_height, 1.5]},

            {'pos': [-28, short_height / 2, -10], 'size': [1.5, short_height, 1.5]},
            {'pos': [-10, short_height / 2, -10], 'size': [1.5, short_height, 1.5]},
            {'pos': [10, short_height / 2, -10], 'size': [1.5, short_height, 1.5]},
            {'pos': [28, short_height / 2, -10], 'size': [1.5, short_height, 1.5]},

            {'pos': [-28, short_height / 2, 10], 'size': [1.5, short_height, 1.5]},
            {'pos': [-10, short_height / 2, 10], 'size': [1.5, short_height, 1.5]},
            {'pos': [10, short_height / 2, 10], 'size': [1.5, short_height, 1.5]},
            {'pos': [28, short_height / 2, 10], 'size': [1.5, short_height, 1.5]},

            {'pos': [-28, short_height / 2, 28], 'size': [1.5, short_height, 1.5]},
            {'pos': [-10, short_height / 2, 28], 'size': [1.5, short_height, 1.5]},
            {'pos': [10, short_height / 2, 28], 'size': [1.5, short_height, 1.5]},
            {'pos': [28, short_height / 2, 28], 'size': [1.5, short_height, 1.5]},

            {'pos': [0, short_height / 2, -28], 'size': [1.5, short_height, 1.5]},
            {'pos': [0, short_height / 2, -10], 'size': [1.5, short_height, 1.5]},
            {'pos': [0, short_height / 2, 10], 'size': [1.5, short_height, 1.5]},
            {'pos': [0, short_height / 2, 28], 'size': [1.5, short_height, 1.5]}
        ],

        'clouds': generate_clouds_data(),
        'trees': generate_trees_data(),
        'grass': generate_grass_data()
    }


def generate_clouds_data():
    clouds = []
    for _ in range(20):
        num_puffs = 3 + random.randint(0, 3)
        puffs = []
        for _ in range(num_puffs):
            puffs.append({
                'size': 2 + random.random() * 3,
                'offset': [
                    (random.random() - 0.5) * 6,
                    (random.random() - 0.5) * 1.5,
                    (random.random() - 0.5) * 4
                ],
                'scaleY': 0.6
            })
        clouds.append({
            'position': [
                (random.random() - 0.5) * 80,
                15 + random.random() * 10,
                (random.random() - 0.5) * 80
            ],
            'puffs': puffs
        })
    return clouds


def generate_trees_data():
    tree_positions = []
    min_distance = 5
    num_trees = 60
    grid_size = 6
    half_arena = (ARENA_SIZE - 10) / 2
    grid_cells = math.ceil((ARENA_SIZE - 10) / grid_size)

    for _ in range(num_trees):
        position = None
        valid = False
        attempts = 0

        while not valid and attempts < 50:
            grid_x = random.randint(0, grid_cells - 1)
            grid_z = random.randint(0, grid_cells - 1)

            position = [
                -half_arena + grid_x * grid_size + random.random() * grid_size,
                0,
                -half_arena + grid_z * grid_size + random.random() * grid_size
            ]

            valid = True
            if position[2] < -42 or position[2] > 42:
                valid = False
                attempts += 1
                continue

            for existing in tree_positions:
                dx = position[0] - existing[0]
                dz = position[2] - existing[2]
                if math.sqrt(dx * dx + dz * dz) < min_distance:
                    valid = False
                    break

            attempts += 1

        if valid:
            tree_positions.append(position)

    return [{
        'position': pos,
        'trunkHeight': 2 + random.random() * 1.5,
        'trunkRadius': 0.15 + random.random() * 0.1,
        'crownLayers': 2 + random.randint(0, 1)
    } for pos in tree_positions]


def generate_grass_data():
    grass = []
    num_grass_patches = 150

    for _ in range(num_grass_patches):
        grass.append({
            'position': [
                (random.random() - 0.5) * ARENA_SIZE * 0.9,
                0,
                (random.random() - 0.5) * ARENA_SIZE * 0.9
            ],
            'scale': 0.5 + random.random() * 1
        })
    return grass


def get_obstacle_boxes(map_data):
    boxes = []

    for wall in map_data['boundaryWalls']:
        boxes.append({
            'min': [
                wall['pos'][0] - wall['size'][0] / 2,
                wall['pos'][1] - wall['size'][1] / 2,
                wall['pos'][2] - wall['size'][2] / 2
            ],
            'max': [
                wall['pos'][0] + wall['size'][0] / 2,
                wall['pos'][1] + wall['size'][1] / 2,
                wall['pos'][2] + wall['size'][2] / 2
            ]
        })

    for wall in map_data['walls']:
        boxes.append({
            'min': [wall['pos'][0] - 4, wall['pos'][1] - 1.2, wall['pos'][2] - 0.3],
            'max': [wall['pos'][0] + 4, wall['pos'][1] + 1.2, wall['pos'][2] + 0.3]
        })

    for box in map_data['boxes']:
        boxes.append({
            'min': [
                box['pos'][0] - box['size'][0] / 2,
                box['pos'][1] - box['size'][1] / 2,
                box['pos'][2] - box['size'][2] / 2
            ],
            'max': [
                box['pos'][0] + box['size'][0] / 2,
                box['pos'][1] + box['size'][1] / 2,
                box['pos'][2] + box['size'][2] / 2
            ]
        })

    return boxes