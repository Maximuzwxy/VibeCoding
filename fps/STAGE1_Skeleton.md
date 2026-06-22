# 第一阶段：骨骼系统

## 概述

本阶段的核心目标是构建一个完整的人物骨骼系统。该骨骼系统是整个 FPS 游戏的基础，后续所有的角色（玩家、NPC）都将基于这个骨骼系统进行扩展。骨骼系统采用层次化的 Object3D 结构，通过父子关系连接各个身体部位，支持站立、奔跑、蹲下、跳跃等多种姿态的动画。

骨骼系统的设计参考了真实人体解剖结构，将人体分为骨盆（pelvis）、脊柱（spine）、肩膀（shoulders）、头部（head）、手臂（分为上臂和前臂）、腿部（分为大腿和小腿）等主要部分。每个部分都作为独立的 Object3D 存在，通过旋转和位置变换来实现各种动作。

## 目录结构

本阶段的代码结构保持了单文件形式，所有功能都在 `script.js` 中实现：

```
fps3/
├── index.html    # 入口 HTML 文件
├── script.js     # 核心逻辑代码
└── style.css     # 样式文件
```

## 核心配置参数

骨骼系统的所有尺寸参数都集中在一个配置对象中，这样可以方便地调整角色的整体比例。配置参数包括身体各部位的长度、半径等几何尺寸，以及用于渲染的线条宽度和关节球体半径。

```javascript
const SKELETON_CONFIG = {
    // 骨盆参数
    pelvisLength: 0.27,           // 骨盆宽度
    
    // 躯干参数
    torsoLength: 0.5,             // 脊柱长度（从骨盆到肩膀）
    
    // 头部参数
    headRadius: 0.1,              // 头部半径
    
    // 手臂参数
    upperArmLength: 0.3,          // 上臂长度
    forearmLength: 0.3,           // 前臂长度
    
    // 腿部参数
    thighLength: 0.45,            // 大腿长度
    shinLength: 0.45,             // 小腿长度
    
    // 身体宽度参数
    shoulderWidth: 0.18,          // 肩膀宽度（单侧）
    hipWidth: 0.135,             // 髋部宽度（单侧）
    
    // 武器参数
    gunLength: 0.6,               // 枪械长度
    
    // 渲染参数
    bodyDiameter: 0.1,           // 身体主要部位直径
    lineWidth: 0.02,             // 骨骼线条宽度
    jointRadius: 0.04            // 关节球体半径
};
```

这些参数定义了角色的基本体型。通过调整这些数值，可以创建不同身高、体型的角色。例如，增大 `thighLength` 和 `shinLength` 会使角色腿部更长，从而增加整体身高。

## 骨骼工厂类

`SkeletonFactory` 类负责创建完整的骨骼结构。该类使用静态方法设计，无需实例化即可调用。主要方法包括创建骨骼、创建关节球体、创建骨骼标签和创建骨骼线条。

### 骨骼结构创建流程

骨骼的创建从根节点（root）开始，根节点是整个骨骼系统的最顶层，代表角色的世界位置。骨盆直接作为根节点的子对象，脊柱连接在骨盆上方，肩膀连接在脊柱顶部，头部连接在肩膀上。这种层次结构确保了当父节点发生变换时，所有子节点都会自动跟随。

```javascript
class SkeletonFactory {
    static create(scene, position = new THREE.Vector3(0, 0, 0)) {
        const skeleton = {
            gunGroup: null,           // 枪械组
            leftUpperArm: null,       // 左上臂
            leftForearm: null,        // 左前臂
            rightUpperArm: null,      // 右上臂
            rightForearm: null,       // 右前臂
            shoulders: null,          // 肩膀组
            leftThigh: null,          // 左大腿
            leftShin: null,           // 左小腿
            rightThigh: null,         // 右大腿
            rightShin: null,          // 右小腿
            root: null,               // 根节点
            leftShoulderPos: null,    // 左肩膀位置
            rightShoulderPos: null    // 右肩膀位置
        };

        // 创建根节点
        const root = new THREE.Object3D();
        root.position.copy(position);
        scene.add(root);
        skeleton.root = root;

        // 创建骨盆
        const pelvis = new THREE.Object3D();
        pelvis.position.set(0, 0, 0);
        root.add(pelvis);

        // 在骨盆两端创建髋关节
        const leftHipPos = new THREE.Vector3(halfPelvis, 0, 0);
        const rightHipPos = new THREE.Vector3(-halfPelvis, 0, 0);
        SkeletonFactory.createJointSphere(pelvis, leftHipPos, ...);
        SkeletonFactory.createJointSphere(pelvis, rightHipPos, ...);

        // 创建脊柱
        const spine = new THREE.Object3D();
        spine.position.set(0, 0, 0);
        pelvis.add(spine);
        SkeletonFactory.createBoneLine(spine, 
            new THREE.Vector3(0, 0, 0), 
            new THREE.Vector3(0, SKELETON_CONFIG.torsoLength, 0), 
            colors.spine
        );

        // 创建肩膀组
        const shoulders = new THREE.Object3D();
        shoulders.position.set(0, SKELETON_CONFIG.torsoLength, 0);
        spine.add(shoulders);

        // 创建头部
        const head = new THREE.Object3D();
        head.position.set(0, 0, 0);
        shoulders.add(head);

        // 创建枪械组
        const gunGroup = new THREE.Object3D();
        gunGroup.position.set(0, 0, 0);
        shoulders.add(gunGroup);
        skeleton.gunGroup = gunGroup;

        // 创建四肢...
        // 左上臂、左前臂、右上臂、右前臂
        // 左大腿、左小腿、右大腿、右小腿
    }
}
```

### 骨骼层次结构

骨骼的层次结构设计是本系统的核心。每个身体部位都是一个独立的 Object3D，通过 `add()` 方法添加到父对象中。这种设计带来了以下优势：首先，当父节点旋转或移动时，所有子节点会自动跟随变换；其次，每个部位都可以独立控制旋转角度，实现复杂的姿态变化。

```
root (根节点，角色世界位置)
├── pelvis (骨盆)
│   ├── spine (脊柱)
│   │   └── shoulders (肩膀组)
│   │       ├── head (头部)
│   │       ├── gunGroup (枪械)
│   │       ├── leftUpperArm (左上臂)
│   │       │   └── leftForearm (左前臂)
│   │       └── rightUpperArm (右上臂)
│   │           └── rightForearm (右前臂)
│   ├── leftThigh (左大腿)
│   │   └── leftShin (左小腿)
│   └── rightThigh (右大腿)
│       └── rightShin (右小腿)
```

### 关节球体创建

关节球体用于可视化骨骼的关节位置，帮助理解骨骼结构。每个关节都有一个彩色的球体表示，同时还会生成一个带有数字标签的 2D 标签显示在关节位置。

```javascript
static createJointSphere(parent, position, radius, color, labelNumber) {
    // 创建球体几何体
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(position);
    parent.add(sphere);

    // 创建数字标签
    const label = SkeletonFactory.createJointLabel(labelNumber, position);
    parent.add(label);

    return sphere;
}
```

关节标签使用 Canvas 2D 绘制数字，然后转换为 Three.js 的 Sprite（精灵）对象，这样标签始终面向相机，便于识别每个关节的编号。

### 骨骼线条创建

骨骼线条用于连接各个关节，形成完整的骨骼轮廓。使用 Three.js 的 Line 对象绘制直线，连接起点和终点。

```javascript
static createBoneLine(parent, start, end, color) {
    const points = [];
    points.push(start.clone());
    points.push(end.clone());

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
    const line = new THREE.Line(geometry, material);

    parent.add(line);
    return line;
}
```

## 骨骼动画器类

`SkeletonAnimator` 类负责处理骨骼的各种姿态变换。该类实现了站立、奔跑、蹲下、跳跃等多种姿态的计算，以及手臂跟随枪械方向的逆向运动学（IK）计算。

### 手臂逆向运动学

手臂的逆向运动学（IK）是本阶段的难点之一。目标是根据枪口的目标位置，计算出上臂和前臂需要旋转到的角度，使手部能够自然地指向目标位置。

算法采用解析法求解：首先计算肩膀到目标的距离，然后使用余弦定理计算肘部到肩膀和肘部到目标的距离比例。接着通过向量运算确定肘部在空间中的位置，最后计算上臂和前臂分别需要旋转的角度。

```javascript
static connectArmToTarget(upperArm, forearm, shoulderPos, targetPos, isLeftArm) {
    const upperArmLength = SKELETON_CONFIG.upperArmLength;
    const forearmLength = SKELETON_CONFIG.forearmLength;
    
    // 计算肩膀到目标的距离
    const dx = targetPos.x - shoulderPos.x;
    const dy = targetPos.y - shoulderPos.y;
    const dz = targetPos.z - shoulderPos.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    const targetDir = new THREE.Vector3(dx, dy, dz).normalize();
    
    // 使用余弦定理计算相关距离
    const distFromShoulder = (upperArmLength * upperArmLength 
        - forearmLength * forearmLength + distance * distance) / (2 * distance);
    const height = Math.sqrt(Math.max(0, 
        upperArmLength * upperArmLength - distFromShoulder * distFromShoulder
    ));
    
    // 计算肘部基础位置
    const basePoint = new THREE.Vector3(
        shoulderPos.x + targetDir.x * distFromShoulder,
        shoulderPos.y + targetDir.y * distFromShoulder,
        shoulderPos.z + targetDir.z * distFromShoulder
    );
    
    // 计算肘部方向
    const worldUp = new THREE.Vector3(0, 1, 0);
    const sideDir = new THREE.Vector3().crossVectors(targetDir, worldUp).normalize();
    const downDir = new THREE.Vector3().crossVectors(sideDir, targetDir).normalize();
    
    // 计算最终的肘部位置
    const elbowPos = new THREE.Vector3(
        basePoint.x + elbowDir.x * height,
        basePoint.y + elbowDir.y * height,
        basePoint.z + elbowDir.z * height
    );
    
    // 计算上臂旋转
    upperArm.rotation.set(0, 0, 0);
    const upperArmTarget = new THREE.Vector3(
        elbowPos.x - shoulderPos.x,
        elbowPos.y - shoulderPos.y,
        elbowPos.z - shoulderPos.z
    ).normalize();
    
    // 使用叉积计算旋转轴和角度
    const defaultDir = new THREE.Vector3(0, -1, 0);
    const rotAxis = new THREE.Vector3().crossVectors(defaultDir, upperArmTarget).normalize();
    const rotAngle = Math.acos(Math.max(-1, Math.min(1, defaultDir.dot(upperArmTarget))));
    
    if (rotAxis.lengthSq() > 0.001) {
        upperArm.rotateOnAxis(rotAxis, rotAngle);
    }
    
    // 计算前臂旋转（需要转换到上臂的局部坐标系）
    forearm.rotation.set(0, 0, 0);
    const forearmTarget = new THREE.Vector3(
        targetPos.x - elbowPos.x,
        targetPos.y - elbowPos.y,
        targetPos.z - elbowPos.z
    ).normalize();
    
    const localForearmTarget = forearmTarget.clone()
        .applyQuaternion(upperArm.quaternion.clone().invert());
    
    const forearmRotAxis = new THREE.Vector3().crossVectors(defaultDir, localForearmTarget).normalize();
    const forearmRotAngle = Math.acos(Math.max(-1, Math.min(1, defaultDir.dot(localForearmTarget))));
    
    if (forearmRotAxis.lengthSq() > 0.001) {
        forearm.rotateOnAxis(forearmRotAxis, forearmRotAngle);
    }
}
```

### 站立姿态

站立姿态是角色的默认姿态，各部位角度归零，角色直立站立。

```javascript
static setStandPose(skeleton) {
    const baseRootY = SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength;
    skeleton.leftThigh.rotation.x = 0;
    skeleton.rightThigh.rotation.x = 0;
    skeleton.leftShin.rotation.x = 0;
    skeleton.rightShin.rotation.x = 0;
    skeleton.root.position.y = baseRootY;
}
```

### 奔跑姿态

奔跑姿态通过正弦函数计算四肢的摆动角度。左右腿的摆动方向相反（相位差 π），以模拟奔跑时的交替迈步动作。膝盖在摆动腿向前时略微弯曲，减少僵硬度。

```javascript
static setRunningPose(skeleton, animTime) {
    // 摆动角度
    const swingAngle = Math.sin(animTime) * CHARACTER_CONFIG.swingAngle;
    const swingAngleOpposite = Math.sin(animTime + Math.PI) * CHARACTER_CONFIG.swingAngle;
    
    // 大腿摆动
    skeleton.leftThigh.rotation.x = swingAngle;
    skeleton.rightThigh.rotation.x = swingAngleOpposite;
    
    // 膝盖弯曲（仅在腿向前摆动时弯曲）
    const leftKneeBend = swingAngle > 0 ? swingAngle * CHARACTER_CONFIG.kneeBendFactor : 0;
    const rightKneeBend = swingAngleOpposite > 0 ? swingAngleOpposite * CHARACTER_CONFIG.kneeBendFactor : 0;
    
    skeleton.leftShin.rotation.x = leftKneeBend;
    skeleton.rightShin.rotation.x = rightKneeBend;
}
```

### 蹲下姿态

蹲下姿态通过大幅旋转大腿和小腿来实现。大腿向前抬起约90度，小腿向后弯曲，形成经典的蹲姿。

```javascript
static setCrouchPose(skeleton) {
    const leftThighAngle = -Math.PI / 2;
    const leftShinAngle = Math.PI / 2;
    skeleton.leftThigh.rotation.x = leftThighAngle;
    skeleton.leftShin.rotation.x = leftShinAngle;
    
    const rightThighAngle = 0;
    const rightShinAngle = Math.PI / 2;
    skeleton.rightThigh.rotation.x = rightThighAngle;
    skeleton.rightShin.rotation.x = rightShinAngle;
    
    // 降低身体高度
    skeleton.root.position.y = SKELETON_CONFIG.thighLength;
}
```

### 跳跃姿态

跳跃姿态模拟角色在空中时的身体姿态。大腿和小腿都略微弯曲，膝盖不完全伸直，同时身体位置根据跳跃高度进行偏移。

```javascript
static setJumpPose(skeleton, jumpHeight) {
    const baseRootY = SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength;
    const slightBend = 0.3;
    
    skeleton.leftThigh.rotation.x = -slightBend;
    skeleton.rightThigh.rotation.x = -slightBend;
    skeleton.leftShin.rotation.x = slightBend * 0.8;
    skeleton.rightShin.rotation.x = slightBend * 0.8;
    
    skeleton.root.position.y = baseRootY + jumpHeight;
}
```

## 角色基类

`Character` 类是所有角色类型的基类，封装了骨骼管理、碰撞体创建、姿态更新等通用功能。

### 碰撞体系统

每个角色都有一个圆柱形碰撞体，用于与其他角色和障碍物进行碰撞检测。碰撞体随着角色姿态的变化而自动调整高度（站立时较高，蹲下时变矮）。

```javascript
class Character {
    constructor(scene, position) {
        this.scene = scene;
        this.skeleton = SkeletonFactory.create(scene, position);
        
        this.isJumping = false;
        this.jumpTime = 0;
        this.jumpHeight = 0;
        this.isCrouching = false;
        
        this.collisionCylinder = this.createCollisionCylinder();
        this.skeleton.root.add(this.collisionCylinder);
    }
    
    createCollisionCylinder() {
        // 计算站立和蹲下的高度
        this.standHeight = SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength 
            + SKELETON_CONFIG.torsoLength + SKELETON_CONFIG.headRadius * 2;
        this.crouchHeight = SKELETON_CONFIG.thighLength 
            + SKELETON_CONFIG.torsoLength + SKELETON_CONFIG.headRadius * 2;
        
        const radius = 0.3;
        
        const geometry = new THREE.CylinderGeometry(radius, radius, this.standHeight, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0x888888,
            transparent: true,
            opacity: 0.3,
            depthWrite: false
        });
        
        const cylinder = new THREE.Mesh(geometry, material);
        cylinder.position.y = this.standHeight / 2 
            - (SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength);
        
        return cylinder;
    }
    
    updateCollisionCylinder() {
        if (this.isCrouching) {
            const scale = this.crouchHeight / this.standHeight;
            this.collisionCylinder.scale.y = scale;
            this.collisionCylinder.position.y = this.crouchHeight / 2 
                - SKELETON_CONFIG.thighLength;
        } else {
            this.collisionCylinder.scale.y = 1;
            this.collisionCylinder.position.y = this.standHeight / 2 
                - (SKELETON_CONFIG.thighLength + SKELETON_CONFIG.shinLength);
        }
    }
}
```

### 跳跃物理

跳跃使用正弦函数计算高度，实现自然的抛物线跳跃轨迹。

```javascript
updateJump(deltaTime, jumpDuration = CHARACTER_CONFIG.jumpDuration) {
    if (this.isJumping) {
        this.jumpTime += deltaTime;
        if (this.jumpTime >= jumpDuration) {
            this.isJumping = false;
            this.jumpTime = 0;
            this.jumpHeight = 0;
        } else {
            this.jumpHeight = Math.sin(this.jumpTime / jumpDuration * Math.PI) 
                * CHARACTER_CONFIG.jumpHeight;
        }
    }
}
```

## 初始化与渲染

场景初始化包括创建渲染器、相机、灯光、辅助线，以及初始化骨骼系统。

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

    // 创建轨道控制器
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 创建灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // 创建辅助线
    axesHelper = new THREE.AxesHelper(5);
    axesHelper.position.y = 0.01;
    scene.add(axesHelper);

    gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x5a5a5a);
    scene.add(gridHelper);

    // 创建骨骼
    createSkeleton();

    // 设置相机位置
    camera.position.set(4, 3, 5);
    camera.lookAt(1, 1, 0);

    // 开始动画循环
    animate();

    // 监听窗口大小变化
    window.addEventListener('resize', onWindowResize);
}
```

## 阶段总结

本阶段完成了骨骼系统的完整实现，包括：

1. **骨骼配置系统**：通过 `SKELETON_CONFIG` 集中管理所有身体部位的尺寸参数
2. **骨骼工厂类**：`SkeletonFactory` 负责创建完整的骨骼层次结构
3. **骨骼动画器类**：`SkeletonAnimator` 实现了站立、奔跑、蹲下、跳跃等多种姿态
4. **逆向运动学**：实现了手臂跟随枪械方向的 IK 计算
5. **碰撞体系统**：角色具有可动态调整的圆柱形碰撞体
6. **角色基类**：`Character` 类封装了通用的角色功能

这个骨骼系统为后续阶段奠定了坚实的基础，所有角色（玩家和 NPC）都将基于这个系统进行扩展。
