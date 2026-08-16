from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)

LEADERBOARD_FILE = 'leaderboard.json'

def load_leaderboard():
    if not os.path.exists(LEADERBOARD_FILE):
        return []
    with open(LEADERBOARD_FILE, 'r') as f:
        return json.load(f)

def save_leaderboard(data):
    with open(LEADERBOARD_FILE, 'w') as f:
        json.dump(data, f, indent=2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    data = load_leaderboard()
    # Sort by highest level descending, return top 5
    data.sort(key=lambda x: x['level'], reverse=True)
    return jsonify(data[:5])

@app.route('/api/level', methods=['POST'])
def record_level():
    req = request.get_json()
    name = req.get('name', '').strip()
    level = req.get('level', 1)
    if not name:
        return jsonify({'error': 'Name required'}), 400

    data = load_leaderboard()
    # Update only if new level is higher
    found = False
    for entry in data:
        if entry['name'] == name:
            if level > entry['level']:
                entry['level'] = level
            found = True
            break
    if not found:
        data.append({'name': name, 'level': level})

    save_leaderboard(data)
    return jsonify({'ok': True})

@app.route('/api/clear', methods=['POST'])
def clear_leaderboard():
    save_leaderboard([])
    return jsonify({'ok': True})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003, debug=True)
