import pytest
import requests

pytestmark = pytest.mark.api

class TestMessagesAPI:

    def test_send_message_success(self, api_client, base_url, two_logged_in_clients):
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

        response = client1.post(
            f"{base_url}/api/messages/send",
            json={
                "to": users["user2"]["username"],
                "content": "你好，这是一条测试消息"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "msg" in data
        assert data["msg"]["content"] == "你好，这是一条测试消息"

    def test_send_message_to_non_friend(self, api_client, base_url, two_logged_in_clients):
        client1, client2, users = two_logged_in_clients
        response = client1.post(
            f"{base_url}/api/messages/send",
            json={
                "to": users["user2"]["username"],
                "content": "你好，这条消息不应该发送成功"
            }
        )
        assert response.status_code == 403
        data = response.json()
        assert "只能给好友发送消息" in data["error"]

    def test_send_message_missing_params(self, api_client, base_url, registered_user):
        api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "username": registered_user["username"],
                "password": registered_user["password"]
            }
        )
        response = api_client.post(
            f"{base_url}/api/messages/send",
            json={"to": "", "content": ""}
        )
        assert response.status_code == 400
        data = response.json()
        assert "参数不完整" in data["error"]

    def test_get_messages(self, api_client, base_url, two_logged_in_clients):
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

        client1.post(
            f"{base_url}/api/messages/send",
            json={
                "to": users["user2"]["username"],
                "content": "测试消息1"
            }
        )
        client2.post(
            f"{base_url}/api/messages/send",
            json={
                "to": users["user1"]["username"],
                "content": "测试消息2"
            }
        )

        response = client1.get(f"{base_url}/api/messages/{users['user2']['username']}")
        assert response.status_code == 200
        data = response.json()
        assert "messages" in data
        assert len(data["messages"]) == 2

    def test_get_conversations(self, api_client, base_url, two_logged_in_clients):
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

        client1.post(
            f"{base_url}/api/messages/send",
            json={
                "to": users["user2"]["username"],
                "content": "测试消息"
            }
        )

        response = client1.get(f"{base_url}/api/messages/conversations")
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
        assert len(data["conversations"]) == 1
        assert data["conversations"][0]["username"] == users["user2"]["username"]
        assert data["conversations"][0]["last_message"] == "测试消息"

    def test_get_conversations_empty(self, api_client, base_url, registered_user):
        api_client.post(
            f"{base_url}/api/auth/login",
            json={
                "username": registered_user["username"],
                "password": registered_user["password"]
            }
        )
        response = api_client.get(f"{base_url}/api/messages/conversations")
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
        assert len(data["conversations"]) == 0
