// Run: node tests/postpone_regression.js
function runPostponeRegression(source) {
  const names = ["applyInactiveTaskStatus", "getTaskMarker", "getTaskMarkerLabel", "shouldStrikeTask",
    "getTaskStatusControl", "formatCompactMonthDay", "schedulePostponedTask", "removePostponedTaskOccurrence",
    "getPostponeRestorePriority", "setTaskCompletionState"];
  const functions = names.map(name => {
    const match = source.match(new RegExp(`function ${name}\\([^\\n]*\\{\\n[\\s\\S]*?\\n\\}`));
    if (!match) throw new Error(`Missing ${name}`);
    return match[0];
  }).join("\n");
  return new Function(`
    const assert = (ok, label) => { if (!ok) throw new Error(label); };
    const TASK_COMPLETION_ALIAS_KEYS = ["completed", "checked", "complete", "isDone"];
    const selectedDate = "2026-10-26", iso = x => x;
    const parseDate = x => new Date(x + "T00:00:00");
    const escapeAttr = String, escapeHtml = String;
    const priorities = [["A"], ["B"], ["C"]];
    const state = { days: {} };
    const ensureDay = (key = selectedDate) => state.days[key] ||= { tasks: { A: [], B: [], C: [] } };
    const normalizeDayTasks = () => {};
    let seq = 0, saves = 0;
    const newTaskId = () => "new-" + ++seq;
    const stampTaskLifecycleMutation = task => task.lifecycleUpdatedAt = "2026-10-26T01:00:00Z";
    const clearTaskCompletionRecord = task => { setTaskCompletionState(task, false); task.completedAt = ""; task.completedDate = ""; };
    const isTaskCompleted = task => task.status === "완료";
    const guardDailyEdit = () => false;
    const clearTaskScheduleLinkForInactive = () => {};
    const markCarryoverIdentityDeletedForDate = () => {};
    const removeCarryoverCopiesMatchingRef = () => {};
    const getCarryoverDeleteFromKey = key => key;
    const assignTaskOrder = () => {};
    const markDailyTaskDeletedForDate = () => {};
    const saveCriticalPlannerAction = () => saves++;
    const renderDayAfterTaskMutation = () => {};
    ${functions}
    const task = {id:"original",text:"보고서 제출",status:"완료",done:true,priority:"B",delegate:"기존 담당자"};
    ensureDay().tasks.B.push(task);
    applyInactiveTaskStatus(task, "연기");
    assert(task.status === "연기" && !task.done && task.postponeMode === "undated" && !task.postponeDate, "postpone starts undated");
    assert(task.delegate === "", "postpone clears delegated owner");
    assert(getTaskMarkerLabel(getTaskMarker(task)) === "→" && shouldStrikeTask(task), "arrow and strike");
    assert(getTaskStatusControl(task, "연기").includes('>미정</button>'), "undated button label");
    schedulePostponedTask(task, "B", "2026-10-28");
    assert(task.postponeDate === "2026-10-28" && task.status === "연기", "source records chosen date");
    assert(ensureDay("2026-10-28").tasks.B.length === 1 && !ensureDay("2026-10-28").tasks.B[0].done, "one open task on target date with original priority");
    schedulePostponedTask(task, "B", "2026-10-28");
    assert(ensureDay("2026-10-28").tasks.B.length === 1, "same date does not duplicate");
    schedulePostponedTask(task, "B", "2026-10-29");
    assert(ensureDay("2026-10-28").tasks.B.length === 0 && ensureDay("2026-10-29").tasks.B.length === 1, "new date removes old target");
    assert(getTaskStatusControl(task,"연기").includes('>10/29</button>') && saves === 3, "date label and persistence requests");
    return "9 postpone regression checks passed";
  `)();
}

if (typeof require !== "undefined" && require.main === module) {
  const fs = require("node:fs"), path = require("node:path");
  console.log(runPostponeRegression(fs.readFileSync(path.join(__dirname, "../dashboard/app.js"), "utf8")));
}
