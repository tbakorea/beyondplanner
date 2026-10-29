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

test('two independent browsers merge overlapping saves without reverting unrelated edits', async ({browser,context,page,request},info) => {
  await open(context,page);
  const other=await browser.newContext({...info.project.use,timezoneId:'Asia/Seoul'});
  const second=await other.newPage(); await open(other,second);
  await request.post('/qa/delay',{data:{seconds:2}});
  const left=page.locator('.day-task-panel .task-text-input').nth(0);
  const right=second.locator('.day-task-panel .task-text-input').nth(1);
  await Promise.all([left.fill('QA 첫 브라우저 수정'),right.fill('QA 두 번째 브라우저 수정')]);
  await Promise.all([left.blur(),right.blur()]);
  await Promise.all([page,second].map(p=>expect(p.locator('#topSaveStatus')).toHaveAttribute('data-save-state','saved',{timeout:45000})));
  await expect.poll(async()=>{
    const data=await (await request.get('/qa/snapshot')).json();
    return Object.values(data.state.days).flatMap(d=>Object.values(d.tasks||{}).flat()).map(t=>t.text);
  },{timeout:15000}).toEqual(expect.arrayContaining(['QA 첫 브라우저 수정','QA 두 번째 브라우저 수정']));
  await other.close();
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
  await check();
  await page.locator('#dailyNextDay').click();
  await expect(page.locator('#dailyDateSwipeZone')).not.toHaveClass(/is-current-day/);
  await check();
  for(const id of ['taskBoard','appointmentList']) await page.locator('#'+id).evaluate(el=>{el.scrollTop=200;});
  await check();
  await page.screenshot({path:info.outputPath('phone-lists-below-navigation.png')});
});
