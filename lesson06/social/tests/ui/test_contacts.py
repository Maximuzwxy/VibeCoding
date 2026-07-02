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
def page(browser):
    context = browser.new_context()
    page = context.new_page()
    yield page
    context.close()

@pytest.fixture(scope="function")
def setup_two_users(unique_username, unique_username_2, test_password):
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
    return {
        "user1": {"username": unique_username, "password": test_password},
        "user2": {"username": unique_username_2, "password": test_password}
    }

class TestContactsPage:

    def test_contacts_page_loads(self, page, setup_two_users):
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", setup_two_users["user1"]["username"])
        page.fill("#password", setup_two_users["user1"]["password"])
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        page.goto(f"{BASE_URL}/contacts")
        page.wait_for_load_state("networkidle")
        assert page.locator(".friends-list").is_visible() or page.locator("#friendsList").is_visible()

    def test_search_users(self, page, setup_two_users):
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", setup_two_users["user1"]["username"])
        page.fill("#password", setup_two_users["user1"]["password"])
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        page.goto(f"{BASE_URL}/contacts")
        page.wait_for_load_state("networkidle")

        search_input = page.locator("#searchInput")
        if search_input.is_visible():
            search_input.fill(setup_two_users["user2"]["username"][:5])
            page.wait_for_timeout(1000)

    def test_send_friend_request(self, page, setup_two_users):
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", setup_two_users["user1"]["username"])
        page.fill("#password", setup_two_users["user1"]["password"])
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        page.goto(f"{BASE_URL}/contacts")
        page.wait_for_load_state("networkidle")

        search_input = page.locator("#searchInput")
        if search_input.is_visible():
            search_input.fill(setup_two_users["user2"]["username"][:3])
            page.wait_for_timeout(1000)

            add_buttons = page.locator(".btn-add-friend")
            if add_buttons.count() > 0:
                add_buttons.first.click()
                page.wait_for_timeout(1000)

    def test_receive_friend_request(self, page, setup_two_users):
        api_client = requests.Session()
        api_client.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "username": setup_two_users["user1"]["username"],
                "password": setup_two_users["user1"]["password"]
            }
        )
        api_client.post(
            f"{BASE_URL}/api/friends/requests",
            json={"to": setup_two_users["user2"]["username"]}
        )

        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", setup_two_users["user2"]["username"])
        page.fill("#password", setup_two_users["user2"]["password"])
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        page.goto(f"{BASE_URL}/contacts")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)

        friend_requests_section = page.locator("#friendRequestsSection")
        if friend_requests_section.count() > 0 and friend_requests_section.is_visible():
            assert "添加" in friend_requests_section.text_content() or "接受" in friend_requests_section.text_content()
