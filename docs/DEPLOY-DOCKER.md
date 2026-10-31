# Deploy da demonstração com Docker

O grupo executa o deploy. Este PR não publica imagem, não cria hospedagem e não configura segredos remotos. O HTML no site estático permanece uma entrega separada.

## Preparar e iniciar

```bash
docker build -t caqui-patricia:demo .
cp .env.docker.example .env.docker
chmod 600 .env.docker
# Preencha os segredos e a origem no arquivo local antes de continuar.
docker volume create caqui-patricia-data
docker run -d --name caqui-patricia \
  --restart unless-stopped \
  --env-file .env.docker \
  -p 127.0.0.1:8080:3000 \
  -v caqui-patricia-data:/app/data \
  caqui-patricia:demo
curl --fail http://localhost:8080/health
```

Abra `http://localhost:8080/demo`. O navegador pede usuário **demo** e a senha escolhida em `CAQUI_DEMO_ACCESS_CODE`. O build serve React e API pela mesma origem; o cliente usa `/api`. O campo de persona cria uma sessão demonstrativa com conta e papel fixos. Isso não substitui autenticação de clientes reais.

Para hospedar, o grupo deve colocar um proxy HTTPS diante da porta 3000 do container, preservar os cabeçalhos `Authorization`, `Origin` e `X-Demo-Session`, e definir `WEB_URL` e `BETTER_AUTH_URL` com a origem HTTPS exata. Não expor HTTP Basic sem HTTPS fora do computador. O código não inicia túnel nem contrata provedor. `/health` é público; aplicação, assets e API exigem acesso. As rotas Better Auth, `/me` e documentação interna não são publicadas nesse modo.

## Configuração

| Variável                      | Uso                                                                                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENROUTER_API_KEY`          | Chave fornecida ao container em execução, somente no servidor. Não usar `VITE_*`, `ARG`, `ENV` no Dockerfile, HTML ou Git.                                  |
| `CAQUI_DEMO_ACCESS_CODE`      | Senha aleatória de acesso à demonstração; mínimo 16 caracteres. Compartilhar separadamente da URL, não no PR.                                               |
| `BETTER_AUTH_SECRET`          | Segredo aleatório com ao menos 32 caracteres exigido pela configuração existente; endpoints de autenticação ficam desativados neste modo.                   |
| `WEB_URL`, `BETTER_AUTH_URL`  | Origem pública exata, sem caminho. `WEB_URL` também restringe POSTs do navegador.                                                                           |
| `CAQUI_LIVE_AI_ENABLED`       | Ativar somente após preencher a chave e conferir o orçamento. Sem ativação, respostas locais ficam identificadas.                                           |
| `CAQUI_TEST_BUDGET_USD`       | Teto de reserva, no máximo US$ 5. Falha/timeout não devolve reserva e não gera retry automático.                                                            |
| `CAQUI_PREVIOUS_RESERVED_USD` | Reserva inicial para consumo em outras instâncias. O exemplo reserva US$ 3 para todo o máximo da instância local desta tarefa, mesmo sem gastar esse valor. |
| `CAQUI_LEDGER_PATH`           | Ledger de custo em `/app/data`, persistente entre reinícios. Não contém chave ou mensagens.                                                                 |
| `DATABASE_PATH`               | SQLite em `/app/data`. Histórico, fila e protocolos desta demo ainda ficam no navegador; o volume não sincroniza atendimentos entre aparelhos.              |
| `CAQUI_PUBLIC_DEMO`           | Liga o modo de demonstração protegido; exige senha e caminho do ledger.                                                                                     |

Os modelos permitidos são `openai/gpt-6-luna` e `openai/gpt-6.1-terra`, selecionados pela interface. IDs arbitrários não são aceitos. A chave nunca é enviada ao browser. Dados, produtos, regras e operações continuam sintéticos; o modelo explica e o servidor preserva fatos financeiros.

## Limites e continuidade

Usar **uma réplica e um processo** com o mesmo volume. Há no máximo 100 tentativas por ledger, reserva conservadora de US$ 0,03 por tentativa, 512 tokens de saída, timeout de 15 segundos e 10 consultas por minuto por sessão. Uma sessão só admite uma chamada em andamento. O exemplo reserva US$ 3 para a instância local e deixa até 66 tentativas adicionais (US$ 1,98 reservados) nesta instância: a soma conservadora permanece abaixo dos US$ 5 autorizados para a tarefa.

Não reduzir a reserva anterior, criar réplicas, apagar/copiar/reinicializar o ledger nem trocar por volume vazio para contornar o teto. Antes de outro deploy, encerrar a instância anterior e transportar seu volume/ledger; mudança de orçamento precisa de nova decisão do responsável. O app mede custo do modelo, não custo de infraestrutura.

Sessões expiram em 30 minutos e não sobrevivem ao reinício do processo. Se necessário, sair e entrar novamente na demonstração. O SQLite pertence ao usuário `node` do container; para bind mount, ajustar o diretório ao UID 1000. Volume nomeado evita a configuração manual inicial de permissões.

```bash
docker inspect --format '{{.State.Health.Status}}' caqui-patricia
docker logs --tail 30 caqui-patricia
docker stop caqui-patricia
# Remove apenas o container; preservar caqui-patricia-data.
docker rm caqui-patricia
```

Não registrar ou colar variáveis de ambiente completas em logs, issues ou no PR. Uma falha do provedor preserva resposta local identificada; isso não deve ser apresentado como uma resposta de modelo. Recomendações, fraude e permissões seguem regras determinísticas. O copiloto continua exigindo revisão antes do envio simulado.

## Dokploy / Docker Compose

Criar um projeto de **Docker Compose** no Dokploy, conectar o repositório e a branch/commit revisado, e selecionar `compose.prod.yaml`. Configurar as variáveis na área de Environment do serviço; o arquivo `.env.docker` não é enviado ao Git. Associar um domínio HTTPS ao serviço `patricia`, porta interna **3000**. O Compose usa `expose`, sem abrir porta do host; o proxy do Dokploy faz o acesso pelo domínio.

Manter uma única réplica. O volume nomeado `patricia-data` guarda SQLite e o ledger; preservar o mesmo projeto/volume em novos deploys. O healthcheck vem do Dockerfile e usa `/health`, sem autenticação. CPU/memória e cobrança são configuradas pelo grupo no host; este repositório não cria plano nem orçamento de infraestrutura.

Validação local da configuração (não imprime segredos):

```bash
docker compose --env-file .env.docker -f compose.prod.yaml config --quiet
```

Para usar esse Compose diretamente em um servidor já administrado pelo grupo:

```bash
docker compose --env-file .env.docker -f compose.prod.yaml up -d --build
docker compose --env-file .env.docker -f compose.prod.yaml ps
```

Só executar a publicação após configurar o proxy HTTPS, origem, segredos e persistência. Não usar `docker compose down -v`, pois isso apagaria o ledger que mantém o teto entre reinícios. As instruções foram preparadas para o grupo; nenhum deploy Dokploy foi executado pelo assistente.

## Verificação realizada nesta entrega

A imagem foi construída localmente e o Compose passou em `config --quiet`. Em container ligado somente a `127.0.0.1`, `/health` respondeu 200; `/demo` exigiu acesso (401 sem senha, 200 com senha); a interface compilada chamou a API na mesma origem e recebeu fallback com os fatos corretos, sem erros JavaScript. Foram conferidos papel incompatível (403), campo extra de outra conta (400), origem externa (403), ausência dos endpoints de autenticação e `/me` (404) e ausência da chave/senha no bundle. SQLite e um marcador no volume sobreviveram ao reinício e à substituição do container.

Esse teste Docker usou senha temporária e **nenhuma chave OpenRouter**. Não houve chamada paga no container. As respostas reais Luna/Terra foram verificadas no backend local descrito no roteiro. Nenhuma imagem foi enviada a registry nem houve deploy no Dokploy ou outro provedor. O grupo ainda precisa conferir HTTPS, domínio, secrets e o primeiro acesso no seu ambiente.
