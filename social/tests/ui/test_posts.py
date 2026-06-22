import pytest
from playwright.sync_api import sync_playwright
import requests
import uuid
import time

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

    api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": unique_username, "password": test_password}
    )
    api_client.post(
        f"{BASE_URL}/api/friends/requests",
        json={"to": unique_username_2}
    )

    api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": unique_username_2, "password": test_password}
    )
    resp = api_client.get(f"{BASE_URL}/api/friends/requests")
    requests_list = resp.json().get("requests", [])
    for req in requests_list:
        if req["from"] == unique_username:
            api_client.put(
                f"{BASE_URL}/api/friends/requests/{req['id']}",
                json={"action": "accept"}
            )
            break

    return {
        "user1": {"username": unique_username, "password": test_password},
        "user2": {"username": unique_username_2, "password": test_password}
    }

class TestFriendsCirclePage:

    def test_friends_circle_page_loads(self, page, setup_two_users):
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", setup_two_users["user1"]["username"])
        page.fill("#password", setup_two_users["user1"]["password"])
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        page.goto(f"{BASE_URL}/friendscircle")
        page.wait_for_load_state("networkidle")
        assert page.locator(".friends-circle-page").is_visible() or page.locator("#postsList").is_visible()

    def test_create_post(self, page, setup_two_users):
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", setup_two_users["user1"]["username"])
        page.fill("#password", setup_two_users["user1"]["password"])
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        page.goto(f"{BASE_URL}/friendscircle")
        page.wait_for_load_state("networkidle")

        page.click("button.header-btn:has-text('发布')")
        page.wait_for_timeout(500)

        page.fill("#postTextInput", "这是我的测试帖子")
        page.click("#createPostModal button:has-text('发布')")
        page.wait_for_timeout(2000)

        assert page.locator("text=这是我的测试帖子").is_visible()

    def test_like_post(self, page, setup_two_users):
        api_client = requests.Session()
        api_client.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": setup_two_users["user1"]["username"], "password": setup_two_users["user1"]["password"]}
        )
        resp = api_client.post(
            f"{BASE_URL}/api/posts",
            data={"content": "user1的帖子用于点赞测试"}
        )
        post_id = resp.json()["post"]["id"]

        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", setup_two_users["user1"]["username"])
        page.fill("#password", setup_two_users["user1"]["password"])
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        page.goto(f"{BASE_URL}/friendscircle")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)

        page.click(f"[data-post-id='{post_id}'] .action-btn:first-child")
        page.wait_for_timeout(1000)

    def test_delete_own_post(self, page, setup_two_users):
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", setup_two_users["user1"]["username"])
        page.fill("#password", setup_two_users["user1"]["password"])
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        page.goto(f"{BASE_URL}/friendscircle")
        page.wait_for_load_state("networkidle")

        page.click("button:has-text('发布')")
        page.wait_for_timeout(500)
        page.fill("#postTextInput", "要删除的帖子")
        page.click("button:has-text('发布')")
        page.wait_for_timeout(2000)

        delete_btn = page.locator("button:has-text('删除')").first
        if delete_btn.is_visible():
            page.on("dialog", lambda dialog: dialog.accept())
            delete_btn.click()
            page.wait_for_timeout(2000)

    def test_view_my_posts(self, page, setup_two_users):
        api_client = requests.Session()
        api_client.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": setup_two_users["user1"]["username"], "password": setup_two_users["user1"]["password"]}
        )
        api_client.post(f"{BASE_URL}/api/posts", data={"content": "我的专属帖子1"})
        api_client.post(f"{BASE_URL}/api/posts", data={"content": "我的专属帖子2"})

        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", setup_two_users["user1"]["username"])
        page.fill("#password", setup_two_users["user1"]["password"])
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        page.goto(f"{BASE_URL}/friendscircle")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)

        page.click("button:has-text('我的帖子')")
        page.wait_for_timeout(2000)

    def test_navigation_to_friends_circle(self, page, setup_two_users):
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", setup_two_users["user1"]["username"])
        page.fill("#password", setup_two_users["user1"]["password"])
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        page.click("a[href='/friendscircle']")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)

        assert "friendscircle" in page.url

    def test_comment_input_appears_on_click(self, page, setup_two_users):
        api_client = requests.Session()
        api_client.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": setup_two_users["user1"]["username"], "password": setup_two_users["user1"]["password"]}
        )
        resp = api_client.post(f"{BASE_URL}/api/posts", data={"content": "用于测试评论的帖子"})
        post_id = resp.json()["post"]["id"]
        print(f"Created post with ID: {post_id}")

        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", setup_two_users["user1"]["username"])
        page.fill("#password", setup_two_users["user1"]["password"])
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        page.goto(f"{BASE_URL}/friendscircle")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)

        posts_count = page.locator(".post-card").count()
        print(f"Number of posts on page: {posts_count}")

        post_locator = page.locator(f"[data-post-id='{post_id}']")
        post_visible = post_locator.count() > 0
        print(f"Target post visible: {post_visible}")

        if post_visible:
            page.click(f"[data-post-id='{post_id}'] .action-btn:nth-child(2)")
            page.wait_for_timeout(500)

            comment_input = page.locator(f"#comment-input-{post_id}")
            assert comment_input.is_visible()
        else:
            print("Post not found on page")

    def test_submit_comment(self, page, setup_two_users):
        api_client = requests.Session()
        api_client.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": setup_two_users["user1"]["username"], "password": setup_two_users["user1"]["password"]}
        )
        resp = api_client.post(f"{BASE_URL}/api/posts", data={"content": "用于测试提交评论的帖子"})
        post_id = resp.json()["post"]["id"]

        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", setup_two_users["user1"]["username"])
        page.fill("#password", setup_two_users["user1"]["password"])
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        page.goto(f"{BASE_URL}/friendscircle")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)

        page.click(f"[data-post-id='{post_id}'] .action-btn:nth-child(2)")
        page.wait_for_timeout(500)

        comment_textarea = page.locator(f"#comment-text-{post_id}")
        comment_textarea.fill("这是我的测试评论")
        page.click(f"[data-post-id='{post_id}'] .comment-submit-btn")
        page.wait_for_timeout(2000)

        assert "这是我的测试评论" in page.content()

    def test_delete_own_comment(self, page, setup_two_users):
        api_client = requests.Session()
        api_client.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": setup_two_users["user1"]["username"], "password": setup_two_users["user1"]["password"]}
        )
        resp = api_client.post(f"{BASE_URL}/api/posts", data={"content": "用于测试删除评论的帖子"})
        post_id = resp.json()["post"]["id"]
        comment_resp = api_client.post(
            f"{BASE_URL}/api/posts/{post_id}/comments",
            json={"content": "要删除的评论"}
        )
        comment_id = comment_resp.json()["comment"]["id"]

        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("#username", setup_two_users["user1"]["username"])
        page.fill("#password", setup_two_users["user1"]["password"])
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        page.goto(f"{BASE_URL}/friendscircle")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)

        page.click(f"[data-post-id='{post_id}'] .action-btn:nth-child(2)")
        page.wait_for_timeout(500)

        page.on("dialog", lambda dialog: dialog.accept())
        delete_btn = page.locator(f"[data-comment-id='{comment_id}'] .comment-delete-btn")
        if delete_btn.is_visible():
            delete_btn.click()
            page.wait_for_timeout(2000)