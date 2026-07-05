# 01 Getting Started: AI-Powered Coding

---

## 1. What is Vibe Coding

Vibe Coding is a new way of programming — instead of writing every line of code yourself, you **describe what you want** in natural language, and an AI assistant inside your IDE generates the code for you.

- You don't memorize syntax — you express your **intent**
- You don't debug alone — you have an AI partner that helps
- You learn by doing and iterating, not by reading thick textbooks

In this course, we'll use **Trae IDE** as our AI-powered coding environment. With it, we'll build web pages, games, servers, and even a social network — all by communicating with the AI in plain language.


---

## 2. Introduction to Trae IDE

### 2.1 What is an IDE?

IDE (Integrated Development Environment) is a tool that developers use to write, debug, and manage code. It provides an all-in-one workspace including code editing, file management, debugging, and a terminal — dramatically improving development efficiency.

### 2.2 What is a Coding Agent?

A Coding Agent is an AI assistant integrated within the IDE. It can:

- Understand requirements described in natural language
- Automatically write, modify, and optimize code
- Create files and folders
- Help developers complete tasks through conversation

Simply describe what you want in plain language, and the Agent will make it happen.

### 2.3 Similar Tools

| Tool | Description |
|------|-------------|
| **Trae** | ByteDance's AI-powered IDE with a built-in Coding Agent |
| **VS Code + Copilot** | Microsoft's code editor paired with GitHub Copilot |
| **Cursor** | VS Code-based, AI-first IDE |
| **Codex** | OpenAI's code generation model, integrable into various editors |

### 2.4 Trae IDE Layout

The Trae IDE is divided into three main areas:

1. **File Explorer (left)** – Browse and manage project files and folders
2. **Code Editor (center)** – The primary area for writing and viewing code
3. **AI Chat Panel (right)** – Converse with the AI Agent and issue task commands

### 2.5 Basic Operations

#### Creating a File
- Right-click in the File Explorer → "New File", or ask the Agent directly in the AI Chat Panel

#### Creating a Folder
- Right-click in the File Explorer → "New Folder", or ask the Agent directly in the AI Chat Panel

#### What is a Markdown Document
- Markdown (.md) is a lightweight markup language — simple symbols produce richly formatted documents
- Commonly used for documentation, notes, course materials, etc.
- This file itself is a Markdown document

### 2.6 The AI Chat Panel

The AI Chat Panel is the core feature of Trae. Once you send a task, the Agent will:

- Automatically generate a **Todo List** so you can track its progress step by step
- **Modify files directly** — no manual copy-and-paste needed
- Show real-time **diff views** of every change
- Let you accept or reject each modification

### 2.7 Download

**Trae IDE — Mainland China download:**

- Official Website: https://www.trae.com.cn
- Direct Download: https://www.trae.com.cn/download

### 2.8 AI Model Configuration

In later lessons, we will use **DeepSeek** (a powerful LLM) through its API. To use it, you need to configure your API Key in the project's `.env` file:

```
DEEPSEEK_API_KEY=REDACTED_DEEPSEEK_KEY
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
```

- Place the `.env` file in the **project root directory** (same level as all `lessonXX/` folders)
- The `.env` file is excluded from Git by `.gitignore` — your key won't be leaked
- All projects across different lessons will read from this single `.env` file

---
## 3. What is HTML

### 3.1 Introduction to HTML

HTML (HyperText Markup Language) is the skeleton of a web page. It uses **tags** to describe the page's structure.

### 3.2 The Three Building Blocks

| Technology | Purpose | Analogy |
|------------|---------|---------|
| **HTML** | Defines structure and content | The skeleton of a house |
| **CSS** | Controls styling and layout | The interior decoration |
| **JavaScript** | Implements interactive logic | The electrical wiring and switches |

A complete web page = HTML + CSS + JavaScript

### 3.3 Common HTML Tags

- `<h1>` ~ `<h6>` – Heading tags
- `<p>` – Paragraph tag
- `<div>` – Container tag, used for grouping and layout
- `<a>` – Hyperlink tag
- `<button>` – Button tag
- `<style>` – Defines CSS styles
- `<script>` – Writes JavaScript code

### 3.4 Introduction to CSS

CSS (Cascading Style Sheets) is used to beautify web pages. It can be added in several ways:

- **Inline styles** – Write `style="color: red"` directly on a tag
- **Internal styles** – Define rules inside a `<style>` tag
- **Class selectors** – Define `.classname { }` and reference via `class="classname"`

### 3.5 Introduction to JavaScript

JavaScript brings a web page to life. It can:

- Respond to user events such as clicks and key presses
- Dynamically modify page content and styles
- Output debugging information to the Console

---

## 4. Fix Bugs: How to Debug

When something goes wrong, we need to debug. The most basic approach is to **open DevTools and check the Console**:

1. Open your HTML file in a browser
2. Press **F12** or right-click → "Inspect"
3. Switch to the **Console** tab
4. Look for red error messages and trace the issue from the hints provided

You can also use `console.log()` in your code to print variable values and understand the program's execution flow.

---

## 5. Classroom Exercise

Use the Trae IDE AI Agent and provide the following prompt to complete a web page exercise:

```
Create an HTML page that displays 10 paragraphs from "The Little Prince."

Add two buttons: one button randomly changes the font color of each paragraph, and the other button randomly changes the background color of each paragraph.

Each click should reapply new random colors to all paragraphs independently (text and background chosen per paragraph), and ensure the text remains readable by avoiding identical text/background colors.
```

**Key Requirements:**
- 10 paragraphs from *The Little Prince*
- Two buttons: one for font color, one for background color
- Each click randomly reassigns colors to all paragraphs
- Text and background colors are chosen independently per paragraph
- Ensure text and background colors are never identical so the text stays readable

