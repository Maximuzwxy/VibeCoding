import pytest
from playwright.sync_api import sync_playwright

pytestmark = pytest.mark.ui

BASE_URL = "http://localhost:5000"

@pytest.fixture(scope="function")
def browser():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        yield browser
        browser.close()

@pytest.fixture(scope="function")
def page(browser):
    context = browser.new_context()
    page = context.new_page()
    yield page
    context.close()

class TestLoginPage:

    def test_login_page_loads(self, page):
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        assert "Plane Shooter" in page.title()

    def test_login_form_elements_exist(self, page):
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        assert page.locator("#username").is_visible()
        assert page.locator("button[type='submit']").is_visible()

    def test_login_success(self, page, unique_username):
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", unique_username)
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)
        assert "game" in page.url.lower() or page.locator("#gameCanvas").count() > 0

    def test_login_creates_user(self, page, unique_username):
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", unique_username)
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)
        assert "game" in page.url.lower() or page.locator("#gameCanvas").count() > 0

    def test_login_page_has_links(self, page):
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        assert page.locator("a[href*='leaderboard']").is_visible()
        assert page.locator("a[href*='rules']").is_visible()

class TestLeaderboardPage:

    def test_leaderboard_page_loads(self, page):
        page.goto(f"{BASE_URL}/leaderboard")
        page.wait_for_load_state("networkidle")
        assert "Leaderboard" in page.title()

    def test_leaderboard_table_exists(self, page):
        page.goto(f"{BASE_URL}/leaderboard")
        page.wait_for_load_state("networkidle")
        assert page.locator("table.leaderboard-table").is_visible() or page.locator(".no-scores").is_visible()

    def test_leaderboard_has_back_link(self, page):
        page.goto(f"{BASE_URL}/leaderboard")
        page.wait_for_load_state("networkidle")
        assert page.locator("a[href*='login']").is_visible()

class TestRulesPage:

    def test_rules_page_loads(self, page):
        page.goto(f"{BASE_URL}/rules")
        page.wait_for_load_state("networkidle")
        assert "Rules" in page.title() or "Game Rules" in page.title()

    def test_rules_has_back_link(self, page):
        page.goto(f"{BASE_URL}/rules")
        page.wait_for_load_state("networkidle")
        assert page.locator("a[href*='login']").is_visible()

class TestGamePage:

    def test_game_page_requires_login(self, page):
        page.goto(f"{BASE_URL}/")
        page.wait_for_timeout(1000)
        assert "login" in page.url.lower()

    def test_game_canvas_exists_after_login(self, page, unique_username):
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", unique_username)
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)
        assert page.locator("#gameCanvas").count() > 0
