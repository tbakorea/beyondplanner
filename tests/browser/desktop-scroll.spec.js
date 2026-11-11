const { test, expect } = require('@playwright/test');

for (const mode of ['classic', 'ceo']) {
  test(`${mode}: mouse wheel reaches final tasks and controls without moving the page`, async ({context,page,request},info) => {
    test.skip(!['desktop', 'mac-safari'].includes(info.project.name), 'Desktop mouse scrolling');
    await request.post('/qa/reset');
    const snapshot = await (await request.get('/qa/snapshot')).json();
    const today = Object.keys(snapshot.state.days).sort().at(-1);
    snapshot.state.days[today].tasks.A = Array.from({length:48}, (_, i) => ({
      id:`wheel-${i}`, text:`스크롤 업무 ${String(i+1).padStart(2,'0')}`, done:false, status:'미완료',
    }));
    await request.post('/api/state', {data:{state:snapshot.state,baseUpdatedAt:snapshot.updatedAt}});
    await context.addInitScript(mode => {
      localStorage.setItem('beyondWorkAuthSession.v1', JSON.stringify({email:'browser-qa@example.test',provider:'supabase',accessToken:'isolated-fixture-only',tier:'ceo',expiresAt:4102444800}));
      localStorage.setItem('beyondWorkMode',mode);
      localStorage.setItem('beyondWorkOnboardingCollapsed.v1','1');
    },mode);
    await context.route('**/*', r => new URL(r.request().url()).hostname==='127.0.0.1' ? r.continue() : r.abort());
    await page.goto('/dashboard/index.html');
    await expect(page.locator('#taskBoard .task-text-input').first()).toHaveValue('스크롤 업무 01');
    await expect(page.locator('#bootScreen')).toHaveCount(0,{timeout:15000});
    await expect(page.locator('#dailyOpeningScreen')).toBeHidden();

    for (const size of [{width:1440,height:900},{width:1440,height:650},{width:900,height:700}]) {
      await page.setViewportSize(size);
      const board = page.locator('#taskBoard');
      await expect(async () => {
        const box = await board.boundingBox();
        expect(box.height).toBeGreaterThan(100);
        expect(box.y + box.height).toBeLessThanOrEqual(size.height + 1);
        expect(await board.evaluate(el => getComputedStyle(el).overflowY)).toBe('auto');
      }).toPass({timeout:5000});
      const dateBefore = await page.locator('#dayTitle').textContent();
      const title = page.locator('.day-task-panel > .panel-title-row');
      // Locator hover waits for the scaled workspace to settle after resize.
      // A cached screen coordinate can otherwise send the wheel to Schedule.
      await board.hover();
      const titleBefore = await title.boundingBox();
      const box = await board.boundingBox();
      // Real wheel input catches clipped/non-scrolling ancestors that setting
      // scrollTop directly or scrollIntoView would conceal.
      await page.mouse.wheel(0,10000);
      await expect(async () => {
        const control = await board.locator('.task-recovery-open').boundingBox();
        expect(control.y).toBeGreaterThanOrEqual(box.y-1);
        expect(control.y+control.height).toBeLessThanOrEqual(box.y+box.height+1);
        expect(await board.locator('.task-recovery-open').evaluate(el=>{
          const r=el.getBoundingClientRect();
          return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
        })).toBeTruthy();
        const after=await title.boundingBox();
        expect(after.y).toBe(titleBefore.y);
        expect(after.height).toBe(titleBefore.height);
      }).toPass({timeout:5000});
      await page.screenshot({path:info.outputPath(`${mode}-${size.width}x${size.height}-bottom.png`)});
      // Short windows need a little reverse scrolling to see the final task
      // above the blank entry row and footer. Never use scrollIntoView here.
      const finalTask = board.locator('.task-text-input').nth(47);
      await expect(finalTask).toHaveValue('스크롤 업무 48');
      for (let step=0; step<20; step++) {
        const row=await finalTask.boundingBox();
        if (row.y>=box.y-1 && row.y+row.height<=box.y+box.height+1) break;
        const top=await board.evaluate(el=>el.scrollTop);
        await page.mouse.wheel(0,-Math.min(80,box.height/2));
        await expect.poll(()=>board.evaluate(el=>el.scrollTop)).toBeLessThan(top);
      }
      const row=await finalTask.boundingBox();
      expect(row.y).toBeGreaterThanOrEqual(box.y-1);
      expect(row.y+row.height).toBeLessThanOrEqual(box.y+box.height+1);
      await page.mouse.wheel(0,-10000);
      await expect.poll(()=>board.evaluate(el=>el.scrollTop)).toBe(0);
      const schedule=page.locator('#appointmentList');
      await schedule.hover();
      const scheduleBox=await schedule.boundingBox();
      expect(scheduleBox.y+scheduleBox.height).toBeLessThanOrEqual(size.height+1);
      const scheduleTitle=page.locator('.day-schedule-panel > .panel-title-row');
      const scheduleTitleBefore=await scheduleTitle.boundingBox();
      await page.mouse.wheel(0,10000);
      await expect(async()=>{
        const last=await schedule.locator('.appointment-row').last().boundingBox();
        expect(last.y).toBeGreaterThanOrEqual(scheduleBox.y-1);
        expect(last.y+last.height).toBeLessThanOrEqual(scheduleBox.y+scheduleBox.height+1);
        const after=await scheduleTitle.boundingBox();
        expect(after.y).toBe(scheduleTitleBefore.y);
        expect(after.height).toBe(scheduleTitleBefore.height);
      }).toPass({timeout:5000});
      expect(await board.evaluate(el=>el.scrollTop)).toBe(0);
      const visibleBoard=await board.boundingBox();
      expect(visibleBoard.x).toBeGreaterThanOrEqual(-1);
      expect(visibleBoard.x+visibleBoard.width).toBeLessThanOrEqual(size.width+1);
      expect(await page.locator('#dayTitle').textContent()).toBe(dateBefore);
      expect(await page.evaluate(()=>window.scrollY)).toBe(0);
    }
    await page.screenshot({path:info.outputPath(`${mode}-mouse-scroll.png`)});
  });
}
