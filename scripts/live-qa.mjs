import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const url = process.env.LIVE_URL || 'https://hapo3005.github.io/maloba/';
const requiredText = 'Immobilien verdienen mehr als ein Inserat.';
const consoleErrors = [];
const pageErrors = [];

await mkdir('qa-artifacts', { recursive: true });

async function inspect(viewport, name) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewportSize: viewport });

  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(`[${name}] ${message.text()}`);
  });
  page.on('pageerror', error => pageErrors.push(`[${name}] ${error.message}`));

  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 90_000 });
  if (!response || !response.ok()) {
    throw new Error(`${name}: Live-Seite antwortet nicht erfolgreich (${response?.status() ?? 'keine Antwort'}).`);
  }

  await page.waitForFunction(
    text => document.body?.innerText.includes(text),
    requiredText,
    { timeout: 60_000 },
  );

  const title = await page.title();
  if (!title.includes('Maloba')) throw new Error(`${name}: Seitentitel enthält „Maloba“ nicht.`);

  const hero = page.locator('.hero-img, .mobile-hero').first();
  if (!(await hero.isVisible())) throw new Error(`${name}: Hero ist nicht sichtbar.`);

  const brokenImages = await page.locator('img').evaluateAll(images =>
    images.filter(image => image.complete && image.naturalWidth === 0).map(image => image.currentSrc || image.src),
  );
  if (brokenImages.length) throw new Error(`${name}: Defekte Bilder: ${brokenImages.join(', ')}`);

  await page.screenshot({ path: `qa-artifacts/${name}.png`, fullPage: true });
  await browser.close();
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
