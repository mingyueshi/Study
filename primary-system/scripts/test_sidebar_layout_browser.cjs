const assert = require('node:assert/strict');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const base = process.argv[2] || 'http://127.0.0.1:8012';
const engine = process.argv[3] || 'chromium';
const timeline = new URL('/history/timeline/timeline.html', base).href;
const workspace = '.timeline-topic';
const header = workspace + ' > .sl-sidebar > .sl-header';
const toggle = header + ' > .sl-toggle:not(.sl-collapse)';
const collapse = header + ' > .sl-collapse';

async function verifySidebar(page) {
  await page.goto(timeline);
  await page.locator(collapse).click();
  await page.locator(collapse).focus();
  await page.setViewportSize({width: 390, height: 820});
  await page.locator(toggle + '[aria-expanded="false"]').waitFor();
  assert.equal(await page.locator(toggle).evaluate(el => el === document.activeElement), true);
  assert.ok((await page.locator(toggle).boundingBox()).height >= 44);

  await page.setViewportSize({width: 1440, height: 900});
  await page.locator(collapse + '[aria-expanded="false"]').waitFor();
  assert.equal(await page.locator(collapse).evaluate(el => el === document.activeElement), true);

  await page.setViewportSize({width: 320, height: 820});
  await page.locator(toggle + '[aria-expanded="false"]').waitFor();
  await page.locator(workspace + ' a[href="#timeline-tools"]').click();
  await page.locator(toggle + '[aria-expanded="true"]').waitFor();
  assert.equal(new URL(page.url()).hash, '#timeline-tools');
  assert.equal(await page.locator('#timeline-tools').isVisible(), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);

  await page.setViewportSize({width: 1440, height: 900});
  await page.locator(collapse + '[aria-expanded="false"]').waitFor();
  assert.equal(await page.locator('#timeline-tools').isVisible(), false);

  await page.goto(timeline + '?bookmark=%2B%2F#timeline-tools');
  await page.locator(collapse + '[aria-expanded="true"]').waitFor();
  assert.equal(new URL(page.url()).searchParams.get('bookmark'), '+/');
  assert.equal(await page.locator('#timeline-tools').isVisible(), true);
  await page.setViewportSize({width: 390, height: 820});
  await page.locator(toggle + '[aria-expanded="false"]').waitFor();
  assert.equal(await page.locator('#timeline-tools').isVisible(), false);
}

async function verifySharedPreference(context) {
  const atlas = await context.newPage();
  await atlas.goto(new URL('/geography/atlas/china.html?place=f20#map', base).href);
  const map = '.gm-flat-workspace';
  await atlas.locator(map + '[data-sl-side="right"]').waitFor();
  await atlas.locator(map + ' .sl-toggle:not(.sl-collapse)').click();
  await atlas.locator(map + '[data-sl-side="left"]').waitFor();

  const history = await context.newPage();
  await history.goto(timeline);
  await history.locator(workspace + '[data-sl-side="left"]').waitFor();
  await history.locator(collapse + '[aria-expanded="false"]').waitFor();
  await history.locator(collapse).click();
  await history.locator(toggle).click();
  await atlas.locator(map + '[data-sl-side="right"]').waitFor();
}

(async () => {
  const browser = await playwright[engine].launch();
  try {
    const context = await browser.newContext({viewport: {width: 1440, height: 900}});
    const page = await context.newPage();
    await verifySidebar(page);
    await verifySharedPreference(context);
    console.log(`${engine}：侧栏焦点、触控尺寸、旧书签、宽窄屏折叠和跨专题位置偏好检查通过。`);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
