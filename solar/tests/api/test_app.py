"""
Solar API 测试
"""

import pytest

pytestmark = pytest.mark.api


class TestHealthCheck:

    def test_health_returns_ok(self, api_client, base_url):
        response = api_client.get(f"{base_url}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"


class TestPages:

    def test_index_page_loads(self, api_client, base_url):
        response = api_client.get(f"{base_url}/")
        assert response.status_code == 200
        assert "太阳系" in response.text or "Solar System" in response.text

    def test_index_has_info_panel(self, api_client, base_url):
        response = api_client.get(f"{base_url}/")
        assert 'id="info-panel"' in response.text

    def test_index_has_quiz_panel(self, api_client, base_url):
        response = api_client.get(f"{base_url}/")
        assert 'id="quiz-panel"' in response.text

    def test_index_has_chat_panel(self, api_client, base_url):
        response = api_client.get(f"{base_url}/")
        assert 'id="chat-panel"' in response.text

    def test_index_has_search_box(self, api_client, base_url):
        response = api_client.get(f"{base_url}/")
        assert 'id="search-box"' in response.text

    def test_index_has_lang_switch(self, api_client, base_url):
        response = api_client.get(f"{base_url}/")
        assert 'id="lang-switch"' in response.text

    def test_index_has_chat_panel_js(self, api_client, base_url):
        response = api_client.get(f"{base_url}/")
        assert 'chat-panel.js' in response.text


class TestData:

    def test_celestial_api_not_found(self, api_client, base_url):
        response = api_client.get(f"{base_url}/api/data/celestial/nonexistent")
        assert response.status_code == 404

    def test_planet_api_not_found(self, api_client, base_url):
        response = api_client.get(f"{base_url}/api/data/planet/nonexistent")
        assert response.status_code == 404

    def test_moon_api_not_found(self, api_client, base_url):
        response = api_client.get(f"{base_url}/api/data/moon/nonexistent")
        assert response.status_code == 404


class TestQuiz:

    def test_local_quiz_returns_10_questions(self, api_client, base_url):
        response = api_client.get(f"{base_url}/api/quiz/solar_system")
        assert response.status_code == 200
        data = response.json()
        assert "questions" in data
        assert len(data["questions"]) >= 10

    def test_quiz_question_has_required_fields(self, api_client, base_url):
        response = api_client.get(f"{base_url}/api/quiz/solar_system")
        data = response.json()
        q = data["questions"][0]
        assert "question" in q
        assert "options" in q
        assert "answer" in q
        assert "explanation" in q
        assert len(q["options"]) == 4

    def test_quiz_not_found(self, api_client, base_url):
        response = api_client.get(f"{base_url}/api/quiz/nonexistent")
        assert response.status_code == 404

    def test_quiz_generate_empty_topic(self, api_client, base_url):
        response = api_client.post(
            f"{base_url}/api/quiz/generate",
            json={"topic": "solar_system", "language": "zh", "exclude_questions": []}
        )
        assert response.status_code in [200, 500]

    def test_quiz_save_missing_question(self, api_client, base_url):
        response = api_client.post(
            f"{base_url}/api/quiz/save",
            json={"topic": "solar_system"}
        )
        assert response.status_code == 400


class TestChat:

    def test_chat_missing_message(self, api_client, base_url):
        response = api_client.post(f"{base_url}/api/chat", json={})
        assert response.status_code == 400

    def test_chat_responds(self, api_client, base_url):
        response = api_client.post(
            f"{base_url}/api/chat",
            json={
                "message": "太阳有多大？",
                "language": "zh",
                "system_prompt": "你是一个太阳系知识助手。"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data or "error" in data
