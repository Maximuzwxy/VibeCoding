# 07 Call LLM API to Create Your Own Agent

## Tips

- **Class Server**: http://192.168.3.38:6688
- **Starting a New Project**: Always create a new folder and start a fresh AI chat session. Make sure AI recognizes the new directory context and generates all subsequent code within it.
- **Submitting Homework**: At the end of class, submit your assignment by compressing (zipping) your project folder and uploading it.
- **Console Logs**: If the program behaves unexpectedly, always check the browser Console logs for error messages. Press F12 or Ctrl+Shift+J / Cmd+Option+C to open the Console.

## What is a Large Language Model (LLM)?

### Model vs. Agent

When you use apps like **Doubao** or **ChatGPT**, you're not talking directly to the model — you're talking to an **Agent**. The agent is the whole application: it has a chat UI, it remembers your conversation history, it can search the web, and so on.

The **model** is just the brain — it takes text in and produces text out. Everything else (memory, tools, UI) is built around it by the agent.

### So what is an LLM?

Think of an LLM as a **very, very large function**:

```
input text → [LLM] → output text
```

You give it a prompt, it predicts the most likely next words and returns a response. That's it. It has no memory, no personality, no awareness — just text in, text out.

### What are "parameters"?

Parameters are the knobs inside the model that get tuned during training. Modern models like **DeepSeek** have parameters at the **trillion level** (hundreds of billions to over a trillion). That's why training takes months and costs millions of dollars.

More parameters generally means a smarter model — but also slower and more expensive to run.

### Models have no memory

Ask an LLM "What's my name?" and it has no idea — unless you tell it in the same message. Every request is independent.

So how do apps like Doubao "remember" you? The **agent** stores your conversation history and sends it along with each new message. This is what we'll build in Phase 2.

### API Key — Your Access Pass

To use an LLM, you call its **API** — just like the Flask APIs we built in previous lessons. You send a request to a URL, and it returns a response.

But you can't just call it for free — you need an **API Key**, which is like a keycard. It identifies you and tracks your usage.

### Tokens — How Billing Works

LLMs don't charge by "message" — they charge by **token**. A token is roughly:
- **1 token ≈ 3/4 of an English word**
- **1 Chinese character ≈ 1-2 tokens**

You pay for every token you send (input) and every token the model returns (output).

### Summary

| Concept | What It Is |
|---------|------------|
| **LLM** | A huge text-in, text-out function |
| **Agent** | The full app: UI + memory + tools + model |
| **Parameters** | Knobs tuned during training (trillions) |
| **API Key** | Your access pass to call the model |
| **Token** | The unit of text that you're billed for |

## How to Get an API Key

We'll use **DeepSeek** as an example:

1. Go to the DeepSeek developer platform: https://platform.deepseek.com
2. Register an account (or log in)
3. Go to **API Keys** → **Create new key**
4. Copy the key and save it — you won't be able to see it again
5. Store it in a `.env` file in your project:

```
DEEPSEEK_API_KEY=REDACTED_DEEPSEEK_KEY
```

**Important**: Never share your API key or commit it to Git. It's like a password.

Other popular LLM providers: OpenAI, Anthropic (Claude), Alibaba (Qwen), Zhipu (GLM).

## Building an Agent Step by Step

We'll build our own agent in 6 phases. Each phase adds one new capability.

### Phase 1: Basic Chat
The simplest possible LLM chat. You send a message, the model replies. But you'll quickly notice: **it has no memory**. Ask it your name after telling it 10 seconds ago — it won't know. Every request is a blank slate.

### Phase 2: Conversation History
Now we save every message to a JSON file and send the full history with each request. Suddenly the model "remembers" — it can refer back to things you said earlier. This is the simplest way to make a model feel intelligent.

### Phase 3: Function Calling
We give the model the ability to call **functions** — starting with `update_system_prompt`, which lets us change the AI's role and behavior. The model doesn't execute code itself; it tells the agent which function to call, and the agent runs it.

### Phase 4: File I/O
Now the agent can **read, list, write, and delete files**. It can browse what files exist, create new ones, read and summarize existing ones, and delete unwanted files. We also add **voice input** using the browser's built-in speech recognition.

### Phase 5: Time, Location & Weather
The model itself knows nothing about the real world. But now our agent can call `get_current_time`, `get_location`, and `get_weather` functions. Ask "What's the weather?" and the agent figures out your city, fetches weather data, and tells you.

### Phase 6: Search & Download
The final upgrade: **web search** and **image download**. The agent can search the internet for information and download images to your computer. Now it can answer questions about current events, not just what the model was trained on.

---

Detailed specs for each phase can be found in the `agent/` folder (Chinese) or `agent-en/` folder (English).
