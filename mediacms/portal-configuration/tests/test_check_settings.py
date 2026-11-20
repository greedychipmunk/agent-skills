#!/usr/bin/env python3
"""Offline tests for check_settings.py."""

import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import check_settings  # noqa: E402


class Base(unittest.TestCase):
    def write(self, content):
        fd, path = tempfile.mkstemp(suffix=".py")
        with os.fdopen(fd, "w") as fh:
            fh.write(content)
        self.addCleanup(os.unlink, path)
        return path


class TestExtraction(Base):
    def test_simple_assignment(self):
        path = self.write("PORTAL_NAME = 'Test'\n")
        issues, summary = check_settings.check_file(path)
        self.assertEqual(issues, [])
        self.assertEqual(summary["checked"], 1)

    def test_multiple_assignments(self):
        path = self.write("PORTAL_NAME = 'T'\nLOGIN_ALLOWED = True\n")
        _, summary = check_settings.check_file(path)
        self.assertEqual(summary["checked"], 2)

    def test_augmented_assignment_ignored(self):
        path = self.write("EXTRA_CSS_PATHS = ['/a.css']\nEXTRA_CSS_PATHS += ['/b.css']\n")
        _, summary = check_settings.check_file(path)
        self.assertEqual(summary["checked"], 1)

    def test_annotated_assignment_ignored(self):
        path = self.write("SOMETHING: str = 'x'\n")
        issues, summary = check_settings.check_file(path)
        self.assertEqual(summary["checked"], 0)

    def test_tuple_unpacking_ignored(self):
        path = self.write("a, b = 1, 2\n")
        _, summary = check_settings.check_file(path)
        self.assertEqual(summary["checked"], 0)

    def test_imports_ignored(self):
        path = self.write("import os\nfrom django.conf import settings\n")
        issues, summary = check_settings.check_file(path)
        self.assertEqual(issues, [])

    def test_syntax_error_reported(self):
        path = self.write("PORTAL_NAME = 'unclosed\n")
        issues, _ = check_settings.check_file(path)
        self.assertTrue(any("syntax error" in msg for _, _, msg in issues))

    def test_missing_file_reported(self):
        issues, _ = check_settings.check_file("/nonexistent/settings.py")
        self.assertTrue(any("cannot read" in msg for _, _, msg in issues))


class TestChoices(Base):
    def test_valid_workflow(self):
        path = self.write("PORTAL_WORKFLOW = 'private'\n")
        issues, _ = check_settings.check_file(path)
        self.assertEqual(issues, [])

    def test_invalid_workflow(self):
        path = self.write("PORTAL_WORKFLOW = 'banana'\n")
        issues, _ = check_settings.check_file(path)
        self.assertTrue(any(i[1] == "PORTAL_WORKFLOW" and i[0] == "error" for i in issues))

    def test_invalid_can_add_media(self):
        path = self.write("CAN_ADD_MEDIA = 'everyone'\n")
        issues, _ = check_settings.check_file(path)
        self.assertTrue(any(i[1] == "CAN_ADD_MEDIA" and i[0] == "error" for i in issues))

    def test_valid_email_verification_values(self):
        for value in ("optional", "mandatory", "none"):
            path = self.write("ACCOUNT_EMAIL_VERIFICATION = '%s'\n" % value)
            issues, _ = check_settings.check_file(path)
            self.assertEqual(issues, [])

    def test_invalid_members_page_choice(self):
        path = self.write("CAN_SEE_MEMBERS_PAGE = 'nobody'\n")
        issues, _ = check_settings.check_file(path)
        self.assertTrue(any(i[1] == "CAN_SEE_MEMBERS_PAGE" for i in issues))

    def test_non_literal_choice_warns_not_errors(self):
        path = self.write("PORTAL_WORKFLOW = get_workflow()\n")
        issues, _ = check_settings.check_file(path)
        self.assertTrue(any(i[0] == "warning" and i[1] == "PORTAL_WORKFLOW" for i in issues))
        self.assertFalse(any(i[0] == "error" for i in issues))


class TestTypes(Base):
    def test_bool_ok(self):
        path = self.write("USE_RBAC = True\n")
        issues, _ = check_settings.check_file(path)
        self.assertEqual(issues, [])

    def test_int_where_bool_expected(self):
        path = self.write("USE_RBAC = 1\n")
        issues, _ = check_settings.check_file(path)
        self.assertTrue(any("expected bool" in msg for _, _, msg in issues))

    def test_str_where_int_expected(self):
        path = self.write("UPLOAD_MAX_SIZE = 'big'\n")
        issues, _ = check_settings.check_file(path)
        self.assertTrue(any("expected int" in msg for _, _, msg in issues))

    def test_list_ok(self):
        path = self.write("ALLOWED_MEDIA_UPLOAD_TYPES = ['video', 'audio']\n")
        issues, _ = check_settings.check_file(path)
        self.assertEqual(issues, [])

    def test_str_where_list_expected(self):
        path = self.write("ALLOWED_HOSTS = 'example.com'\n")
        issues, _ = check_settings.check_file(path)
        self.assertTrue(any("expected list" in msg for _, _, msg in issues))

    def test_dict_ok(self):
        path = self.write("ADMINS_NOTIFICATIONS = {'NEW_USER': True}\n")
        issues, _ = check_settings.check_file(path)
        self.assertEqual(issues, [])

    def test_tuple_ok(self):
        path = self.write("SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')\n")
        issues, _ = check_settings.check_file(path)
        self.assertEqual(issues, [])

    def test_non_literal_type_warns(self):
        path = self.write("UPLOAD_MAX_SIZE = compute()\n")
        issues, _ = check_settings.check_file(path)
        self.assertTrue(any("not a literal" in msg for _, _, msg in issues))


class TestTlsSsl(Base):
    def test_both_true_errors(self):
        path = self.write("EMAIL_USE_TLS = True\nEMAIL_USE_SSL = True\n")
        issues, _ = check_settings.check_file(path)
        self.assertTrue(any("mutually exclusive" in msg for _, _, msg in issues))

    def test_tls_only_ok(self):
        path = self.write("EMAIL_USE_TLS = True\nEMAIL_USE_SSL = False\n")
        issues, _ = check_settings.check_file(path)
        self.assertFalse(any("mutually exclusive" in msg for _, _, msg in issues))

    def test_ssl_only_ok(self):
        path = self.write("EMAIL_USE_TLS = False\nEMAIL_USE_SSL = True\n")
        issues, _ = check_settings.check_file(path)
        self.assertFalse(any("mutually exclusive" in msg for _, _, msg in issues))

    def test_absent_pair_ok(self):
        path = self.write("PORTAL_NAME = 'T'\n")
        issues, _ = check_settings.check_file(path)
        self.assertFalse(any("mutually exclusive" in msg for _, _, msg in issues))


class TestUnknowns(Base):
    def test_unknown_warns(self):
        path = self.write("TOTALLY_MADE_UP = True\n")
        issues, _ = check_settings.check_file(path)
        self.assertTrue(any(i[0] == "warning" and "unknown" in i[2] for i in issues))

    def test_known_django_settings_no_warning(self):
        path = self.write("ALLOWED_HOSTS = ['x']\nDEBUG = False\n")
        issues, _ = check_settings.check_file(path)
        self.assertEqual(issues, [])


class TestMain(Base):
    def run_main(self, content, *extra):
        path = self.write(content)
        return check_settings.main([path] + list(extra))

    def test_clean_file_exits_zero(self):
        self.assertEqual(self.run_main("PORTAL_NAME = 'T'\n"), 0)

    def test_error_exits_one(self):
        self.assertEqual(self.run_main("PORTAL_WORKFLOW = 'x'\n"), 1)

    def test_unknown_exits_zero_without_strict(self):
        self.assertEqual(self.run_main("MADE_UP = 1\n"), 0)

    def test_unknown_exits_one_with_strict(self):
        self.assertEqual(self.run_main("MADE_UP = 1\n", "--strict"), 1)

    def test_missing_file_exits_one(self):
        self.assertEqual(check_settings.main(["/nonexistent.py"]), 1)


class TestJsonOutput(Base):
    def test_json_valid_and_counts(self):
        import io
        import contextlib
        path = self.write("PORTAL_NAME = 'T'\nMADE_UP = 1\n")
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = check_settings.main([path, "--json"])
        data = json.loads(buf.getvalue())
        self.assertEqual(rc, 0)
        self.assertEqual(data["errors"], 0)
        self.assertEqual(len(data["issues"]), 1)
        self.assertEqual(data["issues"][0]["level"], "warning")

    def test_json_error_reflected(self):
        import io
        import contextlib
        path = self.write("EMAIL_USE_TLS = True\nEMAIL_USE_SSL = True\n")
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = check_settings.main([path, "--json"])
        data = json.loads(buf.getvalue())
        self.assertEqual(rc, 1)
        self.assertTrue(any("mutually exclusive" in i["message"] for i in data["issues"]))


if __name__ == "__main__":
    unittest.main()
