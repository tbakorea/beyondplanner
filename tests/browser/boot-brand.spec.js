const { test, expect } = require('@playwright/test');
const session = { email: 'browser-qa@example.test', provider: 'supabase', accessToken: 'isolated-fixture-only', tier: 'ceo', expiresAt: 4102444800 };

async function openBrandPreview(context, page, { reducedMotion = false, blockVideo = false } = {}) {
  await context.addInitScript(session => localStorage.setItem('beyondWorkAuthSession.v1', JSON.stringify(session)), session);
  await page.emulateMedia({ reducedMotion: reducedMotion ? 'reduce' : 'no-preference' });
  let releaseRead;
  const pendingRead = new Promise(resolve => { releaseRead = resolve; });
  let videoRequests = 0;
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1') return route.abort();
    if (url.pathname.endsWith('.mp4')) {
      videoRequests++;
      if (blockVideo) return route.abort();
    }
    if (url.pathname === '/api/state' && route.request().method() === 'GET') await pendingRead;
    return route.continue();
  });
  await page.goto('/dashboard/index.html');
  return { release: releaseRead, videoRequests: () => videoRequests };
}

test.beforeEach(async ({ request }) => { await request.post('/qa/reset'); });

test('English brand video plays silently and exits as soon as planner data is ready', async ({ context, page }, info) => {
  const preview = await openBrandPreview(context, page);
  const video = page.locator('#bootBrandVideo');
  try {
    await expect(page.getByRole('img', { name: 'Beyond Planner', exact: true })).toBeVisible();
    await expect(page.locator('#bootCoachingMessage')).toHaveCount(0);
    await expect.poll(() => video.evaluate(video => video.readyState)).toBeGreaterThanOrEqual(2);
    await expect.poll(() => video.evaluate(video => video.currentTime)).toBeGreaterThan(0.12);
    expect(await video.evaluate(video => ({ muted: video.muted, inline: video.playsInline, loop: video.loop, paused: video.paused })))
      .toEqual({ muted: true, inline: true, loop: true, paused: false });
    expect(await video.evaluate(video => video.duration)).toBeCloseTo(3.2, 1);
    await expect(page.locator('.boot-brand-poster')).toBeInViewport({ ratio: 0.95 });
    await page.screenshot({ path: info.outputPath('beyond-planner-motion.png') });
    const media = await video.elementHandle();
    preview.release();
    await expect(page.locator('#taskBoard .task-text-input').first()).toHaveValue('QA 업무 01');
    await expect(page.locator('#bootScreen')).toHaveCount(0);
    expect(await media.evaluate(video => video.paused)).toBe(true);
    expect(await media.evaluate(video => video.currentTime)).toBeLessThan(1.8);
    await expect(page.locator('.app-shell')).not.toHaveAttribute('inert', '');
  } finally {
    preview.release();
  }
});

test('static brand poster covers blocked video while server loading can still finish', async ({ context, page }) => {
  const preview = await openBrandPreview(context, page, { blockVideo: true });
  try {
    await expect.poll(() => preview.videoRequests()).toBeGreaterThan(0);
    await expect(page.locator('#bootBrandVideo')).toBeHidden();
    await expect.poll(() => page.locator('.boot-brand-poster').evaluate(image => image.complete && image.naturalWidth === 1280)).toBe(true);
    await expect(page.getByRole('img', { name: 'Beyond Planner', exact: true })).toBeVisible();
    preview.release();
    await expect(page.locator('#bootScreen')).toHaveCount(0);
    await expect(page.locator('#taskBoard .task-text-input').first()).toHaveValue('QA 업무 01');
  } finally {
    preview.release();
  }
});

test('reduced motion displays the poster without requesting the video', async ({ context, page }) => {
  const preview = await openBrandPreview(context, page, { reducedMotion: true });
  try {
    await expect(page.locator('#bootBrandVideo')).toBeHidden();
    await expect.poll(() => page.locator('.boot-brand-poster').evaluate(image => image.complete && image.naturalWidth === 1280)).toBe(true);
    expect(await page.locator('#bootBrandVideo').evaluate(video => video.paused)).toBe(true);
    expect(preview.videoRequests()).toBe(0);
    preview.release();
    await expect(page.locator('#bootScreen')).toHaveCount(0);
    await expect(page.locator('#taskBoard .task-text-input').first()).toHaveValue('QA 업무 01');
  } finally {
    preview.release();
  }
});

test('reduced motion keeps precise clock hands still while a real save completes', async ({context,page,request}) => {
  const preview=await openBrandPreview(context,page,{reducedMotion:true});
  preview.release();
  await expect(page.locator('#bootScreen')).toHaveCount(0);
  await request.post('/qa/delay',{data:{seconds:2}});
  await page.locator('#taskBoard .task-text-input').first().fill('QA 정적인 저장 표시');
  await page.locator('#dailyCompletion').click();
  await expect(page.locator('#headerSaveClock')).toHaveAttribute('data-save-state','saving');
  await expect(page.locator('#headerSaveClock .save-clock-minute')).toHaveCSS('animation-name','none');
  await expect(page.locator('#headerSaveClock .save-clock-hour')).toHaveCSS('animation-name','none');
  await expect(page.locator('#headerSaveClock')).toHaveAttribute('data-save-state','saved');
  await expect(page.locator('#headerSaveClock .save-clock-check')).toHaveCSS('opacity','1');
});
