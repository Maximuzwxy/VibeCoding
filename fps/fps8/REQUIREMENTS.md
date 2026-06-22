# FPS8 联网功能需求文档

## 一、技术架构

### 1.1 技术栈
- **前端**：Three.js + 原生 JavaScript
- **后端**：Flask + Flask-SocketIO
- **通信协议**：WebSocket
- **同步频率**：60Hz（16ms），局域网环境

### 1.2 架构模式
- **适配器模式**：新增 `MultiPlayerAdapter` 作为联网模式的中间层
- **现有代码最小改动**：Player.js、NPC.js、NPCAI.js、Character.js 保持不动
- **单机/联网切换**：通过 `gameMode` 变量控制

### 1.3 项目结构
```
fps8/
├── index.html                      # 主页（新增）
├── lobby.html                      # 房间大厅（新增）
├── room.html                       # 房间配置（新增）
├── game.html                       # 游戏页面（复用现有index.html）
├── css/
│   └── style.css
├── js/
│   ├── script.js                   # 主入口（小改）
│   ├── network/                    # 新增
│   │   ├── NetworkManager.js       # WebSocket客户端
│   │   ├── MultiPlayerAdapter.js   # 联网适配器
│   │   └── RemotePlayer.js         # 远程玩家渲染
│   ├── core/
│   │   ├── MapGenerator.js         # 地图生成（新增，重构现有代码）
│   │   ├── Character.js            # 不修改
│   │   ├── Player.js               # 不修改
│   │   ├── NPC.js                  # 不修改
│   │   └── NPCAI.js                # 不修改（单机模式用）
│   ├── audio/
│   │   └── AudioManager.js         # 不修改
│   ├── config/
│   │   ├── CharacterConfig.js      # 不修改
│   │   └── SkeletonConfig.js       # 不修改
│   └── skeleton/
│       ├── SkeletonFactory.js      # 不修改
│       └── SkeletonAnimator.js     # 不修改
├── server/                         # 新增
│   ├── app.py                      # Flask主应用
│   ├── game_room.py                # 房间管理
│   ├── game_state.py               # 游戏状态
│   ├── npc_ai.py                   # NPC AI（100%复刻JS端）
│   ├── map_generator.py            # 服务器地图生成
│   └── player.py                   # 服务端玩家数据
├── config.html                     # 单机配置页面（现有）
└── requirements.txt                # Python依赖
```

---

## 二、游戏流程

### 2.1 页面流程
```
┌─────────────────┐
│   主页          │  ← 输入玩家ID，选择模式
│  [单机游戏]     │
│  [联网游戏]     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
单机模式    联网模式
    │         │
    ▼         ▼
┌────────┐  ┌──────────────────┐
│配置页面│  │  房间大厅         │
│(现有)  │  │  [创建房间]       │
│        │  │  [房间列表]       │
└───┬────┘  └────────┬─────────┘
    │                 │
    ▼            ┌────┴────┐
  开始游戏       │         │
            创建房间    加入房间
                │         │
                ▼         ▼
            ┌──────────────────┐
            │   房间配置页面    │
            │  蓝方: [NPC数量]  │
            │       [玩家列表]  │
            │  红方: [NPC数量]  │
            │       [玩家列表]  │
            │  [开始游戏](房主) │
            └────────┬─────────┘
                     │
                     ▼
                  游戏场景
```

### 2.2 主页
```
┌─────────────────────────────┐
│     FPS8 - 选择模式          │
│                              │
│   玩家ID: [__________]       │
│                              │
│   [单机游戏]  [联网游戏]     │
└─────────────────────────────┘
```
- 玩家ID输入框，不存储（localStorage），每次输入
- 点击单机游戏 → 进入现有配置页面（config.html）
- 点击联网游戏 → 进入房间大厅（lobby.html）

### 2.3 房间大厅
```
┌─────────────────────────────────────┐
│         房间大厅                     │
│         玩家: Max                    │
│                                      │
│   [创建房间]                         │
│   [刷新列表]                         │
│                                      │
│   房间列表:                          │
│   ┌─────────────────────────────┐   │
│   │ 房间1 | 房主: xxx | 2/10人  │ [加入] │
│   │ 房间2 | 房主: yyy | 1/10人  │ [加入] │
│   └─────────────────────────────┘   │
│                                      │
│   [返回主页]                         │
└─────────────────────────────────────┘
```
- 房间列表手动刷新，不轮询
- 点击"加入" → 弹出队伍选择

### 2.4 加入房间 - 队伍选择
```
┌─────────────────────────────────────┐
│         加入房间                     │
│         房间: room_001               │
│         房主: player123              │
│                                      │
│   选择加入的队伍:                    │
│                                      │
│   [加入蓝方]        [加入红方]       │
│                                      │
│   蓝方: 2人         红方: 1人        │
│   NPC: 5个          NPC: 5个         │
│                                      │
│   [取消]                             │
└─────────────────────────────────────┘
```

### 2.5 房间配置页面（房主视角）
```
┌─────────────────────────────────────┐
│         房间配置                     │
│         房主: player123              │
│                                      │
│   蓝方:                              │
│   ┌─────────────────────────────┐   │
│   │ NPC数量: [5] [-] [+]        │   │
│   │ 玩家:                        │   │
│   │   - player123 (房主)         │   │
│   │   - player456                │   │
│   └─────────────────────────────┘   │
│                                      │
│   红方:                              │
│   ┌─────────────────────────────┐   │
│   │ NPC数量: [5] [-] [+]        │   │
│   │ 玩家:                        │   │
│   │   - player789                │   │
│   └─────────────────────────────┘   │
│                                      │
│   [开始游戏] (只有房主可见)          │
│   [离开房间]                         │
└─────────────────────────────────────┘
```

### 2.6 房间配置页面（加入者视角）
```
┌─────────────────────────────────────┐
│         等待游戏开始                 │
│         房主: player123              │
│                                      │
│   蓝方:                              │
│   ┌─────────────────────────────┐   │
│   │ NPC数量: 5                   │   │
│   │ 玩家:                        │   │
│   │   - player123 (房主)         │   │
│   │   - player456                │   │
│   └─────────────────────────────┘   │
│                                      │
│   红方:                              │
│   ┌─────────────────────────────┐   │
│   │ NPC数量: 5                   │   │
│   │ 玩家:                        │   │
│   │   - player789                │   │
│   │   - 你                       │   │
│   └─────────────────────────────┘   │
│                                      │
│   [切换队伍]  [离开房间]             │
│   等待房主开始游戏...                │
└─────────────────────────────────────┘
```

### 2.7 游戏结束
```
┌─────────────────────────────┐
│                             │
│      蓝方胜利！              │
│                             │
│        [确定]               │
│                             │
└─────────────────────────────┘
```
- 点击"确定" → 返回房间大厅
- 一方全部阵亡即结束
- 无重生机制

---

## 三、数据同步

### 3.1 同步策略
- **本地玩家**：完全独立渲染（60Hz），不依赖服务器数据
- **远程玩家/NPC**：服务器60Hz广播，客户端直接用最新值渲染
- **事件**：触发时立即发送，客户端立即播放效果
- **不做插值**：局域网延迟低，直接用最新值

### 3.2 客户端 → 服务器

#### 玩家状态（60Hz）
```javascript
{
    type: 'player_state',
    playerId: 'xxx',
    position: { x: 10, y: 0, z: 5 },
    yaw: 1.57,
    pitch: -0.3,
    health: 8,
    isMoving: true,
    isCrouching: false,
    isJumping: false
}
```

#### 射击事件（触发时）
```javascript
{
    type: 'shoot',
    playerId: 'xxx',
    targetId: 'npc_3',  // 或 'player_yyy'
    damage: 1
}
```

#### 手榴弹事件（触发时）
```javascript
{
    type: 'grenade_explode',
    playerId: 'xxx',
    position: { x: 10, y: 0, z: 5 },
    hits: [
        { targetId: 'npc_1', damage: 2 },
        { targetId: 'player_2', damage: 1 }
    ]
}
```

#### 语音事件（触发时）
```javascript
{
    type: 'voice',
    playerId: 'xxx',
    message: 'fire_in_the_hole'
}
```

### 3.3 服务器 → 客户端

#### 游戏状态（60Hz）
```javascript
{
    type: 'game_update',
    // 其他玩家（不含自己）
    players: {
        'player_yyy': {
            position: { x: 20, y: 0, z: 10 },
            yaw: 0.5,
            pitch: -0.2,
            health: 10,
            isMoving: true,
            isCrouching: false
        }
    },
    
    // NPC（服务器AI计算结果）
    npcs: [
        {
            id: 1,
            team: 'blue',
            position: { x: 15, y: 0, z: 8 },
            yaw: 1.2,
            health: 10,
            isDead: false,
            isMoving: true,
            isCrouching: false
        }
    ],
    
    // 事件
    events: [
        {
            type: 'hit',
            shooterId: 'player_yyy',
            targetId: 'npc_3',
            damage: 1,
            newHealth: 9
        },
        {
            type: 'death',
            playerId: 'npc_3',
            killerId: 'player_yyy'
        }
    ]
}
```

#### 游戏开始（触发时）
```javascript
{
    type: 'game_start',
    mapData: {
        obstacles: [
            { type: 'wall', position: {x,y,z}, size: {x,y,z} },
            { type: 'box', position: {x,y,z}, size: {x,y,z} }
        ]
    },
    myPlayerId: 'xxx',
    myName: 'Max',
    myTeam: 'blue',
    spawnPosition: { x: -10, y: 0, z: -44 },
    allPlayers: [
        { id: 'xxx', name: 'Max', team: 'blue', spawnPos: {...} },
        { id: 'yyy', name: 'Tom', team: 'red', spawnPos: {...} }
    ],
    blueNPCCount: 5,
    redNPCCount: 5
}
```

#### 游戏结束（触发时）
```javascript
{
    type: 'game_over',
    winner: 'blue'  // 或 'red'
}
```

---

## 四、判定逻辑

### 4.1 射击判定

| 场景 | 判定方 | 扣血方 | 说明 |
|------|--------|--------|------|
| 玩家射击 NPC | 客户端 | 服务器 | 客户端射线检测命中，发送结果给服务器，服务器扣血后广播 |
| 玩家射击玩家 | 客户端 | 服务器 | 客户端射线检测命中，发送结果给服务器，服务器扣血后广播 |
| NPC射击玩家 | 服务器 | 服务器 | 服务器射线检测，广播结果 |
| NPC射击NPC | 服务器 | 服务器 | 服务器射线检测，广播结果 |

**核心原则**：
- 玩家攻击：客户端判定命中（Three.js射线检测，有障碍物检测）
- NPC攻击：服务器判定（统一计算，避免各客户端不一致）
- **血量权威**：服务器是唯一血量权威来源
  - 客户端射击后**不立即扣血**，只发送命中消息给服务器
  - 服务器收到后扣血，通过 `game_update` 广播最新血量
  - 客户端**只根据服务器广播的血量渲染**，不依赖本地计算结果
  - 避免"客户端先扣血、服务端再扣血"导致的数据不同步问题

### 4.2 手榴弹判定

| 场景 | 判定方 | 扣血方 | 说明 |
|------|--------|--------|------|
| 玩家投掷 | 客户端 | 客户端→服务器 | 客户端爆炸范围检测，通知服务器 |
| NPC投掷 | 服务器 | 服务器 | 服务器爆炸范围检测，广播结果 |

**杀伤逻辑**（与JS端完全一致）：
```
innerRadius = 1米   → 伤害 2
outerRadius = 2.5米 → 伤害 1

判定条件：
- 检查角色是否在爆炸范围内
- 射线检测：爆炸中心到角色之间是否有障碍物
- 无障碍物 → 扣血
```

### 4.3 游戏结束判定
- 一方全部阵亡 → 游戏结束
- 显示"蓝方胜利"或"红方胜利"
- 无重生机制

---

## 五、NPC AI

### 5.1 要求
- **100%复刻JS端NPCAI.js的功能**
- 完全在服务器端计算
- 服务器广播NPC状态给客户端

### 5.2 状态机（5个状态）
```
NAVIGATING → 寻找掩体，向目标靠近
IN_COVER_CROUCH → 蹲在掩体后
IN_COVER_MOVING → 沿掩体边缘移动射击
ENGAGING → 近距离交战，绕圈射击
RETREATING → 距离太近，后退
```

### 5.3 移动方法
- `chaseTowards()` - 追击目标
- `strafeAround()` - 绕目标侧移
- `avoidObstacle()` - 避障（射线检测前方障碍）
- `slideAlongObstacle()` - 卡住时沿障碍滑动
- `retreatFrom()` - 后退

### 5.4 掩体系统
- `findBestCover()` - 找最佳掩体（在目标和NPC之间）
- `calculateCoverPosition()` - 计算掩体后方位置

### 5.5 命中率计算
```javascript
// 与JS端一致
if (distance < 10) baseHitRate = closeRange;
else if (distance < 25) baseHitRate = midRange;
else baseHitRate = farRange;

if (target.isMoving) finalHitRate *= targetMovePenalty;
if (npc.isMoving) finalHitRate *= npcMovePenalty;
```

---

## 六、地图系统

### 6.1 地图抽象
- 抽离现有 `script.js` 中的地图生成代码到 `MapGenerator.js`
- 服务器端同步实现 `map_generator.py`
- 单机/联网模式共用同一套地图配置

### 6.2 地图数据结构
```javascript
{
    obstacles: [
        { type: 'wall', position: {x,y,z}, size: {x,y,z} },
        { type: 'box', position: {x,y,z}, size: {x,y,z} },
        { type: 'tree', position: {x,y,z}, size: {x,y,z} }
    ],
    ground: { size: 100 },
    boundaryWalls: [...],
    clouds: [...],
    trees: [...],
    grass: [...],
    boxes: [...]
}
```

### 6.3 地图生成流程
```
1. 服务器生成地图数据（按单机版配置）
2. 游戏开始时广播给所有客户端
3. 客户端根据数据渲染地图
4. 服务器保存障碍物包围盒用于NPC射线检测
```

---

## 七、房间系统

### 7.1 房间数据结构
```python
{
    'room_id': 'room_001',
    'host_id': 'player123',
    'blue_team': {
        'npc_count': 5,
        'players': ['player123', 'player456']
    },
    'red_team': {
        'npc_count': 5,
        'players': ['player789']
    },
    'status': 'waiting',  # waiting, playing, finished
    'config': {
        'blue_color': 0x4444ff,
        'red_color': 0xff4444,
        'player_health': 10,
        'npc_health': 10
    }
}
```

### 7.2 房间规则
- 房主创建房间，设置NPC数量
- 玩家加入时自选队伍（蓝方/红方）
- 玩家可以切换队伍
- 房主有权开始游戏
- 房主断线/退出 → 房间自动解散
- 无玩家数量上限（实际情况不会太多）

### 7.3 房间消息
```javascript
// 创建房间
{ type: 'create_room', hostName: 'Max' }

// 加入房间
{ type: 'join_room', roomId: 'room_001', team: 'blue' }

// 切换队伍
{ type: 'switch_team', roomId: 'room_001', team: 'red' }

// 更新NPC数量（仅房主）
{ type: 'update_npc_count', roomId: 'room_001', team: 'blue', count: 5 }

// 开始游戏（仅房主）
{ type: 'start_game', roomId: 'room_001' }

// 离开房间
{ type: 'leave_room', roomId: 'room_001' }
```

---

## 八、断线处理

### 8.1 重连机制
- 断线后尝试重连3次
- 每次间隔3秒
- 重连失败 → 玩家定在原地不动
- 不需要NPC替代

### 8.2 房主断线
- 房主断线 → 房间自动解散
- 所有玩家返回大厅

### 8.3 玩家断线
- 玩家断线期间，其他玩家继续游戏
- 断线玩家不重连 → 视为退出

---

## 九、音效系统

### 9.1 音效处理
- **枪声/脚步声**：在Character基类中，客户端直接调用就发声
- **语音（Fire in the hole）**：
  - 玩家投掷手榴弹时触发
  - 发送事件到服务器
  - 服务器广播给所有客户端
  - 客户端收到事件后播放语音

### 9.2 语音事件
```javascript
{
    type: 'voice',
    playerId: 'xxx',
    message: 'fire_in_the_hole'
}
```

---

## 十、玩家显示

### 10.1 玩家ID
- 主页输入玩家ID
- 游戏中头顶显示玩家ID（替代原来的"Player"）
- 不存储，每次输入

### 10.2 显示内容
```javascript
// 单机版
this.label = this.createLabel('Player', '#44ff44');

// 联网模式
this.label = this.createLabel(playerName, '#44ff44');
```

### 10.3 视角
- 固定第一人称
- 不实现第三人称切换

---

## 十一、其他功能

### 11.1 不实现的功能
- ❌ 聊天功能
- ❌ 第三人称视角
- ❌ 玩家重生
- ❌ 房间列表自动刷新
- ❌ 玩家ID存储

### 11.2 配置项
- 蓝方/红方NPC数量（房主设置）
- 玩家血量（默认10）
- NPC血量（默认10）
- 命中率配置（可选，后续扩展）

---

## 十二、实现顺序

1. **重构地图代码**：抽离到 `MapGenerator.js`
2. **搭建Flask服务器**：基础框架 + WebSocket
3. **实现房间系统**：创建、加入、开始
4. **实现网络同步**：NetworkManager + MultiPlayerAdapter
5. **复刻NPC AI**：Python端100%复刻JS端
6. **实现前端页面**：主页、大厅、房间
7. **联调测试**：完整流程测试

---

## 十三、技术要点

### 13.1 流畅度保证
- 本地玩家：60Hz完全流畅（不依赖网络）
- 远程玩家/NPC：60Hz数据 + 直接渲染 = 视觉60Hz
- 事件：立即播放，不插值

### 13.2 带宽估算
```
每帧数据（60Hz）：
- 玩家状态：~100字节
- 10个NPC：~500字节
- 事件：~100字节
// 总计 ~700字节/帧 = 42KB/s

上行：~100字节/帧 = 6KB/s
下行：~700字节/帧 = 42KB/s
```

### 13.3 服务器负载
- CPU：60次AI计算/秒 × NPC数量
- 网络：~50KB/s
- 局域网环境完全无压力

---

## 十四、依赖

### 14.1 Python依赖
```txt
Flask==3.0.0
Flask-SocketIO==5.3.6
python-socketio==5.10.0
eventlet==0.35.1
```

### 14.2 前端依赖
- Three.js r128（现有）
- Socket.IO Client（新增）

---

*文档版本：v1.0*
*最后更新：2026-05-04*
