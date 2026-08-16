from flask import Flask, render_template, request, jsonify, session
from flask_socketio import SocketIO, emit, join_room
from werkzeug.utils import secure_filename
import json
import os
import time
import uuid

app = Flask(__name__)
app.config['SECRET_KEY'] = 'wechat-secret-2024'
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB
socketio = SocketIO(app, cors_allowed_origins="*")

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

def load_json(filename):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        if filename == 'users.json': return {}
        return []
    with open(path, 'r') as f:
        return json.load(f)

def save_json(filename, data):
    with open(os.path.join(DATA_DIR, filename), 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

@app.route('/')
def index():
    return render_template('index.html')

# ==================== PHASE 1: AUTH & PROFILE ====================

@app.route('/api/register', methods=['POST'])
def register():
    req = request.get_json()
    username = req.get('username', '').strip()
    password = req.get('password', '').strip()
    nickname = req.get('nickname', '').strip() or username
    avatar = req.get('avatar', 'fox')
    bio = req.get('bio', '').strip()

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    if len(password) < 4:
        return jsonify({'error': 'Password must be at least 4 characters'}), 400

    users = load_json('users.json')
    for uid, u in users.items():
        if u['username'].lower() == username.lower():
            return jsonify({'error': 'Username already taken'}), 400

    uid = str(int(time.time() * 1000))
    users[uid] = {
        'username': username,
        'password': password,
        'nickname': nickname,
        'avatar': avatar,
        'bio': bio,
        'role': 'user',
        'created': time.time()
    }
    save_json('users.json', users)
    session['uid'] = uid
    return jsonify({'ok': True, 'uid': uid, 'nickname': nickname, 'avatar': avatar, 'bio': bio, 'role': 'user'})

@app.route('/api/login', methods=['POST'])
def login():
    req = request.get_json()
    username = req.get('username', '').strip()
    password = req.get('password', '').strip()
    users = load_json('users.json')
    for uid, u in users.items():
        if u['username'].lower() == username.lower() and u['password'] == password:
            session['uid'] = uid
            return jsonify({
                'ok': True, 'uid': uid, 'nickname': u['nickname'],
                'avatar': u['avatar'], 'bio': u.get('bio', ''), 'role': u.get('role', 'user')
            })
    return jsonify({'error': 'Wrong username or password'}), 401

@app.route('/api/profile', methods=['PUT'])
def update_profile():
    req = request.get_json()
    uid = req['uid']
    users = load_json('users.json')
    if uid not in users:
        return jsonify({'error': 'User not found'}), 404

    u = users[uid]
    if 'nickname' in req: u['nickname'] = req['nickname'].strip()
    if 'avatar' in req: u['avatar'] = req['avatar']
    if 'bio' in req: u['bio'] = req['bio'].strip()
    if 'new_password' in req and req['new_password'].strip():
        if req.get('old_password') != u['password']:
            return jsonify({'error': 'Current password is wrong'}), 400
        u['password'] = req['new_password'].strip()

    save_json('users.json', users)
    return jsonify({'ok': True, 'nickname': u['nickname'], 'avatar': u['avatar'], 'bio': u.get('bio', '')})

# ==================== PHASE 2: CONTACTS & FRIENDS ====================

@app.route('/api/users/search')
def search_users():
    q = request.args.get('q', '').strip().lower()
    uid = request.args.get('uid', '')
    if not q: return jsonify([])
    users = load_json('users.json')
    results = []
    for cid, u in users.items():
        if cid == uid: continue
        if q in u['username'].lower() or q in u['nickname'].lower():
            results.append({
                'uid': cid, 'username': u['username'],
                'nickname': u['nickname'], 'avatar': u['avatar'], 'bio': u.get('bio', '')
            })
    return jsonify(results[:10])

@app.route('/api/friends', methods=['GET'])
def get_friends():
    """Returns friend list + pending sent/received requests"""
    uid = request.args.get('uid')
    friends_data = load_json('friends.json')
    users = load_json('users.json')

    friends = friends_data.get(uid, {}).get('friends', [])
    sent = friends_data.get(uid, {}).get('sent_requests', [])
    received = friends_data.get(uid, {}).get('received_requests', [])

    def user_info(cid):
        u = users.get(cid, {})
        return {'uid': cid, 'nickname': u.get('nickname', 'Unknown'),
                'avatar': u.get('avatar', 'none'), 'bio': u.get('bio', '')}

    return jsonify({
        'friends': [user_info(f) for f in friends],
        'sent_requests': [user_info(s) for s in sent],
        'received_requests': [user_info(r) for r in received]
    })

@app.route('/api/friends/request', methods=['POST'])
def send_friend_request():
    req = request.get_json()
    from_uid = req['from']
    to_uid = req['to']
    if from_uid == to_uid:
        return jsonify({'error': 'Cannot add yourself'}), 400

    friends_data = load_json('friends.json')
    friends_data.setdefault(from_uid, {'friends': [], 'sent_requests': [], 'received_requests': []})
    friends_data.setdefault(to_uid, {'friends': [], 'sent_requests': [], 'received_requests': []})

    # Already friends?
    if to_uid in friends_data[from_uid]['friends']:
        return jsonify({'error': 'Already friends'}), 400
    # Already sent?
    if to_uid in friends_data[from_uid]['sent_requests']:
        return jsonify({'error': 'Request already sent'}), 400

    friends_data[from_uid]['sent_requests'].append(to_uid)
    friends_data[to_uid]['received_requests'].append(from_uid)
    save_json('friends.json', friends_data)
    return jsonify({'ok': True})

@app.route('/api/friends/respond', methods=['POST'])
def respond_friend_request():
    req = request.get_json()
    uid = req['uid']  # current user
    from_uid = req['from']  # who sent the request
    accept = req['accept']  # True / False

    friends_data = load_json('friends.json')
    for user_id in [uid, from_uid]:
        friends_data.setdefault(user_id, {'friends': [], 'sent_requests': [], 'received_requests': []})

    # Remove request
    if from_uid in friends_data[uid]['received_requests']:
        friends_data[uid]['received_requests'].remove(from_uid)
    if uid in friends_data[from_uid]['sent_requests']:
        friends_data[from_uid]['sent_requests'].remove(uid)

    if accept:
        if from_uid not in friends_data[uid]['friends']:
            friends_data[uid]['friends'].append(from_uid)
        if uid not in friends_data[from_uid]['friends']:
            friends_data[from_uid]['friends'].append(uid)

    save_json('friends.json', friends_data)
    return jsonify({'ok': True})

@app.route('/api/friends/remove', methods=['POST'])
def remove_friend():
    req = request.get_json()
    uid = req['uid']
    friend_uid = req['friend_uid']
    friends_data = load_json('friends.json')
    for user_id in [uid, friend_uid]:
        friends_data.setdefault(user_id, {'friends': [], 'sent_requests': [], 'received_requests': []})
    if friend_uid in friends_data[uid]['friends']:
        friends_data[uid]['friends'].remove(friend_uid)
    if uid in friends_data[friend_uid]['friends']:
        friends_data[friend_uid]['friends'].remove(uid)
    save_json('friends.json', friends_data)
    return jsonify({'ok': True})

# ==================== PHASE 3: INSTANT MESSAGING (WebSocket) ====================

@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')

@socketio.on('join')
def handle_join(data):
    uid = data.get('uid')
    if uid:
        join_room(uid)
        print(f'User {uid} joined room')

@socketio.on('private_message')
def handle_private_message(data):
    """data: { from, to, text, image? }"""
    msg = {
        'id': str(int(time.time() * 1000)),
        'from': data['from'],
        'to': data['to'],
        'text': data.get('text', ''),
        'image': data.get('image', ''),
        'time': time.time(),
        'type': 'private'
    }
    msgs = load_json('messages.json')
    msgs.append(msg)
    save_json('messages.json', msgs)

    # Emit to recipient only (sender already has it via optimistic UI)
    emit('new_message', msg, room=data['to'])

@socketio.on('get_history')
def handle_get_history(data):
    """data: { uid, peer }"""
    uid = data['uid']
    peer = data['peer']
    msgs = load_json('messages.json')
    history = [m for m in msgs if (m['from'] == uid and m['to'] == peer) or
                                 (m['from'] == peer and m['to'] == uid)]
    emit('chat_history', history, room=uid)

@app.route('/api/messages', methods=['GET'])
def get_messages():
    uid = request.args.get('uid')
    peer = request.args.get('peer')
    after = int(request.args.get('after', '0'))
    msgs = load_json('messages.json')
    result = [m for m in msgs if after == 0 or m['id'] > after]
    if peer:
        result = [m for m in result if (m['from'] == uid and m['to'] == peer) or (m['from'] == peer and m['to'] == uid)]
    else:
        result = [m for m in result if m['from'] == uid or m['to'] == uid]
    return jsonify(result)

# ==================== PHASE 4: MOMENTS (朋友圈) ====================

@app.route('/api/moments', methods=['GET'])
def get_moments():
    uid = request.args.get('uid')
    moments = load_json('moments.json')
    users = load_json('users.json')
    result = []
    for m in reversed(moments):
        u = users.get(m['user'], {})
        result.append({
            'id': m['id'], 'user': m['user'],
            'nickname': u.get('nickname', 'Unknown'),
            'avatar': u.get('avatar', 'fox'),
            'text': m['text'], 'image': m.get('image', ''),
            'time': m['time'],
            'likes': m.get('likes', []),
            'liked': uid in m.get('likes', []),
            'comments': m.get('comments', [])
        })
    return jsonify(result)

@app.route('/api/moments', methods=['POST'])
def post_moment():
    req = request.get_json()
    moments = load_json('moments.json')
    moment = {
        'id': str(int(time.time() * 1000)),
        'user': req['uid'],
        'text': req.get('text', ''),
        'image': req.get('image', ''),
        'time': time.time(),
        'likes': [],
        'comments': []
    }
    moments.append(moment)
    save_json('moments.json', moments)
    return jsonify(moment)

@app.route('/api/moments/<mid>/like', methods=['POST'])
def like_moment(mid):
    req = request.get_json()
    uid = req['uid']
    moments = load_json('moments.json')
    for m in moments:
        if m['id'] == mid:
            if uid in m.get('likes', []):
                m['likes'].remove(uid)
            else:
                m['likes'].append(uid)
            save_json('moments.json', moments)
            return jsonify({'likes': m['likes']})
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/moments/<mid>/comment', methods=['POST'])
def comment_moment(mid):
    req = request.get_json()
    uid = req['uid']
    text = req['text']
    users = load_json('users.json')
    moments = load_json('moments.json')
    for m in moments:
        if m['id'] == mid:
            comment = {
                'user': uid,
                'nickname': users.get(uid, {}).get('nickname', 'Unknown'),
                'text': text,
                'time': time.time()
            }
            m.setdefault('comments', []).append(comment)
            save_json('moments.json', moments)
            return jsonify(comment)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/moments/<mid>', methods=['DELETE'])
def delete_moment(mid):
    uid = session.get('uid') or request.args.get('uid') or request.get_json(silent=True).get('uid')
    if not uid:
        return jsonify({'error': 'Not logged in'}), 401
    moments = load_json('moments.json')
    for m in moments:
        if m['id'] == mid:
            if m['user'] != uid:
                return jsonify({'error': 'Not your moment'}), 403
            moments.remove(m)
            save_json('moments.json', moments)
            return jsonify({'status': 'ok'})
    return jsonify({'error': 'Not found'}), 404

# ==================== PHASE 5: ADMIN DASHBOARD ====================

@app.route('/api/admin/stats')
def admin_stats():
    users = load_json('users.json')
    moments = load_json('moments.json')
    messages = load_json('messages.json')
    friends_data = load_json('friends.json')

    return jsonify({
        'total_users': len(users),
        'total_moments': len(moments),
        'total_messages': len(messages),
        'total_friendships': sum(len(v.get('friends', [])) for v in friends_data.values()) // 2
    })

@app.route('/api/admin/users')
def admin_users():
    users = load_json('users.json')
    result = []
    for uid, u in users.items():
        result.append({
            'uid': uid, 'username': u['username'], 'nickname': u['nickname'],
            'avatar': u['avatar'], 'bio': u.get('bio', ''), 'role': u.get('role', 'user'),
            'created': u['created']
        })
    return jsonify(result)

@app.route('/api/admin/users/<uid>', methods=['DELETE'])
def admin_delete_user(uid):
    users = load_json('users.json')
    if uid in users:
        del users[uid]
        save_json('users.json', users)
        return jsonify({'ok': True})
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/admin/moments/<mid>', methods=['DELETE'])
def admin_delete_moment(mid):
    moments = load_json('moments.json')
    moments = [m for m in moments if m['id'] != mid]
    save_json('moments.json', moments)
    return jsonify({'ok': True})

@app.route('/api/chats/<uid>', methods=['DELETE'])
def delete_chat(uid):
    """Delete all messages between current user and the given user."""
    if 'uid' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    messages = load_json('messages.json')
    messages = [m for m in messages if not (
        (m['from'] == session['uid'] and m['to'] == uid) or
        (m['from'] == uid and m['to'] == session['uid'])
    )]
    save_json('messages.json', messages)
    return jsonify({'status': 'ok'})

# ==================== FILE UPLOAD ====================

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Allowed: png, jpg, jpeg, gif, webp, bmp'}), 400

    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    url = f"/static/uploads/{filename}"
    return jsonify({'ok': True, 'url': url})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5004, debug=True, allow_unsafe_werkzeug=True)
