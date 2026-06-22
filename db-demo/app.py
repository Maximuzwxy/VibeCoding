from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data.json')

def load_data():
    """Load data from JSON file"""
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    """Save data to JSON file"""
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.route('/')
def index():
    """Home page"""
    return render_template('index.html')

@app.route('/api/items', methods=['GET'])
def get_items():
    """Get all items"""
    items = load_data()
    return jsonify(items)

@app.route('/api/items', methods=['POST'])
def create_item():
    """Create new item"""
    data = request.json
    items = load_data()
    
    if not items:
        new_id = 1
    else:
        new_id = max(item['id'] for item in items) + 1
    
    new_item = {
        'id': new_id,
        'name': data.get('name', ''),
        'email': data.get('email', ''),
        'phone': data.get('phone', '')
    }
    
    items.append(new_item)
    save_data(items)
    
    return jsonify(new_item), 201

@app.route('/api/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    """Update item"""
    data = request.json
    items = load_data()
    
    for item in items:
        if item['id'] == item_id:
            item['name'] = data.get('name', item['name'])
            item['email'] = data.get('email', item['email'])
            item['phone'] = data.get('phone', item['phone'])
            save_data(items)
            return jsonify(item)
    
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    """Delete item"""
    items = load_data()
    items = [item for item in items if item['id'] != item_id]
    save_data(items)
    
    return jsonify({'message': 'Deleted'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
