# 第三阶段：QuizPanel 答题系统

## 目标
实现右侧答题面板，支持本地题库和 LLM 在线生成两种模式，在线题目可保存到本地题库。

---

## 功能

### QuizPanel 模块
`static/js/quiz-panel.js` — 双模式答题面板

#### 两种模式
| 模式 | 数据来源 | 说明 |
|------|---------|------|
| 本地题库 | `/api/quiz/{topic}` | 打乱后展示，做完显示"题目已做完" |
| 在线生成 | `/api/quiz/generate` | DeepSeek V4 Flash 生成，可继续生成 |

#### 核心行为

##### 模式切换
- **本地 → 在线**：优先恢复已缓存的在线题目，无缓存才发起 LLM 请求
- **在线 → 本地**：直接恢复本地点位（该答到第几题还在第几题）
- **双套独立状态**：两套 `questions` / `index` / `hasAnswered` / `userSelection` 互不干扰

##### 防重复请求
- `_isLoadingOnline` 守卫：请求进行中再次点击在线生成不会重复发
- 已生成内容缓存：切回本地再切回在线直接用缓存，不会重新请求

##### 保存题目
- 在线模式每道题旁边显示"💾 加入题库"按钮
- 点击 → 去重检查 → 确认弹窗 → POST `/api/quiz/save`
- 保存格式：双语 `{zh, en}` 对象

##### 最后一题逻辑
- 本地模式：显示"✅ 题目已做完"
- 在线模式：显示"📥 继续生成题目"，追加到已有在线题目缓存

#### 语言切换
`languageChanged` 事件触发时：
- 更新标题（"📝 太阳系知识挑战" ↔ "📝 Solar System Quiz"）
- 更新模式按钮（"本地题库" ↔ "Local"、"在线生成" ↔ "Online"）
- 更新题目文字 + 选项文字 + 反馈内容
- 更新导航按钮文字（"⏭ 下一题" ↔ "⏭ Next"）
- **loading 中**只更新 loading 文字，不渲染旧数据

#### 接口
| 方法 | 说明 |
|------|------|
| `init(containerId)` | 绑定事件 + 注册 languageChanged 监听 |
| `load(topicId)` | 加载本地题库 |
| `switchMode(mode)` | 切换 local/online |
| `nextQuestion()` | 下一题（在线最后一题自动继续生成） |
| `saveCurrentQuestion()` | 保存当前题目到本地题库 |
| `setLanguage(lang)` | 语言切换回调（由事件触发） |
| `clear()` | 清空面板 |

---

## 技术实现

### 状态管理
```text
QuizPanel
├── _mode: 'local' | 'online'
├── _topic: 'solar_system'
│
├── 本地状态（独立）
│   ├── _localQuestions[]     # 打乱后的题目
│   ├── _localIndex           # 当前题号
│   ├── _localHasAnswered     # 当前题是否已答
│   └── _localUserSelection   # 用户选的选项
│
├── 在线状态（独立）
│   ├── _onlineQuestions[]    # 已生成的题目（缓存！）
│   ├── _onlineIndex
│   ├── _onlineHasAnswered
│   ├── _onlineUserSelection
│   └── _isLoadingOnline      # 防重复请求守卫
│
└── 视图代理（当前模式指到哪套）
    ├── _questions[]
    └── _currentIndex
```

### 请求流程（在线生成）

```text
switchMode('online')
  ├── _isLoadingOnline?  → 显示"加载中..."，return
  ├── _onlineQuestions.length > 0?  → 恢复缓存，渲染
  └── 首次进入 → _loadOnline()
        ├── _isLoadingOnline = true
        ├── fetch /api/quiz/{topic} → 收集现有题目文字去重
        ├── POST /api/quiz/generate {topic, language, exclude_questions}
        ├── 前端去重过滤
        ├── concat 到 _onlineQuestions（累积！）
        ├── _isLoadingOnline = false
        └── 如果在 online 模式 → 同步视图 + 渲染
```

### LLM API（DeepSeek V4 Flash）
```python
# app.py
DEEPSEEK_MODEL = "deepseek-v4-flash"
payload = {
    "model": "deepseek-v4-flash",
    "messages": [
        {"role": "system", "content": "..."},
        {"role": "user", "content": prompt}  # 生成10道双语题，已有题目去重
    ],
    "temperature": 0.7,
    "thinking": {"type": "disabled"}  # 关掉推理，加速
}
```

### 数据格式（题库）
```json
{
  "questions": [
    {
      "id": "q_sola_001",
      "question": {"zh": "太阳系中最大的行星是哪颗？", "en": "Which is the largest planet?"},
      "options": [
        {"zh": "土星", "en": "Saturn"},
        {"zh": "木星", "en": "Jupiter"},
        {"zh": "天王星", "en": "Uranus"},
        {"zh": "海王星", "en": "Neptune"}
      ],
      "answer": 1,
      "explanation": {"zh": "木星是太阳系中最大的行星。", "en": "Jupiter is the largest planet."}
    }
  ]
}
```

---

## 界面
```text
┌──────────────────────────────────┐
│  QuizPanel                       │
│                                  │
│  📝 太阳系知识挑战                │
│  ─────────────────────           │
│  [本地题库] [在线生成]             │
│                                  │
│  ┌─────────────────────────┐    │
│  │ 太阳系中最大的行星是？    │    │
│  └─────────────────────────┘    │
│                                  │
│  [A] 土星                        │
│  [B] 木星  ← 正确（绿色高亮）      │
│  [C] 天王星                       │
│  [D] 海王星   ← 用户选了（红色）    │
│                                  │
│  ┌─────────────────────────┐    │
│  │ ✅ 回答正确！            │    │
│  │ 木星是太阳系中最大的行星   │    │
│  └─────────────────────────┘    │
│                                  │
│  [💾 加入题库] [⏭ 下一题]        │
└──────────────────────────────────┘
```

---

## API 接口（新增）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/quiz/<type>` | 获取题库 |
| POST | `/api/quiz/generate` | LLM 生成选择题 |
| POST | `/api/quiz/save` | 保存题目到本地 JSON |

### POST /api/quiz/generate
请求：
```json
{
  "topic": "solar_system",
  "language": "zh",
  "exclude_questions": ["太阳有几颗行星？", ...]
}
```

响应：
```json
{
  "questions": [
    {
      "question": {"zh": "...", "en": "..."},
      "options": [{"zh": "...", "en": "..."}, ...],
      "answer": 1,
      "explanation": {"zh": "...", "en": "..."}
    }
  ]
}
```

---

## 测试覆盖
- `test_quiz_panel_exists` — QuizPanel 容器可见
- `test_quiz_renders_question` — 加载后题目文字不为空
- `test_quiz_options_visible` — 4 个选项按钮渲染
- `test_quiz_mode_buttons_exist` — 模式切换按钮存在
- `test_quiz_mode_switch` — 点击在线生成按钮变 active
- `test_local_quiz_returns_10_questions` — 本地题库 10 题
- `test_quiz_question_has_required_fields` — 题目包含 question/options/answer/explanation
- `test_quiz_generate_empty_topic` — 在线生成接口可达
- `test_quiz_save_missing_question` — 缺少参数返回 400

---

## 关键决策

### 为什么用 DeepSeek V4 Flash 而不是 V4 Pro？
V4 Flash（284B/13B active）生成速度 83 tok/s，V4 Pro（1.6T/49B active）约 130 tok/s 但模型启动和网络延迟下实际体验两者接近。对于生成选择题这种简单任务，Flash 和 Pro 质量无差异，但 Flash 价格仅为 Pro 的 1/10。

### 为什么关掉 thinking？
`"thinking": {"type": "disabled"}` — V4 Pro/Flash 默认会进行链式推理（CoT），生成题目不需要推理能力，关掉后响应速度从 ~30s 降到 ~10s。

### 为什么不重复请求在线题目？
用户体验：用户可能在本地和在线之间来回切换，如果每次都重新请求 LLM 既浪费 token 又让用户等待。保留缓存并支持"继续生成"追加题目是更好的用户体验。
