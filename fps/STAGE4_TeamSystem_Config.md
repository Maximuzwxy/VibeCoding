# 第四阶段：团队系统 + 配置

## 概述

本阶段在第三阶段的基础上引入了两个核心功能：团队系统和游戏配置系统。团队系统将游戏角色分为两个对立的阵营——玩家队伍和敌方队伍，每个队伍由玩家（或 AI 控制的 NPC）组成。配置系统允许玩家通过 URL 参数或配置页面自定义游戏设置，包括队伍颜色、NPC 数量、生命值、命中率等参数。

这种设计使得游戏具有高度的可配置性，玩家可以根据自己的喜好调整游戏难度和体验。

## 目录结构

本阶段的代码结构在第三阶段的基础上增加了配置页面：

```
fps6/
├── index.html              # 游戏主页面
├── config.html             # 游戏配置页面
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

## 游戏配置系统

### 配置对象

游戏的所有可配置参数都存储在一个配置对象中：

```javascript
let gameConfig = {
    // 玩家队伍配置
    playerTeamColor: 0x4444ff,    // 队伍颜色（蓝色）
    playerTeamNpcs: 5,            // 玩家队伍 NPC 数量
    
    // 敌方队伍配置
    enemyTeamColor: 0xff4444,     // 队伍颜色（红色）
    enemyTeamNpcs: 5,             // 敌方队伍 NPC 数量
    
    // 生命值配置
    playerHealth: 10,             // 玩家生命值
    npcHealth: 10,               // NPC 生命值
    
    // 命中率配置
    hitRate: {
        closeRange: 0.8,          // 近距离命中率 80%
        midRange: 0.5,            // 中距离命中率 50%
        farRange: 0.2,            // 远距离命中率 20%
        targetMovePenalty: 0.5,    // 目标移动时命中率惩罚 50%
        npcMovePenalty: 0.5       // NPC 移动时命中率惩罚 50%
    }
};
```

### URL 参数解析

游戏支持通过 URL 参数动态配置，这种方式适合分享特定配置的链接。

```javascript
function parseConfig() {
    const params = new URLSearchParams(window.location.search);
    
    // 队伍颜色
    if (params.has('playerColor')) {
        gameConfig.playerTeamColor = parseInt(params.get('playerColor'));
    }
    if (params.has('enemyColor')) {
        gameConfig.enemyTeamColor = parseInt(params.get('enemyColor'));
    }
    
    // NPC 数量
    if (params.has('playerNpcs')) {
        gameConfig.playerTeamNpcs = parseInt(params.get('playerNpcs'));
    }
    if (params.has('enemyNpcs')) {
        gameConfig.enemyTeamNpcs = parseInt(params.get('enemyNpcs'));
    }
    
    // 命中率配置
    if (params.has('closeRange')) {
        gameConfig.hitRate.closeRange = parseInt(params.get('closeRange')) / 100;
    }
    if (params.has('midRange')) {
        gameConfig.hitRate.midRange = parseInt(params.get('midRange')) / 100;
    }
    if (params.has('farRange')) {
        gameConfig.hitRate.farRange = parseInt(params.get('farRange')) / 100;
    }
    if (params.has('targetMove')) {
        gameConfig.hitRate.targetMovePenalty = parseInt(params.get('targetMove')) / 100;
    }
    if (params.has('npcMove')) {
        gameConfig.hitRate.npcMovePenalty = parseInt(params.get('npcMove')) / 100;
    }
    
    // 生命值配置
    if (params.has('playerHealth')) {
        gameConfig.playerHealth = parseInt(params.get('playerHealth'));
    }
    if (params.has('npcHealth')) {
        gameConfig.npcHealth = parseInt(params.get('npcHealth'));
    }
}
```

### URL 参数示例

通过 URL 参数可以自定义游戏的各个方面：

```
// 基本配置
index.html?playerColor=0x00ff00&playerNpcs=3&enemyNpcs=10

// 高难度配置
index.html?playerNpcs=1&enemyNpcs=10&playerHealth=5&npcHealth=20&closeRange=50

// 简单配置
index.html?playerNpcs=10&enemyNpcs=2&playerHealth=20&npcHealth=5&closeRange=100
```

### 配置页面

除了 URL 参数，还提供了图形化的配置页面（config.html），让玩家可以通过界面选择配置。

```html
<!-- 队伍选择 -->
<div class="team-section">
    <div class="team-title player-team">我方队伍</div>
    <div class="option-group">
        <label class="option-label">队伍颜色</label>
        <div class="color-options">
            <button class="color-btn" style="background:#4444ff"></button>
            <button class="color-btn" style="background:#00ff00"></button>
            <button class="color-btn" style="background:#ffff00"></button>
        </div>
    </div>
    <div class="option-group">
        <label class="option-label">NPC 数量</label>
        <div class="number-options">
            <button>1</button><button>3</button><button>5</button><button>10</button>
        </div>
    </div>
</div>
```

配置页面使用现代化的 UI 设计，支持颜色选择器、数量选择器等交互元素，并提供实时预览功能。

## 团队系统

### 队伍创建

游戏初始化时，根据配置创建两个队伍：

```javascript
// 创建玩家
const playerWallIndex = Math.floor(Math.random() * 4);
const playerPos = new THREE.Vector3(
    wallXPositions[playerWallIndex], 
    SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength, 
    -25
);
player = new Player(scene, playerPos, 'player', gameConfig.playerTeamColor);
player.setMaxHealth(gameConfig.playerHealth);

// 创建玩家队伍 NPC
const playerTeamNPCCount = gameConfig.playerTeamNpcs;
for (let i = 0; i < playerTeamNPCCount; i++) {
    const wallIndex = Math.floor(Math.random() * 4);
    const npcPos = new THREE.Vector3(
        wallXPositions[wallIndex],
        SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength,
        -25
    );
    const npc = new NPC(scene, npcPos, 'player', gameConfig.playerTeamColor, i + 1);
    npc.setMaxHealth(gameConfig.npcHealth);
    playerTeamNPCs.push(npc);
}

// 创建敌方队伍 NPC
const enemyTeamNPCCount = gameConfig.enemyTeamNpcs;
for (let i = 0; i < enemyTeamNPCCount; i++) {
    const wallIndex = Math.floor(Math.random() * 4);
    const npcPos = new THREE.Vector3(
        wallXPositions[wallIndex],
        SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength,
        25  // 敌人在地图另一侧
    );
    const npc = new NPC(scene, npcPos, 'enemy', gameConfig.enemyTeamColor, i + 1);
    npc.setMaxHealth(gameConfig.npcHealth);
    enemyTeamNPCs.push(npc);
}

// 所有 NPC
allNPCs = [...playerTeamNPCs, ...enemyTeamNPCs];
```

### 队伍标识

每个角色都有一个队伍标识，用于区分敌我：

```javascript
// Player 构造函数
class Player extends Character {
    constructor(scene, position, team, color) {
        super(scene, position);
        
        this.team = team;           // 'player' 或 'enemy'
        this.color = color;         // 队伍颜色
        
        // 设置角色颜色
        this.setTeamColor(color);
    }
}

// NPC 构造函数
class NPC extends Character {
    constructor(scene, position, team, color, npcId) {
        super(scene, position);
        
        this.team = team;           // 'player' 或 'enemy'
        this.color = color;         // 队伍颜色
        this.npcId = npcId;         // NPC 编号
        
        this.setTeamColor(color);
    }
}
```

### 队伍颜色渲染

角色的骨骼颜色根据队伍进行区分：

```javascript
setTeamColor(color) {
    // 遍历骨骼部位并设置颜色
    // 队伍颜色用于区分敌我
}
```

### AI 敌我识别

AI 能够识别敌方队伍，只攻击敌人而不攻击队友：

```javascript
// 设置 NPC 的攻击目标
allNPCs.forEach(npc => {
    // 每个 NPC 只把敌人设为目标
    npc.players = allCharacters.filter(c => c.team !== npc.team);
});
```

## 生命值系统

### 生命值配置

根据配置设置角色的最大生命值：

```javascript
player.setMaxHealth(gameConfig.playerHealth);
npc.setMaxHealth(gameConfig.npcHealth);
```

### 生命值变更回调

当角色生命值发生变化时，更新 UI 显示：

```javascript
player.onHealthChange = () => updateHealthUI();
allNPCs.forEach(npc => {
    npc.onHealthChange = () => updateHealthUI();
});
```

### 生命值 UI 显示

UI 显示两支队伍的状态：

```javascript
function updateHealthUI() {
    // 玩家生命值
    const playerHealthHTML = createHealthBar(player.health, player.maxHealth);
    
    // 玩家队伍状态
    let playerTeamHTML = '<div style="color:#44ff44;">我方:</div>';
    playerTeamNPCs.forEach(npc => {
        if (npc.isDead) {
            playerTeamHTML += `<div style="color:#888;">NPC ${npc.npcId}: 已阵亡</div>`;
        } else {
            playerTeamHTML += createHealthBar(npc.health, npc.maxHealth, 80);
        }
    });
    
    // 敌方队伍状态
    let enemyTeamHTML = '<div style="color:#ff4444;">敌方:</div>';
    enemyTeamNPCs.forEach(npc => {
        if (npc.isDead) {
            enemyTeamHTML += `<div style="color:#888;">NPC ${npc.npcId}: 已阵亡</div>`;
        } else {
            enemyTeamHTML += createHealthBar(npc.health, npc.maxHealth, 80);
        }
    });
}
```

## 游戏胜利判定

### 胜利条件检测

每帧检查游戏是否结束：

```javascript
function checkGameOver() {
    const playerTeamAlive = (player.isDead ? 0 : 1) + 
        playerTeamNPCs.filter(npc => !npc.isDead).length;
    const enemyTeamAlive = enemyTeamNPCs.filter(npc => !npc.isDead).length;
    
    if (playerTeamAlive === 0 || enemyTeamAlive === 0) {
        if (playerTeamAlive === 0) {
            showGameOver('lose');
        } else {
            showGameOver('win');
        }
    }
}
```

### 游戏结束界面

当游戏结束时，显示结果界面：

```javascript
function showGameOver(result) {
    // 创建遮罩层
    const gameOverUI = document.createElement('div');
    gameOverUI.style.position = 'fixed';
    gameOverUI.style.background = 'rgba(0,0,0,0.7)';
    
    // 显示结果
    const title = document.createElement('div');
    title.textContent = result === 'win' ? '🎉 你赢了!' : '💀 你输了!';
    
    // 重新开始按钮
    const restartBtn = document.createElement('button');
    restartBtn.textContent = '🔄 重新开始';
    restartBtn.onclick = () => location.reload();
    
    // 重新配置按钮
    const configBtn = document.createElement('button');
    configBtn.textContent = '⚙️ 重新配置';
    configBtn.onclick = () => window.location.href = 'config.html';
    
    // 添加到页面
    gameOverUI.append(title, restartBtn, configBtn);
    document.body.appendChild(gameOverUI);
}
```

## FPS 显示

添加了实时 FPS 显示，方便调试和性能监控：

```javascript
let frameCount = 0;
let fpsTime = 0;
let currentFPS = 0;

function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    
    // FPS 计算
    frameCount++;
    fpsTime += deltaTime;
    if (fpsTime >= 1.0) {
        currentFPS = Math.round(frameCount / fpsTime);
        frameCount = 0;
        fpsTime = 0;
        document.getElementById('fps-ui').textContent = `FPS: ${currentFPS}`;
    }
    
    // 游戏逻辑...
}
```

## 场景布局

本阶段的地图布局如下：

```
+------------------------------------------------------------------+
|                                                                  |
|    [墙]    [墙]    [墙]    [墙]         敌方 NPC 出生区          |
|    [NPC1]  [NPC2] [NPC3] [NPC4]        (Z = 25)               |
|                                                                  |
|                                                                  |
|                         战斗区域                                  |
|                                                                  |
|                                                                  |
|    [墙]    [墙]    [墙]    [墙]         玩家队伍出生区            |
|    [玩家]  [NPC1] [NPC2] [NPC3]        (Z = -25)               |
|                                                                  |
+------------------------------------------------------------------+
```

## 阶段总结

本阶段完成了以下功能：

1. **游戏配置系统**：通过 URL 参数或配置页面自定义游戏设置

2. **团队系统**：实现了玩家队伍和敌方队伍的划分

3. **队伍颜色**：每个队伍有独特的颜色便于识别

4. **AI 敌我识别**：AI 只攻击敌方单位，不攻击队友

5. **生命值系统**：可配置的生命值，支持生命值变化回调

6. **游戏胜利判定**：检测队伍存活人数，判断胜负

7. **游戏结束界面**：显示胜负结果，提供重新开始和重新配置选项

8. **FPS 显示**：实时显示游戏帧率

这个阶段的团队系统和配置系统为第五阶段的完整单人版对战奠定了基础。
