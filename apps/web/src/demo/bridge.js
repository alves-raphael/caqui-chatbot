/* global window, document, MutationObserver */
(() => {
  const demo = window.CaquiDemo;
  const config = window.CAQUI_LOCAL_CONFIG;
  if (!demo || !config) return;
  const apiUrl = new URL(config.apiUrl, config.parentOrigin);
  if (apiUrl.origin !== config.parentOrigin && !['localhost', '127.0.0.1'].includes(apiUrl.hostname)) return;
  config.apiUrl = apiUrl.href.replace(/\/$/, '');
  const sessions = new Map();
  const generations = new Map();
  const conversationKey = (id, generation = generations.get(id) || 0) => `${id}:${generation}`;
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
  const pendingSessions = new Map();
  const flows = new Map();
  async function getSession(context) {
    const key = `${context.role}:${conversationKey(context.clientId, context.generation)}`;
    const existing = sessions.get(key);
    if (existing && existing.expiresAt > Date.now()) return existing;
    if (pendingSessions.has(key)) return pendingSessions.get(key);
    const pending = (async () => {
      const res = await fetch(`${config.apiUrl}/demo/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: context.role, clientId: context.clientId }),
      });
      if (!res.ok) throw new Error('Sessão local indisponível');
      const session = await res.json();
      sessions.set(key, session);
      return session;
    })();
    pendingSessions.set(key, pending);
    try {
      return await pending;
    } finally {
      pendingSessions.delete(key);
    }
  }
  async function flowRequest(event, context) {
    const checkGeneration = () => {
      if (context.generation !== (generations.get(context.clientId) || 0))
        throw new Error('Atendimento reiniciado');
    };
    checkGeneration();
    const client = await getSession({
      role: 'client',
      clientId: context.clientId,
      generation: context.generation,
    });
    const actor =
      event === 'assume'
        ? await getSession({ role: 'agent', clientId: context.clientId, generation: context.generation })
        : client;
    const post = async (eventName, session, target) => {
      checkGeneration();
      const res = await fetch(`${config.apiUrl}/demo/flow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Session': session.token },
        body: JSON.stringify({ event: eventName, ...(target ? { clientSession: target } : {}) }),
      });
      if (!res.ok) throw new Error('Não foi possível sincronizar o atendimento');
      return res.json();
    };
    if (event === 'assume') await post('queue', client);
    return post(event, actor, event === 'assume' ? client.token : undefined);
  }
  window.CaquiSyncFlow = async (event, context) => {
    active?.abort();
    const generation = generations.get(context.clientId) || 0;
    const key = conversationKey(context.clientId, generation);
    const previous = flows.get(key) || Promise.resolve();
    const update = previous.catch(() => {}).then(() => flowRequest(event, { ...context, generation }));
    flows.set(key, update);
    try {
      await update;
      return true;
    } catch {
      if (generation === (generations.get(context.clientId) || 0))
        status('Chat pausado. Não foi possível sincronizar o protocolo com a API.');
      return false;
    }
  };
  window.addEventListener('caqui:reset', (event) => {
    active?.abort();
    generations.set(event.detail.clientId, (generations.get(event.detail.clientId) || 0) + 1);
  });
  window.addEventListener('caqui:flow', (event) => {
    void window.CaquiSyncFlow(event.detail.event, event.detail);
  });
  async function request(context, question, signal, quickReply) {
    const session = await getSession(context);
    await flows.get(conversationKey(context.clientId));
    if (
      signal.aborted ||
      (context.role === 'client' && ['queued', 'human', 'closed'].includes(demo.context().phase))
    )
      throw new Error('IA pausada');
    const res = await fetch(`${config.apiUrl}/demo/${context.role === 'agent' ? 'copilot' : 'chat'}`, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', 'X-Demo-Session': session.token },
      body: JSON.stringify({
        message: question.slice(0, 1000),
        model: config.model,
        ...(context.role === 'agent' && context.caseContext ? { caseContext: context.caseContext } : {}),
        ...(quickReply
          ? {
              action: quickReply.action,
              ...(quickReply.operationId ? { operationId: quickReply.operationId } : {}),
            }
          : {}),
      }),
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
        expected.quickReply,
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
    const feedback = document.createElement('p');
    feedback.id = 'local-ai-feedback';
    feedback.setAttribute('role', 'status');
    feedback.className = 'status-line';
    button.onclick = async () => {
      if (!config.enabled) {
        feedback.textContent = 'Ative a IA local para gerar ou escreva manualmente no campo abaixo.';
        status('Ative a IA local para gerar um novo rascunho.');
        return;
      }
      active?.abort();
      const controller = new AbortController();
      active = controller;
      const expected = demo.context();
      button.disabled = true;
      button.textContent = 'Gerando rascunho…';
      feedback.textContent =
        'Gerando com as fontes do atendimento. Você pode editar manualmente se a consulta falhar.';
      status('Preparando rascunho interno; envio continua exigindo revisão.');
      try {
        const reply = await request(
          expected,
          'Prepare um rascunho com o contexto recente e os fatos desta conta, para revisão do atendente.',
          controller.signal,
        );
        if (!controller.signal.aborted && demo.setDraft(expected, reply.text, reply.sources)) {
          feedback.textContent = reply.notice + ' Revise o texto e marque a confirmação abaixo.';
          status(reply.notice + ' Revise antes de enviar.');
        } else
          feedback.textContent =
            'O atendimento mudou. Atualize o contexto e gere novamente; nenhum texto foi enviado.';
      } catch {
        feedback.textContent =
          'A IA não concluiu. Edite a resposta manualmente abaixo ou tente gerar novamente. Nenhum texto foi enviado.';
        if (!controller.signal.aborted) status('Rascunho local preservado: a IA não concluiu a consulta.');
      } finally {
        button.disabled = false;
        button.textContent = 'Gerar rascunho com IA local';
      }
    };
    panel.prepend(button, feedback);
  }
  new MutationObserver(addCopilotButton).observe(panel, { childList: true });
  document.querySelector('#logout').addEventListener('click', () => active?.abort());
  status(
    config.enabled
      ? 'IA local ativada. Dados e operações continuam sendo de demonstração.'
      : 'Modo offline: respostas locais simuladas.',
  );
})();
