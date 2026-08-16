from flask import Flask, send_from_directory

app = Flask(__name__)


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/hello')
def hello_backend():
    return 'Hello World! This is my first backend.'


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
