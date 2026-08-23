import pytest
import requests
import uuid
from pathlib import Path

BASE_URL = "http://localhost:5005"

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
def registered_user(api_client, base_url, unique_username, test_password):
    response = api_client.post(
        f"{base_url}/login",
        data={
            "username": unique_username,
            "password": test_password
        }
    )
    assert response.status_code in [200, 302], f"登录失败: {response.text}"
    return {
        "username": unique_username,
        "password": test_password
    }

@pytest.fixture(scope="function")
def two_registered_users(api_client, base_url, unique_username, unique_username_2, test_password):
    user1 = api_client.post(
        f"{base_url}/login",
        data={
            "username": unique_username,
            "password": test_password
        }
    )
    assert user1.status_code in [200, 302], f"用户1登录失败: {user1.text}"

    user2 = api_client.post(
        f"{base_url}/login",
        data={
            "username": unique_username_2,
            "password": test_password
        }
    )
    assert user2.status_code in [200, 302], f"用户2登录失败: {user2.text}"

    return {
        "user1": {
            "username": unique_username,
            "password": test_password
        },
        "user2": {
            "username": unique_username_2,
            "password": test_password
        }
    }

@pytest.fixture(scope="function")
def logged_in_client(api_client, base_url, registered_user):
    response = api_client.post(
        f"{base_url}/login",
        data={
            "username": registered_user["username"],
            "password": registered_user["password"]
        }
    )
    assert response.status_code in [200, 302]
    return api_client
