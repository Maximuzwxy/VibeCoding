# 第二阶段：NPC + Player + 第一人称视角

## 概述

本阶段在第一阶段骨骼系统的基础上，引入了 NPC 和 Player 两个角色类，并实现了第一人称视角的控制机制。第一人称视角是 FPS 游戏的标志性特征，玩家的视角直接绑定在角色头部，能够获得沉浸式的游戏体验。

本阶段的另一个核心功能是碰撞检测系统。角色在场景中移动时，需要与障碍物进行碰撞检测，避免穿墙或穿过其他物体。碰撞检测采用轴对齐包围盒（AABB）算法，能够准确判断角色与长方体障碍物之间的碰撞关系。

## 目录结构

本阶段采用了模块化的目录结构，将配置、动画器和核心类分别放置在不同的目录中，便于代码管理和维护：

```
fps4/
├── index.html              # 入口 HTML 文件
├── js/
│   ├── config/
│   │   ├── CharacterConfig.js    # 角色配置参数
│   │   └── SkeletonConfig.js     # 骨骼配置参数
│   ├── skeleton/
│   │   ├── SkeletonAnimator.js   # 骨骼动画器
│   │   └── SkeletonFactory.js    # 骨骼工厂
│   ├── core/
│   │   ├── Character.js          # 角色基类
│   │   ├── NPC.js               # NPC 角色类
│   │   └── Player.js            # 玩家角色类
│   └── script.js                # 主程序入口
├── css/
│   └── style.css                # 样式文件
```

这种模块化设计的优势在于：当需要修改某个模块的功能时，只需修改对应的文件，不会影响到其他模块。同时，配置参数单独存放，使得调整游戏平衡性变得更加方便。

## 角色基类扩展

### 障碍物系统

在第一阶段的 Character 类基础上，本阶段添加了障碍物管理功能。每个角色都可以添加多个障碍物对象，这些障碍物将参与碰撞检测。

```javascript
class Character {
    constructor(scene, position) {
        this.scene = scene;
        this.skeleton = SkeletonFactory.create(scene, position);
        
        this.isJumping = false;
        this.jumpTime = 0;
        this.jumpHeight = 0;
        this.isCrouching = false;
        
        // 障碍物列表
        this.obstacles = [];
        
        // 碰撞半径
        this.collisionRadius = 0.3;
        
        this.collisionCylinder = this.createCollisionCylinder();
        this.skeleton.root.add(this.collisionCylinder);
    }
    
    // 添加障碍物
    addObstacle(mesh) {
        this.obstacles.push(mesh);
    }
}
```

### 碰撞检测算法

碰撞检测采用 AABB（轴对齐包围盒）算法。对于每个障碍物，系统会计算其包围盒，然后检测角色的中心点是否会进入障碍物的膨胀包围盒（原始包围盒向外扩展角色半径的距离）。

```javascript
resolveCollision(moveVector) {
    const pos = this.skeleton.root.position;
    let result = moveVector.clone();
    
    for (const obstacle of this.obstacles) {
        // 获取障碍物的包围盒
        const box = new THREE.Box3().setFromObject(obstacle);
        
        // 扩展包围盒（考虑角色半径）
        const minX = box.min.x - this.collisionRadius;
        const maxX = box.max.x + this.collisionRadius;
        const minZ = box.min.z - this.collisionRadius;
        const maxZ = box.max.z + this.collisionRadius;
        
        // 计算移动后的新位置
        const newPos = new THREE.Vector3(
            pos.x + result.x,
            pos.y,
            pos.z + result.z
        );
        
        // 检测新位置是否在障碍物范围内
        const inXRange = newPos.x >= minX && newPos.x <= maxX;
        const inZRange = newPos.z >= minZ && newPos.z <= maxZ;
        
        // 如果发生碰撞，分别测试 X 和 Z 方向的移动
        if (inXRange && inZRange) {
            const prevX = pos.x;
            const prevZ = pos.z;
            
            // 测试仅 X 方向移动
            const testX = new THREE.Vector3(prevX + result.x, pos.y, prevZ);
            const inXRangeX = testX.x >= minX && testX.x <= maxX;
            const inZRangeX = testX.z >= minZ && testX.z <= maxZ;
            
            // 测试仅 Z 方向移动
            const testZ = new THREE.Vector3(prevX, pos.y, prevZ + result.z);
            const inXRangeZ = testZ.x >= minX && testZ.x <= maxX;
            const inZRangeZ = testZ.z >= minZ && testZ.z <= maxZ;
            
            // 根据测试结果决定保留哪个方向的移动
            if (inXRangeX && inZRangeX && !(inXRangeZ && inZRangeZ)) {
                result.x = 0;  // 保留 X 移动，清除 Z 移动
            } else if (!(inXRangeX && inXRangeX) && inXRangeZ && inZRangeZ) {
                result.z = 0;  // 保留 Z 移动，清除 X 移动
            } else {
                result.x = 0;  // 两者都发生碰撞，全部清除
                result.z = 0;
            }
        }
    }
    
    return result;
}
```

这种碰撞处理方式的优势在于：即使在角落位置，角色仍然可以沿着墙壁滑动。例如，当角色向右移动撞到墙角时，虽然 X 方向被阻挡，但 Z 方向可能仍然可以移动，这种设计大大提升了移动的流畅性。

## NPC 角色类

NPC 类继承自 Character 基类，用于表示游戏中的非玩家角色。在本阶段，NPC 实现了简单的自动巡逻行为。

```javascript
class NPC extends Character {
    constructor(scene, position) {
        super(scene, position);
        
        // 巡逻状态
        this.testState = {
            phaseIndex: 0,
            phaseTime: 0
        };
    }

    update(deltaTime) {
        // 各个巡逻阶段
        const phase = testPhases[this.testState.phaseIndex];
        
        this.testState.phaseTime += deltaTime;
        this.animTime += deltaTime * CHARACTER_CONFIG.animSpeed;
        
        // 处理跳跃
        if (phase.isJumping) {
            this.isJumping = true;
            this.updateJump(deltaTime, phase.duration);
        }
        
        // 阶段切换
        if (this.testState.phaseTime >= phase.duration) {
            this.testState.phaseTime = 0;
            this.jumpTime = 0;
            this.isJumping = false;
            this.jumpHeight = 0;
            this.testState.phaseIndex = (this.testState.phaseIndex + 1) % testPhases.length;
        }
        
        // 应用移动
        this.skeleton.root.position.x += phase.moveDir.x * CHARACTER_CONFIG.moveSpeed * deltaTime;
        this.skeleton.root.position.z += phase.moveDir.z * CHARACTER_CONFIG.moveSpeed * deltaTime;
        
        // 应用姿态
        if (phase.isJumping) {
            this.applyJumpPose();
        } else if (phase.isCrouching) {
            this.isCrouching = true;
            this.setCrouchPose();
        } else if (phase.isRunning) {
            this.isCrouching = false;
            this.setRunningPose(this.animTime);
        } else {
            this.isCrouching = false;
            this.setStandPose();
        }
        
        this.updateCollisionCylinder();
        this.updateGunPose(this.animTime);
    }
}
```

NPC 的巡逻行为通过预先定义的动作阶段来实现，包括前进、后退、站立、蹲下、跳跃、左前移动、右后移动等多种状态。每个状态持续一定时间后自动切换到下一个状态，形成循环。

## 玩家角色类

Player 类继承自 Character 基类，是本阶段的核心类。玩家通过键盘和鼠标控制角色移动和视角，实现第一人称和第三人称视角的切换。

### 视角系统

第一人称视角的实现原理是将相机绑定到角色头部的位置。相机的位置随角色移动而移动，视角方向通过鼠标控制。

```javascript
class Player extends Character {
    constructor(scene, position) {
        super(scene, position);
        
        // 视角角度
        this.yaw = Math.PI;      // 水平旋转（左右）
        this.pitch = 0;         // 垂直旋转（上下）
        
        // 视角模式
        this.isThirdPerson = false;
        
        // 头部高度
        this.headHeight = SKELETON_CONFIG.torsoLength + SKELETON_CONFIG.headRadius * 2 - 0.1;
        this.crouchHeadHeight = SKELETON_CONFIG.torsoLength + SKELETON_CONFIG.headRadius * 2 - 0.1;
        
        // 键盘状态
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false
        };
        
        // 相机枢轴
        this.cameraPivot = new THREE.Object3D();
        scene.add(this.cameraPivot);
        
        this.skeleton.root.rotation.y = Math.PI;
        
        this.setupControls();
    }
}
```

### 鼠标控制

鼠标控制使用 Pointer Lock API，当玩家点击画面时，鼠标指针会被锁定并隐藏，此时鼠标移动将完全用于控制视角。

```javascript
setupControls() {
    // 鼠标指针锁定
    document.addEventListener('click', () => {
        document.body.requestPointerLock();
    });
    
    // 鼠标移动控制视角
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === document.body) {
            // 水平旋转
            this.yaw -= e.movementX * 0.002;
            // 垂直旋转（限制角度范围）
            this.pitch -= e.movementY * 0.002;
            this.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.pitch));
        }
    });
}
```

`movementX` 和 `movementY` 是浏览器原生提供的鼠标增量值，表示自上次事件以来鼠标在 X 和 Y 方向的移动量。乘以 0.002 是为了调整灵敏度，使其不会过于灵敏或迟钝。

### 键盘控制移动

玩家使用 WASD 键控制角色移动。W 向前、S 向后、A 向左、D 向右。移动方向基于当前的视角角度计算，确保前进方向始终是玩家看向的方向。

```javascript
update(deltaTime) {
    this.animTime += deltaTime * CHARACTER_CONFIG.animSpeed;
    
    this.updateJump(deltaTime);
    
    // 姿态更新
    if (!this.isCrouching && !this.isJumping) {
        this.setStandPose();
    } else if (this.isCrouching) {
        this.setCrouchPose();
    }
    
    this.applyJumpPose();
    this.updateCollisionCylinder();
    
    // 计算前进方向（基于当前朝向）
    const forward = new THREE.Vector3(
        -Math.sin(this.yaw),
        0,
        -Math.cos(this.yaw)
    ).normalize();
    
    // 计算右方向
    const right = new THREE.Vector3()
        .crossVectors(forward, new THREE.Vector3(0, 1, 0))
        .normalize();
    
    // 计算移动向量
    const moveVector = new THREE.Vector3(0, 0, 0);
    
    if (this.keys.w) moveVector.add(forward);
    if (this.keys.s) moveVector.sub(forward);
    if (this.keys.a) moveVector.sub(right);
    if (this.keys.d) moveVector.add(right);
    
    // 应用移动
    if (!this.isCrouching && moveVector.length() > 0) {
        moveVector.normalize()
            .multiplyScalar(CHARACTER_CONFIG.moveSpeed * deltaTime);
        
        // 碰撞检测
        const resolvedMove = this.resolveCollision(moveVector);
        
        this.skeleton.root.position.x += resolvedMove.x;
        this.skeleton.root.position.z += resolvedMove.z;
        
        // 奔跑姿态
        this.setRunningPose(this.animTime);
    }
    
    // 更新角色朝向
    this.skeleton.root.rotation.y = this.yaw + Math.PI;
    
    // 更新相机位置
    const headY = this.isCrouching ? this.crouchHeadHeight : this.headHeight;
    const rootY = this.skeleton.root.position.y;
    
    if (this.isThirdPerson) {
        // 第三人称视角
        this.updateThirdPersonCamera(rootY, headY);
    } else {
        // 第一人称视角
        this.updateFirstPersonCamera(rootY, headY);
    }
}
```

### 第一人称视角实现

第一人称视角的相机绑定在角色头部位置，相机的旋转由 `cameraPivot` 对象控制。

```javascript
updateFirstPersonCamera(rootY, headY) {
    // 将相机放置在头部位置
    this.cameraPivot.position.set(
        this.skeleton.root.position.x,
        rootY + headY,
        this.skeleton.root.position.z
    );
    
    // 重置枢轴旋转
    this.cameraPivot.rotation.set(0, 0, 0);
    
    // 应用视角旋转
    this.cameraPivot.rotation.x = this.pitch;
    this.cameraPivot.rotation.y = this.yaw;
    
    // 将场景相机作为枢轴的子对象
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
    this.cameraPivot.add(camera);
}
```

### 第三人称视角实现

第三人称视角的相机位于角色后方一定距离处，看向角色背部。

```javascript
updateThirdPersonCamera(rootY, headY) {
    const behindDistance = 3;   // 相机距离角色的距离
    const heightOffset = 2;      // 相机高度偏移
    
    // 计算相机在角色后方的位置
    const forward = new THREE.Vector3(
        Math.sin(this.yaw + Math.PI),
        0,
        Math.cos(this.yaw + Math.PI)
    ).normalize();
    
    camera.position.set(
        this.skeleton.root.position.x - forward.x * behindDistance,
        rootY + heightOffset,
        this.skeleton.root.position.z - forward.z * behindDistance
    );
    
    // 相机看向角色前方
    const lookTarget = new THREE.Vector3(
        this.skeleton.root.position.x + forward.x * 5,
        rootY + headY,
        this.skeleton.root.position.z + forward.z * 5
    );
    
    camera.lookAt(lookTarget);
}
```

### 视角切换

玩家可以通过按 Enter 键在第一人称和第三人称视角之间切换。

```javascript
setupControls() {
    document.addEventListener('keydown', (e) => {
        switch(e.code) {
            // 移动键...
            case 'Space':
                // 跳跃
                if (!this.isJumping && !this.isCrouching) {
                    this.isJumping = true;
                    this.jumpTime = 0;
                }
                break;
            case 'KeyQ':
                // 蹲下
                if (!this.isJumping) {
                    this.isCrouching = !this.isCrouching;
                }
                break;
            case 'Enter':
                // 视角切换
                this.isThirdPerson = !this.isThirdPerson;
                break;
        }
    });
}
```

## 场景初始化

本阶段创建了一个简单的测试场景，包含地面网格、坐标轴辅助线，以及一个用于测试碰撞的墙壁。

```javascript
function init() {
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // 创建相机
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    // 创建渲染器
    const canvas = document.getElementById('scene-canvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // 灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // 辅助线
    axesHelper = new THREE.AxesHelper(5);
    axesHelper.position.y = 0.01;
    scene.add(axesHelper);

    // 地面网格
    gridHelper = new THREE.GridHelper(30, 30, 0x444444, 0x5a5a5a);
    scene.add(gridHelper);

    // 创建 NPC（在前方）
    npc = new NPC(scene, new THREE.Vector3(
        1, 
        SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength, 
        -5
    ));
    
    // 创建玩家（在更前方）
    player = new Player(scene, new THREE.Vector3(
        1, 
        SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength, 
        -9
    ));

    // 创建测试墙壁
    const wallGeometry = new THREE.BoxGeometry(6, 1.5, 0.5);
    const wallMaterial = new THREE.MeshBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.3,
        depthWrite: false
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(0, 1.5, -7);
    scene.add(wall);

    // 将墙壁添加到碰撞检测列表
    player.addObstacle(wall);
    npc.addObstacle(wall);

    // 开始动画循环
    animate();

    // 窗口大小调整
    window.addEventListener('resize', onWindowResize);
}
```

## 控制说明

本阶段的控制方式如下：

| 按键 | 功能 |
|------|------|
| W | 向前移动 |
| S | 向后移动 |
| A | 向左移动 |
| D | 向右移动 |
| Space | 跳跃 |
| Q | 蹲下/站立切换 |
| Enter | 第一人称/第三人称切换 |
| 鼠标左键点击 | 锁定鼠标指针 |
| 鼠标移动 | 控制视角 |

## 阶段总结

本阶段完成了以下功能：

1. **模块化架构**：将配置、动画器、核心类分离到不同目录，提高代码可维护性

2. **障碍物碰撞检测**：实现了 AABB 碰撞检测算法，角色可以与障碍物进行碰撞交互

3. **NPC 角色类**：创建了 NPC 类，具有简单的自动巡逻行为

4. **玩家角色类**：创建了 Player 类，实现了完整的移动和视角控制

5. **第一人称视角**：将相机绑定到角色头部，实现沉浸式 FPS 体验

6. **第三人称视角**：提供可选的第三人称视角，便于观察角色姿态

7. **移动机制**：基于视角方向的移动计算，WASD 控制自然直观

8. **跳跃与蹲下**：继承了第一阶段的跳跃和蹲下功能

这些功能为后续阶段的游戏开发奠定了坚实的基础。
