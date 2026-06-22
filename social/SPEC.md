# Social Network App - 需求规格文档

---

## ⚠️ 重要说明：UI 风格选择

**UI 风格必须在开发前确定，一旦确定后需严格统一执行。**

> 详细风格说明和选择流程见：**阶段零：UI 风格选择**

---

## 1. 项目概述

### 1.1 项目名称
**Social** - 简易社交网络应用

### 1.2 项目目标
实现一个具备基础社交功能的 Web 应用，包含用户账户、好友管理、即时通讯和动态发布功能。

### 1.3 使用场景
- 演示/教学用途
- 零基础学习 Web 全栈开发
- 展示 AI 辅助编程的工作流程

### 1.4 整体技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | HTML + CSS + 原生 JavaScript | 无框架，便于学习理解 |
| 后端 | Flask (Python) | 轻量级 Web 框架 |
| 实时通讯 | WebSocket (SocketIO) | 实现即时消息 |
| 数据库 | JSON 文件 | 轻量级数据存储 |
| 响应式布局 | CSS Media Queries | 适配手机/桌面 |

### 1.5 项目整体结构

```
social/
├── app.py                # Flask 主应用（后端入口）
├── requirements.txt      # Python 依赖
├── data/                 # JSON 数据目录
│   ├── users.json        # 用户表
│   ├── friendships.json  # 好友关系表
│   ├── messages.json     # 消息表
│   └── posts.json        # 动态表
├── templates/             # HTML 模板
│   ├── login.html        # 登录页
│   ├── register.html      # 注册页
│   ├── index.html         # 主页（导航容器）
│   ├── contacts.html      # 通讯录页
│   ├── chat.html          # 聊天详情页
│   ├── friendscircle.html # 朋友圈/动态页
│   ├── profile.html       # 个人主页
│   ├── settings.html      # 设置页
│   ├── admin.html         # 管理后台
│   └── base.html          # 基础模板
├── static/               # 静态资源
│   ├── css/
│   │   └── style.css     # 全局样式
│   └── js/
│       ├── api.js        # API 封装
│       ├── app.js        # 主应用逻辑
│       └── auth.js       # 认证相关
├── uploads/              # 用户上传文件
│   └── posts/           # 动态图片
└── scripts/
    └── init_data.py     # 数据初始化脚本
```

### 1.6 数据库设计

#### users.json - 用户表
```json
{
  "users": [
    {
      "id": "uuid",
      "username": "zhang_san",
      "password": "password",
      "avatar": "url or base64",
      "bio": "个人简介",
      "created_at": "ISO时间",
      "last_login": "ISO时间"
    }
  ]
}
```

#### friendships.json - 好友关系表
```json
{
  "friendships": [
    {
      "id": "uuid",
      "from": "用户A",
      "to": "用户B",
      "status": "pending | accepted | rejected",
      "created_at": "ISO时间"
    }
  ]
}
```

#### messages.json - 消息表
```json
{
  "messages": [
    {
      "id": "uuid",
      "from": "发送者",
      "to": "接收者",
      "content": "消息内容",
      "created_at": "ISO时间"
    }
  ]
}
```

#### posts.json - 动态表
```json
{
  "posts": [
    {
      "id": "uuid",
      "username": "发布者",
      "content": "文字内容",
      "images": ["图片URL列表"],
      "likes": ["点赞用户名列表"],
      "comments": [
        {
          "id": "uuid",
          "username": "评论者",
          "content": "评论内容",
          "created_at": "ISO时间"
        }
      ],
      "created_at": "ISO时间"
    }
  ]
}
```

### 1.7 预设数据

#### 预设头像
新用户默认使用 DiceBear 生成的卡通头像：
```
https://api.dicebear.com/9.x/adventurer/svg?seed={username}
```

#### 预设用户（10个，用于好友关系测试）
| 用户名 | 密码 | 头像 Seed | 简介 |
|--------|------|-----------|------|
| friend_01 | password123 | Alice | 喜欢摄影 |
| friend_02 | password123 | Bob | 音乐爱好者 |
| friend_03 | password123 | Charlie | 旅行达人 |
| friend_04 | password123 | Diana | 美食家 |
| friend_05 | password123 | Ethan | 书虫 |
| friend_06 | password123 | Fiona | 健身爱好者 |
| friend_07 | password123 | George | 游戏玩家 |
| friend_08 | password123 | Hannah | 电影爱好者 |
| friend_09 | password123 | Ian | 程序员 |
| friend_10 | password123 | Julia | 设计师 |

#### 预设动态（每条动态包含评论）
| 发布者 | 内容 | 图片 | 评论 |
|--------|------|------|------|
| friend_01 | 今天天气真好，出门拍照！ | picsum.photos/800/400?random=1 | friend_02: 拍得真好看！<br>friend_03: 这是在哪里拍的？ |
| friend_02 | 新专辑终于发布了！ | picsum.photos/800/400?random=2 | friend_04: 循环播放中！<br>friend_05: 最爱这首歌 |
| friend_03 | 旅行日记 - 第100站 | picsum.photos/800/400?random=3 | friend_01: 羡慕！<br>friend_06: 好美的地方 |
| friend_04 | 教你做红烧肉 | picsum.photos/800/400?random=4 | friend_07: 看起来很好吃！<br>friend_08: 明天就做 |
| friend_05 | 读完《百年孤独》 | picsum.photos/800/400?random=5 | friend_09: 经典之作<br>friend_10: 有什么感想？ |

#### 初始化数据脚本 (scripts/init_data.py)
```python
import os
import json
import uuid
from datetime import datetime, timezone

# 预设用户数据
PRESET_USERS = [
    {"username": "friend_01", "password": "password123", "seed": "Alice", "bio": "喜欢摄影"},
    {"username": "friend_02", "password": "password123", "seed": "Bob", "bio": "音乐爱好者"},
    {"username": "friend_03", "password": "password123", "seed": "Charlie", "bio": "旅行达人"},
    {"username": "friend_04", "password": "password123", "seed": "Diana", "bio": "美食家"},
    {"username": "friend_05", "password": "password123", "seed": "Ethan", "bio": "书虫"},
    {"username": "friend_06", "password": "password123", "seed": "Fiona", "bio": "健身爱好者"},
    {"username": "friend_07", "password": "password123", "seed": "George", "bio": "游戏玩家"},
    {"username": "friend_08", "password": "password123", "seed": "Hannah", "bio": "电影爱好者"},
    {"username": "friend_09", "password": "password123", "seed": "Ian", "bio": "程序员"},
    {"username": "friend_10", "password": "password123", "seed": "Julia", "bio": "设计师"},
]

# 预设动态数据
PRESET_POSTS = [
    {
        "username": "friend_01",
        "content": "今天天气真好，出门拍照！",
        "images": ["https://picsum.photos/800/400?random=1"],
        "likes": ["friend_03", "friend_05"],
        "comments": [
            {"id": str(uuid.uuid4()), "username": "friend_02", "content": "拍得真好看！", "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "username": "friend_03", "content": "这是在哪里拍的？", "created_at": datetime.now(timezone.utc).isoformat()},
        ]
    },
    # ... 更多动态
]

def init_preset_data():
    """初始化预设数据到 JSON 文件"""
    # 1. 写入预设用户到 users.json
    # 2. 建立用户间好友关系到 friendships.json
    # 3. 写入预设动态到 posts.json
    pass
```

#### 头像资源说明
- **默认头像**: DiceBear API（免费，无需认证）
  - URL: `https://api.dicebear.com/9.x/adventurer/svg?seed={username}`
- **示例图片**: Lorem Picsum（免费，无需认证）
  - URL: `https://picsum.photos/800/400?random={n}`

#### 预设数据用途
1. **便于开发测试**：无需手动创建数据即可看到完整效果
2. **好友关系演示**：新用户注册后自动拥有10个预设好友
3. **动态功能演示**：预设动态包含图片、点赞、评论
4. **UI 效果预览**：可以看到头像、图文混排等效果

### 1.8 测试规范

#### 重要性
- **所有功能必须配套测试代码**，测试通过后才能交付
- 不得交付只有代码没有测试的功能
- 每个阶段的功能完成后，必须运行自动化测试验证

#### 测试类型与框架

| 类型 | 说明 | 测试框架 |
|------|------|----------|
| API 测试 | 验证后端接口正确性 | pytest |
| UI 测试 | 验证前端页面功能 | pytest + Playwright |

#### 依赖库安装

```bash
# API 测试依赖
pip install pytest

# UI 测试依赖
pip install pytest pytest-playwright
playwright install chromium
```

#### 测试文件结构

```
tests/
├── api/                  # API 测试
│   ├── __init__.py
│   ├── test_auth.py      # 认证相关接口测试
│   ├── test_friends.py   # 好友相关接口测试
│   ├── test_messages.py  # 消息相关接口测试
│   └── test_posts.py     # 动态相关接口测试
├── ui/                   # UI 测试
│   ├── __init__.py
│   ├── test_login.py     # 登录页面测试
│   ├── test_contacts.py  # 通讯录页面测试
│   └── test_chat.py      # 聊天页面测试
├── conftest.py           # 公共 fixtures
└── run_all_tests.py      # 全量测试入口
```

#### 测试框架说明

**pytest**：Python 单元测试框架
- 用于后端 API 测试
- 支持参数化测试、fixtures 等高级特性

**Playwright**：端到端测试框架
- 用于前端 UI 测试（浏览器自动化）
- headless 模式：
  - `headless=True`：浏览器在后台运行，不可见
  - `headless=False`：浏览器可见，用于开发调试

#### API 测试示例

```python
# tests/api/test_auth.py
import pytest

def test_register_success(client):
    """测试注册成功"""
    response = client.post('/api/auth/register', json={
        'username': 'test_user',
        'password': 'password123'
    })
    assert response.status_code == 200
    assert response.json['username'] == 'test_user'

def test_login_success(client):
    """测试登录成功"""
    response = client.post('/api/auth/login', json={
        'username': 'test_user',
        'password': 'password123'
    })
    assert response.status_code == 200
    assert 'token' in response.json
```

#### UI 测试示例

```python
# tests/ui/test_login.py
import pytest

def test_login_page_loads(page):
    """测试登录页面正常加载"""
    page.goto('/login')
    assert page.locator('input[type="text"]').is_visible()
    assert page.locator('input[type="password"]').is_visible()
    assert page.locator('button[type="submit"]').is_visible()

def test_login_success(page):
    """测试登录成功"""
    page.goto('/login')
    page.fill('input[type="text"]', 'test_user')
    page.fill('input[type="password"]', 'password123')
    page.click('button[type="submit"]')
    # 验证跳转到主页
    assert '/settings' in page.url or '/contacts' in page.url
```

#### 运行测试

```bash
# 启动服务器（UI 测试前需要）
python app.py

# 运行所有测试
pytest tests/

# 仅运行 API 测试
pytest tests/api/

# 仅运行 UI 测试
pytest tests/ui/

# 以可见浏览器模式运行 UI 测试（开发调试用）
pytest tests/ui/ --headed
```

#### 测试完成标准
- [ ] API 测试覆盖所有后端接口
- [ ] UI 测试覆盖所有前端页面关键功能
- [ ] 所有测试通过后才能交付功能

---

## 2. 分阶段实现计划

本项目按以下 6 个阶段分步实现，每个阶段独立完成后，再进行下一阶段的开发。

---

## 阶段零：UI 风格选择

### 目标
确定项目整体 UI 风格，为后续开发奠定基础。

### 执行步骤
1. **了解风格**：阅读下方 6 种 UI 风格详细规范
2. **选择风格**：从以下风格中选择 1 种

| 风格编号 | 风格名称 | 特点 |
|----------|----------|------|
| UI-1 | 现代简约 | 商务风格，微妙阴影 |
| UI-2 | 玻璃拟态 | 毛玻璃效果，渐变背景 |
| UI-3 | 暗黑极简 | 深色主题，霓虹强调 |
| UI-4 | 扁平设计 | 无阴影，纯色块 |
| UI-5 | 渐变炫彩 | 彩虹渐变，动效丰富 |
| UI-6 | 复古印刷 | 衬线字体，暖色调 |

3. **确认选择**：在本文档顶部标注选定风格（如：当前选择 **UI-1 现代简约**）
4. **后续开发**：所有页面开发均遵循选定风格的 CSS 规范

### 阶段零完成标准
- [ ] 用户已了解 6 种 UI 风格详细规范
- [ ] 用户已选择确定的项目 UI 风格
- [ ] 在 SPEC.md 顶部标注选定风格（如：`当前选定：UI-1 现代简约`）

---

## 阶段一：登录注册 + 个人设置

### 目标
实现用户注册、登录、个人资料设置功能。

### 页面

| 页面 | 文件 | 说明 |
|------|------|------|
| 登录页 | login.html | 用户登录 |
| 注册页 | register.html | 用户注册 |
| 设置页 | settings.html | 个人资料管理 |

### 页面详细设计

#### 登录页 (login.html)
- 用户名输入框
- 密码输入框
- "登录" 按钮
- "没有账号？注册" 链接
- 登录成功跳转到设置页

#### 注册页 (register.html)
- 用户名输入框
- 密码输入框
- 确认密码输入框
- "注册" 按钮
- "已有账号？登录" 链接
- 注册成功后自动登录并跳转到设置页

#### 设置页 (settings.html)
- 左侧边栏：用户头像 + 用户名 + 导航菜单（消息、通讯录、发现、设置）
- 右侧内容区：
  - 头像显示 + 更换头像按钮
  - 用户名（只读显示，不可修改）
  - 个人简介（最多100字）+ 字符计数
  - 修改密码（当前密码 + 新密码 + 确认新密码）
  - 保存按钮
  - 退出登录按钮

### 功能详细设计

#### 用户注册
- **输入**：用户名、密码、确认密码
- **用户名校验规则**：
  ```
  ^[a-zA-Z_][a-zA-Z0-9_]{3,15}$
  ```
  - 长度：4-16 个字符
  - 字符：字母、数字、下划线
  - 不能以数字开头
- **密码校验**：至少6位
- **校验**：两次密码必须一致
- **响应**：返回用户信息，自动登录

#### 用户登录
- **输入**：用户名、密码
- **响应**：登录成功返回用户信息
- **错误提示**：用户名不存在 / 密码错误

#### 个人资料管理
- **修改头像**：支持选择本地图片上传，图片大小不超过5MB
- **修改个人简介**：最多100字符
- **修改密码**：需验证当前密码，新密码至少6位，两次输入一致
- **退出登录**：清除登录状态，返回登录页

### API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| POST | /api/auth/logout | 退出登录 |
| GET | /api/auth/me | 获取当前用户信息 |
| PUT | /api/users/profile | 更新个人资料（头像、简介） |
| PUT | /api/users/password | 修改密码 |
| POST | /api/users/upload-avatar | 上传头像文件 |

### 阶段一完成标准
- [ ] 用户可以注册账号
- [ ] 用户可以登录
- [ ] 用户可以看到并编辑自己的头像、简介
- [ ] 用户可以修改密码
- [ ] 用户可以退出登录

---

## 阶段二：通讯录 + 好友管理

### 目标
实现通讯录页面、搜索用户、添加好友、管理好友请求。

### 页面

| 页面 | 文件 | 说明 |
|------|------|------|
| 通讯录页 | contacts.html | 好友列表 + 搜索 + 好友请求 |

### 页面详细设计

#### 通讯录页 (contacts.html)
- 左侧边栏：用户头像 + 用户名 + 导航菜单
- 右侧内容区：
  - 搜索框（搜索用户）
  - 好友请求区域（有待处理请求时显示红点badge）
  - 好友列表（按添加时间倒序）
  - 每个好友显示：头像、昵称、简介
  - 好友操作：发消息、查看主页、删除

### 功能详细设计

#### 搜索用户
- 输入用户名进行模糊搜索
- 搜索结果显示：头像、昵称
- 搜索结果中显示与当前用户的关系状态

#### 发送好友请求
- 在搜索结果中点击"添加好友"
- 同一个用户只能发送一次好友请求
- 不能给自己发送好友请求

#### 处理好友请求
- 显示收到的所有待处理好友请求
- 每个请求显示：申请人头像、申请人昵称
- 支持"接受"和"拒绝"操作

#### 好友列表
- 显示所有已添加的好友
- 排序：按添加时间倒序
- 每个好友显示：头像、昵称、个人简介

#### 删除好友
- 从好友列表中删除好友
- 删除后双方的好友关系解除

#### 初始化数据
- 新用户注册后，自动创建10个预设好友
- 初始化脚本需要预先创建10个用户账号
- 新用户与这10个用户之间自动建立好友关系（accepted状态）

### API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/users/search?q=关键词 | 搜索用户 |
| GET | /api/friends | 获取好友列表 |
| GET | /api/friends/requests | 获取好友请求列表 |
| POST | /api/friends/requests | 发送好友请求 |
| PUT | /api/friends/requests/{id} | 处理好友请求（accept/reject） |
| DELETE | /api/friends/{username} | 删除好友 |

### 初始化数据脚本 (scripts/init_data.py)
- 创建10个预设用户（用于成为新用户的好友）
- 用户名格式：`friend_01` 到 `friend_10`
- 密码统一：`password123`
- 如果用户已存在则跳过

### 阶段二完成标准
- [ ] 用户可以搜索其他用户
- [ ] 用户可以发送好友请求
- [ ] 用户可以接受/拒绝好友请求
- [ ] 用户可以查看好友列表
- [ ] 用户可以删除好友
- [ ] 新用户自动获得10个初始好友

---

## 阶段三：即时通讯

### 目标
实现实时聊天功能，包括消息发送、接收、会话列表。

### 页面

| 页面 | 文件 | 说明 |
|------|------|------|
| 消息页 | index.html#chats | 聊天会话列表 |
| 聊天详情页 | chat.html | 聊天详情 |

### 页面详细设计

#### 消息页 (index.html#chats)
- 左侧边栏：用户头像 + 用户名 + 导航菜单
- 右侧内容区：
  - 聊天会话列表
  - 每个会话显示：好友头像、好友名、最后一条消息、消息时间
  - 有未读消息的会话显示红点
  - 点击会话跳转到聊天详情页

#### 聊天详情页 (chat.html)
- 顶部导航栏：返回按钮 + 好友名字 + 好友头像
- 中部：消息列表
  - 自己发送的消息显示在右侧（气泡样式）
  - 收到的消息显示在左侧（气泡样式）
  - 每条消息显示内容 + 时间
- 底部：输入框 + 发送按钮
- 发送消息后自动滚动到底部

### 功能详细设计

#### 发送消息
- 输入文字内容后点击发送或按Enter键发送
- 发送后立即显示在聊天窗口
- 只能给好友发送消息

#### 接收消息
- 通过 WebSocket 实时接收消息
- 在聊天详情页时，新消息直接追加显示
- 不在聊天详情页时，消息会话列表更新

#### 聊天记录
- 每次打开聊天页面时加载历史消息
- 消息按时间顺序排列
- 消息存储在服务器

#### 未读消息提示
- 会话列表中，有未读消息的好友显示红点
- 用户进入聊天页面后，清除该好友的未读状态

### WebSocket 设计

**连接地址**：`ws://host/ws`

**消息格式**：
```json
{
  "type": "message",
  "from": "zhang_san",
  "to": "li_si",
  "content": "你好！",
  "id": "uuid",
  "created_at": "ISO时间"
}
```

**事件列表**：
| 事件 | 方向 | 说明 |
|------|------|------|
| connect | 客户端→服务端 | 连接时带上session验证 |
| send_message | 客户端→服务端 | 发送消息 |
| new_message | 服务端→客户端 | 收到新消息 |
| error | 服务端→客户端 | 错误信息 |

### API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/messages/conversations | 获取会话列表 |
| GET | /api/messages/{username} | 获取与某好友的聊天记录 |

### 阶段三完成标准
- [ ] 用户可以查看聊天会话列表
- [ ] 用户可以进入聊天详情页
- [ ] 用户可以发送消息
- [ ] 用户可以实时接收消息
- [ ] 用户可以查看历史聊天记录
- [ ] 未读消息有红点提示

---

## 阶段四：朋友圈/动态

### 目标
实现动态发布、浏览、互动（点赞、评论）功能。

### 页面

| 页面 | 文件 | 说明 |
|------|------|------|
| 发现页 | friendscircle.html | 动态列表 |
| 个人主页 | profile.html | 用户动态 |

### 页面详细设计

#### 发现页 (friendscircle.html)
- 左侧边栏：用户头像 + 用户名 + 导航菜单
- 右侧内容区：
  - 发布动态入口（文字输入框 + 图片选择按钮）
  - 动态列表（按时间倒序）
  - 每条动态显示：发布者头像、昵称、内容、图片、发布时间
  - 互动区：点赞按钮 + 评论按钮
  - 点赞列表展示
  - 评论列表展示
  - 评论输入框

#### 个人主页 (profile.html)
- 顶部：用户头像、昵称、个人简介
- 如果是本人，显示"编辑资料"按钮
- 动态列表（仅该用户的动态）
- 如果不是好友且不是本人，只能浏览不可互动

### 功能详细设计

#### 发布动态
- 文字内容：最多500字
- 图片：可选，最多9张
- 发布后显示在动态列表顶部

#### 浏览动态
- 动态列表按时间倒序
- 只显示好友和自己的动态
- 图片支持点击查看大图

#### 点赞
- 点击点赞按钮点赞
- 再次点击取消点赞
- 点赞列表显示所有点赞的用户名

#### 评论
- 在动态下方输入评论
- 评论列表显示评论者头像、昵称、内容、时间
- 本人可以删除自己的评论

#### 个人主页
- 显示用户的所有动态
- 非好友只能浏览，不可互动

### API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/posts | 获取动态列表（好友+自己） |
| GET | /api/posts/mine | 获取我的动态 |
| GET | /api/posts/user/{username} | 获取指定用户的动态 |
| POST | /api/posts | 发布动态（multipart/form-data） |
| DELETE | /api/posts/{id} | 删除动态 |
| POST | /api/posts/{id}/like | 点赞 |
| DELETE | /api/posts/{id}/like | 取消点赞 |
| POST | /api/posts/{id}/comments | 添加评论 |
| DELETE | /api/posts/{id}/comments/{comment_id} | 删除评论 |

### 阶段四完成标准
- [ ] 用户可以发布动态（文字+图片）
- [ ] 用户可以浏览动态列表
- [ ] 用户可以点赞/取消点赞
- [ ] 用户可以评论
- [ ] 用户可以删除自己的动态和评论
- [ ] 用户可以查看他人个人主页

---

## 阶段五：管理后台

### 目标
实现管理员后台，用于管理用户和动态。

### 页面

| 页面 | 文件 | 说明 |
|------|------|------|
| 管理员登录页 | admin.html | 管理员登录 |
| 管理后台 | admin.html | 数据统计 + 用户管理 + 动态管理 |

### 页面详细设计

#### 管理员登录
- 用户名输入框
- 密码输入框
- 登录按钮
- 默认管理员账号：admin / 111111

#### 管理后台
- 左侧：统计概览
  - 总用户数
  - 总动态数
  - 本月活跃用户数
  - 今日活跃用户数
- 中间/右侧：
  - 用户列表（用户名、头像、注册时间、好友数、动态数）
  - 动态列表（发布者、内容、点赞数、评论数、发布时间）
  - 可以查看动态详情（含评论）

### 功能详细设计

#### 管理员登录
- 验证管理员账号密码
- 登录成功进入管理后台

#### 数据统计
- 实时统计：
  - 用户总数
  - 动态总数
  - 本月活跃用户数（当月有登录的用户）
  - 今日活跃用户数

#### 用户管理
- 展示所有用户列表
- 显示每个用户的好友数量和动态数量
- 支持查看用户详情

#### 动态管理
- 展示所有动态列表
- 支持查看动态详情（包括评论）
- 支持删除违规动态

### API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/admin/login | 管理员登录 |
| POST | /api/admin/logout | 管理员登出 |
| GET | /api/admin/stats | 获取统计数据 |
| GET | /api/admin/users | 获取用户列表 |
| GET | /api/admin/posts | 获取动态列表 |
| GET | /api/admin/posts/{id} | 获取动态详情 |

### 阶段五完成标准
- [x] 管理员可以登录
- [x] 管理员可以查看数据统计
- [x] 管理员可以查看用户列表
- [x] 管理员可以查看动态列表
- [x] 管理员可以删除动态

---

## 3. UI/UX 设计规范

> **注意**：以下为 UI-1（现代简约）风格的默认规范。项目实际使用哪种风格，由用户在第一阶段选择后确定。

### 3.1 设计风格
- 简约现代风格
- 圆角卡片：`border-radius: 12px`
- 微妙阴影：`box-shadow: 0 2px 8px rgba(0,0,0,0.08)`
- 充足留白：元素间距 16px-24px
- 渐变背景：登录页使用柔和渐变

---

### 附录：6 种 UI 风格详细规范

#### UI-1：现代简约 (Modern Minimalist) - 当前项目使用

| 属性 | 值 |
|------|-----|
| 主色调 | #6366F1 (靛蓝) |
| 主色调-hover | #4F46E5 |
| 背景色 | #F8FAFC |
| 卡片色 | #FFFFFF |
| 文字主色 | #1E293B |
| 文字次色 | #64748B |
| 边框色 | #E2E8F0 |
| 强调色 | #8B5CF6 (紫色) |
| 危险色 | #EF4444 |
| 成功色 | #10B981 |
| 圆角 | 10-12px |
| 阴影 | 微妙阴影 |
| 字体 | 系统字体栈 |
| 边栏宽度 | 240px |

#### UI-2：玻璃拟态 (Glassmorphism)

| 属性 | 值 |
|------|-----|
| 背景 | 渐变背景 (#667eea → #764ba2 → #f093fb) |
| 卡片效果 | 半透明毛玻璃 (backdrop-filter: blur) |
| 透明度 | rgba(255,255,255,0.15) |
| 边框 | rgba(255,255,255,0.3) |
| 圆角 | 20-24px |
| 阴影 | 柔和投影 |
| 字体 | 系统字体栈 |
| 特色 | 毛玻璃模糊效果、渐变背景 |

#### UI-3：暗黑极简 (Dark Mode)

| 属性 | 值 |
|------|-----|
| 背景色 | #0a0a0f (深黑) |
| 卡片色 | #13131a (深灰) |
| 边框色 | #1f1f2e |
| 文字主色 | #FFFFFF |
| 文字次色 | #6b7280 |
| 强调色 | 渐变 (#00d4ff → #7b2ff7) |
| 在线状态 | #10B981 (发光效果) |
| 圆角 | 12-16px |
| 阴影 | 霓虹发光效果 |
| 字体 | SF Pro Display |

#### UI-4：扁平设计 (Flat Design)

| 属性 | 值 |
|------|-----|
| 主色调 | #3498DB (纯蓝) |
| 背景色 | #ECF0F1 (浅灰) |
| 卡片色 | #FFFFFF |
| 边框色 | #BDC3C7 |
| 文字主色 | #2C3E50 |
| 文字次色 | #7F8C8D |
| 在线状态 | #2ECC71 |
| 圆角 | 8-10px |
| 阴影 | 无阴影（纯平） |
| 字体 | 系统字体栈 |
| 特色 | 无阴影、无渐变、纯色块 |

#### UI-5：渐变炫彩 (Gradient Colorful)

| 属性 | 值 |
|------|-----|
| 背景 | 彩虹渐变动效 (400% 动画) |
| 主色调 | #FF6B6B → #9B59B6 |
| 卡片色 | rgba(255,255,255,0.95) |
| 文字主色 | #1F2937 |
| 文字次色 | #6B7280 |
| 强调色 | 渐变文字 |
| 圆角 | 16-20px |
| 阴影 | 彩色投影 |
| 字体 | 系统字体栈 |
| 特色 | 动态渐变背景、悬停动效 |

#### UI-6：复古印刷 (Vintage)

| 属性 | 值 |
|------|-----|
| 主色调 | #8B5A2B (棕褐) |
| 背景色 | #F5E6D3 (米黄) |
| 卡片色 | #FFFEF7 (象牙白) |
| 边框色 | #D4C4A8 |
| 文字主色 | #5D4E37 |
| 文字次色 | #8B7355 |
| 在线状态 | #6B8E23 |
| 圆角 | 2-4px (直角/微圆) |
| 阴影 | 无或极淡 |
| 字体 | Palatino/Georgia (衬线) |
| 特色 | 纸质纹理、虚线边框、衬线字体 |

---

### 3.2 配色方案（UI-1 默认）
```
主色调：#6366F1 (靛蓝)
主色调-hover：#4F46E5
背景色：#F8FAFC (浅灰蓝)
卡片色：#FFFFFF
文字主色：#1E293B
文字次色：#64748B
边框色：#E2E8F0
强调色：#8B5CF6 (紫色)
危险色：#EF4444
成功色：#10B981
```

### 3.3 字体
```
主字体：-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif
标题：24px / 20px / 18px
正文：16px
辅助文字：14px / 12px
```

### 3.4 布局
- 左侧边栏：240px 固定宽度
- 主内容区：自适应剩余空间
- 响应式：移动端（<=768px）切换为顶部导航

### 3.5 响应式断点
```
手机：<= 768px
平板：769px - 1024px
桌面：> 1024px
```

---

## 4. 附录

### 4.1 用户名正则校验说明
```regex
^[a-zA-Z_][a-zA-Z0-9_]{3,15}$
```
- 必须以字母或下划线开头
- 后续可以是字母、数字或下划线
- 总长度 4-16 个字符

### 4.2 默认头像
新用户默认使用 DiceBear 生成的卡通头像：
```
https://api.dicebear.com/9.x/adventurer/svg?seed={username}
```

---

## 5. 部署需求

### 5.1 网络访问配置
- **绑定地址**: `0.0.0.0`（允许局域网内所有设备访问）
- **访问方式**: 启动服务后，同一 WiFi 下的手机/电脑可通过 `http://[电脑IP]:5000` 访问
- **本地访问**: `http://localhost:5000` 或 `http://127.0.0.1:5000`

### 5.2 配置示例
```python
socketio.run(app, debug=True, host='0.0.0.0', port=5000)
```

### 5.3 注意事项
- **开发环境**: 此配置仅适用于本地开发调试
- **安全性**: `debug=True` 模式下不应暴露给不受信任的网络
- **防火墙**: 确保本地防火墙允许 5000 端口的入站连接

---

*文档版本：2.0*
*创建日期：2026-05-13*
*更新日期：2026-05-13*