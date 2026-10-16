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

  console.log('Chromium launched successfully');

  // --- 1. DESKTOP CAPTURES (1440x900) ---
  console.log('\n--- Starting Desktop Pass (1440x900) ---');
  const desktopPage = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  await desktopPage.goto('http://localhost:3000/story', { waitUntil: 'networkidle' });
  
  // Trigger Cesium initialization by scrolling into timeline
  await desktopPage.evaluate(() => {
    window.scrollTo(0, 1800);
    window.dispatchEvent(new Event('scroll'));
  });

  console.log('Waiting for Cesium viewer to be ready on Desktop...');
  await desktopPage.waitForFunction(() => {
    const sv = window.__DARWIN_SPATIAL_VIEWER__;
    return sv && sv.getStatus() && sv.getStatus().isReady === true;
  }, { timeout: 35000 });
  console.log('Cesium viewer is ready on Desktop!');

  await desktopPage.waitForTimeout(3000);

  const desktopBeats = [
    {
      idx: 1,
      targetStateId: 'BEAT_1_BATHURST_WARNING',
      name: '01-desktop-beat-01-bathurst.png',
      label: 'Beat 01 — Bathurst Island / approach'
    },
    {
      idx: 2,
      targetStateId: 'BEAT_2_HARBOUR_STRIKE',
      name: '02-desktop-beat-02-harbour.png',
      label: 'Beat 02 — 09:58 Darwin Harbour'
    },
    {
      idx: 3,
      targetStateId: 'BEAT_3_POST_OFFICE',
      name: '03-desktop-beat-03-post-office.png',
      label: 'Beat 03 — Post Office'
    },
    {
      idx: 4,
      targetStateId: 'BEAT_4_PEARY_ATTACK',
      name: '04-desktop-beat-04-uss-peary.png',
      label: 'Beat 04 — USS Peary'
    },
    {
      idx: 7,
      targetStateId: 'BEAT_7_RECKONING',
      name: '05-desktop-beat-07-reckoning.png',
      label: 'Final Stokes Hill Wharf / Reckoning state'
    }
  ];

  for (const item of desktopBeats) {
    console.log(`Setting state for ${item.label} (expecting ${item.targetStateId})...`);
    await desktopPage.evaluate((targetIdx) => {
      const el = document.querySelector(`[data-beat-index="${targetIdx}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        window.scrollBy(0, rect.top + 100);
        window.dispatchEvent(new Event('scroll'));
      }
    }, item.idx);

    await desktopPage.waitForFunction((expected) => {
      const sv = window.__DARWIN_SPATIAL_VIEWER__;
      return sv && sv.getStatus() && sv.getStatus().activeStateId === expected;
    }, item.targetStateId, { timeout: 6000 }).catch(() => {});

    // Settle camera flight and cartography render loop
    await desktopPage.waitForTimeout(4000);

    const info = await desktopPage.evaluate(() => {
      const sv = window.__DARWIN_SPATIAL_VIEWER__;
      return {
        activeStateId: sv?.getStatus()?.activeStateId,
        dockScope: document.querySelector('[data-spatial-dock-scope]')?.textContent,
        time: document.querySelector('[data-clock-t]')?.textContent
      };
    });
    console.log(`Captured ${item.label} [State: ${info.activeStateId}, Time: ${info.time}]`);

    const dest = path.join(outputDir, item.name);
    await desktopPage.screenshot({ path: dest });
    console.log(`Saved screenshot to ${dest}`);
  }

  await desktopPage.close();

  // --- 2. MOBILE CAPTURES (390x844) ---
  console.log('\n--- Starting Mobile Pass (390x844) ---');
  const mobilePage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });

  await mobilePage.goto('http://localhost:3000/story', { waitUntil: 'networkidle' });

  await mobilePage.evaluate(() => {
    window.scrollTo(0, 1500);
    window.dispatchEvent(new Event('scroll'));
  });

  console.log('Waiting for Cesium viewer to be ready on Mobile...');
  await mobilePage.waitForFunction(() => {
    const sv = window.__DARWIN_SPATIAL_VIEWER__;
    return sv && sv.getStatus() && sv.getStatus().isReady === true;
  }, { timeout: 35000 });
  console.log('Cesium viewer is ready on Mobile!');

  await mobilePage.waitForTimeout(3000);

  const mobileBeats = [
    {
      idx: 2,
      targetStateId: 'BEAT_2_HARBOUR_STRIKE',
      name: '06-mobile-beat-02-harbour.png',
      label: 'Beat 02 — 09:58 Darwin Harbour (390px mobile)'
    },
    {
      idx: 4,
      targetStateId: 'BEAT_4_PEARY_ATTACK',
      name: '07-mobile-beat-04-uss-peary.png',
      label: 'Beat 04 — USS Peary (390px mobile)'
    }
  ];

  for (const item of mobileBeats) {
    console.log(`Setting mobile state for ${item.label}...`);
    await mobilePage.evaluate((targetIdx) => {
      const el = document.querySelector(`[data-beat-index="${targetIdx}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        window.scrollBy(0, rect.top + 100);
        window.dispatchEvent(new Event('scroll'));
      }
    }, item.idx);

    await mobilePage.waitForFunction((expected) => {
      const sv = window.__DARWIN_SPATIAL_VIEWER__;
      return sv && sv.getStatus() && sv.getStatus().activeStateId === expected;
    }, item.targetStateId, { timeout: 6000 }).catch(() => {});

    await mobilePage.waitForTimeout(4000);

    const info = await mobilePage.evaluate(() => {
      const sv = window.__DARWIN_SPATIAL_VIEWER__;
      return {
        activeStateId: sv?.getStatus()?.activeStateId,
        dockScope: document.querySelector('[data-spatial-dock-scope]')?.textContent,
        time: document.querySelector('[data-clock-t]')?.textContent
      };
    });
    console.log(`Captured mobile ${item.label} [State: ${info.activeStateId}, Time: ${info.time}]`);

    const dest = path.join(outputDir, item.name);
    await mobilePage.screenshot({ path: dest });
    console.log(`Saved mobile screenshot to ${dest}`);
  }

  await mobilePage.close();
  await browser.close();
  console.log('\nAll production-equivalent screenshots captured successfully!');
}

run().catch(err => {
  console.error('Execution error in capture script:', err);
  process.exit(1);
});
