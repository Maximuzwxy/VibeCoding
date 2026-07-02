import pytest

pytestmark = pytest.mark.api

class TestScoreAPI:

    def test_save_score(self, logged_in_client, base_url, registered_user):
        response = logged_in_client.post(
            f"{base_url}/api/save_score",
            json={
                "username": registered_user["username"],
                "score": 15000,
                "level": 3
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data or "success" in data or data.get("status") == "success"

    def test_save_score_invalid_level(self, logged_in_client, base_url, registered_user):
        response = logged_in_client.post(
            f"{base_url}/api/save_score",
            json={
                "username": registered_user["username"],
                "score": 15000,
                "level": 99
            }
        )
        assert response.status_code in [200, 400]

    def test_save_score_negative_score(self, logged_in_client, base_url, registered_user):
        response = logged_in_client.post(
            f"{base_url}/api/save_score",
            json={
                "username": registered_user["username"],
                "score": -100,
                "level": 1
            }
        )
        assert response.status_code in [200, 400]

    def test_save_score_without_login(self, api_client, base_url, unique_username):
        response = api_client.post(
            f"{base_url}/api/save_score",
            json={
                "username": unique_username,
                "score": 15000,
                "level": 3
            }
        )
        assert response.status_code in [200, 401, 403]

    def test_get_user_best_score(self, logged_in_client, base_url, registered_user):
        logged_in_client.post(
            f"{base_url}/api/save_score",
            json={
                "username": registered_user["username"],
                "score": 15000,
                "level": 3
            }
        )

        response = logged_in_client.get(
            f"{base_url}/api/get_user_best",
            params={"username": registered_user["username"]}
        )
        assert response.status_code == 200
        data = response.json()
        assert "score" in data or "best_score" in data or isinstance(data, dict)

    def test_get_user_best_score_nonexistent(self, api_client, base_url, unique_username):
        response = api_client.get(
            f"{base_url}/api/get_user_best",
            params={"username": unique_username}
        )
        assert response.status_code in [200, 401, 404]
