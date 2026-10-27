// Execute the whole production module, not selected functions with mocked internals.
async function runFullBootRegression(source) {
  const end=source.lastIndexOf("\nsetup().catch(");
  if(end<0)throw new Error("Missing production setup entry point");
  const program=source.slice(0,end);
  const assert=(ok,label)=>{if(!ok)throw new Error(label);};
  const email="test@example.test",account=encodeURIComponent(email);
  const snapshot={days:{"2026-10-26":{tasks:{A:[{id:"monday",text:"월요일 저장 업무",status:"미완료",done:false}],B:[],C:[]},appointments:{"09:00":"저장된 월요일 일정"}}},weeks:{},months:{}};
  let checks=0;
  for(const [width,height] of [[390,844],[430,932],[768,1024],[1366,900]]){
    const data=new Map([
      ["beyondWorkAuthSession.v1",JSON.stringify({email,provider:"supabase",accessToken:"fixture-only",tier:"ceo"})],
      [`franklinClassicPlanner2026.v1.${account}`,JSON.stringify(snapshot)],
    ]);
    const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
    const window={location:{search:"",pathname:"/dashboard/index.html",hash:"",replace(){throw new Error("unexpected logout");}},innerWidth:width,innerHeight:height,matchMedia:()=>({matches:false}),setTimeout:()=>1,clearTimeout:()=>{}};
    const document={getElementById:()=>null,querySelector:()=>null,activeElement:null,hidden:false};
    const run=(suffix)=>new Function("window","localStorage","document","URLSearchParams","navigator",program+suffix)(window,storage,document,class{get(){return null;}},{language:"ko-KR"});
    const first=run(`
      const before={cached:hasInitialDeviceCache,text:state.days["2026-10-26"]?.tasks?.A?.[0]?.text};
      if(before.cached){
        writePlannerBaseState(state);
        const task=state.days["2026-10-26"].tasks.A[0];
        task.text="월요일 수정 완료";markTaskCompletedForDate(task,"2026-10-26");
        ensureDay("2026-10-28").appointments["10:00"]="오늘 추가한 일정";
        saveState({fastSave:true});
      }
      return before;
    `);
    assert(first.cached&&first.text==="월요일 저장 업무",`${width}: existing account must load before rendering; migration must not fail in temporal dead zone`);checks++;
    const second=run(`
      const resumed=resumePendingPlannerSave();
      return {cached:hasInitialDeviceCache,resumed,task:state.days["2026-10-26"]?.tasks?.A?.[0],appointment:state.days["2026-10-28"]?.appointments?.["10:00"],dirty:getStateMeta().dirty};
    `);
    assert(second.cached&&second.resumed&&second.dirty,`${width}: pending edit must be recognized after complete runtime restart`);checks++;
    assert(second.task?.done&&second.task.text==="월요일 수정 완료"&&second.appointment==="오늘 추가한 일정",`${width}: Monday text/check and today's appointment must survive runtime restart`);checks++;
  }
  // A display-only preview must also migrate successfully once all bindings exist.
  const data=new Map([["beyondWorkAuthSession.v1",JSON.stringify({email,provider:"supabase",accessToken:"fixture-only"})],[`beyondWorkLastDisplayState.v1.${account}`,JSON.stringify({accountEmail:email,state:snapshot})]]);
  const result=new Function("window","localStorage","document","URLSearchParams","navigator",program+';return hasInitialDeviceCache;')({location:{search:"",pathname:"/dashboard/index.html",hash:""}}, {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}, {},class{get(){return null;}},{language:"ko-KR"});
  assert(result,"display-only fallback must not become a blank account during initial migration");checks++;
  // Run real hydration, three-way merge, persistence and acknowledgement with
  // only HTTP and DOM rendering substituted. This catches interactions that
  // isolated helper tests cannot exercise.
  const edited=JSON.parse(JSON.stringify(snapshot));
  edited.days["2026-10-26"].tasks.A[0].text="월요일 수정 완료";
  edited.days["2026-10-26"].tasks.A[0].done=true;
  edited.days["2026-10-26"].tasks.A[0].status="완료";
  edited.days["2026-10-26"].tasks.A[0].completedDate="2026-10-26";
  edited.days["2026-10-28"]={tasks:{A:[],B:[],C:[]},appointments:{"10:00":"오늘 추가한 일정"}};
  const restartData=new Map([
    ["beyondWorkAuthSession.v1",JSON.stringify({email,provider:"supabase",accessToken:"fixture-only"})],
    [`franklinClassicPlanner2026.v1.${account}`,JSON.stringify(edited)],
    [`beyondWorkPlannerStateBase.v1.${account}`,JSON.stringify(snapshot)],
    [`beyondWorkPlannerStateMeta.v1.${account}`,JSON.stringify({dirty:true,pendingEditVersion:1,mutationSeq:2,updatedAt:new Date().toISOString(),baseUpdatedAt:"2026-10-26T00:00:00Z",accountEmail:email})],
  ]);
  let database=JSON.parse(JSON.stringify(snapshot)),posts=0;
  database.notes={freeform:"다른 기기의 변경"};
  const storage={getItem:k=>restartData.get(k)||null,setItem:(k,v)=>restartData.set(k,v),removeItem:k=>restartData.delete(k)};
  const fakeFetch=async(url,options={})=>({ok:true,json:async()=>{
    if(url==="/api/config")return{storage:"supabase-db"};
    if(options.method==="POST"){
      posts++;database=JSON.parse(options.body).state;
      return {ok:true,updatedAt:new Date().toISOString()};
    }
    return{exists:true,state:JSON.parse(JSON.stringify(database)),updatedAt:"2026-10-26T00:00:00Z"};
  }});
  const win={location:{search:"",pathname:"/dashboard/index.html",hash:""},setTimeout:()=>1,clearTimeout:()=>{}};
  const doc={getElementById:()=>null,querySelector:()=>null,activeElement:null,hidden:false};
  const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
  const saved=await new AsyncFunction("window","localStorage","document","URLSearchParams","navigator","fetch","AbortController",program+`
    renderActiveViewSections=()=>{};renderSidebarAfterDailyInput=()=>{};
    const resumed=resumePendingPlannerSave();
    await hydrateServerState();
    await Promise.all([persistStateToServer(),persistStateToServer(),persistStateToServer()]);
    return {resumed,dirty:getStateMeta().dirty,ready:saveStatus.ready,message:saveStatus.message};
  `)(win,storage,doc,class{get(){return null;}},{language:"ko-KR"},fakeFetch,class{signal={};abort(){}});
  assert(saved.resumed&&saved.ready&&posts===1,"overlapping autosave, exit and manual save must share one acknowledged HTTP transaction after restart");checks++;
  assert(database.days["2026-10-26"].tasks.A[0].done&&database.days["2026-10-26"].tasks.A[0].text==="월요일 수정 완료"&&database.days["2026-10-28"].appointments["10:00"]==="오늘 추가한 일정","DB request must include Monday completion/text and today's appointment after cold restart");checks++;
  assert(database.notes.freeform==="다른 기기의 변경"&&!saved.dirty&&saved.message==="저장됨","unrelated remote data must survive and only DB acknowledgement clears pending state");checks++;
  return `${checks} full production-module boot / restart regression checks passed`;
}
if(typeof require!=="undefined"&&require.main===module){
  const fs=require("node:fs"),path=require("node:path");
  runFullBootRegression(fs.readFileSync(path.join(__dirname,"../dashboard/app.js"),"utf8")).then(console.log).catch(error=>{console.error(error);process.exitCode=1;});
}
