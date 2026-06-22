import pytest
import requests

pytestmark = pytest.mark.api

class TestFriendsAPI:

    def test_get_friends_empty(self, api_client, base_url, registered_user):
        api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "username": registered_user["username"],
                "password": registered_user["password"]
            }
        )
        response = api_client.get(f"{base_url}/api/friends")
        assert response.status_code == 200
        data = response.json()
        assert "friends" in data
        assert isinstance(data["friends"], list)

    def test_send_friend_request_success(self, api_client, base_url, two_logged_in_clients):
        client1, client2, users = two_logged_in_clients
        response = client1.post(
            f"{base_url}/api/friends/requests",
            json={"to": users["user2"]["username"]}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "好友请求已发送"

    def test_send_friend_request_to_self(self, api_client, base_url, registered_user):
        api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "username": registered_user["username"],
                "password": registered_user["password"]
            }
        )
        response = api_client.post(
            f"{base_url}/api/friends/requests",
            json={"to": registered_user["username"]}
        )
        assert response.status_code == 400
        data = response.json()
        assert "不能添加自己为好友" in data["error"]

    def test_send_friend_request_to_nonexistent_user(self, api_client, base_url, registered_user):
        api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "username": registered_user["username"],
                "password": registered_user["password"]
            }
        )
        response = api_client.post(
            f"{base_url}/api/friends/requests",
            json={"to": "nonexistent_user_xyz"}
        )
        assert response.status_code == 404

    def test_send_duplicate_friend_request(self, api_client, base_url, two_logged_in_clients):
        client1, client2, users = two_logged_in_clients
        client1.post(
            f"{base_url}/api/friends/requests",
            json={"to": users["user2"]["username"]}
        )
        response = client1.post(
            f"{base_url}/api/friends/requests",
            json={"to": users["user2"]["username"]}
        )
        assert response.status_code == 400
        data = response.json()
        assert "好友请求已存在" in data["error"]

    def test_get_friend_requests(self, api_client, base_url, two_logged_in_clients):
        client1, client2, users = two_logged_in_clients
        client1.post(
            f"{base_url}/api/friends/requests",
            json={"to": users["user2"]["username"]}
        )
        response = client2.get(f"{base_url}/api/friends/requests")
        assert response.status_code == 200
        data = response.json()
        assert "requests" in data
        assert len(data["requests"]) == 1
        assert data["requests"][0]["from"]["username"] == users["user1"]["username"]

    def test_accept_friend_request(self, api_client, base_url, two_logged_in_clients):
        client1, client2, users = two_logged_in_clients
        client1.post(
            f"{base_url}/api/friends/requests",
            json={"to": users["user2"]["username"]}
        )
        requests_response = client2.get(f"{base_url}/api/friends/requests")
        request_id = requests_response.json()["requests"][0]["id"]

        accept_response = client2.put(
            f"{base_url}/api/friends/requests/{request_id}",
            json={"action": "accept"}
        )
        assert accept_response.status_code == 200

        friends_response = client1.get(f"{base_url}/api/friends")
        friends = friends_response.json()["friends"]
        assert any(f["username"] == users["user2"]["username"] for f in friends)

    def test_reject_friend_request(self, api_client, base_url, two_logged_in_clients):
        client1, client2, users = two_logged_in_clients
        client1.post(
            f"{base_url}/api/friends/requests",
            json={"to": users["user2"]["username"]}
        )
        requests_response = client2.get(f"{base_url}/api/friends/requests")
        request_id = requests_response.json()["requests"][0]["id"]

        reject_response = client2.put(
            f"{base_url}/api/friends/requests/{request_id}",
            json={"action": "reject"}
        )
        assert reject_response.status_code == 200

        friends_response = client1.get(f"{base_url}/api/friends")
        friends = friends_response.json()["friends"]
        assert not any(f["username"] == users["user2"]["username"] for f in friends)

    def test_remove_friend(self, api_client, base_url, two_logged_in_clients):
        client1, client2, users = two_logged_in_clients
        client1.post(
            f"{base_url}/api/friends/requests",
            json={"to": users["user2"]["username"]}
        )
        requests_response = client2.get(f"{base_url}/api/friends/requests")
        request_id = requests_response.json()["requests"][0]["id"]
        client2.put(
            f"{base_url}/api/friends/requests/{request_id}",
            json={"action": "accept"}
        )

        remove_response = client1.delete(f"{base_url}/api/friends/{users['user2']['username']}")
        assert remove_response.status_code == 200

        friends_response = client1.get(f"{base_url}/api/friends")
        friends = friends_response.json()["friends"]
        assert not any(f["username"] == users["user2"]["username"] for f in friends)

    def test_remove_nonexistent_friendship(self, api_client, base_url, registered_user, unique_username_2):
        api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "username": registered_user["username"],
                "password": registered_user["password"]
            }
        )
        response = api_client.delete(f"{base_url}/api/friends/{unique_username_2}")
        assert response.status_code == 404
        data = response.json()
        assert "好友关系不存在" in data["error"]
