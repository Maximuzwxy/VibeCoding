# Agent Demo 开发计划

## 概述

本项目是一个基于 Flask 的 AI Agent 演示应用，支持与 LLM 对话、Function Calling 等功能。

## 开发阶段

### 第一阶段：基础问答（无 History，无 Function Calling）

**目标**：实现最简单的 LLM 对话功能

**功能**：
- 用户发送消息，LLM 返回回复
- 界面左侧显示对话内容
- 界面右侧显示 Message Detail（request/response JSON）
- 无历史记录功能

**技术实现**：
- 每次请求只发送用户输入
- 不保存对话历史
- 不支持 Function Calling

**界面**：
```
┌─────────────────────────────────────┬─────────────────┐
│           Chat Area                 │  Message Detail  │
│                                     │                  │
│  You: 你好                          │  Request:        │
│                                    │  { ... }        │
│  Agent: 你好，有什么帮助？           │                  │
│                                    │  Response:       │
│                                     │  { ... }        │
└─────────────────────────────────────┴─────────────────┘
```

---

### 第二阶段：添加 History（记忆功能）

**目标**：让 AI 记住对话上下文

**功能**：
- 保存对话历史到 `data/history.json`
- 每次请求携带完整对话历史
- AI 可以记住用户信息（如名字）

**技术实现**：
- 使用文件持久化保存历史
- 每次请求加载历史并发送给 LLM
- 支持清空历史

**示例**：
```
用户：我叫 Max
Agent：好的 Max，很高兴认识你！

用户：我叫什么？
Agent：你叫 Max
```

---

### 第三阶段：添加 Function Calling（系统提示词）

**目标**：实现第一个 Function

**功能**：
- `update_system_prompt` - 更新系统提示词/角色设置

**使用场景**：
- 设置 AI 的角色（如"你是一个编程助手"）
- 自定义 AI 的行为风格

---

### 第四阶段：添加文件读写功能

**目标**：让 AI 能够读写文件

**功能**：
- `read_file` - 读取文件内容
- `list_files` - 列出文件目录
- `write_file` - 写入文件内容
- `delete_file` - 删除文件

**使用场景**：
- 让 AI 生成代码并保存
- 让 AI 读取并修改现有文件
- 让 AI 浏览文件目录并删除不需要的文件

**示例**：
```
用户：帮我创建一个 index.html 文件
Agent：[调用 write_file] 文件已创建

用户：删除之前的旧照片
Agent：[调用 list_files] → [调用 delete_file] 文件已删除
```

---

### 第五阶段：添加时间、位置、天气

**目标**：让 AI 能够获取实时信息

**功能**：
- `get_current_time` - 获取当前时间
- `get_location` - 获取位置信息（城市）
- `get_weather` - 获取天气信息

**使用场景**：
```
用户：今天天气怎么样？
Agent：[调用 get_location] → [调用 get_weather] → 北京今天晴天，28°C
```

---

### 第六阶段：添加搜索和下载

**目标**：让 AI 能够搜索网络和下载资源

**功能**：
- `web_search` - 网页搜索
- `news_search` - 新闻搜索（使用网页搜索作为后备）
- `download_image` - 下载图片到 files 目录

**使用场景**：
```
用户：帮我搜索一下 Python 教程
Agent：[调用 web_search] → 返回搜索结果

用户：帮我下载一张故宫的图片
Agent：[调用 download_image] → 图片已保存到 files/
```

---

## 技术架构

### 后端
- **框架**：Flask
- **LLM**：DeepSeek（deepseek-chat）
- **API**：https://api.deepseek.com/chat/completions
- **Key**：存放在项目根目录 `.env` 文件中
- **持久化**：JSON 文件存储

### 前端
- **模板引擎**：Jinja2
- **样式**：CSS
- **交互**：JavaScript (原生)

### 工具函数（Function Calling）
| 函数名 | 功能 | 阶段 |
|--------|------|------|
| update_system_prompt | 更新系统提示词 | 3 |
| read_file | 读取文件 | 4 |
| list_files | 列出文件目录 | 4 |
| write_file | 写入文件 | 4 |
| delete_file | 删除文件 | 4 |
| get_current_time | 获取时间 | 5 |
| get_location | 获取位置 | 5 |
| get_weather | 获取天气 | 5 |
| web_search | 网页搜索 | 6 |
| news_search | 新闻搜索 | 6 |
| download_image | 下载图片 | 6 |

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