# Protótipo Caqui Atende

Abra [caqui-prototipo.html](./caqui-prototipo.html) diretamente no navegador. O arquivo reúne HTML, CSS, JavaScript e dados sintéticos e pode ser editado sem instalação ou backend. Os links das fontes precisam de internet; a interface funciona offline com as fontes do sistema.

O protótipo tem entradas separadas para Cliente e Atendente, PatricIA com fontes, protocolo com histórico e copiloto com revisão antes do envio. No HTML standalone, as respostas são locais. Bloqueio, encaminhamento e envio continuam simulados também no modo conectado; não há operação financeira ou mensagem externa.

## IA conectada no computador local

Com o ambiente preparado e sem outra instância em execução, inicie a aplicação num shell que já tenha `OPENROUTER_API_KEY`. A chave é usada somente pelo backend; não coloque seu valor no HTML, em variáveis `VITE_*`, no Git ou em logs.

```sh
CAQUI_LIVE_AI_ENABLED=true CAQUI_TEST_BUDGET_USD=5 corepack yarn dev
```

Abra http://localhost:5174/demo. Deixe “IA local” marcado, selecione Luna ou Terra e entre como cliente. Para a demonstração: escolha Marta, pergunte “Onde está meu dinheiro?” e depois “Onde está meu resgate do CDB?”. Peça uma pessoa, saia e entre como atendente, assuma o caso e use “Gerar rascunho com IA local”. O envio permanece desabilitado até a revisão. O controle “IA local” pode ser desligado para continuar offline.

Os modelos permitidos são `openai/gpt-6-luna` e `openai/gpt-6.1-terra`, conferidos no [catálogo oficial](https://openrouter.ai/api/v1/models) em 31/10/2026. Em respostas financeiras, o modelo escolhe uma introdução de uma lista fechada validada por igualdade exata e o servidor acrescenta os fatos determinísticos; o modelo não recalcula saldo, imposto ou prazo. Explicações gerais são selecionadas de trechos permitidos das KBs públicas; a igualdade exata é validada no servidor. O manifesto SHA-256 impede usar artigo alterado sem revisão. Valores, fontes, conta e saída são validados; falha, limite ou saída recusada preserva uma resposta local explicitamente identificada.

As rotas `/demo/session`, `/demo/chat`, `/demo/copilot`, `/demo/flow` e `/demo/status` aceitam apenas conexões de loopback, a origem configurada e ambiente diferente de produção. São sessões locais de demonstração, com persona/papel fixados no servidor, token efêmero, expiração de 30 minutos e sem equivalência com autenticação bancária. O login Better Auth já existente permanece separado. Clientes não acessam a rota de copiloto nem podem trocar conta/papel no corpo da mensagem. A memória do servidor é isolada por token de sessão, inclusive entre visitantes da mesma persona, e retém apenas IDs de fontes consultadas e fica em RAM; protocolos continuam no `localStorage` do navegador. Reiniciar o servidor perde essa memória, não os protocolos locais.

Há timeout de 15 segundos, uma chamada simultânea por sessão, dez pedidos por minuto, até 100 chamadas no processo/recibos e reserva conservadora de US$ 0,03 por chamada. O orçamento configurado não aceita mais de US$ 5. O registro `.logs/openrouter-usage.jsonl`, ignorado pelo Git, contém somente modelo, horário, ID de chamada e custo/reserva; não contém chave, perguntas ou respostas. Reservas são mantidas entre reinícios, inclusive quando a resposta falha. `GET /demo/status` informa o custo reportado e a reserva acumulada. Não há retry pago automático.

Esta integração não foi publicada e não habilita o site estático a usar IA real. Hospedagem remota exige autorização, configuração do segredo no destino e substituição das sessões locais por autenticação/autorização apropriadas.

Validação desta integração: `yarn verify`, build e 34 testes E2E passaram. Chamadas reais confirmaram Luna no chat e Terra no rascunho revisável, Na medição inicial, sete chamadas somaram US$ 0,0018731 reportados. No snapshot de 31/10/2026 às 16h59 UTC, houve 12 tentativas, 10 recibos de uso e US$ 0,0020293 reportados; duas tentativas interrompidas não têm recibo de custo e continuam cobertas pela reserva conservadora total de US$ 0,36. O teste interativo pode aumentar esses números; o limite é aplicado ao mesmo ledger. As duas primeiras respostas usaram fallback durante ajuste do formato estruturado; os recibos preservam seus custos. Não há alegação de validação completa da SPEC ou de segurança de produção.

## Roteiro de demonstração

1. Selecione Celina, Dona Marta, Rafael ou Camila e use “Entrar como cliente”. Os exemplos e as operações correspondem ao ID da persona nos dados do case.
2. Consulte um exemplo ou use “Falar com uma pessoa”. Use “Sair / trocar perfil” e “Entrar como atendente” para acessar a fila de Jonas.
3. Selecione um caso e confira cliente, histórico, resumo, pendências e rascunho do copiloto. Use “Assumir atendimento” para liberar mensagens ao humano e habilitar a revisão do envio simulado. A IA já está pausada desde a entrada na fila.
4. Simule uma nova mensagem: o rascunho fica desatualizado e exige atualização.
5. Atualize, revise o texto, marque a revisão e faça o envio simulado. Saia e entre como o cliente daquele caso para ver a resposta.

Para testar a orientação de investimentos, escreva “Quero investir R$ 50 mil pensando na aposentadoria. O que você recomenda?”. O assistente reconhece valor e objetivo e oferece explicação dos produtos ou encaminhamento simulado ao especialista, sem indicar um investimento. “Falar com uma pessoa” continua disponível; suspeita de golpe recebe prioridade de segurança.

A conversa e os painéis têm rolagem própria, mantendo o campo de mensagem e as opções de ajuda acessíveis em janelas baixas. No celular, “Conta e exemplos de teste” abre os dados da persona; na mesa de atendimento, os botões “Fila”, “Conversa” e “Copiloto” alternam o painel visível.

Regra final de 31/10/2026: a ajuda da IA acontece antes do encaminhamento. Peça uma pessoa: o protocolo aparece e o compositor fica bloqueado até Jonas assumir. Segurança, reclamação e encerramento permanecem acessíveis. Na fila, a API também recusa chat; depois de assumir, mensagens vão apenas ao humano. O histórico e as consultas anteriores chegam ao copiloto. Essa regra substitui a versão anterior com pré-triagem durante a espera.

Para explorar o panorama financeiro, entre como Marta e pergunte “Onde está meu dinheiro?”. O saldo em conta de R$ 1.250,00 aparece separado dos investimentos brutos de R$ 61.021,15: CDB de R$ 40.791,24 e LCI de R$ 20.229,91. O resgate de R$ 40.000,00 em processamento fica em outro bloco e não é somado aos saldos. “E os R$ 20 mil?” explica a aplicação concluída na LCI, sem tratá-la como depósito disponível. São dados fictícios com referência em 18/11/2026; as fontes podem ser expandidas para consulta.

Os protocolos ficam no `localStorage` desse navegador, separados pelo ID do cliente. “Reiniciar demonstração” apaga somente o estado da persona atual. O isolamento é de interface e contexto; qualquer pessoa com acesso ao navegador pode inspecionar os dados públicos fictícios no arquivo e no armazenamento. Use apenas dados de demonstração: login, isolamento e sanitização ilustrativos não substituem controles de segurança de produção.

## Origem e edição

Exportação do layout Caqui Atende, com dados sintéticos do case incluído neste repositório. Além da formatação, foram incorporados o nome PatricIA, a correção de foco do menu de ajuda e uma ponte opcional para a demo local. O arquivo continua independente de backend quando aberto diretamente. A [SPEC complementar](../specs/caqui-atende.md) registra requisitos propostos e critérios para o desenvolvimento, sem comprovar sua implementação.

Os testes em `apps/web/e2e/prototipo.spec.ts` verificam a abertura local, entradas separadas, personas, fontes, continuidade do atendimento, revisão do copiloto, consentimento da pré-triagem, interrupção da IA, panorama financeiro e layout em desktop e celular. Os cenários de rolagem cobrem 1165×600, 390×740, 390×440 e 580×375. Com o ambiente do projeto preparado, execute `yarn e2e prototipo`. Esses testes não comprovam autenticação no servidor, atendimento real ou comportamento de teclado virtual em aparelho físico.

`apps/web/e2e/demo-live.spec.ts` testa a ponte com mocks, incluindo troca de persona durante uma resposta e fallback. Os testes de `apps/api/src/modules/demo-chat/` cobrem escopo de dados, permissões, injeção, recomendações, falha do provedor e orçamento sem chamadas pagas. O snapshot `facts.json` reúne somente as quatro personas, sete operações e oito posições conferidas nos datasets; previsões fixas foram calculadas com as mesmas regras e calendário da demo.

## Checagem focada com o script do case

O checker original passou em 11/11 pistas nas respostas capturadas da interface em modo offline: PT-03/04 (resgate), PT-13–17 (indicação pessoal) e PT-18–21 (fraude). Os arquivos de entrada e saída estão em `validacao/`. Reproduzir:

```bash
python3 caqui-invest/ferramentas/checar_respostas.py docs/prototipo/validacao/checker-respostas.jsonl --perguntas docs/prototipo/validacao/checker-perguntas.jsonl
```

São 11 perguntas selecionadas, não aprovação das 40. A interface usou o relógio fixo do case às 10h; PT-21 verifica o encaminhamento de segurança, mas não simula o relógio às 23h. O texto e a ação foram revisados pelo assistente; isso não constitui validação humana independente. A revisão encontrou e corrigiu expressões de fraude (suporte remoto, ligação pedindo senha) que não interrompiam o fluxo, e pedidos de indicação que caíam na resposta genérica.

Uma chamada real Luna confirmou que o resgate de ações de Rafael usa OP-10008 (R$ 2.200, previsão 19/11/2026), sem confundir com o multimercado OP-10007. Consulta ambígua agora pergunta qual produto; fraude e tentativa de consultar outra conta foram recusadas por regra, sem chamada paga. Fontes e status continuam distintos de confirmação de pagamento.

### Pré-triagem conectada

A validação direta em `/demo` confirmou dois caminhos com respostas reais Luna: Marta pede uma pessoa, mantém prioridade, aceita ajuda opcional, informa a dúvida, recebe a consulta e decide continuar aguardando; Jonas recebe a pergunta, pesquisa atualizada, fontes e pendências. Ao assumir, novas mensagens não geram resposta automática. Rafael reaproveita uma pergunta anterior, recebe a resposta conectada, sinaliza solução e só encerra após uma confirmação adicional.

A correção removeu a exclusão por idade da ajuda opcional em protocolos comuns (prioridade preservada; fraude/coação continuam fora da triagem), conectou a consulta reaproveitada ao modelo e sincronizou a resposta com a pesquisa do copiloto. Duas respostas da rodada concluída custaram US$ 0,000119. Uma repetição anterior não recebeu a chamada no prazo; a rodada seguinte passou com página e API HTTP 200. Não foi feita garantia de disponibilidade nem validação em celular físico.

Deploy pelo grupo: [Docker Compose / Dokploy](../DEPLOY-DOCKER.md). A instrução final do usuário foi não publicar; nenhum backend público foi criado. O chat usa linguagem de conta/investimentos sem repetir “dados sintéticos” a cada resposta; a indicação de ambiente de demonstração e a natureza fictícia dos dados permanecem documentadas.

Último ajuste de atendimento: falta de resposta validada ou produto fora do escopo encaminha imediatamente com protocolo e contexto, sem oferecer explicação sem fonte. A rotina de horário continua aplicável. Exemplos foram movidos para a área opcional de testes, fora da tela principal; histórico e pesquisa permanecem disponíveis no caso do atendente.

## Correções posteriores à apresentação

Veja [VALIDACAO-CORRECOES.md](VALIDACAO-CORRECOES.md) para o diagnóstico de repetição, proteção de dados, fila, botões e verificações sem chamadas pagas. A execução local em apresentação não foi reiniciada nem atualizada automaticamente; aplicar este commit exige reiniciar a API e carregar a interface atualizada em momento coordenado. Os 34 E2E citados acima pertencem à versão anterior do fluxo; não são validação deste novo estado.
