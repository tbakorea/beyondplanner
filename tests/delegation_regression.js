// Run with Node: node tests/delegation_regression.js
function runDelegationRegression(source) {
  const extract = (name) => {
    const match = source.match(new RegExp(`function ${name}\\([^\\n]*\\{\\n[\\s\\S]*?\\n\\}`));
    if (!match) throw new Error(`Missing function: ${name}`);
    return match[0];
  };
  const names = ["updateTaskDelegate", "shouldStrikeTask", "getTaskMarker", "getTaskMarkerLabel",
    "isTaskCompleted", "isNonCompletionTaskStatus", "isTaskCompletionTruthyValue", "isTaskCompletionFalsyValue",
    "isTaskResolvedForDate", "createPlannerBackupEnvelope", "parsePlannerImportPayload"];
  const run = new Function(`
    const TASK_NON_COMPLETION_STATUSES = ["위임", "취소", "연기", "진행중"];
    const isPlainPlannerObject = x => !!x && typeof x === "object";
    const isTaskDeletedFromDate = () => false, isCarryoverCompletedOn = () => false, hasTaskCompletionRecord = () => false;
    let saveCount = 0;
    const stampTaskLifecycleMutation = task => task.lifecycleUpdatedAt = "2026-10-26T03:00:00Z";
    const saveState = () => saveCount++;
    const selectedDate = "2026-10-26", iso = x => x;
    const getAuthSession = () => ({ email: "test@example.test" });
    const state = { days: { "2026-10-26": { tasks: { A: [] } } } };
    ${names.map(extract).join("\n")}
    const assert = (ok, label) => { if (!ok) throw new Error(label); };
    const task = {id:"test", text:"검토", status:"위임", done:true, completed:true, delegate:"기존"};
    state.days[selectedDate].tasks.A.push(task);
    assert(!isTaskCompleted(task), "위임 must not count as completion even with legacy completion flags");
    assert(shouldStrikeTask(task), "위임 must strike through");
    assert(getTaskMarkerLabel(getTaskMarker(task)) === "↗", "위임 arrow");
    assert(isTaskResolvedForDate(task, "2026-10-27"), "위임 must stop carryover");
    updateTaskDelegate(task, "김담당");
    assert(task.delegate === "김담당" && task.lifecycleUpdatedAt && saveCount === 1, "owner change must stamp and save");
    updateTaskDelegate(task, "");
    assert(task.delegate === "" && saveCount === 2, "owner can be cleared and saved");
    const restored = parsePlannerImportPayload(JSON.stringify(createPlannerBackupEnvelope()));
    assert(JSON.stringify(restored.state) === JSON.stringify(state), "backup JSON must roundtrip delegation");
    let rejected = false;
    try { parsePlannerImportPayload("PK invalid xlsx"); } catch { rejected = true; }
    assert(rejected, "unsupported xlsx must be rejected");
    return "8 delegation / backup regression checks passed";
  `);
  return run();
}

if (typeof require !== "undefined" && require.main === module) {
  const fs = require("node:fs");
  const path = require("node:path");
  console.log(runDelegationRegression(fs.readFileSync(path.join(__dirname, "../dashboard/app.js"), "utf8")));
}
