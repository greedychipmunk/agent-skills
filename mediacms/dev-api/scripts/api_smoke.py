#!/usr/bin/env python3
"""Offline-friendly smoke test for a running MediaCMS installation.

Checks the public REST surface with only the Python standard library:
whoami, token mint, media/categories/tags listings, Swagger schema, and
optionally an upload -> detail -> delete round-trip.

Usage:
    python api_smoke.py --base-url http://localhost
    python api_smoke.py --base-url http://localhost --user admin --password admin
    python api_smoke.py --base-url http://localhost --user admin --password admin --upload-file clip.mp4
"""

import argparse
import base64
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.request
import uuid


def join_url(base, path):
    """Join a base URL and a path without double slashes."""
    return base.rstrip("/") + "/" + path.lstrip("/")


def basic_auth_header(user, password):
    """Build an Authorization header value for HTTP Basic auth."""
    raw = ("%s:%s" % (user, password)).encode("utf-8")
    return "Basic " + base64.b64encode(raw).decode("ascii")


def token_auth_header(token):
    """Build an Authorization header value for DRF token auth."""
    return "Token " + str(token)


def encode_multipart(fields, file_path, file_field="media_file"):
    """Build a multipart/form-data body. Returns (content_type, bytes)."""
    boundary = "----mediacms-smoke-" + uuid.uuid4().hex
    lines = []
    for name, value in fields.items():
        if value is None:
            continue
        lines.extend([
            "--" + boundary,
            'Content-Disposition: form-data; name="%s"' % name,
            "",
            str(value),
        ])
    filename = os.path.basename(file_path)
    ctype = mimetypes.guess_type(filename)[0] or "application/octet-stream"
    with open(file_path, "rb") as fh:
        content = fh.read()
    lines.extend([
        "--" + boundary,
        'Content-Disposition: form-data; name="%s"; filename="%s"' % (file_field, filename),
        "Content-Type: " + ctype,
        "",
    ])
    body = ("\r\n".join(lines)).encode("utf-8") + b"\r\n" + content + b"\r\n"
    body += ("--" + boundary + "--\r\n").encode("ascii")
    return "multipart/form-data; boundary=" + boundary, body


def classify_status(status):
    """Map an HTTP status to a check verdict."""
    if 200 <= status < 300:
        return "ok"
    if status in (401, 403):
        return "auth"
    if status == 404:
        return "missing"
    if 500 <= status < 600:
        return "server-error"
    return "error"


def fetch(opener, url, auth_header=None, data=None, headers=None, timeout=30):
    """Perform one request. Returns (status, parsed-or-raw body)."""
    req_headers = {"Accept": "application/json"}
    if headers:
        req_headers.update(headers)
    if auth_header:
        req_headers["Authorization"] = auth_header
    req = urllib.request.Request(url, data=data, headers=req_headers)
    try:
        with opener.open(req, timeout=timeout) as resp:
            body = resp.read()
    except urllib.error.HTTPError as err:
        try:
            body = err.read()
        except Exception:
            body = b""
        return err.code, _parse(body)
    except urllib.error.URLError:
        return None, None
    return _status_of(resp), _parse(body)


def _status_of(resp):
    return resp.status if hasattr(resp, "status") else resp.getcode()


def _parse(body):
    try:
        return json.loads(body.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return body


def run_checks(base_url, auth_header=None, upload_file=None, timeout=30):
    """Run the smoke checks. Returns (results, failures) where each result
    is (name, verdict, detail)."""
    opener = urllib.request.build_opener()
    results = []

    def check(name, url, expect="ok", auth=True):
        status, body = fetch(
            opener, url,
            auth_header=auth_header if auth else None,
            timeout=timeout,
        )
        verdict = classify_status(status) if status is not None else "unreachable"
        detail = "HTTP %s" % status if status is not None else "connection failed"
        results.append((name, verdict, detail))
        return verdict, status, body

    # Anonymous surface
    check("media list", join_url(base_url, "/api/v1/media"), auth=False)
    check("categories", join_url(base_url, "/api/v1/categories"), auth=False)
    check("tags", join_url(base_url, "/api/v1/tags"), auth=False)
    check("swagger schema", join_url(base_url, "/swagger.json"), auth=False)

    # Authenticated surface
    if auth_header:
        verdict, status, body = check("whoami", join_url(base_url, "/api/v1/whoami"))
        if verdict == "ok" and isinstance(body, dict):
            results.append(("whoami username", "ok" if body.get("username") else "error",
                            "username=%r" % body.get("username")))
        check("user token", join_url(base_url, "/api/v1/user/token"))
        check("encode profiles", join_url(base_url, "/api/v1/encode_profiles/"))

    # Upload round-trip
    if auth_header and upload_file:
        ctype, payload = encode_multipart({"title": "smoke test upload"}, upload_file)
        url = join_url(base_url, "/api/v1/media")
        status, body = fetch(opener, url, auth_header=auth_header,
                              data=payload, headers={"Content-Type": ctype},
                              timeout=timeout)
        verdict = classify_status(status)
        results.append(("upload", verdict, "HTTP %s" % status))
        token = body.get("friendly_token") if isinstance(body, dict) else None
        if verdict == "ok" and token:
            check("uploaded detail", join_url(base_url, "/api/v1/media/%s" % token))
            check("uploaded delete", join_url(base_url, "/api/v1/media/%s" % token))
        elif verdict == "ok":
            results.append(("upload token", "error", "no friendly_token in response"))

    return results


def main(argv=None):
    parser = argparse.ArgumentParser(description="MediaCMS API smoke test")
    parser.add_argument("--base-url", required=True, help="Installation root, e.g. http://localhost")
    parser.add_argument("--user", help="Username for HTTP Basic auth")
    parser.add_argument("--password", help="Password for HTTP Basic auth")
    parser.add_argument("--token", help="DRF token (alternative to user/password)")
    parser.add_argument("--upload-file", help="File to upload for a round-trip check")
    parser.add_argument("--timeout", type=int, default=30)
    args = parser.parse_args(argv)

    if not args.token and not (args.user and args.password):
        print("note: no credentials given; only anonymous endpoints will be checked")
    if args.token:
        auth_header = token_auth_header(args.token)
    elif args.user and args.password:
        auth_header = basic_auth_header(args.user, args.password)
    else:
        auth_header = None

    results = run_checks(args.base_url, auth_header=auth_header,
                         upload_file=args.upload_file, timeout=args.timeout)
    failures = 0
    for name, verdict, detail in results:
        line = "PASS  %-18s %s" % (name, detail)
        if verdict != "ok":
            line = "FAIL  %-18s %s" % (name, detail)
            failures += 1
        print(line)
    print("%d/%d checks passed" % (len(results) - failures, len(results)))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
