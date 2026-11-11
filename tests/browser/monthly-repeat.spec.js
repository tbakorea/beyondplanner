const {test,expect}=require('@playwright/test');
const session={email:'browser-qa@example.test',provider:'supabase',accessToken:'isolated-fixture-only',tier:'ceo',expiresAt:4102444800};
const nextDate=(key,days=1)=>{
  const date=new Date(key+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+days);
  return date.toISOString().slice(0,10);
};
async function open(context,page,info,today){
  await context.addInitScript(({session,mode})=>{
    localStorage.setItem('beyondWorkAuthSession.v1',JSON.stringify(session));
    localStorage.setItem('beyondWorkOnboardingCollapsed.v1','1');
    if(mode)localStorage.setItem('beyondWorkMode',mode);
  },{session,mode:info.project.metadata.plannerMode});
  await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  await page.clock.setFixedTime(new Date(today+'T12:00:00+09:00'));
  await page.goto('/dashboard/index.html');
  await expect(page.locator('#topSaveStatus')).toHaveAttribute('data-save-state','saved',{timeout:30000});
  await expect(page.locator('#bootScreen')).toHaveCount(0,{timeout:15000});
}
const texts=page=>page.locator('#taskBoard .task-text-input').evaluateAll(nodes=>nodes.map(n=>n.value));
const scheduleText=page=>page.locator('#appointmentList input,#appointmentList textarea').evaluateAll(nodes=>nodes.map(n=>n.value).join('\n'));
async function nextMonthlyCell(page,day){
  await page.locator('.quick-strip > [data-top-view="month"]').click();
  for(let month=0;month<3;month++){
    const before=await page.locator('#monthTitle').textContent();
    await page.locator('#monthNextButton').click();
    await expect(page.locator('#monthTitle')).not.toHaveText(before);
    const cell=page.locator('#monthCalendar .month-cell:not(.is-muted)').filter({has:page.locator('strong').filter({hasText:new RegExp('^'+day+'$')})});
    if(await cell.count()) return cell;
  }
  throw new Error('No valid monthly occurrence within three months');
}
test.beforeEach(async({request})=>{await request.post('/qa/reset');});

test('creating monthly recurrence populates unopened future calendars and survives server reload',async({context,page,request},info)=>{
  const initial=await(await request.get('/qa/snapshot')).json();
  const today=Object.keys(initial.state.days).sort().at(-1);
  const day=Number(today.slice(-2)), label='QA 매월 정산 10:00';
  await open(context,page,info,today);
  await page.locator('.task-add-repeat').click();
  const editor=page.locator('#repeatPriorityList');
  await editor.locator('.repeat-text').fill(label);
  await editor.locator('.repeat-frequency').selectOption('monthly');
  await editor.locator('.repeat-editor-save').click();
  await page.locator('#closeRepeatManagerButton').click();
  await expect.poll(()=>texts(page)).toContain(label);
  await expect.poll(async()=>{
    const saved=await(await request.get('/qa/snapshot')).json();
    return saved.state.repeats?.priorityTasks?.some(rule=>rule.text===label&&rule.frequency==='monthly');
  }).toBeTruthy();
  // Tomorrow is only a preview: an unfinished event is not carried early.
  await page.locator('#dailyNextDay').click();
  await expect.poll(()=>texts(page)).not.toContain(label);
  await expect.poll(()=>scheduleText(page)).not.toContain('QA 매월 정산');

  const visitNextMonth=async()=>{
    const cell=await nextMonthlyCell(page,day);
    await expect(cell.locator('.count-pill')).toHaveText(/1/);
    await cell.click();
    await expect.poll(()=>texts(page)).toContain(label);
    expect((await texts(page)).filter(text=>text===label)).toHaveLength(1);
    await expect.poll(()=>scheduleText(page)).toContain('QA 매월 정산');
  };
  await visitNextMonth();
  // Clear display storage: the persisted server rule reconstructs the future.
  await page.evaluate(()=>localStorage.clear());
  await page.reload();
  await expect(page.locator('#bootScreen')).toHaveCount(0,{timeout:15000});
  await visitNextMonth();
  await page.screenshot({path:info.outputPath('future-monthly-occurrence.png')});
});

test('unopened monthly event carries when the next day arrives, completion leaves the next month intact',async({context,page,request},info)=>{
  const initial=await(await request.get('/qa/snapshot')).json();
  const today=Object.keys(initial.state.days).sort().at(-1);
  const yesterday=nextDate(today,-1), label='QA 이월 월간 회의 14:00';
  initial.state.repeats={priorityTasks:[{text:label,priority:'A',frequency:'monthly',monthday:Number(yesterday.slice(-2)),startDate:yesterday,endMode:'none',carryMode:'carry',active:true}]};
  delete initial.state.days[yesterday];
  await request.post('/api/state',{data:{state:initial.state,baseUpdatedAt:initial.updatedAt}});
  await open(context,page,info,today);
  const event=page.locator('#taskBoard .task-row').filter({has:page.locator('input[value="'+label+'"]')});
  await expect(event).toHaveCount(1);
  await expect(event).toHaveClass(/carryover-row/);
  await event.locator('.task-cycle').click();
  await expect.poll(async()=>{
    const saved=await(await request.get('/qa/snapshot')).json();
    return Object.values(saved.state.days[today]?.tasks||{}).flat().some(task=>task.text===label&&task.done);
  }).toBeTruthy();
  await page.clock.setFixedTime(new Date(nextDate(today)+'T12:00:00+09:00'));
  await page.reload();
  await expect(page.locator('#bootScreen')).toHaveCount(0,{timeout:15000});
  await expect.poll(()=>texts(page)).not.toContain(label);
  const dueDay=Number(yesterday.slice(-2));
  const cell=await nextMonthlyCell(page,dueDay);
  await expect(cell.locator('.count-pill')).toHaveText(/1/);
  await cell.click();
  await expect.poll(()=>texts(page)).toContain(label);
  const nextEvent=page.locator('#taskBoard .task-row').filter({has:page.locator('input[value="'+label+'"]')});
  await expect(nextEvent).not.toHaveClass(/done/);
});
