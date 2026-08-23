"""
Solar 项目自动化测试入口

用法：
    python tests/run_all_tests.py

测试分为两部分：
  1. API 测试 - 测试后端路由
  2. UI 测试 - 测试页面加载和交互（需要 Playwright）
"""

import pytest
import sys
import os

TESTS_DIR = os.path.dirname(os.path.abspath(__file__))


def run_tests():
    print("=" * 60)
    print("Solar - 太阳系 3D 互动探索平台 - 自动化测试")
    print("=" * 60)

    api_dir = os.path.join(TESTS_DIR, "api")
    ui_dir = os.path.join(TESTS_DIR, "ui")

    print("\n运行 API 测试...")
    print("=" * 60)
    result_api = pytest.main([api_dir, "-v", "--tb=short"])

    if result_api != pytest.ExitCode.OK:
        print("\n✗ API 测试失败，跳过 UI 测试")
        print("  提示：请先启动 Flask 服务器")
        print("    cd solar && python app.py")
        return 1

    print("\n运行 UI 测试...")
    print("=" * 60)
    result_ui = pytest.main([ui_dir, "-v", "--tb=short", "-s"])

    print("\n" + "=" * 60)
    print("测试完成!")
    print("=" * 60)

    if result_api == pytest.ExitCode.OK and result_ui == pytest.ExitCode.OK:
        print("✓ 所有测试通过!")
        return 0
    elif result_ui != pytest.ExitCode.OK:
        print("✗ UI 测试部分失败（可能需要安装 Playwright）")
        print("  安装方法：")
        print("    pip install playwright")
        print("    playwright install chromium")
        return 1
    else:
        print("✗ 部分测试失败")
        return 1


if __name__ == "__main__":
    sys.exit(run_tests())
