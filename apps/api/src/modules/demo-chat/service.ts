import { readFileSync } from 'node:fs';
import facts from './facts.json' with { type: 'json' };
import { MODELS, type OpenRouterProvider } from './openrouter.js';
import type { ChatRequest, ChatResponse, DemoIdentity } from './schemas.js';

const money = (value: string | number) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const date = (value: string) => value.split('-').reverse().join('/');
const normal = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const clean = (value: string) =>
  value
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[CPF removido]')
    .replace(/(?:senha|token|código)\s*[:=]\s*\S+/gi, '[credencial removida]');
const labels: Record<string, string> = {
  'CDB-LD-100': 'CDB Caqui Liquidez Diária 100',
  'CDB-LD-110': 'CDB Caqui Liquidez Diária 110',
  'LCI-90D-92': 'LCI Caqui 92',
  'FUNDO-RF-01': 'Caqui Renda Fixa FIF',
  'FUNDO-MM-01': 'Caqui Multimercado FIF',
  ACOES: 'Ações',
  'TESOURO-SELIC-2029': 'Tesouro Selic 2029',
};
type Plan = { text: string; sources: string[]; financial: boolean; rule?: boolean };
const knowledge = new Map<string, string>();
function kb(id: string) {
  let value = knowledge.get(id);
  if (!value) {
    value = readFileSync(
      new URL(`../../../../../caqui-invest/dados/base_conhecimento/${id}.md`, import.meta.url),
      'utf8',
    )
      .replace(/^---[\s\S]*?---\s*/, '')
      .slice(0, 5000);
    knowledge.set(id, value);
  }
  return value;
}

function plan(identity: DemoIdentity, question: string): Plan {
  const text = normal(question);
  const client = facts.clients.find((c) => c.id === identity.clientId)!;
  const positions = facts.positions.filter((p) => p.id_cliente === identity.clientId);
  const operations = facts.operations.filter((o) => o.id_cliente === identity.clientId);
  const foreignId = question.match(/C-\d{4}/gi)?.some((id) => id.toUpperCase() !== identity.clientId);
  if (
    foreignId ||
    /ignore.*regr|prompt|instrucoes internas|outro cliente|base interna|system prompt|api.?key|chave.*api/.test(
      text,
    )
  )
    return {
      text: 'Não posso mudar de conta, revelar instruções internas ou fornecer credenciais. Posso ajudar somente com os dados sintéticos desta persona.',
      sources: ['KB-019'],
      financial: false,
      rule: true,
    };
  if (
    /golpe|fraude|codigo.*sms|senha.*lig|lig(?:ou|aram).*?(codigo|sms|token|senha)|pedi(?:u|ram|ndo).*?(codigo|sms|token|senha)|pix.*teste|(?:acesso|suporte) remoto/.test(
      text,
    )
  )
    return {
      text: 'Não compartilhe senhas ou códigos e não faça transferências. Procure Segurança imediatamente, disponível 24h. Nesta demonstração, bloqueio e encaminhamento são simulados; nenhuma equipe real foi acionada.',
      sources: ['KB-019', 'KB-020'],
      financial: false,
      rule: true,
    };
  if (
    /recomend|melhor.*invest|onde.*invest|onde.*coloco|vale.*pena.*(?:pra mim|para mim)|heranca|me diz o que fazer|devo.*(aplic|invest)|voce faria/.test(
      text,
    )
  )
    return {
      text: 'Posso explicar produtos, riscos e prazos, mas não escolher um investimento por você. Uma indicação pessoal exige avaliar seu perfil e objetivos com um especialista. O encaminhamento nesta demonstração é simulado.',
      sources: ['KB-029'],
      financial: false,
      rule: true,
    };
  const requested = question.match(/OP-\d+/i)?.[0]?.toUpperCase();
  if (requested && !operations.some((o) => o.id_operacao === requested))
    return {
      text: 'Não encontrei essa operação nos dados autorizados desta persona. Não vou consultar outra conta nem inventar uma previsão.',
      sources: ['KB-008'],
      financial: false,
      rule: true,
    };
  const application =
    !/resgate|saque/.test(text) && /20\s*mil|20[.,]000|vinte mil|minha aplicacao/.test(text);
  if (
    requested ||
    application ||
    (/resgate|saque/.test(text) && !/ate que horas|limite|liquidez/.test(text))
  ) {
    const product = [
      [/acoes|acao\b/, 'ACOES'],
      [/multimercado/, 'FUNDO-MM'],
      [/renda fixa/, 'FUNDO-RF'],
      [/tesouro/, 'TESOURO'],
      [/\blci\b/, 'LCI'],
      [/\bcdb\b/, 'CDB'],
    ].find(([pattern]) => (pattern as RegExp).test(text))?.[1] as string | undefined;
    const matching = operations.filter(
      (o) => o.tipo === 'resgate' && (!product || o.produto.startsWith(product)),
    );
    if (!requested && !application && matching.length > 1)
      return {
        text: `Encontrei mais de um resgate. Qual você quer consultar: ${matching.map((o) => labels[o.produto] ?? o.produto).join(' ou ')}?`,
        sources: ['KB-008'],
        financial: false,
        rule: true,
      };
    const op = requested
      ? operations.find((o) => o.id_operacao === requested)
      : application
        ? operations.find(
            (o) => o.tipo === 'aplicacao' && (Number(o.valor_brl) === 20000 || /minha aplicacao/.test(text)),
          )
        : matching[0];
    if (!op)
      return {
        text: 'Não há registro dessa operação para esta persona. Uma pessoa precisa conferir; nenhuma data ou valor foi inventado.',
        sources: ['KB-008'],
        financial: true,
        rule: true,
      };
    const sources = [`record:operacoes.csv · ${op.id_operacao}`, 'KB-008', 'KB-006'];
    if (op.tipo === 'aplicacao' && op.status === 'liquidada') {
      const position = positions.find(
        (p) => p.produto === op.produto && p.data_aplicacao === op.pedido_em.slice(0, 10),
      );
      if (position) sources.push(`record:posicoes.csv · ${position.id_posicao}`);
      return {
        text: `A aplicação de ${money(op.valor_brl)} em ${labels[op.produto] ?? op.produto}, de ${date(op.pedido_em.slice(0, 10))}, foi concluída. Esse dinheiro está investido; não é um depósito disponível em conta.${position ? ` O valor bruto registrado é ${money(position.saldo_bruto_brl)}.` : ''} O saldo em conta, separado, é ${money(client.saldo_em_conta_brl)}. Dados fictícios de 18/11/2026, não ao vivo.`,
        sources: [...sources, `record:clientes.json · ${client.id}`],
        financial: true,
      };
    }
    const forecast = facts.forecasts[op.id_operacao as keyof typeof facts.forecasts];
    const prediction = op.liquidacao_prevista || forecast?.payment;
    return {
      text: `O pedido de ${money(op.valor_brl)} em ${labels[op.produto] ?? op.produto} foi feito em ${date(op.pedido_em.slice(0, 10))}, às ${op.pedido_em.slice(11, 16)}. Status: ${op.status.replaceAll('_', ' ')}. ${prediction ? `Previsão de recebimento: ${date(prediction)}. Essa previsão não confirma pagamento.` : 'Não há previsão validada para informar.'} Nenhuma movimentação foi realizada; são registros sintéticos.`,
      sources,
      financial: true,
    };
  }
  if (identity.role === 'agent' || /dinheiro|saldo|quanto.*tenho|investimentos|posicoes/.test(text)) {
    const pending = operations.filter((o) => o.tipo === 'resgate' && o.status !== 'liquidada');
    const textParts = [
      `${client.nome}: retrato sintético em 18/11/2026, não ao vivo.`,
      `Na conta: ${money(client.saldo_em_conta_brl)}.`,
      'Nos investimentos (valores brutos, não saldo livre):',
      ...positions.map((p) => `${labels[p.produto] ?? p.produto}: ${money(p.saldo_bruto_brl)}.`),
      positions.length
        ? ''
        : 'Não há posições no arquivo para esta persona; isso não confirma investimento zero.',
      'Resgates em andamento, separados dos saldos:',
      ...pending.map(
        (o) =>
          `${money(o.valor_brl)} em ${labels[o.produto] ?? o.produto}: ${o.status.replaceAll('_', ' ')}. ${o.liquidacao_prevista ? `Previsão registrada: ${date(o.liquidacao_prevista)}.` : 'Sem previsão preenchida no registro.'}`,
      ),
      'Não somei os resgates aos saldos para evitar contar o mesmo dinheiro duas vezes. Previsão não confirma pagamento.',
    ];
    return {
      text: textParts.filter(Boolean).join('\n\n'),
      sources: [
        `record:clientes.json · ${client.id}`,
        ...positions.map((p) => `record:posicoes.csv · ${p.id_posicao}`),
        ...pending.map((o) => `record:operacoes.csv · ${o.id_operacao}`),
        'KB-008',
        'KB-009',
      ],
      financial: true,
    };
  }
  const topics: [RegExp, string][] = [
    [/corte|ate que horas|resgate|liquidez/, 'KB-006'],
    [/imposto|tribut|\bir\b/, 'KB-010'],
    [/lci|lca/, 'KB-011'],
    [/cdb/, 'KB-003'],
    [/fundo/, 'KB-014'],
    [/document|informe/, 'KB-017'],
    [/tarifa/, 'KB-024'],
  ];
  const topic = topics.find(([pattern]) => pattern.test(text));
  if (topic) return { text: kb(topic[1]), sources: [topic[1]], financial: false };
  return {
    text: 'Não encontrei uma resposta segura nas fontes selecionadas. Posso consultar seu saldo, investimentos, resgate, aplicação ou explicar produtos. O atendimento humano continua disponível na demonstração.',
    sources: ['KB-008'],
    financial: false,
    rule: true,
  };
}

export class DemoChatService {
  private readonly history = new Map<string, string[]>();
  constructor(readonly provider: OpenRouterProvider) {}
  async answer(identity: DemoIdentity, request: ChatRequest): Promise<ChatResponse> {
    const question = clean(request.message);
    const previous = this.history.get(identity.clientId) ?? [];
    const result = plan(identity, question);
    if (identity.role === 'client') this.history.set(identity.clientId, [...previous, question].slice(-6));
    const base = { text: result.text, sources: result.sources, model: null, costUsd: 0 };
    if (result.rule)
      return { ...base, mode: 'rule', notice: 'Resposta por regra local; nenhuma chamada ao modelo.' };
    const context = JSON.stringify({
      approvedText: result.text,
      sourceIds: result.sources,
      recentClientQuestions: previous,
    });
    const response = await this.provider.explain(request.model, context, question, result.financial);
    if (!response?.output)
      return {
        ...base,
        costUsd: response?.costUsd ?? 0,
        mode: 'fallback',
        notice: 'Resposta local: IA indisponível, limite atingido ou chamada não concluída.',
      };
    const text = response.output.text.trim();
    const sourcesValid =
      (result.financial || response.output.sourceIds.length > 0) &&
      response.output.sourceIds.every((id) => result.sources.includes(id));
    const disallowed =
      /recomendo|invista|compre|melhor investimento|retorno garantido|ignore.*regr|api.?key|sk-or-|<script|https?:/i.test(
        text,
      );
    const numberSet = new Set(result.text.match(/\d+(?:[.,/:-]\d+)*/g) ?? []);
    const numbersValid = (text.match(/\d+(?:[.,/:-]\d+)*/g) ?? []).every((n) => numberSet.has(n));
    const introValid =
      !result.financial ||
      (text.length <= 160 &&
        !/\d|R\$|\bcdb\b|\blci\b|\blca\b|\bfundo\b|dispon[ií]vel|garant|recomend|investir em|compre|resgate hoje/i.test(
          text,
        ));
    if (!sourcesValid || disallowed || !numbersValid || !introValid)
      return {
        ...base,
        costUsd: response.costUsd,
        mode: 'fallback',
        notice: 'Resposta local: a saída do modelo não passou na validação.',
      };
    return {
      text: result.financial ? `${text}\n\n${result.text}` : text,
      sources: result.sources,
      mode: 'model',
      model: MODELS[request.model],
      notice: 'IA conectada ao OpenRouter. Dados financeiros preservados pelo servidor.',
      costUsd: response.costUsd,
    };
  }
}
