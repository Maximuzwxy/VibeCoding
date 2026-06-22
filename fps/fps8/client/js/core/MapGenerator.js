class MapGenerator {
    static ARENA_SIZE = 100;
    static WALL_HEIGHT = 3;
    static WALL_THICKNESS = 0.5;

    static generateMapData() {
        const tallHeight = 1.8;
        const shortHeight = 1.25;

        return {
            arenaSize: this.ARENA_SIZE,
            wallHeight: this.WALL_HEIGHT,
            wallThickness: this.WALL_THICKNESS,
            
            boundaryWalls: [
                { size: [this.ARENA_SIZE, this.WALL_HEIGHT, this.WALL_THICKNESS], pos: [0, this.WALL_HEIGHT / 2, -this.ARENA_SIZE / 2] },
                { size: [this.ARENA_SIZE, this.WALL_HEIGHT, this.WALL_THICKNESS], pos: [0, this.WALL_HEIGHT / 2, this.ARENA_SIZE / 2] },
                { size: [this.WALL_THICKNESS, this.WALL_HEIGHT, this.ARENA_SIZE], pos: [-this.ARENA_SIZE / 2, this.WALL_HEIGHT / 2, 0] },
                { size: [this.WALL_THICKNESS, this.WALL_HEIGHT, this.ARENA_SIZE], pos: [this.ARENA_SIZE / 2, this.WALL_HEIGHT / 2, 0] }
            ],
            
            walls: [
                { pos: [-32.4, 1.2, -42] },
                { pos: [-10.8, 1.2, -42] },
                { pos: [10.8, 1.2, -42] },
                { pos: [32.4, 1.2, -42] },
                { pos: [-32.4, 1.2, 42] },
                { pos: [-10.8, 1.2, 42] },
                { pos: [10.8, 1.2, 42] },
                { pos: [32.4, 1.2, 42] }
            ],
            
            boxes: [
                { pos: [-35, tallHeight / 2, -35], size: [1.5, tallHeight, 1.5] },
                { pos: [-20, tallHeight / 2, -35], size: [1.5, tallHeight, 1.5] },
                { pos: [0, tallHeight / 2, -35], size: [1.5, tallHeight, 1.5] },
                { pos: [20, tallHeight / 2, -35], size: [1.5, tallHeight, 1.5] },
                { pos: [35, tallHeight / 2, -35], size: [1.5, tallHeight, 1.5] },
                
                { pos: [-35, tallHeight / 2, -20], size: [1.5, tallHeight, 1.5] },
                { pos: [-20, tallHeight / 2, -20], size: [1.5, tallHeight, 1.5] },
                { pos: [0, tallHeight / 2, -20], size: [1.5, tallHeight, 1.5] },
                { pos: [20, tallHeight / 2, -20], size: [1.5, tallHeight, 1.5] },
                { pos: [35, tallHeight / 2, -20], size: [1.5, tallHeight, 1.5] },
                
                { pos: [-35, tallHeight / 2, 0], size: [1.5, tallHeight, 1.5] },
                { pos: [-20, tallHeight / 2, 0], size: [1.5, tallHeight, 1.5] },
                { pos: [20, tallHeight / 2, 0], size: [1.5, tallHeight, 1.5] },
                { pos: [35, tallHeight / 2, 0], size: [1.5, tallHeight, 1.5] },
                
                { pos: [-35, tallHeight / 2, 20], size: [1.5, tallHeight, 1.5] },
                { pos: [-20, tallHeight / 2, 20], size: [1.5, tallHeight, 1.5] },
                { pos: [0, tallHeight / 2, 20], size: [1.5, tallHeight, 1.5] },
                { pos: [20, tallHeight / 2, 20], size: [1.5, tallHeight, 1.5] },
                { pos: [35, tallHeight / 2, 20], size: [1.5, tallHeight, 1.5] },
                
                { pos: [-35, tallHeight / 2, 35], size: [1.5, tallHeight, 1.5] },
                { pos: [-20, tallHeight / 2, 35], size: [1.5, tallHeight, 1.5] },
                { pos: [0, tallHeight / 2, 35], size: [1.5, tallHeight, 1.5] },
                { pos: [20, tallHeight / 2, 35], size: [1.5, tallHeight, 1.5] },
                { pos: [35, tallHeight / 2, 35], size: [1.5, tallHeight, 1.5] },

                { pos: [-28, shortHeight / 2, -28], size: [1.5, shortHeight, 1.5] },
                { pos: [-10, shortHeight / 2, -28], size: [1.5, shortHeight, 1.5] },
                { pos: [10, shortHeight / 2, -28], size: [1.5, shortHeight, 1.5] },
                { pos: [28, shortHeight / 2, -28], size: [1.5, shortHeight, 1.5] },
                
                { pos: [-28, shortHeight / 2, -10], size: [1.5, shortHeight, 1.5] },
                { pos: [-10, shortHeight / 2, -10], size: [1.5, shortHeight, 1.5] },
                { pos: [10, shortHeight / 2, -10], size: [1.5, shortHeight, 1.5] },
                { pos: [28, shortHeight / 2, -10], size: [1.5, shortHeight, 1.5] },
                
                { pos: [-28, shortHeight / 2, 10], size: [1.5, shortHeight, 1.5] },
                { pos: [-10, shortHeight / 2, 10], size: [1.5, shortHeight, 1.5] },
                { pos: [10, shortHeight / 2, 10], size: [1.5, shortHeight, 1.5] },
                { pos: [28, shortHeight / 2, 10], size: [1.5, shortHeight, 1.5] },
                
                { pos: [-28, shortHeight / 2, 28], size: [1.5, shortHeight, 1.5] },
                { pos: [-10, shortHeight / 2, 28], size: [1.5, shortHeight, 1.5] },
                { pos: [10, shortHeight / 2, 28], size: [1.5, shortHeight, 1.5] },
                { pos: [28, shortHeight / 2, 28], size: [1.5, shortHeight, 1.5] },
                
                { pos: [0, shortHeight / 2, -28], size: [1.5, shortHeight, 1.5] },
                { pos: [0, shortHeight / 2, -10], size: [1.5, shortHeight, 1.5] },
                { pos: [0, shortHeight / 2, 10], size: [1.5, shortHeight, 1.5] },
                { pos: [0, shortHeight / 2, 28], size: [1.5, shortHeight, 1.5] }
            ],
            
            clouds: this.generateCloudsData(),
            trees: this.generateTreesData(),
            grass: this.generateGrassData()
        };
    }

    static generateCloudsData() {
        const clouds = [];
        for (let i = 0; i < 20; i++) {
            const numPuffs = 3 + Math.floor(Math.random() * 4);
            const puffs = [];
            for (let j = 0; j < numPuffs; j++) {
                puffs.push({
                    size: 2 + Math.random() * 3,
                    offset: [
                        (Math.random() - 0.5) * 6,
                        (Math.random() - 0.5) * 1.5,
                        (Math.random() - 0.5) * 4
                    ],
                    scaleY: 0.6
                });
            }
            clouds.push({
                position: [
                    (Math.random() - 0.5) * 80,
                    15 + Math.random() * 10,
                    (Math.random() - 0.5) * 80
                ],
                puffs: puffs
            });
        }
        return clouds;
    }

    static generateTreesData() {
        const treePositions = [];
        const minDistance = 5;
        const numTrees = 60;
        const gridSize = 6;
        const halfArena = (this.ARENA_SIZE - 10) / 2;
        const gridCells = Math.ceil((this.ARENA_SIZE - 10) / gridSize);

        for (let i = 0; i < numTrees; i++) {
            let position;
            let valid;
            let attempts = 0;

            do {
                const gridX = Math.floor(Math.random() * gridCells);
                const gridZ = Math.floor(Math.random() * gridCells);
                
                position = [
                    -halfArena + gridX * gridSize + Math.random() * gridSize,
                    0,
                    -halfArena + gridZ * gridSize + Math.random() * gridSize
                ];

                valid = true;
                if (position[2] < -42 || position[2] > 42) {
                    valid = false;
                }

                for (const existing of treePositions) {
                    const dx = position[0] - existing[0];
                    const dz = position[2] - existing[2];
                    if (Math.sqrt(dx * dx + dz * dz) < minDistance) {
                        valid = false;
                        break;
                    }
                }

                attempts++;
            } while (!valid && attempts < 50);

            if (valid) {
                treePositions.push(position);
            }
        }

        return treePositions.map(pos => ({
            position: pos,
            trunkHeight: 2 + Math.random() * 1.5,
            trunkRadius: 0.15 + Math.random() * 0.1,
            crownLayers: 2 + Math.floor(Math.random() * 2)
        }));
    }

    static generateGrassData() {
        const grass = [];
        const numGrassPatches = 150;

        for (let i = 0; i < numGrassPatches; i++) {
            grass.push({
                position: [
                    (Math.random() - 0.5) * this.ARENA_SIZE * 0.9,
                    0,
                    (Math.random() - 0.5) * this.ARENA_SIZE * 0.9
                ],
                scale: 0.5 + Math.random() * 1
            });
        }
        return grass;
    }

    static renderMap(scene, mapData, obstaclesArray) {
        console.log('[MapGenerator] Rendering map with', mapData.boxes.length, 'boxes,', mapData.trees.length, 'trees');
        
        this.renderGround(scene, mapData);
        this.renderBoundaryWalls(scene, mapData, obstaclesArray);
        this.renderClouds(scene, mapData);
        this.renderWalls(scene, mapData, obstaclesArray);
        this.renderBoxes(scene, mapData, obstaclesArray);
        this.renderTrees(scene, mapData, obstaclesArray);
        this.renderGrass(scene, mapData);
    }

    static renderGround(scene, mapData) {
        const groundGeometry = new THREE.PlaneGeometry(mapData.arenaSize, mapData.arenaSize);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        const gridHelper = new THREE.GridHelper(mapData.arenaSize, 50, 0x3d8b40, 0x3d8b40);
        gridHelper.position.y = 0.01;
        gridHelper.material.opacity = 0.15;
        gridHelper.material.transparent = true;
        scene.add(gridHelper);
    }

    static renderBoundaryWalls(scene, mapData, obstaclesArray) {
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

        mapData.boundaryWalls.forEach(wall => {
            const geometry = new THREE.BoxGeometry(...wall.size);
            const mesh = new THREE.Mesh(geometry, wallMaterial);
            mesh.position.set(...wall.pos);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            obstaclesArray.push(mesh);
        });
    }

    static renderClouds(scene, mapData) {
        const cloudMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
        
        mapData.clouds.forEach(cloudData => {
            const cloud = new THREE.Group();
            
            cloudData.puffs.forEach(puff => {
                const puffGeometry = new THREE.SphereGeometry(puff.size, 8, 8);
                const puffMesh = new THREE.Mesh(puffGeometry, cloudMaterial);
                puffMesh.position.set(...puff.offset);
                puffMesh.scale.y = puff.scaleY;
                cloud.add(puffMesh);
            });
            
            cloud.position.set(...cloudData.position);
            scene.add(cloud);
        });
    }

    static renderWalls(scene, mapData, obstaclesArray) {
        const wallGeometry = new THREE.BoxGeometry(8.0, 2.4, 0.6);
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

        mapData.walls.forEach(wall => {
            const mesh = new THREE.Mesh(wallGeometry, wallMaterial);
            mesh.position.set(...wall.pos);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            obstaclesArray.push(mesh);
        });
    }

    static renderBoxes(scene, mapData, obstaclesArray) {
        const boxMaterial = new THREE.MeshLambertMaterial({ color: 0xD2691E });

        mapData.boxes.forEach(box => {
            const geometry = new THREE.BoxGeometry(...box.size);
            const mesh = new THREE.Mesh(geometry, boxMaterial);
            mesh.position.set(...box.pos);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            obstaclesArray.push(mesh);
        });
    }

    static renderTrees(scene, mapData, obstaclesArray) {
        mapData.trees.forEach(treeData => {
            const tree = new THREE.Group();

            const trunkGeometry = new THREE.CylinderGeometry(
                treeData.trunkRadius * 0.7, 
                treeData.trunkRadius, 
                treeData.trunkHeight, 
                8
            );
            const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = treeData.trunkHeight / 2;
            trunk.castShadow = true;
            tree.add(trunk);

            for (let i = 0; i < treeData.crownLayers; i++) {
                const crownRadius = 1.2 - i * 0.3 + Math.random() * 0.3;
                const crownHeight = 1.5 - i * 0.3;
                const crownGeometry = new THREE.ConeGeometry(crownRadius, crownHeight, 8);
                const crownMaterial = new THREE.MeshLambertMaterial({ 
                    color: new THREE.Color().setHSL(0.28 + Math.random() * 0.08, 0.6, 0.3 + Math.random() * 0.15) 
                });
                const crown = new THREE.Mesh(crownGeometry, crownMaterial);
                crown.position.y = treeData.trunkHeight + i * 0.8;
                crown.castShadow = true;
                tree.add(crown);
            }

            tree.position.set(...treeData.position);
            scene.add(tree);
            obstaclesArray.push(trunk);
        });
    }

    static renderGrass(scene, mapData) {
        const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x66BB6A });

        mapData.grass.forEach(grassData => {
            const grassGeometry = new THREE.SphereGeometry(0.25, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
            const grass = new THREE.Mesh(grassGeometry, grassMaterial);
            
            grass.position.set(...grassData.position);
            
            const scale = grassData.scale;
            grass.scale.set(scale, scale * 0.6, scale);
            scene.add(grass);
        });
    }

    static getObstacleBoxes(mapData) {
        const boxes = [];
        
        mapData.boundaryWalls.forEach(wall => {
            boxes.push({
                min: [
                    wall.pos[0] - wall.size[0] / 2,
                    wall.pos[1] - wall.size[1] / 2,
                    wall.pos[2] - wall.size[2] / 2
                ],
                max: [
                    wall.pos[0] + wall.size[0] / 2,
                    wall.pos[1] + wall.size[1] / 2,
                    wall.pos[2] + wall.size[2] / 2
                ]
            });
        });
        
        mapData.walls.forEach(wall => {
            boxes.push({
                min: [wall.pos[0] - 4, wall.pos[1] - 1.2, wall.pos[2] - 0.3],
                max: [wall.pos[0] + 4, wall.pos[1] + 1.2, wall.pos[2] + 0.3]
            });
        });
        
        mapData.boxes.forEach(box => {
            boxes.push({
                min: [
                    box.pos[0] - box.size[0] / 2,
                    box.pos[1] - box.size[1] / 2,
                    box.pos[2] - box.size[2] / 2
                ],
                max: [
                    box.pos[0] + box.size[0] / 2,
                    box.pos[1] + box.size[1] / 2,
                    box.pos[2] + box.size[2] / 2
                ]
            });
        });
        
        return boxes;
    }
}
