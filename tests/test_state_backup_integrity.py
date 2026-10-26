import base64
import contextlib
import importlib.util
import io
import json
import pathlib
import unittest
from unittest.mock import patch


ROOT = pathlib.Path(__file__).resolve().parents[1]


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


state_api = load("state_integrity", "api/state.py")
mail_api = load("mail_integrity", "api/email-backup.py")


class StateBackupIntegrityTests(unittest.TestCase):
    def setUp(self):
        self.task = {"id": "task-test", "text": "보고서 검토", "status": "위임",
                     "done": False, "delegate": "김담당", "lifecycleUpdatedAt": "2026-10-26T01:00:00Z"}
        self.state = {"days": {"2026-10-26": {"tasks": {"A": [self.task]}}}}

    def save_context(self, existing):
        stack = contextlib.ExitStack()
        stack.enter_context(patch.object(state_api, "supabase_base", return_value=("https://example.test", "anon")))
        stack.enter_context(patch.object(state_api, "user_id_from_access_token", return_value="user-test"))
        stack.enter_context(patch.object(state_api, "get_planner_state", return_value=existing))
        return stack

    def test_stale_device_cannot_overwrite_newer_server_state(self):
        existing = {"exists": True, "updatedAt": "2026-10-26T02:00:00Z", "state": self.state}
        with self.save_context(existing), patch.object(state_api.urllib.request, "urlopen") as send:
            result = state_api.save_planner_state("token", {}, {"baseUpdatedAt": "2026-10-26T01:00:00Z"})
        self.assertTrue(result["conflict"])
        self.assertEqual(result["state"], self.state)
        send.assert_not_called()

    def test_missing_base_cannot_overwrite_existing_account(self):
        with self.save_context({"exists": True, "updatedAt": "2026-10-26T02:00:00Z", "state": self.state}):
            self.assertTrue(state_api.save_planner_state("token", {}, {})["conflict"])

    def test_save_preserves_delegation_and_survives_optional_slice_failure(self):
        response = io.BytesIO(json.dumps([{"updated_at": "2026-10-26T03:00:00Z"}]).encode())
        with self.save_context({"exists": False}), patch.object(state_api.urllib.request, "urlopen", return_value=response) as send, patch.object(state_api, "sync_planner_slices", side_effect=RuntimeError("offline")):
            result = state_api.save_planner_state("token", self.state, {"activeDate": "2026-10-26", "activeWeek": "2026-10-25"})
        saved = json.loads(send.call_args.args[0].data)[0]["state"]
        self.assertEqual(saved, self.state)
        self.assertTrue(result["ok"])
        self.assertFalse(result["slicesSynced"])

    def test_backup_attachment_preserves_korean_and_restorable_state(self):
        content = json.dumps({"format": "beyond-work-planner-backup", "version": 2, "state": self.state}, ensure_ascii=False)
        with patch.dict(mail_api.os.environ, {"RESEND_API_KEY": "test-only"}), patch.object(mail_api.urllib.request, "urlopen", return_value=io.BytesIO(b'{"id":"mail-test"}')) as send:
            result = mail_api.send_backup_email({"email": "test@example.test"}, {"content": content})
        body = json.loads(send.call_args.args[0].data)
        restored = json.loads(base64.b64decode(body["attachments"][0]["content"]).decode("utf-8"))
        self.assertEqual(restored["state"], self.state)
        self.assertTrue(result["ok"])

    def test_mail_configuration_failure_is_not_reported_as_success(self):
        with patch.dict(mail_api.os.environ, {}, clear=True):
            with self.assertRaises(RuntimeError):
                mail_api.send_backup_email({"email": "test@example.test"}, {"content": "backup"})


if __name__ == "__main__":
    unittest.main()
