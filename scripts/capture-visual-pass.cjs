const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

async function run() {
  const outputDir = path.join(__dirname, '../public/acceptance');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

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

  console.log('Browser launched');

  // --- DESKTOP PASS (1440x900) ---
  const desktopPage = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  desktopPage.on('console', msg => console.log('DESKTOP LOG:', msg.text()));

  await desktopPage.goto('http://localhost:3000/story', { waitUntil: 'networkidle' });
  console.log('Desktop page loaded');

  // Trigger spatial engine initialization by scrolling into timeline
  await desktopPage.evaluate(() => {
    window.scrollTo(0, 1200);
    window.dispatchEvent(new Event('scroll'));
  });

  console.log('Waiting for Cesium canvas...');
  await desktopPage.waitForSelector('#cesium-container canvas', { timeout: 20000 });
  console.log('Cesium canvas ready');
  await desktopPage.waitForTimeout(3000);

  const desktopBeats = [
    { index: 1, name: 'desktop-beat-01-bathurst-island.png', label: 'Beat 01 — Bathurst Island / approach' },
    { index: 2, name: 'desktop-beat-02-darwin-harbour.png', label: 'Beat 02 — 09:58 Darwin Harbour' },
    { index: 3, name: 'desktop-beat-03-post-office.png', label: 'Beat 03 — Post Office' },
    { index: 4, name: 'desktop-beat-04-uss-peary.png', label: 'Beat 04 — USS Peary' },
    { index: 7, name: 'desktop-beat-07-reckoning-stokes-hill.png', label: 'Final Stokes Hill Wharf / Reckoning state' }
  ];

  for (const beat of desktopBeats) {
    console.log(`Navigating to ${beat.label} (index ${beat.index})...`);
    await desktopPage.evaluate((idx) => {
      const el = document.querySelector(`[data-beat-index="${idx}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'center' });
        window.dispatchEvent(new Event('scroll'));
      }
    }, beat.index);

    // Give Cesium camera flight and tile rendering ample time to complete
    await desktopPage.waitForTimeout(4500);

    const outPath = path.join(outputDir, beat.name);
    await desktopPage.screenshot({ path: outPath });
    console.log(`Saved ${outPath}`);
  }

  await desktopPage.close();

  // --- MOBILE PASS (390x844) ---
  const mobilePage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });

  mobilePage.on('console', msg => console.log('MOBILE LOG:', msg.text()));

  await mobilePage.goto('http://localhost:3000/story', { waitUntil: 'networkidle' });
  console.log('Mobile page loaded');

  // Trigger spatial engine initialization by scrolling
  await mobilePage.evaluate(() => {
    window.scrollTo(0, 1000);
    window.dispatchEvent(new Event('scroll'));
  });

  await mobilePage.waitForSelector('#cesium-container canvas', { timeout: 20000 });
  console.log('Mobile Cesium canvas ready');
  await mobilePage.waitForTimeout(3000);

  const mobileBeats = [
    { index: 2, name: 'mobile-beat-02-darwin-harbour.png', label: 'Beat 02 — 09:58 Darwin Harbour (390px mobile)' },
    { index: 4, name: 'mobile-beat-04-uss-peary.png', label: 'Beat 04 — USS Peary (390px mobile)' }
  ];

  for (const beat of mobileBeats) {
    console.log(`Navigating mobile to ${beat.label} (index ${beat.index})...`);
    await mobilePage.evaluate((idx) => {
      const el = document.querySelector(`[data-beat-index="${idx}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'center' });
        window.dispatchEvent(new Event('scroll'));
      }
    }, beat.index);

    await mobilePage.waitForTimeout(4500);

    const outPath = path.join(outputDir, beat.name);
    await mobilePage.screenshot({ path: outPath });
    console.log(`Saved ${outPath}`);
  }

  await mobilePage.close();
  await browser.close();
  console.log('All acceptance captures complete.');
}

run().catch(err => {
  console.error('Capture pass failed:', err);
  process.exit(1);
});
