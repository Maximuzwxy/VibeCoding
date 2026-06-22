# 第五阶段：水星 + 天体场景切换框架

## 目标

在太阳系全景基础上，实现点击天体图标后**场景切换**——天体居中展示、近距离观测、带纹理渲染。同时建立通用的天体新增流程，后续所有行星/卫星均参照此流程。

以**水星**为第一个示例，验证整个框架的可行性。

---

## CelestialSystem 的两种用法

`CelestialSystem` 是通用基类，同一套代码支持两种模式：

### 模式 A：太阳系全景

```js
// 太阳居中，八大行星环绕
new CelestialSystem({
    centerBody: { radius: 2, color: 0xffdd00, ... },
    orbitingBodies: [ mercury, venus, earth, ... ],  // 8 颗行星
    starCount: 10000,
    cameraPosition: { x: 0, y: 30, z: 50 },
    minDistance: 10,
    maxDistance: 200
});
```

### 模式 B：行星特写

```js
// 行星居中，近距离相机，可加卫星
new CelestialSystem({
    centerBody: { radius: 1.2, textureGenerator: createMercuryTexture },
    orbitingBodies: [],  // 水星无卫星，后续天体在此加
    starCount: 5000,
    cameraPosition: { x: 0, y: 1.5, z: 4 },
    minDistance: 1.5,
    maxDistance: 10
});
```

**关键点**：同一基类，不同配置。全景模式用 `color`，特写模式用 `textureGenerator`。

---

## 场景切换流程

`main.js` 中 `switchScene(mode)` 函数负责：

```
用户点击天体图标
    ↓
1. 更新 CSS 主题色（--theme-color / --theme-color-rgb）
    ↓
2. 加载对应 info 数据（InfoPanel.load）
    ↓
3. 加载对应题库（QuizPanel.load）
    ↓
4. 切换 3D 场景（switchScene）
       ├── mode === 'sun'  → 用 solarSystemConfig（全景）
       └── mode === 'xxx'  → 用 planetDetailConfig(xxx)（特写）
            ↓
        currentSystem.clear()  // 销毁旧场景，释放 GPU 资源
            ↓
        new CelestialSystem(config).init()
```

### 核心代码

```js
let currentSystem = null;
let currentMode = 'sun';

function switchScene(mode) {
    if (currentMode === mode) return;  // 同模式不重建
    currentMode = mode;
    if (currentSystem) { currentSystem.clear(); currentSystem = null; }
    const config = mode === 'sun' ? solarSystemConfig : planetDetailConfig(mode);
    currentSystem = new CelestialSystem(config);
    currentSystem.init('scene-container');
}

function planetDetailConfig(planetId) {
    const textures = { mercury: createMercuryTexture /* 后续添加其他 */ };
    return {
        centerBody: { radius: 1.2, textureGenerator: textures[planetId] },
        orbitingBodies: [],   // 后续在此添加该天体的卫星
        starCount: 5000,
        cameraPosition: { x: 0, y: 1.5, z: 4 },
        minDistance: 1.5, maxDistance: 10
    };
}
```

---

## 纹理生成（textureGenerator）

每个天体有一个独立的 JS 文件导出纹理生成函数，放在 `static/js/planets/` 下。

### mercury.js 示例

```js
// static/js/planets/mercury.js
import * as THREE from 'three';

export function createMercuryTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    // ... 灰色渐变、卡洛里盆地、撞击坑、辐射纹、暗色区域 ...
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}
```

### CelestialSystem 如何处理 textureGenerator

```
addOrbitingBody(config) / _createCenterBody(config)
    ↓
if (texturePath)            → TextureLoader 加载外部图片
else if (textureGenerator)  → 调用函数生成 CanvasTexture + MeshPhongMaterial
else                        → MeshBasicMaterial 纯色
```

`textureGenerator` 既可用于 `orbitingBodies`（太阳系全景中的行星纹理），也可用于 `centerBody`（行星特写模式）。

---

## 主题色系统

### CSS 变量

```css
:root {
    --theme-color: #ffdd00;           /* 初始太阳色 */
    --theme-color-rgb: 255, 221, 0;
    --theme-border: rgba(...);
    --theme-glow: rgba(...);
    /* ... InfoPanel / QuizPanel / ChatPanel 均引用这些变量 ... */
}
```

### 点击天体时更新

```js
function applyTheme(color) {
    document.documentElement.style.setProperty('--theme-color', color);
    // hex → RGB → --theme-color-rgb
}
```

效果：InfoPanel 边框/发光/按钮色、QuizPanel 按钮/进度条、ChatPanel 搜索框/发送按钮 全部自动切换为天体对应主题色。

**每个天体的主题色定义在 `data/planets/{id}.json` 的 `theme_color` 字段**，蓝色给地球、橙色给木星、金色给太阳。

---

## 数据初始化（init_celestial.py）

不手动编写天体数据，统一使用工具生成。

### 用法

```bash
python data/init_celestial.py mercury 水星 Mercury
```

### 流程

```
init_celestial.py
    ├── Prompt 1 → DeepSeek → data/planets/{id}.json（info_sections）
    └── Prompt 2 → DeepSeek → data/quizzes/{id}.json（10 道题）
```

### 生成的数据结构

**info 数据** (`data/planets/mercury.json`)：
- `id`, `name`, `icon`, `theme_color`
- `info_sections[]`：📊基本参数 / 🕐时间参数 / 🌡环境参数 / 📍位置参数 / 🌑卫星系统 / 🌋地表特征 / 🔭探索历史

**题库** (`data/quizzes/mercury.json`)：
- `questions[]`：10 道四选一选择题，中英双语，答案分布均匀

---

## 新增天体的标准流程（后续所有天体照此执行）

以水星为例：

| 步骤 | 操作 | 产物 |
|------|------|------|
| 1 | `python data/init_celestial.py mercury 水星 Mercury` | `data/planets/mercury.json` + `data/quizzes/mercury.json` |
| 2 | 创建 `static/js/planets/mercury.js`，导出 `createMercuryTexture()` | 纹理生成函数 |
| 3 | 在 `main.js` 的 `planetDetailConfig` 中注册纹理 | `mercury: createMercuryTexture` |
| 4 | 该天体的卫星填入 `planetDetailConfig.orbitingBodies` | 水星无卫星，为空数组 |
| 5 | 确保 `index.html` 中已有点击图标（`data-planet`, `data-color`） | 已有，无需改 |
| 6 | `python tests/run_all_tests.py` 验证 | 全绿 |

---

## 文件变更清单（水星）

| 文件 | 变更 |
|------|------|
| `static/js/planets/mercury.js` | **新增**：水星纹理生成（Canvas 绘制） |
| `data/planets/mercury.json` | **新增**：水星 info 数据（DeepSeek 生成） |
| `data/quizzes/mercury.json` | **新增**：水星题库 10 题（DeepSeek 生成） |
| `data/init_celestial.py` | **新增**：通用天体数据初始化工具 |
| `static/js/celestial-system.js` | **修改**：`_createCenterBody` 和 `addOrbitingBody` 均支持 `textureGenerator` |
| `static/js/main.js` | **修改**：添加 `switchScene`/`planetDetailConfig`/`applyTheme`，实现场景切换+主题色切换 |

---

## 测试要点

- [ ] 太阳系全景正常：日心 8 行星公转，小行星带旋转
- [ ] 点击水星图标：水星居中，近距离，纹理可见（卡洛里盆地、撞击坑）
- [ ] 点击太阳图标：恢复全景
- [ ] 主题色切换：InfoPanel 边框/QuizPanel 按钮自动变色
- [ ] InfoPanel 显示水星 7 个信息分区（中英双语）
- [ ] QuizPanel 加载 10 道水星题
- [ ] 水星自转正常
