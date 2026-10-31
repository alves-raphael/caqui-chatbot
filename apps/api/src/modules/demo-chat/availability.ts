import calendar from '../../../../../caqui-invest/dados/calendario.json' with { type: 'json' };

/** User-approved deviation from KB-025: 08–20 daily except known holidays.
 * Weekends stay open; security is always available. HTTP callers cannot set `now`.
 * The case calendar covers national holidays only, from 2026-10-01 to 2027-12-31.
 */
export function supportAvailability(security = false, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const part = (name: string) => parts.find((p) => p.type === name)!.value;
  const hour = Number(part('hour'));
  const day = `${part('year')}-${part('month')}-${part('day')}`;
  const entry = calendar.dias.find((d) => d.data === day);
  const calendarKnown = !!entry;
  const available = security || (calendarKnown && !entry.feriado && hour >= 8 && hour < 20);
  const next =
    !available && calendarKnown
      ? calendar.dias.find((d) => !d.feriado && (d.data > day || (d.data === day && hour < 8)))
      : undefined;
  const nextWindow = next ? `${next.data}T08:00:00-03:00` : null;
  const nextLabel = nextWindow
    ? new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(nextWindow)) + ' BRT'
    : null;
  return {
    available,
    nextWindow,
    calendarKnown,
    holiday: entry?.feriado ?? null,
    checkedAt: now.toISOString(),
    timezone: 'America/Sao_Paulo' as const,
    message: security
      ? 'Segurança atende 24h, inclusive feriados. Este encaminhamento é simulado; nenhuma equipe real foi acionada.'
      : available
        ? 'Horário de atendimento: 8h–20h, inclusive fins de semana, exceto feriados conhecidos. Protocolo registrado; não há estimativa real de espera nesta demonstração.'
        : !calendarKnown || !nextLabel
          ? 'Protocolo registrado. Não tenho calendário de atendimento validado para informar a próxima abertura; a data de retorno precisa ser confirmada. Nenhuma pessoa foi acionada nesta demonstração.'
          : `${entry?.feriado ? 'Hoje é feriado (' + entry.feriado + ').' : 'Fora do horário de atendimento.'} Protocolo registrado para retorno a partir de ${nextLabel}; até sete dias corridos para demandas não urgentes. Nenhuma pessoa foi acionada nesta demonstração.`,
  };
}
