// Run: node tests/today_cache_regression.js
function runTodayCacheRegression(source) {
  const names = ["mergeTodaySlicePayload", "showCachedTodaySlice", "hydrateTodaySlice"];
  const functions = names.map(name => {
    const match = source.match(new RegExp(`(?:async )?function ${name}\\([^\\n]*\\{\\n[\\s\\S]*?\\n\\}`));
    if (!match) throw new Error(`Missing ${name}`);
    return match[0];
  }).join("\n");
  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
  return new AsyncFunction(`
    const assert = (ok,label) => {if(!ok) throw new Error(label);};
    const selectedDate="2026-10-27",iso=x=>x,parseDate=x=>x,weekKey=()=>"2026-10-25";
    const completed={id:"card",text:"26신한카드 873만",status:"완료",done:true};
    const state={days:{"2026-10-26":{tasks:{A:[completed]}}},weeks:{}};
    const clonePlannerValue=x=>JSON.parse(JSON.stringify(x));
    const normalizePlannerDayRecord=x=>x,normalizePlannerWeekRecord=x=>x;
    const todaySliceCache=new Map();let dirty=true,lastServerUpdatedAt="2026-10-27T01:00:00Z";
    const getStateMeta=()=>({dirty});
    const isTimestampNewer=(a,b)=>Date.parse(a)>Date.parse(b);
    const renderActiveViewSections=()=>{},renderStartupFrame=()=>{},hideBootScreen=()=>{};
    const invalidateCarryoverTaskCache=()=>{};
    const getAuthSession=()=>({accessToken:"test-only"}),authStateHeaders=()=>({});
    const STATE_FETCH_TIMEOUT_MS=8000;
    let plannerMutationSeq=1,todaySliceRequestSeq=0,changeDuringFetch=false;
    const payload={ready:true,exists:true,updatedAt:"2026-10-27T01:00:00Z",day:{tasks:{A:[{...completed,status:"미완료",done:false}]}},preferences:{},week:{}};
    const fetchWithTimeout=async()=>{if(changeDuringFetch) plannerMutationSeq++;return{ok:true,json:async()=>payload};};
    ${functions}
    todaySliceCache.set("2026-10-26",clonePlannerValue(payload));
    assert(!showCachedTodaySlice("2026-10-26") && state.days["2026-10-26"].tasks.A[0].done,"navigation must not overwrite pending completion with cached open task");
    dirty=false;lastServerUpdatedAt="2026-10-27T02:00:00Z";
    assert(!showCachedTodaySlice("2026-10-26") && state.days["2026-10-26"].tasks.A[0].done,"saved completion must reject older cached revision");
    assert(!mergeTodaySlicePayload({...payload,updatedAt:""},"2026-10-26"),"unversioned response cannot overwrite known server revision");
    todaySliceCache.clear();
    assert(!await hydrateTodaySlice("2026-10-26") && todaySliceCache.size===0,"stale network response must not pollute date cache");
    lastServerUpdatedAt="2026-10-27T01:00:00Z";changeDuringFetch=true;
    assert(!await hydrateTodaySlice("2026-10-26") && todaySliceCache.size===0,"in-flight checkbox edits must reject and not cache old response");
    changeDuringFetch=false;dirty=true;
    assert(!await hydrateTodaySlice("2026-10-26"),"pending edits from before a fetch must also be protected");
    dirty=false;payload.updatedAt="2026-10-27T03:00:00Z";payload.day.tasks.A[0].done=true;payload.day.tasks.A[0].status="완료";
    assert(await hydrateTodaySlice("2026-10-26") && state.days["2026-10-26"].tasks.A[0].done,"fresh server data must still load after saving");
    return "7 date cache regression checks passed";
  `)();
}
if (typeof require !== "undefined" && require.main === module) {
  const fs=require("node:fs"),path=require("node:path");
  runTodayCacheRegression(fs.readFileSync(path.join(__dirname,"../dashboard/app.js"),"utf8")).then(console.log).catch(error=>{console.error(error);process.exitCode=1;});
}
