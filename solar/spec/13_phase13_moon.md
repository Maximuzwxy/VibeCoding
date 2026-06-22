# 第十三阶段：卫星系统框架 + 月球

## 目标

启动卫星纹理系统的第一阶段。验证 `CelestialSystem.addOrbitingBody()` 对卫星 `textureGenerator` 的支持能力（框架已内置支持，无需改动），率先实现月球纹理特写。同时建立后续所有卫星的标准流程。

---

## 框架能力验证

### CelestialSystem 已内置卫星纹理支持

`addOrbitingBody()` 方法从 Phase 1 起就支持三个纹理来源：

```js
if (texturePath)       → TextureLoader 加载外部图片
else if (textureGenerator) → 调用函数生成 CanvasTexture
else                    → MeshStandardMaterial 纯色
```

**本次零框架改动**，仅需在 `orbitingBodies` 配置中添加 `textureGenerator` 字段即可。

### 卫星纹理生成模式

与行星纹理相同的 CanvasTexture 模式，导出纯纹理函数：

```js
// static/js/moons/moon.js
export function createMoonTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    // ... 月球表面特征绘制 ...
    return new THREE.CanvasTexture(canvas);
}
```

在配置中引用：

```js
orbitingBodies: [
    { name: 'moon', radius: 0.18, distance: 2.5, color: '#888888',
      speed: -0.005, rotationSpeed: 0.001,
      textureGenerator: createMoonTexture }
]
```

---

## 月球纹理（参照 solar-system 优化）

### 表面特征

- **灰色底色**：7 段纵向渐变（`#a8a8a8` ↔ `#c0c0c0`），比参照代码 3 段更丰富
- **月海（暗色玄武岩平原）**：
  - 风暴洋（Oceanus Procellarum）：`ellipse(600, 520, 350, 200)`
  - 雨海（Mare Imbrium）：`ellipse(900, 450, 150, 100)`
  - 静海（Mare Tranquillitatis）：`ellipse(1100, 500, 120, 80)`
  - 澄海（Mare Serenitatis）：`ellipse(1050, 400, 100, 70)`
  - 危海（Mare Crisium）：`ellipse(1300, 420, 100, 80)`
  - 丰富海（Mare Fecunditatis）：`ellipse(1350, 550, 90, 70)`
  - 月海边缘过渡层（优化）：`ellipse(700, 510, 280, 180)`（`#707070`）
- **大型撞击坑**：第谷坑 + 哥白尼坑 + 开普勒坑
- **第谷辐射纹**：16 条放射状亮线
- **小型撞击坑**：300 个随机斑
- **高地亮区**：60 个随机椭圆（优化：比参照多 10 个）

### 配置

```js
planetConfigs.earth.orbitingBodies[0] = {
    name: 'moon', radius: 0.18, distance: 2.5, color: '#888888',
    speed: -0.005, rotationSpeed: 0.001,
    textureGenerator: createMoonTexture
}
```

`CelestialSystem.addOrbitingBody()` 检测到 `textureGenerator` 后将自动使用 `MeshPhongMaterial` + CanvasTexture，材质参数：`bumpScale: 0.05, specular: 0x333333, shininess: 5`（适合无大气岩石天体）。

---

## 数据生成

```bash
python data/init_celestial.py moon 月球 Moon
```

月球数据生成到 `data/planets/moon.json` 和 `data/quizzes/moon.json`。

---

## 文件变更

| 文件 | 变更 |
|------|------|
| `static/js/moons/moon.js` | **新增**：`createMoonTexture` |
| `data/planets/moon.json` | **新增**（init_celestial.py 生成） |
| `data/quizzes/moon.json` | **新增**（init_celestial.py 生成） |
| `static/js/main.js` | **修改**：新增 import + 月球 `orbitingBodies` 加 `textureGenerator` |

---

## 新增卫星的标准流程

后续所有卫星照此执行：

1. `python data/init_celestial.py <moon_id> 中文名 EnglishName`
2. 写 `static/js/moons/<name>.js`（导出 `create<Name>Texture` 函数）
3. 在 `main.js` 对应行星的 `orbitingBodies` 中添加 `textureGenerator` 字段

框架无需任何改动。

---

## 后续卫星规划

| 阶段 | 行星 | 卫星 | 特点 |
|------|------|------|------|
| 14 | 木星 | Io, Europa, Ganymede, Callisto | 4颗伽利略卫星，各具特色纹理 |
| 15 | 土星 | Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus | 7颗，Titan + Enceladus 独立纹理 |
| 16 | 火星+天王+海王 | Phobos, Deimos, Miranda, Ariel, Umbriel, Titania, Oberon, Triton | 8颗收尾 |
