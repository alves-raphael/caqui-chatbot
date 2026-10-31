# caqui-chatbot

Monorepo Node.js (Yarn workspaces) pensado para desenvolvimento com agentes de IA: API Fastify + Zod + Drizzle (**SQLite**) + Better Auth, web Vite/React/shadcn, Playwright e Docker Compose.

## Vale mencionar

- **SQLite** (`better-sqlite3`): o banco é o arquivo `data/caqui-chatbot.db`, montado nos containers. Não há serviço de banco. Os containers rodam como uid 1000 (`node`); se seu uid no host for outro, ajuste o `Dockerfile.dev`, senão o arquivo fica com dono errado.
- Zod é a fonte única de validação, tipos e OpenAPI. `apps/api/openapi.json` é gerado e versionado (`yarn api:openapi`); `yarn verify` falha se estiver desatualizado.
- Specs em `docs/specs/` e skills de projeto em `.claude/skills/` (`implement-spec`, `new-endpoint`).

## Protótipo de atendimento

O [protótipo editável em HTML](docs/prototipo/README.md) reúne as visões Cliente e Atendente e pode ser aberto diretamente no navegador, sem iniciar a aplicação. Os dados e as ações são simulados.

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
