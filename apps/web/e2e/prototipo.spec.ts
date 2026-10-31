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
  await expect(chat).toContainText('A previsão é receber em 18/11/2026');
  await expect(chat).toContainText('o pagamento ainda não foi confirmado');
  await chat.getByText('Ver detalhes do pedido', { exact: true }).click();
  await expect(chat).toContainText('calculada pelas regras do produto e calendário da Caqui');
  await chat.getByText('Ver fontes desta resposta', { exact: true }).click();
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
  await expect(review).toBeDisabled();
  await page.getByRole('button', { name: 'Assumir atendimento · simulação', exact: true }).click();
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
    await page
      .getByRole('textbox', { name: 'Sua mensagem', exact: true })
      .fill('Meu sobrinho disse que tenho que tirar tudo hoje e mandar pra ele');
    await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
    await logout(page);
    await page.getByRole('button', { name: 'Entrar como atendente →', exact: true }).click();
    await captureLayout(page, testInfo, `atendente-${viewport.name}`);
  });
}

async function openCopilotPanel(page: Page, narrow: boolean) {
  if (narrow) {
    await page.getByRole('button', { name: 'Copiloto', exact: true }).click();
  }
}

async function sendClientMessage(page: Page, message: string) {
  await page.getByRole('textbox', { name: 'Sua mensagem', exact: true }).fill(message);
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
}

async function savedTickets(page: Page, clientId = 'C-0002') {
  return page.evaluate((id) => {
    const saved = JSON.parse(localStorage.getItem(`caqui-demo-v2:${id}`) ?? '{"tickets":[]}') as {
      tickets: { id: string; created: string; priority: string; handling: string }[];
    };
    return saved.tickets.map(({ id, created, priority, handling }) => ({ id, created, priority, handling }));
  }, clientId);
}

test('resgate de Marta tem explicação curta, detalhes expansíveis e corte das 16h', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 740 });
  await loginClient(page, 'C-0001');
  await sendClientMessage(page, 'Onde está meu resgate do CDB?');
  const answer = page.locator('#client-chat .assistant').last();
  await expect(answer).toContainText(/resgate de R\$\s*40\.000,00 foi pedido ontem depois das 16h/);
  await expect(answer).toContainText(
    'A previsão é receber em 18/11/2026; o pagamento ainda não foi confirmado',
  );
  await expect(answer.locator('.answer-details')).not.toHaveAttribute('open', '');
  await expect(answer.locator('.answer-details p')).toBeHidden();
  await page.screenshot({ path: testInfo.outputPath('resgate-explicacao-curta.png') });
  await answer.getByText('Ver detalhes do pedido', { exact: true }).click();
  await expect(answer.locator('.answer-details p')).toBeVisible();
  await expect(answer.locator('.answer-details p')).toContainText('CDB Caqui Liquidez Diária 110');
  await expect(answer.locator('.answer-details p')).toContainText('Em processamento');
  await sendClientMessage(page, 'Até que horas posso pedir o resgate do CDB?');
  await expect(page.locator('#client-chat .assistant').last()).toContainText('16h (inclusive), em dia útil');
  await expect(page.locator('#client-chat .assistant').last()).toContainText('próximo dia útil');
  expect(await savedTickets(page, 'C-0001')).toEqual([]);
});

test('protocolo precede a oferta opcional e recusar a IA preserva registro e prioridade', async ({
  page,
}) => {
  await loginClient(page, 'C-0002');
  await page.getByRole('button', { name: '♧ Falar com uma pessoa', exact: true }).click();
  const before = await savedTickets(page);
  expect(before).toHaveLength(1);
  expect(before[0]).toMatchObject({ priority: 'Normal', handling: 'waiting' });
  const messages = await page.locator('#client-chat .assistant').allTextContents();
  const registered = messages.findIndex((text) => text.includes('Protocolo salvo neste navegador'));
  const offered = messages.findIndex((text) => text.includes('Sou a IA desta demonstração'));
  expect(registered).toBeGreaterThanOrEqual(0);
  expect(offered).toBeGreaterThan(registered);
  await expect(page.locator('#client-chat')).toContainText('não tenho uma posição ou tempo real de espera');
  await page.getByRole('button', { name: 'Prefiro só aguardar', exact: true }).click();
  await expect(page.locator('#client-chat')).toContainText('Seu protocolo e sua prioridade permanecem');
  await sendClientMessage(page, 'Como funciona o imposto?');
  expect(await savedTickets(page)).toEqual(before);
  await expect(page.locator('#client-chat .message').last()).toHaveClass(/user/);
  await page.reload();
  await loginClient(page, 'C-0002');
  expect(await savedTickets(page)).toEqual(before);
  await expect(page.locator('#waiting-strip')).toContainText(before[0]!.id);
});

test('ajuda reaproveita o histórico e só encerra o protocolo com confirmação explícita', async ({ page }) => {
  await loginClient(page, 'C-0002');
  await sendClientMessage(page, 'Como funciona o imposto?');
  await page.getByRole('button', { name: '♧ Falar com uma pessoa', exact: true }).click();
  const before = await savedTickets(page);
  await page.getByRole('button', { name: 'Quero ajuda da IA enquanto aguardo', exact: true }).click();
  await expect(page.locator('#client-chat')).toContainText('Vou partir do que você já contou');
  await expect(page.getByRole('button', { name: 'Isso resolveu minha dúvida', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Isso resolveu minha dúvida', exact: true }).click();
  await expect(page.locator('#client-chat')).toContainText('Até você confirmar, ele continua aberto');
  expect(await savedTickets(page)).toEqual(before);
  await page.getByRole('button', { name: 'Não, manter meu atendimento', exact: true }).click();
  expect(await savedTickets(page)).toEqual(before);
  await page.getByRole('button', { name: 'Ajuda opcional da IA', exact: true }).click();
  await page.getByRole('button', { name: 'Quero ajuda da IA enquanto aguardo', exact: true }).click();
  await page.getByRole('button', { name: 'Isso resolveu minha dúvida', exact: true }).click();
  await page.getByRole('button', { name: 'Sim, encerrar este protocolo', exact: true }).click();
  expect(await savedTickets(page)).toEqual([{ ...before[0], handling: 'closed' }]);
  await expect(page.locator('#waiting-strip')).toBeHidden();
  await expect(page.locator('#client-chat')).toContainText(
    'Sua conta e seus investimentos não foram alterados',
  );
  await logout(page);
  await page.getByRole('button', { name: 'Entrar como atendente →', exact: true }).click();
  await expect(page.locator('#ticket-list')).toContainText('Encerrado pelo cliente · simulado');
  await expect(
    page.getByRole('button', { name: 'Assumir atendimento · simulação', exact: true }),
  ).toHaveCount(0);
});

test('Jonas recebe a pesquisa e assumir interrompe a IA sem misturar clientes', async ({
  page,
}, testInfo) => {
  await loginClient(page, 'C-0002');
  await page.getByRole('button', { name: '♧ Falar com uma pessoa', exact: true }).click();
  await page.getByRole('button', { name: 'Quero ajuda da IA enquanto aguardo', exact: true }).click();
  await sendClientMessage(page, 'Quanto tenho na conta?');
  await expect(page.locator('#client-chat')).toContainText(/R\$\s*3\.420,55/);
  await logout(page);
  await loginClient(page, 'C-0003');
  await expect(page.locator('#client-chat')).not.toContainText(/R\$\s*3\.420,55/);
  await expect(page.locator('#waiting-strip')).toBeHidden();
  await logout(page);
  await page.getByRole('button', { name: 'Entrar como atendente →', exact: true }).click();
  await expect(page.locator('#agent-chat')).toContainText('Quanto tenho na conta?');
  await expect(page.locator('#copilot-content')).toContainText(/3\.420,55/);
  await expect(page.getByRole('checkbox', { name: /Revisei o texto/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Assumir atendimento · simulação', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: /Revisei o texto/ })).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath('pesquisa-no-atendimento.png') });
  await logout(page);
  await loginClient(page, 'C-0002');
  await expect(page.locator('#waiting-strip')).toContainText('Jonas assumiu');
  const answers = await page.locator('#client-chat .assistant').count();
  await sendClientMessage(page, 'Como funciona o imposto?');
  await expect(page.locator('#client-chat .assistant')).toHaveCount(answers);
  await expect(page.locator('#client-chat .message').last()).toHaveClass(/user/);
  await expect(page.getByRole('button', { name: 'Ajuda opcional da IA', exact: true })).toHaveCount(0);
  expect((await savedTickets(page))[0]?.handling).toBe('human');
});

test('consulta sem resposta segura mantém o protocolo e registra o limite', async ({ page }) => {
  await loginClient(page, 'C-0002');
  await page.getByRole('button', { name: '♧ Falar com uma pessoa', exact: true }).click();
  const before = await savedTickets(page);
  await page.getByRole('button', { name: 'Quero ajuda da IA enquanto aguardo', exact: true }).click();
  await sendClientMessage(page, 'Qual é a cor da lua?');
  await expect(page.locator('#client-chat')).toContainText('Não tenho uma resposta segura para esse ponto');
  expect(await savedTickets(page)).toEqual(before);
  await expect(page.getByRole('button', { name: 'Sim, encerrar este protocolo', exact: true })).toHaveCount(
    0,
  );
});

test('fora do horário mantém retorno simulado e golpe interrompe a consulta opcional', async ({ page }) => {
  await loginClient(page, 'C-0002');
  await page.getByLabel('Relógio da demonstração · Brasília').fill('2026-11-18T23:00');
  await page.getByRole('button', { name: '♧ Falar com uma pessoa', exact: true }).click();
  await expect(page.locator('#client-chat')).toContainText('Agora estamos fora do horário humano');
  const before = await savedTickets(page);
  await page.getByRole('button', { name: 'Quero ajuda da IA enquanto aguardo', exact: true }).click();
  await sendClientMessage(page, 'Um gerente me ligou pedindo o código do SMS');
  await expect(page.locator('#waiting-strip')).toContainText('Segurança 24h');
  expect(await savedTickets(page)).toEqual([{ ...before[0], priority: 'Segurança 24h' }]);
  await expect(page.getByRole('button', { name: 'Ajuda opcional da IA', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Isso resolveu minha dúvida', exact: true })).toHaveCount(0);
});

test('Marta vê conta e todas as posições separadas do resgate e entende a aplicação de 20 mil', async ({
  page,
}, testInfo) => {
  await loginClient(page, 'C-0001');
  await expect(page.locator('.balance')).toHaveText(/R\$\s*1\.250,00/);
  await expect(page.locator('.invested-total')).toHaveText(/R\$\s*61\.021,15/);
  await expect(page.locator('.position-row')).toHaveCount(2);
  await expect(page.locator('.invested-card')).toContainText(/40\.791,24/);
  await expect(page.locator('.invested-card')).toContainText(/20\.229,91/);
  await expect(page.locator('.operations')).toContainText('Resgates em andamento');
  await sendClientMessage(page, 'Onde está meu dinheiro?');
  const overview = page.locator('#client-chat .assistant').last();
  await expect(overview).toContainText('Na conta');
  await expect(overview).toContainText('Nos investimentos');
  await expect(overview).toContainText('Resgates em andamento');
  await expect(overview).toContainText(/1\.250,00/);
  await expect(overview).toContainText(/40\.791,24/);
  await expect(overview).toContainText(/20\.229,91/);
  await expect(overview).toContainText(/40\.000,00/);
  await expect(overview).toContainText('Não somei esses pedidos ao saldo nem aos investimentos');
  await expect(overview).toContainText('18/11/2026');
  await expect(overview).toContainText('não é uma consulta em tempo real');
  await expect(overview.locator('details')).not.toHaveAttribute('open', '');
  await expect(overview.getByRole('link').first()).toBeHidden();
  await overview.locator('summary').click();
  await expect(overview).toContainText('OP-10005');
  await expect(overview).not.toContainText('C-0002');
  await page.screenshot({ path: testInfo.outputPath('panorama-financeiro.png') });
  await sendClientMessage(page, 'E os R$ 20 mil?');
  const application = page.locator('#client-chat .assistant').last();
  await expect(application).toContainText('LCI Caqui 92');
  await expect(application).toContainText('05/10/2026');
  await expect(application).toContainText('A aplicação foi concluída');
  await expect(application).toContainText('não é um depósito disponível no saldo da conta');
  await expect(application).toContainText(/20\.229,91/);
  await application.locator('summary').click();
  await expect(application).toContainText('OP-10006');
  await expect(application).not.toContainText('OP-10005');
  expect(await savedTickets(page, 'C-0001')).toEqual([]);
  await expect(page.getByRole('button', { name: 'Falar com especialista', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '♧ Falar com uma pessoa', exact: true }).click();
  expect((await savedTickets(page, 'C-0001'))[0]?.priority).toBe('Prioritário');
  await expect(
    page.getByRole('button', { name: 'Quero ajuda da IA enquanto aguardo', exact: true }),
  ).toHaveCount(0);
});

for (const viewport of [
  { width: 1165, height: 600 },
  { width: 390, height: 740 },
  { width: 390, height: 440 },
  { width: 580, height: 375 },
]) {
  test(`chat rolável e compositor acessível em ${viewport.width}x${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await loginClient(page);
    const input = page.getByRole('textbox', { name: 'Sua mensagem', exact: true });
    const human = page.getByRole('button', { name: '♧ Falar com uma pessoa', exact: true });
    const help = page.getByRole('button', { name: 'Ver opções de ajuda', exact: true });
    await expect(input).toBeInViewport({ ratio: 1 });
    await expect(human).toBeInViewport({ ratio: 1 });
    await expect(help).toBeInViewport({ ratio: 1 });
    await input.fill('Quero investir R$ 50 mil para minha aposentadoria. O que você recomenda?');
    await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
    const chat = page.locator('#client-chat');
    await expect(chat).toContainText('R$ 50 mil');
    await expect.poll(() => chat.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await chat.hover();
    await page.mouse.wheel(0, -10000);
    await expect.poll(() => chat.evaluate((element) => element.scrollTop)).toBe(0);
    await page.mouse.wheel(0, 10000);
    await expect.poll(() => chat.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await expect(input).toBeInViewport({ ratio: 1 });
    await expect(human).toBeInViewport({ ratio: 1 });
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(pageHeight).toBeLessThanOrEqual(viewport.height);
    await page.screenshot({ path: testInfo.outputPath('chat-compositor.png') });
    await help.click();
    await page.getByRole('button', { name: /Consultar uma operação/ }).click();
    await expect(input).toBeFocused();
    await human.click();
    await logout(page);
    await page.getByRole('button', { name: 'Entrar como atendente →', exact: true }).click();
    await openCopilotPanel(page, viewport.width <= 940);
    const review = page.getByRole('checkbox', { name: /Revisei o texto/ });
    await review.scrollIntoViewIfNeeded();
    await expect(review).toBeInViewport({ ratio: 1 });
    const send = page.getByRole('button', { name: 'Revisar e enviar · simulação', exact: true });
    await send.scrollIntoViewIfNeeded();
    await expect(send).toBeInViewport({ ratio: 1 });
    await expect(send).toBeDisabled();
    await page.screenshot({ path: testInfo.outputPath('copiloto-rolavel.png') });
  });
}
