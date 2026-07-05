import pytest
from playwright.sync_api import sync_playwright
import requests
import uuid

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

@pytest.fixture(scope="function")
def setup_friendship(unique_username, unique_username_2, test_password):
    api_client = requests.Session()
    api_client.post(
        f"{BASE_URL}/api/auth/register",
        json={
            "username": unique_username,
            "password": test_password,
            "confirm_password": test_password
        }
    )
    api_client.post(
        f"{BASE_URL}/api/auth/register",
        json={
            "username": unique_username_2,
            "password": test_password,
            "confirm_password": test_password
        }
    )
    api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "username": unique_username,
            "password": test_password
        }
    )
    api_client.post(
        f"{BASE_URL}/api/friends/requests",
        json={"to": unique_username_2}
    )

    api_client2 = requests.Session()
    api_client2.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "username": unique_username_2,
            "password": test_password
        }
    )
    requests_response = api_client2.get(f"{BASE_URL}/api/friends/requests")
    request_id = requests_response.json()["requests"][0]["id"]
    api_client2.put(
        f"{BASE_URL}/api/friends/requests/{request_id}",
        json={"action": "accept"}
    )

    return {
        "user1": {"username": unique_username, "password": test_password},
        "user2": {"username": unique_username_2, "password": test_password}
    }

class TestChatPage:

    def test_chat_page_loads(self, page, setup_friendship):
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", setup_friendship["user1"]["username"])
        page.fill("#password", setup_friendship["user1"]["password"])
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        page.goto(f"{BASE_URL}/chat")
        page.wait_for_load_state("networkidle")
        assert "会话" in page.title() or page.locator(".chat-sidebar").is_visible()

    def test_chat_list_shows_friends(self, page, setup_friendship):
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", setup_friendship["user1"]["username"])
        page.fill("#password", setup_friendship["user1"]["password"])
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        page.goto(f"{BASE_URL}/chat")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)

        chat_list = page.locator("#chatList")
        assert chat_list.is_visible()

    def test_open_chat_window(self, page, setup_friendship):
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", setup_friendship["user1"]["username"])
        page.fill("#password", setup_friendship["user1"]["password"])
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        page.goto(f"{BASE_URL}/chat")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)

        chat_items = page.locator(".chat-item")
        if chat_items.count() > 0:
            chat_items.first.click()
            page.wait_for_timeout(1000)
            assert page.locator("#chatWindow").is_visible()

    def test_send_message(self, page, setup_friendship):
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", setup_friendship["user1"]["username"])
        page.fill("#password", setup_friendship["user1"]["password"])
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        page.goto(f"{BASE_URL}/chat")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)

        chat_items = page.locator(".chat-item")
        if chat_items.count() > 0:
            chat_items.first.click()
            page.wait_for_timeout(1000)

            page.fill("#chatInput", "测试消息")
            page.click("#chatSendBtn")
            page.wait_for_timeout(1000)

            messages = page.locator(".message")
            assert messages.count() > 0

    def test_chat_search(self, page, setup_friendship):
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", setup_friendship["user1"]["username"])
        page.fill("#password", setup_friendship["user1"]["password"])
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        page.goto(f"{BASE_URL}/chat")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)

        search_input = page.locator("#chatSearchInput")
        if search_input.is_visible():
            search_input.fill(setup_friendship["user2"]["username"][:3])
            page.wait_for_timeout(500)
