# hello.py

from flask import Flask
from datetime import datetime

app = Flask(__name__)

@app.route('/')
def home():
    return "Hello, World!"

@app.route('/time')
def current_time():
    now = datetime.now()
    return now.strftime("%Y-%m-%d %H:%M:%S")

if __name__ == '__main__' :
    app.run(debug=True, host='0.0.0.0', port=6660)

