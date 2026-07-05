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

class TestLoginPage:

    def test_login_page_loads(self, page):
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        assert "登录" in page.title()

    def test_login_form_elements_exist(self, page):
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        assert page.locator("#username").is_visible()
        assert page.locator("#password").is_visible()
        assert page.locator("button[type='submit']").is_visible()

    def test_login_success(self, page, unique_username, test_password):
        page.goto(f"{BASE_URL}/register")
        page.wait_for_load_state("networkidle")
        page.fill("#username", unique_username)
        page.fill("#password", test_password)
        page.fill("#confirmPassword", test_password)
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", unique_username)
        page.fill("#password", test_password)
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        assert "/contacts" in page.url or "/chat" in page.url

    def test_login_with_wrong_password(self, page, unique_username, test_password):
        page.goto(f"{BASE_URL}/register")
        page.wait_for_load_state("networkidle")
        page.fill("#username", unique_username)
        page.fill("#password", test_password)
        page.fill("#confirmPassword", test_password)
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", unique_username)
        page.fill("#password", "wrongpassword")
        page.click("button[type='submit']")
        page.wait_for_timeout(1000)

        assert "/login" in page.url

class TestRegisterPage:

    def test_register_page_loads(self, page):
        page.goto(f"{BASE_URL}/register")
        page.wait_for_load_state("networkidle")
        assert "注册" in page.title()

    def test_register_form_elements_exist(self, page):
        page.goto(f"{BASE_URL}/register")
        page.wait_for_load_state("networkidle")
        assert page.locator("#username").is_visible()
        assert page.locator("#password").is_visible()
        assert page.locator("#confirmPassword").is_visible()
        assert page.locator("button[type='submit']").is_visible()

    def test_navigate_to_login(self, page):
        page.goto(f"{BASE_URL}/register")
        page.wait_for_load_state("networkidle")
        page.click("text=登录")
        page.wait_for_timeout(1000)
        assert "/login" in page.url

    def test_navigate_to_register(self, page):
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.click("text=注册")
        page.wait_for_timeout(1000)
        assert "/register" in page.url
