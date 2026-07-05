import json
import os
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_POST(self):  # noqa: N802
        try:
            user = require_signed_in_user(self.headers)
        except RuntimeError as exc:
            self.write_json(503, {"error": str(exc)})
            return
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace") if exc.fp else str(exc.reason or "")
            self.write_json(normalize_http_status(exc.code), {"error": "로그인 세션을 확인할 수 없습니다.", "detail": detail[:500]})
            return

        if user and not ai_allowed_for_user(user):
            self.write_json(
                403,
                {
                    "error": "현재 계정은 AI 답변 기능을 사용할 수 없습니다.",
                    "hint": "AI 기능은 비용이 발생하므로 허용된 계정 또는 향후 유료 플랜에서만 제공됩니다.",
                },
            )
            return

        api_key = os.environ.get("OPENAI_API_KEY", "").strip()
        if not api_key:
            self.write_json(
                503,
                {
                    "error": "OPENAI_API_KEY 환경변수가 설정되어 있지 않습니다.",
                    "hint": "Vercel Project Settings > Environment Variables에 OPENAI_API_KEY를 추가한 뒤 재배포하세요.",
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
        if not isinstance(context, dict):
            context = {}

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
                {"role": "user", "content": build_prompt(question, context)},
            ],
        }

        try:
            answer = call_openai(api_key, request_payload)
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")
            self.write_json(normalize_http_status(exc.code), {"error": "OpenAI API 호출 실패", "detail": detail[:1000]})
            return
        except Exception as exc:
            self.write_json(502, {"error": "AI 답변 생성 중 오류가 발생했습니다.", "detail": str(exc)})
            return

        self.write_json(200, {"answer": answer, "model": model})

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
    chunks = []
    for item in data.get("output", []):
        for content in item.get("content", []):
            if isinstance(content, dict) and content.get("type") in {"output_text", "text"} and content.get("text"):
                chunks.append(str(content["text"]))
    if not chunks:
        for choice in data.get("choices", []):
            message = choice.get("message") or {}
            if isinstance(message.get("content"), str):
                chunks.append(message["content"])
    return "\n".join(chunks).strip() or "AI 답변을 읽지 못했습니다."


def require_signed_in_user(headers):
    if not supabase_configured():
        return {}
    token = bearer_token(headers)
    if not token:
        raise urllib.error.HTTPError("", 401, "로그인 세션이 필요합니다.", {}, None)
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").strip().rstrip("/")
    anon_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "").strip()
    request = urllib.request.Request(
        f"{supabase_url}/auth/v1/user",
        headers={"apikey": anon_key, "Authorization": f"Bearer {token}"},
        method="GET",
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        return json.loads(response.read().decode("utf-8"))


def ai_allowed_for_user(user: dict) -> bool:
    email = str(user.get("email") or "").strip().lower()
    return email in allowed_ai_emails()


def allowed_ai_emails() -> set[str]:
    configured = os.environ.get("AI_ALLOWED_EMAILS", "")
    values = [item.strip().lower() for item in configured.split(",") if item.strip()]
    if values:
        return set(values)
    return {"j3010@ymail.com", "projch@naver.com"}


def supabase_configured() -> bool:
    return bool(os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").strip() and os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "").strip())


def bearer_token(headers) -> str:
    value = headers.get("Authorization", "")
    if not value.lower().startswith("bearer "):
        return ""
    return value.split(" ", 1)[1].strip()


def normalize_http_status(status):
    try:
        code = int(status)
    except (TypeError, ValueError):
        return 502
    return code if 400 <= code <= 599 else 502
