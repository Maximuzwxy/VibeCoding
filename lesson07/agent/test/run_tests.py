import unittest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def run_api_tests():
    from test.api import test_history
    from test.api import test_system_prompt
    from test.api import test_file_operations
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    suite.addTests(loader.loadTestsFromModule(test_history))
    suite.addTests(loader.loadTestsFromModule(test_system_prompt))
    suite.addTests(loader.loadTestsFromModule(test_file_operations))
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()

def run_web_tests():
    from test.web import test_ui
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromModule(test_ui)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()

if __name__ == "__main__":
    print("=" * 50)
    print("Running API Tests...")
    print("=" * 50)
    api_success = run_api_tests()

    print("\n" + "=" * 50)
    print("Running Web Tests...")
    print("=" * 50)
    web_success = run_web_tests()

    print("\n" + "=" * 50)
    print("Test Summary")
    print("=" * 50)
    print(f"API Tests: {'PASSED' if api_success else 'FAILED'}")
    print(f"Web Tests: {'PASSED' if web_success else 'FAILED'}")

    sys.exit(0 if (api_success and web_success) else 1)