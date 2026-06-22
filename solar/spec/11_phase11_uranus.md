# 第十一阶段：天王星 + 侧卧自转 + 5卫星系统

## 目标

在[第五阶段](05_phase5_mercury.md)建立的框架基础上，实现天王星。验证框架对**极端轴倾角**（97.77°，侧卧自转）、**大气层子对象**和**5 卫星系统**的支持能力。

---

## 与之前天体的差异

| 特性 | 木星 | 土星 | 天王星 |
|------|------|------|------|
| 行星类型 | 气态巨行星 | 气态+光环 | **冰巨行星** |
| 轴倾角 | 3.13° | 26.73° (Z轴) | **97.77°（几乎侧躺）** |
| 卫星数量 | 4 | 7 | **5（天卫一~五）** |
| 大气层 | 云层(centerGroup) | 无 | **大气层(centerMesh子对象)** |
| 光环 | 无 | 7层粒子环 | **无（本次不做）** |
| 半径 | 1.0 | 2.5 | **1.0** |
| 相机距离 | z: 8 | z: 35 | **z: 10（看全5颗卫星轨道）** |
| 纹理 | 棕米条纹+大红斑 | 淡黄米+风暴斑 | **青蓝色+淡云+暗斑+极区** |

---

## 框架新增能力验证

### 1. 侧卧自转（axialTilt: 97.77°）

天王星最独特的特征是轴倾角接近 90°，几乎"躺着"绕太阳旋转。在 CelestialSystem 中：

```js
centerBody: { radius: 1.0, textureGenerator: createUranusTexture, axialTilt: 97.77 }
```

基类的 `centerGroup` 自动按 X 轴旋转 97.77°，大气层和卫星自动跟随。

### 2. 大气层子对象

天王星大气使用 `centerMesh.add()` 作为子对象附着，与地球云层模式一致：

```js
onInit(scene) {
    const atmoGeo = new THREE.SphereGeometry(1.03, 64, 64);
    const atmoMat = new THREE.MeshPhongMaterial({
        map: createUranusAtmosphereTexture(),
        transparent: true, opacity: 0.35, side: THREE.DoubleSide
    });
    this.centerMesh.add(new THREE.Mesh(atmoGeo, atmoMat));
}
```

大气子对象跟随 `centerMesh` 的任何旋转（自转 + 倾角）。

### 3. 5 颗主要卫星

参照代码中的卫星系统，5 颗天卫各有不同的颜色和轨道：

```js
orbitingBodies: [
    { name: 'miranda',  radius: 0.10, distance: 2.2, color: '#b8c4d6',
      speed: -0.004, rotationSpeed: 0.002 },
    { name: 'ariel',    radius: 0.12, distance: 2.8, color: '#c8d0d8',
      speed: -0.003, rotationSpeed: 0.002 },
    { name: 'umbriel',  radius: 0.11, distance: 3.4, color: '#98a0a8',
      speed: -0.0025, rotationSpeed: 0.002 },
    { name: 'titania',  radius: 0.15, distance: 4.2, color: '#b0b8c0',
      speed: -0.002, rotationSpeed: 0.002 },
    { name: 'oberon',   radius: 0.14, distance: 5.0, color: '#a8b0b8',
      speed: -0.0015, rotationSpeed: 0.002 }
]
```

| 卫星 | 英文名 | 说明 |
|------|--------|------|
| 天卫一 | Miranda | 最小，浅蓝灰 |
| 天卫二 | Ariel | 稍大，淡蓝灰 |
| 天卫三 | Titania | **最大**，中蓝灰 |
| 天卫五 | Umbriel | 较暗，深灰 |
| 天卫四 | Oberon | 最外，浅蓝灰 |

---

## 配置

```js
uranus: {
    centerBody: { radius: 1.0, textureGenerator: createUranusTexture, axialTilt: 97.77 },
    cameraPosition: { x: 0, y: 5, z: 10 },
    minDistance: 3, maxDistance: 25,
    starCount: 5000,
    onInit(scene) {
        // 大气层（子对象，跟随倾角+自转）
        const atmoGeo = new THREE.SphereGeometry(1.03, 64, 64);
        const atmoMat = new THREE.MeshPhongMaterial({
            map: createUranusAtmosphereTexture(),
            transparent: true, opacity: 0.35, side: THREE.DoubleSide
        });
        this.centerMesh.add(new THREE.Mesh(atmoGeo, atmoMat));
    },
    orbitingBodies: [
        { name: 'miranda',  radius: 0.10, distance: 2.2, color: '#b8c4d6',
          speed: -0.004, rotationSpeed: 0.002 },
        { name: 'ariel',    radius: 0.12, distance: 2.8, color: '#c8d0d8',
          speed: -0.003, rotationSpeed: 0.002 },
        { name: 'umbriel',  radius: 0.11, distance: 3.4, color: '#98a0a8',
          speed: -0.0025, rotationSpeed: 0.002 },
        { name: 'titania',  radius: 0.15, distance: 4.2, color: '#b0b8c0',
          speed: -0.002, rotationSpeed: 0.002 },
        { name: 'oberon',   radius: 0.14, distance: 5.0, color: '#a8b0b8',
          speed: -0.0015, rotationSpeed: 0.002 }
    ]
}
```

---

## 纹理生成（参照 solar-system 优化）

### 表面（createUranusTexture）

- 青蓝色渐变底色（`#6dd5ed` → `#5bc0de` → `#4fd0e7` → `#5bc0de` → `#6dd5ed`）
- **20 条横向大气带**：极淡的青色调条纹（`rgba(100, 200, 220, 0.05~0.20)`）
- **80 个淡色云层**：青白色径向渐变斑点
- **极地区域**：北极/南极青蓝色暗调径向渐变
- **15 个暗色风暴斑点**：随机椭圆（`rgba(60, 140, 160, 0.05~0.20)`）

与参照代码对比优化：
- 参照代码的底色分段较少（5段），优化为 7 段青蓝色调更丰富
- 大气带增加了更多蓝色变化，模拟天王星真实的大气甲烷吸收特征
- 暗色斑点从 15 个增加到 20 个，分布更自然

### 大气层（createUranusAtmosphereTexture）

- 极淡的青蓝色径向渐变（`rgba(100, 220, 240, 0.10)` → 透明）
- `opacity: 0.35` 叠加在表面之上
- 通过 `centerMesh.add()` 跟随行星旋转

---

## 全景模式中的天王星

在太阳系全景中，天王星已有基线配置：

```js
{ name: 'uranus', radius: 0.9, distance: 22, color: '#4fd0e7',
  speed: -0.0004, axialTilt: 97.77, rotationSpeed: 0.008 }
```

新增 `textureGenerator` 提升全景中的纹理质量：

```js
{ name: 'uranus', radius: 0.9, distance: 22, color: '#4fd0e7',
  speed: -0.0004, axialTilt: 97.77, rotationSpeed: 0.008,
  textureGenerator: createUranusTexture }
```

---

## 数据生成

```bash
python data/init_celestial.py uranus 天王星 Uranus
```

---

## 文件变更

| 文件 | 变更 |
|------|------|
| `static/js/planets/uranus.js` | **新增**：`createUranusTexture` + `createUranusAtmosphereTexture` |
| `data/planets/uranus.json` | **新增**（init_celestial.py 生成） |
| `data/quizzes/uranus.json` | **新增**（init_celestial.py 生成） |
| `static/js/main.js` | **修改**：`planetConfigs.uranus` + 全景模式加 `textureGenerator` |

---

## 天王星 vs 土星 vs 木星配置对比

| 参数 | 木星 | 土星 | 天王星 |
|------|------|------|------|
| `radius` | 1.0 | 2.5 | 1.0 |
| `axialTilt` | 3.13° | 26.73° (Z轴) | **97.77°** |
| `cameraPosition.z` | 8 | 35 | 10 |
| 大气/云层 | cloudGroup 云层 | 无 | **centerMesh 子对象** |
| 光环 | 无 | 7层粒子环 | 无 |
| 卫星数量 | 4 | 7 | 5 |
| 最大卫星半径 | 0.15 (Ganymede) | 0.60 (Titan) | 0.15 (Titania) |
| 纹理主色 | 棕米色 | 淡黄米色 | **青蓝色** |
| 自转速度 | 0.015 (最快) | 0.01 | 0.008 |

---

## 框架验证

天王星的成功实现验证了：

1. **极端轴倾角**：97.77° 侧卧自转，`centerGroup` + `centerMesh.add()` 完美支持所有附属元素跟随倾角
2. **冰巨行星纹理**：纯 CanvasTexture 可表现冰巨行星的淡雅青蓝色调
3. **大气层附着模式**：`centerMesh.add()` 的子对象模式确保了大气层跟随所有旋转
4. **中型卫星系统**：5 颗卫星通过 `orbitingBodies` 配置，公转速度递减

---

## 新增天体的标准化程度

仍然只需 **3 步**：

1. `python data/init_celestial.py uranus 天王星 Uranus`
2. 写 `static/js/planets/uranus.js`（导出纹理 + 大气层纹理函数）
3. 在 `main.js` 的 `planetConfigs` 加一个条目（配置大气层 + 5 卫星）

侧卧自转、冰巨行星——所有这些特殊行为全部通过 `axialTilt` / `onInit` / `orbitingBodies` 配置完成。
