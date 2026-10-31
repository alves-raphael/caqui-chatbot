import { expect, test, type Page, type TestInfo } from '@playwright/test';

const prototypeUrl = new URL('../../../docs/prototipo/caqui-prototipo.html', import.meta.url).href;
const personas = [
  {
    id: 'C-0007',
    name: 'Celina Teixeira',
    operation: 'OP-10001',
    example: 'Consultar resgate',
    foreign: 'OP-10006',
  },
  { id: 'C-0001', name: 'Marta Siqueira', operation: 'OP-10006', example: 'CV-0027', foreign: 'OP-10001' },
  { id: 'C-0002', name: 'Rafael Okada', operation: 'OP-10008', example: 'CV-0284', foreign: 'OP-10009' },
  { id: 'C-0003', name: 'Camila Prates', operation: 'OP-10009', example: 'CV-0147', foreign: 'OP-10008' },
];

async function loginClient(page: Page, id = 'C-0007') {
  await page.getByRole('combobox', { name: 'Persona de teste' }).selectOption(id);
  await page.getByRole('button', { name: 'Entrar como cliente →', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Área do cliente', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Área do atendente', exact: true })).toBeHidden();
}

async function logout(page: Page) {
  await page.getByRole('button', { name: '⇥ Sair / trocar perfil', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Entrada da demonstração', exact: true })).toBeVisible();
  await expect(page.locator('#client-chat')).toBeEmpty();
  await expect(page.locator('#copilot-content')).toBeEmpty();
}

async function captureLayout(page: Page, testInfo: TestInfo, name: string) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });
}

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await page.goto(prototypeUrl);
});

test('entrada explica a simulação e separa as telas de cliente e atendente', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Cada pessoa, seu espaço.' })).toBeVisible();
  await expect(page.locator('#login-screen')).toContainText('não autenticação ou isolamento de produção');
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.locator('#client-view')).toBeHidden();
  await expect(page.locator('#agent-view')).toBeHidden();
  await loginClient(page);
  await logout(page);
  await page.getByRole('button', { name: 'Entrar como atendente →', exact: true }).click();
  await expect(page.locator('#agent-view')).toBeVisible();
  await expect(page.locator('#client-view')).toBeHidden();
  await expect(page.locator('#session-name')).toHaveText('Jonas · atendente');
  await expect(page.locator('#ticket-list')).toContainText('Nenhum protocolo ainda');
});

for (const persona of personas) {
  test(`persona ${persona.id} mostra somente suas operações e exemplos`, async ({ page }) => {
    await loginClient(page, persona.id);
    await expect(page.locator('#session-name')).toHaveText(persona.name);
    await expect(page.locator('#client-chat')).toContainText(persona.id);
    await expect(page.locator('.operations')).toContainText(persona.operation);
    await expect(page.locator('.operations')).not.toContainText(persona.foreign);
    await expect(page.locator('#persona-examples')).toContainText(persona.example);
    await expect(page.locator('#copilot-content')).toBeHidden();
  });
}

test('consulta local mostra fontes e previsão sem confirmar liquidação', async ({ page }) => {
  await loginClient(page);
  const orange = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--orange').trim(),
  );
  expect(orange).toBe('#d94e1b');
  await page.getByRole('button', { name: 'Acompanhar resgate', exact: true }).click();
  const chat = page.locator('#client-chat');
  await expect(chat).toContainText('previsão de pagamento 18/11/2026');
  await expect(chat).toContainText('Previsão não confirma liquidação');
  await expect(chat.getByRole('link', { name: /KB-006/ })).toHaveAttribute(
    'href',
    'https://github.com/avenue-community/caqui-invest/blob/main/dados/base_conhecimento/KB-006.md',
  );
});

test('revisão do caso de Camila preserva histórico e não envia resposta para Rafael', async ({ page }) => {
  await loginClient(page, 'C-0003');
  await page.getByRole('button', { name: /Primeiro investimento/ }).click();
  await expect(page.locator('#client-chat')).toContainText('especialista');
  await page.getByRole('button', { name: 'Falar com especialista', exact: true }).click();
  await logout(page);
  await loginClient(page, 'C-0002');
  await expect(page.locator('#client-chat')).not.toContainText('herança');
  await page.getByRole('button', { name: /Falar com uma pessoa/ }).click();
  await logout(page);
  await page.getByRole('button', { name: 'Entrar como atendente →', exact: true }).click();
  await page.getByRole('button', { name: /Camila Prates/ }).click();
  await expect(page.locator('#agent-chat')).toContainText('Recebi uma herança de 300 mil');
  await expect(page.locator('#ticket-heading')).toContainText('C-0003');

  const send = page.getByRole('button', { name: 'Revisar e enviar · simulação', exact: true });
  const review = page.getByRole('checkbox', { name: /Revisei o texto/ });
  const draft = page.getByRole('textbox', { name: 'Rascunho para o cliente', exact: true });
  await expect(send).toBeDisabled();
  await review.check();
  await expect(send).toBeEnabled();
  await draft.fill('Camila, resposta revisada de demonstração.');
  await expect(review).not.toBeChecked();
  await expect(send).toBeDisabled();
  await page.getByRole('button', { name: 'Simular nova mensagem do cliente', exact: true }).click();
  await expect(page.locator('#copilot-content')).toContainText('Desatualizado');
  await expect(review).toBeDisabled();
  await page.getByRole('button', { name: '↻ Atualizar', exact: true }).click();
  await expect(page.locator('#copilot-content')).toContainText('Contexto atualizado');
  await draft.fill('Camila, resposta revisada de demonstração.');
  await review.check();
  await send.click();
  await logout(page);
  await loginClient(page, 'C-0002');
  await expect(page.locator('#client-chat')).not.toContainText('Camila, resposta revisada');
  await expect(page.locator('#client-chat .human')).toHaveCount(0);
  await logout(page);
  await loginClient(page, 'C-0003');
  await expect(page.locator('#client-chat .human')).toContainText('Camila, resposta revisada');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Cada pessoa, seu espaço.' })).toBeVisible();
  await loginClient(page, 'C-0003');
  await expect(page.locator('#client-chat .human')).toContainText('Camila, resposta revisada');
});

test('pedido de investimento preserva valor e objetivo e oferece educação antes do especialista', async ({
  page,
}) => {
  await loginClient(page);
  await page
    .getByRole('textbox', { name: 'Sua mensagem', exact: true })
    .fill('Quero investir R$ 50 mil pensando na aposentadoria. O que você recomenda?');
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  const answer = page.locator('#client-chat .assistant').last();
  await expect(answer).toContainText('R$ 50 mil');
  await expect(answer).toContainText('aposentadoria');
  await expect(answer).toContainText('especialista precisa avaliar seu perfil');
  await expect(page.locator('#client-chat')).not.toContainText('Protocolo salvo');
  await expect(page.getByRole('button', { name: /Falar com uma pessoa/ })).toBeVisible();
  await page.getByRole('button', { name: 'Entender as diferenças', exact: true }).click();
  await expect(page.locator('#client-chat .assistant').last()).toContainText(
    'sem escolher um investimento por você',
  );
  await expect(page.locator('#client-chat')).not.toContainText('Protocolo salvo');
});

test('golpe tem prioridade sobre orientação e mantém bloqueio explicitamente simulado', async ({ page }) => {
  await loginClient(page);
  await page
    .getByRole('textbox', { name: 'Sua mensagem', exact: true })
    .fill('Quero investir R$ 50 mil, mas um gerente me ligou pedindo o código do SMS.');
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await expect(page.locator('#client-chat')).toContainText('Segurança 24h, sem fila');
  await expect(page.getByRole('button', { name: 'Entender as diferenças', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Simular bloqueio de acesso', exact: true }).first().click();
  await expect(page.getByRole('button', { name: 'Bloqueio simulado ✓', exact: true })).toBeDisabled();
  await expect(page.locator('#toast')).toContainText('Nenhuma sessão bancária foi alterada');
});

for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test(`layout do protótipo em ${viewport.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await expect(page.getByRole('heading', { name: 'Cada pessoa, seu espaço.' })).toBeVisible();
    await captureLayout(page, testInfo, `entrada-${viewport.name}`);
    await loginClient(page, 'C-0001');
    await captureLayout(page, testInfo, `cliente-${viewport.name}`);
    await page.getByRole('button', { name: /Pressão de terceiro/ }).click();
    await logout(page);
    await page.getByRole('button', { name: 'Entrar como atendente →', exact: true }).click();
    await captureLayout(page, testInfo, `atendente-${viewport.name}`);
  });
}
