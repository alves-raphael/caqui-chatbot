# Protótipo Caqui Atende

Abra [caqui-prototipo.html](./caqui-prototipo.html) diretamente no navegador. O arquivo reúne HTML, CSS, JavaScript e dados sintéticos e pode ser editado sem instalação ou backend. Os links das fontes precisam de internet; a interface funciona offline com as fontes do sistema.

O protótipo tem entradas separadas para Cliente e Atendente, consulta com fontes, protocolo com histórico e copiloto com revisão antes do envio. É uma referência de interface para desenvolver a aplicação: respostas, bloqueio, encaminhamento e envio são simulados. Não há autenticação real, modelo de IA conectado, operação financeira ou mensagem externa.

## Roteiro de demonstração

1. Selecione Celina, Dona Marta, Rafael ou Camila e use “Entrar como cliente”. Os exemplos e as operações correspondem ao ID da persona nos dados do case.
2. Consulte um exemplo ou use “Falar com uma pessoa”. Use “Sair / trocar perfil” e “Entrar como atendente” para acessar a fila de Jonas.
3. Selecione um caso e confira cliente, histórico, resumo, pendências e rascunho do copiloto.
4. Simule uma nova mensagem: o rascunho fica desatualizado e exige atualização.
5. Atualize, revise o texto, marque a revisão e faça o envio simulado. Saia e entre como o cliente daquele caso para ver a resposta.

Para testar a orientação de investimentos, escreva “Quero investir R$ 50 mil pensando na aposentadoria. O que você recomenda?”. O assistente reconhece valor e objetivo e oferece explicação dos produtos ou encaminhamento simulado ao especialista, sem indicar um investimento. “Falar com uma pessoa” continua disponível; suspeita de golpe recebe prioridade de segurança.

Os protocolos ficam no `localStorage` desse navegador, separados pelo ID do cliente. “Reiniciar demonstração” apaga somente o estado da persona atual. O isolamento é de interface e contexto; qualquer pessoa com acesso ao navegador pode inspecionar os dados públicos fictícios no arquivo e no armazenamento. Use apenas dados de demonstração: login, isolamento e sanitização ilustrativos não substituem controles de segurança de produção.

## Origem e edição

Exportação do layout Caqui Atende, com dados sintéticos do case incluído neste repositório. A formatação foi ajustada ao Prettier do projeto; telas e comportamentos foram preservados. A [SPEC complementar](../specs/caqui-atende.md) registra requisitos propostos e critérios para o desenvolvimento, sem comprovar sua implementação.

Os testes em `apps/web/e2e/prototipo.spec.ts` verificam a abertura local, entradas separadas, personas, fontes, continuidade do atendimento, revisão do copiloto e layout em desktop e celular. Com o ambiente do projeto preparado, execute `yarn e2e prototipo`.
