# 第六阶段：金星 + 带外层效果的纹理生成

## 目标

在[第五阶段](05_phase5_mercury.md)建立的框架基础上，实现金星。验证框架对**非标准纹理需求**（外层云罩）和**特殊自转行为**（逆向自转）的支持能力。

---

## 与第五阶段的关联

第五阶段建立了 `planetConfigs` + `planetDetailConfig` 框架。金星直接复用：

```js
// main.js — 只需在 planetConfigs 加一个条目
venus: {
    centerBody: { radius: 0.95, textureGenerator: createVenusTexture, axialTilt: 177.4 },
    cameraPosition: { x: 0, y: 2, z: 5 },
    minDistance: 2, maxDistance: 15,
    starCount: 5000,
    onInit(scene) { /* 添加云罩 */ },
    onAnimate() { /* 逆向自转 + 云罩旋转 */ }
}
```

其余逻辑（场景切换、主题色、数据加载）零改动。

---

## 金星独特之处

### 1. 外层云罩

金星最显著的特征是浓厚云层。在旧代码中，云罩是一个独立的半透明球体包裹在行星外面。

**实现方式**：通过 `CelestialSystem` 的 `onInit` 钩子，在场景初始化后添加云罩球体。

```js
onInit(scene) {
    const cloudGeo = new THREE.SphereGeometry(0.98, 64, 64);
    const cloudMat = new THREE.MeshPhongMaterial({
        map: createVenusCloudTexture(),
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
    });
    this._venusCloud = new THREE.Mesh(cloudGeo, cloudMat);
    this.centerGroup.add(this._venusCloud);  // 挂在倾角容器上，跟着行星转
}
```

**关键点**：云罩 `add` 到 `centerGroup`，不是 `scene`。这样当 `centerGroup` 旋转（轴倾角 177.4°）时，云罩和行星保持同步。

### 2. 逆向自转

金星自转方向与大多数行星相反（自东向西），因此 `rotation.y` 需要负值。

**旧代码**：
```js
venus.rotation.y -= 0.003;   // 表面自转
clouds.rotation.y -= 0.004;  // 云罩比表面快
```

**基类默认行为是 `+0.001`（正向）**，所以 `onAnimate` 中：
```js
onAnimate() {
    // 基类做了 +0.001，这里再多减 0.004 → 净效果 -0.003
    this.centerMesh.rotation.y -= 0.004;
    // 云罩旋转 -0.004（不受基类影响，因为是独立 Mesh）
    this._venusCloud.rotation.y -= 0.004;
}
```

### 3. 纹理特点

**表面纹理**（`createVenusTexture`）：
- 橙黄色渐变底色（`#e6c87a` → `#c49a4a`）
- 30 条椭圆云纹（浓厚云层）
- 南北极漩涡结构（同心弧线）
- 15 条横向云带
- 100 个径向渐变云团
- 20 个暗色椭圆区域

**云罩纹理**（`createVenusCloudTexture`）：
- 透明底色
- 150 个半透明径向渐变斑点
- 通过 `opacity: 0.5` 叠加在表面上

---

## 数据生成

```bash
python data/init_celestial.py venus 金星 Venus
```

输出：
- `data/planets/venus.json` — 7 分区 info 数据
- `data/quizzes/venus.json` — 10 道题

---

## 文件变更

| 文件 | 变更 |
|------|------|
| `static/js/planets/venus.js` | **新增**：`createVenusTexture` + `createVenusCloudTexture` |
| `data/planets/venus.json` | **新增**（init_celestial.py 生成） |
| `data/quizzes/venus.json` | **新增**（init_celestial.py 生成） |
| `static/js/main.js` | **修改**：`planetConfigs` 新增 `venus` 条目，含云罩 `onInit` + 逆向自转 `onAnimate` |

---

## 金星 vs 水星配置对比

| 参数 | 水星 | 金星 |
|------|------|------|
| `radius` | 0.6 | 0.95 |
| `axialTilt` | 0.034° | 177.4° |
| `textureGenerator` | `createMercuryTexture` | `createVenusTexture` |
| 外层效果 | 无 | 云罩球体（半径 0.98） |
| 自转方向 | 正向 | **逆向**（rotation.y -=） |
| `onInit` | 无 | 创建云罩 |
| `onAnimate` | 无 | 逆向自转 + 云罩旋转 |

---

## 框架验证

金星的成功实现验证了：

1. `CelestialSystem.onInit` 钩子：天体可添加额外 3D 元素（云罩、光环等）
2. `CelestialSystem.onAnimate` 钩子：天体可覆写/增强基类默认动画
3. `planetConfigs` 扩展性：新增天体只需加一个条目，零架构改动
4. `init_celestial.py` 通用性：同一句命令生成任何天体数据

---

## 后续天体模板

加任何新天体只需三件事（以金星为例）：

1. `python data/init_celestial.py venus 金星 Venus`
2. 写 `static/js/planets/venus.js`（导出纹理函数）
3. 在 `main.js` 的 `planetConfigs` 加一个条目（引用纹理 + 设置参数）

如果天体有特殊效果（木星大红斑、土星环+卫星、地球海洋+大气...），通过 `onInit`/`onAnimate` 扩展即可，框架本身不需要改。
