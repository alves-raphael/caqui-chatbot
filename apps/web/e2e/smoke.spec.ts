import { expect, test } from '@playwright/test';

test('authenticated user sees their email on the home page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(process.env['SEED_USER_EMAIL'] ?? '')).toBeVisible();
});

test.describe('login form', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('rejects wrong credentials and accepts the right ones', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(process.env['SEED_USER_EMAIL'] ?? '');
    await page.getByLabel('Senha').fill('wrong-password');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('alert')).toBeVisible();

    await page.getByLabel('Senha').fill(process.env['SEED_USER_PASSWORD'] ?? '');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('heading', { name: 'caqui-chatbot' })).toBeVisible();
  });
});
