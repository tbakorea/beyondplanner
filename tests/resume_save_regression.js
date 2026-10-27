// Run: node tests/resume_save_regression.js
async function runResumeSaveRegression(source) {
  const names=["refreshServerStateAfterResume","hasCurrentRuntimeDirtyEdit","storeStateFromServer",
    "mergeIncomingServerStateNow","applyServerNotModifiedPayload","queueIncomingServerStateMerge"];
  const functions=names.map(name=>{
    const match=source.match(new RegExp(`(?:async )?function ${name}\\([^\\n]*\\{\\n[\\s\\S]*?\\n\\}`));
    if(!match)throw new Error(`Missing ${name}`);
    return match[0];
  }).join("\n");
  const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
  return new AsyncFunction(`
    const assert=(ok,label)=>{if(!ok)throw new Error(label);};
    let state={memo:"today edited schedule",customSheets:{activeId:"sheet"}},selectedSheetId="sheet";
    let meta={dirty:true,mutationSeq:1},plannerMutationSeq=1,accountSaveReady=true;
    let resumeServerValidationPending=false,initialServerHydrationFinished=true,plannerHiddenAt=Date.now()-3600000;
    const LONG_SUSPEND_SERVER_FIRST_MS=300000,accountSaveTimer=0;
    const document={hidden:false};const window={clearTimeout:()=>{}};
    const saveStatus={ready:true,saving:false,message:""};
    const getStateMeta=()=>meta,saveStateMeta=values=>Object.assign(meta,values);
    const getAuthSession=()=>({accessToken:"test",email:"test@example.test"});
    let backups=0,retries=0;
    const preserveSuspendedPlannerSnapshot=()=>backups++,renderSidebarAfterDailyInput=()=>{},scheduleAccountSave=()=>retries++;
    const hydrateServerState=async()=>{if(!hasCurrentRuntimeDirtyEdit())state.memo="old server snapshot";};
    let lastServerUpdatedAt="2026-10-27T08:00:00Z",pendingServerStateMerge={payload:{updatedAt:"2026-10-27T09:00:00Z"}};
    const isTimestampNewer=(a,b)=>Date.parse(a)>Date.parse(b);
    const knownServerStateUpdatedAt=()=>lastServerUpdatedAt;
    ${functions}
    await refreshServerStateAfterResume();
    assert(state.memo==="today edited schedule" && meta.dirty,"sleep must not erase live unsaved edits before hydration");
    assert(backups===1 && retries===1 && accountSaveReady,"sleep keeps recovery snapshot and retries live edits");
    meta={dirty:true,mutationSeq:0};plannerMutationSeq=0;plannerHiddenAt=Date.now()-3600000;
    await refreshServerStateAfterResume();
    assert(!meta.dirty && state.memo==="old server snapshot","untouched prior-session cache must still yield to server");
    const stale={updatedAt:"2026-10-27T07:00:00Z",state:{memo:"out of order response"}};
    state.memo="latest accepted data";
    storeStateFromServer(stale,"saved");
    assert(state.memo==="latest accepted data" && lastServerUpdatedAt==="2026-10-27T08:00:00Z","late full response cannot roll state or revision backwards");
    assert(mergeIncomingServerStateNow(stale,{})===false,"late queued merge must be rejected");
    applyServerNotModifiedPayload(stale);
    assert(lastServerUpdatedAt==="2026-10-27T08:00:00Z","late not-modified response cannot lower base revision");
    assert(queueIncomingServerStateMerge({updatedAt:"2026-10-27T08:30:00Z"},{})===true && pendingServerStateMerge.payload.updatedAt==="2026-10-27T09:00:00Z","older response cannot replace a newer queued merge");
    return "7 resume / response-order regression checks passed";
  `)();
}
if(typeof require!=="undefined"&&require.main===module){
  const fs=require("node:fs"),path=require("node:path");
  runResumeSaveRegression(fs.readFileSync(path.join(__dirname,"../dashboard/app.js"),"utf8")).then(console.log).catch(error=>{console.error(error);process.exitCode=1;});
}
