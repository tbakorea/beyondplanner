import json
from datetime import date
from html import escape
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase

from scripts.weekly_usage_summary import load_backup, summarize


class WeeklyUsageSummaryTests(TestCase):
    def test_week_boundary_uses_korean_change_date_and_ignores_private_text(self):
        private = "개인 업무 제목"
        edited = {"done": False, "text": private}
        completed = {"done": True, "text": private}
        backup = {
            "format": "beyond-work-planner-backup",
            "exportedAt": "2026-11-15T15:00:00Z",
            "account": "example@example.test",
            "state": {
                "days": {
                    "2026-11-08": {"tasks": {"A": [edited]}},
                    "2026-11-09": {
                        "tasks": {"A": [edited, {"text": " "}]},
                        "appointments": {"08:00": private, "09:00": ""},
                        "appointmentMerges": {"08:00": 2},
                        "memo": private,
                    },
                    "2026-11-16": {"tasks": {"A": [completed]}},
                },
                "taskRecoveryHistory": [
                    {"at": "2026-11-08T14:59:59Z", "before": edited, "after": None},
                    {"at": "2026-11-08T15:00:00Z", "dayKey": "2026-11-01",
                     "before": edited, "after": completed},
                    {"at": "2026-11-15T14:59:59Z", "before": edited, "after": None},
                    {"at": "2026-11-15T15:00:00Z", "before": edited, "after": None},
                ],
            },
        }
        with TemporaryDirectory() as directory:
            for extension, content in [
                ("beyondwork.json", json.dumps(backup, ensure_ascii=False)),
                ("xls", "<table><tr><td>BEYOND_WORK_BACKUP_JSON</td><td>"
                 + escape(json.dumps(backup, ensure_ascii=False)) + "</td></tr></table>"),
            ]:
                with self.subTest(extension=extension):
                    path = Path(directory) / f"backup.{extension}"
                    path.write_text(content, encoding="utf-8")
                    result = summarize(load_backup(path), date(2026, 11, 18))
                    self.assertEqual(result["week_start_kst"], "2026-11-09")
                    self.assertEqual(result["week_end_kst"], "2026-11-15")
                    self.assertTrue(result["exported_after_week_end"])
                    self.assertEqual(result["scheduled_day_records"], {
                        "task_rows": 1, "appointment_rows": 1, "merged_ranges": 1, "days_with_notes": 1,
                    })
                    self.assertEqual(result["recorded_task_changes"], {
                        "completion_changes": 1, "deletes": 1, "other_changes": 0,
                        "days_with_recorded_changes": 2, "history_may_be_truncated": False,
                    })
                    self.assertNotIn(private, str(result))
                    self.assertNotIn(backup["account"], str(result))

    def test_missing_and_truncated_history_are_distinguishable(self):
        as_of = date(2026, 11, 16)
        state = {"days": {}}
        backup = {"state": state, "exportedAt": "2026-11-12T12:00:00Z"}
        result = summarize(backup, as_of)
        self.assertFalse(result["exported_after_week_end"])
        self.assertIsNone(result["recorded_task_changes"])
        state["taskRecoveryHistory"] = [
            {"at": "2026-11-15T00:00:00Z", "before": {}, "after": {}}
        ] * 200
        history = summarize(backup, as_of)["recorded_task_changes"]
        self.assertEqual(history["other_changes"], 200)
        self.assertTrue(history["history_may_be_truncated"])
