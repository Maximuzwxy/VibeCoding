import pytest
import requests
import uuid
from pathlib import Path

BASE_URL = "http://localhost:5006"

@pytest.fixture(scope="session")
def base_url():
    return BASE_URL

@pytest.fixture(scope="function")
def api_client():
    return requests.Session()

@pytest.fixture(scope="function")
def unique_username():
    return f"u{uuid.uuid4().hex[:8]}"

@pytest.fixture(scope="function")
def unique_username_2():
    return f"v{uuid.uuid4().hex[:8]}"

@pytest.fixture(scope="function")
def test_password():
    return "test123456"

@pytest.fixture(scope="function")
def registered_user(api_client, unique_username, test_password):
    response = api_client.post(
        f"{BASE_URL}/api/auth/register",
        json={
            "username": unique_username,
            "password": test_password,
            "confirm_password": test_password
        }
    )
    assert response.status_code == 200, f"注册失败: {response.text}"
    data = response.json()
    return {
        "username": unique_username,
        "password": test_password,
        "user_id": data.get("userId")
    }

@pytest.fixture(scope="function")
def two_registered_users(api_client, unique_username, unique_username_2, test_password):
    user1 = api_client.post(
        f"{BASE_URL}/api/auth/register",
        json={
            "username": unique_username,
            "password": test_password,
            "confirm_password": test_password
        }
    )
    user1_data = user1.json()
    if user1.status_code == 400 and user1_data.get("error") and "已存在" in user1_data.get("error", ""):
        user1_data = {"username": unique_username, "userId": None}
    else:
        assert user1.status_code == 200, f"注册失败: {user1.text}"
        user1_data = user1.json()

    user2 = api_client.post(
        f"{BASE_URL}/api/auth/register",
        json={
            "username": unique_username_2,
            "password": test_password,
            "confirm_password": test_password
        }
    )
    user2_data = user2.json()
    if user2.status_code == 400 and user2_data.get("error") and "已存在" in user2_data.get("error", ""):
        user2_data = {"username": unique_username_2, "userId": None}
    else:
        assert user2.status_code == 200, f"注册失败: {user2.text}"
        user2_data = user2.json()

    return {
        "user1": {
            "username": unique_username,
            "password": test_password,
            "user_id": user1_data.get("userId")
        },
        "user2": {
            "username": unique_username_2,
            "password": test_password,
            "user_id": user2_data.get("userId")
        }
    }

@pytest.fixture(scope="function")
def logged_in_client(api_client, registered_user):
    response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "username": registered_user["username"],
            "password": registered_user["password"]
        }
    )
    assert response.status_code == 200
    return api_client

@pytest.fixture(scope="function")
def two_logged_in_clients(two_registered_users):
    client1 = requests.Session()
    client2 = requests.Session()

    resp1 = client1.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "username": two_registered_users["user1"]["username"],
            "password": two_registered_users["user1"]["password"]
        }
    )
    assert resp1.status_code == 200

    resp2 = client2.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "username": two_registered_users["user2"]["username"],
            "password": two_registered_users["user2"]["password"]
        }
    )
    assert resp2.status_code == 200

    return client1, client2, two_registered_users

def pytest_configure(config):
    config.addinivalue_line(
        "markers", "api: mark test as an API test"
    )
    config.addinivalue_line(
        "markers", "ui: mark test as a UI test"
    )
