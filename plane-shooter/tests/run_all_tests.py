import pytest
import sys

def run_tests():
    print("=" * 60)
    print("Plane Shooter 自动化测试")
    print("=" * 60)

    print()
    print("运行 API 测试...")
    print("=" * 60)
    result_api = pytest.main(["api/", "-v", "--tb=short"])

    print()
    print("=" * 60)
    print("运行 UI 测试...")
    print("=" * 60)
    result_ui = pytest.main(["ui/", "-v", "--tb=short", "-s"])

    print()
    print("=" * 60)
    print("测试完成!")
    print("=" * 60)

    if result_api == 0 and result_ui == 0:
        print("✓ 所有测试通过!")
        return 0
    else:
        print("✗ 部分测试失败")
        return 1

if __name__ == "__main__":
    sys.exit(run_tests())
