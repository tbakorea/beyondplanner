// Exercise the production module with a year of history and real carryover chains.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const source = fs.readFileSync(path.join(__dirname, "../dashboard/app.js"), "utf8");
const end = source.lastIndexOf("\nsetup().catch(");
assert(end > 0, "production startup entry point must exist");
const storage = new Map();
storage.set("beyondWorkAuthSession.v1", JSON.stringify({ email: "boot-test@example.test", provider: "supabase", accessToken: "fixture-only" }));
const run = new Function("window", "localStorage", "document", "URLSearchParams", "navigator", "assert", source.slice(0, end) + `
  state = loadEmptyState();
  state.days = {};
  const today = todayInPlanner();
  const todayKey = iso(today);
  const keys = [];
  for (let offset = 364; offset >= 0; offset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    const key = iso(date);
    keys.push(key);
    state.days[key] = { tasks: { A: Array.from({length: 20}, (_, index) => ({
      id: key + '-' + index, text: key + ' 업무 ' + index,
      status: '완료', done: true, completedDate: key,
    })), B: [], C: [] } };
  }
  const root = {id: 'root', text: '진행 중 업무', status: '미완료', done: false};
  const firstFork = {id: 'first-fork', carryoverForkFrom: root.id, text: root.text, status: '미완료', done: false};
  const lastFork = {id: 'last-fork', carryoverForkFrom: firstFork.id, text: root.text, status: '미완료', done: false};
  state.days[keys[0]].tasks.B.push(root);
  state.days[keys.at(-3)].tasks.B.push(firstFork);
  state.days[keys.at(-2)].tasks.B.push(lastFork);
  state.days[keys[0]].tasks.C.push({id: 'deleted', text: '삭제한 업무', status: '미완료', deletedFromDate: keys.at(-2)});
  let scans = 0;
  const originalLookup = findTaskRecordById;
  findTaskRecordById = function(id) { scans++; return originalLookup(id); };

  assert.equal(getTaskCarryoverRootKey(root), root.id);
  assert.equal(scans, 0, 'ordinary tasks must not search the full history for their own ID');
  assert.equal(getTaskCarryoverRootKey(lastFork), root.id, 'standalone callers must still follow older multi-level forks');
  assert.equal(getTaskCarryoverRootKey({}, firstFork.id), root.id, 'explicit fallback IDs must retain root resolution');
  scans = 0;
  const carryovers = getCarryoverTasks(today);
  assert.deepEqual(carryovers.map(task => task.id), [lastFork.id]);
  assert.equal(scans, 0, 'bulk carryover analysis must use the per-calculation index for fork lookups');
  assert.equal(root.done, false, 'reading carryovers must preserve historical completion state');
  carryovers[0].text = 'caller changed a display copy';
  assert.equal(getCarryoverTasks(today)[0].text, root.text, 'cached results remain independent display copies');

  state.days[todayKey].tasks.B.push({id: 'completed-fork', text: root.text, carryoverForkFrom: lastFork.id, status: '완료', done: true, completedDate: todayKey});
  invalidateCarryoverTaskCache();
  assert.deepEqual(getCarryoverTasks(today), [], 'a completed descendant must suppress every older open copy');
  state.days[todayKey].tasks.B = [];
  state.days[keys.at(-3)].tasks.B[0] = {...firstFork, carryoverForkFrom: 'replacement-root'};
  invalidateCarryoverTaskCache();
  const updated = getCarryoverTasks(today);
  assert.equal(scans, 0, 'recalculation must rebuild its lookup without full-history searches');
  assert.equal(getCarryoverTaskIdentity(updated[0]), 'task:replacement-root', 'later calculations must see replaced parent records');

  const missing = new Map([['orphan', {id: 'orphan', carryoverForkFrom: 'missing'}]]);
  assert.equal(resolveCarryoverRootKey('orphan', missing), 'missing', 'missing legacy parents preserve the known root ID');
  const cycle = new Map([['a', {carryoverForkFrom: 'b'}], ['b', {carryoverForkFrom: 'a'}]]);
  assert.equal(resolveCarryoverRootKey('a', cycle), 'a', 'malformed legacy cycles must terminate');

  const incoming = { days: {}, weeks: {}, months: {} };
  for (let index = 0; index < 32; index++) {
    incoming.days[keys[index]] = { tasks: { A: [{
      id: 'server-' + index, text: '서버 이월 단계 ' + index, status: '미완료', done: false,
      ...(index ? {carryoverForkFrom: 'server-' + (index - 1)} : {}),
    }], B: [], C: [] } };
  }
  incoming.days[todayKey] = { tasks: { A: [
    {id: 'server-open', text: '변경 전 제목', carryoverForkFrom: 'server-31', status: '미완료', done: false},
    {id: 'server-done', text: '완료한 제목', carryoverForkFrom: 'server-0', status: '완료', done: true, completedDate: todayKey},
  ], B: [], C: [] } };
  state.days[keys[0]].tasks.C.push({id: 'server-31', carryoverForkFrom: 'stale-parent', text: '이전 화면 기록', status: '미완료'});
  const payloadBefore = JSON.stringify(incoming);
  let preparationPasses = 0;
  const originalPrepare = preparePlannerStateForPersistence;
  preparePlannerStateForPersistence = function(...args) { preparationPasses++; return originalPrepare(...args); };
  scans = 0;
  storeStateFromServer({state: incoming, exists: true, updatedAt: '2026-11-25T01:00:00Z'}, '저장됨');
  assert.equal(scans, 0, 'incoming history must resolve its own parent index without scanning the previous account state');
  assert.equal(preparationPasses, 1, 'one server response must receive one persistence preparation pass');
  assert.equal(JSON.stringify(incoming), payloadBefore, 'normalization must preserve the incoming payload used for conflict recovery');
  const mergedForks = state.days[todayKey].tasks.A.filter(task => task.carryoverForkFrom);
  assert.equal(mergedForks.length, 1, 'different titles with a shared multi-level root must consolidate');
  assert.equal(mergedForks[0].done, true, 'the completed descendant must keep its completion record');

  state = migrateState({days: {[keys.at(-2)]: {tasks: {A: [{id: 'resolved-only', text: '이미 끝난 업무', status: '완료', done: true}], B: [], C: []}}}, weeks: {}, months: {}});
  invalidateCarryoverTaskCache();
  let suppressionPasses = 0;
  const originalSuppression = buildCarryoverSuppressionSet;
  buildCarryoverSuppressionSet = function(...args) { suppressionPasses++; return originalSuppression(...args); };
  assert.deepEqual(getCarryoverTasks(today), []);
  assert.equal(suppressionPasses, 0, 'resolved-only histories must skip suppression analysis');
  setTaskCompletionState(state.days[keys.at(-2)].tasks.A[0], false);
  state.days[keys.at(-2)].tasks.A[0].status = '미완료';
  invalidateCarryoverTaskCache();
  assert.equal(getCarryoverTasks(today)[0].id, 'resolved-only', 'a later reopen must invalidate the empty carryover result');
  assert.equal(suppressionPasses, 1);
  return 'Startup indexing, single-pass hydration, completion, empty-history and legacy chain checks passed';
`);

console.log(run(
  { location: { search: "", pathname: "/dashboard/index.html", hash: "" }, setTimeout: () => 1, clearTimeout() {} },
  { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
  { getElementById: () => null, querySelector: () => null },
  class { get() { return null; } },
  { language: "ko-KR" },
  assert,
));
