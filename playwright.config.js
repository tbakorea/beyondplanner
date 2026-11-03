const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/browser', timeout: 60000, workers: 1,
  reporter: [['list'], ['github'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:8765', timezoneId: 'Asia/Seoul',
    screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'iphone-compact', use: { browserName: 'webkit', viewport: {width:390,height:844}, isMobile:true, hasTouch:true, userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' } },
    { name: 'iphone-large', use: { browserName: 'webkit', viewport: {width:430,height:932}, isMobile:true, hasTouch:true, userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' } },
    { name: 'ipad', use: { browserName: 'webkit', viewport: {width:768,height:1024}, isMobile:true, hasTouch:true } },
    { name: 'ipad-landscape', testMatch: /ipad-scroll.spec.js/, use: { browserName: 'webkit', viewport: {width:1280,height:960}, isMobile:true, hasTouch:true } },
    { name: 'ipad-landscape-ceo', testMatch: /ipad-scroll.spec.js/, metadata: { plannerMode: 'ceo' }, use: { browserName: 'webkit', viewport: {width:1280,height:960}, isMobile:true, hasTouch:true } },
    { name: 'ipad-portrait-ceo', testMatch: /ipad-scroll.spec.js/, metadata: { plannerMode: 'ceo' }, use: { browserName: 'webkit', viewport: {width:768,height:1024}, isMobile:true, hasTouch:true } },
    { name: 'desktop', use: { browserName: 'chromium', viewport: {width:1366,height:900} } },
    { name: 'desktop-compact-ceo', metadata: { plannerMode: 'ceo' }, use: { browserName: 'chromium', viewport: {width:900,height:1000} } },
  ],
  webServer: { command: 'python3 tests/browser/server.py', port:8765, reuseExistingServer:false },
});
