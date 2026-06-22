# 第三阶段：地图场景 + 保守版 AI

## 概述

本阶段在第二阶段的基础上添加了两个核心功能：完整的地图场景和保守版 AI 系统。地图场景包括天空、雾效、阴影、地面、边界墙、装饰性墙壁、树木、草地和箱子等元素，为玩家提供了一个丰富的战斗环境。

AI 系统方面，本阶段实现了保守版 AI 行为模式。保守版 AI 会优先保持与目标的距离，利用掩体进行隐蔽，并在安全时机进行射击。与激进版 AI 不同，保守版 AI 不会主动追击敌人，而是采用更谨慎的战术。

## 目录结构

本阶段的代码结构在第二阶段的基础上增加了音频管理器和 AI 模块：

```
fps5/
├── index.html
├── js/
│   ├── audio/
│   │   └── AudioManager.js       # 音频管理器
│   ├── config/
│   │   ├── CharacterConfig.js    # 角色配置
│   │   └── SkeletonConfig.js     # 骨骼配置
│   ├── skeleton/
│   │   ├── SkeletonAnimator.js   # 骨骼动画器
│   │   └── SkeletonFactory.js    # 骨骼工厂
│   ├── core/
│   │   ├── Character.js          # 角色基类
│   │   ├── NPC.js                # NPC 角色类
│   │   ├── NPCAI.js              # NPC AI 控制器
│   │   └── Player.js             # 玩家角色类
│   └── script.js                  # 主程序入口
├── css/
│   └── style.css
```

## 地图场景系统

### 场景初始化

地图场景使用更大的活动范围（ARENA_SIZE = 60），并启用了阴影系统。

```javascript
const ARENA_SIZE = 60;
const WALL_HEIGHT = 3;
const WALL_THICKNESS = 0.5;

function init() {
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);  // 天空蓝色
    scene.fog = new THREE.Fog(0x87CEEB, 30, 60);   // 雾效

    // 启用阴影
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 方向光（产生阴影）
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

    // 创建地图元素
    createGround();
    createBoundaryWalls();
    createClouds();
    createPlayerWalls();
    createNPCWalls();
    createTrees();
    createGrass();
    createBoxes();
}
```

### 雾效系统

雾效是增加场景 depth 的重要手段。通过设置场景的背景色与雾的颜色一致，可以创造出远处物体逐渐淡出的效果，增强场景的真实感和沉浸感。

```javascript
scene.fog = new THREE.Fog(0x87CEEB, 30, 60);
```

`Fog` 构造函数的参数分别是：颜色、近裁剪面距离、远裁剪面距离。在这个范围内，物体将根据距离逐渐融入雾的颜色中。

### 阴影系统

阴影通过 `DirectionalLight` 产生，需要配置多个参数才能达到理想效果。阴影贴图的大小直接影响阴影的清晰度，而相机的视野范围决定了阴影投射的区域。

```javascript
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.left = -30;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = -30;
```

对于场景中的物体，需要分别设置 `castShadow`（投射阴影）和 `receiveShadow`（接收阴影）属性。

### 地面创建

```javascript
function createGround() {
    const groundGeometry = new THREE.PlaneGeometry(ARENA_SIZE, ARENA_SIZE);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 添加网格辅助线
    const gridHelper = new THREE.GridHelper(ARENA_SIZE, 50, 0x3d8b40, 0x3d8b40);
    gridHelper.position.y = 0.01;
    gridHelper.material.opacity = 0.15;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);
}
```

### 边界墙系统

地图四周被边界墙包围，防止角色走出活动区域。

```javascript
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
```

### 装饰墙

在玩家出生点和 NPC 出生点附近添加了装饰性墙壁，提供战斗中的掩体。

```javascript
function createPlayerWalls() {
    const wallGeometry = new THREE.BoxGeometry(4.8, 2.4, 0.6);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

    // 在玩家区域创建4列墙壁
    const positions = [-19.44, -6.48, 6.48, 19.44];
    positions.forEach(x => {
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(x, 1.2, -22);
        wall.castShadow = true;
        wall.receiveShadow = true;
        scene.add(wall);
        obstacles.push(wall);
    });
}
```

### 云朵系统

```javascript
function createClouds() {
    const cloudMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.8 
    });
    
    for (let i = 0; i < 20; i++) {
        const cloud = new THREE.Group();
        const numPuffs = 3 + Math.floor(Math.random() * 4);
        
        // 创建多个球体组成云朵
        for (let j = 0; j < numPuffs; j++) {
            const size = 2 + Math.random() * 3;
            const puffGeometry = new THREE.SphereGeometry(size, 8, 8);
            const puff = new THREE.Mesh(puffGeometry, cloudMaterial);
            puff.position.set(
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 4
            );
            puff.scale.y = 0.6;  // 压扁球体
            cloud.add(puff);
        }
        
        // 随机位置
        cloud.position.set(
            (Math.random() - 0.5) * 80,
            15 + Math.random() * 10,
            (Math.random() - 0.5) * 80
        );
        
        scene.add(cloud);
    }
}
```

### 树木系统

树木是场景的重要装饰，同时也可以作为障碍物。树木由树干和树冠组成。

```javascript
function createTree(position) {
    const tree = new THREE.Group();

    // 树干
    const trunkHeight = 2 + Math.random() * 1.5;
    const trunkRadius = 0.15 + Math.random() * 0.1;
    const trunkGeometry = new THREE.CylinderGeometry(trunkRadius * 0.7, trunkRadius, trunkHeight, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    tree.add(trunk);

    // 树冠（多层圆锥体）
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
    obstacles.push(trunk);  // 树干作为障碍物
}
```

### 草地系统

草地使用半球体模拟，增加场景的细节丰富度。

```javascript
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
```

### 箱子系统

木箱是重要的掩体，提供额外的战术选择。

```javascript
function createBoxes() {
    const boxMaterial = new THREE.MeshLambertMaterial({ color: 0xD2691E });

    const boxPositions = [
        { pos: [-12, tallHeight / 2, -8], size: [1.5, tallHeight, 1.5] },
        { pos: [12, tallHeight / 2, -8], size: [1.5, tallHeight, 1.5] },
        { pos: [-12, tallHeight / 2, 8], size: [1.5, tallHeight, 1.5] },
        { pos: [12, tallHeight / 2, 8], size: [1.5, tallHeight, 1.5] },
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
```

## 保守版 AI 系统

### AI 初始化

保守版 AI 在初始化时设置 `aggressionMode` 为 `conservative`，这决定了 AI 的行为模式。

```javascript
const npcConservative = new NPC(scene, npcConPos, 'conservative');
const aiConservative = new NPCAI(npcConservative, player);
```

### AI 状态机

AI 使用状态机管理行为，主要状态包括：

- **NAVIGATING**：导航状态，AI 正在移动到目标位置
- **SEEKING_COVER**：寻找掩体状态
- **IN_COVER**：在掩体中状态
- **ATTACKING**：攻击状态

```javascript
class NPCAI {
    constructor(npc, target) {
        this.npc = npc;
        this.target = target;
        this.state = 'NAVIGATING';
        this.stateTime = 0;
        
        // 射击相关
        this.shootCooldown = 0;
        this.shootInterval = 1.0;
        
        // 感知范围
        this.detectionRange = 60;
        
        // 掩体相关
        this.covers = [];
        this.currentCover = null;
        
        // 视线检测
        this.canSeeTarget = false;
    }
}
```

### 感知系统

AI 能够检测目标是否在视线范围内。视线检测通过发射射线判断两点之间是否有障碍物阻挡。

```javascript
checkLineOfSight() {
    if (!this.target || this.target.isDead) {
        return false;
    }

    const shotResult = this.npc.checkShotLineOfSight(this.target, false);
    return !shotResult.blocked;
}
```

### 掩体系统

保守版 AI 的核心特性是利用掩体。AI 会自动扫描场景中的障碍物，找出适合作为掩体的物体。

```javascript
initCovers() {
    if (this.npc.obstacles && this.npc.obstacles.length > 0) {
        this.covers = this.npc.obstacles.filter(obj => {
            const box = new THREE.Box3().setFromObject(obj);
            const size = box.getSize(new THREE.Vector3());
            return size.y >= 1.0 && size.y <= 3.0;  // 合适的掩体高度
        });
    }
}
```

### 保守版行为逻辑

保守版 AI 的行为逻辑遵循以下原则：

1. **保持距离**：不会主动接近敌人，而是保持一定的安全距离
2. **寻找掩体**：当敌人靠近时，优先寻找掩体躲避
3. **谨慎攻击**：只在有把握命中或敌人暴露时才会开火
4. **观察等待**：在掩体后耐心等待合适的攻击时机

```javascript
// 保守版 AI 的巡逻行为与激进版不同
// 保守版会：
// 1. 保持更大的距离
// 2. 更多时间停留在掩体中
// 3. 较少主动追击
```

### 目标选择

AI 能够从多个目标中选择最近的一个进行追踪。

```javascript
findNearestTarget() {
    if (!this.npc.players || this.npc.players.length === 0) {
        return null;
    }

    let nearestTarget = null;
    let nearestDist = Infinity;
    const npcPos = this.npc.skeleton.root.position;

    for (const player of this.npc.players) {
        if (player.isDead) continue;

        const dist = npcPos.distanceTo(player.skeleton.root.position);
        if (dist < nearestDist) {
            nearestDist = dist;
            nearestTarget = player;
        }
    }

    return nearestTarget;
}
```

## 音频系统

### 音频管理器

本阶段添加了音频管理器，用于播放背景音乐和音效。

```javascript
class AudioManager {
    constructor() {
        this.context = null;
        this.bgMusic = null;
        this.sounds = {};
    }

    init() {
        // 初始化 Web Audio API
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API 不受支持');
        }
    }

    playBackgroundMusic() {
        // 播放背景音乐
    }

    playSound(name) {
        // 播放音效
    }
}
```

## 角色交互

### 角色间碰撞检测

本阶段添加了角色之间的碰撞检测，防止多个角色占据同一位置。

```javascript
// 添加角色碰撞目标
player.addCharacterCollisionTarget(npcAggressive);
player.addCharacterCollisionTarget(npcConservative);
npcAggressive.addCharacterCollisionTarget(player);
npcAggressive.addCharacterCollisionTarget(npcConservative);
npcConservative.addCharacterCollisionTarget(player);
npcConservative.addCharacterCollisionTarget(npcAggressive);
```

## 场景布局

本阶段的地图布局如下：

```
+------------------------------------------------------------------+
|                                                                  |
|    [墙]    [墙]    [墙]    [墙]         NPC出生区                 |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                         战斗区域                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|    [墙]    [墙]    [墙]    [墙]         玩家出生区                |
|                                                                  |
+------------------------------------------------------------------+
```

- 地图大小：60 x 60
- 玩家出生区：Z = -25 附近
- NPC 出生区：Z = 25 附近
- 玩家和 NPC 区域各有 4 列墙壁作为掩体
- 场地中央分布有树木和箱子

## 阶段总结

本阶段完成了以下功能：

1. **完整地图场景**：包含天空、雾效、阴影、地面、边界墙、装饰墙、树木、草地、木箱

2. **保守版 AI 系统**：实现了基于状态机的 AI 行为，能够感知目标、寻找掩体、进行战斗

3. **音频系统**：添加了音频管理器，为游戏增加音效支持

4. **角色交互**：实现了角色之间的碰撞检测

5. **场景优化**：阴影系统、雾效系统提升了场景的视觉质量

这个阶段的地图场景和 AI 系统为后续的团队对战和配置系统奠定了基础。
