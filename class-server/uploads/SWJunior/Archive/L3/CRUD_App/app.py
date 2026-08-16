from flask import Flask, request, jsonify, send_from_directory
import json
import os

app = Flask(__name__)
DATA_FILE = 'data.json'


def load_items():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r') as f:
        return json.load(f)


def save_items(items):
    with open(DATA_FILE, 'w') as f:
        json.dump(items, f, indent=2)


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


# READ — GET all items
@app.route('/items', methods=['GET'])
def get_items():
    return jsonify(load_items())


# CREATE — POST a new item
@app.route('/items', methods=['POST'])
def create_item():
    data = request.get_json()
    if not data or 'name' not in data or 'score' not in data:
        return jsonify({'error': 'name and score are required'}), 400

    items = load_items()
    new_id = max([item['id'] for item in items], default=0) + 1
    new_item = {'id': new_id, 'name': data['name'], 'score': data['score']}
    items.append(new_item)
    save_items(items)
    return jsonify(new_item), 201


# UPDATE — PUT to modify an item by ID
@app.route('/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    data = request.get_json()
    items = load_items()

    for item in items:
        if item['id'] == item_id:
            if 'name' in data:
                item['name'] = data['name']
            if 'score' in data:
                item['score'] = data['score']
            save_items(items)
            return jsonify(item)

    return jsonify({'error': 'Item not found'}), 404


# DELETE — DELETE an item by ID
@app.route('/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    items = load_items()

    for i, item in enumerate(items):
        if item['id'] == item_id:
            deleted = items.pop(i)
            save_items(items)
            return jsonify(deleted)

    return jsonify({'error': 'Item not found'}), 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
