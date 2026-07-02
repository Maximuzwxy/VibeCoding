import unittest
import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import load_system_prompt, save_system_prompt, clear_system_prompt, SYSTEM_PROMPT_FILE

class TestSystemPrompt(unittest.TestCase):
    def setUp(self):
        self.test_file = SYSTEM_PROMPT_FILE

    def test_save_and_load_system_prompt(self):
        test_prompt = "You are a strict mother"
        save_system_prompt(test_prompt)

        loaded = load_system_prompt()
        self.assertEqual(loaded, test_prompt)

    def test_clear_system_prompt(self):
        save_system_prompt("You are a strict mother")
        
        clear_system_prompt()
        
        loaded = load_system_prompt()
        self.assertEqual(loaded, "")

    def test_load_nonexistent_file(self):
        # Remove the file temporarily
        if os.path.exists(self.test_file):
            os.rename(self.test_file, self.test_file + ".bak")
        
        try:
            result = load_system_prompt()
            self.assertEqual(result, "")
        finally:
            # Restore the file
            if os.path.exists(self.test_file + ".bak"):
                os.rename(self.test_file + ".bak", self.test_file)

    def test_save_empty_system_prompt(self):
        save_system_prompt("")
        loaded = load_system_prompt()
        self.assertEqual(loaded, "")

if __name__ == "__main__":
    unittest.main()