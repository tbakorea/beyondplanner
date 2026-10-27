async function runCanonicalStartupRegression(source) {
  const match=source.match(/async function hydrateServerState\([^\n]*\{\n[\s\S]*?\n\}/);
  if(!match)throw new Error("Missing hydrateServerState");
  const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
  return new AsyncFunction(`
    const assert=(ok,label)=>{if(!ok)throw new Error(label);};
    let state,meta,accountSaveReady=false,plannerMutationSeq=0,lastServerUpdatedAt="",selectedSheetId="s";
    const hasInitialDeviceCache=true,saveStatus={},STATE_FETCH_TIMEOUT_MS=1000;
    const clonePlannerValue=x=>JSON.parse(JSON.stringify(x)),hydrateServerConfig=()=>{};
    const getAuthSession=()=>({accessToken:"test",email:"test@example.test"}),ensureFreshAuthSession=async()=>getAuthSession();
    const authStateHeaders=()=>({}),getStateMeta=()=>meta,saveStateMeta=x=>Object.assign(meta,x);
    const hasPlannerContent=s=>!!s?.days?.["2026-10-26"]?.tasks?.A?.length;
    const hasCurrentRuntimeDirtyEdit=()=>!!meta.dirty,hasRuntimeLocalEditSince=()=>!!meta.dirty;
    let requested="",mode="normal",merges=0;
    const plannerStateFetchUrl=({forceFull})=>forceFull?"/api/state":"/api/state?since=2026-10-28T03%3A00%3A00Z";
    const canonical={days:{"2026-10-26":{tasks:{A:[{id:"monday",text:"DB에 남아있는 업무",done:true}]}},"2026-10-28":{appointments:{"09:00":"DB에 남아있는 일정"}}},customSheets:{activeId:"s"}};
    const fetchWithTimeout=async(url)=>{
      requested=url;if(mode==="offline")throw new TypeError("network unavailable");
      return {ok:true,json:async()=>url.includes("since")||mode==="invalid-not-modified"?{notModified:true,updatedAt:"2026-10-28T03:00:00Z"}:{exists:true,state:clonePlannerValue(canonical),updatedAt:"2026-10-28T03:00:00Z"}};
    };
    const applyServerNotModifiedPayload=()=>{accountSaveReady=true;saveStatus.ready=true;};
    const storeStateFromServer=p=>{state=p.state;saveStatus.message="저장됨";};
    const queueIncomingServerStateMerge=()=>{merges++;return true;},readPlannerBaseState=()=>({days:{}});
    const isTimestampNewer=(a,b)=>Date.parse(a)>Date.parse(b),setBootMessage=()=>{},networkErrorMessage=e=>e.message;
    const reset=()=>{state={days:{},customSheets:{activeId:"s"}};meta={dirty:false};saveStatus.ready=false;accountSaveReady=false;lastServerUpdatedAt="";};
    ${match[0]}
    reset();await hydrateServerState();
    assert(requested==="/api/state"&&hasPlannerContent(state)&&state.days["2026-10-28"].appointments["09:00"],"a cache timestamp without matching content must never leave a blank 0/0 startup after not-modified");
    reset();meta.dirty=true;state.days["2026-10-26"]={tasks:{A:[{text:"unsent user edit"}]}};await hydrateServerState();
    assert(merges===1&&state.days["2026-10-26"].tasks.A[0].text==="unsent user edit","full startup must retain the existing explicit pending-edit merge path");
    reset();mode="offline";await hydrateServerState();
    assert(!saveStatus.ready&&!accountSaveReady&&saveStatus.message==="network unavailable","offline startup must remain an explicit load failure");
    reset();mode="invalid-not-modified";await hydrateServerState();
    assert(!saveStatus.ready&&!accountSaveReady,"a full read without a body must not falsely confirm data loading");
    return "4 canonical startup / blank-cache regression checks passed";
  `)();
}

if(typeof require!=="undefined"&&require.main===module){
  const fs=require("node:fs"),path=require("node:path");
  runCanonicalStartupRegression(fs.readFileSync(path.join(__dirname,"../dashboard/app.js"),"utf8")).then(console.log).catch(error=>{console.error(error);process.exitCode=1;});
}
