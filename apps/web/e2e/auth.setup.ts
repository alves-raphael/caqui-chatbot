import { expect, test as setup } from '@playwright/test';

setup('log in as the seed user', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(process.env['SEED_USER_EMAIL'] ?? '');
  await page.getByLabel('Senha').fill(process.env['SEED_USER_PASSWORD'] ?? '');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'caqui-chatbot' })).toBeVisible();
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
