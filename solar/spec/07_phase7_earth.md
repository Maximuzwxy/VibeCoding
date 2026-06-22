# 第七阶段：地球 + 月球卫星系统

## 目标

在[第五阶段](05_phase5_mercury.md)建立的框架基础上，实现地球。验证框架对**卫星系统**和**多层纹理叠加**（表面 + 云层）的支持能力。

---

## 与之前天体的差异

| 特性 | 水星 | 金星 | 地球 |
|------|------|------|------|
| 卫星 | 无 | 无 | **月球（1 颗）** |
| 云层 | 无 | 外层云罩（半透明球体） | **内层云（mesh 子对象）** |
| 轴倾角 | 0.034° | 177.4° | **23.44°** |
| 半径 | 0.95 | 0.95 | **1.0** |
| 纹理 | 灰底撞击坑 | 橙黄云带漩涡 | **蓝海绿陆+冰盖** |

---

## 框架新增能力验证

### 卫星系统（orbitingBodies）

地球的月球直接通过 `planetConfigs.earth.orbitingBodies` 配置，零额外代码：

```js
orbitingBodies: [
    { name: 'moon', radius: 0.18, distance: 2.5, color: '#888888',
      speed: -0.005, rotationSpeed: 0.001 }
]
```

`CelestialSystem` 自动处理月球的公转轨道 + 轨道线 + 自转。

### 云层作为子对象

地球云层与金星不同——旧代码中地球云是 `earth.add(clouds)`（作为 mesh 的子对象），这样云层会跟随地球任何旋转（自转 + 倾角）。金星云是 `scene.add(clouds)`（独立对象）。

**实现**：`onInit` 中 `this.centerMesh.add(cloudMesh)`。

```js
onInit() {
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    this.centerMesh.add(cloudMesh);  // 子对象，跟随倾角+自转
}
```

---

## 配置

```js
earth: {
    centerBody: { radius: 1.0, textureGenerator: createEarthTexture, axialTilt: 23.44 },
    cameraPosition: { x: 0, y: 3, z: 6 },
    minDistance: 2, maxDistance: 15,
    starCount: 5000,
    onInit(scene) {
        // 云层（子对象，跟随自转）
        const cloudMesh = new THREE.Mesh(
            new THREE.SphereGeometry(1.02, 64, 64),
            new THREE.MeshPhongMaterial({
                map: createEarthCloudTexture(),
                transparent: true, opacity: 0.4, side: THREE.DoubleSide
            })
        );
        this.centerMesh.add(cloudMesh);
    },
    orbitingBodies: [
        { name: 'moon', radius: 0.18, distance: 2.5, color: '#888888',
          speed: -0.005, rotationSpeed: 0.001 }
    ]
}
```

---

## 纹理生成

### 表面（createEarthTexture）

- 海洋底色 `#1a4d7c`
- 五大洲绿色椭圆：亚欧 / 北美 / 南美 / 非洲 / 大洋洲
- 台湾/日本/印尼 小椭圆
- 北极 + 南极白色冰盖
- 撒哈拉沙漠 `#c4a35a` / 中亚沙漠
- 喜马拉雅山脉 `rgba(101,67,33,0.6)`
- 80 个随机绿色斑点

### 云层（createEarthCloudTexture）

- 透明底 + 200 个白色径向渐变斑

---

## 数据生成

```bash
python data/init_celestial.py earth 地球 Earth
```

---

## 文件变更

| 文件 | 变更 |
|------|------|
| `static/js/planets/earth.js` | **新增**：`createEarthTexture` + `createEarthCloudTexture` |
| `data/planets/earth.json` | **新增**（init_celestial.py 生成） |
| `data/quizzes/earth.json` | **新增**（init_celestial.py 生成） |
| `static/js/main.js` | **修改**：`planetConfigs.earth` + 全景模式加纹理 |

---

## 新增天体的标准化程度

地球实现再次验证：加一个新天体只需 **3 步**：

1. `python data/init_celestial.py earth 地球 Earth`
2. 写 `static/js/planets/earth.js`（导出纹理函数）
3. 在 `main.js` 的 `planetConfigs` 加一个条目

无论天体有没有卫星、云层、环，都通过 `onInit`/`orbitingBodies` 配置搞定，框架不需要改。
