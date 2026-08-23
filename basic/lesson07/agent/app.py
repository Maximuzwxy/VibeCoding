import json
import requests
import os
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

def _load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    os.environ.setdefault(key.strip(), val.strip())

_load_env()

API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
API_URL = os.environ.get("DEEPSEEK_API_URL", "https://api.deepseek.com/chat/completions")
MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FILES_DIR = os.path.join(BASE_DIR, "files")
HISTORY_FILE = os.path.join(BASE_DIR, "data", "history.json")
SYSTEM_PROMPT_FILE = os.path.join(BASE_DIR, "data", "system_prompt.json")

def load_history():
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_history(history):
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

def load_system_prompt():
    if os.path.exists(SYSTEM_PROMPT_FILE):
        with open(SYSTEM_PROMPT_FILE, "r", encoding="utf-8") as f:
            return json.load(f).get("prompt", "")
    return ""

def save_system_prompt(prompt):
    with open(SYSTEM_PROMPT_FILE, "w", encoding="utf-8") as f:
        json.dump({"prompt": prompt}, f, ensure_ascii=False, indent=2)

def clear_system_prompt():
    save_system_prompt("")

history = load_history()
current_system_prompt = load_system_prompt()

def get_messages_with_system():
    messages = []
    system_hint = """【重要规则 - 必须严格遵守】
1. 当你需要操作文件（读/写/删/查）时，必须调用对应的工具函数（read_file/list_files/write_file/delete_file）。严禁在未调用工具的情况下声称已完成文件操作。
2. 删除文件前，先用 list_files 查看有哪些文件，确认文件名后再调用 delete_file。
3. 当用户要求设定AI角色/人设时（如"你是一位xxx"），必须立即调用update_system_prompt工具，禁止仅在回复中声称"已设定角色"而不实际调用工具。"""
    if current_system_prompt:
        messages.append({"role": "system", "content": current_system_prompt})
    messages.append({"role": "system", "content": system_hint})
    messages.extend(history)
    return messages

def execute_update_system_prompt(args):
    """执行更新 system prompt 的函数"""
    role = args.get("role", "")
    save_system_prompt(role)
    global current_system_prompt
    current_system_prompt = role
    return {"status": "success", "message": f"System prompt updated to: {role}"}

def execute_read_file(args):
    """执行读取文件的函数"""
    file_path = args.get("file_path", "")
    if not file_path:
        return {"status": "error", "message": "file_path is required"}
    
    if not os.path.exists(file_path):
        return {"status": "error", "message": f"File not found: {file_path}"}
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        return {"status": "success", "content": content, "file_path": file_path}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def execute_list_files(args):
    """列出 files 目录中的文件"""
    subdir = args.get("subdir", "")
    full_dir = os.path.join(FILES_DIR, subdir) if subdir else FILES_DIR

    if not os.path.realpath(full_dir).startswith(os.path.realpath(FILES_DIR)):
        return {"status": "error", "message": "Cannot access directories outside the files directory"}

    if not os.path.exists(full_dir):
        return {"status": "error", "message": f"Directory not found: {subdir}"}

    try:
        items = []
        for entry in os.listdir(full_dir):
            entry_path = os.path.join(full_dir, entry)
            rel_path = os.path.join(subdir, entry) if subdir else entry
            items.append({
                "name": entry,
                "path": rel_path,
                "type": "directory" if os.path.isdir(entry_path) else "file",
                "size": os.path.getsize(entry_path) if os.path.isfile(entry_path) else None
            })
        # Sort: directories first, then files
        items.sort(key=lambda x: (0 if x["type"] == "directory" else 1, x["name"]))
        return {"status": "success", "items": items, "count": len(items)}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def execute_write_file(args):
    """执行写入文件的函数"""
    file_path = args.get("file_path", "")
    content = args.get("content", "")

    if not file_path:
        return {"status": "error", "message": "file_path is required"}

    # Ensure files are written to FILES_DIR
    full_path = os.path.join(FILES_DIR, file_path)

    try:
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        return {"status": "success", "message": f"File saved to {full_path}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def execute_delete_file(args):
    """执行删除文件的函数"""
    file_path = args.get("file_path", "")

    if not file_path:
        return {"status": "error", "message": "file_path is required"}

    full_path = os.path.join(FILES_DIR, file_path)

    # Safety check: ensure the resolved path stays within FILES_DIR
    if not os.path.realpath(full_path).startswith(os.path.realpath(FILES_DIR)):
        return {"status": "error", "message": "Cannot delete files outside the files directory"}

    if not os.path.exists(full_path):
        return {"status": "error", "message": f"File not found: {file_path}"}

    try:
        os.remove(full_path)
        return {"status": "success", "message": f"File deleted: {file_path}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def execute_get_current_time(args):
    """获取当前时间"""
    from datetime import datetime
    now = datetime.now()
    return {
        "status": "success",
        "datetime": now.strftime("%Y-%m-%d %H:%M:%S"),
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M:%S"),
        "weekday": now.strftime("%A"),
        "timestamp": int(now.timestamp())
    }

def execute_get_location(args):
    """获取当前位置信息"""
    try:
        geo_response = requests.get("http://ip-api.com/json/?fields=status,country,countryCode,region,regionName,city,zip,lat,lon", timeout=5)
        if geo_response.status_code == 200:
            geo_data = geo_response.json()
            if geo_data.get("status") == "success":
                return {
                    "status": "success",
                    "city": geo_data.get("city", ""),
                    "region": geo_data.get("regionName", ""),
                    "country": geo_data.get("country", ""),
                    "country_code": geo_data.get("countryCode", ""),
                    "zip": geo_data.get("zip", ""),
                    "coordinates": {
                        "lat": geo_data.get("lat"),
                        "lon": geo_data.get("lon")
                    }
                }

        return {"status": "error", "message": "Failed to determine location"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def execute_get_weather(args):
    """获取天气信息"""
    city = args.get("city", "")

    try:
        if city:
            url = f"https://wttr.in/{city}?format=j1"
        else:
            url = "https://wttr.in/?format=j1"

        response = requests.get(url, timeout=10)

        if response.status_code == 200:
            data = response.json()
            current = data.get("current_condition", [{}])[0]

            return {
                "status": "success",
                "city": city or "Current Location",
                "weather": {
                    "temperature": f"{current.get('temp_C', 'N/A')}°C",
                    "feels_like": f"{current.get('FeelsLikeC', 'N/A')}°C",
                    "humidity": f"{current.get('humidity', 'N/A')}%",
                    "description": current.get('weatherDesc', [{}])[0].get('value', 'N/A'),
                    "wind_speed": f"{current.get('windspeedKmph', 'N/A')} km/h",
                    "wind_direction": current.get('winddir16Point', 'N/A'),
                    "uv_index": current.get('uvIndex', 'N/A'),
                    "visibility": f"{current.get('visibility', 'N/A')} km"
                }
            }
        else:
            return {"status": "error", "message": f"Weather API returned status {response.status_code}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def execute_web_search(args):
    """执行网页搜索"""
    query = args.get("query", "")
    max_results = args.get("max_results", 5)

    if not query:
        return {"status": "error", "message": "query is required"}

    try:
        from ddgs import DDGS
        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                results.append({
                    "title": r.get("title", ""),
                    "url": r.get("href", ""),
                    "snippet": r.get("body", "")
                })

        if not results:
            return {"status": "success", "results": [], "message": "No results found"}

        return {
            "status": "success",
            "query": query,
            "total_results": len(results),
            "results": results
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

def execute_news_search(args):
    """执行新闻搜索"""
    query = args.get("query", "")
    max_results = args.get("max_results", 5)

    if not query:
        return {"status": "error", "message": "query is required"}

    try:
        from ddgs import DDGS
        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(f"{query} 新闻", max_results=max_results, backend="html"):
                results.append({
                    "title": r.get("title", ""),
                    "url": r.get("href", ""),
                    "snippet": r.get("body", "")
                })

        if not results:
            return {"status": "success", "results": [], "message": "No news found"}

        return {
            "status": "success",
            "query": query,
            "total_results": len(results),
            "results": results,
            "note": "Using web search as news search fallback"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

def execute_download_image(args):
    """下载图片到 files 目录"""
    import os
    from urllib.parse import urlparse

    url = args.get("url", "")
    filename = args.get("filename", "")

    if not url:
        return {"status": "error", "message": "url is required"}

    if not filename:
        parsed = urlparse(url)
        filename = os.path.basename(parsed.path)
        if not filename or '.' not in filename:
            filename = "downloaded_image.jpg"

    if not os.path.isabs(filename):
        filename = os.path.join(FILES_DIR, filename)

    try:
        os.makedirs(os.path.dirname(filename) if os.path.dirname(filename) else ".", exist_ok=True)

        response = requests.get(url, timeout=30, stream=True)
        response.raise_for_status()

        content_type = response.headers.get('Content-Type', '')
        if not content_type.startswith('image/'):
            return {"status": "error", "message": f"URL does not point to an image. Content-Type: {content_type}"}

        with open(filename, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        file_size = os.path.getsize(filename)
        return {
            "status": "success",
            "message": f"Image downloaded to {filename}",
            "file_path": filename,
            "file_size": file_size,
            "content_type": content_type
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# 定义可用的 skills/tools
SKILLS = {
    "update_system_prompt": execute_update_system_prompt,
    "read_file": execute_read_file,
    "list_files": execute_list_files,
    "write_file": execute_write_file,
    "delete_file": execute_delete_file,
    "get_current_time": execute_get_current_time,
    "get_location": execute_get_location,
    "get_weather": execute_get_weather,
    "web_search": execute_web_search,
    "news_search": execute_news_search,
    "download_image": execute_download_image
}

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "delete_file",
            "description": "Delete a file from the files directory",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "The path of the file to delete, relative to the files directory"
                    }
                },
                "required": ["file_path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_system_prompt",
            "description": "当用户明确要求设定/更改AI的角色、人设或行为设定时，调用此工具。例如用户说'你是一位xxx'、'你充当xxx'、'你是xxx'时使用。从用户输入中提取角色描述作为role参数传入。",
            "parameters": {
                "type": "object",
                "properties": {
                    "role": {
                        "type": "string",
                        "description": "用户要求的角色或人设描述"
                    }
                },
                "required": ["role"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read the content of a file from the filesystem",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "The path to the file to read"
                    }
                },
                "required": ["file_path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_files",
            "description": "List all files and directories in the files directory. Use this to browse what files are available before reading, deleting, or writing.",
            "parameters": {
                "type": "object",
                "properties": {
                    "subdir": {
                        "type": "string",
                        "description": "Optional subdirectory path to list (e.g. 'images' or 'project/src')"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Write content to a file, creating the file if it doesn't exist or overwriting if it does",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "The path where the file should be written"
                    },
                    "content": {
                        "type": "string",
                        "description": "The content to write to the file"
                    }
                },
                "required": ["file_path", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_current_time",
            "description": "Get the current date and time",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_location",
            "description": "Get the city where the server is deployed (based on server IP). Use this when the user asks about their current location or nearby weather.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather information for a city",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "The city name to get weather for (e.g. 'Beijing', 'Shanghai', 'Tokyo')"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "download_image",
            "description": "Download an image from a URL and save it to the files directory",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The URL of the image to download"
                    },
                    "filename": {
                        "type": "string",
                        "description": "The filename to save as (optional, will auto-detect from URL if not provided)"
                    }
                },
                "required": ["url"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for information",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Maximum number of results to return (default: 5)"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "news_search",
            "description": "Search for news articles",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query for news"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Maximum number of news results to return (default: 5)"
                    }
                },
                "required": ["query"]
            }
        }
    }
]

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_input = data.get("message", "")

    user_msg = {"role": "user", "content": user_input}
    history.append(user_msg)
    save_history(history)

    messages = get_messages_with_system()
    request_response_pairs = []

    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}"
        }

        payload = {
            "model": MODEL,
            "messages": messages,
            "tools": TOOLS,
            "tool_choice": "auto"
        }

        response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        result = response.json()

        request_response_pairs.append({
            "request": payload,
            "response": result,
            "tool_executions": []
        })

        while result["choices"][0]["message"].get("tool_calls"):
            tool_call = result["choices"][0]["message"]["tool_calls"][0]
            func_name = tool_call["function"]["name"]
            try:
                args = json.loads(tool_call["function"]["arguments"])
            except json.JSONDecodeError as e:
                return jsonify({"error": f"Failed to parse arguments for {func_name}: {e}"}), 500

            if func_name in SKILLS:
                execution_result = SKILLS[func_name](args)

                tool_message = {
                    "role": "tool",
                    "content": json.dumps(execution_result),
                    "tool_call_id": tool_call["id"]
                }

                messages.append({
                    "role": "assistant",
                    "content": None,
                    "tool_calls": [tool_call]
                })
                messages.append(tool_message)

                request_response_pairs[-1]["tool_executions"].append({
                    "function": func_name,
                    "arguments": args,
                    "result": execution_result
                })

                payload2 = {
                    "model": MODEL,
                    "messages": messages,
                    "tools": TOOLS,
                    "tool_choice": "auto"
                }

                response2 = requests.post(API_URL, headers=headers, json=payload2, timeout=60)
                response2.raise_for_status()
                result = response2.json()

                request_response_pairs.append({
                    "request": payload2,
                    "response": result,
                    "tool_executions": []
                })
            else:
                break

        assistant_content = result["choices"][0]["message"]["content"]
        assistant_msg = {"role": "assistant", "content": assistant_content}
        history.append(assistant_msg)
        save_history(history)

        return jsonify({
            "reply": assistant_content,
            "request_response_pairs": request_response_pairs
        })

    except Exception as e:
        if len(history) > 1:
            history.pop()
            save_history(history)
        return jsonify({"error": str(e)}), 500

@app.route("/api/history", methods=["GET"])
def get_history():
    return jsonify({"history": history})

@app.route("/api/clear", methods=["POST"])
def clear_history():
    global history, current_system_prompt
    history = []
    current_system_prompt = ""
    save_history(history)
    clear_system_prompt()
    return jsonify({"status": "cleared"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5007, debug=True)