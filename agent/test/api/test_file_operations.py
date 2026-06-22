import unittest
import os
import sys
import shutil

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import execute_read_file, execute_write_file

class TestFileOperations(unittest.TestCase):
    def setUp(self):
        self.files_dir = "files"
        os.makedirs(self.files_dir, exist_ok=True)

    def tearDown(self):
        if os.path.exists(self.files_dir):
            for root, dirs, files in os.walk(self.files_dir, topdown=False):
                for name in files:
                    os.remove(os.path.join(root, name))
                for name in dirs:
                    os.rmdir(os.path.join(root, name))

    def test_write_file_success(self):
        file_path = os.path.join(self.files_dir, "test.txt")
        content = "Hello, World!"

        result = execute_write_file({
            "file_path": file_path,
            "content": content
        })

        self.assertEqual(result["status"], "success")
        self.assertTrue(os.path.exists(file_path))

        with open(file_path, "r", encoding="utf-8") as f:
            self.assertEqual(f.read(), content)

    def test_write_file_without_path(self):
        result = execute_write_file({
            "content": "Some content"
        })

        self.assertEqual(result["status"], "error")
        self.assertIn("file_path is required", result["message"])

    def test_write_file_creates_parent_dirs(self):
        file_path = os.path.join(self.files_dir, "subdir1", "subdir2", "test.txt")
        content = "Nested file content"

        result = execute_write_file({
            "file_path": file_path,
            "content": content
        })

        self.assertEqual(result["status"], "success")
        self.assertTrue(os.path.exists(file_path))

        with open(file_path, "r", encoding="utf-8") as f:
            self.assertEqual(f.read(), content)

    def test_read_file_success(self):
        file_path = os.path.join(self.files_dir, "read_test.txt")
        content = "Content to read"

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

        result = execute_read_file({
            "file_path": file_path
        })

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["content"], content)
        self.assertEqual(result["file_path"], file_path)

    def test_read_file_not_found(self):
        file_path = os.path.join(self.files_dir, "nonexistent.txt")

        result = execute_read_file({
            "file_path": file_path
        })

        self.assertEqual(result["status"], "error")
        self.assertIn("File not found", result["message"])

    def test_read_file_without_path(self):
        result = execute_read_file({})

        self.assertEqual(result["status"], "error")
        self.assertIn("file_path is required", result["message"])

    def test_read_write_roundtrip(self):
        file_path = os.path.join(self.files_dir, "roundtrip.txt")
        content = "测试中文内容\n第二行\n第三行"

        write_result = execute_write_file({
            "file_path": file_path,
            "content": content
        })
        self.assertEqual(write_result["status"], "success")

        read_result = execute_read_file({
            "file_path": file_path
        })
        self.assertEqual(read_result["status"], "success")
        self.assertEqual(read_result["content"], content)

if __name__ == "__main__":
    unittest.main()
