import base64
import importlib.util
import json
import io
import os
import pathlib
import unittest
from unittest import mock
import urllib.error


ROOT = pathlib.Path(__file__).resolve().parents[1]


def load_module(name, relative_path):
    spec = importlib.util.spec_from_file_location(name, ROOT / relative_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


state_api = load_module("planner_state_api", "api/state.py")
auth_api = load_module("planner_auth_api", "api/auth.py")


def jwt_for(user_id):
    def segment(value):
        raw = json.dumps(value, separators=(",", ":")).encode("utf-8")
        return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")

    return f"{segment({'alg': 'HS256', 'typ': 'JWT'})}.{segment({'sub': user_id})}.signature"


class FakeResponse:
    def __init__(self, payload):
        self.payload = json.dumps(payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False

    def read(self):
        return self.payload


class AuthOutageResilienceTests(unittest.TestCase):
    def test_access_token_subject_is_decoded(self):
        self.assertEqual(state_api.user_id_from_access_token(jwt_for("user-123")), "user-123")

    def test_invalid_access_token_is_rejected(self):
        with self.assertRaises(urllib.error.HTTPError) as context:
            state_api.user_id_from_access_token("not-a-jwt")
        self.assertEqual(context.exception.code, 401)
        self.assertEqual(state_api.http_error_detail(context.exception), "로그인 세션을 확인할 수 없습니다.")

    def test_empty_http_error_body_preserves_reason(self):
        error = urllib.error.HTTPError("", 401, "로그인 세션을 확인할 수 없습니다.", {}, io.BytesIO(b""))
        self.assertEqual(state_api.http_error_detail(error), "로그인 세션을 확인할 수 없습니다.")

    def test_state_read_does_not_call_auth_user_endpoint(self):
        token = jwt_for("user-123")
        captured_requests = []

        def fake_urlopen(request, timeout=0):
            captured_requests.append(request)
            return FakeResponse([{"state": {"days": {}}, "updated_at": "2026-10-12T01:00:00Z"}])

        env = {
            "NEXT_PUBLIC_SUPABASE_URL": "https://example.supabase.co",
            "NEXT_PUBLIC_SUPABASE_ANON_KEY": "anon-key",
        }
        with mock.patch.dict(os.environ, env, clear=False), mock.patch.object(
            state_api.urllib.request, "urlopen", side_effect=fake_urlopen
        ):
            result = state_api.get_planner_state(token)

        self.assertTrue(result["exists"])
        self.assertEqual(len(captured_requests), 1)
        self.assertIn("/rest/v1/planner_states", captured_requests[0].full_url)
        self.assertNotIn("/auth/v1/user", captured_requests[0].full_url)
        self.assertEqual(captured_requests[0].get_header("Authorization"), f"Bearer {token}")

    def test_transient_auth_error_is_retryable(self):
        payload = auth_api.transient_auth_error()
        self.assertEqual(payload["code"], "auth_temporarily_unavailable")
        self.assertTrue(payload["retryable"])


if __name__ == "__main__":
    unittest.main()
