function runIphoneQuotaRegression(source) {
  const extract=name=>source.match(new RegExp(`function ${name}\\([^\\n]*\\{\\n[\\s\\S]*?\\n\\}`))?.[0]||"";
  const helpers=extract('writePlannerCacheValue');
  return new Function(`
    const assert=(ok,label)=>{if(!ok)throw new Error(label);};
    const data=new Map(),quota=5*1024*1024;
    const bytes=()=>[...data.values()].reduce((sum,s)=>sum+s.length*2,0);
    const localStorage={getItem:k=>data.get(k)||null,removeItem:k=>data.delete(k),setItem(k,v){
      if(bytes()-(data.get(k)?.length||0)*2+v.length*2>quota)throw Object.assign(new Error("quota"),{name:"QuotaExceededError"});data.set(k,v);
    }};
    const plannerStorageKey=()=>"account",plannerDisplayCacheKey=()=>"display",LAST_DISPLAY_CACHE_KEY="legacy";
    const getAuthSession=()=>({email:"test@example.test"});
    const old=JSON.stringify({accountEmail:"test@example.test",state:{memo:"x".repeat(550000)}});
    for(const key of ["account","base","display","legacy"])localStorage.setItem(key,old);
    let state={memo:"new check and schedule"+"x".repeat(1092000)},dirty=false,schedules=0,displaySchedules=0;
    const clonePlannerValue=x=>JSON.parse(JSON.stringify(x)),preparePlannerStateForPersistence=x=>x;
    const queueDisplayCachePersist=()=>displaySchedules++,markLocalStateUpdated=()=>dirty=true,scheduleAccountSave=()=>schedules++;
    const saveStatus={},renderSidebarAfterDailyInput=()=>{};
    ${helpers}
    ${extract('saveState')}
    let error;try{saveState({fastSave:true});}catch(e){error=e;}
    assert(!error&&dirty&&schedules===1,"Safari quota error must not abort DB save scheduling");
    assert(JSON.parse(localStorage.getItem("account")).memo===state.memo,"edited primary snapshot must replace old cache after reclaiming duplicate previews");
    assert(localStorage.getItem("base")===old,"acknowledged baseline must be preserved");
    assert(!localStorage.getItem("display")&&!localStorage.getItem("legacy"),"only redundant display copies may be evicted");
    assert(bytes()<=quota,"pending and baseline must fit the bounded browser store");
    const hasPlannerContent=()=>true;
    ${extract('persistDisplayCache')}
    const used=bytes();persistDisplayCache(state);
    assert(bytes()===used&&!data.has("display")&&!data.has("legacy"),"preview refresh must not refill duplicate full snapshots");
    const realSet=localStorage.setItem;localStorage.setItem=()=>{throw new Error("storage denied");};
    schedules=0;dirty=false;saveState({fastSave:true});
    assert(dirty&&schedules===1&&saveStatus.message.includes("저장 완료 전 종료하지 마세요"),"even unavailable storage must not abort foreground DB save or claim durable local recovery");
    const volatilePlannerMeta=new Map(),plannerStateMetaKey=()=>"meta",STATE_META_KEY="legacy-meta";
    ${extract('getStateMeta')}
    ${extract('saveStateMeta')}
    saveStateMeta({dirty:true,mutationSeq:3});
    assert(getStateMeta().dirty&&getStateMeta().mutationSeq===3,"quota failures must preserve runtime dirty metadata for DB acknowledgement handling");
    localStorage.setItem=realSet;
    return "8 iPhone-sized storage quota / DB scheduling regression checks passed";
  `)();
}

if(typeof require!=="undefined"&&require.main===module){
  const fs=require("node:fs"),path=require("node:path");
  console.log(runIphoneQuotaRegression(fs.readFileSync(path.join(__dirname,"../dashboard/app.js"),"utf8")));
}
