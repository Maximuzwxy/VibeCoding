# 第四阶段：ChatPanel 对话面板 + 上下文记忆

## 目标
实现顶部搜索框为入口的 AI 对话面板，支持与 DeepSeek 实时对话，服务器端维护上下文记忆。

---

## 功能

### ChatPanel 模块
`static/js/chat-panel.js` — 搜索框 + 对话弹层面板

#### 交互流程
1. 点击顶部搜索框 → 弹出对话面板
2. 在搜索框或面板输入框输入问题 → 回车或点击发送
3. 显示"🤔 思考中..." → 调用 LLM → 显示 AI 回复
4. 点击面板关闭按钮 / 点击面板外部 → 收起面板

#### 核心行为

##### 面板开关
- 点击搜索框或聚焦搜索输入框 → `_open()` 添加 `show` 类
- 点击关闭按钮或面板外部 → `_close()` 移除 `show` 类
- 面板内部点击阻止冒泡，不会触发关闭

##### 发送消息
- `isWaiting` 防重复发送（回复回来前禁发）
- 发送后立即显示"🤔 思考中..."，收到回复后替换
- 失败时显示错误提示

##### 语言切换
`languageChanged` 事件触发时：
- 面板标题："🤖 太阳系探索助手" ↔ "🤖 Solar System Assistant"
- 欢迎语（`#chat-welcome`）：中英文切换
- 输入框 placeholder："输入你的问题..." ↔ "Type your question..."
- 搜索框 placeholder："输入问题，探索太阳系..." ↔ "Ask anything about the Solar System..."
- 发送按钮："发送" ↔ "Send"
- **已有对话内容不动**（聊天历史是事实，不翻译）

#### 接口
| 方法 | 说明 |
|------|------|
| `init(containerId)` | 绑定事件 + 注册 languageChanged |
| `setLanguage(lang)` | 语言切换回调（由事件触发，刷新全部标签） |

---

## 技术实现

### 后端 API

#### POST /api/chat
请求：
```json
{
  "message": "太阳有多大？",
  "language": "zh",
  "system_prompt": "你是一个太阳系知识助手..."
}
```

响应：
```json
{
  "reply": "太阳的直径约为139万公里..."
}
```

### 上下文记忆
服务器端 `app.py` 维护全局 `chat_history` 列表：

```python
# 全局变量（内存中，服务器重启清空）
chat_history = []

# 每次请求：
messages = [{"role": "system", "content": system_prompt}]
messages.extend(chat_history)              # 附加完整历史
messages.append({"role": "user", "content": message})  # 当前消息

# LLM 返回后：
chat_history.append({"role": "user", "content": message})
chat_history.append({"role": "assistant", "content": reply})
```

**效果**：连续对话中 LLM 能记住之前的问答。服务器重启后清空。

### LLM 配置
```python
DEEPSEEK_MODEL = "deepseek-v4-flash"
payload = {
    "model": "deepseek-v4-flash",
    "messages": messages,       # system + history + 当前
    "temperature": 0.7,
    "thinking": {"type": "disabled"}  # 对话不需要推理
}
timeout = 60s
```

---

## 界面
```
┌──────────────────────────────────────────────┐
│         [  输入问题，探索太阳系...  🔍 ]       │  ← 搜索框
│                   (顶部居中)                   │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────┐      │
│  │  🤖 太阳系探索助手            [✕]  │      │  ← 弹层面板
│  │  ─────────────────────────────── │      │
│  │                                   │      │
│  │  AI: 你好！我是太阳系探索助手...    │      │  ← 欢迎语
│  │                                   │      │
│  │                     User: 太阳多大？│      │  ← 用户消息（右侧缩进）
│  │                                   │      │
│  │  AI: 太阳的直径约139万公里...       │      │  ← AI 回复（左侧缩进）
│  │                                   │      │
│  │  ─────────────────────────────── │      │
│  │  [输入你的问题...]     [发送]      │      │  ← 输入区
│  └────────────────────────────────────┘      │
│                                              │
└──────────────────────────────────────────────┘
```

---

## API 接口（新增）
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat` | AI 对话（带上下文记忆） |

---

## 测试覆盖
- `test_chat_missing_message` — 缺少 message 返回 400
- `test_chat_responds` — 正常对话返回 reply
- `test_search_box_exists` — 搜索框存在
- `test_chat_panel_hidden_initially` — 面板初始隐藏
- `test_chat_panel_opens_on_search_click` — 点击搜索框打开面板
- `test_chat_panel_has_welcome` — 面板有欢迎语
- `test_chat_send_button_exists` — 发送按钮 DOM 存在

---

## 关键决策

### 为什么 history 放服务端不放在前端 localStorage？
- localStorage 会暴露给客户端，不安全
- 服务端 history 可以直接拼进 LLM 请求，前端只需发当前消息
- 保持前端 ChatPanel 简洁，只管 UI 渲染

### 为什么 history 不持久化？
- 对话场景属临时交互，不需要数据库
- 简单 = 可靠，减少维护成本
- 需要持久化时可随时替换为 Redis / JSON 文件

### 为什么对话面板是弹层而不是固定位置？
- 全屏 3D 场景需要最大化可视区域
- InfoPanel（左）+ QuizPanel（右）已占两侧
- 搜索框作为轻量入口，面板按需弹出
