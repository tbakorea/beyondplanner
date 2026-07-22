import base64
import json
import os
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_POST(self):  # noqa: N802
        try:
            user = require_signed_in_user(self.headers)
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace") if exc.fp else str(exc.reason or "")
            self.write_json(normalize_http_status(exc.code), {"error": "로그인 세션을 확인할 수 없습니다.", "detail": detail[:500]})
            return
        except RuntimeError as exc:
            self.write_json(503, {"error": str(exc)})
            return
        except Exception as exc:
            self.write_json(502, {"error": "인증 서버 연결 중 오류가 발생했습니다.", "detail": str(exc)})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(content_length) or b"{}")
        except (ValueError, json.JSONDecodeError):
            self.write_json(400, {"error": "요청 JSON을 읽을 수 없습니다."})
            return

        try:
            self.write_json(200, send_backup_email(user, payload))
        except ValueError as exc:
            self.write_json(400, {"error": str(exc)})
        except RuntimeError as exc:
            self.write_json(503, {"error": str(exc)})
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")
            self.write_json(normalize_http_status(exc.code), {"error": "메일 발송 서비스 요청에 실패했습니다.", "detail": detail[:800]})
        except Exception as exc:
            self.write_json(502, {"error": "백업 메일 발송 중 오류가 발생했습니다.", "detail": str(exc)})

    def do_OPTIONS(self):  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
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


def require_signed_in_user(headers):
    token = bearer_token(headers)
    if not token:
        raise urllib.error.HTTPError("", 401, "로그인 세션이 필요합니다.", {}, None)
    return call_supabase_user(token)


def send_backup_email(user, payload):
    api_key = os.environ.get("RESEND_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("RESEND_API_KEY 환경변수가 설정되어 있지 않습니다. Vercel Project Settings > Environment Variables에 RESEND_API_KEY와 BACKUP_MAIL_FROM을 추가해야 메일 발송이 가능합니다.")
    user_email = str(user.get("email") or "").strip().lower()
    recipient = str(payload.get("recipient") or user_email).strip().lower()
    if "@" not in recipient or "." not in recipient.rsplit("@", 1)[-1]:
        raise ValueError("올바른 수신 이메일 주소가 필요합니다.")
    filename = sanitize_backup_filename(str(payload.get("filename") or "beyond-work-backup.xls"))
    content = str(payload.get("content") or "")
    if not content:
        raise ValueError("메일로 보낼 백업 파일 내용이 없습니다.")
    content_type = str(payload.get("contentType") or "application/vnd.ms-excel")
    exported_at = str(payload.get("exportedAt") or "")
    sender = os.environ.get("BACKUP_MAIL_FROM", "").strip() or "Beyond Work <onboarding@resend.dev>"
    body = {
        "from": sender,
        "to": [recipient],
        "subject": f"Beyond Work 백업 파일 · {exported_at[:10] or 'today'}",
        "html": (
            "<h2>Beyond Work 백업 파일</h2>"
            "<p>첨부된 Excel 파일은 앱 설정에서 다시 가져와 복원할 수 있습니다.</p>"
            f"<p>계정: {escape_html(user_email or recipient)}<br />생성: {escape_html(exported_at)}</p>"
        ),
        "attachments": [
            {
                "filename": filename,
                "content": base64.b64encode(content.encode("utf-8")).decode("ascii"),
                "content_type": content_type,
            }
        ],
    }
    request = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        data = json.loads(response.read().decode("utf-8") or "{}")
    return {"ok": True, "id": data.get("id") or "", "recipient": recipient}


def sanitize_backup_filename(value):
    safe = "".join(ch for ch in value if ch.isalnum() or ch in {"-", "_", ".", " "}).strip()
    return safe or "beyond-work-backup.xls"


def escape_html(value):
    return (
        str(value or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def normalize_http_status(status):
    try:
        code = int(status)
    except (TypeError, ValueError):
        return 502
    return code if 400 <= code <= 599 else 502
