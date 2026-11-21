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
  return 'Year-long startup lookup, carryover completion, index freshness and legacy chain checks passed';
`);

console.log(run(
  { location: { search: "", pathname: "/dashboard/index.html", hash: "" } },
  { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
  { getElementById: () => null, querySelector: () => null },
  class { get() { return null; } },
  { language: "ko-KR" },
  assert,
));
