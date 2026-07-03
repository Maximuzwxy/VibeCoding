from flask import Flask, render_template, jsonify, request
import json
import os

# 从项目根目录的 .env 文件加载环境变量
def _load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    os.environ.setdefault(key.strip(), val.strip())

_load_env()

DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_API_URL = os.environ.get("DEEPSEEK_API_URL", "https://api.deepseek.com/chat/completions")
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")

app = Flask(__name__)

# 数据目录
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

@app.route('/')
def index():
    """太阳系主页"""
    return render_template('index.html')

@app.route('/api/health')
def health():
    """健康检查"""
    return jsonify({'status': 'ok', 'project': 'solar'})

# ==================== 数据 API ====================

@app.route('/api/data/solar_system')
def get_solar_system():
    """获取太阳系主场景数据"""
    filepath = os.path.join(DATA_DIR, 'solar_system.json')
    if not os.path.exists(filepath):
        return jsonify({'error': 'Data not found'}), 404
    with open(filepath, 'r', encoding='utf-8') as f:
        return jsonify(json.load(f))

@app.route('/api/data/celestial/<celestial_id>')
def get_celestial_data(celestial_id):
    """通用天体数据接口"""
    search_paths = [
        os.path.join(DATA_DIR, 'planets', f'{celestial_id}.json'),
        os.path.join(DATA_DIR, 'moons', f'{celestial_id}.json'),
        os.path.join(DATA_DIR, f'{celestial_id}.json'),
    ]
    for filepath in search_paths:
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                return jsonify(json.load(f))
    return jsonify({'error': f'Celestial {celestial_id} not found'}), 404

@app.route('/api/data/planet/<planet_name>')
def get_planet_data(planet_name):
    """获取行星数据"""
    filepath = os.path.join(DATA_DIR, 'planets', f'{planet_name}.json')
    if not os.path.exists(filepath):
        return jsonify({'error': 'Planet not found'}), 404
    with open(filepath, 'r', encoding='utf-8') as f:
        return jsonify(json.load(f))

@app.route('/api/data/moon/<moon_name>')
def get_moon_data(moon_name):
    """获取卫星数据"""
    filepath = os.path.join(DATA_DIR, 'moons', f'{moon_name}.json')
    if not os.path.exists(filepath):
        return jsonify({'error': 'Moon not found'}), 404
    with open(filepath, 'r', encoding='utf-8') as f:
        return jsonify(json.load(f))

# ==================== 题库 API ====================

@app.route('/api/quiz/<quiz_type>')
def get_quiz_questions(quiz_type):
    """获取题库"""
    filepath = os.path.join(DATA_DIR, 'quizzes', f'{quiz_type}.json')
    if not os.path.exists(filepath):
        return jsonify({'error': 'Quiz not found'}), 404
    with open(filepath, 'r', encoding='utf-8') as f:
        return jsonify(json.load(f))

@app.route('/api/quiz/generate', methods=['POST'])
def generate_quiz():
    """调用 DeepSeek 生成选择题"""
    import requests

    topic = request.json.get('topic', 'solar_system')
    language = request.json.get('language', 'zh')
    exclude_questions = request.json.get('exclude_questions', [])

    exclude_prompt = ''
    if exclude_questions:
        exclude_prompt = f'\n注意：请避免生成与以下题目相似或重复的内容：\n{chr(10).join("- " + q for q in exclude_questions[:20])}'

    prompt = f"""请生成 10 道关于{topic}的选择题，使用中英文双语格式。
每道题包含：
- question: 问题（中英文双语对象，含 zh 和 en）
- options: 4 个选项（每个都有 zh 和 en）
- answer: 正确答案索引 0-3
- explanation: 解析（中英文双语对象）
{exclude_prompt}

请以纯 JSON 数组格式返回，不要其他说明。
[
  {{
    "question": {{"zh": "太阳系中最大的行星是哪颗？", "en": "Which is the largest planet?"}},
    "options": [
      {{"zh": "土星", "en": "Saturn"}},
      {{"zh": "木星", "en": "Jupiter"}},
      {{"zh": "天王星", "en": "Uranus"}},
      {{"zh": "海王星", "en": "Neptune"}}
    ],
    "answer": 1,
    "explanation": {{"zh": "木星是太阳系中最大的行星。", "en": "Jupiter is the largest planet."}}
  }}
]"""

    try:
        headers = {
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": DEEPSEEK_MODEL,
            "messages": [
                {"role": "system", "content": "你是一个教育助手，负责生成知识测试题目。所有题目必须使用中英文双语格式返回纯JSON。"},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "thinking": {"type": "disabled"}
        }
        response = requests.post(DEEPSEEK_API_URL, headers=headers, json=payload, timeout=120)
        result = response.json()
        content = result['choices'][0]['message']['content']
        content = content.replace('```json', '').replace('```', '').strip()
        questions = json.loads(content)
        return jsonify({'questions': questions})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/quiz/save', methods=['POST'])
def save_question():
    """保存题目到本地题库"""
    topic = request.json.get('topic', 'solar_system')
    new_question = request.json.get('question')
    if not new_question:
        return jsonify({'error': 'Question is required'}), 400

    try:
        quiz_file = os.path.join(DATA_DIR, 'quizzes', f'{topic}.json')
        if os.path.exists(quiz_file):
            with open(quiz_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            data = {'questions': []}

        existing = data.get('questions', [])
        new_question['id'] = f'q_{topic[:4]}_{len(existing) + 1:03d}'

        # 去重检查
        new_q_zh = new_question.get('question', {}).get('zh', '')
        for eq in existing:
            eq_zh = eq.get('question', {}).get('zh', '') if isinstance(eq.get('question'), dict) else ''
            if eq_zh and eq_zh == new_q_zh:
                return jsonify({'success': False, 'duplicate': True, 'error': '题目已存在'})

        existing.append(new_question)
        data['questions'] = existing

        with open(quiz_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# 对话历史（内存中，服务器重启后清空）
chat_history = []


@app.route('/api/chat', methods=['POST'])
def chat():
    """AI 对话（DeepSeek V4 Flash），带上下文记忆"""
    import requests
    data = request.get_json()
    message = data.get('message', '')
    language = data.get('language', 'zh')
    system_prompt = data.get('system_prompt', '')

    if not message:
        return jsonify({'error': 'Message is required'}), 400

    try:
        headers = {
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json"
        }

        # 构建完整消息列表：system + history + 当前用户消息
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(chat_history)
        messages.append({"role": "user", "content": message})

        payload = {
            "model": DEEPSEEK_MODEL,
            "messages": messages,
            "temperature": 0.7,
            "thinking": {"type": "disabled"}
        }
        response = requests.post(DEEPSEEK_API_URL, headers=headers, json=payload, timeout=60)
        result = response.json()
        reply = result['choices'][0]['message']['content']

        # 追加到历史
        chat_history.append({"role": "user", "content": message})
        chat_history.append({"role": "assistant", "content": reply})

        return jsonify({'reply': reply})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=6660)
