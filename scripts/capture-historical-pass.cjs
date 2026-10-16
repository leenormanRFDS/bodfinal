const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

async function capture() {
  const outputDir = path.join(__dirname, '../public/acceptance');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const possiblePaths = [
    '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
    path.join(__dirname, '../.cache/ms-playwright/chromium-1243/chrome-linux64/chrome')
  ];
  const chromePath = possiblePaths.find(p => fs.existsSync(p)) || 'chromium';
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

  // Trigger spatial engine initialization by scrolling into timeline
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

  // Initial wait for raster overlay and map tiles to stabilize
  await page.waitForTimeout(3000);

  const targets = [
    {
      idx: 2,
      targetStateId: 'BEAT_2_HARBOUR_STRIKE',
      name: '1942-0958-darwin-harbour.png',
      label: '09:58 Darwin Harbour (1942 Historical Layer)'
    },
    {
      idx: 3,
      targetStateId: 'BEAT_3_POST_OFFICE',
      name: '1942-post-office.png',
      label: 'Post Office (1942 Historical Layer)'
    },
    {
      idx: 4,
      targetStateId: 'BEAT_4_PEARY_ATTACK',
      name: '1942-uss-peary.png',
      label: 'USS Peary (1942 Historical Layer)'
    }
  ];

  for (const item of targets) {
    console.log(`\nNavigating to ${item.label} (expecting ${item.targetStateId})...`);
    await page.evaluate((targetIdx) => {
      const el = document.querySelector(`[data-beat-index="${targetIdx}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        window.scrollBy(0, rect.top + 100);
        window.dispatchEvent(new Event('scroll'));
      }
    }, item.idx);

    await page.waitForFunction((expected) => {
      const sv = window.__DARWIN_SPATIAL_VIEWER__;
      return sv && sv.getStatus() && sv.getStatus().activeStateId === expected;
    }, item.targetStateId, { timeout: 8000 }).catch(() => {});

    // Settle camera flight and tile/raster rendering
    await page.waitForTimeout(4500);

    const info = await page.evaluate(() => {
      const sv = window.__DARWIN_SPATIAL_VIEWER__;
      return {
        activeStateId: sv?.getStatus()?.activeStateId,
        dockScope: document.querySelector('[data-spatial-dock-scope]')?.textContent,
        time: document.querySelector('[data-clock-t]')?.textContent,
        imageryLayersCount: sv?.viewer?.scene?.imageryLayers?.length
      };
    });
    console.log(`Captured ${item.label} [State: ${info.activeStateId}, Time: ${info.time}, ImageryLayers: ${info.imageryLayersCount}]`);

    const dest = path.join(outputDir, item.name);
    await page.screenshot({ path: dest });
    console.log(`Saved screenshot to ${dest}`);
  }

  await page.close();
  await browser.close();
  console.log('\nAll 1942 visual layer screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
