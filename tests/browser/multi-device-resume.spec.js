const { test, expect } = require('@playwright/test');
const session = {email:'resume-qa@example.test',provider:'supabase',accessToken:'isolated-fixture-only',tier:'ceo',expiresAt:4102444800};
async function open(context, page) {
  await context.addInitScript(value => localStorage.setItem('beyondWorkAuthSession.v1', JSON.stringify(value)), session);
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.goto('/dashboard/index.html');
  await expect(page.locator('#bootScreen')).toHaveCount(0);
  await expect(page.locator('#taskBoard .task-text-input').first()).toHaveValue('QA 업무 01');
}
async function visibility(page, hidden) {
  await page.evaluate(hidden => {
    Object.defineProperty(document, 'hidden', {configurable:true, value:hidden});
    document.dispatchEvent(new Event('visibilitychange'));
    if (hidden) plannerHiddenAt = Date.now() - 3600000;
  }, hidden);
}
async function edit(page, index, value) {
  await page.locator('#taskBoard .task-text-input').nth(index).fill(value);
  await page.locator('#dailyCompletion').click();
  await expect(page.locator('#topSaveStatus')).toHaveAttribute('data-save-state', 'saved', {timeout:20000});
}
test.beforeEach(async ({request}) => { await request.post('/qa/reset'); });

test('waking a stale device paints the Mac revision before any pending autosave', async ({browser,context,page}, info) => {
  await open(context,page);
  const mac = await browser.newContext({...info.project.use,timezoneId:'Asia/Seoul'});
  const latest = await mac.newPage();
  let releaseRead;
  const readGate = new Promise(resolve => {releaseRead=resolve;});
  try {
    await open(mac,latest);
    await visibility(page,true);
    await edit(latest,0,'QA 최신 Mac 업무');
    let resumedRead = false, posts = 0;
    await context.route('**/api/state*', async route => {
      if (route.request().method() === 'GET') {resumedRead=true;await readGate;}
      else posts++;
      await route.continue();
    });
    await visibility(page,false);
    expect(await page.evaluate(() => resumeServerValidationRequired && !accountSaveReady)).toBe(true);
    await page.evaluate(() => persistStateToServer());
    expect(posts).toBe(0);
    await expect.poll(() => resumedRead).toBe(true);
    releaseRead();
    await expect(page.locator('#taskBoard .task-text-input').first()).toHaveValue('QA 최신 Mac 업무');
    await expect(page.locator('#topSaveStatus')).toHaveAttribute('data-save-state','saved');
    expect(await page.evaluate(() => readPlannerBaseState().days[iso(selectedDate)].tasks.A[0].text)).toBe('QA 최신 Mac 업무');
  } finally {releaseRead();await mac.close();}
});

test('three devices keep a sleeping iPad edit and the newer Mac and phone edits', async ({browser,context,page,request}, info) => {
  await open(context,page);
  const mac = await browser.newContext({...info.project.use,timezoneId:'Asia/Seoul'});
  const phone = await browser.newContext({...info.project.use,timezoneId:'Asia/Seoul'});
  try {
    const latest=await mac.newPage(), mobile=await phone.newPage();
    await open(mac,latest);await open(phone,mobile);
    let padOffline=true;
    await context.route('**/api/state*', route => padOffline && route.request().method()==='POST' ? route.abort() : route.continue());
    await page.locator('#taskBoard .task-text-input').nth(2).fill('QA 아이패드 미저장 입력');
    await page.locator('#taskBoard .task-text-input').first().fill('QA 오래된 iPad 충돌 입력');
    await page.locator('#dailyCompletion').click();
    await visibility(page,true);
    await edit(latest,0,'QA Mac 최신 변경');
    await edit(mobile,1,'QA iPhone 최신 변경');
    padOffline=false;
    await visibility(page,false);
    await expect.poll(async () => {
      const {state}=await (await request.get('/qa/snapshot')).json();
      return Object.values(state.days).flatMap(day=>Object.values(day.tasks||{}).flat()).map(task=>task.text);
    }, {timeout:20000}).toEqual(expect.arrayContaining(['QA Mac 최신 변경','QA iPhone 최신 변경','QA 아이패드 미저장 입력']));
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem(plannerStorageKey()+'.suspendedRecovery'))
      .state.days[iso(selectedDate)].tasks.A[0].text)).toBe('QA 오래된 iPad 충돌 입력');
    await page.reload();
    await expect(page.locator('#bootScreen')).toHaveCount(0);
    await expect.poll(() => page.locator('#taskBoard .task-text-input').evaluateAll(inputs=>inputs.map(input=>input.value)))
      .toEqual(expect.arrayContaining(['QA Mac 최신 변경','QA iPhone 최신 변경','QA 아이패드 미저장 입력']));
  } finally {await mac.close();await phone.close();}
});

test('a failed wake read keeps saving blocked and retries the database automatically', async ({context,page,request}) => {
  await open(context,page);
  await visibility(page,true);
  const snapshot=await (await request.get('/qa/snapshot')).json();
  const today=Object.keys(snapshot.state.days).sort().at(-1);
  snapshot.state.days[today].tasks.A[0].text='QA 통신 복구 후 최신 업무';
  await request.post('/api/state',{data:{state:snapshot.state,baseUpdatedAt:snapshot.updatedAt}});
  let reads=0, posts=0;
  await context.route('**/api/state*', route => {
    if (route.request().method()==='GET' && ++reads===1) {
      return route.fulfill({status:503,json:{error:'QA 일시적인 DB 오류'}});
    }
    if (route.request().method()==='POST') posts++;
    return route.continue();
  });
  await visibility(page,false);
  await expect.poll(() => page.evaluate(() => resumeServerValidationRetryCount)).toBe(1);
  expect(await page.evaluate(() => resumeServerValidationRequired && !accountSaveReady)).toBe(true);
  await page.evaluate(() => persistStateToServer());
  expect(posts).toBe(0);
  await expect(page.locator('#taskBoard .task-text-input').first()).toHaveValue('QA 통신 복구 후 최신 업무');
  expect(reads).toBeGreaterThanOrEqual(2);
  expect(await page.evaluate(() => accountSaveReady && !resumeServerValidationRequired)).toBe(true);
});

test('a cold restart cannot let an older pending snapshot replace the latest Mac edit', async ({context,page,request}) => {
  const snapshot=await (await request.get('/qa/snapshot')).json();
  const today=Object.keys(snapshot.state.days).sort().at(-1);
  const pending=JSON.parse(JSON.stringify(snapshot.state));
  pending.days[today].tasks.A[0].text='QA 오래된 재실행 충돌';
  pending.days[today].tasks.A[1].text='QA 재실행 미저장 입력';
  await context.addInitScript(({session,snapshot,pending}) => {
    const suffix=encodeURIComponent(session.email);
    localStorage.setItem('beyondWorkAuthSession.v1',JSON.stringify(session));
    localStorage.setItem('franklinClassicPlanner2026.v1.'+suffix,JSON.stringify(pending));
    localStorage.setItem('beyondWorkPlannerStateBase.v1.'+suffix,JSON.stringify(snapshot.state));
    localStorage.setItem('beyondWorkPlannerStateMeta.v1.'+suffix,JSON.stringify({
      dirty:true,mutationSeq:2,pendingEditVersion:1,pendingSnapshotValid:true,
      updatedAt:new Date().toISOString(),baseUpdatedAt:snapshot.updatedAt,accountEmail:session.email,
    }));
  },{session,snapshot,pending});
  snapshot.state.days[today].tasks.A[0].text='QA Mac 최종 저장';
  await request.post('/api/state',{data:{state:snapshot.state,baseUpdatedAt:snapshot.updatedAt}});
  await context.route('**/*', route => new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  await page.goto('/dashboard/index.html');
  await expect(page.locator('#bootScreen')).toHaveCount(0);
  await expect(page.locator('#taskBoard .task-text-input').first()).toHaveValue('QA Mac 최종 저장');
  await expect.poll(async () => {
    const {state}=await (await request.get('/qa/snapshot')).json();
    return state.days[today].tasks.A.map(task=>task.text);
  }).toEqual(expect.arrayContaining(['QA Mac 최종 저장','QA 재실행 미저장 입력']));
});
