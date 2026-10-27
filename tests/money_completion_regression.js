// Run: node tests/money_completion_regression.js
function runMoneyCompletionRegression(source) {
  const names = ["linkMoneyItemToTask", "linkFixedMoneyItemToTasks", "removeFinanceLinkedTask",
    "removeStaleMoneyTasks", "buildExpectedMoneyTaskLinks", "syncMoneyTaskLinks",
    "findFinanceLinkedTaskAt", "isFinanceTaskDeletedForDate", "getMoneyItemDate",
    "isTaskCompleted", "isTaskCompletionTruthyValue", "isTaskCompletionFalsyValue",
    "isNonCompletionTaskStatus", "setTaskCompletionState", "mergeDuplicateDailyTaskState",
    "copyTaskLifecycleFields", "taskLifecycleChanged", "getTaskResolutionRank",
    "clonePlannerValue", "plannerValuesEqual", "timestampMs", "isPlainPlannerObject",
    "mergePlannerTaskRecord", "mergePlannerValue", "isPlannerTaskRecord", "getCarryoverTasks",
    "getDayTaskSnapshots", "isTaskResolvedForDate", "hasTaskCompletionRecord", "isTaskDeletedFromDate",
    "cloneCarryoverTaskList"];
  for (const optional of ["findMoneyTaskToPreserve", "isHistoricalFixedMoneyTask"]) {
    if (source.includes(`function ${optional}(`)) names.push(optional);
  }
  const functions = names.map(name => {
    const match = source.match(new RegExp(`function ${name}\\([^\\n]*\\{\\n[\\s\\S]*?\\n\\}`));
    if (!match) throw new Error(`Missing ${name}`);
    return match[0];
  }).join("\n");
  const lifecycleKeys = source.match(/const TASK_LIFECYCLE_MERGE_KEYS = \[[\s\S]*?\n\];/)[0];
  return new Function(`
    const assert = (ok, label) => { if (!ok) throw new Error(label); };
    const TASK_COMPLETION_ALIAS_KEYS = ["completed", "checked", "complete", "isDone"];
    const TASK_NON_COMPLETION_STATUSES = ["위임", "취소", "연기", "진행중"];
    ${lifecycleKeys}
    const priorities = [["A"], ["B"], ["C"]];
    const state = {days:{},finance:{fixed:[],months:{}}};
    const selectedDate = "2026-10-27", iso = x => x, todayInPlanner = () => selectedDate;
    const fixedMoneyTaskWindow = () => ({start:selectedDate,end:"2026-11-27"});
    const fixedMoneyTaskMonthKeys = () => ["2026-10","2026-11"];
    const isFixedMoneyActiveForMonth = (item,key) => getMoneyItemDate(item,key) >= selectedDate && getMoneyItemDate(item,key) <= "2026-11-27";
    const pad = x => String(x).padStart(2,"0");
    const normalizeFinanceState = () => {}, createFinanceState = () => ({months:{},fixed:[]});
    const ensureDay = key => state.days[key] ||= {tasks:{A:[],B:[],C:[]}};
    const assignTaskOrder = (day,task) => task.order = 10;
    const syncTaskTimeHintToSchedule = () => false, clearTaskScheduleLinkForInactive = () => {};
    const shouldKeepLegacyFixedMoneyTask = () => true;
    let carryoverTaskCache={key:"",version:"",items:[]}, cacheSeq=0;
    const carryoverTaskCacheByDate=new Map(), carryoverTaskCacheVersion=()=>++cacheSeq;
    const shouldShowCarryoversForDate=()=>true, buildCarryoverSuppressionSet=()=>new Set();
    const shouldCarryRepeatTask=()=>true, isCarryoverIdentitySuppressed=()=>false;
    const isCarryoverCompletedOn=()=>false, dedupeCarryoverTasks=x=>x, pruneCarryoverCache=()=>{};
    const isActiveTaskSlot=t=>!!t.text, getTaskOrder=t=>t.order||0;
    const isValidIsoDate=s=>/^\\d{4}-\\d{2}-\\d{2}$/.test(s);
    const normalizeTask = () => {};
    let seq = 0;
    const newTaskId = () => "generated-" + ++seq;
    const buildMoneyTaskText = item => item.title + " " + item.amount;
    ${functions}
    const card = {id:"card",title:"26신한카드",amount:"8730000",dueDay:26,type:"지출"};
    const completed = {id:"paid-task",text:"26신한카드 873만",financeItemId:"card",status:"완료",done:true,completed:true,completedDate:"2026-10-26",completedAt:"2026-10-26T12:00:00Z",lifecycleUpdatedAt:"2026-10-26T12:00:00Z",order:2};
    ensureDay("2026-10-26").tasks.C.push(clonePlannerValue(completed));
    state.finance.months["2026-10"] = [card];
    linkMoneyItemToTask(card,"2026-10");
    let linked = Object.values(state.days["2026-10-26"].tasks).flat().find(t=>t.financeItemId==="card");
    assert(isTaskCompleted(linked) && linked.id==="paid-task" && linked.completedAt===completed.completedAt,"Money relink must preserve completed task identity, priority and completion record");
    assert(state.days["2026-10-26"].tasks.C.includes(linked),"user priority must survive relink");
    for(let i=0;i<3;i++) linkMoneyItemToTask(card,"2026-10");
    assert(Object.values(state.days["2026-10-26"].tasks).flat().filter(t=>t.financeItemId==="card").length===1,"repeated refresh must not duplicate");
    linked=Object.values(state.days["2026-10-26"].tasks).flat().find(t=>t.financeItemId==="card");
    assert(isTaskCompleted(linked),"repeated refresh must not reopen paid card");
    linked.status="위임"; setTaskCompletionState(linked,false); linked.delegate="김담당";
    linkMoneyItemToTask(card,"2026-10");
    linked=Object.values(state.days["2026-10-26"].tasks).flat().find(t=>t.financeItemId==="card");
    assert(linked.status==="위임" && linked.delegate==="김담당","relink must preserve delegation");
    linked.status="연기";linked.postponeDate="2026-10-30";
    linkMoneyItemToTask(card,"2026-10");
    linked=Object.values(state.days["2026-10-26"].tasks).flat().find(t=>t.financeItemId==="card");
    assert(linked.status==="연기" && linked.postponeDate==="2026-10-30","relink must preserve postponement");
    Object.assign(linked,completed); card.dueDay=27;
    syncMoneyTaskLinks();
    linked=Object.values(ensureDay("2026-10-27").tasks).flat().find(t=>t.financeItemId==="card");
    assert(linked && isTaskCompleted(linked),"date correction via sync must preserve completion before stale cleanup");
    const fixed={id:"fixed-card",title:"우리카드",dueDay:25,type:"지출"};state.finance.fixed=[fixed];
    const old=clonePlannerValue({...completed,id:"fixed-paid",financeItemId:"fixed-card-2026-10"});
    ensureDay("2026-10-25").tasks.A.push(old);
    const future=clonePlannerValue({...completed,id:"fixed-next",financeItemId:"fixed-card-2026-11"});
    ensureDay("2026-11-25").tasks.A.push(future);
    linkFixedMoneyItemToTasks(fixed);
    assert(ensureDay("2026-10-25").tasks.A.includes(old),"fixed relink must not erase past month completion");
    assert(isTaskCompleted(findFinanceLinkedTaskAt("fixed-card-2026-11","2026-11-25").task),"fixed relink preserves already completed current-window occurrence");
    syncMoneyTaskLinks();
    assert(ensureDay("2026-10-25").tasks.A.includes(old),"next-day maintenance must retain historical completed money record");
    ensureDay("2026-11-25").deletedFinanceTaskIds=["fixed-card-2026-11"];
    syncMoneyTaskLinks();
    assert(!findFinanceLinkedTaskAt("fixed-card-2026-11","2026-11-25"),"explicit occurrence deletion must remain deleted");
    const second={id:"second-card",title:"다른카드",dueDay:26,type:"지출"};state.finance.fixed.push(second);
    ensureDay("2026-10-26").tasks.A.push({...completed,id:"second-paid",financeItemId:"second-card-2026-10"});
    linkFixedMoneyItemToTasks(second);
    assert(!isTaskCompleted(findFinanceLinkedTaskAt("second-card-2026-11","2026-11-26").task),"a completed October occurrence must not complete the November occurrence");
    const base={...completed,status:"미완료",done:false,completed:false,completedAt:"",completedDate:"",lifecycleUpdatedAt:"2026-10-25T01:00:00Z"};
    const local={...base,text:"기기 A 수정"};
    const merged=mergePlannerTaskRecord(base,local,completed);
    assert(isTaskCompleted(merged) && merged.completedDate==="2026-10-26", "stale device text edit must not undo remote completion");
    const reopened={...base,lifecycleUpdatedAt:"2026-10-27T01:00:00Z"};
    const intentional=mergePlannerTaskRecord(base,reopened,completed);
    assert(!isTaskCompleted(intentional),"an explicitly newer reopen must still work");
    const stale={...base,id:"stale-copy",financeItemId:"card"};
    ensureDay("2026-10-27").tasks.A.push(stale);
    linkMoneyItemToTask(card,"2026-10");
    assert(isTaskCompleted(findFinanceLinkedTaskAt("card","2026-10-27").task),"stale open duplicate must not replace paid lifecycle");
    assert(!getCarryoverTasks("2026-10-28").some(t=>t.financeItemId==="card"),"completed card must not carry over after relink and next-day navigation");
    return "16 money completion / device-merge regression checks passed";
  `)();
}

if (typeof require !== "undefined" && require.main === module) {
  const fs = require("node:fs"), path = require("node:path");
  console.log(runMoneyCompletionRegression(fs.readFileSync(path.join(__dirname,"../dashboard/app.js"),"utf8")));
}
