import pytest
import requests

pytestmark = pytest.mark.api

class TestUsersAPI:

    def test_get_user_by_username(self, api_client, base_url, registered_user):
        api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "username": registered_user["username"],
                "password": registered_user["password"]
            }
        )
        response = api_client.get(f"{base_url}/api/users/{registered_user['username']}")
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["username"] == registered_user["username"]

    def test_get_nonexistent_user(self, api_client, base_url, registered_user):
        api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "username": registered_user["username"],
                "password": registered_user["password"]
            }
        )
        response = api_client.get(f"{base_url}/api/users/nonexistent_user_xyz")
        assert response.status_code == 404

    def test_search_users(self, api_client, base_url, registered_user):
        api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "username": registered_user["username"],
                "password": registered_user["password"]
            }
        )
        response = api_client.get(f"{base_url}/api/users/search?q=test")
        assert response.status_code == 200
        data = response.json()
        assert "users" in data

    def test_search_users_empty_query(self, api_client, base_url, registered_user):
        api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "username": registered_user["username"],
                "password": registered_user["password"]
            }
        )
        response = api_client.get(f"{base_url}/api/users/search?q=")
        assert response.status_code == 200
        data = response.json()
        assert data["users"] == []

    def test_update_profile_bio(self, api_client, base_url, registered_user):
        api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "username": registered_user["username"],
                "password": registered_user["password"]
            }
        )
        new_bio = "这是我新的个人简介"
        response = api_client.put(
            f"{base_url}/api/users/profile",
            json={"bio": new_bio}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["bio"] == new_bio

    def test_update_profile_bio_too_long(self, api_client, base_url, registered_user):
        api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "username": registered_user["username"],
                "password": registered_user["password"]
            }
        )
        long_bio = "a" * 101
        response = api_client.put(
            f"{base_url}/api/users/profile",
            json={"bio": long_bio}
        )
        assert response.status_code == 400
        data = response.json()
        assert "个人简介不能超过100个字符" in data["error"]

    def test_update_password_success(self, api_client, base_url, registered_user):
        api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "username": registered_user["username"],
                "password": registered_user["password"]
            }
        )
        new_password = "new_password_123"
        response = api_client.put(
            f"{base_url}/api/users/password",
            json={
                "current_password": registered_user["password"],
                "new_password": new_password,
                "confirm_password": new_password
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

        login_response = api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "username": registered_user["username"],
                "password": new_password
            }
        )
        assert login_response.status_code == 200

    def test_update_password_wrong_current(self, api_client, base_url, registered_user):
        api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "username": registered_user["username"],
                "password": registered_user["password"]
            }
        )
        response = api_client.put(
            f"{base_url}/api/users/password",
            json={
                "current_password": "wrong_password",
                "new_password": "new_password_123",
                "confirm_password": "new_password_123"
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert "当前密码错误" in data["error"]

    def test_update_password_mismatched(self, api_client, base_url, registered_user):
        api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "username": registered_user["username"],
                "password": registered_user["password"]
            }
        )
        response = api_client.put(
            f"{base_url}/api/users/password",
            json={
                "current_password": registered_user["password"],
                "new_password": "new_password_123",
                "confirm_password": "different_password"
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert "两次输入的新密码不一致" in data["error"]
