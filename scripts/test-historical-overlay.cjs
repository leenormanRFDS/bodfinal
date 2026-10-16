const { chromium } = require('playwright-core');
const path = require('path');

async function test() {
  const chromePath = path.join(__dirname, '../.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');
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

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:3000/story', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    window.scrollTo(0, 1800);
    window.dispatchEvent(new Event('scroll'));
  });

  await page.waitForFunction(() => {
    const sv = window.__DARWIN_SPATIAL_VIEWER__;
    return sv && sv.getStatus() && sv.getStatus().isReady === true;
  }, { timeout: 35000 });

  console.log('Cesium is READY!');

  // Test adding SingleTileImageryProvider directly in page
  const result = await page.evaluate(async () => {
    try {
      const sv = window.__DARWIN_SPATIAL_VIEWER__;
      const Cesium = sv.Cesium;
      const viewer = sv.viewer;
      const rect = Cesium.Rectangle.fromDegrees(130.805, -12.482, 130.885, -12.405);

      let provider;
      if (typeof Cesium.SingleTileImageryProvider.fromUrl === 'function') {
        provider = await Cesium.SingleTileImageryProvider.fromUrl(
          '/images/spatial/darwin-1942-overlay.png',
          { rectangle: rect }
        );
      } else {
        provider = new Cesium.SingleTileImageryProvider({
          url: '/images/spatial/darwin-1942-overlay.png',
          rectangle: rect,
        });
      }

      const layer = viewer.scene.imageryLayers.addImageryProvider(provider);
      layer.alpha = 0.78;
      viewer.scene.requestRender();

      return {
        success: true,
        layerCount: viewer.scene.imageryLayers.length,
        layerAlpha: layer.alpha
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  console.log('Test result:', result);
  await browser.close();
}

test().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
