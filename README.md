# caqui-chatbot

**URL pública da demonstração:** [Abrir Caqui Atende](https://caqui-atendimento-demo.contato7542.chatgpt.site)

A URL apresenta a **demo estática v6**: JavaScript, templates, regras determinísticas e dados sintéticos. Não há LLM, backend, autenticação real, atendente real ou movimentação financeira nessa versão. A integração OpenRouter foi exercitada localmente, mas ainda não está publicada nesse endereço. O monorepo e o HTML demonstrativo são entregas distintas.

[Resumo do evento — SPEC.md](SPEC.md) · [Requisitos detalhados](docs/specs/caqui-atende.md) · [Abrir/editar o HTML e roteiro](docs/prototipo/README.md)

Monorepo Node.js (Yarn workspaces) pensado para desenvolvimento com agentes de IA: API Fastify + Zod + Drizzle (**SQLite**) + Better Auth, web Vite/React/shadcn, Playwright e Docker Compose.

## Vale mencionar

- **SQLite** (`better-sqlite3`): o banco é o arquivo `data/caqui-chatbot.db`, montado nos containers. Não há serviço de banco. Os containers rodam como uid 1000 (`node`); se seu uid no host for outro, ajuste o `Dockerfile.dev`, senão o arquivo fica com dono errado.
- Zod é a fonte única de validação, tipos e OpenAPI. `apps/api/openapi.json` é gerado e versionado (`yarn api:openapi`); `yarn verify` falha se estiver desatualizado.
- Specs em `docs/specs/` e skills de projeto em `.claude/skills/` (`implement-spec`, `new-endpoint`).

## Protótipo de atendimento

O [protótipo editável em HTML](docs/prototipo/README.md) reúne as visões Cliente e Atendente e pode ser aberto diretamente no navegador, sem iniciar a aplicação. Os dados e as ações são simulados.

A [demo local de PatricIA com OpenRouter](docs/prototipo/README.md#ia-conectada-no-computador-local) fica em http://localhost:5174/demo e conecta o chat e o copiloto ao backend Fastify. O HTML aberto diretamente continua offline.

## Requisitos

Node 24 (`.nvmrc`), Docker com Compose, corepack.

## Como rodar

```bash
yarn install && yarn setup   # idempotente
yarn status
```

| Serviço      | URL                        |
| ------------ | -------------------------- |
| web          | http://localhost:5174      |
| api          | http://localhost:3000      |
| OpenAPI docs | http://localhost:3000/docs |

Usuário de teste: `SEED_USER_EMAIL` / `SEED_USER_PASSWORD` do `.env.example`.

## Scripts principais

`yarn verify` (typecheck + lint + test + openapi), `yarn e2e [arquivo]`, `yarn db:generate|migrate|seed`, `yarn dev:logged` (modo híbrido, log em `.logs/dev.log`), `yarn format`.

## Como usamos IA

### Ferramentas

Um assistente de IA apoiou leitura do case, especificação, implementação, revisão de respostas, testes e preparação da demonstração. A consulta ao GitHub trouxe os dados sintéticos e artigos originais; a publicação do protótipo usou Sites. O HTML público responde por JavaScript e templates: “IA simulada” na interface não significa chamada a um modelo.

A rota local `/demo` usa Fastify e OpenRouter com os IDs `openai/gpt-6-luna` e `openai/gpt-6.1-terra`, testados com chamadas reais. A chave é herdada pelo processo do servidor. Esse backend ainda não está publicado na URL acima; configuração e limites estão no [roteiro](docs/prototipo/README.md#ia-conectada-no-computador-local).

### Harness

O Codex executou as alterações locais com as instruções do projeto em `CLAUDE.md`, as skills de endpoints e envio de PR, e ferramentas de terminal e navegador. Library trouxe o HTML e a SPEC; Sites manteve a publicação estática. Além dos pedidos em linguagem natural, o trabalho foi guiado pela [SPEC detalhada](docs/specs/caqui-atende.md), pelo [CASE e regras](https://github.com/avenue-community/caqui-invest/blob/main/CASE.md), pelos [CSV/JSON, artigos e calendário sintéticos](https://github.com/avenue-community/caqui-invest/blob/main/dados/README.md) e pelas [40 perguntas de referência](https://github.com/avenue-community/caqui-invest/blob/main/dados/perguntas_teste.jsonl).

O material reproduzível no projeto inclui [HTML editável e roteiro](docs/prototipo/README.md) e [testes Playwright do protótipo](apps/web/e2e/prototipo.spec.ts). Os comandos existentes são `yarn verify` e `yarn e2e prototipo`. A suíte verifica personas, fontes, consentimento, continuidade, revisão do copiloto, isolamento demonstrativo e layout.

### Verificado na mão

O usuário testou a interface e apontou problemas concretos: campo de mensagem fora da área visível, linguagem excessivamente técnica, resposta de “onde está meu dinheiro?” focada apenas no resgate e confusão entre a aplicação de R$ 20 mil de Marta e dinheiro disponível. Esse feedback orientou as correções de layout, panorama financeiro e linguagem.

As checagens automatizadas e de navegador conduzidas pelo assistente **não são revisão humana independente**. Houve validação local de fluxos, dados e viewports, com resultados descritos no roteiro e no PR; a integração local mais recente reportou 34 testes E2E, verificação e build aprovados. Isso não demonstra a suíte integral de 40 perguntas, teste em celular físico, auditoria completa de acessibilidade ou segurança de produção. CI deve ser conferida no commit da entrega, não inferida de um resultado anterior.

### Onde a IA errou

A primeira resposta genérica sobre dinheiro privilegiava um resgate em vez de mostrar o todo. O usuário percebeu a diferença. A correção passou a apresentar saldo disponível, todas as posições brutas e resgates pendentes em blocos separados, sem dupla contagem. O caso de Marta reforçou que uma aplicação “liquidada” significa investimento concluído, não depósito disponível; fontes e IDs ficaram expansíveis para manter a explicação simples.

Também corrigimos uma estimativa excessiva: 864 horas/mês pressupunha toda a categoria elegível. A SPEC agora explicita **864 × f**, com `f` ainda não medido. Esses ajustes viraram requisitos e cenários de teste, não apenas mudanças de redação.

Na checagem focada posterior, o [checker do case](caqui-invest/ferramentas/checar_respostas.py) aprovou 11/11 pistas em perguntas selecionadas. A revisão encontrou falhas reais no reconhecimento de suporte remoto suspeito e de pedidos de indicação; ambas foram corrigidas. [Respostas e limites da checagem](docs/prototipo/README.md#checagem-focada-com-o-script-do-case) ficam registrados. A suíte integral de 40 perguntas permanece não validada.
