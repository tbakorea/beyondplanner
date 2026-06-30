import json
import os
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802
        storage = planner_storage()
        self.write_json(200, {"environment": os.environ.get("PLANNER_ENV", "prod"), "storage": storage})

    def write_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def planner_storage():
    requested = os.environ.get("PLANNER_STORAGE", "").strip().lower()
    if requested in {"file", "local"}:
        return "file"
    return "supabase-db" if os.environ.get("NEXT_PUBLIC_SUPABASE_URL") and os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") else "unconfigured"
