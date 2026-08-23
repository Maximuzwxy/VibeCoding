# 3D Pong 游戏开发计划

本文档描述了如何从零开始构建一个 3D Pong 游戏，分为 5 个阶段逐步实现。

---

## 游戏概述

一个在 3D 立方体空间内进行的双人对战乒乓球游戏。红方（正面）和绿方（背面）各控制一块挡板，通过让球穿过对方的挡板来得分。

---

## 第一阶段：建立 3D 空间概念

### 目标
- 创建 3D 坐标系（X、Y、Z 轴），帮助用户建立空间概念
- 创建一个可视化的立方体（Cube）
- 设置合适的相机位置

### 技术细节

#### 坐标系
- 使用 THREE.js 的 `ArrowHelper` 创建带箭头的坐标轴
- X 轴：红色，指向右侧
- Y 轴：绿色，指向上方
- Z 轴：蓝色，指向前方
- 坐标轴长度建议 20 单位，原点位于 Cube 中心

#### 立方体 (Cube)
- 尺寸：15 x 15 x 15 单位
- 材质：透明材质（`MeshBasicMaterial` with `transparent: true, opacity: 0.15`）
- 边缘：使用 `LineSegments` 和 `EdgesGeometry` 绘制可见的 12 条边
- 边缘颜色：青色（0x48dbfb）
- 边缘透明度：0.6

#### 相机设置
- 类型：`PerspectiveCamera`
- FOV：65 度
- 宽高比：窗口宽高比
- 近平面：0.1，远平面：1000
- 位置：(25, 0, 0) - 位于正 X 轴上
- 看向原点：`camera.lookAt(0, 0, 0)`
- 添加 OrbitControls 允许用户旋转视角

#### 星空背景（可选装饰）
- 500 颗星星组成的粒子系统
- 位置在 Cube 外部（20-50 单位半径的球形空间内）
- 每颗星星有独立的闪烁相位和速度

---

## 第二阶段：添加挡板（Paddle）

### 目标
- 在立方体两侧各放置一个挡板
- 定义挡板的大小和外观
- 确保挡板可以在一定范围内移动
- 实现键盘控制

### 技术细节

#### 挡板几何体
- 尺寸：4 x 4 x 0.3 单位（宽、高、厚）
- 使用 `BoxGeometry` 创建

#### 正面挡板（红方）
- 位置：Z = +7.25（Cube 正面内侧）
- 颜色：0xff6666（亮红色）
- 材质：`MeshBasicMaterial`（无透明度，避免闪烁）

#### 背面挡板（绿方）
- 位置：Z = -7.25（Cube 背面内侧）
- 颜色：0x66ff66（亮绿色）
- 材质：`MeshBasicMaterial`（无透明度，避免闪烁）

#### 移动范围限制
- X 轴：-5.5 到 +5.5（留出边界距离）
- Y 轴：-5.5 到 +5.5
- Z 轴：固定位置不变

#### 键盘控制
- **正面挡板（红方）**：
  - W：向上移动（+Y）
  - S：向下移动（-Y）
  - A：向左移动（-X）
  - D：向右移动（+X）
- **背面挡板（绿方）**：
  - ↑：向上移动（+Y）
  - ↓：向下移动（-Y）
  - ←：向左移动（-X）
  - →：向右移动（+X）
- 移动速度：0.1 单位/帧

#### 控制器实现
```javascript
const keyState = {};
window.addEventListener('keydown', (e) => keyState[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keyState[e.key.toLowerCase()] = false);
```

---

## 第三阶段：球体物理与碰撞

### 目标
- 在 Cube 中心创建一个球
- 实现球的移动逻辑
- 实现球的碰撞反弹（4 个垂直面）
- 实现得分逻辑（穿过对方挡板）
- 实现挡板碰撞（改变球的移动方向和角度）

### 技术细节

#### 球体
- 几何体：球体，半径 0.3，32 段
- 材质：白色 `MeshBasicMaterial`
- 初始位置：(0, 0, 0)
- 添加发光效果：更大的半透明球体叠加

#### 球的初始速度
```javascript
const ballVelocity = new THREE.Vector3(
    (Math.random() > 0.5 ? 1 : -1) * 0.05,  // X 方向随机
    (Math.random() > 0.5 ? 1 : -1) * 0.05,  // Y 方向随机
    0.05 * 1.6  // Z 方向（固定速度的 1.6 倍）
);
```

#### 碰撞边界
- X 轴边界：±7.0（碰到反弹）
- Y 轴边界：±7.0（碰到反弹）
- Z 轴边界：±7.5（Paddle 所在平面）

#### 反弹逻辑
- 球碰到 X 或 Y 边界时，相应速度分量取反
- 位置修正：防止球卡在边界外

#### 挡板碰撞检测
- 碰撞区域：挡板中心 ±2 单位（半径）
- 碰撞条件：
  - 正面：球 Z + 0.5 >= 7.25 且 球 Z <= 7.5
  - 背面：球 Z - 0.5 <= -7.25 且 球 Z >= -7.5
  - X、Y 坐标在挡板范围内

#### 挡板碰撞效果
- Z 速度取反（反弹回原方向）
- 根据击中位置添加角度偏移：
  ```javascript
  const hitPosRelX = (ball.position.x - paddle.position.x) / paddleRadius;
  const hitPosRelY = (ball.position.y - paddle.position.y) / paddleRadius;
  ballVelocity.x += hitPosRelX * 0.05;
  ballVelocity.y += hitPosRelY * 0.05;
  ```
- 根据挡板移动速度添加旋转效果：
  ```javascript
  ballVelocity.x += paddleVelX * 0.3;
  ballVelocity.y += paddleVelY * 0.3;
  ```

#### 速度递增
- 每次击中挡板，速度乘以 1.05
- 最大速度限制：0.3

#### 得分逻辑
- 球穿过正面挡板（Z > 7.5）：背面挡板（绿方）得分
- 球穿过背面挡板（Z < -7.5）：正面挡板（红方）得分
- 得分后球重置到中心，速度随机重新初始化

---

## 第四阶段：AI 对手

### 目标
- 实现 AI 控制算法
- 允许玩家选择手动或 AI 控制每个挡板
- AI 能够预测球的轨迹并移动

### 技术细节

#### AI 算法
```javascript
function moveAIPaddle(paddle, ballPos, ballVel, paddlePos) {
    // 计算球到达挡板位置的时间
    const timeToReach = (paddlePos - ballPos) / ballVel.z;

    if (timeToReach > 0 && ballVel.z !== 0) {
        // 预测球到达时的位置
        const predictedX = ballPos.x + timeToReach * ballVel.x;
        const predictedY = ballPos.y + timeToReach * ballVel.y;

        // 移动挡板向预测位置
        const dx = predictedX - paddle.position.x;
        const dy = predictedY - paddle.position.y;

        paddle.position.x += Math.max(-0.05, Math.min(0.05, dx));
        paddle.position.y += Math.max(-0.05, Math.min(0.05, dy));
    } else {
        // 球远离时，回到中心位置
        paddle.position.x += Math.max(-0.05, Math.min(0.05, -paddle.position.x));
        paddle.position.y += Math.max(-0.05, Math.min(0.05, -paddle.position.y));
    }

    // 限制移动范围
    paddle.position.x = Math.max(-5.5, Math.min(5.5, paddle.position.x));
    paddle.position.y = Math.max(-5.5, Math.min(5.5, paddle.position.y));
}
```

#### 控制模式切换
- 前端 UI 提供 Human/AI 切换按钮
- 存储控制模式：`paddleModes = { frontPaddle: 'human', backPaddle: 'ai' }`
- 根据模式选择使用键盘控制或 AI 控制

---

## 第五阶段：丰富游戏功能

### 5.1 Buff 系统

#### 道具类型
| 名称 | 颜色 | 效果 | 持续时间 |
|------|------|------|----------|
| ENLARGE | 绿色 (0x2ecc71) | 球拍放大 50% | 3 秒 |
| SHRINK | 橙色 (0xf39c12) | 对手球拍缩小 40% | 3 秒 |
| SLOW | 蓝色 (0x3498db) | 球速减慢 30% | 3 秒 |
| SPLIT | 红色 (0xe74c3c) | 球分裂成 3 个 | 永久 |

#### 道具方块
- 尺寸：0.3 x 0.3 x 0.3
- 在 Cube 两侧随机位置生成
- 动画：旋转 + 脉冲发光
- 每 300 帧（约 5 秒）生成一次
- 可通过配置控制生成频率

### 5.2 视觉特效

#### 击中效果
- 类型：扩散圆环
- 颜色：灰色
- 持续时间：1 秒
- 缩放：从 1x 到 3x

#### 球体拖尾
- 类型：小球粒子
- 颜色：青色 (0x48dbfb)
- 持续时间：0.6 秒
- 淡出效果

#### 道具方块特效
- 中心点光源
- 外层发光网格（放大 0.5 单位）
- 脉冲动画

### 5.3 音效系统（Web Audio API）

#### 击球音效
- 类型：方波振荡器
- 频率：800 → 400 Hz
- 时长：0.1 秒

#### 墙壁反弹音效
- 类型：正弦波振荡器
- 频率：300 → 150 Hz
- 时长：0.15 秒

#### 得分音效
- 类型：和弦（C5, E5, G5）
- 频率：523.25, 659.25, 783.99 Hz
- 逐个延迟播放

### 5.4 游戏 UI

#### 界面元素
- 开始界面：标题 + 开始按钮
- HUD：双方分数、暂停按钮、设置按钮
- 设置面板：Buff 频率、球速度、获胜分数等
- 游戏结束界面：获胜者显示、重新开始按钮

#### 控制按钮
- Human/AI 切换：每个挡板独立的控制模式
- 暂停/恢复
- 重置游戏
- 打开/关闭设置面板

---

## 项目结构

```
3d-pong/
├── index.html      # 主页面
├── css/
│   └── style.css   # 样式文件
├── js/
│   └── main.js     # 主游戏逻辑
└── ROADMAP.md      # 本文档
```

---

## 技术栈

- **Three.js**：3D 渲染引擎
- **OrbitControls**：相机控制
- **Web Audio API**：音效
- **原生 JavaScript**：游戏逻辑

---

## 后续扩展建议

1. **难度选择**：不同级别的 AI 速度
2. **皮肤系统**：自定义挡板和球的颜色/纹理
3. **多人模式**：通过网络对战
4. **关卡系统**：不同大小的 Cube 或特殊规则
