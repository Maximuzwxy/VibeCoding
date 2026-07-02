"""
Solar UI 测试
"""

import pytest
from playwright.sync_api import sync_playwright

pytestmark = pytest.mark.ui
BASE_URL = "http://localhost:5000"


@pytest.fixture(scope="function")
def browser():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        yield browser
        browser.close()


@pytest.fixture(scope="function")
def page(browser):
    context = browser.new_context()
    page = context.new_page()
    yield page
    context.close()


class TestMainPage:

    def test_page_loads(self, page):
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        assert "太阳系" in page.title() or "Solar System" in page.title()

    def test_info_panel_exists(self, page):
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        assert page.locator("#info-panel").is_visible()

    def test_quiz_panel_exists(self, page):
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        assert page.locator("#quiz-panel").is_visible()

    def test_quiz_renders_question(self, page):
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(4000)
        text = page.locator("#question-text").inner_text()
        assert len(text) > 0 and text != "加载中..."

    def test_quiz_options_visible(self, page):
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(4000)
        options = page.locator(".option-btn")
        assert options.count() == 4

    def test_lang_switch_exists(self, page):
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        assert page.locator("#lang-switch").is_visible()

    def test_lang_switch_toggles(self, page):
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)
        btn = page.locator("#lang-switch")
        initial = btn.inner_text()
        btn.click()
        page.wait_for_timeout(1000)
        assert btn.inner_text() != initial

    def test_planet_selector_exists(self, page):
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        assert page.locator("#planet-selector").is_visible()

    def test_threejs_canvas_renders(self, page):
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)
        canvas = page.locator("#scene-container canvas")
        assert canvas.count() > 0

    def test_quiz_mode_buttons_exist(self, page):
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        assert page.locator("#mode-local").is_visible()
        assert page.locator("#mode-online").is_visible()

    def test_quiz_mode_switch(self, page):
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(3000)
        online_btn = page.locator("#mode-online")
        online_btn.click()
        page.wait_for_timeout(1000)
        assert "active" in online_btn.get_attribute("class") or ""


class TestChatPanel:

    def test_search_box_exists(self, page):
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        assert page.locator("#search-box").is_visible()

    def test_chat_panel_hidden_initially(self, page):
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        panel = page.locator("#chat-panel")
        # 初始隐藏
        style = panel.get_attribute("class") or ""
        assert "show" not in style

    def test_chat_panel_opens_on_search_click(self, page):
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        page.locator("#search-box").click()
        page.wait_for_timeout(500)
        cls = page.locator("#chat-panel").get_attribute("class") or ""
        assert "show" in cls

    def test_chat_panel_has_welcome(self, page):
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        page.locator("#search-box").click()
        page.wait_for_timeout(500)
        welcome = page.locator("#chat-welcome")
        assert welcome.is_visible()

    def test_chat_send_button_exists(self, page):
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        # 发送按钮在隐藏面板里，用 count 验 DOM 存在
        assert page.locator("#chat-send").count() > 0
