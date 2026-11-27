// Run the production module; substitute only browser rendering, timers and HTTP.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../dashboard/app.js'), 'utf8');
const program = source.slice(0, source.lastIndexOf('\nsetup().catch('));
const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;

async function run() {
  const storage = new Map([['beyondWorkAuthSession.v1', JSON.stringify({
    email: 'resume-fixture@example.test', accessToken: 'fixture-only', provider: 'supabase',
  })]]);
  const localStorage = { getItem: key => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  const window = { location: { search: '', pathname: '/dashboard/index.html', hash: '' },
    setTimeout: () => 1, clearTimeout() {} };
  const document = { getElementById: () => null, querySelector: () => null, activeElement: null, hidden: false };
  return new AsyncFunction('window', 'localStorage', 'document', 'URLSearchParams', 'navigator', 'assert', program + `
    renderActiveViewSections = () => {}; renderSidebarAfterDailyInput = () => {};
    scheduleAccountSave = () => {}; isAnyPlannerInputEditing = () => false;
    const revision = n => '2026-11-27T01:00:0' + n + '.000Z';
    const initial = {days: {'2026-11-27': {tasks: {A: [{id:'task-one',text:'Unchanged task'}],B:[],C:[]},
      appointments: {'09:00': '', '10:00': 'Original appointment'}}}};
    const remote = n => {
      const data = clonePlannerValue(initial);
      data.days['2026-11-27'].appointments['10:00'] = 'Mac latest ' + n;
      return {exists:true, state:data, updatedAt:revision(n)};
    };
    storeStateFromServer({state:initial,updatedAt:revision(0)}, 'saved');
    state.days['2026-11-27'].appointments['09:00'] = 'Unsaved iPad appointment';
    markLocalStateUpdated();
    const originalBase = readPlannerBaseState();
    mergeIncomingServerStateNow(remote(1), originalBase);
    assert.equal(state.days['2026-11-27'].appointments['09:00'], 'Unsaved iPad appointment');
    mergeIncomingServerStateNow(remote(2), originalBase);
    assert.equal(state.days['2026-11-27'].appointments['10:00'], 'Mac latest 2',
      'a second server revision must not be mistaken for an iPad edit against the original baseline');
    assert.equal(readPlannerBaseState().days['2026-11-27'].appointments['10:00'], 'Mac latest 2');
    assert.equal(readPlannerBaseState().days['2026-11-27'].appointments['09:00'], '',
      'the baseline must contain server data only, never the merged unsaved edit');
    const sleeping = clonePlannerValue(initial), latest = clonePlannerValue(initial);
    sleeping.days['2026-11-27'].tasks.A[0].text = 'Older unacknowledged iPad text';
    sleeping.days['2026-11-27'].appointments['09:00'] = 'Independent local input';
    latest.days['2026-11-27'].tasks.A[0].text = 'Latest acknowledged Mac text';
    const wakeMerge = mergePlannerStates(initial, sleeping, latest, {preferRemoteConflicts:true});
    assert.equal(wakeMerge.days['2026-11-27'].tasks.A[0].text, 'Latest acknowledged Mac text');
    assert.equal(wakeMerge.days['2026-11-27'].appointments['09:00'], 'Independent local input');
    latest.days['2026-11-27'].tasks.A = [];
    assert.equal(mergePlannerStates(initial, sleeping, latest, {preferRemoteConflicts:true})
      .days['2026-11-27'].tasks.A.some(task=>task.id==='task-one'), false,
      'waking cannot resurrect a record removed by the latest server revision');

    storeStateFromServer({state:initial,updatedAt:revision(2)}, 'saved');
    state.days['2026-11-27'].appointments['09:00'] = 'Pending iPad save'; markLocalStateUpdated();
    let posts = 0, saved;
    accountSaveReady = true;
    ensureFreshAuthSession = async () => getAuthSession();
    fetchWithTimeout = async (url, options) => {
      posts++;
      if (posts <= 2) return {ok:true,json:async()=>({ok:true,stale:true,conflict:true,...remote(posts + 2)})};
      saved = JSON.parse(options.body).state;
      return {ok:true,json:async()=>({ok:true,updatedAt:revision(5)})};
    };
    await persistStateToServer();
    assert.equal(posts, 3);
    assert.equal(saved.days['2026-11-27'].appointments['09:00'], 'Pending iPad save');
    assert.equal(saved.days['2026-11-27'].appointments['10:00'], 'Mac latest 4',
      'repeated save conflicts must preserve the most recent Mac revision');
    assert.equal(getStateMeta().dirty, false);
    await persistStateToServer();
    assert.equal(posts, 3, 'an untouched device must never upload a complete snapshot');

    // A token refresh started before wake must not bypass the synchronous gate.
    state.notes.freeform = 'New pending note'; markLocalStateUpdated();
    let finishAuth;
    ensureFreshAuthSession = () => new Promise(resolve => { finishAuth = resolve; });
    const saving = persistStateToServer();
    initialServerHydrationFinished = true;
    queueResumeServerValidation();
    assert.equal(resumeServerValidationRequired, true);
    assert.equal(accountSaveReady, false);
    finishAuth(getAuthSession()); await saving;
    assert.equal(posts, 3, 'a save waiting for authentication must stop when resume validation is queued');

    ensureFreshAuthSession = async () => getAuthSession();
    fetchWithTimeout = async () => { throw new Error('QA offline'); };
    await refreshServerStateAfterResume();
    assert.equal(accountSaveReady, false);
    assert.equal(resumeServerValidationRequired, true, 'failed validation must not reopen the save gate');
    assert.equal(resumeServerValidationRetryCount, 1, 'temporary read failures schedule a bounded retry');
    assert.equal(getStateMeta().dirty, true, 'network failure must retain unsaved input');
    fetchWithTimeout = async url => ({ok:true,json:async()=>url==='/api/config'?{}:remote(6)});
    await refreshServerStateAfterResume();
    assert.equal(accountSaveReady, true);
    assert.equal(resumeServerValidationRequired, false);
    assert.equal(resumeServerValidationRetryCount, 0);
    assert.equal(state.notes.freeform, 'New pending note');

    // Safari quota must not leave an obsolete merge baseline in this runtime
    // or let the obsolete disk copy acquire upload authority after a restart.
    const realSet = localStorage.setItem;
    localStorage.setItem = (key, value) => {
      if (key === plannerStateBaseKey()) throw new Error('QA quota');
      realSet(key, value);
    };
    storeStateFromServer(remote(7), 'saved');
    const baseline = readPlannerBaseState();
    assert.equal(baseline.days['2026-11-27'].appointments['10:00'], 'Mac latest 7');
    baseline.days['2026-11-27'].appointments['10:00'] = 'Mutated caller copy';
    assert.equal(readPlannerBaseState().days['2026-11-27'].appointments['10:00'], 'Mac latest 7');
    runtimePlannerBases.clear();
    assert.equal(readPlannerBaseState(), null, 'a failed baseline write must invalidate its older durable revision');
    markLocalStateUpdated(); plannerMutationSeq = 0;
    assert.equal(resumePendingPlannerSave(), false, 'an unverifiable baseline must never authorize a full upload');
    localStorage.setItem = realSet;
    storeStateFromServer(remote(8), 'saved');
    localStorage.setItem = (key, value) => {
      if (key === plannerStorageKey()) throw new Error('QA primary snapshot quota');
      realSet(key, value);
    };
    state.notes.freeform = 'Only in live memory'; saveState({fastSave:true});
    assert.equal(getStateMeta().pendingSnapshotValid, false);
    plannerMutationSeq = 0;
    assert.equal(resumePendingPlannerSave(), false,
      'new dirty metadata must not give an older primary snapshot upload authority after a failed cache write');
    return 'Multi-revision conflicts, immediate wake gate, failed reads, authentication race and quota safety passed';
  `)(window, localStorage, document, class { get() { return null; } }, {language:'ko-KR'}, assert);
}
run().then(console.log).catch(error => { console.error(error); process.exitCode = 1; });
