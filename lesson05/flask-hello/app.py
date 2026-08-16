# hello.py

from flask import Flask, render_template
from datetime import datetime

app = Flask(__name__)

@app.route('/')
def home():
    return "Hello, Timmy"

@app.route('/time')
def current_time():
    now = datetime.now()
    return now.strftime("%Y-%m-%d %H:%M:%S")

@app.route('/hello')
def hello_html():
    return render_template('hello.html')

if __name__ == '__main__' :
    app.run(debug=True, host='0.0.0.0', port=6660)

