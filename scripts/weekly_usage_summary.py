"""Summarize an explicit Beyond Work backup without outputting its contents."""

import argparse
from collections import Counter
from datetime import date, datetime, timedelta, timezone
from html import unescape
import json
from pathlib import Path
import re


KST = timezone(timedelta(hours=9))
HISTORY_LIMIT = 200
BACKUP_CELL = re.compile(
    r"<td>BEYOND_WORK_BACKUP_JSON</td>\s*<td>(.*?)</td>", re.DOTALL
)
NOTE_FIELDS = ("memo", "record", "wins", "carry", "lesson")


def load_backup(path):
    content = path.read_text(encoding="utf-8-sig")
    if content.lstrip().startswith("<"):
        match = BACKUP_CELL.search(content)
        if not match:
            raise ValueError("Beyond Work 백업 데이터가 들어 있는 .xls 파일을 사용하세요.")
        content = unescape(match[1])
    try:
        backup = json.loads(content)
    except ValueError:
        raise ValueError("Beyond Work 백업 데이터를 읽을 수 없습니다.") from None
    if (
        not isinstance(backup, dict)
        or backup.get("format") != "beyond-work-planner-backup"
        or not isinstance(backup.get("state"), dict)
        or not isinstance(backup["state"].get("days"), dict)
    ):
        raise ValueError("Beyond Work 백업 형식이 아닙니다.")
    return backup


def as_kst(value):
    if not isinstance(value, str):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed.astimezone(KST) if parsed.tzinfo else None


def summarize(backup, as_of):
    week_end = as_of - timedelta(days=as_of.weekday())
    week_start = week_end - timedelta(days=7)
    state = backup["state"]
    scheduled = Counter(task_rows=0, appointment_rows=0, merged_ranges=0, days_with_notes=0)
    for offset in range(7):
        day = state["days"].get((week_start + timedelta(days=offset)).isoformat(), {})
        scheduled["task_rows"] += sum(
            bool(str(task.get("text") or "").strip())
            for tasks in day.get("tasks", {}).values()
            for task in tasks
        )
        scheduled["appointment_rows"] += sum(
            bool(str(value or "").strip()) for value in day.get("appointments", {}).values()
        )
        scheduled["merged_ranges"] += len(day.get("appointmentMerges", {}))
        scheduled["days_with_notes"] += any(str(day.get(key) or "").strip() for key in NOTE_FIELDS)

    history = state.get("taskRecoveryHistory")
    recorded = None
    if isinstance(history, list):
        counts = Counter(completion_changes=0, deletes=0, other_changes=0)
        recorded_days = set()
        earliest = None
        for entry in history:
            at = as_kst(entry.get("at"))
            if at is None:
                continue
            earliest = at if earliest is None else min(at, earliest)
            if not (week_start <= at.date() < week_end):
                continue
            recorded_days.add(at.date())
            if entry.get("after") is None:
                counts["deletes"] += 1
            elif entry["after"].get("done") != (entry.get("before") or {}).get("done"):
                counts["completion_changes"] += 1
            else:
                counts["other_changes"] += 1
        recorded = {
            **counts,
            "days_with_recorded_changes": len(recorded_days),
            "history_may_be_truncated": len(history) >= HISTORY_LIMIT
            and (earliest is None or earliest.date() >= week_start),
        }

    exported_at = as_kst(backup.get("exportedAt"))
    return {
        "week_start_kst": week_start.isoformat(),
        "week_end_kst": (week_end - timedelta(days=1)).isoformat(),
        "exported_at_kst": exported_at.isoformat() if exported_at else None,
        "exported_after_week_end": exported_at.date() >= week_end if exported_at else None,
        "scheduled_day_records": dict(scheduled),
        "recorded_task_changes": recorded,
    }


def main():
    parser = argparse.ArgumentParser(description="플래너 백업에서 지난 월요일~일요일의 기록 건수를 집계합니다.")
    parser.add_argument("backup", type=Path, help="플래너 내보내기 .xls 또는 .beyondwork.json")
    parser.add_argument("--as-of", type=date.fromisoformat, default=datetime.now(KST).date(),
                        help="기준일 YYYY-MM-DD (기본값은 한국 날짜)")
    args = parser.parse_args()
    try:
        result = summarize(load_backup(args.backup), args.as_of)
    except (OSError, ValueError) as error:
        parser.exit(1, f"{error}\n")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
