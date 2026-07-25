import json
import os
import urllib.error
import urllib.parse
import urllib.request
import datetime as dt
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802
        try:
            admin = require_access_admin(self.headers)
            self.write_json(200, {"users": list_access_users(), "adminEmail": admin.get("email", "")})
        except PermissionError as exc:
            self.write_json(403, {"error": str(exc)})
        except RuntimeError as exc:
            self.write_json(503, {"error": str(exc)})
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace") if exc.fp else str(exc.reason or "")
            self.write_json(normalize_http_status(exc.code), {"error": extract_supabase_error(detail) or "승인 목록을 읽을 수 없습니다.", "detail": detail[:800]})
        except Exception as exc:
            self.write_json(502, {"error": "승인 목록 처리 중 오류가 발생했습니다.", "detail": str(exc)})

    def do_POST(self):  # noqa: N802
        try:
            admin = require_access_admin(self.headers)
            content_length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(content_length) or b"{}")
            self.write_json(200, update_access_user(admin, payload))
        except (ValueError, json.JSONDecodeError) as exc:
            self.write_json(400, {"error": str(exc) or "요청 JSON을 읽을 수 없습니다."})
        except PermissionError as exc:
            self.write_json(403, {"error": str(exc)})
        except RuntimeError as exc:
            self.write_json(503, {"error": str(exc)})
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace") if exc.fp else str(exc.reason or "")
            self.write_json(normalize_http_status(exc.code), {"error": extract_supabase_error(detail) or "승인 상태를 변경할 수 없습니다.", "detail": detail[:800]})
        except Exception as exc:
            self.write_json(502, {"error": "승인 상태 처리 중 오류가 발생했습니다.", "detail": str(exc)})

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


def service_role_key():
    return os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()


def supabase_service_base():
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").strip().rstrip("/")
    key = service_role_key()
    if not supabase_url or not key:
        raise RuntimeError("사용자 승인 기능에는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.")
    return supabase_url, key


def supabase_request(path, method="GET", body=None, headers=None):
    supabase_url, key = supabase_service_base()
    data = None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        f"{supabase_url}{path}",
        data=data,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            **(headers or {}),
        },
        method=method,
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        text = response.read().decode("utf-8")
    return json.loads(text or "null")


def call_supabase_user(token):
    supabase_url, anon_key = supabase_base()
    request = urllib.request.Request(
        f"{supabase_url}/auth/v1/user",
        headers={"apikey": anon_key, "Authorization": f"Bearer {token}"},
        method="GET",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def access_admin_emails():
    configured = os.environ.get("APPROVAL_ADMIN_EMAILS", "")
    values = [item.strip().lower() for item in configured.split(",") if item.strip()]
    return set(values or ["j3010@ymail.com"])


def is_access_admin_email(email):
    return str(email or "").strip().lower() in access_admin_emails()


def require_access_admin(headers):
    token = bearer_token(headers)
    if not token:
        raise urllib.error.HTTPError("", 401, "로그인 세션이 필요합니다.", {}, None)
    user = call_supabase_user(token)
    if not is_access_admin_email(user.get("email")):
        raise PermissionError("사용자 승인 관리는 관리자 계정에서만 사용할 수 있습니다.")
    if not service_role_key():
        raise RuntimeError("사용자 승인 기능에는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.")
    return user


def list_auth_users():
    users = []
    page = 1
    while page <= 20:
        data = supabase_request(f"/auth/v1/admin/users?page={page}&per_page=100")
        batch = data.get("users") if isinstance(data, dict) else []
        if not batch:
            break
        users.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    return users


def list_access_users():
    existing = supabase_request("/rest/v1/user_access?select=*&order=created_at.desc") or []
    by_id = {str(row.get("user_id")): row for row in existing}
    for auth_user in list_auth_users():
        user_id = str(auth_user.get("id") or "")
        email = str(auth_user.get("email") or "").strip().lower()
        if not user_id or not email or user_id in by_id:
            continue
        metadata = auth_user.get("user_metadata") or {}
        by_id[user_id] = upsert_user_access(
            user_id,
            email,
            str(metadata.get("name") or ""),
            normalize_tier(str(metadata.get("tier") or "staff")),
            "approved",
        )
    status_order = {"pending": 0, "approved": 1, "suspended": 2, "rejected": 3}
    rows = list(by_id.values())
    rows.sort(key=lambda row: (status_order.get(row.get("approval_status"), 9), str(row.get("created_at") or "")))
    return rows


def upsert_user_access(user_id, email, name, tier, status):
    body = [{
        "user_id": user_id,
        "email": str(email or "").strip().lower(),
        "name": str(name or ""),
        "tier": normalize_tier(tier),
        "approval_status": normalize_access_status(status),
        "approved_at": utc_now() if normalize_access_status(status) == "approved" else None,
        "updated_at": utc_now(),
    }]
    rows = supabase_request(
        "/rest/v1/user_access?on_conflict=user_id",
        method="POST",
        body=body,
        headers={"Prefer": "resolution=merge-duplicates,return=representation"},
    )
    return rows[0] if rows else body[0]


def update_access_user(admin, payload):
    user_id = str(payload.get("userId") or payload.get("user_id") or "").strip()
    if not user_id:
        raise ValueError("변경할 사용자 ID가 필요합니다.")
    status = normalize_access_status(payload.get("approvalStatus") or payload.get("approval_status") or "pending")
    body = {
        "approval_status": status,
        "tier": normalize_tier(str(payload.get("tier") or "staff")),
        "approved_at": utc_now() if status == "approved" else None,
        "approved_by": admin.get("id") if status == "approved" else None,
        "updated_at": utc_now(),
    }
    encoded = urllib.parse.quote(user_id, safe="")
    rows = supabase_request(
        f"/rest/v1/user_access?user_id=eq.{encoded}",
        method="PATCH",
        body=body,
        headers={"Prefer": "return=representation"},
    )
    return {"ok": True, "user": rows[0] if rows else body}


def normalize_access_status(status):
    status = str(status or "pending").strip().lower()
    return status if status in {"pending", "approved", "rejected", "suspended"} else "pending"


def normalize_tier(tier):
    return tier if tier in {"ceo", "director", "manager", "staff"} else "staff"


def utc_now():
    return dt.datetime.now(dt.UTC).isoformat().replace("+00:00", "Z")


def extract_supabase_error(detail):
    try:
        data = json.loads(detail)
    except json.JSONDecodeError:
        return detail[:300]
    return str(data.get("msg") or data.get("message") or data.get("error_description") or data.get("error") or "")


def normalize_http_status(status):
    try:
        code = int(status)
    except (TypeError, ValueError):
        return 502
    return code if 400 <= code <= 599 else 502
