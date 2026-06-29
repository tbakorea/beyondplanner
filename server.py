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
            self.write_json(200, {"environment": PLANNER_ENV, "stateFile": STATE_FILE.name})
            return
        super().do_GET()

    def do_POST(self):  # noqa: N802
        path = self.path.split("?", 1)[0]
        if path == "/api/ask":
            self.handle_ai_question()
            return
        if path == "/api/state":
            self.handle_save_state()
            return
        self.send_error(404, "Not found")

    def handle_get_state(self):
        if not STATE_FILE.exists():
            self.write_json(200, {"exists": False, "state": None, "updatedAt": "", "deviceId": ""})
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

        envelope = {
            "state": state,
            "updatedAt": payload.get("updatedAt") or utc_now(),
            "deviceId": str(payload.get("deviceId") or ""),
        }
        try:
            tmp_file = STATE_FILE.with_suffix(".json.tmp")
            tmp_file.write_text(json.dumps(envelope, ensure_ascii=False, indent=2), encoding="utf-8")
            tmp_file.replace(STATE_FILE)
        except OSError:
            self.write_json(500, {"error": "플래너 데이터를 저장할 수 없습니다."})
            return

        self.write_json(200, {"ok": True, "updatedAt": envelope["updatedAt"]})

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
    print(f"State file: {STATE_FILE}")
    server.serve_forever()


if __name__ == "__main__":
    main()
