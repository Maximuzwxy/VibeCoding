# Agent Demo 开发计划

## 概述

本项目是一个基于 Flask 的 AI Agent 演示应用，支持与 LLM 对话、Function Calling 等功能。

---

## 技术架构

### 后端
- **框架**：Flask
- **LLM**：DeepSeek（deepseek-chat）
- **API**：https://api.deepseek.com/chat/completions
- **Key**：存放在项目根目录 `.env` 文件中
- **持久化**：JSON 文件存储
- **依赖**：flask、requests、ddgs

### 前端
- **模板引擎**：Jinja2
- **样式**：CSS
- **交互**：JavaScript (原生)

---

## 开发阶段

本项目分为 **6 个阶段**逐步实现，每个阶段的详细规范见同级目录下的单独文档：
- `01_phase1_basic_chat.md` - 基础问答
- `02_phase2_history.md` - 添加 History
- `03_phase3_function_calling.md` - 添加 Function Calling
- `04_phase4_file_io.md` - 添加文件读写
- `05_phase5_weather_time.md` - 添加时间位置天气
- `06_phase6_search_download.md` - 添加搜索下载

**注意**：Function Calling 功能分阶段逐步实现，不需要一次性全部完成。

---

## 项目结构

```
agent-demo/
├── app.py              # Flask 主应用
├── spec.md             # 本文档
├── rules.md            # 开发规范
├── requirements.txt    # 依赖
├── data/               # 数据文件夹
│   ├── history.json    # 对话历史
│   └── system_prompt.json
├── files/              # 文件存储
├── templates/          # HTML 模板
│   └── index.html
└── static/             # 静态文件
    ├── main.js
    └── style.css
```

---

## API 接口

### POST /api/chat
发送消息给 LLM

**请求**：
```json
{
  "message": "你好"
}
```

**响应**：
```json
{
  "reply": "你好，有什么帮助？",
  "request_response_pairs": [
    {
      "request": { ... },
      "response": { ... },
      "tool_executions": []
    }
  ]
}
```

### GET /api/history
获取对话历史

### POST /api/clear
清空对话历史
