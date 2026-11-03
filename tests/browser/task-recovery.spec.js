const {test,expect}=require('@playwright/test');
async function open(context,page,info){
  await context.addInitScript(mode=>{
    localStorage.setItem('beyondWorkAuthSession.v1',JSON.stringify({email:'browser-qa@example.test',provider:'supabase',accessToken:'isolated-fixture-only',tier:'ceo',expiresAt:4102444800}));
    if(mode)localStorage.setItem('beyondWorkMode',mode);
  },info.project.metadata.plannerMode);
  await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  await page.goto('/dashboard/index.html');
  await expect(page.locator('.day-task-panel .task-text-input').first()).toHaveValue('QA 업무 01');
  await expect(page.locator('#topSaveStatus')).toHaveAttribute('data-save-state','saved',{timeout:30000});
}
test.beforeEach(async({request})=>{await request.post('/qa/reset');});
test('task history saves to server, survives restart and restores only a separate copy',async({context,page,request},info)=>{
  await open(context,page,info);
  const input=page.locator('.day-task-panel .task-text-input').first();
  await input.fill('QA 수정한 현재 업무');await input.blur();
  await expect.poll(async()=>{
    const data=await(await request.get('/qa/snapshot')).json();return data.state.taskRecoveryHistory?.length||0;
  }).toBeGreaterThan(0);
  await page.evaluate(()=>localStorage.clear());
  await page.reload();
  await expect(page.locator('.day-task-panel .task-text-input').first()).toHaveValue('QA 수정한 현재 업무');
  await page.locator('.task-recovery-open').click();
  const dialog=page.locator('#taskRecoveryDialog');await expect(dialog).toBeVisible();
  await expect(dialog.locator('h3').first()).toHaveText('QA 업무 01');
  const box=await dialog.boundingBox(),size=page.viewportSize();
  expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(size.width);
  expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(size.height);
  await page.screenshot({path:info.outputPath('task-history.png')});
  const button=dialog.locator('.recovery-restore').first();await button.click();await button.click();
  await expect(button).toBeDisabled();
  await expect.poll(async()=>{
    const data=await(await request.get('/qa/snapshot')).json();
    return Object.values(data.state.days).flatMap(d=>Object.values(d.tasks||{}).flat()).filter(t=>t.id?.startsWith('recovered:')).length;
  }).toBe(1);
  await dialog.locator('.recovery-close').click();await page.reload();
  const saved=await(await request.get('/qa/snapshot')).json();
  const tasks=Object.values(saved.state.days).flatMap(d=>Object.values(d.tasks||{}).flat());
  expect(tasks.some(t=>t.text==='QA 수정한 현재 업무')).toBe(true);
  expect(tasks.filter(t=>t.id?.startsWith('recovered:'))).toHaveLength(1);
  await page.locator('.task-recovery-open').click();
  await expect(page.locator('.recovery-restore').first()).toBeDisabled();
});

test('restoring a timed history entry does not alter appointments or recreate Money links',async({context,page,request},info)=>{
  const data=await(await request.get('/qa/snapshot')).json();
  const today=Object.keys(data.state.days).sort().at(-1);
  data.state.taskRecoveryHistory=[{id:'history-time',at:new Date().toISOString(),dayKey:today,taskId:'removed',before:{text:'결제 확인 14:00',status:'완료',done:true,priority:'A'},after:null}];
  await request.post('/api/state',{data:{state:data.state,baseUpdatedAt:data.updatedAt}});
  await open(context,page,info);
  await page.locator('.task-recovery-open').click();
  const button=page.locator('.recovery-restore');await button.click();await button.click();
  await expect.poll(async()=>{
    const saved=await(await request.get('/qa/snapshot')).json();return saved.state.days[today].tasks.A.some(t=>t.id==='recovered:history-time');
  }).toBe(true);
  const saved=await(await request.get('/qa/snapshot')).json();
  const filled=appointments=>Object.fromEntries(Object.entries(appointments).filter(([,text])=>String(text).trim()));
  expect(filled(saved.state.days[today].appointments)).toEqual(filled(data.state.days[today].appointments));
  expect(saved.state.days[today].appointments['14:00']||'').toBe('');
  const restored=saved.state.days[today].tasks.A.find(t=>t.id==='recovered:history-time');
  expect(restored.done).toBe(false);expect(restored.financeItemId).toBeUndefined();
});

test('deleting a priority leaves a recoverable previous version after reopening',async({context,page,request},info)=>{
  await open(context,page,info);
  page.on('dialog',d=>d.accept());
  if(page.viewportSize().width<=640) await page.locator('[data-mobile-focus-open="tasks"]').click();
  await page.locator('.day-task-panel .task-delete').first().click();
  await expect.poll(async()=>{
    const data=await(await request.get('/qa/snapshot')).json();return data.state.taskRecoveryHistory?.some(e=>e.before.text==='QA 업무 01'&&e.after===null);
  }).toBe(true);
  await page.reload();await page.locator('.task-recovery-open').click();
  await expect(page.locator('.recovery-record h3').first()).toHaveText('QA 업무 01');
  const button=page.locator('.recovery-restore').first();await button.click();await button.click();
  await expect.poll(async()=>{
    const data=await(await request.get('/qa/snapshot')).json();
    return Object.values(data.state.days).flatMap(d=>Object.values(d.tasks||{}).flat()).some(t=>t.id?.startsWith('recovered:')&&t.text==='QA 업무 01');
  }).toBe(true);
});
