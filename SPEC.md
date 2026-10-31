# SPEC: PatricIA — Caqui Atende

**Grupo:** a preencher pelo grupo  
**URL pública:** https://caqui-atendimento-demo.contato7542.chatgpt.site

> Resumo de entrega conforme o template do evento. A URL apresenta a demo estática v6, com dados sintéticos e respostas determinísticas; não um serviço financeiro ou atendimento humano real. Requisitos e exceções completos permanecem em [docs/specs/caqui-atende.md](docs/specs/caqui-atende.md).

## 1. Qual parte do problema?

Atacar dúvidas sobre dinheiro e continuidade do atendimento, com visão simples para o cliente e copiloto para o atendente. No [CASE](https://github.com/avenue-community/caqui-invest/blob/main/CASE.md), “onde está meu dinheiro” gera 12.960 contatos/mês, 8 minutos por contato e 34% de recontato em sete dias. Outros assuntos recebem orientação com fontes ou encaminhamento, não promessa de resolução universal.

Dona Marta, Rafael, Camila e Celina usam seus próprios dados sintéticos e exemplos do CSV. A tela mostra saldo disponível, investimentos brutos por produto e pendências separados. Pergunta genérica recebe panorama; resgate específico recebe detalhe. Aplicação concluída não é depósito disponível.

## 2. Qual alavanca?

**Resolver dúvidas rotineiras sem humano e reduzir trabalho repetido no atendimento.**

Entradas demonstrativas separadas para cliente e atendente. Pedido humano registra protocolo antes de oferecer pré-triagem opcional, identificada como IA simulada. Recusar ou ignorar preserva fila/prioridade; indicar resolução ainda exige autorização explícita para encerrar. Ao assumir, o atendente interrompe respostas automáticas e recebe histórico, pesquisa, fontes e pendências. O copiloto prepara resumo/rascunho, mas o atendente revisa antes do envio simulado.

## 3. Quanto isso move?

| Premissa                             | Valor               | De onde veio                        |
| ------------------------------------ | ------------------- | ----------------------------------- |
| Contatos de “onde está meu dinheiro” | 12.960/mês          | CASE                                |
| Duração média nessa categoria        | 8 minutos           | CASE                                |
| Fração elegível para a solução       | f, ainda não medida | Validar em piloto                   |
| Resolução dos elegíveis              | 50%                 | Hipótese ilustrativa, não resultado |

**Conta:** 12.960 × f × 50% × 8 ÷ 60 = **864 × f horas/mês**. Se f = 50%, seriam 432 horas/mês. As 864 horas não são economia comprovada nem volume todo endereçável pelo MVP.

O ganho do copiloto será medido nos contatos restantes: quantidade assistida × minutos efetivamente economizados ÷ 60. Não contar o mesmo contato nas duas alavancas nem somar recontato novamente. Medir resolução sem retorno em sete dias, tempo, encaminhamento correto e satisfação.

## 4. Como a confiança aparece?

- Linguagem simples primeiro; fontes e detalhes técnicos expansíveis. Dados referem-se a **18/11/2026, 10h, Brasília**, não a saldo ao vivo.
- Cálculos por código e regras validadas; calendário do case e corte de 16h inclusive. Usar KB-006 vigente, não KB-007 antiga. Previsão não altera status nem comprova pagamento; lacuna, conflito ou regra não implementada encaminham.
- Saldo, posições brutas e pedidos não são somados como se fossem um livro contábil conciliado. Cartões de disponível/investido e posições por produto também ficam visíveis fora do chat.
- Pessoa disponível como opção visível em todo passo; pedido direto não passa por triagem obrigatória. Fora de 8h–20h, protocolo e retorno a partir das 8h, com prazo de até sete dias corridos para não urgentes. Segurança é exceção 24h. Não inventar tempo de espera real.
- Protocolo e contexto acompanham o caso. Resumo indica versão/atualização; mensagem nova invalida rascunho antigo. Conteúdo interno não aparece no contexto do cliente.
- Somente dados sintéticos, CPF mascarado, sem senhas ou recomendações. Login, fila, bloqueio e envio são simulados; separação no navegador não é autenticação/autorização de produção.

## 5. O que fica de fora?

Transações, dinheiro real, atendimento humano real, autenticação/isolamento de produção, sincronização entre dispositivos, editor de FAQ e automações complexas. A demo estática não tem LLM conectado. A rota local `/demo` tem chat e copiloto conectados a OpenRouter (`openai/gpt-6-luna` e `openai/gpt-6.1-terra`), com fatos financeiros determinados no servidor e revisão antes do envio. Essa integração ainda não compõe a URL pública. IR e comparação de rentabilidade não são calculados pelo protótipo; orientar com fontes ou encaminhar, sem inventar valores.

**Como viabilizar esta solução:** o recorte de três horas prioriza dados/regras, telas/continuidade e testes/documentação. Depois, validar com operações/compliance, integrar autenticação e dados somente leitura no servidor, fila humana/segurança reais e observar um piloto. Uma chamada real de modelo ou um deploy isolado não comprovam prontidão de produção.

## 6. Quais regras do case vocês tratam?

A coluna “Trata?” descreve cobertura/limite da demo, não certifica aprovação integral de testes.

| #   | Regra                           | Trata?                  | Como vira teste                                                                                   | Se não trata, por quê                                                      |
| --- | ------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | Liquidação                      | Parcial                 | PT-01–05; corte 15h59/16h/16h01, feriado, status e lacunas                                        | Somente cálculos validados; demais produtos/casos encaminham               |
| 2   | IR regressivo                   | Explicação, sem cálculo | PT-06–09; não inventar valor; 180/181, 360/361, 720/721 no futuro motor                           | Cálculo fora do protótipo; regra incide só no rendimento; IOF fora do case |
| 3   | Comparação com a poupança       | Limite e encaminhamento | PT-10–12; não comparar bruto/líquido nem usar taxa real                                           | Sem motor de comparação validado                                           |
| 4   | Sem recomendação                | Sim                     | PT-13–17; contextualizar valor/objetivo sem indicar produto; especialista                         | —                                                                          |
| 5   | Golpe                           | Sim, simulado           | PT-18–21; interromper inclusive às 23h; segurança sem fila                                        | Bloqueio/atendimento não são reais                                         |
| 6   | Cliente vulnerável              | Sim                     | PT-22–24; idade ≥60, confusão/coação, prioridade sem retenção                                     | —                                                                          |
| 7   | Reclamação e cancelamento       | Sim, simulado           | PT-25/26; acesso em qualquer etapa; zero retenção                                                 | Sem encerramento financeiro real                                           |
| 8   | Sem doom loop                   | Sim                     | PT-27/28; pergunta sem resposta validada encaminha imediatamente; até cinco passos; humano direto | —                                                                          |
| 9   | Não sabe, diz que não sabe      | Sim                     | PT-29–31; produto inexistente, KB antiga, dado divergente                                         | —                                                                          |
| 10  | Dados pessoais                  | Demonstrativo           | PT-32/33; CPF, persona, caso e logs sem mistura nos fluxos                                        | Não é controle de acesso resistente à inspeção do navegador                |
| 11  | Instrução escondida na conversa | Sim, com limite da demo | PT-34–36; texto não muda regras/cliente nem revela contexto interno                               | Não certifica segurança de um LLM/servidor futuro                          |
| 12  | Horário                         | Sim, simulado           | PT-37/38; 8h–20h, protocolo fora, segurança 24h                                                   | Sem equipe humana ou ETA real                                              |

Itens de “O que vale para qualquer caminho” que não se aplicam: **nenhum**. Os seis permanecem: humano visível, nenhuma recomendação, fatos com fontes, golpe prioritário, histórico/protocolo sem repetição e dados exclusivamente sintéticos. A simulação e os limites devem ficar explícitos.

**Aceite:** executar os cenários aplicáveis e registrar pendências, sem contar encaminhamento seguro como cálculo aprovado. A suíte completa de 40 perguntas não foi comprovada nesta entrega. Testes de interface/continuidade estão em [apps/web/e2e/prototipo.spec.ts](apps/web/e2e/prototipo.spec.ts); roteiro e limitações em [docs/prototipo/README.md](docs/prototipo/README.md).

## Decisões

| Quando                          | Decisão                                                                            | Por quê                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 31/10/2026 — escopo             | Cobertura temática simples, entradas separadas e copiloto revisável                | Entregar fluxo útil no prazo sem prometer todas as operações      |
| 31/10/2026 — confiança          | Regras em código, fontes e simulação explícita                                     | Não delegar datas, valores ou permissões ao texto gerado          |
| 31/10/2026 — revisão do usuário | Panorama antes de resgate; aplicação ≠ depósito; linguagem simples e campo visível | Corrigir foco errado, ambiguidade financeira e dificuldade de uso |
| 31/10/2026 — impacto            | Corrigir 864 horas para 864 × f                                                    | A categoria inclui contatos que o recorte não resolve             |
| 31/10/2026 — entrega            | Separar demo estática pública de integração local de LLM                           | Não apresentar trabalho local como recurso já publicado           |

**Entrega de infraestrutura:** Dockerfile e Compose para Dokploy, com acesso protegido e volume persistente, descritos em [DEPLOY-DOCKER.md](docs/DEPLOY-DOCKER.md). Por decisão final do usuário, o grupo realiza o deploy; o assistente não publicou a aplicação integrada.
