from flask import Flask, render_template, jsonify, request
import json
import os
import requests

def _load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
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
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-v4-pro")

app = Flask(__name__)

# 数据目录
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

@app.route('/')
def index():
    """太阳系主页"""
    return render_template('index.html')

@app.route('/planet/<planet_name>')
def planet_page(planet_name):
    """行星详情页"""
    return render_template(f'planets/{planet_name}.html')

@app.route('/api/data/solar_system')
def get_solar_system_data():
    """获取太阳系主场景数据"""
    with open(os.path.join(DATA_DIR, 'solar_system.json'), 'r', encoding='utf-8') as f:
        data = json.load(f)
    return jsonify(data)

@app.route('/api/data/planet/<planet_name>')
def get_planet_data(planet_name):
    """获取指定行星数据"""
    filepath = os.path.join(DATA_DIR, 'planets', f'{planet_name}.json')
    if not os.path.exists(filepath):
        return jsonify({'error': 'Planet not found'}), 404
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return jsonify(data)

@app.route('/api/data/moon/<moon_name>')
def get_moon_data(moon_name):
    """获取指定卫星数据"""
    filepath = os.path.join(DATA_DIR, 'moons', f'{moon_name}.json')
    if not os.path.exists(filepath):
        return jsonify({'error': 'Moon not found'}), 404
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return jsonify(data)

@app.route('/api/quiz/<quiz_type>')
def get_quiz_questions(quiz_type):
    """获取本地题库"""
    filepath = os.path.join(DATA_DIR, 'quizzes', f'{quiz_type}.json')
    if not os.path.exists(filepath):
        return jsonify({'error': 'Quiz not found'}), 404
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return jsonify(data)

@app.route('/api/quiz/generate', methods=['POST'])
def generate_quiz():
    """调用通义千问 API 生成 10 道题目（中英文双语格式，排除已有题目）"""
    topic = request.json.get('topic')
    language = request.json.get('language', 'zh')
    exclude_questions = request.json.get('exclude_questions', [])  # 已有题目列表，用于去重

    import requests

    # 构建提示词
    lang_name = '中文' if language == 'zh' else 'English'

    exclude_prompt = ''
    if exclude_questions:
        exclude_prompt = f'\n注意：请避免生成与以下题目相似或重复的内容：\n{chr(10).join("- " + q for q in exclude_questions[:10])}'

    prompt = f"""请生成 10 道关于{topic}的选择题，使用中英文双语格式。
每道题包含：
- 问题（中英文双语）
- 4 个选项（每个选项都有中英文）
- 正确答案（选项索引 0-3）
- 解析（中英文双语）
{exclude_prompt}

请以纯 JSON 数组格式返回，不要其他说明。格式示例：
[
  {{
    "question": {{
      "zh": "太阳系中最大的行星是哪颗？",
      "en": "Which is the largest planet in the Solar System?"
    }},
    "options": [
      {{"zh": "土星", "en": "Saturn"}},
      {{"zh": "木星", "en": "Jupiter"}},
      {{"zh": "天王星", "en": "Uranus"}},
      {{"zh": "海王星", "en": "Neptune"}}
    ],
    "answer": 1,
    "explanation": {{
      "zh": "木星是太阳系中最大的行星...",
      "en": "Jupiter is the largest planet..."
    }}
  }}
]

注意：
1. 所有题目必须使用上述双语 JSON 格式
2. 问题、选项、解析都必须同时包含中文 (zh) 和英文 (en)
3. 答案质量要高，适合学生学习
4. 确保题目不重复，内容准确
"""

    try:
        headers = {
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": DEEPSEEK_MODEL,
            "messages": [
                {"role": "system", "content": "你是一个教育助手，负责生成知识测试题目。请确保题目新颖，不与已有题目重复。所有题目必须使用中英文双语格式返回。"},
                {"role": "user", "content": prompt}
            ]
        }
        response = requests.post(DEEPSEEK_API_URL, headers=headers, json=payload)
        result = response.json()
        content = result['choices'][0]['message']['content']

        content = content.replace('```json', '').replace('```', '').strip()
        questions = json.loads(content)

        return jsonify({'questions': questions})
    except Exception as e:
        return jsonify({'error': f'LLM request failed: {str(e)}'}), 500

@app.route('/api/quiz/save', methods=['POST'])
def save_question():
    """保存题目到本地题库（支持双语格式）"""
    topic = request.json.get('topic', 'solar_system')
    new_question = request.json.get('question')

    if not new_question:
        return jsonify({'error': 'Question is required'}), 400

    try:
        # 读取现有题库
        quiz_file = os.path.join(DATA_DIR, 'quizzes', f'{topic}.json')

        if os.path.exists(quiz_file):
            with open(quiz_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            data = {'questions': []}

        # 生成 ID：q_sun_序号
        existing_questions = data.get('questions', [])
        next_id_num = len(existing_questions) + 1
        new_question['id'] = f'q_sun_{next_id_num:03d}'  # q_sun_014

        # 检查是否已存在（双语格式检查）
        new_question_text_zh = ''
        new_question_text_en = ''
        if isinstance(new_question.get('question', ''), dict):
            new_question_text_zh = new_question['question'].get('zh', '')
            new_question_text_en = new_question['question'].get('en', '')
        else:
            new_question_text_zh = new_question.get('question', '')

        for q in existing_questions:
            # 双语格式检查
            existing_text_zh = ''
            existing_text_en = ''
            if isinstance(q.get('question', ''), dict):
                existing_text_zh = q['question'].get('zh', '')
                existing_text_en = q['question'].get('en', '')
            else:
                existing_text_zh = q.get('question', '')
            
            # 检查中文或英文是否重复
            if existing_text_zh == new_question_text_zh or (new_question_text_en and existing_text_en == new_question_text_en):
                return jsonify({'error': '题目已存在', 'duplicate': True}), 409

        # 添加新题目
        data['questions'].append(new_question)

        # 保存回文件（紧凑格式）
        with open(quiz_file, 'w', encoding='utf-8') as f:
            # 自定义 JSON 编码器，让短对象保持一行
            json_str = json.dumps(data, ensure_ascii=False, indent=2)
            import re
            # 多次替换，确保所有 {"zh": "...", "en": "..."} 都压缩到一行
            # 匹配多行格式并压缩
            pattern = r'\{\s*\n\s*"zh":\s*"([^"]+)"\s*,\s*\n\s*"en":\s*"([^"]+)"\s*\n\s*\}'
            replacement = r'{"zh": "\1", "en": "\2"}'
            json_str = re.sub(pattern, replacement, json_str)
            # 也处理 en 在前的情况
            pattern2 = r'\{\s*\n\s*"en":\s*"([^"]+)"\s*,\s*\n\s*"zh":\s*"([^"]+)"\s*\n\s*\}'
            replacement2 = r'{"en": "\1", "zh": "\2"}'
            json_str = re.sub(pattern2, replacement2, json_str)
            f.write(json_str)

        return jsonify({'success': True, 'message': 'Question saved successfully'})
    except Exception as e:
        import logging
        logging.error(f'Save question error: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/quiz/update_ids', methods=['POST'])
def update_question_ids():
    """批量更新题目的 UUID（保存到文件）"""
    topic = request.json.get('topic', 'solar_system')
    questions = request.json.get('questions', [])
    
    if not questions:
        return jsonify({'error': 'Questions required'}), 400
    
    try:
        # 读取现有题库
        quiz_file = os.path.join(DATA_DIR, 'quizzes', f'{topic}.json')
        
        if os.path.exists(quiz_file):
            with open(quiz_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            data = {'questions': []}
        
        # 构建 ID 映射
        id_map = {q.get('id'): q for q in questions if q.get('id')}
        
        # 更新现有题目的 ID
        for i, existing_q in enumerate(data.get('questions', [])):
            # 查找匹配的题目（通过问题文本）
            for new_q in questions:
                existing_text = existing_q.get('question', '')
                new_text = new_q.get('question', '')
                if isinstance(existing_text, dict):
                    existing_text = existing_text.get('zh', '')
                if isinstance(new_text, dict):
                    new_text = new_text.get('zh', '')
                
                if existing_text == new_text and 'id' in new_q:
                    data['questions'][i]['id'] = new_q['id']
                    break
        
        # 保存回文件
        with open(quiz_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        return jsonify({'success': True, 'message': 'IDs updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """调用 DeepSeek API 进行对话"""
    data = request.get_json()
    message = data.get('message', '')
    language = data.get('language', 'zh')
    system_prompt = data.get('system_prompt', '')

    if not message:
        return jsonify({'error': 'Message is required'}), 400

    if language == 'zh':
        default_system = '你是一个太阳系知识助手，专门回答关于太阳系、行星、天文等方面的问题。回答要简洁有趣，适合学生学习。'
    else:
        default_system = 'You are a Solar System knowledge assistant, specializing in answering questions about the solar system, planets, and astronomy. Keep answers concise and interesting for students.'

    try:
        headers = {
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": DEEPSEEK_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt or default_system},
                {"role": "user", "content": message}
            ]
        }
        response = requests.post(DEEPSEEK_API_URL, headers=headers, json=payload)
        result = response.json()
        reply = result['choices'][0]['message']['content']

        return jsonify({'reply': reply})
    except Exception as e:
        return jsonify({'error': f'LLM request failed: {str(e)}'}), 500

if __name__ == '__main__':
    # 局域网访问：host='0.0.0.0' 允许所有网络接口访问
    app.run(host='0.0.0.0', port=5000, debug=True)
