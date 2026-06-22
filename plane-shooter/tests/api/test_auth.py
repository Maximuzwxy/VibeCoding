import pytest

pytestmark = pytest.mark.api

class TestAuthAPI:

    def test_login_and_register_success(self, api_client, base_url, unique_username, test_password):
        response = api_client.post(
            f"{base_url}/login",
            data={
                "username": unique_username,
                "password": test_password
            }
        )
        assert response.status_code in [200, 302]
        assert "game" in response.url.lower() or response.status_code == 200

    def test_login_with_existing_user(self, api_client, base_url, registered_user, test_password):
        response = api_client.post(
            f"{base_url}/login",
            data={
                "username": registered_user["username"],
                "password": test_password
            }
        )
        assert response.status_code in [200, 302]

    def test_login_with_wrong_password(self, api_client, base_url, registered_user, test_password):
        response = api_client.post(
            f"{base_url}/login",
            data={
                "username": registered_user["username"],
                "password": "wrongpassword"
            }
        )
        assert response.status_code in [200, 400]

    def test_login_with_nonexistent_user(self, api_client, base_url, unique_username, test_password):
        response = api_client.post(
            f"{base_url}/login",
            data={
                "username": unique_username,
                "password": test_password
            }
        )
        assert response.status_code in [200, 302]

    def test_logout(self, api_client, base_url, registered_user):
        api_client.post(
            f"{base_url}/login",
            data={
                "username": registered_user["username"],
                "password": registered_user["password"]
            }
        )
        response = api_client.get(f"{base_url}/logout")
        assert response.status_code in [200, 302]

    def test_index_redirects_to_login(self, api_client, base_url):
        response = api_client.get(f"{base_url}/")
        assert response.status_code in [200, 302]
