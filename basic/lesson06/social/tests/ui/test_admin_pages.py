import pytest
from playwright.sync_api import sync_playwright

pytestmark = pytest.mark.ui

BASE_URL = "http://localhost:5006"

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

class TestAdminPage:

    def test_admin_page_loads_login(self, page):
        page.goto(f"{BASE_URL}/admin")
        page.wait_for_load_state("domcontentloaded")
        page.wait_for_timeout(2000)
        content = page.content()
        assert "管理后台" in content

    def test_admin_login_success(self, page):
        page.goto(f"{BASE_URL}/admin")
        page.wait_for_load_state("domcontentloaded")
        page.wait_for_selector("#adminUsername", timeout=10000)
        page.fill("#adminUsername", "admin")
        page.fill("#adminPassword", "111111")
        page.click("button:has-text('登录')")
        page.wait_for_timeout(3000)
        assert page.locator("text=总览").is_visible()

    def test_admin_login_wrong_password(self, page):
        page.goto(f"{BASE_URL}/admin")
        page.wait_for_load_state("domcontentloaded")
        page.wait_for_selector("#adminUsername", timeout=10000)
        page.fill("#adminUsername", "admin")
        page.fill("#adminPassword", "wrong")
        page.click("button:has-text('登录')")
        page.wait_for_timeout(2000)
        assert page.locator("#loginError").is_visible()

    def test_admin_stats_displayed_after_login(self, page):
        page.goto(f"{BASE_URL}/admin")
        page.wait_for_load_state("domcontentloaded")
        page.wait_for_selector("#adminUsername", timeout=10000)
        page.fill("#adminUsername", "admin")
        page.fill("#adminPassword", "111111")
        page.click("button:has-text('登录')")
        page.wait_for_timeout(3000)
        page.wait_for_selector("#statTotalUsers", timeout=10000)
        assert page.locator("#statTotalUsers").is_visible()
        assert page.locator("#statTotalPosts").is_visible()

    def test_admin_users_tab(self, page):
        page.goto(f"{BASE_URL}/admin")
        page.wait_for_load_state("domcontentloaded")
        page.wait_for_selector("#adminUsername", timeout=10000)
        page.fill("#adminUsername", "admin")
        page.fill("#adminPassword", "111111")
        page.click("button:has-text('登录')")
        page.wait_for_timeout(3000)
        page.click("button:has-text('用户列表')")
        page.wait_for_timeout(2000)
        assert page.locator("#usersTableBody").is_visible()

    def test_admin_posts_tab(self, page):
        page.goto(f"{BASE_URL}/admin")
        page.wait_for_load_state("domcontentloaded")
        page.wait_for_selector("#adminUsername", timeout=10000)
        page.fill("#adminUsername", "admin")
        page.fill("#adminPassword", "111111")
        page.click("button:has-text('登录')")
        page.wait_for_timeout(3000)
        page.click("button:has-text('帖子列表')")
        page.wait_for_timeout(2000)
        assert page.locator("#postsTableBody").is_visible()

    def test_admin_logout(self, page):
        page.goto(f"{BASE_URL}/admin")
        page.wait_for_load_state("domcontentloaded")
        page.wait_for_selector("#adminUsername", timeout=10000)
        page.fill("#adminUsername", "admin")
        page.fill("#adminPassword", "111111")
        page.click("button:has-text('登录')")
        page.wait_for_timeout(3000)
        page.click("button:has-text('退出')")
        page.wait_for_timeout(1000)
        assert page.locator("#loginPage").is_visible()
