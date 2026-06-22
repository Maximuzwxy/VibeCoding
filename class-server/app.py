import os
import re
import json
from datetime import datetime, timezone, timedelta
from flask import Flask, render_template, request, redirect, url_for, jsonify, send_from_directory
import markdown
from werkzeug.utils import secure_filename

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER_BASE = os.path.join(BASE_DIR, "uploads")
FILES_FOLDER = os.path.join(BASE_DIR, "files")
DATA_FOLDER = os.path.join(BASE_DIR, "data")
USERS_FILE = os.path.join(DATA_FOLDER, "users.json")
current_folder_name = "lesson00"

def get_beijing_time():
    utc_time = datetime.now(timezone.utc)
    beijing_tz = timezone(timedelta(hours=8))
    return utc_time.astimezone(beijing_tz)

def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)

def get_user_list():
    users = load_users()
    return [{'nickname': nickname, 'ip': data['ip'], 'last_login': data.get('last_login', '')} 
            for nickname, data in users.items()]

def get_today_users():
    beijing_now = get_beijing_time()
    today_date = beijing_now.strftime('%Y-%m-%d')
    users = load_users()
    today_users = []
    for nickname, data in users.items():
        last_login = data.get('last_login', '')
        if last_login:
            try:
                login_datetime = datetime.fromisoformat(last_login)
                if login_datetime.strftime('%Y-%m-%d') == today_date:
                    today_users.append({
                        'nickname': nickname,
                        'ip': data['ip'],
                        'last_login': login_datetime.strftime('%H:%M:%S')
                    })
            except:
                pass
    return today_users

app = Flask(__name__)
app.config['UPLOAD_FOLDER_BASE'] = UPLOAD_FOLDER_BASE
app.config['FILES_FOLDER'] = FILES_FOLDER


@app.route('/')
def index():
    return redirect(url_for('login'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    global current_folder_name
    if request.method == 'POST':
        nickname = request.form.get('nickname').strip()
        if not nickname:
            return render_template('login.html', error="Nickname cannot be empty")

        client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        if ',' in client_ip:
            client_ip = client_ip.split(',')[0].strip()

        users = load_users()
        users[nickname] = {
            'ip': client_ip,
            'last_login': get_beijing_time().isoformat()
        }
        save_users(users)

        return redirect(url_for('class_page', nickname=nickname))

    return render_template('login.html')


@app.route('/class/<nickname>')
def class_page(nickname):
    global current_folder_name
    target_dir = os.path.join(FILES_FOLDER, current_folder_name)

    if not os.path.exists(target_dir):
        md_content = "<p style='color:red'>Course folder does not exist. Please contact administrator.</p>"
        file_list = []
    else:
        # 获取 Lesson 开头的文件（用于左边 Markdown 渲染）
        lesson_files = [f for f in os.listdir(target_dir) if f.lower().startswith('lesson')]
        if lesson_files:
            # 取第一个 Lesson 开头的文件渲染
            lesson_files.sort()  # 排序保证顺序一致
            md_path = os.path.join(target_dir, lesson_files[0])
            with open(md_path, 'r', encoding='utf-8') as f:
                md_text = f.read()
            md_content = markdown.markdown(md_text)
        else:
            md_content = "<p>No course introduction available.</p>"

        # 获取非 Lesson 开头的文件列表（用于右边课程资料）
        file_list = []
        for f in os.listdir(target_dir):
            if not f.lower().startswith('lesson'):
                file_list.append(f)

    is_admin = (nickname == "maximuz")

    return render_template(
        'class.html',
        nickname=nickname,
        md_content=md_content,
        file_list=file_list,
        folder_name=current_folder_name,
        is_admin=is_admin
    )


@app.route('/set_folder', methods=['POST'])
def set_folder():
    global current_folder_name
    data = request.get_json()
    folder_name = data.get('folder_name')
    target_path = os.path.join(FILES_FOLDER, folder_name)

    if os.path.exists(target_path) and os.path.isdir(target_path):
        current_folder_name = folder_name
        return jsonify({"success": True})
    else:
        return jsonify({"success": False, "error": "Folder does not exist"})


@app.route('/upload/<nickname>', methods=['POST'])
def upload_file(nickname):
    if 'file' not in request.files:
        return "No file", 400
    file = request.files['file']
    if file.filename == '':
        return "No selected file", 400

    # 清理文件名中的非法字符（Windows 文件系统）
    import re
    safe_filename = re.sub(r'[<>:"/\\|？*]', '_', file.filename)
    # 替换 -> 等特殊组合
    safe_filename = safe_filename.replace('->', '_to_').replace('->', '_to_')

    user_upload_dir = os.path.join(UPLOAD_FOLDER_BASE, nickname)
    os.makedirs(user_upload_dir, exist_ok=True)
    filepath = os.path.join(user_upload_dir, safe_filename)
    file.save(filepath)
    return "OK", 200


@app.route('/download/<filename>')
def download_file(filename):
    target_dir = os.path.join(FILES_FOLDER, current_folder_name)
    return send_from_directory(target_dir, filename, as_attachment=True)


@app.route('/api/users')
def api_get_users():
    users = get_user_list()
    return jsonify(users)


@app.route('/api/users/today')
def api_get_today_users():
    today_users = get_today_users()
    return jsonify(today_users)


@app.route('/usaco')
def show_ip():
    """显示 USACO 题目链接页面"""
    return render_template('usaco.html')


if __name__ == '__main__':
    os.makedirs(UPLOAD_FOLDER_BASE, exist_ok=True)
    os.makedirs(FILES_FOLDER, exist_ok=True)
    os.makedirs(DATA_FOLDER, exist_ok=True)
    
    # 创建示例文件
    example_dir = os.path.join(FILES_FOLDER, "lesson00")
    os.makedirs(example_dir, exist_ok=True)
    example_md = os.path.join(example_dir, "Vibe Coding课程介绍.md")
    if not os.path.exists(example_md):
        with open(example_md, 'w', encoding='utf-8') as f:
            f.write("# Vibe Coding 课程介绍\n\n欢迎来到 Vibe Coding 课堂！\n\n- 实时互动\n- 代码共享\n- 协作学习\n\n祝你学习愉快！")

    # 启动 Flask（局域网访问）
    app.run(host='0.0.0.0', port=6688, debug=True)