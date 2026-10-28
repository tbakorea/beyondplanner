const { test, expect } = require('@playwright/test');
const session = { email:'browser-qa@example.test', provider:'supabase', accessToken:'isolated-fixture-only', tier:'ceo', expiresAt:4102444800 };
async function open(context, page) {
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
  await expect(page.locator('.manage-menu-button')).toHaveAttribute('data-save-state','saving');
  if(page.viewportSize().width<=640) {
    const clock=page.locator('.manage-combo-icon');
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
