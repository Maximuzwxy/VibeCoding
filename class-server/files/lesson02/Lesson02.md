# 02 Code, Docs, Memory & Games

## Why Split HTML, CSS, and JS?

- **Separation of concerns**: HTML handles structure, CSS handles styling, JS handles logic — each file has a single responsibility.
- **Code reusability**: Styles and scripts can be shared across multiple pages.
- **Readability & maintainability**: Smaller, focused files are easier to read, debug, and modify.
- **Collaboration**: Front-end developers can work on different files simultaneously without conflicts.
- **Project memory rule**: In this course, all HTML files must be split into three files: `index.html`, `style.css`, and `script.js`. The original file should be preserved.

## Exercise: Split the Little Prince HTML

1. Open `lesson02/little_prince.html` — observe the inline `<style>` and `<script>` blocks.
2. Create a new folder (e.g., `little_prince_split/`) and ask AI to split it into three files: `index.html` (structure only), `style.css` (all extracted styles), `script.js` (all extracted JavaScript).
3. Verify that the split version works the same as the original.

Example prompt for step 2:

```text
Split little_prince.html into three separate files: index.html (HTML structure only, link to style.css via <link> and script.js via <script>), style.css (all styles), script.js (all scripts). Keep the original file unchanged.
```

## Project Memory

Trae IDE supports a **project memory** feature. To configure it:

1. Open Trae IDE **Settings** → **Rules & Memory** → **Rules**
2. Create a **project-level rule** file
3. Paste the rule content below into that file

This rule acts as persistent context that AI references in every conversation within the project. Update it whenever you establish a new convention you want AI to remember.

Copy and paste the following into your project rule:

```
Rule: Split HTML into Three Separate Files

All HTML files must be split into three independent files: HTML (structure), CSS (styling), and JavaScript (logic). Inline <style> and <script> tags are not allowed. The original file must be preserved.

- index.html — Contains only the HTML structure. Links to external CSS via <link rel="stylesheet" href="style.css"> and external JS via <script src="script.js"></script> .
- style.css — Contains all CSS rules extracted from the original <style> block.
- script.js — Contains all JavaScript logic extracted from the original <script> block.
```

## Markdown: The AI-Friendly Format

Markdown (`.md`) is a lightweight plain-text format for writing structured documents.

- Unlike Word or PDF, Markdown is **plain text with simple symbols** for formatting — headings, lists, tables, and code blocks.
- **Why AI loves it**: AI tools can read and generate Markdown natively with perfect accuracy, making it the go-to format for project specs, documentation, rules, and memory files.
- In this course, you'll use Markdown for: lesson materials, project requirements (`steps.md`), memory rules (`project_memory.md`), and homework notes.

## Git: A Quick Intro

Git is a **version control system** — it tracks changes to your code over time.

- Think of it as an unlimited "undo" history for your entire project folder.
- You can save checkpoints (**commits**), revert to any previous version, and collaborate with others without overwriting each other's work.
- In this course, Git is useful for backing up your progress and comparing changes between lessons.

## Pong Game: Step-by-Step

Build a 2D Pong game in four steps. (For detailed requirements, see `pong_game/steps.md`.)

### Step 1: Classic Pong
Two-player Pong with a start screen, ball physics, score tracking, and keyboard controls (W/S for left, ↑/↓ for right).

### Step 2: Human vs AI Mode
Each side can independently switch between Human and AI. AI auto-tracks the ball with limited speed.

### Step 3: Buff Power-ups
Five buff types (Slow Down, Split, Color Change, Enlarge Paddle, Shrink Opponent) appear as colored blocks. Paddle contact activates them with round-based durations.

### Step 4: Settings Panel
A full-screen settings panel to configure buff frequency, ball speed parameters, and paddle size limits.

---

## Tips

- **Class Server**: http://192.168.66.207:6688
- **Starting a New Project**: Always create a new folder and start a fresh AI chat session. Make sure AI recognizes the new directory context and generates all subsequent code within it.
- **Submitting Homework**: At the end of class, submit your assignment by compressing (zipping) your project folder and uploading it.
- **Console Logs**: If the program behaves unexpectedly, always check the browser Console logs for error messages. Press F12 or Ctrl+Shift+J / Cmd+Option+C to open the Console.
