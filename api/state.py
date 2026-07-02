import json
import os
import urllib.error
import urllib.parse
import urllib.request
import datetime as dt
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802
        token = bearer_token(self.headers)
        if not token:
            self.write_json(401, {"error": "로그인 세션이 필요합니다."})
            return
        try:
            self.write_json(200, get_planner_state(token))
        except RuntimeError as exc:
            self.write_json(503, {"error": str(exc)})
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")
            self.write_json(normalize_supabase_status(exc.code, detail), normalize_supabase_error_payload(detail, "Supabase DB 상태를 읽을 수 없습니다."))
        except Exception as exc:
            self.write_json(502, {"error": "Supabase DB 연결 중 오류가 발생했습니다.", "detail": str(exc)})

    def do_POST(self):  # noqa: N802
        token = bearer_token(self.headers)
        if not token:
            self.write_json(401, {"error": "로그인 세션이 필요합니다."})
            return
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(content_length) or b"{}")
        except (ValueError, json.JSONDecodeError):
            self.write_json(400, {"error": "요청 JSON을 읽을 수 없습니다."})
            return
        state = payload.get("state")
        if not isinstance(state, dict):
            self.write_json(400, {"error": "저장할 플래너 state가 필요합니다."})
            return
        try:
            self.write_json(200, save_planner_state(token, state, payload))
        except RuntimeError as exc:
            self.write_json(503, {"error": str(exc)})
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")
            self.write_json(normalize_supabase_status(exc.code, detail), normalize_supabase_error_payload(detail, "Supabase DB에 저장할 수 없습니다."))
        except Exception as exc:
            self.write_json(502, {"error": "Supabase DB 저장 중 오류가 발생했습니다.", "detail": str(exc)})

    def do_OPTIONS(self):  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
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


def bearer_token(headers):
    value = headers.get("Authorization", "")
    if not value.lower().startswith("bearer "):
        return ""
    return value.split(" ", 1)[1].strip()


def supabase_base():
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").strip().rstrip("/")
    anon_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "").strip()
    if not supabase_url or not anon_key:
        raise RuntimeError("Supabase 환경변수가 설정되어 있지 않습니다.")
    return supabase_url, anon_key


def call_supabase_user(token):
    supabase_url, anon_key = supabase_base()
    request = urllib.request.Request(
        f"{supabase_url}/auth/v1/user",
        headers={"apikey": anon_key, "Authorization": f"Bearer {token}"},
        method="GET",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def get_planner_state(token):
    supabase_url, anon_key = supabase_base()
    user = call_supabase_user(token)
    user_id = user.get("id")
    if not user_id:
        raise urllib.error.HTTPError("", 401, "인증된 사용자 정보를 확인할 수 없습니다.", {}, None)
    encoded_user_id = urllib.parse.quote(user_id, safe="")
    request = urllib.request.Request(
        f"{supabase_url}/rest/v1/planner_states?user_id=eq.{encoded_user_id}&select=state,updated_at&limit=1",
        headers={"apikey": anon_key, "Authorization": f"Bearer {token}", "Accept": "application/json"},
        method="GET",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        rows = json.loads(response.read().decode("utf-8"))
    if not rows:
        return {"exists": False, "state": None, "updatedAt": "", "storage": "supabase-db"}
    row = rows[0]
    return {
        "exists": True,
        "state": row.get("state"),
        "updatedAt": row.get("updated_at") or "",
        "storage": "supabase-db",
    }


def save_planner_state(token, state, payload):
    supabase_url, anon_key = supabase_base()
    user = call_supabase_user(token)
    user_id = user.get("id")
    if not user_id:
        raise urllib.error.HTTPError("", 401, "인증된 사용자 정보를 확인할 수 없습니다.", {}, None)
    updated_at = payload.get("updatedAt") or utc_now()
    existing = get_planner_state(token)
    if existing.get("exists") and is_newer(existing.get("updatedAt"), updated_at):
        return {"ok": True, "stale": True, "updatedAt": existing.get("updatedAt") or "", "storage": "supabase-db"}
    body = [
        {
            "user_id": user_id,
            "state": state,
            "updated_at": updated_at,
        }
    ]
    request = urllib.request.Request(
        f"{supabase_url}/rest/v1/planner_states?on_conflict=user_id",
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={
            "apikey": anon_key,
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=representation",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        rows = json.loads(response.read().decode("utf-8") or "[]")
    saved = rows[0] if rows else {}
    return {"ok": True, "updatedAt": saved.get("updated_at") or updated_at, "storage": "supabase-db"}


def extract_supabase_error(detail):
    try:
        data = json.loads(detail)
    except json.JSONDecodeError:
        return detail[:300]
    return str(data.get("msg") or data.get("message") or data.get("error_description") or data.get("error") or "")


def normalize_supabase_status(status, detail):
    if "planner_states" in detail and "Could not find the table" in detail:
        return 503
    return status


def normalize_supabase_error_payload(detail, fallback):
    message = extract_supabase_error(detail) or fallback
    if "planner_states" in detail and "Could not find the table" in detail:
        return {
            "error": "Supabase DB 테이블이 아직 없습니다. supabase/planner_states.sql을 SQL Editor에서 실행해야 저장됩니다.",
            "code": "planner_states_missing",
        }
    return {"error": message}


def is_newer(left, right):
    return timestamp_ms(left) > timestamp_ms(right)


def timestamp_ms(value):
    if not value:
        return 0
    try:
        normalized = str(value).replace("Z", "+00:00")
        return dt.datetime.fromisoformat(normalized).timestamp() * 1000
    except ValueError:
        return 0


def utc_now():
    return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")
