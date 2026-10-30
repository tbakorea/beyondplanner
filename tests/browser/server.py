"""Isolated HTTP test store. Never connects to Supabase or a real account."""
import copy, datetime, json, pathlib, threading, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
ROOT = pathlib.Path(__file__).resolve().parents[2]
lock = threading.Lock()
revision = 1
state = {}
delay = 0

def reset():
    global state, revision, delay
    today = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).date().isoformat()
    state = {"days": {today: {"tasks": {"A": [
        {"id": f"qa-{i}", "text": f"QA 업무 {i:02}", "done": False, "status": "미완료"}
        for i in range(1, 21)], "B": [], "C": []},
        "appointments": {"10:00": "QA 일정"}}}, "weeks": {}, "months": {}}
    yesterday = (datetime.date.fromisoformat(today)-datetime.timedelta(days=1)).isoformat()
    state['days'][yesterday] = {'weather': {'date':yesterday,'icon':'🌧️','code':61,'summary':'비','tempMin':4,'tempMax':12,'label':'울산','source':'qa-fixture'}}
    revision, delay = 1, 0

def stamp():
    return f"2026-01-01T00:00:{revision:02}.000Z" if revision < 60 else f"2026-01-01T00:{revision//60:02}:{revision%60:02}.000Z"

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw): super().__init__(*a, directory=str(ROOT), **kw)
    def log_message(self, *args): pass
    def reply(self, payload, status=200):
        data=json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(status); self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store"); self.end_headers(); self.wfile.write(data)
    def do_GET(self):
        path=self.path.split("?")[0]
        if path == "/api/state":
            with lock: payload={"exists":True,"state":copy.deepcopy(state),"updatedAt":stamp(),"storage":"supabase-db"}
            return self.reply(payload)
        if path == "/api/config": return self.reply({"storage":"supabase-db"})
        if path == "/qa/snapshot":
            with lock: payload={"state":copy.deepcopy(state),"updatedAt":stamp()}
            return self.reply(payload)
        if path.startswith("/api/"): return self.reply({})
        return super().do_GET()
    def do_POST(self):
        global state, revision, delay
        body=json.loads(self.rfile.read(int(self.headers.get("Content-Length",0))) or b"{}")
        if self.path == "/qa/reset":
            with lock: reset()
            return self.reply({"ok":True})
        if self.path == "/qa/delay":
            delay=float(body.get("seconds",0)); return self.reply({"ok":True})
        if self.path != "/api/state": return self.reply({},404)
        time.sleep(delay)
        with lock:
            if body.get("baseUpdatedAt") != stamp():
                payload={"ok":True,"stale":True,"conflict":True,"state":copy.deepcopy(state),"updatedAt":stamp()}
            else:
                state=body["state"]; revision+=1
                payload={"ok":True,"updatedAt":stamp()}
        return self.reply(payload)
reset()
ThreadingHTTPServer(("127.0.0.1",8765),Handler).serve_forever()
