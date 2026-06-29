import json
import os
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_POST(self):  # noqa: N802
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(content_length) or b"{}")
        except (ValueError, json.JSONDecodeError):
            self.write_json(400, {"error": "요청 JSON을 읽을 수 없습니다."})
            return

        action = str(payload.get("action", "")).strip().lower()
        if action not in {"signup", "login"}:
            self.write_json(400, {"error": "지원하지 않는 인증 요청입니다."})
            return

        try:
            result = call_supabase_auth(action, payload)
        except RuntimeError as exc:
            self.write_json(503, {"error": str(exc)})
            return
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")
            self.write_json(exc.code, {"error": extract_supabase_error(detail) or "인증 서버 요청에 실패했습니다."})
            return
        except Exception as exc:
            self.write_json(502, {"error": "인증 서버 연결 중 오류가 발생했습니다.", "detail": str(exc)})
            return

        self.write_json(200, result)

    def do_OPTIONS(self):  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def write_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def call_supabase_auth(action, payload):
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").strip().rstrip("/")
    anon_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "").strip()
    if not supabase_url or not anon_key:
        raise RuntimeError("Supabase 환경변수가 설정되어 있지 않습니다.")

    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))
    if not email or not password:
        raise urllib.error.HTTPError("", 400, "이메일과 비밀번호가 필요합니다.", {}, None)

    if action == "signup":
        endpoint = f"{supabase_url}/auth/v1/signup"
        body = {
            "email": email,
            "password": password,
            "data": {
                "name": str(payload.get("name", "")).strip(),
                "tier": normalize_tier(str(payload.get("tier", "staff")).strip()),
            },
        }
    else:
        endpoint = f"{supabase_url}/auth/v1/token?grant_type=password"
        body = {"email": email, "password": password}

    request = urllib.request.Request(
        endpoint,
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        data = json.loads(response.read().decode("utf-8"))

    user = data.get("user") or data
    metadata = user.get("user_metadata") or {}
    return {
        "ok": True,
        "provider": "supabase",
        "user": {
            "email": str(user.get("email") or email).lower(),
            "name": str(metadata.get("name") or ""),
            "tier": normalize_tier(str(metadata.get("tier") or payload.get("tier") or "staff")),
        },
        "session": {
            "accessToken": data.get("access_token") or "",
            "refreshToken": data.get("refresh_token") or "",
            "expiresAt": data.get("expires_at") or "",
        },
    }


def normalize_tier(tier):
    return tier if tier in {"ceo", "director", "manager", "staff"} else "staff"


def extract_supabase_error(detail):
    try:
        data = json.loads(detail)
    except json.JSONDecodeError:
        return detail[:300]
    return str(data.get("msg") or data.get("message") or data.get("error_description") or data.get("error") or "")
