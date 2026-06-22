# Solar - 太阳系 3D 互动探索平台

## 概述

本项目是一个基于 Three.js + Flask 的太阳系 3D 互动探索平台，支持 3D 天体轨道渲染、天体信息展示、中英文切换、在线答题等功能。

---

## 技术架构

### 前端
- **3D 渲染**：Three.js (ES Module) + OrbitControls
- **样式**：CSS 自定义属性（主题系统）
- **交互**：JavaScript 原生
- **架构模式**：CelestialSystem 基类 + 配置驱动

### 后端
- **框架**：Flask
- **LLM**：DeepSeek V4 Flash（deepseek-v4-flash）
- **API**：https://api.deepseek.com/chat/completions
- **API Key**：存放在项目根目录 `.env` 文件中
- **持久化**：JSON 文件存储
- **依赖**：flask, flask-cors, requests

### 测试
- **框架**：pytest + Playwright
- **类型**：API 测试（后端路由）+ UI 测试（浏览器自动化）

---

## 开发阶段

本项目分为 **17 个阶段**逐步实现，每个阶段的详细规范见同级目录下的单独文档：
- `01_phase1_celestial_system.md` - CelestialSystem 基类 + 太阳系 3D 轨道
- `02_phase2_info_language.md` - InfoPanel + 中英文切换 + 天体选择器
- `03_phase3_quiz.md` - QuizPanel 答题系统（本地题库 + 在线生成）
- `04_phase4_chat.md` - ChatPanel 对话面板 + 上下文记忆
- `05_phase5_mercury.md` - 水星 + 天体场景切换框架（后续天体模板）
- `06_phase6_venus.md` - 金星 + 外层云罩 + 逆向自转
- `07_phase7_earth.md` - 地球 + 月球卫星 + 云层子对象
- `08_phase8_mars.md` - 火星 + 稀薄大气 + 双卫星
- `09_phase9_jupiter.md` - 木星 + 气态巨行星 + 伽利略卫星
- `10_phase10_saturn.md` - 土星 + 粒子光环 + 7 卫星系统
- `11_phase11_uranus.md` - 天王星 + 侧卧自转 + 5 卫星系统
- `12_phase12_neptune.md` - 海王星 + 大暗斑 + 海卫一逆行轨道
- `13_phase13_moon.md` - 卫星系统框架 + 月球纹理
- `14_phase14_jupiter_moons.md` - 木星伽利略卫星（Io, Europa, Ganymede, Callisto）
- `15_phase15_saturn_moons.md` - 土星卫星群（Titan + Enceladus + 5颗）
- `16_phase16_uranus_triton.md` - 天王星 5 卫星 + 海卫一
- `17_phase17_martian_moons.md` - 火卫一 (Phobos) + 火卫二 (Deimos)

---

## 项目结构

```
solar/
├── app.py                       # Flask 主应用
├── requirements.txt             # 依赖
├── data/                        # 数据文件夹
│   ├── solar_system.json        # 太阳系主数据（含 info_sections）
│   ├── planets/                 # 行星数据
│   ├── moons/                   # 卫星数据
│   └── quizzes/
│       └── solar_system.json    # 太阳系题库（10题，中英双语）
├── spec/                        # 开发规范文档
│   ├── 00_overview.md
│   ├── 01_phase1_celestial_system.md
│   ├── 02_phase2_info_language.md
│   └── 03_phase3_quiz.md
├── templates/
│   └── index.html               # 主页面
├── static/
│   ├── css/
│   │   └── style.css            # 样式（主题变量 + 所有组件）
│   └── js/
│       ├── celestial-system.js  # CelestialSystem 基类
│       ├── main.js              # 入口：启动 3D + InfoPanel + QuizPanel
│       ├── language.js          # LanguageManager（单例，事件驱动）
│       ├── info-panel.js        # InfoPanel（纯 JS 渲染 + 缓存）
│       └── quiz-panel.js        # QuizPanel（双模式 + 缓存 + 防重请求）
└── tests/
    ├── conftest.py              # 测试配置
    ├── run_all_tests.py         # 测试入口
    ├── api/
    │   └── test_app.py          # API 测试 (14 个)
    └── ui/
        └── test_pages.py        # UI 测试 (11 个)
```

---

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/data/solar_system` | 太阳系主数据 |
| GET | `/api/data/celestial/<id>` | 通用天体数据（搜索 planets/moons/root） |
| GET | `/api/data/planet/<name>` | 指定行星数据 |
| GET | `/api/data/moon/<name>` | 指定卫星数据 |
| GET | `/api/quiz/<type>` | 获取题库 |
| POST | `/api/quiz/generate` | 调用 LLM 生成选择题（带去重） |
| POST | `/api/quiz/save` | 保存题目到本地题库 |

---

## 设计原则

1. **配置驱动**：通过 JSON 配置天体参数，无需为每个天体写独立 JS 文件
2. **事件驱动**：LanguageManager 通过 CustomEvent 通知，各组件自行响应
3. **纯 JS 渲染**：InfoPanel / QuizPanel 不依赖静态 HTML 模板，由 JS 动态 DOM 操作
4. **缓存优先**：在线题目生成后缓存，切回不重复请求
5. **并发守卫**：`isLoadingOnline` 防止重复发 LLM 请求
