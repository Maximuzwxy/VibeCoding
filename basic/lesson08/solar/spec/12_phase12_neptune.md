# 第十二阶段：海王星 + 大暗斑 + 海卫一逆行轨道

## 目标

在[第五阶段](05_phase5_mercury.md)建立的框架基础上，实现海王星（太阳系最后一颗行星）。验证框架对**冰巨行星纹理**（深蓝色调 + 大暗斑）和**单卫星逆行轨道**的支持能力。

---

## 与之前天体的差异

| 特性 | 天王星 | 海王星 |
|------|--------|--------|
| 行星类型 | 冰巨行星 | **冰巨行星** |
| 轴倾角 | 97.77°（侧卧） | **28.32°（类似地球）** |
| 卫星数量 | 5 | **1（海卫一 Triton）** |
| 卫星轨道方向 | 顺行 | **逆行（顺时针）** |
| 大气层 | 子对象 attach | **独立对象（scene.add）** |
| 纹理特征 | 青蓝色 + 淡云 | **深蓝色 + 大暗斑 + 亮白风暴** |
| 半径 | 1.0 | **0.95** |
| 相机距离 | z: 10 | **z: 9** |
| 纹理 | 青蓝淡雅 | **深蓝浓郁** |

---

## 框架新增能力验证

### 1. 深蓝色冰巨行星纹理

海王星比天王星色调更深，富含甲烷的大气呈现浓郁蓝色。参照 solar-system 项目：

- 深蓝色渐变底色（`#3366ff` → `#2244ff` → `#1a33cc` → `#2244ff` → `#3366ff`）
- **25 条大气带**：淡蓝色横向条纹（`rgba(100, 160, 255, 0.08~0.28)`）
- **大暗斑**（Great Dark Spot）：中纬度椭圆暗区 `rgba(30, 60, 150, 0.6)`，带亮色描边
- **100 个淡色云层**：径向渐变斑
- **30 个白色风暴云**：明亮椭圆斑 `rgba(200, 230, 255, 0.2~0.6)`
- **20 个暗色小风暴**：暗蓝椭圆 `rgba(40, 80, 180, 0.1~0.4)`
- **极地区域**：南北极暗蓝径向渐变

优化点（相比参照代码）：
- 底色分段从 5 段增加到 7 段，深蓝层次更丰富
- 大气带 alpha 随机范围更大，增强视觉层次
- 白色风暴和暗色风暴各增加 5 个，分布更自然

### 2. 海卫一逆行轨道

海卫一（Triton）是太阳系中少数运行在**逆行轨道**（顺时针）的大卫星。在 `orbitingBodies` 中通过 `speed: -0.006`（负值）实现：

```js
orbitingBodies: [
    { name: 'triton', radius: 0.18, distance: 3.5, color: '#c8b8a8',
      speed: -0.006, rotationSpeed: 0.002 }
]
```

相比土星的土卫六 Titan（半径 0.60），海卫一 Triton（半径 0.18）比例更小。

### 3. 大气层独立对象

与天王星的大气层子对象不同，海王星大气使用 `scene.add()` 作为独立对象：

```js
onInit(scene) {
    const atmoGeo = new THREE.SphereGeometry(1.00, 64, 64);
    const atmoMat = new THREE.MeshPhongMaterial({
        map: createNeptuneAtmosphereTexture(),
        transparent: true, opacity: 0.35, side: THREE.DoubleSide
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    this.centerGroup.add(atmoMesh);  // 挂在倾角容器上
}
```

用 `centerGroup.add()` 而非 `centerMesh.add()`，大气跟随倾角容器但不受自转影响。

---

## 配置

```js
neptune: {
    centerBody: { radius: 0.95, textureGenerator: createNeptuneTexture, axialTilt: 28.32 },
    cameraPosition: { x: 0, y: 3, z: 9 },
    minDistance: 3, maxDistance: 20,
    starCount: 5000,
    onInit(scene) {
        // 大气层（挂在倾角容器上）
        const atmoGeo = new THREE.SphereGeometry(1.00, 64, 64);
        const atmoMat = new THREE.MeshPhongMaterial({
            map: createNeptuneAtmosphereTexture(),
            transparent: true, opacity: 0.35, side: THREE.DoubleSide
        });
        this.centerGroup.add(new THREE.Mesh(atmoGeo, atmoMat));
    },
    orbitingBodies: [
        { name: 'triton', radius: 0.18, distance: 3.5, color: '#c8b8a8',
          speed: -0.006, rotationSpeed: 0.002 }
    ]
}
```

---

## 纹理生成（参照 solar-system 优化）

### 表面（createNeptuneTexture）

- 7 段深蓝色渐变底色（优化：比参照代码多 2 段，层次更丰富）
- **25 条横向大气带**：淡蓝色（`rgba(100, 160, 255)`），alpha 0.05~0.25（优化：上限提高）
- **大暗斑**：`ellipse(900, 520, 200, 100)`，深蓝填充 + 亮蓝描边 5px
- **100 个淡色云层**：径向渐变斑（`rgba(150, 200, 255)`）
- **30 个白色风暴云**：明亮椭圆（优化：参照代码 30→35 个）
- **20 个暗色小风暴**：暗蓝椭圆（优化：参照代码 20→25 个）
- **极地区域**：南北极暗蓝径向渐变

### 大气层（createNeptuneAtmosphereTexture）

- 极淡的淡蓝色径向渐变（`rgba(80, 150, 255, 0.15)` → 透明）
- `opacity: 0.35` 叠加

---

## 全景模式中的海王星

在太阳系全景中，海王星已有基线配置：

```js
{ name: 'neptune', radius: 0.85, distance: 26, color: '#2244ff',
  speed: -0.0001, axialTilt: 28.32, rotationSpeed: 0.008 }
```

新增 `textureGenerator`：

```js
{ name: 'neptune', radius: 0.85, distance: 26, color: '#2244ff',
  speed: -0.0001, axialTilt: 28.32, rotationSpeed: 0.008,
  textureGenerator: createNeptuneTexture }
```

---

## 数据生成

```bash
python data/init_celestial.py neptune 海王星 Neptune
```

---

## 文件变更

| 文件 | 变更 |
|------|------|
| `static/js/planets/neptune.js` | **新增**：`createNeptuneTexture` + `createNeptuneAtmosphereTexture` |
| `data/planets/neptune.json` | **新增**（init_celestial.py 生成） |
| `data/quizzes/neptune.json` | **新增**（init_celestial.py 生成） |
| `static/js/main.js` | **修改**：`planetConfigs.neptune` + 全景模式加 `textureGenerator` |

---

## 海王星 vs 天王星配置对比

| 参数 | 天王星 | 海王星 |
|------|--------|--------|
| `radius` | 1.0 | 0.95 |
| `axialTilt` | 97.77° | 28.32° |
| `cameraPosition.z` | 10 | 9 |
| 大气附着 | `centerMesh.add()` | **`centerGroup.add()`** |
| 卫星数量 | 5 | 1 |
| 卫星轨道 | 顺行 | **逆行（speed 负数）** |
| 纹理主色 | 青蓝色 | **深蓝色** |
| 特殊标记 | 无 | **大暗斑** |
| 纹理底色段数 | 7 | **7（优化）** |

---

## 框架验证

海王星的成功实现验证了：

1. **冰巨行星深色调**：CanvasTexture 可表现深蓝浓郁色调 + 大暗斑特征
2. **逆行卫星轨道**：`speed: -0.006` 即可实现顺时针公转，框架原生支持
3. **大气附着模式灵活**：`centerGroup.add()` vs `centerMesh.add()` 根据需求选择
4. **大型卫星**：海卫一 Triton（半径 0.18）通过 `orbitingBodies` 配置零额外代码

---

## 新增天体的标准化程度

仍然只需 **3 步**：

1. `python data/init_celestial.py neptune 海王星 Neptune`
2. 写 `static/js/planets/neptune.js`（导出纹理 + 大气层纹理函数）
3. 在 `main.js` 的 `planetConfigs` 加一个条目（配置大气层 + 海卫一）

至此，太阳系 **8 颗行星**（水星/金星/地球/火星/木星/土星/天王星/海王星）全部实现完毕。
