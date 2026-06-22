# 第十阶段：土星 + 粒子光环 + 7 卫星系统

## 目标

在[第五阶段](05_phase5_mercury.md)建立的框架基础上，实现土星。验证框架对**粒子光环系统**（多环带 + 缝隙）、**Z 轴倾角旋转**和**大卫星系统**（7 颗）的支持能力。

---

## 与之前天体的差异

| 特性 | 火星 | 木星 | 土星 |
|------|------|------|------|
| 行星类型 | 岩石 | 气态巨行星 | **气态巨行星 + 光环** |
| 卫星数量 | 2 | 4 | **7** |
| 光环 | 无 | 无 | **7 层粒子环带（C/B/A/F + 卡西尼缝 + 恩克缝）** |
| 倾角旋转轴 | X 轴（默认） | X 轴（默认） | **Z 轴** |
| 轴倾角 | 25.19° | 3.13° | **26.73°** |
| 半径 | 0.95 | 1.0 | **2.5（特写模式最大）** |
| 相机距离 | z: 7 | z: 8 | **z: 35（远距观察光环全貌）** |
| 纹理 | 红褐地质 | 棕米条纹+大红斑 | **淡黄米色+大气带+风暴斑+极地区域** |

---

## 框架新增能力验证

### 1. 粒子光环系统（createSaturnRing）

这是土星最独特的视觉特征。光环通过 **THREE.Points** 粒子系统实现，包含 7 层环带：

| 环带 | 内半径 | 外半径 | 密度 | 颜色 | 说明 |
|------|--------|--------|------|------|------|
| C 环 | 3.1 | 3.6 | 0.5 | `#c8beb0` | 最内环，较暗 |
| B 环 | 3.6 | 4.5 | 1.2 | `#dcd2be` | 最亮最密 |
| 卡西尼缝 | 4.5 | 4.7 | 0.1 | `#908070` | 暗色缝隙 |
| A 环 | 4.7 | 5.4 | 0.9 | `#d8d0b8` | 第二亮环 |
| 恩克缝 | 5.4 | 5.5 | 0.15 | `#807060` | 窄暗缝 |
| A 外缘 | 5.5 | 5.7 | 0.5 | `#c8c0a8` | A 环外边缘 |
| F 环 | 5.7 | 5.85 | 0.3 | `#b0a890` | 最外细环 |

总粒子数 **5000 个**，按各环带权重（宽度 × 密度）分配。每个环带独立生成粒子，位置通过 `Math.cos(angle) * radius` / `Math.sin(angle) * radius` 在 XZ 平面上分布，Y 轴微扰动 ±0.015。

渲染使用 `AdditiveBlending` 混合模式，半透明度 `0.85`：

```js
const ringMat = new THREE.PointsMaterial({
    size: 0.07,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
});
```

### 2. Z 轴倾角旋转

与所有其他天体不同，土星的倾角通过 **Z 轴**旋转实现（基类默认 X 轴），以匹配正确的视觉效果：

```js
onInit(scene) {
    // 使用 Z 轴倾角（而非默认 X 轴）
    this.centerGroup.rotation.set(0, 0, THREE.MathUtils.degToRad(26.73));
    this._saturnRing = createSaturnRing();
    this.centerGroup.add(this._saturnRing);
}
```

光环挂在 `centerGroup` 上，跟随土星的倾角旋转。

### 3. 光环独立旋转

光环需要独立于行星表面自转：

```js
onAnimate() {
    if (this.centerMesh) this.centerMesh.rotation.y += 0.003;  // 表面自转偏快
    if (this._saturnRing) this._saturnRing.rotation.y += 0.004;  // 光环独立旋转
}
```

基类默认 `+0.001`，此处额外 `+0.003`，净效果 `+0.004`。光环以 `+0.004` 的速度独立旋转。

### 4. 7 颗卫星

```js
orbitingBodies: [
    { name: 'mimas',     radius: 0.24, distance: 8.0,  color: '#c0c0c0',
      speed: -0.005, rotationSpeed: 0.002 },
    { name: 'enceladus', radius: 0.26, distance: 9.0,  color: '#d0d0d0',
      speed: -0.004, rotationSpeed: 0.002 },
    { name: 'tethys',    radius: 0.30, distance: 10.2, color: '#c8c8c8',
      speed: -0.0035, rotationSpeed: 0.002 },
    { name: 'dione',     radius: 0.32, distance: 11.5, color: '#b8b8b8',
      speed: -0.003, rotationSpeed: 0.002 },
    { name: 'rhea',      radius: 0.36, distance: 13.5, color: '#b0b0b0',
      speed: -0.0025, rotationSpeed: 0.002 },
    { name: 'titan',     radius: 0.60, distance: 18.0, color: '#d4b88c',
      speed: -0.002, rotationSpeed: 0.001 },
    { name: 'iapetus',   radius: 0.34, distance: 28.0, color: '#a8a8a8',
      speed: -0.0015, rotationSpeed: 0.001 }
]
```

**土卫六 Titan**（半径 0.60）是最大的卫星，棕黄色 `#d4b88c` 反映其浓厚大气层。其余卫星以灰色系为主，公转速度内快外慢。

---

## 配置

```js
saturn: {
    centerBody: { radius: 2.5, textureGenerator: createSaturnTexture, axialTilt: 26.73 },
    cameraPosition: { x: 0, y: 15, z: 35 },
    minDistance: 10, maxDistance: 80,
    starCount: 5000,
    onInit(scene) {
        // Z 轴倾角（非默认 X 轴）
        this.centerGroup.rotation.set(0, 0, THREE.MathUtils.degToRad(26.73));
        this._saturnRing = createSaturnRing();
        this.centerGroup.add(this._saturnRing);
    },
    onAnimate() {
        if (this.centerMesh) this.centerMesh.rotation.y += 0.003;
        if (this._saturnRing) this._saturnRing.rotation.y += 0.004;
    },
    orbitingBodies: [ /* 7 颗卫星，见上文 */ ]
}
```

---

## 纹理生成

### 表面（createSaturnTexture）

- 淡黄米色渐变底色（`#f0e6d0` / `#e6d8b8` / `#d4c8a8` / `#ead6b8` 交替）
- **30 条大气带**：随机透明度的棕黄色横向条纹
- **80 个淡色云层**：径向渐变斑点
- **15 个暗色风暴**：随机椭圆暗斑
- **20 个白色风暴**：随机椭圆亮斑
- **北极/南极区域**：径向渐变暗色调

### 光环（createSaturnRing）

光环不是纹理而是一个独立的 **THREE.Points** 对象：
- 7 层环带按密度权重分配 5000 个粒子
- `AdditiveBlending` 实现半透明叠加效果
- 每个粒子带顶点颜色，亮度 0.7~1.1 范围随机

---

## 全景模式中的土星

在太阳系全景中，土星是唯一带光环的行星：

```js
{ name: 'saturn', radius: 1.2, distance: 18, color: '#ead6b8',
  speed: -0.0009, axialTilt: 26.73, rotationSpeed: 0.01,
  hasRings: true,
  ringConfig: { innerRadius: 1.8, outerRadius: 3.0, color: 0xc9b896, opacity: 0.8 },
  textureGenerator: createSaturnTexture }
```

全景模式中 `hasRings: true` 触发 `CelestialSystem` 的环渲染逻辑（`ringConfig` 定义环形几何参数），与特写模式的粒子环系统不同。

---

## 数据生成

```bash
python data/init_celestial.py saturn 土星 Saturn
```

---

## 文件变更

| 文件 | 变更 |
|------|------|
| `static/js/planets/saturn.js` | **新增**：`createSaturnTexture` + `createSaturnRing` |
| `data/planets/saturn.json` | **新增**（init_celestial.py 生成） |
| `data/quizzes/saturn.json` | **新增**（init_celestial.py 生成） |
| `static/js/main.js` | **修改**：`planetConfigs.saturn` + 全景模式 `orbitingBodies` 加土星条目（含 `hasRings`） |

---

## 土星 vs 木星配置对比

| 参数 | 木星 | 土星 |
|------|------|------|
| `radius` | 1.0 | 2.5 |
| `axialTilt` | 3.13° (X轴) | 26.73° (**Z轴**) |
| `cameraPosition.z` | 8 | 35 |
| 光环 | 无 | **7 层粒子环带** |
| 卫星数量 | 4 | 7 |
| 最大卫星半径 | 0.15（Ganymede） | 0.60（Titan） |
| `onAnimate` | 无（基类默认） | **光环+表面各自旋转** |
| 云层 | centerGroup 云层 | 无独立云层 |

---

## 框架验证

土星的成功实现验证了：

1. **粒子光环系统**：`createSaturnRing()` 通过 THREE.Points + 环带密度分配实现真实光环效果
2. **Z 轴倾角**：`centerGroup.rotation.set(0, 0, ...)` 覆盖基类默认 X 轴倾角
3. **光环独立旋转**：`onAnimate` 中光环与表面各自旋转，表现不同角速度
4. **大卫星系统**：7 颗卫星通过 `orbitingBodies` 配置，公转速度从 -0.0015 到 -0.005 递减
5. **全景+特写双光环**：全景用 `hasRings + ringConfig`（简单环几何体），特写用粒子环（精细 7 层）

---

## 新增天体的标准化程度

土星是现有天体中配置最复杂的，但仍然只需 **3 步**：

1. `python data/init_celestial.py saturn 土星 Saturn`
2. 写 `static/js/planets/saturn.js`（导出纹理 + 光环生成函数）
3. 在 `main.js` 的 `planetConfigs` 加一个条目（配置 Z 轴倾角 + 光环 + 卫星）

即便有粒子光环、非标准倾角轴、7 颗卫星，框架本身不需要改——所有特殊行为通过 `onInit` / `onAnimate` / `orbitingBodies` 配置完成。
