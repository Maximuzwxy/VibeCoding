# 第八阶段：火星 + 稀薄大气 + 卫星系统

## 目标

在[第五阶段](05_phase5_mercury.md)建立的框架基础上，实现火星。验证框架对**稀薄大气层**（子对象附着）和**小行星型卫星**的支持能力。

---

## 与之前天体的差异

| 特性 | 水星 | 金星 | 地球 | 火星 |
|------|------|------|------|------|
| 卫星 | 无 | 无 | 月球（1颗） | **火卫一 + 火卫二（2颗）** |
| 大气层 | 无 | 外层云罩 | 内层云（子对象） | **稀薄大气（子对象）** |
| 轴倾角 | 0.034° | 177.4° | 23.44° | **25.19°** |
| 半径 | 0.95 | 0.95 | 1.0 | **0.95** |
| 纹理 | 灰底撞击坑 | 橙黄云带漩涡 | 蓝海绿陆+冰盖 | **红褐底+极冠+峡谷+火山+陨石坑** |

---

## 框架新增能力验证

### 稀薄大气层（子对象）

火星大气极稀薄，通过一个半透明球体附着在 `centerMesh` 上实现：

```js
onInit(scene) {
    const atmoGeo = new THREE.SphereGeometry(0.98, 64, 64);
    const atmoMat = new THREE.MeshPhongMaterial({
        map: createMarsAtmosphereTexture(),
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    this.centerMesh.add(atmoMesh);  // 子对象，跟随倾角+自转
}
```

与地球云层类似，使用 `centerMesh.add()` 确保大气跟随行星任何旋转。

### 小卫星系统

火星两颗卫星（火卫一 Phobos、火卫二 Deimos）直接通过 `orbitingBodies` 配置：

```js
orbitingBodies: [
    { name: 'phobos', radius: 0.08, distance: 2.2, color: '#8b7355',
      speed: -0.008, rotationSpeed: 0.002 },
    { name: 'deimos', radius: 0.05, distance: 3.0, color: '#a0826d',
      speed: -0.004, rotationSpeed: 0.001 }
]
```

两颗卫星体积远小于地球的月球（半径 0.18），真实反映了火卫一极小（~22km）、火卫二更小（~12km）的比例关系。

---

## 配置

```js
mars: {
    centerBody: { radius: 0.95, textureGenerator: createMarsTexture, axialTilt: 25.19 },
    cameraPosition: { x: 0, y: 3, z: 7 },
    minDistance: 2, maxDistance: 15,
    starCount: 5000,
    onInit(scene) {
        // 稀薄大气层（子对象）
        const atmoGeo = new THREE.SphereGeometry(0.98, 64, 64);
        const atmoMat = new THREE.MeshPhongMaterial({
            map: createMarsAtmosphereTexture(),
            transparent: true, opacity: 0.3, side: THREE.DoubleSide
        });
        this.centerMesh.add(new THREE.Mesh(atmoGeo, atmoMat));
    },
    orbitingBodies: [
        { name: 'phobos', radius: 0.08, distance: 2.2, color: '#8b7355',
          speed: -0.008, rotationSpeed: 0.002 },
        { name: 'deimos', radius: 0.05, distance: 3.0, color: '#a0826d',
          speed: -0.004, rotationSpeed: 0.001 }
    ]
}
```

---

## 纹理生成

### 表面（createMarsTexture）

- 红褐色渐变底色（`#c15a3a` → `#b7410e`）
- **北极冰盖**：白色椭圆 + 径向渐变光晕
- **南极冰盖**：较小白色椭圆
- **水手峡谷**（Valles Marineris）：暗色椭圆 `#8b3a1e`
- **奥林匹斯山**（Olympus Mons）：双重圆形结构（外圈 `#8b3a1e` + 内圈 `#6b2a0e`），带高亮描边 `#d46a4a`
- **陨石坑**：150 个随机大小圆形，带描边
- **暗色区域**：30 个随机椭圆斑

### 大气层（createMarsAtmosphereTexture）

- 极淡的橙色径向渐变（512x256）
- 中心 `rgba(193, 90, 58, 0.05)` → 边缘透明
- 通过 `opacity: 0.3` 叠加，呈现极稀薄效果

---

## 数据生成

```bash
python data/init_celestial.py mars 火星 Mars
```

---

## 文件变更

| 文件 | 变更 |
|------|------|
| `static/js/planets/mars.js` | **新增**：`createMarsTexture` + `createMarsAtmosphereTexture` |
| `data/planets/mars.json` | **新增**（init_celestial.py 生成） |
| `data/quizzes/mars.json` | **新增**（init_celestial.py 生成） |
| `static/js/main.js` | **修改**：`planetConfigs.mars` + 全景模式 `orbitingBodies` 加火星条目 |

---

## 火星 vs 地球配置对比

| 参数 | 地球 | 火星 |
|------|------|------|
| `radius` | 1.0 | 0.95 |
| `axialTilt` | 23.44° | 25.19° |
| 大气/云层 | 云层子对象（opacity 0.4） | 大气子对象（opacity 0.3） |
| 卫星数量 | 1（月球） | 2（火卫一 + 火卫二） |
| 卫星半径 | 0.18 | 0.08 / 0.05 |
| 纹理特征 | 海洋大陆+冰盖+沙漠 | 红褐底+极冠+峡谷+火山+陨石坑 |

---

## 框架验证

火星的成功实现验证了：

1. **多卫星系统**：`orbitingBodies` 支持任意数量的卫星，零额外代码
2. **稀薄大气表现**：`onInit` + 子对象 + 低 opacity 实现极薄大气效果
3. **纹理多样性**：火星纹理包含多种地质特征（冰盖、峡谷、火山、陨石坑），CanvasTexture 方案完全可以胜任
4. **框架复用性**：火星实现完全遵循三步流程，与其他天体一致

---

## 新增天体的标准化程度

火星再次验证：加一个新天体只需 **3 步**：

1. `python data/init_celestial.py mars 火星 Mars`
2. 写 `static/js/planets/mars.js`（导出纹理函数 + 可选大气层纹理）
3. 在 `main.js` 的 `planetConfigs` 加一个条目

无论天体有大气层、多卫星、特殊地质特征，都通过 `onInit`/`orbitingBodies` 配置搞定。
