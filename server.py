#!/usr/bin/env python3
"""Serve Beyond Work and proxy AI questions to OpenAI.

Run:
  PLANNER_ENV=dev python3 server.py --port 8792
  PLANNER_ENV=prod OPENAI_API_KEY=... python3 server.py --port 8793
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import pathlib
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


ROOT = pathlib.Path(__file__).resolve().parent
PLANNER_ENV = os.environ.get("PLANNER_ENV", "dev").strip().lower() or "dev"


def load_env_file():
    for filename in (".env.local", ".env"):
        path = ROOT / filename
        if not path.exists():
            continue
        for raw_line in path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


load_env_file()


def get_state_file() -> pathlib.Path:
    explicit = os.environ.get("PLANNER_STATE_FILE", "").strip()
    if explicit:
        return pathlib.Path(explicit).expanduser().resolve()
    safe_env = "".join(ch for ch in PLANNER_ENV if ch.isalnum() or ch in {"-", "_"}) or "dev"
    return ROOT / f"planner-state.{safe_env}.json"


STATE_FILE = get_state_file()


class BeyondPlannerHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):  # noqa: N802
        path = self.path.split("?", 1)[0]
        if path == "/api/state":
            self.handle_get_state()
            return
        if path == "/api/config":
            self.write_json(200, {"environment": PLANNER_ENV, "storage": planner_storage()})
            return
        super().do_GET()

    def do_POST(self):  # noqa: N802
        path = self.path.split("?", 1)[0]
        if path == "/api/ask":
            self.handle_ai_question()
            return
        if path == "/api/auth":
            self.handle_auth()
            return
        if path == "/api/state":
            self.handle_save_state()
            return
        self.send_error(404, "Not found")

    def handle_get_state(self):
        token = bearer_token(self.headers)
        if planner_storage() == "supabase-db":
            if not token:
                self.write_json(401, {"error": "로그인 세션이 필요합니다."})
                return
            try:
                self.write_json(200, get_supabase_planner_state(token))
                return
            except urllib.error.HTTPError as exc:
                detail = exc.read().decode("utf-8", "replace")
                self.write_json(normalize_supabase_status(exc.code, detail), normalize_supabase_error_payload(detail, "Supabase DB 상태를 읽을 수 없습니다."))
                return
            except Exception as exc:
                self.write_json(502, {"error": "Supabase DB 연결 중 오류가 발생했습니다.", "detail": str(exc)})
                return

        if not STATE_FILE.exists():
            self.write_json(200, {"exists": False, "state": None, "updatedAt": ""})
            return
        try:
            envelope = json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            self.write_json(500, {"error": "저장된 플래너 데이터를 읽을 수 없습니다."})
            return
        envelope["exists"] = True
        self.write_json(200, envelope)

    def handle_save_state(self):
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

        token = bearer_token(self.headers)
        if planner_storage() == "supabase-db":
            if not token:
                self.write_json(401, {"error": "로그인 세션이 필요합니다."})
                return
            try:
                self.write_json(200, save_supabase_planner_state(token, state, payload))
                return
            except DestructiveOverwriteError as exc:
                self.write_json(409, {"error": str(exc), "code": "destructive_overwrite_blocked"})
                return
            except urllib.error.HTTPError as exc:
                detail = exc.read().decode("utf-8", "replace")
                self.write_json(normalize_supabase_status(exc.code, detail), normalize_supabase_error_payload(detail, "Supabase DB에 저장할 수 없습니다."))
                return
            except Exception as exc:
                self.write_json(502, {"error": "Supabase DB 저장 중 오류가 발생했습니다.", "detail": str(exc)})
                return

        envelope = {
            "state": state,
            "updatedAt": payload.get("updatedAt") or utc_now(),
        }
        try:
            tmp_file = STATE_FILE.with_suffix(".json.tmp")
            tmp_file.write_text(json.dumps(envelope, ensure_ascii=False, indent=2), encoding="utf-8")
            tmp_file.replace(STATE_FILE)
        except OSError:
            self.write_json(500, {"error": "플래너 데이터를 저장할 수 없습니다."})
            return

        self.write_json(200, {"ok": True, "updatedAt": envelope["updatedAt"]})

    def handle_auth(self):
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(content_length) or b"{}")
        except (ValueError, json.JSONDecodeError):
            self.write_json(400, {"error": "요청 JSON을 읽을 수 없습니다."})
            return

        action = str(payload.get("action", "")).strip().lower()
        if action not in {"signup", "login", "refresh", "update_password"}:
            self.write_json(400, {"error": "지원하지 않는 인증 요청입니다."})
            return

        try:
            result = call_supabase_auth(action, payload)
        except ValueError as exc:
            self.write_json(400, {"error": str(exc)})
            return
        except RuntimeError as exc:
            self.write_json(503, {"error": str(exc)})
            return
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")
            message = extract_supabase_error(detail) or "인증 서버 요청에 실패했습니다."
            self.write_json(exc.code, {"error": message})
            return
        except Exception as exc:  # pragma: no cover - runtime network boundary
            self.write_json(502, {"error": "인증 서버 연결 중 오류가 발생했습니다.", "detail": str(exc)})
            return

        self.write_json(200, result)

    def handle_ai_question(self):
        api_key = os.environ.get("OPENAI_API_KEY", "").strip()
        if not api_key:
            self.write_json(
                503,
                {
                    "error": "OPENAI_API_KEY 환경변수가 설정되어 있지 않습니다.",
                    "hint": "OPENAI_API_KEY=... python3 server.py --port 8790 로 실행하세요.",
                },
            )
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(content_length) or b"{}")
        except (ValueError, json.JSONDecodeError):
            self.write_json(400, {"error": "요청 JSON을 읽을 수 없습니다."})
            return

        question = str(payload.get("question", "")).strip()
        context = payload.get("context") or {}
        if not question:
            self.write_json(400, {"error": "질문을 입력하세요."})
            return

        prompt = build_prompt(question, context)
        model = os.environ.get("OPENAI_MODEL", "gpt-4.1-mini").strip() or "gpt-4.1-mini"
        request_payload = {
            "model": model,
            "input": [
                {
                    "role": "system",
                    "content": (
                        "너는 Beyond Work 플래너 안에서 작동하는 한국어 AI 코치다. "
                        "사용자의 가치, 목표, 오늘의 우선업무, 시간표, 메모를 근거로 짧고 실행 가능한 답변을 한다. "
                        "개인정보나 민감정보를 추정하거나 만들어내지 말고, 제공된 플래너 데이터에 근거하지 않는 내용은 추정이라고 밝혀라."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
        }

        try:
            answer = call_openai(api_key, request_payload)
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")
            self.write_json(exc.code, {"error": "OpenAI API 호출 실패", "detail": detail[:1000]})
            return
        except Exception as exc:  # pragma: no cover - runtime network boundary
            self.write_json(502, {"error": "AI 답변 생성 중 오류가 발생했습니다.", "detail": str(exc)})
            return

        self.write_json(200, {"answer": answer, "model": model})

    def write_json(self, status: int, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def build_prompt(question: str, context: dict) -> str:
    compact_context = json.dumps(context, ensure_ascii=False, indent=2)[:12000]
    return (
        f"사용자 질문:\n{question}\n\n"
        f"현재 플래너 요약 데이터:\n{compact_context}\n\n"
        "답변 형식:\n"
        "1. 질문에 대한 직접 답변을 먼저 말한다.\n"
        "2. 플래너 데이터에서 근거를 2~4개만 든다.\n"
        "3. 바로 실행할 다음 행동을 1~3개 제안한다.\n"
        "4. 전체 답변은 700자 이내로 간결하게 작성한다."
    )


def call_openai(api_key: str, payload: dict) -> str:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        data = json.loads(response.read().decode("utf-8"))
    return extract_response_text(data)


def call_supabase_auth(action: str, payload: dict) -> dict:
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").strip().rstrip("/")
    anon_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "").strip()
    if not supabase_url or not anon_key:
        raise RuntimeError("Supabase 환경변수가 설정되어 있지 않습니다.")

    if action == "refresh":
        refresh_token = str(payload.get("refreshToken") or payload.get("refresh_token") or "").strip()
        if not refresh_token:
            raise ValueError("갱신 토큰이 필요합니다.")
        endpoint = f"{supabase_url}/auth/v1/token?grant_type=refresh_token"
        request_payload = {"refresh_token": refresh_token}
        email = ""
        method = "POST"
    elif action == "update_password":
        access_token = str(payload.get("accessToken") or payload.get("access_token") or "").strip()
        password = str(payload.get("password", ""))
        if not access_token:
            raise ValueError("로그인 세션이 필요합니다.")
        if len(password) < 6:
            raise ValueError("비밀번호는 6자리 이상으로 설정하세요.")
        endpoint = f"{supabase_url}/auth/v1/user"
        request_payload = {"password": password}
        email = ""
        method = "PUT"
    else:
        email = str(payload.get("email", "")).strip().lower()
        password = str(payload.get("password", ""))
        if not email or not password:
            raise ValueError("이메일과 비밀번호가 필요합니다.")
        method = "POST"

    if action == "signup":
        name = str(payload.get("name", "")).strip()
        tier = normalize_tier(str(payload.get("tier", "staff")).strip())
        endpoint = f"{supabase_url}/auth/v1/signup"
        request_payload = {"email": email, "password": password, "data": {"name": name, "tier": tier}}
    elif action == "login":
        endpoint = f"{supabase_url}/auth/v1/token?grant_type=password"
        request_payload = {"email": email, "password": password}

    request = urllib.request.Request(
        endpoint,
        data=json.dumps(request_payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "apikey": anon_key,
            "Authorization": f"Bearer {access_token if action == 'update_password' else anon_key}",
            "Content-Type": "application/json",
        },
        method=method,
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
        "message": "비밀번호가 변경되었습니다." if action == "update_password" else "",
    }


def supabase_configured() -> bool:
    return bool(os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").strip() and os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "").strip())


def planner_storage() -> str:
    requested = os.environ.get("PLANNER_STORAGE", "").strip().lower()
    if requested in {"file", "local"}:
        return "file"
    return "supabase-db"


def bearer_token(headers) -> str:
    value = headers.get("Authorization", "")
    if not value.lower().startswith("bearer "):
        return ""
    return value.split(" ", 1)[1].strip()


class DestructiveOverwriteError(Exception):
    pass


def supabase_base() -> tuple[str, str]:
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").strip().rstrip("/")
    anon_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "").strip()
    if not supabase_url or not anon_key:
        raise RuntimeError("Supabase 환경변수가 설정되어 있지 않습니다.")
    return supabase_url, anon_key


def call_supabase_user(token: str) -> dict:
    supabase_url, anon_key = supabase_base()
    request = urllib.request.Request(
        f"{supabase_url}/auth/v1/user",
        headers={"apikey": anon_key, "Authorization": f"Bearer {token}"},
        method="GET",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def get_supabase_planner_state(token: str) -> dict:
    supabase_url, anon_key = supabase_base()
    user = call_supabase_user(token)
    user_id = user.get("id")
    if not user_id:
        raise urllib.error.HTTPError("", 401, "인증된 사용자 정보를 확인할 수 없습니다.", {}, None)
    request = urllib.request.Request(
        f"{supabase_url}/rest/v1/planner_states?user_id=eq.{user_id}&select=state,updated_at&limit=1",
        headers={
            "apikey": anon_key,
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        },
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


def save_supabase_planner_state(token: str, state: dict, payload: dict) -> dict:
    supabase_url, anon_key = supabase_base()
    user = call_supabase_user(token)
    user_id = user.get("id")
    if not user_id:
        raise urllib.error.HTTPError("", 401, "인증된 사용자 정보를 확인할 수 없습니다.", {}, None)
    updated_at = payload.get("updatedAt") or utc_now()
    existing = get_supabase_planner_state(token)
    if existing.get("exists") and is_newer_timestamp(existing.get("updatedAt"), updated_at):
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


def normalize_tier(tier: str) -> str:
    return tier if tier in {"ceo", "director", "manager", "staff"} else "staff"


def is_destructive_overwrite(previous: dict, incoming: dict) -> bool:
    if os.environ.get("ALLOW_DESTRUCTIVE_PLANNER_SAVE", "").strip() == "1":
        return False
    previous_score = planner_content_score(previous)
    incoming_score = planner_content_score(incoming)
    if previous_score < 5:
        return False
    if incoming_score == 0:
        return True
    return previous_score - incoming_score >= 10 and incoming_score < previous_score * 0.2


def planner_content_score(source: dict) -> int:
    if not isinstance(source, dict):
        return 0

    def has_text(value) -> bool:
        return bool(str(value or "").strip())

    def count_texts(values) -> int:
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


def extract_supabase_error(detail: str) -> str:
    try:
        data = json.loads(detail)
    except json.JSONDecodeError:
        return detail[:300]
    return str(data.get("msg") or data.get("message") or data.get("error_description") or data.get("error") or "")


def normalize_supabase_status(status: int, detail: str) -> int:
    if "planner_states" in detail and "Could not find the table" in detail:
        return 503
    return status


def normalize_supabase_error_payload(detail: str, fallback: str) -> dict:
    message = extract_supabase_error(detail) or fallback
    if "planner_states" in detail and "Could not find the table" in detail:
        return {
            "error": "Supabase DB 테이블이 아직 없습니다. supabase/planner_states.sql을 SQL Editor에서 실행해야 저장됩니다.",
            "code": "planner_states_missing",
        }
    return {"error": message}


def is_newer_timestamp(left: str, right: str) -> bool:
    return timestamp_ms(left) > timestamp_ms(right)


def timestamp_ms(value: str) -> float:
    if not value:
        return 0
    try:
        normalized = str(value).replace("Z", "+00:00")
        return dt.datetime.fromisoformat(normalized).timestamp() * 1000
    except ValueError:
        return 0


def extract_response_text(data: dict) -> str:
    if isinstance(data.get("output_text"), str) and data["output_text"].strip():
        return data["output_text"].strip()
    chunks: list[str] = []
    for item in data.get("output", []):
        for content in item.get("content", []):
            if content.get("type") in {"output_text", "text"} and content.get("text"):
                chunks.append(str(content["text"]))
    return "\n".join(chunks).strip() or "AI 답변을 읽지 못했습니다."


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")


def main():
    parser = argparse.ArgumentParser(description="Beyond Work local server")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8790)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), BeyondPlannerHandler)
    print(f"Beyond Work server: http://127.0.0.1:{args.port}/index.html")
    print(f"Dashboard: http://127.0.0.1:{args.port}/dashboard/index.html")
    print(f"Environment: {PLANNER_ENV}")
    print(f"Storage: {planner_storage()}")
    server.serve_forever()


if __name__ == "__main__":
    main()
