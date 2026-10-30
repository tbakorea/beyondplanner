const { test, expect } = require('@playwright/test');

test('iPad lists reach their final rows inside the visible workspace after resize', async ({context,page,request},info) => {
  test.skip(!info.project.name.startsWith('ipad'), 'Tablet Safari layout');
  await request.post('/qa/reset');
  await context.addInitScript(mode => {
    localStorage.setItem('beyondWorkAuthSession.v1', JSON.stringify({email:'browser-qa@example.test',provider:'supabase',accessToken:'isolated-fixture-only',tier:'ceo',expiresAt:4102444800}));
    if(mode) localStorage.setItem('beyondWorkMode',mode);
  },info.project.metadata.plannerMode);
  await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  await page.goto('/dashboard/index.html');
  await expect(page.locator('.day-task-panel .task-text-input').first()).toHaveValue('QA 업무 01');
  const verify = async () => {
    for(const [id, row] of [['taskBoard','.task-text-input'],['appointmentList','.appointment-row']]) {
      const list=page.locator('#'+id);
      const box=await list.boundingBox();
      expect(box.height).toBeGreaterThan(100);
      expect(box.y+box.height).toBeLessThanOrEqual(page.viewportSize().height+1);
      const result=await list.evaluate(el=>{
        el.scrollTop=el.scrollHeight;
        return {top:el.scrollTop,overflow:getComputedStyle(el).overflowY};
      });
      expect(result.overflow).toBe('auto');
      expect(result.top).toBeGreaterThan(0);
      const last=await list.locator(row).last().boundingBox();
      expect(last.y).toBeGreaterThanOrEqual(box.y-1);
      expect(last.y+last.height).toBeLessThanOrEqual(box.y+box.height+1);
      const title=await page.locator(id==='taskBoard'?'.day-task-panel > .panel-title-row':'.day-schedule-panel > .panel-title-row').boundingBox();
      expect(title.y+title.height).toBeLessThanOrEqual(box.y+1);
    }
  };
  await verify();
  const size=page.viewportSize();
  await page.setViewportSize({width:size.width,height:size.height-120});
  await verify();
  await page.screenshot({path:info.outputPath('ipad-bottom-rows.png')});
});
