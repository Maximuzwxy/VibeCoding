# 第一阶段：基础问答（无 History，无 Function Calling）

## 目标
实现最简单的 LLM 对话功能

## 功能
- 用户发送消息，LLM 返回回复
- 界面左侧显示对话内容
- 界面右侧显示 Message Detail（request/response JSON）
- **消息流向展示**：Agent 消息内显示处理步骤（→ 发送请求到 LLM、← LLM 返回最终回复）
- 无历史记录功能
- 无 Function Calling

## 技术实现
- 每次请求只发送用户输入
- 不保存对话历史
- 不支持 Function Calling
- Agent 消息内嵌消息流向步骤（无 Function Calling 时只有两步骤）

## 消息流向展示
Agent 回复消息气泡内，在最终回复文字上方显示处理步骤。无 Function Calling 时显示 2 步；有 Function Calling 时自动扩展步骤数量，并支持循环调用。

### 无 Function Calling（2 步）
```
→ 发送请求到 LLM
← LLM 返回最终回复

[最终回复内容]
```

### 有 Function Calling（多步，循环调用）
```
→ 发送请求到 LLM
← LLM 返回，准备调用工具
✓ 调用 xxx... 成功

→ 发送请求到 LLM（第 2 轮）
← LLM 返回最终回复

[最终回复内容]
```

- `✓` / `✗` 图标表示工具调用的成功/失败状态
- LLM 可能发起多个工具调用，每执行完一个会自动追加一轮新请求
- `request_response_pairs` 中记录每一轮的 request 和 response
- 点击 Agent 消息可展开右侧 JSON 详情面板

## 界面
```
┌─────────────────────────────────────┬─────────────────┐
│           Chat Area                 │  Message Details │
│                                     │                  │
│  You: 你好                          │  Request:        │
│                                    │  { ... }        │
│  Agent:                             │                  │
│    → 发送请求到 LLM                  │  Response:       │
│    ← LLM 返回最终回复                │  { ... }        │
│    [Agent 的回复内容]                │                  │
└─────────────────────────────────────┴─────────────────┘
```
