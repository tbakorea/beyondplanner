const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/browser', timeout: 60000, workers: 1,
  reporter: [['list'], ['github'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:8765', timezoneId: 'Asia/Seoul',
    screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'iphone-compact', use: { browserName: 'webkit', viewport: {width:390,height:844}, isMobile:true, hasTouch:true } },
    { name: 'iphone-large', use: { browserName: 'webkit', viewport: {width:430,height:932}, isMobile:true, hasTouch:true } },
    { name: 'ipad', use: { browserName: 'webkit', viewport: {width:768,height:1024}, isMobile:true, hasTouch:true } },
    { name: 'desktop', use: { browserName: 'chromium', viewport: {width:1366,height:900} } },
  ],
  webServer: { command: 'python3 tests/browser/server.py', port:8765, reuseExistingServer:false },
});
