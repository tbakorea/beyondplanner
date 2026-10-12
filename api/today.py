import base64
import binascii
import datetime as dt
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802
        token = bearer_token(self.headers)
        if not token:
            self.write_json(401, {"error": "로그인 세션이 필요합니다."})
            return
        target_day = requested_date(self.path)
        if not target_day:
            self.write_json(400, {"error": "올바른 date가 필요합니다."})
            return
        try:
            self.write_json(200, get_today_slice(token, target_day))
        except urllib.error.HTTPError as exc:
            detail = http_error_detail(exc)
            if slice_schema_unavailable(detail):
                self.write_json(200, {"available": False, "ready": False, "fallback": "legacy-state"})
                return
            self.write_json(exc.code, {"error": extract_supabase_error(detail) or "오늘 데이터를 읽을 수 없습니다."})
        except RuntimeError as exc:
            self.write_json(503, {"error": str(exc)})
        except Exception as exc:
            self.write_json(502, {"error": "오늘 데이터 연결 중 오류가 발생했습니다.", "detail": str(exc)})

    def do_OPTIONS(self):  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Authorization")
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


def requested_date(path):
    try:
        value = (urllib.parse.parse_qs(urllib.parse.urlparse(path).query).get("date") or [""])[0]
        return dt.date.fromisoformat(str(value)).isoformat()
    except (TypeError, ValueError):
        return ""


def start_of_week(day_text):
    day = dt.date.fromisoformat(day_text)
    days_since_sunday = (day.weekday() + 1) % 7
    return (day - dt.timedelta(days=days_since_sunday)).isoformat()


def supabase_base():
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").strip().rstrip("/")
    anon_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "").strip()
    if not supabase_url or not anon_key:
        raise RuntimeError("Supabase 환경변수가 설정되어 있지 않습니다.")
    return supabase_url, anon_key


def user_id_from_access_token(token):
    try:
        parts = str(token or "").split(".")
        if len(parts) != 3:
            raise ValueError("invalid JWT")
        segment = parts[1] + "=" * (-len(parts[1]) % 4)
        payload = json.loads(base64.urlsafe_b64decode(segment.encode("ascii")).decode("utf-8"))
        user_id = str(payload.get("sub") or "").strip()
        if not user_id:
            raise ValueError("missing subject")
        return user_id
    except (ValueError, TypeError, json.JSONDecodeError, UnicodeDecodeError, binascii.Error) as exc:
        raise urllib.error.HTTPError("", 401, "로그인 세션을 확인할 수 없습니다.", {}, None) from exc


def get_today_slice(token, target_day):
    supabase_url, anon_key = supabase_base()
    user_id_from_access_token(token)
    body = {"target_day": target_day, "target_week": start_of_week(target_day)}
    request = urllib.request.Request(
        f"{supabase_url}/rest/v1/rpc/get_planner_today",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "apikey": anon_key,
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        payload = json.loads(response.read().decode("utf-8") or "{}")
    if not isinstance(payload, dict):
        return {"available": False, "ready": False, "fallback": "legacy-state"}
    payload["storage"] = "supabase-db-slices"
    return payload


def http_error_detail(exc):
    if getattr(exc, "fp", None) is not None:
        return exc.read().decode("utf-8", "replace")
    return str(getattr(exc, "reason", "") or "")


def extract_supabase_error(detail):
    try:
        data = json.loads(detail)
    except json.JSONDecodeError:
        return detail[:300]
    return str(data.get("message") or data.get("msg") or data.get("error") or "")


def slice_schema_unavailable(detail):
    value = str(detail or "")
    return any(
        marker in value
        for marker in (
            "get_planner_today",
            "planner_tasks",
            "planner_appointments",
            "planner_daily_notes",
            "planner_weeks",
            "Could not find the function",
            "Could not find the table",
        )
    )
