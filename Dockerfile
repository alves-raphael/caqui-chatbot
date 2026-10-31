FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ ca-certificates && rm -rf /var/lib/apt/lists/* && corepack enable
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN YARN_ENABLE_SCRIPTS=true HUSKY=0 yarn install --immutable
COPY . .
RUN VITE_API_URL=/api yarn build
ENV NODE_ENV=production CAQUI_PUBLIC_DEMO=true API_PORT=3000 DATABASE_PATH=/app/data/caqui-chatbot.db CAQUI_LEDGER_PATH=/app/data/openrouter-usage.jsonl
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["yarn", "workspace", "@caqui-chatbot/api", "exec", "tsx", "src/server.ts"]
