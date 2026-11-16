const { test, expect } = require('@playwright/test');
const session = { email:'browser-qa@example.test', provider:'supabase', accessToken:'isolated-fixture-only', tier:'ceo', expiresAt:4102444800 };
async function open(context, page) {
  if(test.info().project.metadata.plannerMode) await context.addInitScript(mode=>localStorage.setItem('beyondWorkMode',mode),test.info().project.metadata.plannerMode);
  await context.addInitScript(s => {
    if (!localStorage.getItem('beyondWorkAuthSession.v1')) localStorage.setItem('beyondWorkAuthSession.v1', JSON.stringify(s));
  }, session);
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.goto('/dashboard/index.html');
  await expect(page.locator('.day-task-panel .task-text-input').filter({visible:true}).first()).toHaveValue('QA 업무 01');
  await expect(page.locator('#topSaveStatus')).toHaveAttribute('data-save-state','saved',{timeout:30000});
}
test.beforeEach(async ({request}) => { await request.post('/qa/reset'); });

test('startup keeps old tasks hidden during a slow read and after a failed read',async({context,page,request})=>{
  const {state:cached}=await(await request.get('/qa/snapshot')).json();
  const today=Object.keys(cached.days).sort().at(-1);
  cached.days[today].tasks.A[0].text='QA 이전 화면의 업무';
  await context.addInitScript(({session,cached})=>{
    localStorage.setItem('beyondWorkAuthSession.v1',JSON.stringify(session));
    localStorage.setItem(`franklinClassicPlanner2026.v1.${encodeURIComponent(session.email)}`,JSON.stringify(cached));
  },{session,cached});
  let failFirstRead;
  const firstRead=new Promise(resolve=>{failFirstRead=resolve;});
  let reads=0,saves=0;
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.hostname!=='127.0.0.1')return route.abort();
    if(url.pathname==='/api/state') {
      if(route.request().method()==='POST')saves++;
      else if(++reads===1){
        await firstRead;
        return route.fulfill({status:503,json:{error:'QA temporary connection failure'}});
      }
    }
    return route.continue();
  });
  const oldTask=page.locator('#taskBoard input[value="QA 이전 화면의 업무"]');
  try {
    await page.goto('/dashboard/index.html');
    await expect(page.locator('#bootMessage')).toHaveText('오늘 일정 확인에 시간이 걸리고 있습니다');
    await expect(page.locator('#bootScreen')).toBeVisible();
    await expect(oldTask).toHaveCount(0);
    expect(saves).toBe(0);
  } finally {failFirstRead();}
  await expect(page.locator('#bootMessage')).toContainText('불러오지 못했습니다');
  await expect(oldTask).toHaveCount(0);
  expect(saves).toBe(0);
  await page.getByRole('button',{name:'다시 시도'}).click();
  await expect(page.locator('#bootScreen')).toHaveCount(0);
  await expect(page.locator('#taskBoard .task-text-input').first()).toHaveValue('QA 업무 01');
  await expect(oldTask).toHaveCount(0);
  await expect(page.locator('.app-shell')).not.toHaveAttribute('inert','');
});

test('header, tasks and navigation remain reachable', async ({context,page}, info) => {
  await open(context,page);
  const header=await page.locator('.app-header').boundingBox();
  const date=await page.locator('.daily-title').boundingBox();
  const nav=await page.locator('.quick-strip').boundingBox();
  const size=page.viewportSize();
  expect(date.y).toBeGreaterThanOrEqual(header.y+header.height-2);
  if(size.width<=640) expect(date.y-header.y-header.height).toBeLessThanOrEqual(12);
  expect(nav.x).toBeGreaterThanOrEqual(-1);
  expect(nav.x+nav.width).toBeLessThanOrEqual(size.width+1);
  const brand=await page.locator('.brand-row h1').boundingBox();
  const clock=await page.locator('#headerSaveClock').boundingBox();
  const coach=await page.locator('#coachBubble').boundingBox();
  expect(clock.x).toBeGreaterThanOrEqual(brand.x+brand.width-1);
  expect(clock.x+clock.width).toBeLessThanOrEqual(coach.x+1);
  expect(clock.y).toBeGreaterThanOrEqual(header.y);
  expect(clock.y+clock.height).toBeLessThanOrEqual(header.y+header.height+1);
  await expect(page.locator('#headerSaveClock')).toHaveAttribute('data-save-state','saved');
  const dateFont=await page.locator('#dayTitle').evaluate(el=>getComputedStyle(el).fontSize);
  for (const id of ['dailyPrevDay','dailyNextDay']) {
    const box=await page.locator('#'+id).boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(info.project.name.startsWith('desktop')?104:size.width<=640?44:52);
  }
  await expect.poll(()=>page.locator('#dayTitle').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBeTruthy();
  await page.locator('#dailyPrevDay').click();
  await expect(page.locator('#dailyDateSwipeZone')).not.toHaveClass(/is-current-day/);
  expect(await page.locator('#dayTitle').evaluate(el=>getComputedStyle(el).fontSize)).toBe(dateFont);
  expect(await page.locator('#dayTitle').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBeTruthy();
  await page.locator('#dailyNextDay').click();
  await expect(page.locator('#dailyDateSwipeZone')).toHaveClass(/is-current-day/);
  if(info.project.name.startsWith('desktop')) {
    const edges=async()=>{
      const zone=await page.locator('#dailyDateSwipeZone').boundingBox();
      const heading=await page.locator('.daily-heading').boundingBox();
      const previous=await page.locator('#dailyPrevDay').boundingBox();
      const next=await page.locator('#dailyNextDay').boundingBox();
      expect(Math.abs(previous.x-heading.x)).toBeLessThanOrEqual(2);
      expect(Math.abs(next.x+next.width-heading.x-heading.width)).toBeLessThanOrEqual(2);
      expect(zone.width).toBeGreaterThanOrEqual(heading.width-2);
    };
    await edges();
    await page.locator('#dailyPrevDay').click();
    await expect(page.locator('#dailyDateSwipeZone')).not.toHaveClass(/is-current-day/);
    await edges();
    await page.locator('#dailyNextDay').click();
    await expect(page.locator('#dailyDateSwipeZone')).toHaveClass(/is-current-day/);
  }
  const inputs=page.locator('.day-task-panel .task-text-input');
  let visible=0;
  for(let i=0;i<await inputs.count();i++) {
    const box=await inputs.nth(i).boundingBox();
    if(box && box.y>=date.y+date.height && box.y+box.height<=Math.min(nav.y>date.y?nav.y:size.height,size.height)) visible++;
  }
  expect(visible).toBeGreaterThanOrEqual(size.width<=640?5:3);
  await page.screenshot({path:info.outputPath('layout.png'),fullPage:true});
});

test('edit, completion, animated save and new browser context preserve server data', async ({browser,context,page,request},info) => {
  await open(context,page);
  await request.post('/qa/delay',{data:{seconds:2}});
  const input=page.locator('.day-task-panel .task-text-input').first();
  await input.fill('QA 수정 완료'); await input.blur();
  await expect(page.locator('#headerSaveClock')).toHaveAttribute('data-save-state','saving');
  if(page.viewportSize().width<=640) {
    const clock=page.locator('.save-clock-face');
    expect(await clock.evaluate(el=>getComputedStyle(el,'::before').animationName)).toBe('planner-clock-tick');
    await page.screenshot({path:info.outputPath('saving-clock.png')});
  }
  await expect(page.locator('#topSaveStatus')).toHaveAttribute('data-save-state','saved',{timeout:30000});
  await page.locator('.day-task-panel .task-cycle').first().click();
  await expect(page.locator('.day-task-panel .task-row').first()).toHaveClass(/done/);
  await expect(page.locator('#topSaveStatus')).toHaveAttribute('data-save-state','saved',{timeout:30000});
  const snapshot=await (await request.get('/qa/snapshot')).json();
  const tasks=Object.values(snapshot.state.days).flatMap(d=>Object.values(d.tasks||{}).flat());
  expect(tasks.some(t=>t.text==='QA 수정 완료' && t.done)).toBeTruthy();
  // Empty storage and an entirely new context: recovery must come from HTTP, not cache.
  const fresh=await browser.newContext({...info.project.use, timezoneId:'Asia/Seoul'});
  await fresh.addInitScript(s=>localStorage.setItem('beyondWorkAuthSession.v1',JSON.stringify(s)),session);
  await fresh.route('**/*', r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  const reopened=await fresh.newPage(); await reopened.goto('http://127.0.0.1:8765/dashboard/index.html');
  await expect(reopened.locator('.day-task-panel .task-text-input').first()).toHaveValue('QA 수정 완료');
  await expect(reopened.locator('.day-task-panel .task-row').first()).toHaveClass(/done/);
  await fresh.close();
});

test('new priority and completion paint before preparing the planner save', async ({ context, page, request }, info) => {
  await open(context, page);
  const title = 'QA 신규 우선업무';
  const board = page.locator('#taskBoard');
  const rows = board.locator('.task-row');
  const blankIndex = await rows.evaluateAll(items =>
    items.findIndex(item => !item.querySelector('.task-text-input').value));
  const row = rows.nth(blankIndex);
  await row.locator('input.task-text-input').fill(title);
  await row.locator('input.task-text-input').blur();
  await expect(page.locator('#topSaveStatus')).toHaveAttribute('data-save-state', 'saved');

  await request.post('/qa/delay', { data: { seconds: 2 } });
  await page.evaluate(() => {
    let pendingFrame = null;
    window.taskActionFrames = [];
    const captureHistory = window.captureTaskRecoveryHistory;
    window.captureTaskRecoveryHistory = () => {
      if (pendingFrame) pendingFrame.saves++;
      captureHistory();
    };
    for (const [event, selector] of [['input', '.priority-select'], ['click', '.task-cycle']]) {
      document.querySelector('#taskBoard').addEventListener(event, ({ target }) => {
        if (!target.matches(selector)) return;
        const row = target.closest('.task-row');
        const frame = { saves: 0 };
        pendingFrame = frame;
        requestAnimationFrame(() => {
          frame.label = row.querySelector('.task-status-label').textContent;
          frame.marker = row.querySelector('.task-cycle').textContent;
          window.taskActionFrames.push(frame);
          pendingFrame = null;
        });
      }, true);
    }
  });

  await row.locator('.priority-select').selectOption('B');
  await expect(row.locator('.task-status-label')).toHaveText('B');
  await expect.poll(() => page.evaluate(() => window.taskActionFrames.slice())).toEqual([
    { saves: 0, label: 'B', marker: '' },
  ]);
  const completion = row.locator('.task-cycle');
  if (info.project.use.hasTouch) await completion.tap();
  else await completion.click();
  await expect(row).toHaveClass(/marker-check/);
  await expect.poll(() => page.evaluate(() => window.taskActionFrames.slice())).toEqual([
    { saves: 0, label: 'B', marker: '' },
    { saves: 0, label: 'B', marker: '✓' },
  ]);
  await expect(page.locator('#dailyCompletion')).toHaveText('1/21');
  await expect(page.locator('#topSaveStatus')).toHaveAttribute('data-save-state', 'saved', { timeout: 30000 });
  const { state } = await (await request.get('/qa/snapshot')).json();
  expect(Object.values(state.days).flatMap(day => day.tasks?.B || []))
    .toContainEqual(expect.objectContaining({ text: title, priority: 'B', done: true }));
  await page.reload();
  await expect(board.locator('.task-row').filter({ has: page.locator(`input[value="${title}"]`) }))
    .toHaveClass(/marker-check/);

  // A tab can be backgrounded or closed before the next frame runs.
  await row.locator('.priority-select').evaluate(select => {
    select.value = 'C';
    select.dispatchEvent(new Event('input', { bubbles: true }));
    window.dispatchEvent(new PageTransitionEvent('pagehide'));
  });
  await expect.poll(async () => {
    const { state } = await (await request.get('/qa/snapshot')).json();
    return Object.values(state.days).flatMap(day => day.tasks?.C || []);
  }, { timeout: 15000 }).toContainEqual(expect.objectContaining({ text: title, priority: 'C', done: true }));
});

test('two independent browsers merge overlapping saves without reverting unrelated edits', async ({browser,context,page,request},info) => {
  await open(context,page);
  const other=await browser.newContext({...info.project.use,timezoneId:'Asia/Seoul'});
  const second=await other.newPage(); await open(other,second);
  await request.post('/qa/delay',{data:{seconds:4}});
  const conflictReplies=[];
  for(const p of [page,second]) p.on('response',response=>{
    if(new URL(response.url()).pathname==='/api/state' && response.request().method()==='POST') {
      conflictReplies.push(response.json().then(body=>body.stale===true));
    }
  });
  const left=page.locator('.day-task-panel .task-text-input').nth(0);
  const right=second.locator('.day-task-panel .task-text-input').nth(1);
  // Finish each editing gesture before switching the automation keyboard to
  // the other context; the delayed HTTP requests still overlap on the server.
  await left.fill('QA 첫 브라우저 수정'); await left.blur();
  await page.locator('#dailyCompletion').click();
  await right.fill('QA 두 번째 브라우저 수정'); await right.blur();
  await second.locator('#dailyCompletion').click();
  await Promise.all([page,second].map(p=>expect(p.locator('#topSaveStatus')).toHaveAttribute('data-save-state','saved',{timeout:45000})));
  await expect.poll(async()=>{
    const data=await (await request.get('/qa/snapshot')).json();
    return Object.values(data.state.days).flatMap(d=>Object.values(d.tasks||{}).flat()).map(t=>t.text);
  },{timeout:15000}).toEqual(expect.arrayContaining(['QA 첫 브라우저 수정','QA 두 번째 브라우저 수정']));
  expect((await Promise.all(conflictReplies)).some(Boolean)).toBeTruthy();
  await other.close();
});

test('merged appointments retain the height and position of their original slots', async ({ context, page }) => {
  await open(context, page);
  const phone = page.viewportSize().width <= 640;
  const list = page.locator('#appointmentList');
  const slots = await list.locator('.appointment-row').evaluateAll(rows =>
    rows.map(row => row.dataset.appointmentSlot));
  const firstRow = list.locator(`[data-appointment-slot="${slots[0]}"]`);
  const footprint = () => list.evaluate((element, slots) => {
    const firstTop = element.firstElementChild.offsetTop;
    return slots.map(slot => {
      const row = element.querySelector(`[data-appointment-slot="${slot}"]`);
      if (!row) return null;
      const top = row.offsetTop - firstTop;
      return { top, bottom: top + row.offsetHeight };
    });
  }, slots);
  const expectSamePosition = (actual, expected) => {
    expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
  };

  const splitView = phone ? await footprint() : null;
  const openSchedule = page.locator('[data-mobile-focus-open="schedule"]');
  if (phone) {
    await openSchedule.click();
    await expect(page.locator('.day-main-panel')).toHaveClass(/is-focus-schedule/);
  }

  const original = await footprint();
  for (const span of [2, 3]) {
    await firstRow.locator('.appointment-merge-button').click();
    await expect(firstRow).toHaveAttribute('data-appointment-span', String(span));
    const merged = await footprint();
    expectSamePosition(merged[0].bottom, original[span - 1].bottom);
    expectSamePosition(merged[span].top, original[span].top);
  }

  if (phone) {
    await page.locator('.day-schedule-panel [data-mobile-focus-close]').click();
    await expect(page.locator('.day-main-panel')).not.toHaveClass(/is-focus-schedule/);
    const merged = await footprint();
    expectSamePosition(merged[0].bottom, splitView[2].bottom);
    expectSamePosition(merged[3].top, splitView[3].top);
    await openSchedule.click();
  }

  await firstRow.locator('.split-appointment').click();
  await expect(firstRow).toHaveAttribute('data-appointment-span', '1');
  const restored = await footprint();
  for (const [index, row] of restored.entries()) {
    expectSamePosition(row.top, original[index].top);
    expectSamePosition(row.bottom, original[index].bottom);
  }

  page.once('dialog', dialog => dialog.accept());
  await page.locator('[data-schedule-range="all"]').click();
  await expect(firstRow).toHaveAttribute('data-appointment-span', String(slots.length));
  await expect(firstRow.locator('input')).toHaveValue('QA 일정');
  const allDay = await footprint();
  expectSamePosition(allDay[0].bottom, original.at(-1).bottom);
  await expect(page.locator('#topSaveStatus')).toHaveAttribute('data-save-state', 'saved');
});

test('phone navigation never covers task or schedule headers while lists scroll', async ({context,page},info) => {
  test.skip(info.project.use.viewport.width>640,'Phone-specific overlapping navigation regression');
  await open(context,page);
  const check=async()=>{
    const date=await page.locator('.daily-title').boundingBox();
    const pulse=await page.locator('#dailyPulseZone').boundingBox();
    expect(pulse.y).toBeGreaterThanOrEqual(date.y+date.height);
    for(const selector of ['.day-task-panel > h3','.day-schedule-panel > h3']) {
      const title=page.locator(selector), box=await title.boundingBox();
      expect(box.y).toBeGreaterThanOrEqual(pulse.y+pulse.height);
      expect(await title.evaluate(el=>{
        const r=el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(r.x+Math.min(20,r.width/2),r.y+r.height/2));
      })).toBeTruthy();
    }
    const bottom=await page.locator('.quick-strip').boundingBox();
    for(const id of ['taskBoard','appointmentList']) {
      const list=await page.locator('#'+id).boundingBox();
      expect(list.y+list.height).toBeLessThanOrEqual(bottom.y+1);
    }
  };
  // A real iPhone UA enables the paged swipe animation. Wait for the panel to
  // settle before hit-testing headers; keep all overlap assertions unchanged.
  await expect(async()=>check()).toPass({timeout:5000});
  await page.locator('#dailyNextDay').click();
  await expect(page.locator('#dailyDateSwipeZone')).not.toHaveClass(/is-current-day/);
  await expect(async()=>check()).toPass({timeout:5000});
  for(const id of ['taskBoard','appointmentList']) await page.locator('#'+id).evaluate(el=>{el.scrollTop=200;});
  await expect(async()=>check()).toPass({timeout:5000});
  await page.screenshot({path:info.outputPath('phone-lists-below-navigation.png')});
});

test('top weather shows icon and minimum/maximum without covering brand or save clock', async ({context,page}) => {
  await context.addInitScript(()=>localStorage.setItem('beyondWork.weather.v1',JSON.stringify({
    createdAt:Date.now(),data:{status:'ready',icon:'☀️',summary:'맑음',temp:12,tempMin:6,tempMax:18,label:'울산'}
  })));
  await open(context,page);
  await expect(page.locator('#weatherChip .weather-temp')).toHaveText('6° / 18°');
  await expect(page.locator('#weatherChip .weather-icon')).not.toHaveText('');
  const brand=await page.locator('.brand-row h1').boundingBox();
  const weather=await page.locator('#weatherChip').boundingBox();
  const clock=await page.locator('#headerSaveClock').boundingBox();
  expect(weather.x).toBeGreaterThanOrEqual(brand.x+brand.width-1);
  expect(weather.x+weather.width).toBeLessThanOrEqual(clock.x+1);
  await expect(page.locator('#weatherChip')).toHaveAttribute('aria-label',/최저\/최고 6° \/ 18°/);
});

test('past dates use recorded conditions and temperatures, never today weather', async ({context,page,request}) => {
  await open(context,page);
  await page.locator('#dailyPrevDay').click();
  await expect(page.locator('#weatherChip .weather-temp')).toHaveText('4°/12°');
  await expect(page.locator('#weatherChip')).toHaveAttribute('aria-label',/비.*4° \/ 12°/);
  const brand=await page.locator('.brand-row h1').boundingBox();
  const weather=await page.locator('#weatherChip').boundingBox();
  const clock=await page.locator('#headerSaveClock').boundingBox();
  expect(weather.x).toBeGreaterThanOrEqual(brand.x+brand.width-1);
  expect(weather.x+weather.width).toBeLessThanOrEqual(clock.x+1);
  expect(await page.locator('#weatherChip .weather-temp').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBeTruthy();
  await page.reload();
  await expect(page.locator('#dailyDateSwipeZone')).toHaveClass(/is-current-day/);
  await page.locator('#dailyPrevDay').click();
  await expect(page.locator('#weatherChip .weather-temp')).toHaveText('4°/12°');
  await page.locator('#dailyPrevDay').click();
  await expect(page.locator('#weatherChip .weather-temp')).toHaveText('기록 없음');
  const snapshot=await (await request.get('/qa/snapshot')).json();
  const recorded=Object.values(snapshot.state.days).map(d=>d.weather).filter(w=>w?.source==='qa-fixture');
  expect(recorded).toHaveLength(1);
  expect(recorded[0]).toMatchObject({summary:'비',tempMin:4,tempMax:12});
});

test('legacy duplicated weekly carryovers consolidate, archive and survive reload', async ({context,page,request}) => {
  const snapshot=await (await request.get('/qa/snapshot')).json();
  const today=Object.keys(snapshot.state.days).sort().at(-1);
  const date=new Date(today+'T12:00:00Z');date.setUTCDate(date.getUTCDate()-date.getUTCDay());
  const week=date.toISOString().slice(0,10);
  date.setUTCDate(date.getUTCDate()-7);const previous=date.toISOString().slice(0,10);
  const rows=['사업장 이동','김기찬세무사 방문','법원앞부지 건축과 사전'].map((text,i)=>({id:'old-a-'+i,text,done:false,status:'미완료',carryoverSourceId:'source-'+i,carryoverFromWeek:previous}));
  snapshot.state.weeks[week]={priorities:[...rows,...rows.map((t,i)=>({...t,id:'old-b-'+i}))],compass:[]};
  await request.post('/api/state',{data:{state:snapshot.state,baseUpdatedAt:snapshot.updatedAt}});
  await open(context,page);
  const values=()=>page.locator('#dayCompass .weekly-priority-text').evaluateAll(nodes=>nodes.map(n=>n.value).filter(Boolean));
  expect(await values()).toEqual(rows.map(t=>t.text));
  await page.locator('.day-task-panel .task-text-input').first().fill('QA 주간 중복 보존 검사');
  await page.locator('.day-task-panel .task-text-input').first().blur();
  await expect.poll(async()=>{
    const saved=await (await request.get('/qa/snapshot')).json();
    return saved.state.weeks[week]?.priorityDuplicateArchive?.length;
  }).toBe(3);
  await page.reload();
  await expect(page.locator('.day-task-panel .task-text-input').first()).toHaveValue('QA 주간 중복 보존 검사');
  expect(await values()).toEqual(rows.map(t=>t.text));
});

function weeklyFixtureDates(snapshot) {
  const today=Object.keys(snapshot.state.days).sort().at(-1);
  const sunday=new Date(today+'T12:00:00Z');
  sunday.setUTCDate(sunday.getUTCDate()-sunday.getUTCDay());
  const week=sunday.toISOString().slice(0,10);
  sunday.setUTCDate(sunday.getUTCDate()-7);
  return {today,week,previous:sunday.toISOString().slice(0,10)};
}

const weeklyCompletionRow=(page,label)=>page.locator('#dayCompass .weekly-priority-row').filter({
  has:page.locator(`input[value="${label}"]`),
});

test('weekly completion survives an older duplicate and a fresh reload',async({context,page,request})=>{
  const snapshot=await(await request.get('/qa/snapshot')).json();
  const {today,week,previous}=weeklyFixtureDates(snapshot);
  const label='QA 완료한 주간 업무';
  const openCopy={id:'old-open',text:label,done:false,status:'미완료',carryoverSourceId:'weekly-origin',carryoverFromWeek:previous};
  snapshot.state.weeks[week]={priorities:[openCopy,{
    ...openCopy,id:'saved-completion',status:'완료',done:true,completedDate:today,
    completedAt:today+'T01:00:00Z',lifecycleUpdatedAt:today+'T01:00:01Z',postponeMode:'',
  }],compass:[]};
  await request.post('/api/state',{data:{state:snapshot.state,baseUpdatedAt:snapshot.updatedAt}});
  await open(context,page);
  const row=weeklyCompletionRow(page,label);
  await expect(row).toHaveCount(1);
  await expect(row).toHaveClass(/marker-check/);
  const input=page.locator('.day-task-panel .task-text-input').first();
  await input.fill('QA 주간 완료 보존'); await input.blur();
  await expect.poll(async()=>{
    const saved=await(await request.get('/qa/snapshot')).json();
    return saved.state.weeks[week]?.priorityDuplicateArchive?.map(item=>item.id);
  }).toContain('old-open');
  await page.evaluate(()=>localStorage.clear());
  await page.reload();
  await expect(row).toHaveCount(1);
  await expect(row).toHaveClass(/marker-check/);
});

test('a stale first save of the week cannot reopen a completed carryover',async({browser,context,page,request},info)=>{
  const snapshot=await(await request.get('/qa/snapshot')).json();
  const {week,previous}=weeklyFixtureDates(snapshot);
  const label='QA 첫 주간 이월 완료';
  snapshot.state.weeks[previous]={priorities:[{id:'prior-week-item',text:label,done:false,status:'미완료'}],compass:[]};
  await request.post('/api/state',{data:{state:snapshot.state,baseUpdatedAt:snapshot.updatedAt}});
  await open(context,page);
  const other=await browser.newContext({...info.project.use,timezoneId:'Asia/Seoul'});
  let release;
  const blocked=new Promise(resolve=>{release=resolve;});
  try {
    const second=await other.newPage();
    await open(other,second);
    let queued=false;
    await other.route('**/api/state',async route=>{
      if(route.request().method()==='POST') {
        const {state}=route.request().postDataJSON();
        queued ||= Object.values(state.days).some(day=>day.tasks?.A?.some(item=>item.id==='qa-1'&&item.done));
        await blocked;
      }
      await route.continue();
    });
    await second.locator('#taskBoard .task-row .task-cycle').first().click();
    await expect.poll(()=>queued).toBeTruthy();
    if(await page.locator('#daySwipe').evaluate(el=>getComputedStyle(el).display==='flex')) {
      await page.locator('#dailyPulseZone [data-day-panel-jump="week"]').click();
    }
    await weeklyCompletionRow(page,label).locator('.task-cycle').click();
    const readSaved=async()=>(await(await request.get('/qa/snapshot')).json()).state;
    await expect.poll(async()=>{
      return (await readSaved()).weeks[week]?.priorities?.find(item=>item.text===label)?.done;
    }).toBe(true);
    await second.bringToFront();
    const stale=second.waitForResponse(response=>new URL(response.url()).pathname==='/api/state'&&response.request().method()==='POST');
    release();
    expect((await(await stale).json()).stale).toBe(true);
    await expect.poll(async()=>{
      const saved=await readSaved();
      return {
        checked:saved.weeks[week]?.priorities?.filter(item=>item.text===label).map(item=>item.done),
        dailyChecked:Object.values(saved.days).some(day=>day.tasks?.A?.some(item=>item.id==='qa-1'&&item.done)),
      };
    },{timeout:20000}).toEqual({checked:[true],dailyChecked:true});
  } finally { release(); await other.close(); }
});
