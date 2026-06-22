"""
Solar 项目测试固件

参考 social 项目的测试体系，提供：
- BASE_URL: 测试服务器地址
- api_client: requests Session
- 通用 fixture
"""

import pytest
import requests

BASE_URL = "http://localhost:5000"


@pytest.fixture(scope="session")
def base_url():
    """测试基础 URL"""
    return BASE_URL


@pytest.fixture(scope="function")
def api_client():
    """API 请求客户端"""
    return requests.Session()
