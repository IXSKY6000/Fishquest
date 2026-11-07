// The Cloud browser does not trust its interception CA. Route tests through the
// OS-trusted HTTPS client, preserving upstream responses and TLS verification.
// This is a test transport only: the APK calls the public APIs directly.
import { chromium, request } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const upstream = await request.newContext({
  proxy: proxy ? { server: proxy, bypass: 'localhost,127.0.0.1' } : undefined,
  timeout: 30000,
});
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const result = {
  at: new Date().toISOString(),
  transport: 'Real upstream responses through OS-trusted HTTPS client; no mocked data, TLS enabled',
  errors: [],
  responses: [],
};
page.on('pageerror', (error) => result.errors.push(error.message));
await page.route(
  /^https:\/\/(hubeau\.eaufrance\.fr|api\.open-meteo\.com|tile\.openstreetmap\.org|nominatim\.openstreetmap\.org|commons\.wikimedia\.org|upload\.wikimedia\.org)\//,
  async (route) => {
    try {
      const response = await upstream.get(route.request().url(), {
        headers: await route.request().allHeaders(),
      });
      if (!route.request().url().includes('tile.openstreetmap.org'))
        result.responses.push({
          host: new URL(response.url()).hostname,
          status: response.status(),
          cors: response.headers()['access-control-allow-origin'],
        });
      await route.fulfill({ response });
    } catch {
      await route.abort();
    }
  },
);
await mkdir('artifacts', { recursive: true });
try {
  await page.goto(process.env.FISHQUEST_TEST_URL || 'http://127.0.0.1:5173');
  await page.getByRole('button', { name: 'Charger ce secteur' }).click();
  await page.getByText('Inventaires historiques · Hub’Eau').waitFor({ timeout: 35000 });
  result.inventory = await page.locator('.data-control').innerText();
  result.markers = await page.locator('.fish-marker-wrapper').count();
  if (!result.markers) throw new Error('No real inventory marker in the Léman test sector.');
  await page.waitForFunction(() => document.querySelectorAll('.leaflet-tile-loaded').length > 0);
  result.tiles = await page.locator('.leaflet-tile-loaded').count();
  await page.screenshot({ path: 'artifacts/carte-donnees-reelles.png' });
  await page.getByRole('button', { name: 'Prévisions', exact: true }).click();
  await page.getByRole('heading', { name: 'Conditions actuelles' }).waitFor({ timeout: 35000 });
  result.weather = await page.locator('.weather-current').innerText();
  await page.screenshot({ path: 'artifacts/previsions-reelles.png' });
  if (result.errors.length) throw new Error(result.errors.join('\n'));
  console.log(JSON.stringify(result, null, 2));
} finally {
  await writeFile('artifacts/verification-api-reelles.json', JSON.stringify(result, null, 2));
  await browser.close();
  await upstream.dispose();
}
