// Run: node tests/save_reliability_regression.js
async function runSaveReliabilityRegression(source) {
  const names=["persistStateToServer","resumePendingPlannerSave","hasCurrentRuntimeDirtyEdit"];
  const functions=names.map(name=>{
    const match=source.match(new RegExp(`(?:async )?function ${name}\\([^\\n]*\\{\\n[\\s\\S]*?\\n\\}`));
    if(!match)throw new Error(`Missing ${name}`);
    return match[0];
  }).join("\n");
  const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
  return new AsyncFunction(`
    const assert=(ok,label)=>{if(!ok)throw new Error(label);};
    let meta,plannerMutationSeq=5,plannerSaveRetryCount=0,lastServerUpdatedAt="2026-10-27T08:00:00Z",hasBase=true;
    const state={memo:"new edit"},selectedDate="2026-10-27",iso=x=>x,weekKey=x=>x;
    const document={hidden:false},saveStatus={};
    const resumeServerValidationPending=false,accountSaveReady=true,STATE_SAVE_TIMEOUT_MS=1000;
    const getAuthSession=()=>({email:"test@example.test",accessToken:"test"}),ensureFreshAuthSession=async()=>getAuthSession();
    const getStateMeta=()=>meta,saveStateMeta=x=>Object.assign(meta,x);
    const clonePlannerValue=x=>JSON.parse(JSON.stringify(x)),preparePlannerStateForPersistence=x=>x;
    const hasPlannerContent=()=>true,hasPendingPlannerSave=()=>meta.dirty;
    const getServerBaseUpdatedAt=()=>lastServerUpdatedAt,authStateHeaders=x=>x;
    const timestampMs=x=>Date.parse(x)||0,isTimestampNewer=(a,b)=>timestampMs(a)>timestampMs(b);
    let delays=[],bases=0,mode="network";
    const scheduleAccountSave=delay=>delays.push(delay),renderSidebarAfterDailyInput=()=>{};
    const writePlannerBaseState=()=>bases++,readPlannerBaseState=()=>hasBase?{}:null;
    const extractSaveError=async()=>"denied";
    const fetchWithTimeout=async()=>{
      if(mode==="network")throw new TypeError("offline");
      if(mode==="denied")return{ok:false,status:403};
      if(mode==="newer-edit"){plannerMutationSeq++;meta.updatedAt="2026-10-27T08:03:00Z";}
      return{ok:true,json:async()=>mode==="invalid"?{}:{ok:true,updatedAt:"2026-10-27T08:02:00Z"}};
    };
    const reset=()=>{meta={dirty:true,updatedAt:"2026-10-27T08:01:00Z",mutationSeq:5,accountEmail:"test@example.test",pendingEditVersion:1};plannerMutationSeq=5;delays=[];};
    ${functions}
    reset();await persistStateToServer();
    assert(meta.dirty && delays[0]===1000,"offline save must keep pending edit and retry");
    for(let i=0;i<7;i++)await persistStateToServer();
    assert(delays[delays.length-1]===30000 && Math.max(...delays)<=30000,"retry backoff must be bounded");
    reset();mode="invalid";await persistStateToServer();
    assert(meta.dirty && delays.length===1,"invalid success payload must not acknowledge or discard an edit");
    reset();mode="denied";await persistStateToServer();
    assert(meta.dirty && delays.length===0,"nontransient permission error must not loop");
    reset();mode="success";await persistStateToServer();
    assert(!meta.dirty && plannerSaveRetryCount===0 && bases===1,"verified DB acknowledgement clears pending and retry count");
    reset();mode="newer-edit";await persistStateToServer();
    assert(meta.dirty && delays.includes(250),"editing during save must schedule a second save");
    reset();plannerMutationSeq=0;
    assert(resumePendingPlannerSave() && plannerMutationSeq===5 && hasCurrentRuntimeDirtyEdit(),"new-version pending edit survives reload for server merge");
    plannerMutationSeq=0;delete meta.pendingEditVersion;
    assert(!resumePendingPlannerSave() && plannerMutationSeq===0,"legacy cache must never auto-upload");
    reset();plannerMutationSeq=0;meta.accountEmail="other@example.test";
    assert(!resumePendingPlannerSave(),"another account's edit must not be adopted");
    reset();plannerMutationSeq=0;hasBase=false;
    assert(!resumePendingPlannerSave(),"missing merge baseline must not authorize upload");
    return "10 save retry / reload regression checks passed";
  `)();
}
if(typeof require!=="undefined"&&require.main===module){
  const fs=require("node:fs"),path=require("node:path");
  runSaveReliabilityRegression(fs.readFileSync(path.join(__dirname,"../dashboard/app.js"),"utf8")).then(console.log).catch(error=>{console.error(error);process.exitCode=1;});
}
