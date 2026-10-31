/* global window, document, MutationObserver */
(() => {
  const demo = window.CaquiDemo;
  const config = window.CAQUI_LOCAL_CONFIG;
  if (!demo || !config || !['localhost', '127.0.0.1'].includes(new URL(config.apiUrl).hostname)) return;
  const sessions = new Map();
  let active;
  const status = (text) => window.parent.postMessage({ type: 'caqui-ai-status', text }, config.parentOrigin);
  window.addEventListener('message', (event) => {
    if (
      event.source !== window.parent ||
      event.origin !== config.parentOrigin ||
      event.data?.type !== 'caqui-ai-config'
    )
      return;
    config.enabled = event.data.enabled === true;
    config.model = event.data.model === 'terra' ? 'terra' : 'luna';
    active?.abort();
  });
  async function request(context, question, signal) {
    const key = `${context.role}:${context.clientId}`;
    let session = sessions.get(key);
    if (!session || session.expiresAt < Date.now()) {
      const res = await fetch(`${config.apiUrl}/demo/session`, {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: context.role, clientId: context.clientId }),
      });
      if (!res.ok) throw new Error('Sessão local indisponível');
      session = await res.json();
      sessions.set(key, session);
    }
    const res = await fetch(`${config.apiUrl}/demo/${context.role === 'agent' ? 'copilot' : 'chat'}`, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', 'X-Demo-Session': session.token },
      body: JSON.stringify({ message: question.slice(0, 1000), model: config.model }),
    });
    if (!res.ok) throw new Error('IA local indisponível ou limite atingido');
    const reply = await res.json();
    if (typeof reply.text !== 'string' || !Array.isArray(reply.sources)) throw new Error('Resposta inválida');
    return reply;
  }
  window.addEventListener('caqui:question', async (event) => {
    active?.abort();
    if (!config.enabled) {
      status('Modo offline: respostas locais simuladas.');
      return;
    }
    const expected = event.detail;
    const controller = new AbortController();
    active = controller;
    status('Consultando a IA local; o atendimento continua disponível.');
    try {
      const reply = await request(
        { role: 'client', clientId: expected.clientId },
        expected.question,
        controller.signal,
      );
      if (!controller.signal.aborted && demo.replaceAnswer(expected, reply)) status(reply.notice);
    } catch {
      if (!controller.signal.aborted) status('Resposta local preservada: a IA não concluiu a consulta.');
    }
  });
  const panel = document.querySelector('#copilot-content');
  function addCopilotButton() {
    const context = demo.context();
    if (context.role !== 'agent' || !context.selected || panel.querySelector('#local-ai-draft')) return;
    const button = document.createElement('button');
    button.id = 'local-ai-draft';
    button.className = 'outline-button';
    button.textContent = 'Gerar rascunho com IA local';
    button.style.marginBottom = '12px';
    button.onclick = async () => {
      if (!config.enabled) {
        status('Ative a IA local para gerar um novo rascunho.');
        return;
      }
      active?.abort();
      const controller = new AbortController();
      active = controller;
      const expected = demo.context();
      button.disabled = true;
      status('Preparando rascunho interno; envio continua exigindo revisão.');
      try {
        const reply = await request(
          expected,
          'Prepare um rascunho com o contexto recente e os fatos desta conta, para revisão do atendente.',
          controller.signal,
        );
        if (!controller.signal.aborted && demo.setDraft(expected, reply.text))
          status(reply.notice + ' Revise antes de enviar.');
      } catch {
        if (!controller.signal.aborted) status('Rascunho local preservado: a IA não concluiu a consulta.');
      } finally {
        button.disabled = false;
      }
    };
    panel.prepend(button);
  }
  new MutationObserver(addCopilotButton).observe(panel, { childList: true });
  document.querySelector('#logout').addEventListener('click', () => active?.abort());
  status(
    config.enabled
      ? 'IA local ativada. Dados e operações continuam sendo de demonstração.'
      : 'Modo offline: respostas locais simuladas.',
  );
})();
