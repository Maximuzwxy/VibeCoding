# 太阳系 3D 互动探索平台

## 项目概述

一个基于 Web 的太阳系 3D 互动探索平台，用户可以探索太阳系中的行星、卫星，了解它们的基本参数，探索历史等。支持中英文双语、知识问答、大模型对话等功能。

---

## ⚠️ 重要约定：旋转方向定义

### Three.js 坐标系说明
- Y轴朝上
- 从 Y轴正方向俯视 XZ 平面
- 公转：物体绕太阳运动（改变 position），绕 Y轴进行
- 自转：物体自身旋转（改变 rotation.y）

### 旋转方向定义

#### 公转（Orbital Revolution）
| 变量 | 操作 | 方向 | 说明 |
|------|------|------|------|
| angle | **+= speed（负数）** | **逆时针** | 从北极俯视，角度递减 |
| angle | += speed（正数） | 顺时针 | 从北极俯视，角度递增 |

**公转实现原理：**
```javascript
// angle 递减 = 逆时针公转
planet.angle += planet.speed;  // speed 为负数时，angle 递减
planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
```

#### 自转（Rotation）
| 变量 | 操作 | 方向 | 说明 |
|------|------|------|------|
| rotation.y | **+= speed（正数）** | **逆时针** | 从北极俯视，物体顺时针旋转（实际是自转轴逆时针） |
| rotation.y | += speed（负数） | 顺时针 | 从北极俯视，物体逆时针旋转 |

**自转实现原理：**
```javascript
// rotation.y 正数增加 = 逆时针自转
planet.mesh.rotation.y += 0.01;  // 正数 = 逆时针
sun.rotation.y += 0.001;         // 太阳自转，正数 = 逆时针
```

### 太阳系实际旋转方向
- **所有行星公转**：逆时针（speed 负数，让 angle 递减）
- **地球自转**：逆时针（rotation.y 正数增加）
- **金星自转**：顺时针（retrograde，rotation.y 负数增加）
- **天王星自转**：顺时针（retrograde，rotation.y 负数增加）
- **其他行星自转**：逆时针（rotation.y 正数增加）

### 代码示例
```javascript
const planetData = [
    { name: '水星', radius: 0.4, distance: 4, color: 0xb5b5b5, speed: -0.04 },  // 公转 speed 负数 = 逆时针
    { name: '地球', radius: 0.65, distance: 8, color: 0x4da6ff, speed: -0.01 },
    { name: '金星', radius: 0.6, distance: 6, color: 0xffc649, speed: -0.015, rotationSpeed: 0.002 },  // rotationSpeed 正数 = 逆时针（但金星实际是 retrograde）
    // ...
];

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    
    // 太阳自转：正数 = 逆时针
    sun.rotation.y += 0.001;
    
    planets.forEach(planet => {
        // 公转：speed 负数 = 逆时针
        planet.angle += planet.speed;
        planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
        planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
        
        // 自转：正数 = 逆时针
        planet.mesh.rotation.y += 0.01;
    });
}

// 金星自转（顺时针，retrograde）
venus.rotation.y -= 0.002;  // 负数 = 顺时针
```

---

## 项目结构

```
solar-system/
├── app.py                    # Flask 后端
├── data/
│   ├── solar_system.json     # 太阳系主场景数据
│   ├── planets/              # 行星数据（8个）
│   │   ├── mercury.json
│   │   ├── venus.json
│   │   ├── earth.json
│   │   └── ...
│   ├── moons/                # 卫星数据（20个）
│   │   ├── moon.json         # 月球
│   │   ├── phobos.json       # 火卫一
│   │   └── ...
│   └── quizzes/              # 题库（20+个）
│       ├── solar_system.json
│       ├── mercury.json
│       └── ...
├── templates/
│   ├── index.html            # 太阳系主页
│   └── planets/               # 行星详情页（8个）
│       ├── mercury.html
│       ├── venus.html
│       └── ...
└── static/
    ├── css/
    │   └── style.css
    └── js/
        ├── main.js           # 太阳系主场景
        ├── planet-selector.js # 天体选择器
        ├── quiz.js           # 答题系统
        ├── chat.js           # 对话系统
        ├── language.js      # 语言切换
        ├── planets/          # 行星 3D 场景（8个）
        │   ├── mercury.js
        │   ├── venus.js
        │   └── ...
        └── moons/            # 卫星 3D 场景（11个）
            ├── moon.js
            ├── io.js
            └── ...
```

---

## 阶段一：太阳系主场景

### 目标
实现太阳系 3D 主场景，展示太阳和八大行星的基本球体模型。

### 功能要求

#### 1. 3D 场景搭建
- 使用 Three.js 创建 WebGL 场景
- 创建太阳（黄色球体 + 光晕效果）
- 创建 8 颗行星简化球体（水星、金星、地球、火星、木星、土星、天王星、海王星）
- 星空背景（10000 颗星星）
- 小行星带（火星和木星之间）

#### 2. 行星公转
- 所有行星绕太阳公转（**逆时针，speed 负数**）
- 每颗行星公转速度不同（离太阳越近速度越快）
- 行星自转（**逆时针，speed 负数**，除金星/天王星外）
- 显示轨道线

#### 3. 行星数据
| 行星 | 颜色代码 | 半径比例 | 公转速度 |
|------|----------|----------|----------|
| 水星 | 0xb5b5b5 | 0.4 | -0.04 |
| 金星 | 0xffc649 | 0.6 | -0.015 |
| 地球 | 0x4da6ff | 0.65 | -0.01 |
| 火星 | 0xc15a3a | 0.5 | -0.008 |
| 木星 | 0xd8ca9d | 1.5 | -0.002 |
| 土星 | 0xead6b8 | 1.2 | -0.0009 |
| 天王星 | 0x4fd0e7 | 0.9 | -0.0004 |
| 海王星 | 0x2244ff | 0.85 | -0.0001 |

#### 4. 土星环
- 土星添加土星环（RingGeometry）
- 环绕行星倾斜 45 度

#### 5. 交互功能
- OrbitControls 相机控制（拖拽旋转、滚轮缩放）
- 点击行星弹出提示（显示行星名称）
- 行星选择器（底部导航栏）

#### 6. 相机设置
```javascript
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 30, 50);
controls.minDistance = 10;
controls.maxDistance = 200;
```

### 代码示例：main.js

```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let sun, planets = [], orbits = [];
let speedMultiplier = 1;

const planetData = [
    { name: '水星', radius: 0.4, distance: 4, color: 0xb5b5b5, speed: -0.04 },
    { name: '金星', radius: 0.6, distance: 6, color: 0xffc649, speed: -0.015 },
    { name: '地球', radius: 0.65, distance: 8, color: 0x4da6ff, speed: -0.01 },
    { name: '火星', radius: 0.5, distance: 10, color: 0xc15a3a, speed: -0.008 },
    { name: '木星', radius: 1.5, distance: 14, color: 0xd8ca9d, speed: -0.002 },
    { name: '土星', radius: 1.2, distance: 18, color: 0xead6b8, speed: -0.0009, hasRings: true },
    { name: '天王星', radius: 0.9, distance: 22, color: 0x4fd0e7, speed: -0.0004 },
    { name: '海王星', radius: 0.85, distance: 26, color: 0x2244ff, speed: -0.0001 }
];

init();
createSolarSystem();
animate();

function init() {
    const container = document.createElement('div');
    container.id = 'scene-container';
    document.body.insertBefore(container, document.body.firstChild);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 30, 50);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 200;
    controls.target.set(0, 0, 0);

    // 灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 1.5, 300);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    createStarfield();
    createAsteroidBelt();
}

function createSolarSystem() {
    // 创建太阳
    const sunGeometry = new THREE.SphereGeometry(2, 64, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // 创建行星
    planetData.forEach(data => {
        const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.8,
            metalness: 0.2
        });

        const planet = new THREE.Mesh(geometry, material);
        planet.userData = { name: data.name, distance: data.distance };

        // 土星环
        if (data.hasRings) {
            const ringGeo = new THREE.RingGeometry(data.radius * 1.5, data.radius * 2.5, 64);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0xc9b896,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            planet.add(ring);
        }

        scene.add(planet);
        planets.push({
            mesh: planet,
            distance: data.distance,
            speed: data.speed,  // speed 负数 = 逆时针
            angle: Math.random() * Math.PI * 2
        });

        // 创建轨道
        const orbit = createOrbit(data.distance);
        orbits.push(orbit);
    });
}

function animate() {
    requestAnimationFrame(animate);

    // 太阳自转（逆时针）
    sun.rotation.y -= 0.001;

    // 行星公转 + 自转
    planets.forEach(planet => {
        planet.angle += planet.speed;  // speed 负数 = 逆时针公转
        planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
        planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
        planet.mesh.rotation.y -= 0.01;  // 自转（逆时针）
    });

    controls.update();
    renderer.render(scene, camera);
}
```

---

## 阶段二：左侧数据面板 + 右侧答题系统

### 目标
在主页添加左侧太阳系信息面板和右侧答题系统。

### 功能要求

#### 1. 左侧信息面板
- 太阳系基本信息（形成时间、位置、距银河中心等）
- 太阳详细信息（类型、直径、质量、温度等）
- 八大行星列表
- 其他天体信息（小行星带、柯伊伯带等）
- 探索历史

#### 2. 右侧答题系统
- 本地题库模式：从本地 JSON 加载题目
- 在线生成模式：调用 API 生成题目
- 模式切换按钮
- 题目展示（中英文双语）
- 4 个选项（带选中效果）
- 反馈展示（正确/错误 + 解析）
- 下一题按钮
- 保存到题库按钮
- 得分统计

#### 3. 题库数据结构
```json
{
  "questions": [
    {
      "question": {
        "zh": "太阳系中最大的行星是哪颗？",
        "en": "Which is the largest planet in the Solar System?"
      },
      "options": [
        {"zh": "土星", "en": "Saturn"},
        {"zh": "木星", "en": "Jupiter"},
        {"zh": "天王星", "en": "Uranus"},
        {"zh": "海王星", "en": "Neptune"}
      ],
      "answer": 1,
      "explanation": {
        "zh": "木星是太阳系中最大的行星...",
        "en": "Jupiter is the largest planet..."
      }
    }
  ]
}
```

### 后端 API

#### GET /api/quiz/<quiz_type>
获取本地题库

#### GET /api/data/solar_system
获取太阳系主场景数据

---

## 阶段三：接入大模型

### 目标
接入通义千问/Kimi 大模型，实现智能对话和题目生成。

### 功能要求

#### 1. 对话系统
- 顶部搜索框打开聊天面板
- 支持中英文对话
- 太阳系知识助手角色
- 显示 AI 思考状态

#### 2. 题目生成
- 调用大模型生成题目
- 支持去重（排除已有题目）
- 中英文双语格式
- 保存到本地题库

#### 3. API 实现
```python
DASHSCOPE_API_KEY = "sk-xxx"  # 通义千问
KIMI_API_KEY = "sk-xxx"       # Kimi

# 优先使用通义千问，失败则切换到 Kimi
providers = [
    ("dashscope", DASHSCOPE_API_KEY, "qwen-plus"),
    ("kimi", KIMI_API_KEY, "moonshot-v1-8k")
]
```

### 后端 API

#### POST /api/chat
```json
{
  "message": "太阳系有几颗行星？",
  "language": "zh",
  "system_prompt": ""
}
```

#### POST /api/quiz/generate
```json
{
  "topic": "水星",
  "language": "zh",
  "exclude_questions": []
}
```

#### POST /api/quiz/save
保存题目到本地题库

---

## 阶段四：水星（第一颗类地行星）

### 目标
实现水星的完整探索页面。

### 功能要求

#### 1. 3D 场景
- 水星球体渲染
- 水星表面纹理（灰色，带撞击坑）
- 水星自转（**逆时针，speed 负数**）
- 星空背景
- 轨道相机控制

#### 2. 详情页面 (templates/planets/mercury.html)
- 水星基本信息面板
- 数据分类展示（基本参数、时间参数、环境参数、位置参数、探索历史）
- 中英文双语支持

#### 3. 数据文件 (data/planets/mercury.json)
```json
{
  "id": "mercury",
  "name": {"zh": "水星", "en": "Mercury"},
  "icon": "☿️",
  "theme_color": "#b5b5b5",
  "info_sections": [
    {
      "title": {"zh": "📊 基本参数", "en": "📊 Basic Parameters"},
      "items": [
        {"label": {"zh": "行星类型", "en": "Planet Type"}, "value": {"zh": "类地行星", "en": "Terrestrial Planet"}},
        {"label": {"zh": "直径", "en": "Diameter"}, "value": {"zh": "4,879 km", "en": "4,879 km"}}
      ]
    },
    {
      "title": {"zh": "🕐 时间参数", "en": "🕐 Time Parameters"},
      "items": [
        {"label": {"zh": "自转周期", "en": "Rotation Period"}, "value": {"zh": "58.65 天", "en": "58.65 days"}},
        {"label": {"zh": "公转周期", "en": "Orbital Period"}, "value": {"zh": "87.97 天", "en": "87.97 days"}}
      ]
    }
  ]
}
```

#### 4. 题库 (data/quizzes/mercury.json)
- 10-20 道水星相关题目
- 中英文双语格式

#### 5. 3D 场景代码 (static/js/planets/mercury.js)
```javascript
export function initMercuryScene() {
    clearMercuryScene();
    clearCurrentScene();
    // ... 创建场景、相机、渲染器

    // 创建水星
    const geometry = new THREE.SphereGeometry(0.5, 64, 64);
    const material = new THREE.MeshStandardMaterial({ color: 0xb5b5b5 });
    const mercury = new THREE.Mesh(geometry, material);
    scene.add(mercury);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    // 水星自转（逆时针，speed 负数）
    mercury.rotation.y -= 0.005;
    controls.update();
    renderer.render(scene, camera);
}
```

---

## 阶段五：金星

### 目标
实现金星的完整探索页面。

### 特殊注意
- **金星自转是顺时针（retrograde）**
- 自转速度极慢（1 天 ≈ 243 地球日）

### 功能要求

#### 1. 3D 场景
- 金星球体渲染（土黄色）
- 金星自转（**顺时针，speed 正数**）
- 云层效果（可选）

#### 2. 自转代码注意
```javascript
// 金星自转（顺时针，speed 正数）
venus.rotation.y += 0.002;  // 比其他行星慢很多
```

---

## 阶段六：地球 + 月球

### 目标
实现地球和月球的完整探索页面。

### 功能要求

#### 1. 地球 3D 场景 (static/js/planets/earth.js)
- 地球球体 + 纹理（蓝色海洋、绿色大陆）
- 云层效果
- 地球自转（**逆时针，speed 负数**）

#### 2. 月球 3D 场景 (static/js/moons/moon.js)
- 月球球体 + 纹理（灰色、带撞击坑）
- 月球自转（**逆时针，speed 负数**）

#### 3. 地月系统
- 月球绕地球公转（**逆时针，speed 负数**）
- 显示月球轨道

#### 4. 数据要求
- Earth data/quizzes (data/planets/earth.json, data/quizzes/earth.json)
- Moon data/quizzes (data/moons/moon.json, data/quizzes/moon.json)

---

## 阶段七：火星 + 火卫一 + 火卫二

### 目标
实现火星及其两颗卫星的完整探索页面。

### 功能要求

#### 1. 火星 3D 场景 (static/js/planets/mars.js)
- 火星球体（红褐色）
- 火星自转（**逆时针，speed 负数**）

#### 2. 卫星 3D 场景
- 火卫一 (phobos.js)：小型不规则天体
- 火卫二 (deimos.js)：小型不规则天体

#### 3. 数据文件
- data/planets/mars.json
- data/moons/phobos.json
- data/moons/deimos.json

---

## 阶段八：木星 + 4 颗伽利略卫星

### 目标
实现木星及其 4 颗伽利略卫星的完整探索页面。

### 功能要求

#### 1. 木星 3D 场景 (static/js/planets/jupiter.js)
- 木星球体（红褐色/米色条纹）
- 木星自转（**逆时针，speed 负数**）
- 大红斑效果（可选）

#### 2. 伽利略卫星
- Io (io.js)：黄色，表面有火山
- Europa (europa.js)：白色冰层
- Ganymede (ganymede.js)：灰色冰层
- Callisto (callisto.js)：深灰色撞击坑

#### 3. 数据文件
- data/planets/jupiter.json
- data/moons/io.json
- data/moons/europa.json
- data/moons/ganymede.json
- data/moons/callisto.json

---

## 阶段九：土星 + 卫星

### 目标
实现土星及其多颗卫星的完整探索页面。

### 功能要求

#### 1. 土星 3D 场景 (static/js/planets/saturn.js)
- 土星球体（淡黄色）
- 土星自转（**逆时针，speed 负数**）
- 土星环（倾斜 45 度）

#### 2. 主要卫星
- Titan (titan.js)：橙褐色大气
- Mimas (mimas.js)：灰色
- Enceladus (enceladus.js)：白色冰层

#### 3. 数据文件
- data/planets/saturn.json
- data/moons/titan.json
- data/moons/mimas.json
- data/moons/enceladus.json

---

## 阶段十：天王星 + 卫星

### 目标
实现天王星及其 5 颗卫星的完整探索页面。

### 特殊注意
- **天王星自转是顺时针（retrograde）**
- 天王星几乎平躺着公转

### 功能要求

#### 1. 天王星 3D 场景 (static/js/planets/uranus.js)
- 天王星球体（蓝绿色）
- 天王星自转（**顺时针，speed 正数**）
- 环系统（可选）

#### 2. 5 颗卫星
- Miranda, Ariel, Umbriel, Titania, Oberon

#### 3. 自转代码注意
```javascript
// 天王星自转（顺时针，retrograde）
uranus.rotation.y += 0.003;  // speed 正数 = 顺时针
```

---

## 阶段十一：海王星 + 卫星

### 目标
实现海王星及其卫星的完整探索页面。

### 功能要求

#### 1. 海王星 3D 场景 (static/js/planets/neptune.js)
- 海王星球体（深蓝色）
- 海王星自转（**逆时针，speed 负数**）

#### 2. 主要卫星
- Triton (triton.js)：粉红色冰层

#### 3. 数据文件
- data/planets/neptune.json
- data/moons/triton.json

---

## 通用技术要求

### 1. 场景清除函数
每个行星/卫星都需要实现清除函数：
```javascript
export function clearXxxScene() {
    if (scene) {
        scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(m => m.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        scene.clear();
    }
}
```

### 2. 语言切换
所有文本支持中英文双语，使用 LanguageManager 进行切换。

### 3. 主题色
每个天体有独立的主题色，通过 CSS 变量实现：
```css
:root {
    --theme-color: #ffdd00;
    --theme-color-rgb: 255, 221, 0;
}
```

### 4. 响应式设计
- 窗口大小变化时重新计算相机和渲染器
- 移动端适配

### 5. 星空背景
```javascript
function createStarfield() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 400;
        const y = (Math.random() - 0.5) * 400;
        const z = (Math.random() - 0.5) * 400;
        starsVertices.push(x, y, z);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    // ... 创建材质和网格
}
```

---

## 测试要求

每个阶段完成后需要：
1. 3D 场景正常渲染
2. 相机控制正常工作
3. 切换行星/卫星场景正常
4. 语言切换正常
5. 数据加载正常
6. 答题功能正常（如果有题库）

---

*文档版本：1.0*
*更新日期：2026-05-14*