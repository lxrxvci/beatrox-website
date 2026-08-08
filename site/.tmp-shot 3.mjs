import { chromium } from 'playwright'
const exe = process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell'
const browser = await chromium.launch({ executablePath: exe })
async function shoot(page, url, path) {
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    const h = document.body.scrollHeight
    for (let y = 0; y <= h; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)) }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(800)
  await page.screenshot({ path, fullPage: true })
}
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
await shoot(mobile, 'http://localhost:3123/about', '/tmp/about-mobile.png')
await shoot(mobile, 'http://localhost:3123/services', '/tmp/services-mobile.png')
const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await shoot(desktop, 'http://localhost:3123/about', '/tmp/about-desktop.png')
await shoot(desktop, 'http://localhost:3123/services', '/tmp/services-desktop.png')
await browser.close()
