import unittest
import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import load_history, save_history, HISTORY_FILE

class TestHistory(unittest.TestCase):
    def setUp(self):
        self.test_file = "data/test_history.json"
        self.original_file = HISTORY_FILE

    def test_save_and_load_history(self):
        test_data = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"}
        ]
        save_history(test_data)

        loaded = load_history()
        self.assertEqual(loaded, test_data)

    def test_load_nonexistent_file(self):
        os.rename(HISTORY_FILE, HISTORY_FILE + ".bak")
        try:
            result = load_history()
            self.assertEqual(result, [])
        finally:
            os.rename(HISTORY_FILE + ".bak", HISTORY_FILE)

    def test_save_empty_history(self):
        save_history([])
        loaded = load_history()
        self.assertEqual(loaded, [])

if __name__ == "__main__":
    unittest.main()