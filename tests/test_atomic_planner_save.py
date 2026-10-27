import contextlib
import importlib.util
import io
import json
import pathlib
import unittest
import urllib.parse
from unittest.mock import patch


ROOT = pathlib.Path(__file__).resolve().parents[1]


def load(name, file):
    spec = importlib.util.spec_from_file_location(name, ROOT / file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


API = load("atomic_api", "api/state.py")
SERVER = load("atomic_server", "server.py")


class AtomicSaveTests(unittest.TestCase):
    def exercise(self, module, local=False, race=False):
        old_revision = "2026-10-27T07:00:00+00:00"
        newer_revision = "2026-10-27T07:01:00+00:00"
        old = {"exists": True, "updatedAt": old_revision, "state": {"days": {}}}
        latest = {"exists": True, "updatedAt": newer_revision, "state": {"memo": "latest device edit"}}
        incoming = {"memo": "completed and schedule edited"}
        read_name = "get_supabase_planner_state" if local else "get_planner_state"
        save = module.save_supabase_planner_state if local else module.save_planner_state
        with contextlib.ExitStack() as stack:
            stack.enter_context(patch.object(module, "supabase_base", return_value=("https://example.test", "anon")))
            if local:
                stack.enter_context(patch.object(module, "call_supabase_user", return_value={"id": "user-test"}))
            else:
                stack.enter_context(patch.object(module, "user_id_from_access_token", return_value="user-test"))
            stack.enter_context(patch.object(module, read_name, side_effect=[old, latest] if race else [old]))
            stack.enter_context(patch.object(module, "is_destructive_overwrite", return_value=False))
            sync = stack.enter_context(patch.object(module, "sync_supabase_planner_slices" if local else "sync_planner_slices"))
            rows = [] if race else [{"updated_at": newer_revision}]
            send = stack.enter_context(patch.object(module.urllib.request, "urlopen", return_value=io.BytesIO(json.dumps(rows).encode())))
            result = save("token", incoming, {"baseUpdatedAt": old_revision, "activeDate": "2026-10-27", "activeWeek": "2026-10-25"})
            request = send.call_args.args[0]
            self.assertEqual(request.method, "PATCH")
            query = urllib.parse.parse_qs(urllib.parse.urlparse(request.full_url).query)
            self.assertEqual(query["user_id"], ["eq.user-test"])
            self.assertEqual(query["updated_at"], ["eq." + old_revision])
            self.assertNotIn("merge-duplicates", request.headers.get("Prefer", ""))
            self.assertEqual(json.loads(request.data)["state"], incoming)
            if race:
                self.assertTrue(result["conflict"])
                self.assertEqual(result["state"], latest["state"])
                self.assertEqual(result["updatedAt"], newer_revision)
                sync.assert_not_called()
            else:
                self.assertTrue(result["ok"])
                self.assertFalse(result.get("conflict", False))
                sync.assert_called_once()

    def test_api_conditions_write_on_revision(self):
        self.exercise(API)

    def test_api_racing_write_returns_latest_without_claiming_saved(self):
        self.exercise(API, race=True)

    def test_local_server_conditions_write_on_revision(self):
        self.exercise(SERVER, local=True)

    def test_local_server_racing_write_returns_latest(self):
        self.exercise(SERVER, local=True, race=True)


if __name__ == "__main__":
    unittest.main()
