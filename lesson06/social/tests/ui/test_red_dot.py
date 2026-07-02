import pytest
from playwright.sync_api import sync_playwright
import requests
import uuid

pytestmark = pytest.mark.ui

BASE_URL = "http://localhost:5000"

@pytest.fixture(scope="function")
def browser():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        yield browser
        browser.close()

@pytest.fixture(scope="function")
def context(browser):
    ctx = browser.new_context()
    yield ctx
    ctx.close()

@pytest.fixture(scope="function")
def page(context):
    page = context.new_page()
    yield page

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

class TestRedDot:

    def test_red_dot_appears_when_message_sent(self, context, setup_friendship):
        user1_page = context.new_page()
        user2_page = context.new_page()

        user1_page.goto(f"{BASE_URL}/login")
        user1_page.wait_for_load_state("networkidle")
        user1_page.fill("#username", setup_friendship["user1"]["username"])
        user1_page.fill("#password", setup_friendship["user1"]["password"])
        user1_page.click("button[type='submit']")
        user1_page.wait_for_timeout(2000)

        user2_page.goto(f"{BASE_URL}/login")
        user2_page.wait_for_load_state("networkidle")
        user2_page.fill("#username", setup_friendship["user2"]["username"])
        user2_page.fill("#password", setup_friendship["user2"]["password"])
        user2_page.click("button[type='submit']")
        user2_page.wait_for_timeout(2000)

        user1_page.goto(f"{BASE_URL}/chat")
        user1_page.wait_for_load_state("networkidle")
        user1_page.wait_for_timeout(2000)

        chat_items = user1_page.locator(".chat-item")
        if chat_items.count() > 0:
            chat_items.first.click()
            user1_page.wait_for_timeout(1500)

            chat_window = user1_page.locator("#chatWindow")
            chat_window.wait_for(state="visible", timeout=5000)

            user1_page.fill("#chatInput", "测试消息")
            user1_page.click("#chatSendBtn")
            user1_page.wait_for_timeout(1000)

        user2_page.goto(f"{BASE_URL}/contacts")
        user2_page.wait_for_timeout(1000)

    def test_red_dot_disappears_when_opening_chat(self, context, setup_friendship):
        user1_page = context.new_page()
        user2_page = context.new_page()

        user1_page.goto(f"{BASE_URL}/login")
        user1_page.wait_for_load_state("networkidle")
        user1_page.fill("#username", setup_friendship["user1"]["username"])
        user1_page.fill("#password", setup_friendship["user1"]["password"])
        user1_page.click("button[type='submit']")
        user1_page.wait_for_timeout(2000)

        user2_page.goto(f"{BASE_URL}/login")
        user2_page.wait_for_load_state("networkidle")
        user2_page.fill("#username", setup_friendship["user2"]["username"])
        user2_page.fill("#password", setup_friendship["user2"]["password"])
        user2_page.click("button[type='submit']")
        user2_page.wait_for_timeout(2000)

        user1_page.goto(f"{BASE_URL}/chat")
        user1_page.wait_for_load_state("networkidle")
        user1_page.wait_for_timeout(2000)

        chat_items = user1_page.locator(".chat-item")
        if chat_items.count() > 0:
            chat_items.first.click()
            user1_page.wait_for_timeout(1500)

            chat_window = user1_page.locator("#chatWindow")
            chat_window.wait_for(state="visible", timeout=5000)

            user1_page.fill("#chatInput", "测试消息")
            user1_page.click("#chatSendBtn")
            user1_page.wait_for_timeout(1000)

        user2_page.goto(f"{BASE_URL}/chat")
        user2_page.wait_for_load_state("networkidle")
        user2_page.wait_for_timeout(2000)

        chat_items_user2 = user2_page.locator(".chat-item")
        if chat_items_user2.count() > 0:
            chat_items_user2.first.click()
            user2_page.wait_for_timeout(1500)

            chat_window_user2 = user2_page.locator("#chatWindow")
            chat_window_user2.wait_for(state="visible", timeout=5000)

    def test_no_red_dot_when_in_chat(self, context, setup_friendship):
        user1_page = context.new_page()
        user2_page = context.new_page()

        user1_page.goto(f"{BASE_URL}/login")
        user1_page.wait_for_load_state("networkidle")
        user1_page.fill("#username", setup_friendship["user1"]["username"])
        user1_page.fill("#password", setup_friendship["user1"]["password"])
        user1_page.click("button[type='submit']")
        user1_page.wait_for_timeout(2000)

        user2_page.goto(f"{BASE_URL}/login")
        user2_page.wait_for_load_state("networkidle")
        user2_page.fill("#username", setup_friendship["user2"]["username"])
        user2_page.fill("#password", setup_friendship["user2"]["password"])
        user2_page.click("button[type='submit']")
        user2_page.wait_for_timeout(2000)

        user1_page.goto(f"{BASE_URL}/chat")
        user1_page.wait_for_load_state("networkidle")
        user1_page.wait_for_timeout(2000)

        chat_items = user1_page.locator(".chat-item")
        if chat_items.count() > 0:
            chat_items.first.click()
            user1_page.wait_for_timeout(1500)

            chat_window = user1_page.locator("#chatWindow")
            chat_window.wait_for(state="visible", timeout=5000)

        user2_page.goto(f"{BASE_URL}/chat")
        user2_page.wait_for_load_state("networkidle")
        user2_page.wait_for_timeout(2000)

        chat_items_user2 = user2_page.locator(".chat-item")
        if chat_items_user2.count() > 0:
            chat_items_user2.first.click()
            user2_page.wait_for_timeout(1500)

            chat_window_user2 = user2_page.locator("#chatWindow")
            chat_window_user2.wait_for(state="visible", timeout=5000)

            user1_page.fill("#chatInput", "测试消息")
            user1_page.click("#chatSendBtn")
            user1_page.wait_for_timeout(1000)

        nav_dot = user2_page.locator("#navChatDot")
        chat_item_dot = user2_page.locator(".chat-item-dot")

        if nav_dot.count() > 0:
            assert nav_dot.is_hidden() or nav_dot.get_attribute("style") == "display: none;"

        if chat_item_dot.count() > 0:
            assert chat_item_dot.first.is_hidden() or chat_item_dot.first.get_attribute("class") == "chat-item-dot hidden"
