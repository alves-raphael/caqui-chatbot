import fs from 'node:fs';
import { expect, test } from '@playwright/test';

const PAGES = [
  { name: 'login', path: '/login', heading: 'Entrar', auth: false },
  { name: 'home', path: '/', heading: 'caqui-chatbot', auth: true },
];
const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 800 },
];

fs.mkdirSync('screenshots', { recursive: true });

for (const { name, path, heading, auth } of PAGES) {
  test.describe(`layout ${name}`, () => {
    if (!auth) test.use({ storageState: { cookies: [], origins: [] } });

    for (const viewport of VIEWPORTS) {
      test(`${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(path);
        await expect(page.getByRole('heading', { name: heading })).toBeVisible();
        await page.screenshot({ path: `screenshots/${name}-${viewport.name}.png`, fullPage: true });

        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(
          scrollWidth,
          `horizontal overflow on ${path} at ${viewport.name}: scrollWidth ${scrollWidth} > clientWidth ${clientWidth}`,
        ).toBeLessThanOrEqual(clientWidth);
      });
    }
  });
}
