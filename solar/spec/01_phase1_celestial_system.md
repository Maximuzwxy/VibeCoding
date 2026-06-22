# 第一阶段：CelestialSystem 基类 + 太阳系 3D 轨道

## 目标
建立可复用的天体系统基类 `CelestialSystem`，通过配置驱动的方式渲染完整的太阳系 3D 轨道场景。

---

## 功能

### CelestialSystem 基类
`static/js/celestial-system.js` — 通用天体系统基类，支持：

#### 核心渲染
- **中心天体**：自转 + 可配置纹理/尺寸/颜色
- **轨道天体**：围绕中心天体公转 + 自转，配置轨道半径、速度、大小
- **轴倾角**：通过 `Group.rotation.x` 实现天体倾角（如地球 23.5°、天王星 97.8°）
- **轨道线**：EllipseCurve 绘制，可配置颜色
- **星空背景**：BufferGeometry + Points，随机散布粒子

#### 动画控制
- `speedMultiplier` 速度倍率控制
- `animate()` 循环更新公转角度 + 自转角度 + 钩子回调

#### Hook 扩展机制
通过 `hooks` 配置注入自定义逻辑，无需创建子类：
- `onInit = (sys) => {}` — 初始化时执行（如添加小行星带）
- `onAnimate = (sys, delta) => {}` — 每帧回调

#### 生命周期
- `init(containerId)` — 创建 Three.js 场景 + 渲染
- `dispose()` — 清理资源 + 移除 DOM

### 太阳系场景
`static/js/main.js` 通过配置对象定义太阳系：

```
中心: 太阳
轨道天体: 水星、金星、地球、火星、木星、土星、天王星、海王星
```

每个天体配置：轨道半径、大小、转速、颜色、轴倾角、轨道线颜色。

---

## 技术实现

### Three.js 架构
```
Scene
├── AmbientLight + DirectionalLight
├── Starfield (Points)
├── Center Group (太阳)
│   └── Mesh (中心天体，自转)
├── Orbit Groups (每个行星)
│   ├── EllipseCurve Line (轨道线)
│   └── Pivot (公转轴)
│       └── TiltContainer (Group, rotation.x = 轴倾角)
│           └── Mesh (行星，自转)
├── Camera (PerspectiveCamera 45°)
└── OrbitControls (缩放/旋转/平移)
```

### 核心代码片段

**公转轨迹**：
```javascript
const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, 2 * Math.PI, false, 0);
const points = curve.getPoints(256);
const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p.x, 0, p.y)));
const orbit = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color }));
```

**轴倾角容器**：
```javascript
const tiltContainer = new THREE.Group();
tiltContainer.rotation.x = -THREE.MathUtils.degToRad(body.axialTilt);
tiltContainer.add(mesh);
pivot.add(tiltContainer);
```

### 数据格式
天体对象配置：
```javascript
{
    name: 'earth',
    orbitRadius: 15,
    bodyRadius: 0.8,
    speed: 0.01,
    color: 0x4488ff,
    axialTilt: 23.5,       // 轴倾角（度）
    orbitColor: 0x3366cc   // 轨道线颜色
}
```

---

## 界面
```
┌──────────────────────────────────────┐
│                                      │
│         3D 太阳系轨道场景             │
│    (Three.js Canvas, 全屏)           │
│                                      │
│    · · · · · 星空背景                │
│    ☀ 太阳（中心，自转）               │
│    ◯ 轨道线（椭圆）                   │
│    ● 行星（公转 + 自转）              │
│                                      │
│                              [CN]    │
│      ☀ ☿ ♀ 🌍 ♂ ♃ ♄ ♅ ♆          │
│      (底部天体图标)                    │
│                                      │
└──────────────────────────────────────┘
```

---

## 测试覆盖
- `test_scene_container_exists` — 场景容器可见
- `test_threejs_canvas_renders` — Canvas 渲染成功
- `test_planet_icons_count` — 底部 10 个天体图标

---

## 关键决策

### 为什么不创建每个天体的子类？
配置驱动模式覆盖所有场景（不同尺寸、颜色、速度、倾角），无需为太阳/行星/卫星分别创建类。特殊需求（如小行星带）通过 hook 扩展解决。

### 为什么轴倾角用 Group 旋转？
Three.js 的 Object3D 旋转以本地坐标系原点为中心。将 Mesh 放入 Group，旋转 Group，即可让天体绕自身中心倾斜而不影响轨道位置。
