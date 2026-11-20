#!/usr/bin/env python3
"""Offline tests for api_smoke.py — no running MediaCMS needed."""

import json
import io
import os
import sys
import tempfile
import unittest
import urllib.error

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import api_smoke  # noqa: E402


class TestJoinUrl(unittest.TestCase):
    def test_strips_trailing_slash_from_base(self):
        self.assertEqual(api_smoke.join_url("http://x/", "/api"), "http://x/api")

    def test_strips_leading_slash_from_path(self):
        self.assertEqual(api_smoke.join_url("http://x", "api"), "http://x/api")

    def test_both_slashes(self):
        self.assertEqual(api_smoke.join_url("http://x/", "/api"), "http://x/api")

    def test_no_slashes(self):
        self.assertEqual(api_smoke.join_url("http://x", "api"), "http://x/api")

    def test_preserves_query(self):
        self.assertEqual(api_smoke.join_url("http://x", "api?page=2"), "http://x/api?page=2")


class TestAuthHeaders(unittest.TestCase):
    def test_basic_header_format(self):
        header = api_smoke.basic_auth_header("admin", "admin")
        self.assertTrue(header.startswith("Basic "))

    def test_basic_header_decodes_back(self):
        import base64
        header = api_smoke.basic_auth_header("user", "pass")
        decoded = base64.b64decode(header.split(" ", 1)[1]).decode()
        self.assertEqual(decoded, "user:pass")

    def test_basic_header_handles_unicode(self):
        header = api_smoke.basic_auth_header("usér", "påss")
        self.assertTrue(header.startswith("Basic "))

    def test_token_header(self):
        self.assertEqual(api_smoke.token_auth_header("abc123"), "Token abc123")

    def test_token_header_stringifies(self):
        self.assertEqual(api_smoke.token_auth_header(123), "Token 123")


class TestMultipart(unittest.TestCase):
    def setUp(self):
        fd, self.path = tempfile.mkstemp(suffix=".mp4")
        with os.fdopen(fd, "wb") as fh:
            fh.write(b"fake-video-bytes")

    def tearDown(self):
        os.unlink(self.path)

    def test_returns_content_type_and_bytes(self):
        ctype, body = api_smoke.encode_multipart({"title": "t"}, self.path)
        self.assertTrue(ctype.startswith("multipart/form-data; boundary="))
        self.assertIsInstance(body, bytes)

    def test_body_contains_boundary_closer(self):
        ctype, body = api_smoke.encode_multipart({}, self.path)
        boundary = ctype.split("boundary=")[1].encode()
        self.assertIn(b"--" + boundary + b"--", body)

    def test_body_contains_field(self):
        _, body = api_smoke.encode_multipart({"title": "hello"}, self.path)
        self.assertIn(b'name="title"', body)
        self.assertIn(b"hello", body)

    def test_body_contains_file_content(self):
        _, body = api_smoke.encode_multipart({}, self.path)
        self.assertIn(b"fake-video-bytes", body)

    def test_body_contains_filename(self):
        _, body = api_smoke.encode_multipart({}, self.path)
        self.assertIn(os.path.basename(self.path).encode(), body)

    def test_none_fields_skipped(self):
        _, body = api_smoke.encode_multipart({"title": None, "state": "public"}, self.path)
        self.assertNotIn(b'name="title"', body)
        self.assertIn(b"public", body)

    def test_video_mime_guessed(self):
        ctype, _ = api_smoke.encode_multipart({}, self.path)
        _, body = api_smoke.encode_multipart({}, self.path)
        self.assertIn(b"video/mp4", body)

    def test_custom_field_name(self):
        _, body = api_smoke.encode_multipart({}, self.path, file_field="datafile")
        self.assertIn(b'name="datafile"', body)


class TestClassifyStatus(unittest.TestCase):
    def test_2xx_ok(self):
        self.assertEqual(api_smoke.classify_status(200), "ok")

    def test_201_ok(self):
        self.assertEqual(api_smoke.classify_status(201), "ok")

    def test_204_ok(self):
        self.assertEqual(api_smoke.classify_status(204), "ok")

    def test_401_auth(self):
        self.assertEqual(api_smoke.classify_status(401), "auth")

    def test_403_auth(self):
        self.assertEqual(api_smoke.classify_status(403), "auth")

    def test_404_missing(self):
        self.assertEqual(api_smoke.classify_status(404), "missing")

    def test_500_server_error(self):
        self.assertEqual(api_smoke.classify_status(500), "server-error")

    def test_503_server_error(self):
        self.assertEqual(api_smoke.classify_status(503), "server-error")

    def test_302_error(self):
        self.assertEqual(api_smoke.classify_status(302), "error")


class FakeResponse:
    def __init__(self, status, payload):
        self.status = status
        self._payload = payload

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self):
        return json.dumps(self._payload).encode()


class FakeOpener:
    def __init__(self, status=200, payload=None, fail_connection=False):
        self.status = status
        self.payload = payload or {}
        self.fail_connection = fail_connection
        self.requests = []

    def open(self, req, timeout=None):
        self.requests.append(req)
        if self.fail_connection:
            raise urllib.error.URLError("refused")
        if self.status >= 400:
            raise urllib.error.HTTPError(
                req.full_url, self.status, "err", None, io.BytesIO(b'{"detail": "denied"}'))
        return FakeResponse(self.status, self.payload)


class TestFetch(unittest.TestCase):
    def test_parses_json(self):
        status, body = api_smoke.fetch(FakeOpener(200, {"ok": True}), "http://x/api")
        self.assertEqual(status, 200)
        self.assertEqual(body, {"ok": True})

    def test_http_error_returns_status(self):
        status, _ = api_smoke.fetch(FakeOpener(401), "http://x/api")
        self.assertEqual(status, 401)

    def test_http_error_body_parsed(self):
        status, body = api_smoke.fetch(FakeOpener(401), "http://x/api")
        self.assertEqual(body, {"detail": "denied"})

    def test_connection_failure(self):
        status, body = api_smoke.fetch(FakeOpener(fail_connection=True), "http://x/api")
        self.assertIsNone(status)
        self.assertIsNone(body)

    def test_auth_header_sent(self):
        opener = FakeOpener(200, {})
        api_smoke.fetch(opener, "http://x", auth_header="Token abc")
        self.assertEqual(opener.requests[0].headers["Authorization"], "Token abc")


class TestRunChecks(unittest.TestCase):
    def test_anonymous_checks_all_ok(self):
        opener = FakeOpener(200, {})
        orig = api_smoke.urllib.request.build_opener
        api_smoke.urllib.request.build_opener = lambda: opener
        try:
            results = api_smoke.run_checks("http://x")
        finally:
            api_smoke.urllib.request.build_opener = orig
        names = [r[0] for r in results]
        self.assertIn("media list", names)
        self.assertIn("swagger schema", names)
        self.assertTrue(all(v == "ok" for _, v, _ in results))

    def test_auth_failure_recorded(self):
        opener = FakeOpener(401, {})
        orig = api_smoke.urllib.request.build_opener
        api_smoke.urllib.request.build_opener = lambda: opener
        try:
            results = api_smoke.run_checks("http://x", auth_header="Basic eA==")
        finally:
            api_smoke.urllib.request.build_opener = orig
        verdicts = dict((n, v) for n, v, _ in results)
        self.assertEqual(verdicts["whoami"], "auth")


class TestMain(unittest.TestCase):
    def test_requires_base_url(self):
        with self.assertRaises(SystemExit):
            api_smoke.main([])

    def test_anonymous_run_exits_zero_on_ok(self):
        opener = FakeOpener(200, {})
        orig = api_smoke.urllib.request.build_opener
        api_smoke.urllib.request.build_opener = lambda: opener
        try:
            rc = api_smoke.main(["--base-url", "http://x"])
        finally:
            api_smoke.urllib.request.build_opener = orig
        self.assertEqual(rc, 0)

    def test_failures_exit_nonzero(self):
        opener = FakeOpener(500, {})
        orig = api_smoke.urllib.request.build_opener
        api_smoke.urllib.request.build_opener = lambda: opener
        try:
            rc = api_smoke.main(["--base-url", "http://x"])
        finally:
            api_smoke.urllib.request.build_opener = orig
        self.assertEqual(rc, 1)

    def test_token_auth_selected(self):
        opener = FakeOpener(200, {"username": "admin"})
        orig = api_smoke.urllib.request.build_opener
        api_smoke.urllib.request.build_opener = lambda: opener
        try:
            rc = api_smoke.main(["--base-url", "http://x", "--token", "abc"])
        finally:
            api_smoke.urllib.request.build_opener = orig
        self.assertEqual(rc, 0)
        self.assertTrue(any(r.headers.get("Authorization") == "Token abc" for r in opener.requests))


if __name__ == "__main__":
    unittest.main()
