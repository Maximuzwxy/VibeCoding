# 第九阶段：木星 + 气态巨行星 + 伽利略卫星系统

## 目标

在[第五阶段](05_phase5_mercury.md)建立的框架基础上，实现木星。验证框架对**气态巨行星**（大半径、快速自转）和**4 颗伽利略卫星**的支持能力。

---

## 与之前天体的差异

| 特性 | 水星 | 金星 | 地球 | 火星 | 木星 |
|------|------|------|------|------|------|
| 行星类型 | 岩石 | 岩石 | 岩石 | 岩石 | **气态巨行星** |
| 卫星 | 无 | 无 | 1颗 | 2颗 | **4颗伽利略卫星** |
| 云层 | 无 | 外层云罩 | 内层云 | 稀薄大气 | **云层（centerGroup）** |
| 轴倾角 | 0.034° | 177.4° | 23.44° | 25.19° | **3.13°** |
| 半径 | 0.95 | 0.95 | 1.0 | 0.95 | **1.0（最大显示）** |
| 自转速度 | 慢 | 逆向中速 | 中速 | 中速 | **极快（rotationSpeed 0.015）** |
| 纹理 | 灰底撞击坑 | 橙黄云带 | 蓝海绿陆 | 红褐地质 | **棕米色条纹+大红斑+涡流** |

---

## 框架新增能力验证

### 气态巨行星纹理

木星没有固体表面，纹理完全由大气带、条纹和漩涡组成：

- 棕米色渐变底色（10 段纵向渐变 `#c9a86c` → `#a67c52`）
- **6 条横条纹带**（`rgba(139, 90, 43)` 系列），模拟木星标志性云带
- **大红斑**：赤道区域红色椭圆（`rgba(178, 34, 34, 0.6)`），带深红描边
- **200 个白色涡流斑点**：模拟大气中的小涡流

### 云层（centerGroup 附着）

木星云层与金星云罩类似，但挂载位置不同：

| 天体 | 云层挂载位置 | 原因 |
|------|-------------|------|
| 金星 | `centerGroup.add()` | 跟随轴倾角容器 |
| 地球 | `centerMesh.add()` | 子对象，跟随倾角+自转 |
| 木星 | **`centerGroup.add()`** | 跟随轴倾角容器 |

```js
onInit(scene) {
    const cloudGeo = new THREE.SphereGeometry(1.02, 64, 64);
    const cloudMat = new THREE.MeshPhongMaterial({
        map: createJupiterCloudTexture(),
        transparent: true, opacity: 0.4, side: THREE.DoubleSide
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    this.centerGroup.add(cloudMesh);  // 挂在倾角容器上
}
```

木星云层纹理包含 300 个半透明白色径向渐变斑点（1024x512），opacity 0.4 叠加。

### 伽利略卫星（4 颗）

```js
orbitingBodies: [
    { name: 'io',      radius: 0.12, distance: 1.8, color: '#ffffcc',
      speed: -0.006, rotationSpeed: 0.003 },
    { name: 'europa',  radius: 0.11, distance: 2.4, color: '#ccddff',
      speed: -0.0045, rotationSpeed: 0.002 },
    { name: 'ganymede',radius: 0.15, distance: 3.0, color: '#aaaaaa',
      speed: -0.003, rotationSpeed: 0.002 },
    { name: 'callisto',radius: 0.14, distance: 3.6, color: '#886644',
      speed: -0.002, rotationSpeed: 0.001 }
]
```

颜色反映了各卫星的实际特征：
- **木卫一 Io**：淡黄 `#ffffcc`（硫磺火山表面）
- **木卫二 Europa**：淡蓝 `#ccddff`（冰壳表面）
- **木卫三 Ganymede**：灰色 `#aaaaaa`（冰岩混合，太阳系最大卫星）
- **木卫四 Callisto**：棕灰 `#886644`（古老撞击坑表面）

公转速度递减（内快外慢），自转速度也递减，符合真实物理规律。

---

## 配置

```js
jupiter: {
    centerBody: { radius: 1.0, textureGenerator: createJupiterTexture, axialTilt: 3.13 },
    cameraPosition: { x: 0, y: 3, z: 8 },
    minDistance: 3, maxDistance: 20,
    starCount: 5000,
    onInit(scene) {
        // 云层（独立对象挂在 centerGroup）
        const cloudMesh = new THREE.Mesh(
            new THREE.SphereGeometry(1.02, 64, 64),
            new THREE.MeshPhongMaterial({
                map: createJupiterCloudTexture(),
                transparent: true, opacity: 0.4, side: THREE.DoubleSide
            })
        );
        this.centerGroup.add(cloudMesh);
    },
    orbitingBodies: [
        { name: 'io', radius: 0.12, distance: 1.8, color: '#ffffcc',
          speed: -0.006, rotationSpeed: 0.003 },
        { name: 'europa', radius: 0.11, distance: 2.4, color: '#ccddff',
          speed: -0.0045, rotationSpeed: 0.002 },
        { name: 'ganymede', radius: 0.15, distance: 3.0, color: '#aaaaaa',
          speed: -0.003, rotationSpeed: 0.002 },
        { name: 'callisto', radius: 0.14, distance: 3.6, color: '#886644',
          speed: -0.002, rotationSpeed: 0.001 }
    ]
}
```

---

## 纹理生成

### 表面（createJupiterTexture）

- 10 段棕米色纵向渐变（`#c9a86c` / `#b8956a` / `#a67c52` / `#d4b896`）
- 6 条横条纹带（`rgba(139, 90, 43, 0.3~0.4)`），覆盖不同 y 区域
- **大红斑**：`ellipse(1700, 580, 80, 50)`，红色填充 `rgba(178,34,34,0.6)` + 深红描边 3px
- 200 个白色涡流斑点（半径 5~25）

### 云层（createJupiterCloudTexture）

- 透明底色（1024x512）
- 300 个白色径向渐变斑点（半径 20~70）
- `opacity: 0.4` 叠加在表面之上

---

## 全景模式中的木星

在太阳系全景中，木星是最大的行星（半径 1.5），轨道距离 14：

```js
{ name: 'jupiter', radius: 1.5, distance: 14, color: '#d8ca9d',
  speed: -0.002, axialTilt: 3.13, rotationSpeed: 0.015,
  textureGenerator: createJupiterTexture }
```

---

## 数据生成

```bash
python data/init_celestial.py jupiter 木星 Jupiter
```

---

## 文件变更

| 文件 | 变更 |
|------|------|
| `static/js/planets/jupiter.js` | **新增**：`createJupiterTexture` + `createJupiterCloudTexture` |
| `data/planets/jupiter.json` | **新增**（init_celestial.py 生成） |
| `data/quizzes/jupiter.json` | **新增**（init_celestial.py 生成） |
| `static/js/main.js` | **修改**：`planetConfigs.jupiter` + 全景模式 `orbitingBodies` 加木星条目 |

---

## 木星 vs 金星云层对比

| 特性 | 金星云罩 | 木星云层 |
|------|---------|---------|
| 挂载位置 | `centerGroup.add()` | `centerGroup.add()` |
| 云层纹理 | 150 个斑点 | 300 个斑点 |
| opacity | 0.5 | 0.4 |
| 额外旋转 | `onAnimate` 中独立旋转 | 无额外旋转（跟随倾角容器） |

---

## 框架验证

木星的成功实现验证了：

1. **气态巨行星适配**：纯大气纹理 + 条纹带 + 大红斑，CanvasTexture 可表现复杂大气特征
2. **多卫星系统**：4 颗伽利略卫星通过 `orbitingBodies` 配置，公转速度内快外慢
3. **云层附着策略灵活**：`centerGroup.add()` vs `centerMesh.add()` 根据天体特性选择
4. **快速自转**：`rotationSpeed: 0.015` 是地球的 1.5 倍，表现木星 10 小时自转周期

---

## 新增天体的标准化程度

加一个新天体只需 **3 步**：

1. `python data/init_celestial.py jupiter 木星 Jupiter`
2. 写 `static/js/planets/jupiter.js`（导出纹理 + 云层纹理函数）
3. 在 `main.js` 的 `planetConfigs` 加一个条目（配置云层 + 卫星）
