import pytest

pytestmark = pytest.mark.api

class TestAdminAPI:

    def test_admin_login_success(self, api_client, base_url):
        response = api_client.post(
            f"{base_url}/api/admin/login",
            json={"username": "admin", "password": "111111"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "登录成功"

    def test_admin_login_wrong_password(self, api_client, base_url):
        response = api_client.post(
            f"{base_url}/api/admin/login",
            json={"username": "admin", "password": "wrong"}
        )
        assert response.status_code == 401
        data = response.json()
        assert "error" in data

    def test_admin_login_wrong_username(self, api_client, base_url):
        response = api_client.post(
            f"{base_url}/api/admin/login",
            json={"username": "notadmin", "password": "111111"}
        )
        assert response.status_code == 401
        data = response.json()
        assert "error" in data

    def test_admin_login_empty_credentials(self, api_client, base_url):
        response = api_client.post(
            f"{base_url}/api/admin/login",
            json={"username": "", "password": ""}
        )
        assert response.status_code == 401

    def test_admin_logout(self, api_client, base_url):
        api_client.post(
            f"{base_url}/api/admin/login",
            json={"username": "admin", "password": "111111"}
        )
        response = api_client.post(f"{base_url}/api/admin/logout")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "已退出"

    def test_admin_stats_without_login(self, api_client, base_url):
        response = api_client.get(f"{base_url}/api/admin/stats")
        assert response.status_code == 401

    def test_admin_stats_with_login(self, api_client, base_url):
        api_client.post(
            f"{base_url}/api/admin/login",
            json={"username": "admin", "password": "111111"}
        )
        response = api_client.get(f"{base_url}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_posts" in data
        assert "monthly_active" in data
        assert "daily_active" in data

    def test_admin_users_without_login(self, api_client, base_url):
        response = api_client.get(f"{base_url}/api/admin/users")
        assert response.status_code == 401

    def test_admin_users_with_login(self, api_client, base_url):
        api_client.post(
            f"{base_url}/api/admin/login",
            json={"username": "admin", "password": "111111"}
        )
        response = api_client.get(f"{base_url}/api/admin/users")
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert isinstance(data["users"], list)

    def test_admin_posts_without_login(self, api_client, base_url):
        response = api_client.get(f"{base_url}/api/admin/posts")
        assert response.status_code == 401

    def test_admin_posts_with_login(self, api_client, base_url):
        api_client.post(
            f"{base_url}/api/admin/login",
            json={"username": "admin", "password": "111111"}
        )
        response = api_client.get(f"{base_url}/api/admin/posts")
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
        assert isinstance(data["posts"], list)

    def test_admin_post_detail_without_login(self, api_client, base_url):
        response = api_client.get(f"{base_url}/api/admin/posts/some-id")
        assert response.status_code == 401

    def test_admin_post_detail_nonexistent(self, api_client, base_url):
        api_client.post(
            f"{base_url}/api/admin/login",
            json={"username": "admin", "password": "111111"}
        )
        response = api_client.get(f"{base_url}/api/admin/posts/nonexistent-id")
        assert response.status_code == 404
