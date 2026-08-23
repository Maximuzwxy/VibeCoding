"""
Plane Shooter - Classic 2D Space Shooter Game
Flask Backend with User System and Leaderboard
"""

from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import json
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'plane_shooter_secret_key_2024'

# Data file path
DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'data.json')

# ============== Data Helper Functions ==============

def load_data():
    """Load data from JSON file"""
    if not os.path.exists(DATA_FILE):
        return get_initial_data()
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    """Save data to JSON file"""
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_initial_data():
    """Get initial sample data"""
    return {
        "users": [
            {"id": 1, "username": "Player1", "created_at": "2024-01-01 00:00:00"},
            {"id": 2, "username": "Ace", "created_at": "2024-01-02 10:00:00"},
            {"id": 3, "username": "Star", "created_at": "2024-01-03 12:00:00"}
        ],
        "scores": [
            {"id": 1, "username": "Player1", "score": 15000, "level": 6, "date": "2024-01-10 15:30:00"},
            {"id": 2, "username": "Ace", "score": 12500, "level": 5, "date": "2024-01-11 16:00:00"},
            {"id": 3, "username": "Star", "score": 18000, "level": 6, "date": "2024-01-12 14:20:00"},
            {"id": 4, "username": "Player1", "score": 9500, "level": 4, "date": "2024-01-13 10:00:00"},
            {"id": 5, "username": "Ace", "score": 21000, "level": 6, "date": "2024-01-14 18:45:00"}
        ]
    }

def get_next_id(items):
    """Get next available ID"""
    if not items:
        return 1
    return max(item['id'] for item in items) + 1

def find_user(username):
    """Find user by username"""
    data = load_data()
    for user in data['users']:
        if user['username'] == username:
            return user
    return None

def get_leaderboard(limit=10):
    """Get top scores"""
    data = load_data()
    scores = sorted(data['scores'], key=lambda x: x['score'], reverse=True)
    return scores[:limit]

def get_user_best_score(username):
    """Get user's best score"""
    data = load_data()
    user_scores = [s for s in data['scores'] if s['username'] == username]
    if not user_scores:
        return 0
    return max(s['score'] for s in user_scores)

# ============== Routes ==============

@app.route('/')
def index():
    """Main game page"""
    if 'username' not in session:
        return redirect(url_for('login'))
    return render_template('index.html', username=session['username'])

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login page - username only"""
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        
        if not username:
            flash('Please enter a username!', 'warning')
            return render_template('login.html')
        
        data = load_data()
        
        # Check if user exists
        user = find_user(username)
        if not user:
            # Create new user
            new_user = {
                'id': get_next_id(data['users']),
                'username': username,
                'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            data['users'].append(new_user)
            save_data(data)
            flash(f'Welcome, {username}! Account created. 🎮', 'success')
        else:
            flash(f'Welcome back, {username}! 🎮', 'success')
        
        session['username'] = username
        return redirect(url_for('index'))
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    """Logout"""
    session.clear()
    flash('Logged out successfully! 👋', 'info')
    return redirect(url_for('login'))

@app.route('/leaderboard')
def leaderboard():
    """Leaderboard page"""
    scores = get_leaderboard(10)
    return render_template('leaderboard.html', scores=scores)

@app.route('/rules')
def rules():
    """Game rules page"""
    return render_template('rules.html')

@app.route('/api/save_score', methods=['POST'])
def save_score():
    """API endpoint to save score"""
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    
    data = request.json
    score = data.get('score', 0)
    level = data.get('level', 1)
    
    if score <= 0:
        return jsonify({'success': False, 'message': 'Invalid score'}), 400
    
    data_store = load_data()
    
    new_score = {
        'id': get_next_id(data_store['scores']),
        'username': session['username'],
        'score': score,
        'level': level,
        'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    data_store['scores'].append(new_score)
    save_data(data_store)
    
    return jsonify({'success': True, 'message': 'Score saved!'})

@app.route('/api/get_user_best')
def get_user_best():
    """API endpoint to get user's best score"""
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    
    best_score = get_user_best_score(session['username'])
    return jsonify({'success': True, 'best_score': best_score})

@app.route('/api/leaderboard')
def api_leaderboard():
    """API endpoint for leaderboard data"""
    scores = get_leaderboard(10)
    return jsonify({'success': True, 'scores': scores})

# ============== Error Handlers ==============

@app.errorhandler(404)
def not_found(e):
    """404 error page"""
    return render_template('error.html', error_code=404, error_message='Page not found'), 404

@app.errorhandler(500)
def server_error(e):
    """500 error page"""
    return render_template('error.html', error_code=500, error_message='Something went wrong'), 500

# ============== Main ==============

if __name__ == '__main__':
    # Initialize data file if not exists
    if not os.path.exists(DATA_FILE):
        save_data(get_initial_data())
        print('Initial data created!')
    
    app.run(debug=True, host='0.0.0.0', port=5005)
