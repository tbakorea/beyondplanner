import importlib.util
import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


def load_module(name, relative_path):
    spec = importlib.util.spec_from_file_location(name, ROOT / relative_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


today_api = load_module("planner_today_api", "api/today.py")
state_api = load_module("planner_state_api_for_slice", "api/state.py")
local_server = load_module("planner_local_server_for_slice", "server.py")


class TodaySliceTests(unittest.TestCase):
    def test_requested_date_accepts_iso_date(self):
        self.assertEqual(today_api.requested_date("/api/today?date=2026-10-13"), "2026-10-13")

    def test_requested_date_rejects_invalid_date(self):
        self.assertEqual(today_api.requested_date("/api/today?date=2026-02-30"), "")
        self.assertEqual(today_api.requested_date("/api/today"), "")

    def test_week_starts_on_sunday(self):
        self.assertEqual(today_api.start_of_week("2026-10-11"), "2026-10-11")
        self.assertEqual(today_api.start_of_week("2026-10-13"), "2026-10-11")
        self.assertEqual(today_api.start_of_week("2026-10-17"), "2026-10-11")

    def test_slice_schema_errors_fall_back_to_legacy_state(self):
        self.assertTrue(today_api.slice_schema_unavailable("Could not find the function get_planner_today"))
        self.assertTrue(today_api.slice_schema_unavailable('relation "planner_tasks" does not exist'))
        self.assertFalse(today_api.slice_schema_unavailable("permission denied"))

    def test_state_sync_date_validation(self):
        self.assertEqual(state_api.valid_iso_date("2026-10-13"), "2026-10-13")
        self.assertEqual(state_api.valid_iso_date("2026-13-01"), "")
        self.assertEqual(state_api.valid_iso_date(None), "")

    def test_local_server_uses_same_date_and_week_rules(self):
        self.assertEqual(local_server.request_date("/api/today?date=2026-10-13"), "2026-10-13")
        self.assertEqual(local_server.request_date("/api/today?date=bad"), "")
        self.assertEqual(local_server.planner_week_start("2026-10-13"), "2026-10-11")

    def test_local_server_slice_schema_fallback(self):
        self.assertTrue(local_server.slice_schema_unavailable("Could not find the function get_planner_today"))
        self.assertFalse(local_server.slice_schema_unavailable("permission denied"))


if __name__ == "__main__":
    unittest.main()
