import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const url = process.env.LIVE_URL || 'https://hapo3005.github.io/maloba/';
const consoleErrors = [];
const pageErrors = [];
await mkdir('qa-artifacts', { recursive: true });

async function triggerLazyImages(page) {
  await page.evaluate(async () => {
    const step = Math.max(500, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(resolve => setTimeout(resolve, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1800);
}

async function inspect(viewport, name) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport });
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(`[${name}] ${message.text()}`); });
    page.on('pageerror', error => pageErrors.push(`[${name}] ${error.message}`));

    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    if (!response?.ok()) throw new Error(`${name}: HTTP ${response?.status() ?? 'keine Antwort'}`);

    await page.waitForFunction(() => {
      const hero = document.querySelector('#hero-master');
      return hero instanceof HTMLImageElement && hero.complete && hero.naturalWidth >= 1400 && hero.naturalHeight >= 700;
    }, null, { timeout: 60_000 });
    await page.waitForTimeout(2000);

    if (!(await page.title()).includes('Maloba')) throw new Error(`${name}: falscher Seitentitel`);
    if (!(await page.locator('body').innerText()).includes('Immobilien verdienen mehr als ein Inserat.')) throw new Error(`${name}: freigegebene Headline fehlt`);

    const storyCount = await page.locator('#story-grid .story').count();
    const searchCount = await page.locator('#search-grid .search-card').count();
    const dialogCount = await page.locator('dialog').count();
    if (storyCount !== 16) throw new Error(`${name}: ${storyCount} statt 16 Erfolgsgeschichten`);
    if (searchCount !== 11) throw new Error(`${name}: ${searchCount} statt 11 Suchaufträge`);
    if (dialogCount !== 3) throw new Error(`${name}: ${dialogCount} statt 3 Dialoge`);

    if (viewport.width >= 901) {
      const hero = page.locator('#hero-master');
      if (!(await hero.isVisible())) throw new Error(`${name}: Desktop-Hero nicht sichtbar`);
      const dimensions = await hero.evaluate(image => ({ width: image.naturalWidth, height: image.naturalHeight }));
      if (dimensions.width < 1400 || dimensions.height < 700) throw new Error(`${name}: Hero nur ${dimensions.width}×${dimensions.height}`);
      await page.locator('.hotspot.valuation').click();
    } else {
      if (!(await page.locator('.mobile-hero').isVisible())) throw new Error(`${name}: Mobil-Hero nicht sichtbar`);
      await page.locator('.menu-button').click();
      if (!(await page.locator('.main-nav').isVisible())) throw new Error(`${name}: Mobilmenü öffnet nicht`);
      await page.locator('.menu-button').click();
      await page.locator('.mobile-hero [data-dialog="valuation"]').click();
    }

    if (!(await page.locator('#valuation').evaluate(dialog => dialog.open))) throw new Error(`${name}: Wertermittlungsdialog öffnet nicht`);
    await page.locator('#valuation .dialog-close').click();
    if (await page.locator('#valuation').evaluate(dialog => dialog.open)) throw new Error(`${name}: Wertermittlungsdialog schließt nicht`);

    await triggerLazyImages(page);

    const brokenImages = await page.locator('img').evaluateAll(images => images
      .filter(image => image.complete && image.naturalWidth === 0)
      .map(image => image.currentSrc || image.src));
    if (brokenImages.length) throw new Error(`${name}: defekte Bilder: ${brokenImages.join(', ')}`);

    await page.screenshot({ path: `qa-artifacts/${name}.png`, fullPage: true });
  } finally {
    await browser.close();
  }
}

try {
  await inspect({ width: 1440, height: 1000 }, 'desktop-1440x1000');
  await inspect({ width: 390, height: 844 }, 'mobile-390x844');
  if (pageErrors.length) throw new Error(`JavaScript-Fehler:\n${pageErrors.join('\n')}`);
  if (consoleErrors.length) throw new Error(`Konsolenfehler:\n${consoleErrors.join('\n')}`);
  console.log(`Live-QA erfolgreich: ${url}`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
