import pytest
import requests

pytestmark = pytest.mark.api

class TestAuthAPI:

    def test_register_success(self, api_client, base_url, unique_username, test_password):
        response = api_client.post(
            f"{base_url}/api/auth/register",
            json={
                "username": unique_username,
                "password": test_password,
                "confirm_password": test_password
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "user" in data
        assert "userId" in data
        assert data["user"]["username"] == unique_username

    def test_register_with_duplicate_username(self, api_client, base_url, registered_user, unique_username, test_password):
        response = api_client.post(
            f"{base_url}/api/auth/register",
            json={
                "username": unique_username,
                "password": test_password,
                "confirm_password": test_password
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data

    def test_register_with_invalid_username_starts_with_number(self, api_client, base_url, test_password):
        response = api_client.post(
            f"{base_url}/api/auth/register",
            json={
                "username": "123user",
                "password": test_password,
                "confirm_password": test_password
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert "用户名格式不正确" in data["error"]

    def test_register_with_short_username(self, api_client, base_url, test_password):
        response = api_client.post(
            f"{base_url}/api/auth/register",
            json={
                "username": "ab",
                "password": test_password,
                "confirm_password": test_password
            }
        )
        assert response.status_code == 400

    def test_register_with_short_password(self, api_client, base_url, unique_username):
        response = api_client.post(
            f"{base_url}/api/auth/register",
            json={
                "username": unique_username,
                "password": "123",
                "confirm_password": "123"
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert "密码长度不能少于6位" in data["error"]

    def test_register_with_mismatched_passwords(self, api_client, base_url, unique_username, test_password):
        response = api_client.post(
            f"{base_url}/api/auth/register",
            json={
                "username": unique_username,
                "password": test_password,
                "confirm_password": "different_password"
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert "两次输入的密码不一致" in data["error"]

    def test_login_success(self, api_client, base_url, registered_user):
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "username": registered_user["username"],
                "password": registered_user["password"]
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "user" in data
        assert "userId" in data
        assert data["user"]["username"] == registered_user["username"]

    def test_login_with_wrong_password(self, api_client, base_url, registered_user):
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "username": registered_user["username"],
                "password": "wrong_password"
            }
        )
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert "密码错误" in data["error"]

    def test_login_with_nonexistent_user(self, api_client, base_url):
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "username": "nonexistent_user_xyz",
                "password": "any_password"
            }
        )
        assert response.status_code == 404
        data = response.json()
        assert "error" in data
        assert "用户名不存在" in data["error"]

    def test_logout(self, api_client, base_url, registered_user):
        api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "username": registered_user["username"],
                "password": registered_user["password"]
            }
        )
        response = api_client.post(f"{base_url}/api/auth/logout")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    def test_get_me_authenticated(self, api_client, base_url, registered_user):
        api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "username": registered_user["username"],
                "password": registered_user["password"]
            }
        )
        response = api_client.get(f"{base_url}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["username"] == registered_user["username"]

    def test_get_me_unauthenticated(self, api_client, base_url):
        response = api_client.get(f"{base_url}/api/auth/me")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
