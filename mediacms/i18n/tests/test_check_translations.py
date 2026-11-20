#!/usr/bin/env python3
"""Offline tests for check_translations.py."""

import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import check_translations  # noqa: E402


EN = (
    "translation_strings = {\n"
    "    'About': '',\n"
    "    'Home': '',\n"
    "    'Save': '',\n"
    "}\n"
    "replacement_strings = {\n"
    "    'x': '',\n"
    "}\n"
)


class Base(unittest.TestCase):
    def write(self, content, name="lang.py"):
        directory = tempfile.mkdtemp()
        path = os.path.join(directory, name)
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(content)
        self.addCleanup(os.rmdir, directory)
        self.addCleanup(os.unlink, path)
        return path


class TestExtraction(Base):
    def test_extracts_both_dicts(self):
        dicts = check_translations.extract_dicts(EN)
        self.assertEqual(sorted(dicts), ["replacement_strings", "translation_strings"])

    def test_keys_and_values(self):
        dicts = check_translations.extract_dicts(EN)
        self.assertEqual(sorted(dicts["translation_strings"]), ["About", "Home", "Save"])
        self.assertEqual(dicts["translation_strings"]["About"], "")

    def test_translated_values_kept(self):
        source = "translation_strings = {'About': 'Über'}\n"
        dicts = check_translations.extract_dicts(source)
        self.assertEqual(dicts["translation_strings"]["About"], "Über")

    def test_non_constant_keys_skipped(self):
        source = "translation_strings = {KEY: 'v'}\n"
        dicts = check_translations.extract_dicts(source)
        self.assertEqual(dicts["translation_strings"], {})

    def test_other_assignments_ignored(self):
        source = "other = {'a': 'b'}\ntranslation_strings = {'A': 'a'}\n"
        dicts = check_translations.extract_dicts(source)
        self.assertEqual(sorted(dicts), ["translation_strings"])

    def test_syntax_error(self):
        dicts, err = check_translations.load_file(self.write("x = {\n"))
        self.assertIsNone(dicts)
        self.assertIn("syntax error", err)

    def test_missing_file(self):
        dicts, err = check_translations.load_file("/nonexistent.py")
        self.assertIsNone(dicts)
        self.assertIn("cannot read", err)


class TestCompare(Base):
    def master(self):
        return check_translations.extract_dicts(EN)

    def test_identical_passes(self):
        result = check_translations.compare(self.master(), self.master())
        self.assertEqual(result["missing"], [])
        self.assertEqual(result["stale"], [])
        self.assertEqual(result["untranslated"], 4)
        self.assertEqual(result["total"], 4)

    def test_missing_key_detected(self):
        target = check_translations.extract_dicts(
            "translation_strings = {'About': 'x', 'Home': 'y'}\n"
            "replacement_strings = {'x': 'z'}\n")
        result = check_translations.compare(self.master(), target)
        self.assertEqual(result["missing"], [("translation_strings", "Save")])

    def test_stale_key_detected(self):
        target = check_translations.extract_dicts(
            "translation_strings = {'About': '', 'Home': '', 'Save': '', 'Old': ''}\n"
            "replacement_strings = {'x': ''}\n")
        result = check_translations.compare(self.master(), target)
        self.assertEqual(result["stale"], [("translation_strings", "Old")])

    def test_untranslated_count(self):
        target = check_translations.extract_dicts(
            "translation_strings = {'About': 'Über', 'Home': '', 'Save': ''}\n"
            "replacement_strings = {'x': ''}\n")
        result = check_translations.compare(self.master(), target)
        self.assertEqual(result["untranslated"], 3)

    def test_missing_dict_counted(self):
        target = check_translations.extract_dicts("translation_strings = {'About': ''}\n")
        result = check_translations.compare(self.master(), target)
        self.assertIn(("replacement_strings", "x"), result["missing"])


class TestPair(Base):
    def test_pair_ok(self):
        master = self.write(EN, "en.py")
        target = self.write(EN, "de.py")
        language, result, errors = check_translations.check_pair(master, target)
        self.assertEqual(language, "de")
        self.assertEqual(errors, [])

    def test_pair_missing_errors(self):
        master = self.write(EN, "en.py")
        target = self.write("translation_strings = {'About': ''}\n", "de.py")
        _, _, errors = check_translations.check_pair(master, target)
        self.assertTrue(any("missing" in e for e in errors))

    def test_pair_stale_errors(self):
        master = self.write(EN, "en.py")
        target = self.write(
            "translation_strings = {'About': '', 'Home': '', 'Save': '', 'Zzz': ''}\n"
            "replacement_strings = {'x': ''}\n", "de.py")
        _, _, errors = check_translations.check_pair(master, target)
        self.assertTrue(any("stale" in e for e in errors))


class TestDir(Base):
    def make_dir(self, files):
        directory = tempfile.mkdtemp()
        for name, content in files.items():
            with open(os.path.join(directory, name), "w", encoding="utf-8") as fh:
                fh.write(content)
        self.addCleanup(self.cleanup_dir, directory)
        return directory

    def cleanup_dir(self, directory):
        for name in os.listdir(directory):
            os.unlink(os.path.join(directory, name))
        os.rmdir(directory)

    def test_all_good(self):
        directory = self.make_dir({
            "en.py": EN,
            "__init__.py": "",
            "de.py": EN,
            "fr.py": EN,
        })
        rc, _ = check_translations.check_dir(directory)
        self.assertEqual(rc, 0)

    def test_one_bad_language_fails(self):
        directory = self.make_dir({
            "en.py": EN,
            "de.py": EN,
            "fr.py": "translation_strings = {'About': ''}\n",
        })
        rc, _ = check_translations.check_dir(directory)
        self.assertEqual(rc, 1)

    def test_init_and_en_skipped(self):
        directory = self.make_dir({
            "en.py": EN,
            "__init__.py": "translation_strings = {'junk': ''}\n",
        })
        rc, _ = check_translations.check_dir(directory)
        self.assertEqual(rc, 0)  # only __init__.py present -> nothing checked

    def test_no_en_fails(self):
        directory = self.make_dir({"de.py": EN})
        rc, message = check_translations.check_dir(directory)
        self.assertEqual(rc, 2)
        self.assertIn("no en.py", message)


class TestMain(Base):
    def test_pair_mode_zero_on_ok(self):
        master = self.write(EN, "en.py")
        target = self.write(EN, "de.py")
        self.assertEqual(check_translations.main([master, target]), 0)

    def test_pair_mode_one_on_missing(self):
        master = self.write(EN, "en.py")
        target = self.write("translation_strings = {'About': ''}\n", "de.py")
        self.assertEqual(check_translations.main([master, target]), 1)

    def test_json_pair_output(self):
        import io
        import contextlib
        master = self.write(EN, "en.py")
        target = self.write(EN, "de.py")
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = check_translations.main([master, target, "--json"])
        data = json.loads(buf.getvalue())
        self.assertEqual(rc, 0)
        self.assertEqual(data["language"], "de")
        self.assertEqual(data["missing"], 0)

    def test_missing_args_errors(self):
        with self.assertRaises(SystemExit):
            check_translations.main([])


if __name__ == "__main__":
    unittest.main()
