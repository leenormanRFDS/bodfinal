const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

async function capturePeary() {
  const outputDir = path.join(__dirname, '../public/acceptance');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const chromePath = fs.existsSync('/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome')
    ? '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'
    : path.join(__dirname, '../.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');
  const browser = await chromium.launch({
    executablePath: chromePath,
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

  console.log('Chromium launched successfully');

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to http://localhost:3000/story...');
  await page.goto('http://localhost:3000/story', { waitUntil: 'networkidle' });

  // Scroll into timeline to trigger spatial engine
  await page.evaluate(() => {
    window.scrollTo(0, 1800);
    window.dispatchEvent(new Event('scroll'));
  });

  console.log('Waiting for Cesium viewer to be ready...');
  await page.waitForFunction(() => {
    const sv = window.__DARWIN_SPATIAL_VIEWER__;
    return sv && sv.getStatus() && sv.getStatus().isReady === true;
  }, { timeout: 35000 });
  console.log('Cesium viewer is ready!');

  // Navigate directly to USS Peary (Beat 4)
  console.log('Navigating to USS Peary (index 4)...');
  await page.evaluate(() => {
    const el = document.querySelector('[data-beat-index="4"]');
    if (el) {
      const rect = el.getBoundingClientRect();
      window.scrollBy(0, rect.top + 100);
      window.dispatchEvent(new Event('scroll'));
    }
  });

  await page.waitForFunction(() => {
    const sv = window.__DARWIN_SPATIAL_VIEWER__;
    return sv && sv.getStatus() && sv.getStatus().activeStateId === 'BEAT_4_PEARY_ATTACK';
  }, { timeout: 10000 }).catch(() => {});

  // Wait 4.5s for camera settlement and render stability
  await page.waitForTimeout(4500);

  const status = await page.evaluate(() => {
    const sv = window.__DARWIN_SPATIAL_VIEWER__;
    return {
      activeStateId: sv?.getStatus()?.activeStateId,
      time: document.querySelector('[data-clock-t]')?.textContent,
      dockScope: document.querySelector('[data-spatial-dock-scope]')?.textContent,
      imageryLayersCount: sv?.viewer?.scene?.imageryLayers?.length
    };
  });
  console.log('Capture status:', status);

  const dest = path.join(outputDir, 'peary-archival-texture.png');
  await page.screenshot({ path: dest });
  console.log(`Saved screenshot to: ${dest}`);

  await page.close();
  await browser.close();
  console.log('Done!');
}

capturePeary().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
