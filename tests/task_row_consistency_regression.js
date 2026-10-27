// Run: node tests/task_row_consistency_regression.js
function runTaskRowConsistencyRegression(source) {
  const names=["findCurrentTaskLocation","findTaskSource","resolveDailyTaskEditLocation","getDailyCompletionSummary",
    "taskCountsAsCompletedForDay","isTaskCompleted","isTaskCompletionTruthyValue","isTaskCompletionFalsyValue",
    "isNonCompletionTaskStatus","hasTaskCompletionRecord","isTaskDeletedFromDate","isCarryoverCompletedOn"];
  const functions=names.map(name=>{
    const match=source.match(new RegExp(`function ${name}\\([^\\n]*\\{\\n[\\s\\S]*?\\n\\}`));
    if(!match)throw new Error(`Missing ${name}`);
    return match[0];
  }).join("\n");
  return new Function(`
    const assert=(ok,label)=>{if(!ok)throw new Error(label);};
    const priorities=[["A"],["B"],["C"]],selectedDate="2026-10-27",iso=x=>x;
    const TASK_NON_COMPLETION_STATUSES=["위임","취소","연기","진행중"];
    const TASK_COMPLETION_ALIAS_KEYS=["completed","checked","complete","isDone"];
    const isValidIsoDate=s=>/^\\d{4}-\\d{2}-\\d{2}$/.test(s);
    const normalizeDayTasks=()=>{},normalizeTask=x=>x;
    const hasTaskVisibleText=t=>!!t.text?.trim(),getDailyCompletionIdentity=item=>item.task.id;
    const open=Array.from({length:8},(_,i)=>({type:"day",task:{id:"open-"+i,text:"미완료 "+i,status:"미완료",done:false}}));
    const checked=Array.from({length:4},(_,i)=>({type:"day",task:{id:"done-"+i,text:"완료 "+i,status:"완료",done:true}}));
    const visible=[...open,...checked];
    let reads=0;
    const getTaskDisplayItems=()=>{reads++;return open;};
    ${functions}
    const a={id:"other",text:"다른 업무",done:false},stale={id:"clicked",text:"완료할 업무",done:false};
    const day={tasks:{A:[a],B:[],C:[]}};
    assert(findCurrentTaskLocation(day,stale,"A",0,{normalize:false})===null,"stale row must not resolve to an unrelated task at its old index");
    const location=resolveDailyTaskEditLocation(day,stale,"A",0);
    location.task.done=true;location.task.status="완료";
    assert(!a.done && day.tasks.A.includes(stale) && stale.done,"checkbox edit must affect its own stable identity");
    day.tasks.A=[];day.tasks.C=[stale];
    assert(findCurrentTaskLocation(day,stale,"A",0,{normalize:false}).priority==="C","task moved to another priority must still resolve by ID");
    assert(findCurrentTaskLocation(day,{id:"missing"},"C",0,{normalize:false})===null,"delete or move with a missing ID must not target another row");
    const state={days:{[selectedDate]:day}};
    assert(findTaskSource({id:"missing",date:selectedDate,priority:"C",index:0})===null,"stale carryover source index must not select another task");
    const summary=getDailyCompletionSummary({},selectedDate,[],visible);
    assert(summary.done===4 && summary.total===12 && reads===0,"photo 2: counter must use exactly the rendered snapshot, not recompute 0/8");
    visible[8].task.done=false;visible[8].task.status="미완료";
    assert(getDailyCompletionSummary({},selectedDate,[],visible).done===3,"uncheck updates the same snapshot");
    return "7 task-row / counter-snapshot regression checks passed";
  `)();
}
if(typeof require!=="undefined"&&require.main===module){
  const fs=require("node:fs"),path=require("node:path");
  console.log(runTaskRowConsistencyRegression(fs.readFileSync(path.join(__dirname,"../dashboard/app.js"),"utf8")));
}
