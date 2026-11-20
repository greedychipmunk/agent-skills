#!/usr/bin/env python3
"""Offline validator for a MediaCMS local_settings.py.

Checks assignment names against the upstream v9.6.1 settings catalog,
value types, choice-constrained values, and the EMAIL_USE_TLS/SSL
mutual exclusion. Standard library only.

Usage:
    python check_settings.py local_settings.py
    python check_settings.py local_settings.py --strict --json
"""

import argparse
import ast
import json
import sys


CHOICE_SETTINGS = {
    "PORTAL_WORKFLOW": ("public", "private", "unlisted"),
    "CAN_ADD_MEDIA": ("all", "email_verified", "advancedUser"),
    "CAN_COMMENT": ("all", "email_verified", "advancedUser"),
    "CAN_SEE_MEMBERS_PAGE": ("all", "anonymous", "editors", "admins"),
    "USER_SEARCH_FIELD": ("name_username", "name_username_email"),
    "ACCOUNT_EMAIL_VERIFICATION": ("optional", "mandatory", "none"),
    "FFMPEG_DEFAULT_PRESET": (
        "ultrafast", "superfast", "veryfast", "faster", "fast",
        "medium", "slow", "slower", "veryslow",
    ),
    "DEFAULT_THEME": ("light", "dark"),
}

TYPE_SETTINGS = {
    # bool
    "MEDIA_IS_REVIEWED": bool, "GLOBAL_LOGIN_REQUIRED": bool,
    "GENERATE_SITEMAP": bool, "INCLUDE_LISTING_NUMBERS": bool,
    "USE_ROUNDED_CORNERS": bool, "LOGIN_ALLOWED": bool,
    "REGISTER_ALLOWED": bool, "USERS_CAN_SELF_REGISTER": bool,
    "USERS_NEEDS_TO_BE_APPROVED": bool, "UPLOAD_MEDIA_ALLOWED": bool,
    "CAN_LIKE_MEDIA": bool, "CAN_DISLIKE_MEDIA": bool,
    "CAN_REPORT_MEDIA": bool, "CAN_SHARE_MEDIA": bool,
    "ALLOW_RATINGS": bool, "ALLOW_RATINGS_CONFIRMED_EMAIL_ONLY": bool,
    "ALLOW_VIDEO_TRIMMER": bool, "ALLOW_MENTION_IN_COMMENTS": bool,
    "ALLOW_MEDIA_REPLACEMENT": bool, "ALLOW_CUSTOM_MEDIA_URLS": bool,
    "ALLOW_ANONYMOUS_USER_LISTING": bool, "USE_RBAC": bool,
    "USE_SAML": bool, "USE_IDENTITY_PROVIDERS": bool, "USE_LTI": bool,
    "USE_WHISPER_TRANSCRIBE": bool, "USER_CAN_TRANSCRIBE_VIDEO": bool,
    "DO_NOT_TRANSCODE_VIDEO": bool, "SHOW_ORIGINAL_MEDIA": bool,
    "MASK_IPS_FOR_ACTIONS": bool, "LOAD_FROM_CDN": bool,
    "EMAIL_USE_TLS": bool, "EMAIL_USE_SSL": bool,
    "TIMESTAMP_IN_TIMEBAR": bool,
    "VIDEO_PLAYER_FEATURED_VIDEO_ON_INDEX_PAGE": bool,
    "POST_UPLOAD_AUTHOR_MESSAGE_UNLISTED_NO_COMMENTARY": bool,
    "DEBUG": bool, "SECURE_SSL_REDIRECT": bool, "CSRF_COOKIE_SECURE": bool,
    "SESSION_COOKIE_SECURE": bool, "USE_X_FORWARDED_HOST": bool,
    # int
    "UPLOAD_MAX_SIZE": int, "UPLOAD_MAX_FILES_NUMBER": int,
    "NUMBER_OF_MEDIA_USER_CAN_UPLOAD": int, "MAX_MEDIA_PER_PLAYLIST": int,
    "MAX_CHARS_FOR_COMMENT": int, "REPORTED_TIMES_THRESHOLD": int,
    "FRIENDLY_TOKEN_LEN": int, "ACCOUNT_LOGIN_ATTEMPTS_LIMIT": int,
    "ACCOUNT_LOGIN_ATTEMPTS_TIMEOUT": int, "EMAIL_TIMEOUT": int,
    "EMAIL_PORT": int, "SLIDESHOW_ITEMS": int, "SPRITE_NUM_SECS": int,
    # str
    "PORTAL_NAME": str, "PORTAL_DESCRIPTION": str, "DEFAULT_THEME": str,
    "SIDEBAR_FOOTER_TEXT": str, "FRONTEND_HOST": str, "EMAIL_HOST": str,
    "EMAIL_HOST_USER": str, "EMAIL_HOST_PASSWORD": str,
    "DEFAULT_FROM_EMAIL": str, "SERVER_EMAIL": str, "EMAIL_BACKEND": str,
    "CANNOT_ADD_MEDIA_MESSAGE": str, "PRE_UPLOAD_MEDIA_MESSAGE": str,
    "WHISPER_MODEL": str, "LANGUAGE_CODE": str, "TIME_ZONE": str,
    "SECRET_KEY": str, "STATIC_URL": str, "MEDIA_URL": str,
    "X_FRAME_OPTIONS": str, "DEFAULT_AUTO_FIELD": str,
    "PORTAL_LOGO_DARK_PNG": str, "PORTAL_LOGO_DARK_SVG": str,
    "PORTAL_LOGO_LIGHT_PNG": str, "PORTAL_LOGO_LIGHT_SVG": str,
    # list
    "EXTRA_CSS_PATHS": list, "ALLOWED_DOMAINS_FOR_USER_REGISTRATION": list,
    "RESTRICTED_DOMAINS_FOR_USER_REGISTRATION": list,
    "ALLOWED_MEDIA_UPLOAD_TYPES": list, "ALLOW_ANONYMOUS_ACTIONS": list,
    "ADMIN_EMAIL_LIST": list, "ALLOWED_HOSTS": list,
    "INSTALLED_APPS": list, "MIDDLEWARE": list,
    # dict
    "USERS_NOTIFICATIONS": dict, "ADMINS_NOTIFICATIONS": dict,
    "DATABASES": dict, "CACHES": dict,
    # tuple
    "SECURE_PROXY_SSL_HEADER": tuple,
}

KNOWN_NAMES = set(TYPE_SETTINGS) | set(CHOICE_SETTINGS) | {
    "LANGUAGES", "RELATED_MEDIA_STRATEGY", "MINIMUM_RESOLUTIONS_TO_ENCODE",
    "CHUNKIZE_VIDEO_DURATION", "VIDEO_CHUNKS_DURATION",
}


def literal_type_name(node):
    """Map an ast literal node to a type, or None."""
    if isinstance(node, ast.Constant):
        value = node.value
        if isinstance(value, bool):
            return bool
        if isinstance(value, int):
            return int
        if isinstance(value, str):
            return str
        return None
    if isinstance(node, ast.List):
        return list
    if isinstance(node, ast.Dict):
        return dict
    if isinstance(node, ast.Tuple):
        return tuple
    return None


def extract_assignments(source):
    """Return {name: value_node} for top-level simple assignments."""
    tree = ast.parse(source)
    found = {}
    for node in tree.body:
        if isinstance(node, ast.Assign) and len(node.targets) == 1 \
                and isinstance(node.targets[0], ast.Name):
            found[node.targets[0].id] = node.value
    return found


def check_file(path):
    """Validate one settings file. Returns (issues, summary) where each
    issue is (level, name, message) with level in {'error', 'warning'}."""
    try:
        with open(path, "r", encoding="utf-8") as fh:
            source = fh.read()
    except OSError as err:
        return [("error", None, "cannot read file: %s" % err)], None
    try:
        assignments = extract_assignments(source)
    except SyntaxError as err:
        return [("error", None, "syntax error: %s" % err)], None

    issues = []
    for name, node in sorted(assignments.items()):
        if name in CHOICE_SETTINGS:
            if isinstance(node, ast.Constant) and isinstance(node.value, str):
                if node.value not in CHOICE_SETTINGS[name]:
                    issues.append(("error", name,
                        "invalid choice %r; expected one of %s" % (
                            node.value, ", ".join(CHOICE_SETTINGS[name]))))
                continue
            issues.append(("warning", name, "not a plain string literal; choices not checked"))
            continue
        if name in TYPE_SETTINGS:
            expected = TYPE_SETTINGS[name]
            actual = literal_type_name(node)
            if actual is None:
                issues.append(("warning", name, "not a literal; type not checked"))
            elif expected is bool and actual is not bool:
                # bool is a subclass of int; a plain int where bool expected is a mistake
                issues.append(("error", name, "expected bool, got %s" % actual.__name__))
            elif expected is not bool and actual is not expected \
                    and not (expected is int and actual is bool):
                issues.append(("error", name, "expected %s, got %s" % (
                    expected.__name__, actual.__name__)))
            continue
        issues.append(("warning", name, "unknown setting (not in v9.6.1 catalog)"))

    # cross-setting rule: TLS/SSL mutual exclusion
    tls = _as_bool(assignments.get("EMAIL_USE_TLS"))
    ssl = _as_bool(assignments.get("EMAIL_USE_SSL"))
    if tls and ssl:
        issues.append(("error", "EMAIL_USE_TLS/EMAIL_USE_SSL",
                       "both True; they are mutually exclusive (admins_docs §15)"))

    return issues, {"checked": len(assignments)}


def _as_bool(node):
    if isinstance(node, ast.Constant) and isinstance(node.value, bool):
        return node.value
    return None


def main(argv=None):
    parser = argparse.ArgumentParser(description="Validate a MediaCMS local_settings.py")
    parser.add_argument("path", help="Path to the settings file to check")
    parser.add_argument("--strict", action="store_true",
                        help="Treat unknown settings as errors")
    parser.add_argument("--json", action="store_true", help="JSON output")
    args = parser.parse_args(argv)

    issues, summary = check_file(args.path)
    errors = [i for i in issues if i[0] == "error"]
    if args.strict:
        errors += [i for i in issues if i[0] == "warning"]

    if args.json:
        print(json.dumps({
            "file": args.path,
            "issues": [{"level": lvl, "setting": name, "message": msg}
                       for lvl, name, msg in issues],
            "errors": len(errors),
            "ok": not errors,
        }, indent=2))
    else:
        for lvl, name, msg in issues:
            label = "ERROR" if lvl == "error" else "WARN"
            print("%s %-38s %s" % (label, name or "-", msg))
        if not issues:
            print("OK: no issues found")
        print("%d error(s), %d warning(s)" % (
            len([i for i in issues if i[0] == "error"]),
            len([i for i in issues if i[0] == "warning"])))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
