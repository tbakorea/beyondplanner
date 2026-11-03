const assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../dashboard/app.js'),'utf8');
const extract=n=>source.match(new RegExp(`function ${n}\\([^\\n]*\\{\\n[\\s\\S]*?\\n\\}`))[0];
new Function('assert',`
${['taskRecoverySnapshot','collectTaskRecoveryChanges','captureTaskRecoveryHistory','restoreTaskRecoveryCopy'].map(extract).join('\n')}
const day={tasks:{A:[{id:'one',text:'카드 결제 14:00',status:'미완료',done:false,financeItemId:'card'}],B:[],C:[]},appointments:{'14:00':'현재 일정'}};
const copy=x=>JSON.parse(JSON.stringify(x)),base={days:{'2026-11-03':copy(day)}};
let state=copy(base),selectedDate='2026-11-03',accountSaveReady=true,ids=0,saves=0;
const getAuthSession=()=>({email:'qa@example.test'}),iso=x=>x,plannerStateBaseKey=()=>'',localStorage={getItem:()=>JSON.stringify(base)},newTaskId=()=>String(++ids);
const todayInPlanner=()=> '2026-11-03',ensureDay=()=>state.days['2026-11-03'];
const setTaskCompletionState=(t,done)=>({...t,done}),assignTaskOrder=()=>{},saveCriticalPlannerAction=()=>saves++,renderDay=()=>{};
assert.equal(collectTaskRecoveryChanges(day,copy(day),'2026-11-03').length,0);
state.days['2026-11-03'].tasks.A[0].text='수정 내용';captureTaskRecoveryHistory();
assert.equal(state.taskRecoveryHistory.length,1);assert.equal(state.taskRecoveryHistory[0].before.text,'카드 결제 14:00');
state.days['2026-11-03'].tasks.A[0].text='수정 내용 계속';captureTaskRecoveryHistory();
assert.equal(state.taskRecoveryHistory.length,1,'keystrokes must coalesce');assert.equal(state.taskRecoveryHistory[0].after.text,'수정 내용 계속');
captureTaskRecoveryHistory();assert.equal(state.taskRecoveryHistory.length,1,'repeated saves must not duplicate history');
const event=state.taskRecoveryHistory[0];assert.equal(restoreTaskRecoveryCopy(event),true);
const restored=state.days['2026-11-03'].tasks.A[1];assert.equal(restored.text,event.before.text);assert.equal(restored.done,false);assert.equal(restored.financeItemId,undefined);
assert.equal(restored.recoveryCopy,true);assert.equal(state.days['2026-11-03'].tasks.A[0].text,'수정 내용 계속');
assert.equal(state.days['2026-11-03'].appointments['14:00'],'현재 일정');assert.equal(restoreTaskRecoveryCopy(event),false);assert.equal(saves,1);
const deleted=collectTaskRecoveryChanges(day,{tasks:{A:[],B:[],C:[]}},'2026-11-03');assert.equal(deleted[0].after,null);
const completed=copy(day);completed.tasks.A[0].done=true;completed.tasks.A[0].status='완료';assert.equal(collectTaskRecoveryChanges(day,completed,'2026-11-03')[0].before.done,false);
accountSaveReady=false;state.taskRecoveryHistory=[];captureTaskRecoveryHistory();assert.equal(state.taskRecoveryHistory.length,0);
`)(assert);
console.log('16 task recovery capture, coalescing and non-destructive restore checks passed');
