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

async function verifyWidePageAlignment(page) {
  await page.setViewportSize({width: 3440, height: 1000});
  const aligned = async () => {
    const [main, ...headerAndFooter] = await page.evaluate(() =>
      ['#main', '.site-top-inner', '.site-header', '.site-footer'].map(selector => {
        const {left, width} = document.querySelector(selector).getBoundingClientRect();
        return {left, width};
      }));
    assert.equal(main.width, 3280, page.url());
    assert.deepEqual(headerAndFooter, [main, main, main], page.url());
  };
  await page.goto(new URL('/', base).href);
  await aligned();
  const nav = page.getByRole('navigation', {name: '主导航'});
  for (const [label, path] of [['资料探索', '/references/'], ['积分兑换', '/rewards/shop/'], ['学习广场', '/']]) {
    await nav.getByRole('link', {name: label}).click();
    await page.waitForURL(new URL(path, base).href, {waitUntil: 'load'});
    await aligned();
  }
  for (const path of ['/geography/study/', '/geography/atlas/china.html', '/phrases/']) {
    await page.goto(new URL(path, base).href);
    await aligned();
  }
}

(async () => {
  const browser = await playwright[engine].launch();
  try {
    const context = await browser.newContext({viewport: {width: 1440, height: 900}});
    const page = await context.newPage();
    await verifySidebar(page);
    await verifySharedPreference(context);
    await verifyWidePageAlignment(page);
    console.log(`${engine}：侧栏焦点、书签、折叠与位置偏好和宽屏页边距检查通过。`);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
