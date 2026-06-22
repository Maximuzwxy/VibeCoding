import pytest
import io

pytestmark = pytest.mark.api

class TestPostsAPI:

    def test_create_post_success(self, api_client, base_url, registered_user):
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": registered_user["username"], "password": registered_user["password"]}
        )
        assert response.status_code == 200

        response = api_client.post(
            f"{base_url}/api/posts",
            data={"content": "这是一条测试帖子"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "发布成功"
        assert "post" in data
        assert data["post"]["content"] == "这是一条测试帖子"
        assert data["post"]["username"] == registered_user["username"]
        assert data["post"]["likes"] == []
        assert data["post"]["comments"] == []

    def test_create_post_with_image(self, api_client, base_url, registered_user):
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": registered_user["username"], "password": registered_user["password"]}
        )
        assert response.status_code == 200

        img_data = io.BytesIO(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82')
        img_data.name = 'test.png'

        response = api_client.post(
            f"{base_url}/api/posts",
            files={"images": img_data},
            data={"content": "这是带图片的帖子"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["post"]["images"]) == 1

    def test_create_post_empty_content(self, api_client, base_url, registered_user):
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": registered_user["username"], "password": registered_user["password"]}
        )
        assert response.status_code == 200

        response = api_client.post(
            f"{base_url}/api/posts",
            data={"content": ""}
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data

    def test_create_post_content_too_long(self, api_client, base_url, registered_user):
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": registered_user["username"], "password": registered_user["password"]}
        )
        assert response.status_code == 200

        response = api_client.post(
            f"{base_url}/api/posts",
            data={"content": "a" * 501}
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "500" in data["error"]

    def test_create_post_unauthorized(self, api_client, base_url):
        response = api_client.post(
            f"{base_url}/api/posts",
            data={"content": "未登录发帖"}
        )
        assert response.status_code == 401

    def test_get_posts(self, api_client, base_url, registered_user):
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": registered_user["username"], "password": registered_user["password"]}
        )
        assert response.status_code == 200

        api_client.post(f"{base_url}/api/posts", data={"content": "帖子1"})
        api_client.post(f"{base_url}/api/posts", data={"content": "帖子2"})

        response = api_client.get(f"{base_url}/api/posts")
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data

    def test_get_posts_unauthorized(self, api_client, base_url):
        response = api_client.get(f"{base_url}/api/posts")
        assert response.status_code == 401

    def test_get_my_posts(self, api_client, base_url, registered_user):
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": registered_user["username"], "password": registered_user["password"]}
        )
        assert response.status_code == 200

        api_client.post(f"{base_url}/api/posts", data={"content": "我的帖子"})

        response = api_client.get(f"{base_url}/api/posts/mine")
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
        for post in data["posts"]:
            assert post["username"] == registered_user["username"]

    def test_delete_own_post(self, api_client, base_url, registered_user):
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": registered_user["username"], "password": registered_user["password"]}
        )
        assert response.status_code == 200

        create_resp = api_client.post(f"{base_url}/api/posts", data={"content": "要删除的帖子"})
        post_id = create_resp.json()["post"]["id"]

        response = api_client.delete(f"{base_url}/api/posts/{post_id}")
        assert response.status_code == 200
        assert response.json()["message"] == "删除成功"

    def test_delete_others_post_forbidden(self, api_client, base_url, two_registered_users):
        user1 = two_registered_users["user1"]
        user2 = two_registered_users["user2"]

        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": user1["username"], "password": user1["password"]}
        )
        assert response.status_code == 200

        create_resp = api_client.post(f"{base_url}/api/posts", data={"content": "user1的帖子"})
        post_id = create_resp.json()["post"]["id"]

        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": user2["username"], "password": user2["password"]}
        )
        assert response.status_code == 200

        response = api_client.delete(f"{base_url}/api/posts/{post_id}")
        assert response.status_code == 403

    def test_delete_post_not_found(self, api_client, base_url, registered_user):
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": registered_user["username"], "password": registered_user["password"]}
        )
        assert response.status_code == 200

        response = api_client.delete(f"{base_url}/api/posts/nonexistent-id")
        assert response.status_code == 404

    def test_like_post(self, api_client, base_url, two_registered_users):
        user1 = two_registered_users["user1"]
        user2 = two_registered_users["user2"]

        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": user1["username"], "password": user1["password"]}
        )
        assert response.status_code == 200

        create_resp = api_client.post(f"{base_url}/api/posts", data={"content": "要点赞的帖子"})
        post_id = create_resp.json()["post"]["id"]

        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": user2["username"], "password": user2["password"]}
        )
        assert response.status_code == 200

        response = api_client.post(f"{base_url}/api/posts/{post_id}/like", json={})
        assert response.status_code == 200
        assert user2["username"] in response.json()["likes"]

    def test_like_post_already_liked(self, api_client, base_url, registered_user):
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": registered_user["username"], "password": registered_user["password"]}
        )
        assert response.status_code == 200

        create_resp = api_client.post(f"{base_url}/api/posts", data={"content": "已点赞的帖子"})
        post_id = create_resp.json()["post"]["id"]

        api_client.post(f"{base_url}/api/posts/{post_id}/like", json={})

        response = api_client.post(f"{base_url}/api/posts/{post_id}/like", json={})
        assert response.status_code == 400
        assert "error" in response.json()

    def test_unlike_post(self, api_client, base_url, registered_user):
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": registered_user["username"], "password": registered_user["password"]}
        )
        assert response.status_code == 200

        create_resp = api_client.post(f"{base_url}/api/posts", data={"content": "要取消点赞的帖子"})
        post_id = create_resp.json()["post"]["id"]

        api_client.post(f"{base_url}/api/posts/{post_id}/like", json={})

        response = api_client.delete(f"{base_url}/api/posts/{post_id}/like")
        assert response.status_code == 200
        assert registered_user["username"] not in response.json()["likes"]

    def test_unlike_post_not_liked(self, api_client, base_url, registered_user):
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": registered_user["username"], "password": registered_user["password"]}
        )
        assert response.status_code == 200

        create_resp = api_client.post(f"{base_url}/api/posts", data={"content": "未点赞的帖子"})
        post_id = create_resp.json()["post"]["id"]

        response = api_client.delete(f"{base_url}/api/posts/{post_id}/like")
        assert response.status_code == 400
        assert "error" in response.json()

    def test_add_comment(self, api_client, base_url, two_registered_users):
        user1 = two_registered_users["user1"]
        user2 = two_registered_users["user2"]

        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": user1["username"], "password": user1["password"]}
        )
        assert response.status_code == 200

        create_resp = api_client.post(f"{base_url}/api/posts", data={"content": "要评论的帖子"})
        post_id = create_resp.json()["post"]["id"]

        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": user2["username"], "password": user2["password"]}
        )
        assert response.status_code == 200

        response = api_client.post(
            f"{base_url}/api/posts/{post_id}/comments",
            json={"content": "这是一条评论"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "评论成功"
        assert data["comment"]["content"] == "这是一条评论"
        assert data["comment"]["username"] == user2["username"]

    def test_add_comment_empty_content(self, api_client, base_url, registered_user):
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": registered_user["username"], "password": registered_user["password"]}
        )
        assert response.status_code == 200

        create_resp = api_client.post(f"{base_url}/api/posts", data={"content": "帖子"})
        post_id = create_resp.json()["post"]["id"]

        response = api_client.post(
            f"{base_url}/api/posts/{post_id}/comments",
            json={"content": ""}
        )
        assert response.status_code == 400
        assert "error" in response.json()

    def test_add_comment_too_long(self, api_client, base_url, registered_user):
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": registered_user["username"], "password": registered_user["password"]}
        )
        assert response.status_code == 200

        create_resp = api_client.post(f"{base_url}/api/posts", data={"content": "帖子"})
        post_id = create_resp.json()["post"]["id"]

        response = api_client.post(
            f"{base_url}/api/posts/{post_id}/comments",
            json={"content": "a" * 201}
        )
        assert response.status_code == 400
        assert "error" in response.json()

    def test_delete_own_comment(self, api_client, base_url, registered_user):
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": registered_user["username"], "password": registered_user["password"]}
        )
        assert response.status_code == 200

        create_resp = api_client.post(f"{base_url}/api/posts", data={"content": "帖子"})
        post_id = create_resp.json()["post"]["id"]

        comment_resp = api_client.post(
            f"{base_url}/api/posts/{post_id}/comments",
            json={"content": "要删除的评论"}
        )
        comment_id = comment_resp.json()["comment"]["id"]

        response = api_client.delete(f"{base_url}/api/posts/{post_id}/comments/{comment_id}")
        assert response.status_code == 200
        assert response.json()["message"] == "删除成功"

    def test_delete_others_comment_forbidden(self, api_client, base_url, two_registered_users):
        user1 = two_registered_users["user1"]
        user2 = two_registered_users["user2"]

        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": user1["username"], "password": user1["password"]}
        )
        assert response.status_code == 200

        create_resp = api_client.post(f"{base_url}/api/posts", data={"content": "帖子"})
        post_id = create_resp.json()["post"]["id"]

        comment_resp = api_client.post(
            f"{base_url}/api/posts/{post_id}/comments",
            json={"content": "user1的评论"}
        )
        comment_id = comment_resp.json()["comment"]["id"]

        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": user2["username"], "password": user2["password"]}
        )
        assert response.status_code == 200

        response = api_client.delete(f"{base_url}/api/posts/{post_id}/comments/{comment_id}")
        assert response.status_code == 403

    def test_add_comment_returns_avatar(self, api_client, base_url, registered_user):
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": registered_user["username"], "password": registered_user["password"]}
        )
        assert response.status_code == 200

        create_resp = api_client.post(f"{base_url}/api/posts", data={"content": "帖子"})
        post_id = create_resp.json()["post"]["id"]

        response = api_client.post(
            f"{base_url}/api/posts/{post_id}/comments",
            json={"content": "测试评论"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "评论成功"
        assert "comment" in data
        assert "avatar" in data["comment"]
        assert data["comment"]["avatar"] != ""
        assert data["comment"]["username"] == registered_user["username"]

    def test_get_posts_includes_comment_avatars(self, api_client, base_url, registered_user):
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": registered_user["username"], "password": registered_user["password"]}
        )
        assert response.status_code == 200

        create_resp = api_client.post(f"{base_url}/api/posts", data={"content": "帖子"})
        post_id = create_resp.json()["post"]["id"]

        api_client.post(
            f"{base_url}/api/posts/{post_id}/comments",
            json={"content": "评论1"}
        )

        response = api_client.get(f"{base_url}/api/posts")
        assert response.status_code == 200
        posts = response.json()["posts"]
        target_post = next((p for p in posts if p["id"] == post_id), None)
        assert target_post is not None
        assert len(target_post["comments"]) > 0
        for comment in target_post["comments"]:
            assert "avatar" in comment
            assert comment["avatar"] != ""


class TestPostImages:

    def test_api_returns_correct_image_paths(self, api_client, base_url):
        login_resp = api_client.post(
            f"{base_url}/api/auth/login",
            json={"username": "bobo", "password": "123456"}
        )
        assert login_resp.status_code == 200, "登录失败"

        posts_resp = api_client.get(f"{base_url}/api/posts")
        assert posts_resp.status_code == 200, "获取帖子失败"

        posts = posts_resp.json()["posts"]
        posts_with_images = [p for p in posts if p.get("images")]

        print(f"\n找到 {len(posts_with_images)} 个带图片的帖子")

        if posts_with_images:
            latest_with_images = posts_with_images[0]
            print(f"最新帖子 ID: {latest_with_images['id']}")
            print(f"最新帖子内容: {latest_with_images['content']}")
            print(f"图片列表: {latest_with_images['images']}")

            for img_url in latest_with_images['images']:
                full_url = f"{base_url}{img_url}"
                print(f"\n检查图片: {full_url}")

                assert img_url.startswith('/'), f"图片路径应该以 / 开头: {img_url}"
                assert 'uploads' in img_url, f"图片路径应该包含 uploads: {img_url}"

                img_resp = api_client.get(full_url)
                assert img_resp.status_code == 200, f"图片无法访问: {full_url}, 状态码: {img_resp.status_code}"
                assert len(img_resp.content) > 0, f"图片为空: {full_url}"

                print(f"✓ 图片可以访问，大小: {len(img_resp.content)} bytes")

    def test_image_file_exists(self):
        import os
        import json

        posts_file = "c:/CuLiu/VibeCoding/workspace2/social2/data/posts.json"
        with open(posts_file, 'r', encoding='utf-8') as f:
            posts = json.load(f)

        posts_with_images = [p for p in posts if p.get("images")]

        if posts_with_images:
            latest = posts_with_images[0]
            print(f"\n最新帖子: {latest['content']}")
            print(f"图片列表: {latest['images']}")

            for img_path in latest['images']:
                relative_path = img_path.lstrip('/')
                full_path = os.path.join("c:/CuLiu/VibeCoding/workspace2/social2", relative_path)

                print(f"\n检查文件: {full_path}")
                assert os.path.exists(full_path), f"文件不存在: {full_path}"

                file_size = os.path.getsize(full_path)
                print(f"✓ 文件存在，大小: {file_size} bytes")