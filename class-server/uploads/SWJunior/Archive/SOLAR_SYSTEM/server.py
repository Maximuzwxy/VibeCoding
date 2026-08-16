#!/usr/bin/env python3
"""Solar System server — static files + AI assistant proxy."""
import http.server
import json
import os
import urllib.request
import socketserver
from pathlib import Path

ROOT = Path(__file__).parent
API_KEY = "REDACTED_DEEPSEEK_KEY"
PORT = 8080


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):
        if self.path == "/api/ask":
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            question = body.get("question", "").strip()
            if not question:
                self._json({"error": "No question provided"}, 400)
                return

            answer = self._ask_deepseek(question)
            self._json({"answer": answer})
        else:
            self._json({"error": "Not found"}, 404)

    def _ask_deepseek(self, question):
        system = (
            "You are Cosmos, a friendly AI assistant on a Solar System Explorer website. "
            "Answer questions about space, astronomy, planets, stars, and science. "
            "Keep answers concise (2-4 sentences max). Be warm and enthusiastic. "
            "If asked about non-space topics, briefly answer but gently steer back to space."
        )
        payload = json.dumps({
            "model": "deepseek-chat",
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": question}
            ],
            "max_tokens": 250,
            "temperature": 0.7
        }).encode()

        req = urllib.request.Request(
            "https://api.deepseek.com/v1/chat/completions",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {API_KEY}"
            }
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read())
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            return f"Sorry, I'm having trouble reaching the stars right now. ({e})"

    def _json(self, data, code=200):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()


if __name__ == "__main__":
    print(f"  Solar System Explorer → http://localhost:{PORT}")
    print(f"  AI assistant ready at /api/ask")
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
