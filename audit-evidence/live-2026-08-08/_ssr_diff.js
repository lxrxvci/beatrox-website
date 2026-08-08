const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const outDir = process.argv[2];
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://www.beatrox.com', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);
  const html = await page.content();
  fs.writeFileSync(outDir + '/homepage.rendered.html', html);
  const text = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync(outDir + '/homepage.rendered.txt', text);
  await browser.close();
  console.log('rendered bytes:', html.length, '| innerText words:', text.split(/\s+/).length);
})();
