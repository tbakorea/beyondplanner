// Execute the complete production module, with only browser storage/DOM replaced.
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../dashboard/app.js'), 'utf8');
const program = source.slice(0, source.lastIndexOf('\nsetup().catch('));
const cache = new Map([['beyondWorkAuthSession.v1', JSON.stringify({email:'repeat-qa@example.test',provider:'supabase',accessToken:'fixture-only',expiresAt:4102444800})]]);
const storage = {getItem:key=>cache.get(key)||null,setItem:(key,value)=>cache.set(key,value),removeItem:key=>cache.delete(key)};
const win = {location:{search:'',pathname:'/dashboard/index.html',hash:''},setTimeout:()=>1,clearTimeout:()=>{}};
const doc = {getElementById:()=>null,querySelector:()=>null,activeElement:null,hidden:false};
const result = new Function('window','localStorage','document','navigator',program+`
  let checks = 0, repeatTestToday = "2026-11-11";
  const verifyRepeat = (value,label) => { if(!value) throw new Error(label); checks++; };
  todayInPlanner = () => parseDate(repeatTestToday);
  selectedDate = parseDate(repeatTestToday);
  const monthly = (extra={}) => ({text:"매월 정산 10:00",priority:"A",frequency:"monthly",monthday:11,startDate:"2026-11-01",endMode:"none",carryMode:"auto",active:true,...extra});
  const resetRepeatState = (rules=[monthly()]) => {
    state = migrateState({days:{},weeks:{},months:{},repeats:{priorityTasks:rules}});
    invalidateCarryoverTaskCache();
  };
  const occurrences = key => getDayTasks(key).filter(task=>task.repeatId);
  const openCarryovers = key => getCarryoverTasks(parseDate(key)).filter(task=>task.repeatId);
  resetRepeatState();
  verifyRepeat(occurrences("2026-11-11").length===1,"current month receives its scheduled occurrence");
  verifyRepeat(occurrences("2026-12-11").length===1,"unopened next month resolves from the saved rule");
  verifyRepeat(occurrences("2042-12-11").length===1,"recurrence has no finite future horizon");
  verifyRepeat(occurrences("2026-12-12").length===0,"a future non-due date has no scheduled copy");
  verifyRepeat(openCarryovers("2026-11-12").length===0,"tomorrow has no premature carryover");
  verifyRepeat(!state.days["2026-11-12"],"future carryover preview creates no day or copy");
  verifyRepeat(occurrences("2026-12-11").length===1,"calendar reads do not duplicate an event");
  const nextDay=ensureDay("2026-12-11");
  syncVisibleTaskTimeHints(nextDay,[],{dayKey:"2026-12-11"});
  verifyRepeat(String(nextDay.appointments["10:00"]).includes("매월 정산"),"future occurrence time reaches its scheduled day");
  verifyRepeat(!String(ensureDay("2026-12-12").appointments["10:00"]).includes("매월 정산"),"carryover time does not leak into a future schedule");

  resetRepeatState();
  repeatTestToday="2026-11-12";
  const carried=openCarryovers("2026-11-12");
  verifyRepeat(carried.length===1 && carried[0].date==="2026-11-11","an unopened due date carries after the next day arrives");
  verifyRepeat(openCarryovers("2026-11-12").length===1,"carryover reads remain idempotent");
  const fork=materializeCarryoverTask(carried[0],"2026-11-12");
  markTaskCompletedForDate(fork.task,"2026-11-12");
  invalidateCarryoverTaskCache();
  repeatTestToday="2026-11-13";
  verifyRepeat(openCarryovers("2026-11-13").length===0,"completion on the carryover day stops later carryover");
  repeatTestToday="2026-12-12";
  const december=openCarryovers("2026-12-12");
  verifyRepeat(december.length===1 && december[0].repeatId==="repeat-0-2026-12-11","November completion does not suppress December carryover");
  verifyRepeat(occurrences("2027-01-11").length===1,"one completion leaves later months scheduled");

  resetRepeatState();
  const november=ensureDay("2026-11-11").tasks.A.find(task=>task.repeatId);
  markTaskCompletedForDate(november,"2026-11-11");
  invalidateCarryoverTaskCache();
  repeatTestToday="2026-11-12";
  verifyRepeat(openCarryovers("2026-11-12").length===0,"an event completed on its due day never carries");
  verifyRepeat(isTaskCompleted(november),"historical completion survives recurrence resolution");

  resetRepeatState();
  const once=ensureDay("2026-11-11");
  const removed=once.tasks.A.find(task=>task.repeatId);
  markCarryoverIdentityDeletedForDate({...removed,date:"2026-11-11",priority:"A"},"2026-11-11");
  once.deletedRepeatIds.push(removed.repeatId);
  once.tasks.A=once.tasks.A.filter(task=>task!==removed);
  invalidateCarryoverTaskCache();
  verifyRepeat(occurrences("2026-11-11").length===0,"one-time deletion is not regenerated");
  repeatTestToday="2026-12-12";
  verifyRepeat(openCarryovers("2026-12-12").length===1,"deleting November alone does not suppress December");

  resetRepeatState([monthly({startDate:"2026-12-01",endMode:"date",endDate:"2027-01-11"})]);
  verifyRepeat(occurrences("2026-11-11").length===0 && occurrences("2026-12-11").length===1,"start date bounds the recurrence");
  verifyRepeat(occurrences("2027-01-11").length===1 && occurrences("2027-02-11").length===0,"end date is inclusive");
  resetRepeatState([monthly({deletedFrom:"2026-12-01"})]);
  verifyRepeat(occurrences("2026-12-11").length===0,"deleting future occurrences remains effective");
  resetRepeatState([monthly({carryMode:"none"})]);
  repeatTestToday="2026-11-12";
  verifyRepeat(openCarryovers("2026-11-12").length===0,"explicit carryover-off is respected");
  resetRepeatState([monthly({active:false})]);
  verifyRepeat(occurrences("2026-12-11").length===0 && openCarryovers("2026-11-12").length===0,"inactive rules generate nothing");

  resetRepeatState([monthly({monthday:31,startDate:"2027-01-01"})]);
  verifyRepeat(occurrences("2027-02-28").length===0 && occurrences("2027-03-31").length===1,"31st rules do not drift into short months");
  repeatTestToday="2027-03-01";
  verifyRepeat(openCarryovers("2027-03-01")[0]?.repeatSourceDate==="2027-01-31","January 31 can carry across a short February");
  repeatTestToday="2027-03-31";
  verifyRepeat(openCarryovers("2027-03-31").length===0,"a new cycle replaces previous carryover");
  return checks + " monthly recurrence / next-day carryover checks passed";
`)(win,storage,doc,{language:'ko-KR'});
console.log(result);
