import { expect, test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await page.route('**/demo/session', async (route) => {
    const body = route.request().postDataJSON() as { role: string; clientId: string };
    await route.fulfill({
      json: { ...body, token: `${body.role}:${body.clientId}`, expiresAt: Date.now() + 60000 },
    });
  });
});

test('chat local mostra resposta do modelo e o rascunho Terra ainda exige revisão', async ({ page }) => {
  await page.route('**/demo/chat', async (route) => {
    expect(route.request().headers()['x-demo-session']).toBe('client:C-0001');
    expect(route.request().postDataJSON()).toEqual({ message: 'Onde está meu dinheiro?', model: 'luna' });
    await route.fulfill({
      json: {
        text: 'Marta, vamos conferir: saldo em conta de R$ 1.250,00, separado dos investimentos.',
        sources: ['record:clientes.json · C-0001'],
        mode: 'model',
        model: 'openai/gpt-6-luna',
        notice: 'IA conectada ao OpenRouter.',
        costUsd: 0,
      },
    });
  });
  await page.route('**/demo/copilot', async (route) => {
    expect(route.request().headers()['x-demo-session']).toBe('agent:C-0001');
    expect(route.request().postDataJSON()).toMatchObject({ model: 'terra' });
    await route.fulfill({
      json: {
        text: 'Marta, rascunho conectado para sua conferência.',
        sources: ['KB-008'],
        mode: 'model',
        model: 'openai/gpt-6.1-terra',
        notice: 'IA conectada ao OpenRouter.',
        costUsd: 0,
      },
    });
  });
  await page.goto('/demo');
  const frame = page.frameLocator('iframe');
  await frame.getByRole('combobox', { name: 'Persona de teste' }).selectOption('C-0001');
  await frame.getByRole('button', { name: 'Entrar como cliente →', exact: true }).click();
  await expect(frame.getByRole('heading', { name: 'PatricIA', exact: true })).toBeVisible();
  await frame.getByRole('textbox', { name: 'Sua mensagem', exact: true }).fill('Onde está meu dinheiro?');
  await frame.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await expect(frame.locator('#client-chat')).toContainText('Marta, vamos conferir');
  await expect(frame.locator('#client-chat')).toContainText('IA conectada · openai/gpt-6-luna');
  await frame.getByRole('button', { name: '♧ Falar com uma pessoa', exact: true }).click();
  await frame.getByRole('button', { name: '⇥ Sair / trocar perfil', exact: true }).click();
  await frame.getByRole('button', { name: 'Entrar como atendente →', exact: true }).click();
  await frame.getByRole('button', { name: 'Assumir atendimento · simulação', exact: true }).click();
  await page.getByRole('combobox', { name: 'Modelo da IA local' }).selectOption('terra');
  await frame.getByRole('button', { name: 'Gerar rascunho com IA local', exact: true }).click();
  await expect(frame.getByRole('textbox', { name: 'Rascunho para o cliente', exact: true })).toHaveValue(
    'Marta, rascunho conectado para sua conferência.',
  );
  const send = frame.getByRole('button', { name: 'Revisar e enviar · simulação', exact: true });
  await expect(send).toBeDisabled();
  await frame.getByRole('checkbox', { name: /Revisei o texto/ }).check();
  await expect(send).toBeEnabled();
});

test('falha do provedor preserva resposta local e o modo offline não faz chamadas', async ({ page }) => {
  let calls = 0;
  await page.route('**/demo/chat', async (route) => {
    calls++;
    await route.abort();
  });
  await page.goto('/demo');
  const frame = page.frameLocator('iframe');
  await frame.getByRole('button', { name: 'Entrar como cliente →', exact: true }).click();
  await frame.getByRole('textbox', { name: 'Sua mensagem', exact: true }).fill('Onde está meu dinheiro?');
  await frame.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Resposta local preservada');
  await expect(frame.locator('#client-chat')).toContainText('Nos investimentos');
  await page.getByRole('checkbox', { name: 'IA local', exact: true }).uncheck();
  await frame.getByRole('textbox', { name: 'Sua mensagem', exact: true }).fill('O que é um CDB?');
  await frame.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Modo offline');
  expect(calls).toBe(1);
});

test('resposta atrasada não aparece depois de trocar de persona', async ({ page }) => {
  let release: (() => void) | undefined;
  let finished = false;
  await page.route('**/demo/chat', async (route) => {
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    try {
      await route.fulfill({
        json: {
          text: 'RESPOSTA_TARDIA_MARTA',
          sources: [],
          mode: 'model',
          model: 'openai/gpt-6-luna',
          notice: 'IA conectada',
          costUsd: 0,
        },
      });
    } catch {
      /* The request is expected to be aborted by logout. */
    } finally {
      finished = true;
    }
  });
  await page.goto('/demo');
  const frame = page.frameLocator('iframe');
  await frame.getByRole('combobox', { name: 'Persona de teste' }).selectOption('C-0001');
  await frame.getByRole('button', { name: 'Entrar como cliente →', exact: true }).click();
  await frame.getByRole('textbox', { name: 'Sua mensagem', exact: true }).fill('Onde está meu dinheiro?');
  await frame.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await expect.poll(() => typeof release).toBe('function');
  await frame.getByRole('button', { name: '⇥ Sair / trocar perfil', exact: true }).click();
  await frame.getByRole('combobox', { name: 'Persona de teste' }).selectOption('C-0002');
  await frame.getByRole('button', { name: 'Entrar como cliente →', exact: true }).click();
  release?.();
  await expect.poll(() => finished).toBe(true);
  await expect(frame.locator('#client-chat')).not.toContainText('RESPOSTA_TARDIA_MARTA');
  await expect(frame.locator('#client-chat')).toContainText('Rafael');
});
