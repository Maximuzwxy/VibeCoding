# 第二阶段：InfoPanel + 中英文切换 + 天体选择器

## 目标
实现左侧信息面板（天体数据展示）、全局中英文切换机制、底部天体选择器（含卫星选择）。

---

## 功能

### 1. LanguageManager（语言管理器）
`static/js/language.js` — 单例模式，全局语言状态管理

#### 核心能力
- **状态持久化**：`localStorage` 存储当前语言选择
- **切换**：`toggle()` 在 `zh` / `en` 之间切换
- **事件通知**：`dispatchEvent(new CustomEvent('languageChanged'))` 通知所有监听组件
- **工具方法**：`t(bilingual)` 从 `{zh: "...", en: "..."}` 对象中提取当前语言文本
- **自动初始化**：`DOMContentLoaded` 时从 localStorage 加载 + 绑定按钮

#### 事件驱动架构
```
LanguageManager.toggle()
    → dispatchEvent('languageChanged')
    → InfoPanel._rerender()       // 用缓存数据 + 新语言重新渲染
    → QuizPanel._updateAll()      // 更新标题/模式按钮/题目/反馈
```

### 2. InfoPanel（信息面板）
`static/js/info-panel.js` — 纯 JS 动态渲染，无静态 HTML 模板

#### 接口
| 方法 | 说明 |
|------|------|
| `init(containerId)` | 绑定 `languageChanged` 事件 |
| `load(celestialId)` | 请求 `/api/data/celestial/{id}`，缓存，渲染 |
| `clear()` | 清空面板 + 数据 |

#### 渲染逻辑
JSON 数据中 `info_sections` 数组驱动渲染：
```json
{
  "info_sections": [
    {
      "title": {"zh": "基本信息", "en": "Basic Info"},
      "items": [
        {"label": {"zh": "年龄", "en": "Age"}, "value": {"zh": "约46亿年", "en": "~4.6 billion years"}},
        ...
      ]
    }
  ]
}
```

渲染为：
```html
<div class="info-section">
  <div class="info-section-title">基本信息</div>
  <div class="info-item">
    <span class="info-label">年龄</span>
    <span class="info-value">约46亿年</span>
  </div>
</div>
```

#### 缓存
- `load()` 首次请求后缓存数据
- `languageChanged` 时用缓存数据直接 `_rerender()`，不发起新请求

### 3. 天体选择器
底部横向排列 10 个天体图标（太阳 + 8 大行星 + 卫星列表按钮），CSS 模拟轨道弧线布局。

#### 功能
- **悬浮标签**：每个天体图标上方显示名称
- **卫星弹窗**：第 10 个按钮点击展开卫星列表（hover 触发）

---

## 技术实现

### 数据格式
所有双语文本使用对象格式：`{"zh": "中文", "en": "English"}`

### 数据目录结构
```
data/
├── solar_system.json          # 太阳系主数据（info_sections + 3D 配置）
├── planets/                   # 行星详细数据
├── moons/                     # 卫星详细数据
└── quizzes/                   # 题库
```

### CSS 主题系统
通过 CSS 自定义属性统一管理样式：
```css
:root {
    --theme-bg: rgba(10, 10, 30, 0.85);
    --theme-bg-light: rgba(30, 30, 60, 0.6);
    --theme-border: rgba(100, 140, 255, 0.3);
    --theme-text: #e8e8ff;
    --theme-glow: rgba(100, 140, 255, 0.15);
    --accent-color: #ffaa00;
    ...
}
```

---

## 界面
```
┌──────────────┬──────────────────────┬──────────────┐
│  InfoPanel   │   3D 太阳系轨道      │              │
│              │                      │              │
│ 🌌 太阳系    │       ★              │              │
│ ─────────── │      ◯◯◯             │        [CN]  │
│ 基本信息     │     ●  ●             │              │
│  年龄  46亿年│    ☀ ● ●            │              │
│  直径  139万 │     ●  ●             │              │
│              │      ◯◯◯             │              │
│ 太阳         │                      │              │
│  类型 G型主序│                      │              │
│  ...         │                      │              │
│              │                      │              │
└──────────────┴──────────────────────┴──────────────┘
                      ☀ ☿ ♀ 🌍 ♂ ♃ ♄ ♅ ♆ 🌙
```

---

## API 接口（新增）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/data/solar_system` | 太阳系主数据 |
| GET | `/api/data/celestial/<id>` | 通用天体（搜索 planets/moons/root） |
| GET | `/api/data/planet/<name>` | 指定行星 |
| GET | `/api/data/moon/<name>` | 指定卫星 |

---

## 测试覆盖
- `test_index_has_info_panel` — InfoPanel 容器存在
- `test_index_has_lang_switch` — 语言按钮存在
- `test_index_has_language_js` — language.js 脚本加载
- `test_info_panel_has_content` — InfoPanel 渲染了内容（h3 元素）
- `test_lang_switch_toggles` — 点击按钮文字变化
- `test_planet_icons_count` — 10 个天体图标
- `test_celestial_api_solar_system` — celestial API 返回 info_sections

---

## 关键决策

### 为什么 InfoPanel 用纯 JS 动态渲染？
- 数据驱动：同一个渲染函数覆盖所有天体（太阳系、行星、卫星），不需要为每个天体维护 HTML 文件
- 语言切换：`languageChanged` 事件触发时用缓存数据即时重渲染，无需重新 fetch
- 视觉效果由 CSS 类控制，与静态 HTML 完全一致

### 为什么 LanguageManager 用事件而非回调？
- 解耦：新增面板只需 `addEventListener('languageChanged')`，无需修改 LanguageManager
- 一个事件触发时，InfoPanel、QuizPanel 等多个组件同时响应
