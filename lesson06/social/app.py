import os
import json
import hashlib
import uuid
from datetime import datetime, timezone, timedelta
from flask import Flask, request, jsonify, session, send_from_directory, render_template, redirect
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
app.secret_key = 'social-app-secret-key-2026'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=365)
CORS(app, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads')

os.makedirs(DATA_DIR, exist_ok=True)

AVATAR_STYLES = ['monsterid', 'wavatar', 'robohash']

def get_avatar_url(username):
    """Generate a deterministic Cravatar avatar URL with random style per user."""
    h = hashlib.md5(username.encode()).hexdigest()
    style = AVATAR_STYLES[int(h[:2], 16) % 3]
    return f'https://cravatar.cn/avatar/{h}?d={style}&s=200'
os.makedirs(UPLOAD_DIR, exist_ok=True)

USERS_FILE = os.path.join(DATA_DIR, 'users.json')
FRIENDSHIPS_FILE = os.path.join(DATA_DIR, 'friendships.json')

def load_json(filepath):
    if not os.path.exists(filepath):
        return []
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return data if isinstance(data, list) else []

def save_json(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return None
    users = load_json(USERS_FILE)
    for user in users:
        if user['id'] == user_id:
            return user
    return None

def user_to_dict(user):
    return {
        'id': user['id'],
        'username': user['username'],
        'avatar': user.get('avatar', ''),
        'bio': user.get('bio', '这个人很懒，什么都没写'),
        'created_at': user.get('created_at', '')
    }

# ============ Pages ============

@app.route('/')
def index():
    return render_template('login.html')

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/register')
def register_page():
    return render_template('register.html')

@app.route('/app')
def app_redirect():
    return redirect('/contacts')

@app.route('/chat')
def chat_page():
    return render_template('chat.html', page='chat')

@app.route('/contacts')
def contacts_page():
    return render_template('contacts.html', page='contacts')

@app.route('/settings')
def settings_page():
    return render_template('settings.html', page='settings')

@app.route('/friendscircle')
def friendscircle_page():
    return render_template('friendscircle.html', page='friendscircle')

@app.route('/profile/<username>')
def profile_page(username):
    return render_template('profile.html', page='profile', username=username)

@app.route('/admin')
def admin_page():
    return render_template('admin.html', page='admin')

# ============ Auth API ============

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')

    import re
    if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]{3,15}$', username):
        return jsonify({'error': '用户名格式不正确：4-16个字符，字母/数字/下划线，不能以数字开头'}), 400

    if len(password) < 6:
        return jsonify({'error': '密码长度不能少于6位'}), 400

    if password != confirm_password:
        return jsonify({'error': '两次输入的密码不一致'}), 400

    users = load_json(USERS_FILE)
    for user in users:
        if user['username'] == username:
            return jsonify({'error': '用户名已存在'}), 400

    new_user = {
        'id': str(uuid.uuid4()),
        'username': username,
        'password': password,
        'avatar': get_avatar_url(username),
        'bio': '这个人很懒，什么都没写',
        'created_at': datetime.now().isoformat()
    }
    users.append(new_user)
    save_json(USERS_FILE, users)

    session.permanent = True
    session['user_id'] = new_user['id']
    return jsonify({
        'message': '注册成功',
        'user': user_to_dict(new_user),
        'userId': new_user['id']
    }), 200

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')

    users = load_json(USERS_FILE)
    for user in users:
        if user['username'] == username:
            if user['password'] == password:
                session.permanent = True
                session['user_id'] = user['id']

                for i, u in enumerate(users):
                    if u['id'] == user['id']:
                        users[i]['last_login'] = datetime.now().isoformat()
                        break
                save_json(USERS_FILE, users)

                return jsonify({
                    'message': '登录成功',
                    'user': user_to_dict(user),
                    'userId': user['id']
                }), 200
            else:
                return jsonify({'error': '密码错误'}), 401

    return jsonify({'error': '用户名不存在'}), 404

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': '已退出登录'}), 200

@app.route('/api/auth/me', methods=['GET'])
def get_me():
    user = get_current_user()
    if not user:
        return jsonify({'error': '未登录'}), 401
    return jsonify({'user': user_to_dict(user)}), 200

# ============ User API ============

@app.route('/api/users/<username>', methods=['GET'])
def get_user(username):
    users = load_json(USERS_FILE)
    for user in users:
        if user['username'] == username:
            return jsonify({'user': user_to_dict(user)}), 200
    return jsonify({'error': '用户不存在'}), 404

@app.route('/api/users/search', methods=['GET'])
def search_users():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'users': []}), 200

    users = load_json(USERS_FILE)
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': '未登录'}), 401

    friendships = load_json(FRIENDSHIPS_FILE)
    friend_status = {}
    for f in friendships:
        from_user = f['from']
        to_user = f['to']
        if from_user == current_user['username']:
            friend_status[to_user] = f['status']
        elif to_user == current_user['username']:
            friend_status[from_user] = f['status']

    results = []
    for user in users:
        if user['id'] != current_user['id'] and query.lower() in user['username'].lower():
            user_data = user_to_dict(user)
            user_data['friend_status'] = friend_status.get(user['username'], 'none')
            results.append(user_data)

    return jsonify({'users': results}), 200

@app.route('/api/users/profile', methods=['PUT'])
def update_profile():
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': '未登录'}), 401

    data = request.get_json()
    users = load_json(USERS_FILE)

    for i, user in enumerate(users):
        if user['id'] == current_user['id']:
            if 'bio' in data:
                bio = data['bio'].strip()
                if len(bio) > 100:
                    return jsonify({'error': '个人简介不能超过100个字符'}), 400
                users[i]['bio'] = bio
            if 'avatar' in data:
                users[i]['avatar'] = data['avatar']
            save_json(USERS_FILE, users)
            return jsonify({'message': '资料更新成功', 'user': user_to_dict(users[i])}), 200

    return jsonify({'error': '用户不存在'}), 404

@app.route('/api/users/password', methods=['PUT'])
def update_password():
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': '未登录'}), 401

    data = request.get_json()
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    confirm_password = data.get('confirm_password', '')

    if current_user['password'] != current_password:
        return jsonify({'error': '当前密码错误'}), 400

    if len(new_password) < 6:
        return jsonify({'error': '新密码长度不能少于6位'}), 400

    if new_password != confirm_password:
        return jsonify({'error': '两次输入的新密码不一致'}), 400

    users = load_json(USERS_FILE)
    for i, user in enumerate(users):
        if user['id'] == current_user['id']:
            users[i]['password'] = new_password
            save_json(USERS_FILE, users)
            return jsonify({'message': '密码修改成功'}), 200

    return jsonify({'error': '用户不存在'}), 404

@app.route('/api/users/upload-avatar', methods=['POST'])
def upload_avatar():
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': '未登录'}), 401

    if 'avatar' not in request.files:
        return jsonify({'error': '请选择头像文件'}), 400

    file = request.files['avatar']
    if file.filename == '':
        return jsonify({'error': '请选择头像文件'}), 400

    ext = os.path.splitext(file.filename)[1]
    filename = f"{current_user['id']}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    file.save(filepath)

    avatar_url = f'/uploads/{filename}'

    users = load_json(USERS_FILE)
    for i, user in enumerate(users):
        if user['id'] == current_user['id']:
            users[i]['avatar'] = avatar_url
            save_json(USERS_FILE, users)
            return jsonify({'message': '头像上传成功', 'user': user_to_dict(users[i])}), 200

    return jsonify({'error': '用户不存在'}), 404

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_DIR, filename)

# ============ Friends API ============

@app.route('/api/friends', methods=['GET'])
def get_friends():
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': '未登录'}), 401

    friendships = load_json(FRIENDSHIPS_FILE)
    friends = []

    for f in friendships:
        if f['status'] == 'accepted':
            from_user = f['from']
            to_user = f['to']
            if from_user == current_user['username']:
                friends.append(to_user)
            elif to_user == current_user['username']:
                friends.append(from_user)

    users = load_json(USERS_FILE)
    friend_list = []
    for username in friends:
        for user in users:
            if user['username'] == username:
                friend_list.append(user_to_dict(user))
                break

    friend_list.sort(key=lambda x: x['created_at'], reverse=True)
    return jsonify({'friends': friend_list}), 200

@app.route('/api/friends/requests', methods=['GET'])
def get_friend_requests():
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': '未登录'}), 401

    friendships = load_json(FRIENDSHIPS_FILE)
    requests = []

    for f in friendships:
        if f['status'] == 'pending' and f['to'] == current_user['username']:
            users = load_json(USERS_FILE)
            for user in users:
                if user['username'] == f['from']:
                    requests.append({
                        'id': f['id'],
                        'from': user_to_dict(user)
                    })
                    break

    return jsonify({'requests': requests}), 200

@app.route('/api/friends/requests', methods=['POST'])
def send_friend_request():
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': '未登录'}), 401

    data = request.get_json()
    to_username = data.get('to', '').strip()

    if to_username == current_user['username']:
        return jsonify({'error': '不能添加自己为好友'}), 400

    users = load_json(USERS_FILE)
    target_user = None
    for user in users:
        if user['username'] == to_username:
            target_user = user
            break

    if not target_user:
        return jsonify({'error': '用户不存在'}), 404

    friendships = load_json(FRIENDSHIPS_FILE)
    for f in friendships:
        from_user = f['from']
        to_user = f['to']
        if (from_user == current_user['username'] and to_user == to_username) or \
           (from_user == to_username and to_user == current_user['username']):
            if f['status'] == 'pending':
                return jsonify({'error': '好友请求已存在'}), 400
            elif f['status'] == 'accepted':
                return jsonify({'error': '已经是好友了'}), 400

    new_request = {
        'id': str(uuid.uuid4()),
        'from': current_user['username'],
        'to': to_username,
        'status': 'pending',
        'created_at': datetime.now().isoformat()
    }
    friendships.append(new_request)
    save_json(FRIENDSHIPS_FILE, friendships)

    return jsonify({'message': '好友请求已发送'}), 200

@app.route('/api/friends/requests/<request_id>', methods=['PUT'])
def handle_friend_request(request_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': '未登录'}), 401

    data = request.get_json()
    action = data.get('action', '')

    if action not in ['accept', 'reject']:
        return jsonify({'error': '无效的操作'}), 400

    friendships = load_json(FRIENDSHIPS_FILE)
    for i, f in enumerate(friendships):
        if f['id'] == request_id and f['to'] == current_user['username'] and f['status'] == 'pending':
            if action == 'accept':
                friendships[i]['status'] = 'accepted'
            else:
                friendships[i]['status'] = 'rejected'
            save_json(FRIENDSHIPS_FILE, friendships)
            return jsonify({'message': '操作成功'}), 200

    return jsonify({'error': '好友请求不存在'}), 404

@app.route('/api/friends/<friend_username>', methods=['DELETE'])
def remove_friend(friend_username):
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': '未登录'}), 401

    friendships = load_json(FRIENDSHIPS_FILE)
    for i, f in enumerate(friendships):
        if f['status'] == 'accepted':
            from_user = f['from']
            to_user = f['to']
            if (from_user == current_user['username'] and to_user == friend_username) or \
               (from_user == friend_username and to_user == current_user['username']):
                friendships.pop(i)
                save_json(FRIENDSHIPS_FILE, friendships)
                return jsonify({'message': '好友已删除'}), 200

    return jsonify({'error': '好友关系不存在'}), 404

MESSAGES_FILE = os.path.join(DATA_DIR, 'messages.json')

@app.route('/api/messages/send', methods=['POST'])
def send_message():
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': '未登录'}), 401

    data = request.get_json()
    to_username = data.get('to', '').strip()
    content = data.get('content', '').strip()

    if not to_username or not content:
        return jsonify({'error': '参数不完整'}), 400

    friendships = load_json(FRIENDSHIPS_FILE)
    is_friend = False
    for f in friendships:
        if f['status'] == 'accepted':
            from_user = f['from']
            to_user = f['to']
            if (from_user == current_user['username'] and to_user == to_username) or \
               (from_user == to_username and to_user == current_user['username']):
                is_friend = True
                break

    if not is_friend:
        return jsonify({'error': '只能给好友发送消息'}), 403

    messages = load_json(MESSAGES_FILE)
    new_message = {
        'id': str(uuid.uuid4()),
        'from': current_user['username'],
        'to': to_username,
        'content': content,
        'created_at': datetime.now().isoformat()
    }
    messages.append(new_message)
    save_json(MESSAGES_FILE, messages)

    return jsonify({'message': '发送成功', 'msg': new_message}), 200

@app.route('/api/messages/<username>', methods=['GET'])
def get_messages(username):
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': '未登录'}), 401

    messages = load_json(MESSAGES_FILE)
    chat_messages = []
    for msg in messages:
        if (msg['from'] == current_user['username'] and msg['to'] == username) or \
           (msg['from'] == username and msg['to'] == current_user['username']):
            chat_messages.append(msg)

    chat_messages.sort(key=lambda x: x['created_at'])
    return jsonify({'messages': chat_messages}), 200

@app.route('/api/messages/conversations', methods=['GET'])
def get_conversations():
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': '未登录'}), 401

    messages = load_json(MESSAGES_FILE)
    conversations = {}

    for msg in messages:
        if msg['from'] == current_user['username']:
            other = msg['to']
        elif msg['to'] == current_user['username']:
            other = msg['from']
        else:
            continue

        if other not in conversations or msg['created_at'] > conversations[other]['last_time']:
            conversations[other] = {
                'username': other,
                'last_message': msg['content'],
                'last_time': msg['created_at']
            }

    result = sorted(conversations.values(), key=lambda x: x['last_time'], reverse=True)

    users = load_json(USERS_FILE)
    user_avatars = {u['username']: u['avatar'] for u in users}
    for conv in result:
        conv['avatar'] = user_avatars.get(conv['username'], '')

    return jsonify({'conversations': result}), 200

POSTS_FILE = os.path.join(DATA_DIR, 'posts.json')
POSTS_UPLOAD_DIR = os.path.join(UPLOAD_DIR, 'posts')

os.makedirs(POSTS_UPLOAD_DIR, exist_ok=True)

def post_to_dict(post, include_likes=True, include_comments=True):
    result = {
        'id': post['id'],
        'username': post['username'],
        'content': post['content'],
        'images': post.get('images', []),
        'created_at': post['created_at']
    }
    if include_likes:
        result['likes'] = post.get('likes', [])
    if include_comments:
        comments = post.get('comments', [])
        users = load_json(USERS_FILE)
        user_avatars = {u['username']: u.get('avatar', '') for u in users}
        for c in comments:
            c['avatar'] = user_avatars.get(c['username'], '')
        result['comments'] = comments
    return result

@app.route('/api/posts', methods=['GET'])
def get_posts():
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': '未登录'}), 401

    friendships = load_json(FRIENDSHIPS_FILE)
    friends = set()
    friends.add(current_user['username'])
    for f in friendships:
        if f['status'] == 'accepted':
            if f['from'] == current_user['username']:
                friends.add(f['to'])
            elif f['to'] == current_user['username']:
                friends.add(f['from'])

    posts = load_json(POSTS_FILE)
    user_posts = []
    for post in posts:
        if post['username'] in friends:
            user_posts.append(post_to_dict(post))

    user_posts.sort(key=lambda x: x['created_at'], reverse=True)

    users = load_json(USERS_FILE)
    user_avatars = {u['username']: u['avatar'] for u in users}
    for post in user_posts:
        post['avatar'] = user_avatars.get(post['username'], '')

    return jsonify({'posts': user_posts}), 200

@app.route('/api/posts/mine', methods=['GET'])
def get_my_posts():
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': '未登录'}), 401

    posts = load_json(POSTS_FILE)
    my_posts = [post_to_dict(p) for p in posts if p['username'] == current_user['username']]
    my_posts.sort(key=lambda x: x['created_at'], reverse=True)

    users = load_json(USERS_FILE)
    user_avatars = {u['username']: u['avatar'] for u in users}
    for post in my_posts:
        post['avatar'] = user_avatars.get(current_user['username'], '')

    return jsonify({'posts': my_posts}), 200

@app.route('/api/posts/user/<username>', methods=['GET'])
def get_user_posts(username):
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': '未登录'}), 401

    users = load_json(USERS_FILE)
    target_user = None
    for user in users:
        if user['username'] == username:
            target_user = user
            break

    if not target_user:
        return jsonify({'error': '用户不存在'}), 404

    friendships = load_json(FRIENDSHIPS_FILE)
    is_friend = False
    is_self = current_user['username'] == username
    for f in friendships:
        if f['status'] == 'accepted':
            if (f['from'] == current_user['username'] and f['to'] == username) or \
               (f['from'] == username and f['to'] == current_user['username']):
                is_friend = True
                break

    posts = load_json(POSTS_FILE)
    user_posts = [p for p in posts if p['username'] == username]
    user_posts.sort(key=lambda x: x['created_at'], reverse=True)

    user_posts = [post_to_dict(p) for p in user_posts]
    for post in user_posts:
        post['avatar'] = target_user.get('avatar', '')

    return jsonify({
        'posts': user_posts,
        'is_friend': is_friend,
        'is_self': is_self,
        'user': user_to_dict(target_user)
    }), 200

@app.route('/api/posts', methods=['POST'])
def create_post():
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': '未登录'}), 401

    content = request.form.get('content', '').strip()
    if not content:
        return jsonify({'error': '内容不能为空'}), 400
    if len(content) > 500:
        return jsonify({'error': '内容不能超过500字'}), 400

    images = []
    files = request.files.getlist('images')
    if len(files) > 9:
        return jsonify({'error': '最多只能上传9张图片'}), 400

    for file in files:
        if file.filename:
            ext = os.path.splitext(file.filename)[1]
            if ext.lower() not in ['.jpg', '.jpeg', '.png', '.gif']:
                return jsonify({'error': '只支持 JPG/PNG/GIF 格式'}), 400
            filename = f"{uuid.uuid4()}{ext}"
            filepath = os.path.join(POSTS_UPLOAD_DIR, filename)
            file.save(filepath)
            images.append(f'/uploads/posts/{filename}')

    posts = load_json(POSTS_FILE)
    new_post = {
        'id': str(uuid.uuid4()),
        'username': current_user['username'],
        'content': content,
        'images': images,
        'likes': [],
        'comments': [],
        'created_at': datetime.now().isoformat()
    }
    posts.append(new_post)
    save_json(POSTS_FILE, posts)

    new_post['avatar'] = current_user.get('avatar', '')
    return jsonify({'message': '发布成功', 'post': post_to_dict(new_post)}), 200

@app.route('/api/posts/<post_id>', methods=['DELETE'])
def delete_post(post_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': '未登录'}), 401

    posts = load_json(POSTS_FILE)
    for i, post in enumerate(posts):
        if post['id'] == post_id:
            if post['username'] != current_user['username']:
                return jsonify({'error': '只能删除自己的帖子'}), 403
            for img in post.get('images', []):
                img_path = os.path.join(BASE_DIR, img.lstrip('/'))
                if os.path.exists(img_path):
                    os.remove(img_path)
            posts.pop(i)
            save_json(POSTS_FILE, posts)
            return jsonify({'message': '删除成功'}), 200

    return jsonify({'error': '帖子不存在'}), 404

@app.route('/api/posts/<post_id>/like', methods=['POST'])
def like_post(post_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': '未登录'}), 401

    posts = load_json(POSTS_FILE)
    for i, post in enumerate(posts):
        if post['id'] == post_id:
            if current_user['username'] in post['likes']:
                return jsonify({'error': '已经点过赞了'}), 400
            posts[i]['likes'].append(current_user['username'])
            save_json(POSTS_FILE, posts)
            return jsonify({'message': '点赞成功', 'likes': posts[i]['likes']}), 200

    return jsonify({'error': '帖子不存在'}), 404

@app.route('/api/posts/<post_id>/like', methods=['DELETE'])
def unlike_post(post_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': '未登录'}), 401

    posts = load_json(POSTS_FILE)
    for i, post in enumerate(posts):
        if post['id'] == post_id:
            if current_user['username'] not in post['likes']:
                return jsonify({'error': '还没有点赞'}), 400
            posts[i]['likes'].remove(current_user['username'])
            save_json(POSTS_FILE, posts)
            return jsonify({'message': '取消点赞成功', 'likes': posts[i]['likes']}), 200

    return jsonify({'error': '帖子不存在'}), 404

@app.route('/api/posts/<post_id>/comments', methods=['POST'])
def add_comment(post_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': '未登录'}), 401

    data = request.get_json()
    content = data.get('content', '').strip()
    if not content:
        return jsonify({'error': '评论内容不能为空'}), 400
    if len(content) > 200:
        return jsonify({'error': '评论不能超过200字'}), 400

    posts = load_json(POSTS_FILE)
    for i, post in enumerate(posts):
        if post['id'] == post_id:
            new_comment = {
                'id': str(uuid.uuid4()),
                'username': current_user['username'],
                'content': content,
                'avatar': current_user.get('avatar', ''),
                'created_at': datetime.now().isoformat()
            }
            posts[i]['comments'].append(new_comment)
            save_json(POSTS_FILE, posts)
            return jsonify({'message': '评论成功', 'comment': new_comment}), 200

    return jsonify({'error': '帖子不存在'}), 404

@app.route('/api/posts/<post_id>/comments/<comment_id>', methods=['DELETE'])
def delete_comment(post_id, comment_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': '未登录'}), 401

    posts = load_json(POSTS_FILE)
    for i, post in enumerate(posts):
        if post['id'] == post_id:
            for j, comment in enumerate(post['comments']):
                if comment['id'] == comment_id:
                    if comment['username'] != current_user['username']:
                        return jsonify({'error': '只能删除自己的评论'}), 403
                    posts[i]['comments'].pop(j)
                    save_json(POSTS_FILE, posts)
                    return jsonify({'message': '删除成功'}), 200
            return jsonify({'error': '评论不存在'}), 404

    return jsonify({'error': '帖子不存在'}), 404

def require_admin():
    username = session.get('admin_username')
    if not username or username != 'admin':
        return None
    return username

def get_shanghai_time():
    return datetime.now(timezone(timedelta(hours=8)))

def is_user_active_this_month(last_login):
    if not last_login:
        return False
    now = get_shanghai_time()
    login_time = datetime.fromisoformat(last_login)
    if login_time.tzinfo is None:
        login_time = login_time.replace(tzinfo=timezone.utc)
    return login_time.year == now.year and login_time.month == now.month

def is_user_active_today(last_login):
    if not last_login:
        return False
    now = get_shanghai_time()
    login_time = datetime.fromisoformat(last_login)
    if login_time.tzinfo is None:
        login_time = login_time.replace(tzinfo=timezone.utc)
    return login_time.year == now.year and login_time.month == now.month and login_time.day == now.day

@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    admin = require_admin()
    if not admin:
        return jsonify({'error': '未授权'}), 401

    users = load_json(USERS_FILE)
    posts = load_json(POSTS_FILE)

    total_users = len(users)
    total_posts = len(posts)

    now = get_shanghai_time()
    monthly_active = sum(1 for u in users if is_user_active_this_month(u.get('last_login')))
    daily_active = sum(1 for u in users if is_user_active_today(u.get('last_login')))

    return jsonify({
        'total_users': total_users,
        'total_posts': total_posts,
        'monthly_active': monthly_active,
        'daily_active': daily_active
    }), 200

@app.route('/api/admin/users', methods=['GET'])
def admin_users():
    admin = require_admin()
    if not admin:
        return jsonify({'error': '未授权'}), 401

    users = load_json(USERS_FILE)
    friendships = load_json(FRIENDSHIPS_FILE)
    posts = load_json(POSTS_FILE)

    post_counts = {}
    for p in posts:
        uid = p['username']
        post_counts[uid] = post_counts.get(uid, 0) + 1

    friend_counts = {}
    for f in friendships:
        if f['status'] == 'accepted':
            from_user = f['from']
            to_user = f['to']
            friend_counts[from_user] = friend_counts.get(from_user, 0) + 1
            friend_counts[to_user] = friend_counts.get(to_user, 0) + 1

    result = []
    for user in users:
        result.append({
            'username': user['username'],
            'avatar': user.get('avatar', ''),
            'created_at': user.get('created_at', ''),
            'friend_count': friend_counts.get(user['username'], 0),
            'post_count': post_counts.get(user['username'], 0)
        })

    result.sort(key=lambda x: x['created_at'], reverse=True)
    return jsonify({'users': result}), 200

@app.route('/api/admin/posts', methods=['GET'])
def admin_posts():
    admin = require_admin()
    if not admin:
        return jsonify({'error': '未授权'}), 401

    posts = load_json(POSTS_FILE)
    users = load_json(USERS_FILE)
    user_avatars = {u['username']: u.get('avatar', '') for u in users}

    result = []
    for post in posts:
        result.append({
            'id': post['id'],
            'username': post['username'],
            'avatar': user_avatars.get(post['username'], ''),
            'content': post['content'],
            'images': post.get('images', []),
            'likes_count': len(post.get('likes', [])),
            'comments_count': len(post.get('comments', [])),
            'created_at': post['created_at']
        })

    result.sort(key=lambda x: x['created_at'], reverse=True)
    return jsonify({'posts': result}), 200

@app.route('/api/admin/posts/<post_id>', methods=['GET'])
def admin_post_detail(post_id):
    admin = require_admin()
    if not admin:
        return jsonify({'error': '未授权'}), 401

    posts = load_json(POSTS_FILE)
    users = load_json(USERS_FILE)

    for post in posts:
        if post['id'] == post_id:
            post_data = post_to_dict(post, include_likes=True, include_comments=True)
            post_data['avatar'] = users[0].get('avatar', '') if users else ''
            for u in users:
                if u['username'] == post['username']:
                    post_data['avatar'] = u.get('avatar', '')
                    break
            return jsonify({'post': post_data}), 200

    return jsonify({'error': '帖子不存在'}), 404

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if username == 'admin' and password == '111111':
        session['admin_username'] = 'admin'
        return jsonify({'message': '登录成功'}), 200
    else:
        return jsonify({'error': '用户名或密码错误'}), 401

@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    session.pop('admin_username', None)
    return jsonify({'message': '已退出'}), 200

user_rooms = {}

@socketio.on('connect')
def handle_connect():
    current_user = get_current_user()
    if current_user:
        username = current_user['username']
        user_rooms[username] = request.sid
        join_room(username)

@socketio.on('disconnect')
def handle_disconnect():
    current_user = get_current_user()
    if current_user:
        username = current_user['username']
        if username in user_rooms:
            del user_rooms[username]

@socketio.on('send_message')
def handle_socket_message(data):
    current_user = get_current_user()
    if not current_user:
        emit('error', {'message': '未登录'})
        return

    to_username = data.get('to', '').strip()
    content = data.get('content', '').strip()

    if not to_username or not content:
        emit('error', {'message': '参数不完整'})
        return

    new_message = {
        'id': str(uuid.uuid4()),
        'from': current_user['username'],
        'to': to_username,
        'content': content,
        'created_at': datetime.now().isoformat()
    }

    messages = load_json(MESSAGES_FILE)
    messages.append(new_message)
    save_json(MESSAGES_FILE, messages)

    emit('new_message', new_message, room=current_user['username'])
    emit('new_message', new_message, room=to_username)

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
