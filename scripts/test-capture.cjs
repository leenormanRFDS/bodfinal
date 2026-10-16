const { chromium } = require('playwright-core');

async function test() {
  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader'
    ]
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:3000/story', { waitUntil: 'networkidle' });
  console.log('Page loaded');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'public/test-capture.png' });
  console.log('Screenshot saved to public/test-capture.png');
  await browser.close();
}

test().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
