// Run: node tests/completion_counter_regression.js
function runCompletionCounterRegression(source) {
  const names=["taskCountsAsCompletedForDay","getDailyCompletionSummary","isTaskCompleted",
    "isTaskCompletionTruthyValue","isTaskCompletionFalsyValue","isNonCompletionTaskStatus",
    "hasTaskCompletionRecord","isTaskDeletedFromDate","isCarryoverCompletedOn"];
  const functions=names.map(name=>{
    const match=source.match(new RegExp(`function ${name}\\([^\\n]*\\{\\n[\\s\\S]*?\\n\\}`));
    if(!match)throw new Error(`Missing ${name}`);
    return match[0];
  }).join("\n");
  return new Function(`
    const TASK_NON_COMPLETION_STATUSES=["위임","취소","연기","진행중"];
    const TASK_COMPLETION_ALIAS_KEYS=["completed","checked","complete","isDone"];
    const selectedDate="2026-10-26",iso=x=>x,isValidIsoDate=s=>/^\\d{4}-\\d{2}-\\d{2}$/.test(s);
    const getTaskDisplayItems=(day,carryovers)=>[...day.items,...carryovers];
    const getDailyCompletionIdentity=item=>item.task.id;
    const hasTaskVisibleText=task=>!!String(task.text||"").trim();
    const assert=(ok,label)=>{if(!ok)throw new Error(label);};
    ${functions}
    const paid={id:"paid",text:"26신한카드 873만",status:"완료",done:true,completedDate:"2026-10-26",carryoverDeletedFrom:"2026-10-26"};
    assert(taskCountsAsCompletedForDay(paid,"day",selectedDate),"completed carried card must count despite carryover cutoff");
    assert(taskCountsAsCompletedForDay({...paid,completedDate:"2026-10-27"},"day",selectedDate),"counter must agree with visible check even on a past date");
    for(const status of TASK_NON_COMPLETION_STATUSES) assert(!taskCountsAsCompletedForDay({...paid,status},"day",selectedDate),status+" must not count even with stale done flag");
    assert(!taskCountsAsCompletedForDay({...paid,deletedFromDate:selectedDate},"day",selectedDate),"explicit deletion still excludes score");
    assert(taskCountsAsCompletedForDay({...paid,deletedFromDate:"2026-10-27"},"day",selectedDate),"later deletion preserves historical score");
    const items=Array.from({length:13},(_,index)=>({type:"day",task:{id:"task-"+index,text:"業務"+index,status:index<8?"완료":"미완료",done:index<8,...(index<5?{carryoverDeletedFrom:selectedDate}:{})}}));
    items.push({type:"day",task:{id:"blank",text:"",status:"완료",done:true}});
    const summary=getDailyCompletionSummary({items},selectedDate,[]);
    assert(summary.done===8 && summary.total===13,"photo scenario must count 8/13 instead of 3/13 and ignore blanks");
    items[7].task.status="미완료";items[7].task.done=false;
    const toggled=getDailyCompletionSummary({items},selectedDate,[]);
    assert(toggled.done===7 && toggled.total===13,"unchecking decrements immediately");
    const duplicate=getDailyCompletionSummary({items},selectedDate,[items[0]]);
    assert(duplicate.done===7 && duplicate.total===13,"same identity must not double count");
    return "11 completion counter regression checks passed";
  `)();
}
if(typeof require!=="undefined"&&require.main===module){
  const fs=require("node:fs"),path=require("node:path");
  console.log(runCompletionCounterRegression(fs.readFileSync(path.join(__dirname,"../dashboard/app.js"),"utf8")));
}
