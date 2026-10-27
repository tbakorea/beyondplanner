// Run: node tests/restart_integrity_regression.js
function runRestartIntegrityRegression(source) {
  const names=["queuePlannerBaseStatePersist","writePlannerBaseState","readPlannerBaseState","saveState",
    "resumePendingPlannerSave","hasCurrentRuntimeDirtyEdit","clonePlannerValue","plannerValuesEqual",
    "isPlainPlannerObject","mergePlannerValue","mergePlannerArrays","mapPlannerArrayByKey",
    "canMergePlannerArrayByKey","getPlannerArrayItemKey","getPlannerArrayCarryoverMergeKey",
    "isPlannerTaskRecord","renderPlannerSaveStatus","renderSidebarAfterDailyInput","compactSaveStatusLabel"];
  const functions=names.map(name=>{
    const m=source.match(new RegExp(`function ${name}\\([^\\n]*\\{\\n[\\s\\S]*?\\n\\}`));
    if(!m)throw new Error(`Missing ${name}`);return m[0];
  }).join("\n");
  return new Function(`
    const assert=(ok,label)=>{if(!ok)throw new Error(label);};
    const storage=new Map(),timers=new Map();let timerId=0,plannerBaseCacheTimer=0;
    const window={setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id)};
    const scheduleIdleTask=fn=>window.setTimeout(fn);
    const drain=()=>{while(timers.size){const jobs=[...timers.values()];timers.clear();jobs.forEach(fn=>fn());}};
    const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
    const plannerStateBaseKey=()=>"base",plannerStorageKey=()=>"cache";
    const migrateState=x=>JSON.parse(JSON.stringify(x)),preparePlannerStateForPersistence=x=>x,hasPlannerContent=x=>!!x?.days;
    const getAuthSession=()=>({email:"same@example.test"});
    let meta={},plannerMutationSeq=0;const getStateMeta=()=>meta,saveStateMeta=x=>Object.assign(meta,x);
    const timestampMs=x=>Date.parse(x)||0;
    let state,db,scheduledSaves=0;
    const queueDisplayCachePersist=()=>{},scheduleAccountSave=()=>scheduledSaves++;
    const markLocalStateUpdated=()=>{plannerMutationSeq++;saveStateMeta({dirty:true,mutationSeq:plannerMutationSeq,pendingEditVersion:1,accountEmail:"same@example.test",updatedAt:"2026-10-28T00:01:00Z"});};
    const mergePlannerTaskRecord=()=>{throw new Error("unexpected conflicting task fields in this scenario");};
    const node={dataset:{},textContent:"",setAttribute(k,v){this[k]=v;},classList:{toggle(){}}};
    const el=id=>id==="topSaveStatus"?node:null,document={querySelector:()=>null};
    const saveStatus={saving:false,message:"저장됨"};let deferred=0;
    const isAnyPlannerInputEditing=()=>true,scheduleDailyTaskRelatedRefresh=()=>deferred++,queueSidebarRender=()=>{throw new Error("must not rebuild focused inputs");};
    ${functions}
    db={days:{"2026-10-26":{tasks:{A:[{id:"monday",text:"월요일 우선업무",done:false,status:"미완료"}]}},"2026-10-27":{appointments:{"15:00":""}}},notes:{remote:"old"}};
    state=clonePlannerValue(db);
    queuePlannerBaseStatePersist(state);
    assert(readPlannerBaseState()?.days["2026-10-26"].tasks.A[0].done===false,"baseline must be durable before the first editing/close event");
    const task=state.days["2026-10-26"].tasks.A[0];task.done=true;task.status="완료";task.text="월요일 수정 완료";
    state.days["2026-10-27"].appointments["15:00"]="오늘 새 일정";
    saveState({fastSave:true});drain();
    assert(!readPlannerBaseState().days["2026-10-26"].tasks.A[0].done,"deferred cache work must never put unsaved checks into the merge baseline");
    // Kill the first runtime before its network save, then reconstruct from disk.
    plannerMutationSeq=0;state=JSON.parse(localStorage.getItem(plannerStorageKey()));
    assert(resumePendingPlannerSave()&&plannerMutationSeq===1,"unacknowledged edit must survive a complete runtime restart");
    db.notes.remote="another device changed this";
    state=mergePlannerValue(readPlannerBaseState(),state,db);
    assert(state.days["2026-10-26"].tasks.A[0].done&&state.days["2026-10-26"].tasks.A[0].text==="월요일 수정 완료","server refresh after restart must preserve Monday check and text");
    assert(state.days["2026-10-27"].appointments["15:00"]==="오늘 새 일정","server refresh after restart must preserve today's appointment");
    assert(state.notes.remote==="another device changed this","the DB remains authoritative for unrelated remote changes");
    // Simulate server acknowledgement and a second cold start from that DB row.
    db=clonePlannerValue(state);writePlannerBaseState(db);saveStateMeta({dirty:false});
    state=clonePlannerValue(db);plannerMutationSeq=0;drain();
    assert(state.days["2026-10-26"].tasks.A[0].done&&state.days["2026-10-27"].appointments["15:00"]==="오늘 새 일정","acknowledged DB state must survive a second cold start");
    assert(plannerValuesEqual(readPlannerBaseState(),db),"older idle baseline callbacks cannot regress an acknowledged revision");
    saveStateMeta({dirty:true});saveStatus.message="저장됨";renderSidebarAfterDailyInput();
    assert(node.dataset.saveState!=="saved"&&deferred===1,"focused text fields must not keep a false saved badge for pending data");
    saveStatus.message="저장 실패";renderSidebarAfterDailyInput();
    assert(node.dataset.saveState==="alert"&&node.title==="저장 실패","save errors must be visible while editing without rebuilding inputs");
    return "10 restart / immutable baseline / save-status regression checks passed";
  `)();
}
if(typeof require!=="undefined"&&require.main===module){
  const fs=require("node:fs"),path=require("node:path");
  console.log(runRestartIntegrityRegression(fs.readFileSync(path.join(__dirname,"../dashboard/app.js"),"utf8")));
}
