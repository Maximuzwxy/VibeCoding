import unittest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Playwright not installed. Run: pip install playwright && python -m playwright install chromium")
    sys.exit(1)

BASE_URL = "http://127.0.0.1:5000"

class TestUI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(headless=True)
        cls.page = cls.browser.new_page()

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def test_page_loads(self):
        self.page.goto(BASE_URL)
        self.assertIn("Agent Demo", self.page.title())

    def test_chat_input_exists(self):
        self.page.goto(BASE_URL)
        input_box = self.page.locator("#messageInput")
        self.assertTrue(input_box.is_visible())

    def test_send_button_exists(self):
        self.page.goto(BASE_URL)
        send_btn = self.page.locator("#sendBtn")
        self.assertTrue(send_btn.is_visible())

    def test_voice_button_exists(self):
        self.page.goto(BASE_URL)
        voice_btn = self.page.locator("#voiceBtn")
        self.assertTrue(voice_btn.is_visible())

    def test_json_panel_exists(self):
        self.page.goto(BASE_URL)
        json_area = self.page.locator("#jsonArea")
        self.assertTrue(json_area.is_visible())

if __name__ == "__main__":
    unittest.main()