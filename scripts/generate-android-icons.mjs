import { chromium } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
const svg = await readFile('public/icon.svg', 'utf8');
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
try {
  const page = await browser.newPage();
  for (const [density, size] of Object.entries({
    mdpi: 48,
    hdpi: 72,
    xhdpi: 96,
    xxhdpi: 144,
    xxxhdpi: 192,
  })) {
    const dir = `android/app/src/main/res/mipmap-${density}`;
    await mkdir(dir, { recursive: true });
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<style>*{margin:0}svg{width:100vw;height:100vh;display:block}</style>${svg}`,
    );
    for (const name of ['ic_launcher', 'ic_launcher_round'])
      await page.screenshot({ path: `${dir}/${name}.png`, omitBackground: true });
  }
} finally {
  await browser.close();
}
