// Run: node tests/carryover_edit_regression.js
function runCarryoverEditRegression(source) {
  const extract=name=>{
    const match=source.match(new RegExp(`function ${name}\\([^\\n]*\\{\\n[\\s\\S]*?\\n\\}`));
    if(!match)throw new Error(`Missing ${name}`);
    return match[0];
  };
  return new Function(`
    const assert=(ok,label)=>{if(!ok)throw new Error(label);};
    const priorities=[["A"],["B"],["C"]], selectedDate="2026-10-27",iso=x=>x;
    const monday={id:"monday",text:"월요일 카드",financeItemId:"card-oct",status:"미완료",done:false};
    const today={id:"today",text:"오늘 수정한 카드",financeItemId:"card-oct",status:"미완료",done:false};
    const sourceDay={tasks:{A:[monday],B:[],C:[]}},day={tasks:{A:[today],B:[],C:[]}};
    const findTaskSource=()=>({day:sourceDay,task:monday,priority:"A",index:0});
    const ensureDay=()=>day,carryoverForkKey=()=>"monday-root",getTaskCarryoverRootKey=t=>t.carryoverForkFrom;
    const getStoredTaskPriority=(t,p)=>t.priority||p;
    const getDailyTaskDuplicateIdentities=t=>["id:"+t.id,...(t.financeItemId?["money:"+t.financeItemId]:[])];
    let ids=0;const newTaskId=()=>"new-"+(++ids),inheritCarryoverTaskOrder=()=>{};
    const setTaskCompletionState=(t,v)=>{t.done=v;return t;};
    const stampTaskLifecycleMutation=t=>t.lifecycleUpdatedAt="2026-10-27T10:00:00Z";
    ${extract('materializeCarryoverTask')}
    const ref={...monday,date:"2026-10-26",priority:"A"};
    const first=materializeCarryoverTask(ref);
    assert(first.task===today && day.tasks.A.length===1,"reuse canonical Money row instead of creating a discarded fork");
    first.task.text="오늘 최종 수정"; first.task.done=true;first.task.status="완료";
    const second=materializeCarryoverTask(ref);
    assert(second.task===today && second.task.text==="오늘 최종 수정" && second.task.done,"a later blur must resolve to the edited completed row");
    assert(!monday.done && monday.text==="월요일 카드" && monday.carryoverDeletedFrom===selectedDate,"historical source content is preserved and future carryover stops");
    day.tasks.A=[]; const fresh=materializeCarryoverTask(ref);
    assert(fresh.task!==monday && day.tasks.A.length===1 && !fresh.task.done,"missing current target still creates one independent open fork");
    const normalizeTask=t=>t,timestampMs=x=>Date.parse(x)||0;
    const taskLifecycleChanged=(a,b)=>a.status!==b.status||a.carryoverDeletedFrom!==b.carryoverDeletedFrom;
    const copyTaskLifecycleFields=(a,b)=>Object.assign(a,{status:b.status,done:b.done,lifecycleUpdatedAt:b.lifecycleUpdatedAt,carryoverDeletedFrom:b.carryoverDeletedFrom});
    const getTaskResolutionRank=t=>t.carryoverDeletedFrom?6:t.done?5:2;
    ${extract('mergeDuplicateDailyTaskState')}
    const completed={text:"card",status:"완료",done:true,lifecycleUpdatedAt:"2026-10-27T10:00:00Z"};
    const stale={text:"card",status:"미완료",done:false,carryoverDeletedFrom:"2026-10-27",lifecycleUpdatedAt:"2026-10-26T10:00:00Z"};
    mergeDuplicateDailyTaskState(completed,stale);
    assert(completed.done && completed.status==="완료","old suppression must not outrank newer completion");
    const reopened={text:"card",status:"진행중",done:false,lifecycleUpdatedAt:"2026-10-27T11:00:00Z"};
    mergeDuplicateDailyTaskState(completed,reopened);
    assert(!completed.done && completed.status==="진행중","explicit newer uncheck must win");
    let events=[];const markDailyTaskMutation=()=>{},markPlannerInputEditing=()=>{},markDailyFieldEditing=()=>{};
    const invalidateCarryoverTaskCache=()=>events.push("invalidate"),refreshDailyStatusViews=()=>events.push("count");
    const saveState=()=>events.push("persist"),accountSaveReady=false,scheduleAccountSave=()=>{};
    ${extract('saveCriticalPlannerAction')}
    saveCriticalPlannerAction();
    assert(events.join(",")==="invalidate,count,persist","counter must refresh with fresh carryover cache before full-state persistence");
    return "7 carryover edit / immediate completion regression checks passed";
  `)();
}
if(typeof require!=="undefined"&&require.main===module){
  const fs=require("node:fs"),path=require("node:path");
  console.log(runCarryoverEditRegression(fs.readFileSync(path.join(__dirname,"../dashboard/app.js"),"utf8")));
}
