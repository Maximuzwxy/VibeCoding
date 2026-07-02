# 第五阶段：完整单人版对战

## 概述

本阶段是单人游戏模式的最终完善版本，在第四阶段的基础上进行了多项优化和改进。最大的变化是将地图尺寸扩大，为玩家提供更广阔的战斗空间。同时完善了血量显示 UI，增加了手榴弹显示，并优化了游戏结束判定逻辑。

本阶段代表了单人 FPS 游戏的完整形态，包含完整的战斗系统、AI 对战、团队协作（与 NPC 队友）、生命值管理、手榴弹道具等功能。

## 目录结构

```
fps7/
├── index.html              # 游戏主页面
├── config.html            # 游戏配置页面
├── js/
│   ├── audio/
│   │   └── AudioManager.js
│   ├── config/
│   │   ├── CharacterConfig.js
│   │   └── SkeletonConfig.js
│   ├── skeleton/
│   │   ├── SkeletonAnimator.js
│   │   └── SkeletonFactory.js
│   ├── core/
│   │   ├── Character.js
│   │   ├── NPC.js
│   │   ├── NPCAI.js
│   │   └── Player.js
│   └── script.js
├── css/
│   └── style.css
```

## 地图扩展

### 更大的活动区域

本阶段将地图尺寸从 60 扩大到 100，为战斗提供更广阔的空间。

```javascript
// 第四阶段
const ARENA_SIZE = 60;

// 第五阶段
const ARENA_SIZE = 100;
```

地图尺寸的扩大带来了以下变化：

1. **更远的战斗距离**：玩家和 NPC 可以在更远的距离上进行交火
2. **更多的战术空间**：玩家可以利用更大的地形进行游击战
3. **更丰富的资源分布**：可以在更大的区域内分布树木、箱子等装饰物
4. **更长的转移时间**：从一端到另一端需要更长的时间

### 边界墙更新

边界墙随地图尺寸同步扩展：

```javascript
function createBoundaryWalls() {
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    const halfSize = ARENA_SIZE / 2;  // 50

    const walls = [
        // 东西边界
        { size: [ARENA_SIZE, WALL_HEIGHT, WALL_THICKNESS], pos: [0, WALL_HEIGHT / 2, -halfSize] },
        { size: [ARENA_SIZE, WALL_HEIGHT, WALL_THICKNESS], pos: [0, WALL_HEIGHT / 2, halfSize] },
        // 南北边界
        { size: [WALL_THICKNESS, WALL_HEIGHT, ARENA_SIZE], pos: [-halfSize, WALL_HEIGHT / 2, 0] },
        { size: [WALL_THICKNESS, WALL_HEIGHT, ARENA_SIZE], pos: [halfSize, WALL_HEIGHT / 2, 0] }
    ];
}
```

### 地面更新

地面网格也随地图扩展：

```javascript
function createGround() {
    const groundGeometry = new THREE.PlaneGeometry(ARENA_SIZE, ARENA_SIZE);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 网格辅助线
    const gridHelper = new THREE.GridHelper(ARENA_SIZE, 50, 0x3d8b40, 0x3d8b40);
    gridHelper.position.y = 0.01;
    gridHelper.material.opacity = 0.15;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);
}
```

### 场景布局扩展

```
+--------------------------------------------------------------------------------------------------------+
|                                                                                                        |
|    [墙]      [墙]      [墙]      [墙]           敌方 NPC 出生区 (Z = 50)                              |
|    [NPC1]   [NPC2]    [NPC3]   [NPC4]                                                                     |
|                                                                                                        |
|                                                                                                        |
|                                                                                                        |
|                                                                                                        |
|                                         战斗区域 (100 x 100)                                           |
|                                                                                                        |
|                                                                                                        |
|                                                                                                        |
|    [墙]      [墙]      [墙]      [墙]           玩家队伍出生区 (Z = -50)                                |
|    [玩家]   [NPC1]    [NPC2]    [NPC3]                                                                     |
|                                                                                                        |
+--------------------------------------------------------------------------------------------------------+
```

## 血量显示系统优化

### 玩家血量显示

玩家血量显示增加了生命值数字和手榴弹数量：

```javascript
function updateHealthUI() {
    function createHealthBar(health, maxHealth, width = 100) {
        const ratio = health / maxHealth;
        const color = getHealthColor(health, maxHealth);
        return `<div style="display:inline-block;width:${width}px;height:16px;background:#333;
            border:2px solid #888;border-radius:3px;vertical-align:middle;position:relative;
            box-sizing:border-box;">
            <div style="width:${Math.round(ratio * 100)}%;height:100%;background:${color};
                border-radius:1px;box-sizing:border-box;"></div>
        </div>`;
    }

    function createGrenadeIcon(count) {
        // 使用 Canvas 绘制手榴弹图标
        const canvas = document.createElement('canvas');
        canvas.width = 20;
        canvas.height = 20;
        const ctx = canvas.getContext('2d');
        
        // 绘制手榴弹主体
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(10, 12, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制手榴弹顶部
        ctx.fillStyle = '#333';
        ctx.fillRect(8, 4, 4, 4);
        
        // 绘制引信
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(10, 4, 3, Math.PI, 0);
        ctx.stroke();
        
        const dataURL = canvas.toDataURL();
        return `<img src="${dataURL}" style="width:20px;height:20px;vertical-align:middle;" />`;
    }

    // 玩家状态显示
    const playerHealthHTML = player.isDead 
        ? `<div style="color:#ff4444;font-size:14px;">玩家: 已阵亡</div>`
        : `<div style="display:flex;align-items:center;gap:8px;font-family:Arial;color:white;">
            <span>玩家</span>
            ${createHealthBar(player.health, player.maxHealth)}
            <span>${player.health}/${player.maxHealth}</span>
            ${createGrenadeIcon(player.grenadeCount)}
            <span>x${player.grenadeCount}</span>
        </div>`;
}
```

### 血量颜色渐变

血量条的颜色会根据当前生命值占最大生命值的比例发生变化，从绿色（满血）渐变到红色（低血量）：

```javascript
function getHealthColor(health, maxHealth) {
    const ratio = health / maxHealth;
    const r = Math.round(255 * (1 - ratio));
    const g = Math.round(255 * ratio);
    return `rgb(${r}, ${g}, 0)`;
}
```

这种设计让玩家能够直观地了解自己的生命状态：
- 100% 生命：纯绿色 `rgb(0, 255, 0)`
- 50% 生命：黄色 `rgb(127, 127, 0)`
- 0% 生命：纯红色 `rgb(255, 0, 0)`

### 队伍状态显示

UI 同时显示两支队伍的状态：

```javascript
// 玩家队伍状态（左下角）
let playerTeamHTML = '<div style="color:#44ff44;">我方:</div>';
playerTeamNPCs.forEach(npc => {
    if (npc.isDead) {
        playerTeamHTML += `<div style="color:#888;">NPC ${npc.npcId}: 已阵亡</div>`;
    } else {
        playerTeamHTML += `<div style="display:flex;align-items:center;gap:6px;">
            <span>NPC ${npc.npcId}</span>
            ${createHealthBar(npc.health, npc.maxHealth, 80)}
        </div>`;
    }
});

// 敌方队伍状态（右下角）
let enemyTeamHTML = '<div style="color:#ff4444;">敌方:</div>';
enemyTeamNPCs.forEach(npc => {
    if (npc.isDead) {
        enemyTeamHTML += `<div style="color:#888;">NPC ${npc.npcId}: 已阵亡</div>`;
    } else {
        enemyTeamHTML += `<div style="display:flex;align-items:center;gap:6px;justify-content:flex-end;">
            ${createHealthBar(npc.health, npc.maxHealth, 80)}
            <span>NPC ${npc.npcId}</span>
        </div>`;
    }
});
```

## 游戏机制完善

### 手榴弹系统

玩家和 NPC 都配备了手榴弹，增加了战斗的多样性：

```javascript
class Player extends Character {
    constructor(scene, position) {
        super(scene, position);
        
        this.grenadeCount = 3;  // 初始手榴弹数量
        this.grenadeCooldown = 0;
    }

    throwGrenade() {
        if (this.grenadeCount > 0 && this.grenadeCooldown <= 0) {
            // 投掷手榴弹逻辑
            this.grenadeCount--;
            this.grenadeCooldown = 5;  // 冷却时间
        }
    }

    update(deltaTime) {
        // 更新手榴弹冷却
        if (this.grenadeCooldown > 0) {
            this.grenadeCooldown -= deltaTime;
        }
    }
}
```

### 游戏流程

游戏的完整流程如下：

```javascript
function init() {
    // 1. 解析配置
    parseConfig();

    // 2. 创建场景
    createScene();

    // 3. 创建角色
    createPlayer();
    createPlayerTeamNPCs();
    createEnemyTeamNPCs();

    // 4. 设置碰撞检测
    setupCollisions();

    // 5. 初始化音频
    audioManager.init();

    // 6. 设置射击
    setupShooting();

    // 7. 初始化 UI
    updateHealthUI();

    // 8. 开始游戏循环
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    
    // 更新所有角色
    player.update(deltaTime);
    npcAIs.forEach(ai => ai.update(deltaTime));
    
    // 检查游戏结束
    checkGameOver();
    
    // 渲染
    renderer.render(scene, camera);
}
```

### 战斗策略

在更大的地图上，玩家可以采用多种战术：

1. **游击战**：利用地图的广阔空间，与敌人保持距离，边打边撤
2. **掩体战**：利用树木、箱子、墙壁作为掩体，逐步推进
3. **集中优势兵力**：与 NPC 队友配合，形成局部人数优势
4. **狙击**：利用远距离射程优势，在远处消耗敌人

## 视觉与音效

### 阴影优化

阴影设置保持高配置：

```javascript
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(15, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
```

### 雾效优化

雾效范围随地图扩展：

```javascript
scene.fog = new THREE.Fog(0x87CEEB, 30, 80);
```

## 阶段总结

本阶段完成了以下功能：

1. **地图扩展**：地图尺寸从 60 扩大到 100，提供更广阔的战斗空间

2. **血量显示优化**：增加了生命值数字显示和血量颜色渐变

3. **手榴弹显示**：UI 显示手榴弹图标和数量

4. **队伍状态显示**：完善了两支队伍的状态显示

5. **游戏平衡调整**：更大的地图需要调整 AI 行为参数

6. **视觉一致性**：阴影和雾效范围随地图同步扩展

这个阶段代表了单人 FPS 游戏的完整形态，包含了所有核心游戏机制。玩家可以在这个版本中体验到完整的 FPS 战斗乐趣。

## 后续方向

虽然本阶段是单人游戏的最终版本，但仍有一些可以扩展的方向：

1. **联机对战**：添加多人在线支持（对应 FPS8）
2. **更多武器**：添加霰弹枪、狙击枪等不同类型武器
3. **关卡系统**：设计多个不同的地图和关卡
4. **成就系统**：添加游戏成就和统计
5. **装备系统**：允许玩家拾取和使用不同装备

这些扩展方向为未来的开发提供了丰富的可能性。
