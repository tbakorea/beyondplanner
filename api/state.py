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
        except DestructiveOverwriteError as exc:
            self.write_json(409, {"error": str(exc), "code": "destructive_overwrite_blocked"})
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


class DestructiveOverwriteError(Exception):
    pass


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
    if existing.get("exists") and is_destructive_overwrite(existing.get("state"), state):
        raise DestructiveOverwriteError("기존 플래너 데이터가 크게 줄어든 저장 요청이라 DB 보호를 위해 차단했습니다.")
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


def is_destructive_overwrite(previous, incoming):
    if os.environ.get("ALLOW_DESTRUCTIVE_PLANNER_SAVE", "").strip() == "1":
        return False
    previous_score = planner_content_score(previous)
    incoming_score = planner_content_score(incoming)
    if previous_score < 5:
        return False
    if incoming_score == 0:
        return True
    return previous_score - incoming_score >= 10 and incoming_score < previous_score * 0.2


def planner_content_score(source):
    if not isinstance(source, dict):
        return 0

    def has_text(value):
        if isinstance(value, dict):
            return any(has_text(item) for item in value.values())
        if isinstance(value, (list, tuple, set)):
            return any(has_text(item) for item in value)
        return bool(str(value or "").strip())

    def count_texts(values):
        return sum(1 for value in values if has_text(value))

    score = 0
    foundation = source.get("foundation") or {}
    score += count_texts([foundation.get("mission")])
    score += count_texts(foundation.get("values") or [])
    for role in foundation.get("roles") or []:
        if isinstance(role, dict):
            score += count_texts([role.get("goal"), role.get("renewal")])

    year = source.get("year") or {}
    score += count_texts(year.get("goals") or [])
    score += count_texts(year.get("future") or [])

    for month in (source.get("months") or {}).values():
        if isinstance(month, dict):
            score += count_texts([month.get("focus")])
            score += count_texts(month.get("projects") or [])

    for week in (source.get("weeks") or {}).values():
        if not isinstance(week, dict):
            continue
        for item in week.get("priorities") or []:
            if isinstance(item, dict) and (has_text(item.get("text")) or item.get("done")):
                score += 1
        for item in week.get("compass") or []:
            if isinstance(item, dict):
                score += count_texts([item.get("goal"), item.get("action")])
                score += count_texts(item.get("actions") or [])

    for day in (source.get("days") or {}).values():
        if not isinstance(day, dict):
            continue
        for task_group in (day.get("tasks") or {}).values():
            if not isinstance(task_group, list):
                continue
            for task in task_group:
                if isinstance(task, dict) and (
                    has_text(task.get("text"))
                    or task.get("done")
                    or task.get("status") not in {"", None, "미완료"}
                    or has_text(task.get("delegate"))
                ):
                    score += 1
        appointments = day.get("appointments") or {}
        appointment_values = appointments.values() if isinstance(appointments, dict) else appointments
        score += count_texts(appointment_values or [])
        score += len(day.get("appointmentMerges") or {})
        score += count_texts(day.get(field) for field in ("memo", "record", "wins", "carry", "lesson"))

    for rule in ((source.get("repeats") or {}).get("priorityTasks") or []):
        if isinstance(rule, dict) and has_text(rule.get("text")):
            score += 1

    score += count_texts((source.get("profile") or {}).values())

    notes = source.get("notes") or {}
    score += count_texts(notes.get("projects") or [])
    score += count_texts(notes.get("references") or [])
    score += count_texts([notes.get("freeform")])

    finance = source.get("finance") or {}
    money_fields = ("title", "amount", "dueDay", "memo", "taskDate", "repeatEndDate")
    money_rows = list(finance.get("fixed") or [])
    for rows in (finance.get("months") or {}).values():
        money_rows.extend(rows or [])
    for item in money_rows:
        if isinstance(item, dict) and any(has_text(item.get(field)) for field in money_fields):
            score += 1
    score += count_texts([finance.get("issueMemo"), finance.get("decisionMemo")])

    for project in ((source.get("projects") or {}).get("items") or []):
        if not isinstance(project, dict):
            continue
        project_fields = ("title", "owner", "startDate", "endDate", "goal", "nextAction", "dueDate", "budget", "actual", "notes")
        if any(has_text(project.get(field)) for field in project_fields):
            score += 1
        for item in project.get("finances") or []:
            if isinstance(item, dict) and any(has_text(item.get(field)) for field in ("title", "amount", "timing", "memo")):
                score += 1

    for sheet in ((source.get("customSheets") or {}).get("items") or []):
        if isinstance(sheet, dict):
            score += count_texts((sheet.get("cells") or {}).values())

    score += sum(1 for event in ((source.get("calendar") or {}).get("events") or []) if isinstance(event, dict) and has_text(event.get("title")))
    return score


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
