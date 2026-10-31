# Protótipo Caqui Atende

Abra [caqui-prototipo.html](./caqui-prototipo.html) diretamente no navegador. O arquivo reúne HTML, CSS, JavaScript e dados sintéticos e pode ser editado sem instalação ou backend. Os links das fontes precisam de internet; a interface funciona offline com as fontes do sistema.

O protótipo tem entradas separadas para Cliente e Atendente, consulta com fontes, protocolo com histórico e copiloto com revisão antes do envio. É uma referência de interface para desenvolver a aplicação: respostas, bloqueio, encaminhamento e envio são simulados. Não há autenticação real, modelo de IA conectado, operação financeira ou mensagem externa.

## Roteiro de demonstração

1. Selecione Celina, Dona Marta, Rafael ou Camila e use “Entrar como cliente”. Os exemplos e as operações correspondem ao ID da persona nos dados do case.
2. Consulte um exemplo ou use “Falar com uma pessoa”. Use “Sair / trocar perfil” e “Entrar como atendente” para acessar a fila de Jonas.
3. Selecione um caso e confira cliente, histórico, resumo, pendências e rascunho do copiloto. Use “Assumir atendimento” para interromper a pré-triagem da IA e habilitar a revisão do envio simulado.
4. Simule uma nova mensagem: o rascunho fica desatualizado e exige atualização.
5. Atualize, revise o texto, marque a revisão e faça o envio simulado. Saia e entre como o cliente daquele caso para ver a resposta.

Para testar a orientação de investimentos, escreva “Quero investir R$ 50 mil pensando na aposentadoria. O que você recomenda?”. O assistente reconhece valor e objetivo e oferece explicação dos produtos ou encaminhamento simulado ao especialista, sem indicar um investimento. “Falar com uma pessoa” continua disponível; suspeita de golpe recebe prioridade de segurança.

A conversa e os painéis têm rolagem própria, mantendo o campo de mensagem e as opções de ajuda acessíveis em janelas baixas. No celular, “Conta e exemplos de teste” abre os dados da persona; na mesa de atendimento, os botões “Fila”, “Conversa” e “Copiloto” alternam o painel visível.

Para testar a pré-triagem, entre como Rafael e peça uma pessoa. O protocolo é registrado antes da oferta de ajuda opcional da IA. Recusar a consulta mantém o mesmo registro e prioridade. Aceitar permite consultar fontes enquanto aguarda; dizer que resolveu ainda exige confirmação para encerrar apenas aquele protocolo. Ao assumir o caso, Jonas recebe o histórico e a pesquisa, e a IA deixa de responder em paralelo. A fila e o atendimento são simulados, sem estimativa real de espera; golpe e prioridade por vulnerabilidade não passam pela consulta opcional comum.

Para explorar o panorama financeiro, entre como Marta e pergunte “Onde está meu dinheiro?”. O saldo em conta de R$ 1.250,00 aparece separado dos investimentos brutos de R$ 61.021,15: CDB de R$ 40.791,24 e LCI de R$ 20.229,91. O resgate de R$ 40.000,00 em processamento fica em outro bloco e não é somado aos saldos. “E os R$ 20 mil?” explica a aplicação concluída na LCI, sem tratá-la como depósito disponível. São dados fictícios com referência em 18/11/2026; as fontes podem ser expandidas para consulta.

Os protocolos ficam no `localStorage` desse navegador, separados pelo ID do cliente. “Reiniciar demonstração” apaga somente o estado da persona atual. O isolamento é de interface e contexto; qualquer pessoa com acesso ao navegador pode inspecionar os dados públicos fictícios no arquivo e no armazenamento. Use apenas dados de demonstração: login, isolamento e sanitização ilustrativos não substituem controles de segurança de produção.

## Origem e edição

Exportação do layout Caqui Atende, com dados sintéticos do case incluído neste repositório. A formatação foi ajustada ao Prettier do projeto; telas e comportamentos foram preservados. A [SPEC complementar](../specs/caqui-atende.md) registra requisitos propostos e critérios para o desenvolvimento, sem comprovar sua implementação.

Os testes em `apps/web/e2e/prototipo.spec.ts` verificam a abertura local, entradas separadas, personas, fontes, continuidade do atendimento, revisão do copiloto, consentimento da pré-triagem, interrupção da IA, panorama financeiro e layout em desktop e celular. Os cenários de rolagem cobrem 1165×600, 390×740, 390×440 e 580×375. Com o ambiente do projeto preparado, execute `yarn e2e prototipo`. Esses testes não comprovam autenticação no servidor, atendimento real ou comportamento de teclado virtual em aparelho físico.
