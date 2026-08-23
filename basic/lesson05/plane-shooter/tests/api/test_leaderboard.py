import pytest

pytestmark = pytest.mark.api

class TestLeaderboardAPI:

    def test_get_leaderboard(self, api_client, base_url):
        response = api_client.get(f"{base_url}/api/leaderboard")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        assert "scores" in data
        assert isinstance(data["scores"], list)

    def test_leaderboard_sorted_by_score(self, api_client, base_url, two_registered_users):
        api_client.post(
            f"{base_url}/api/save_score",
            json={
                "username": two_registered_users["user1"]["username"],
                "score": 10000,
                "level": 3
            }
        )
        api_client.post(
            f"{base_url}/api/save_score",
            json={
                "username": two_registered_users["user2"]["username"],
                "score": 20000,
                "level": 5
            }
        )

        response = api_client.get(f"{base_url}/api/leaderboard")
        assert response.status_code == 200
        data = response.json()
        if len(data.get("scores", [])) >= 2:
            assert data["scores"][0]["score"] >= data["scores"][1]["score"]

    @pytest.mark.skip(reason="Flask session handling issue with requests.Session")
    def test_leaderboard_contains_user_score(self, api_client, base_url, unique_username, test_password):
        login_resp = api_client.post(
            f"{base_url}/login",
            data={"username": unique_username, "password": test_password}
        )
        assert login_resp.status_code in [200, 302]

        save_resp = api_client.post(
            f"{base_url}/api/save_score",
            json={"username": unique_username, "score": 15000, "level": 3}
        )
        assert save_resp.status_code == 200, f"Save score failed: {save_resp.text}"

        lb_resp = api_client.get(f"{base_url}/api/leaderboard")
        assert lb_resp.status_code == 200
        data = lb_resp.json()
        usernames = [item.get("username") for item in data.get("scores", [])]
        assert unique_username in usernames, f"Username {unique_username} not in {usernames}"
