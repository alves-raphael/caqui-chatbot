# Correções após os testes de uso — 31/10/2026

Estas verificações foram feitas pelo assistente em cópia isolada, sem reiniciar a aplicação aberta pelo usuário. Não são auditoria independente nem prova de segurança de produção. Nenhuma chamada paga foi feita nesta rodada; mocks usam apenas credenciais fictícias. A publicação estática não foi alterada.

## Repetição: causa reproduzida

Na versão `ccfc6a0`, as perguntas “Quando cai meu resgate do CDB?” e “Qual imposto incide nesse resgate?” retornaram o mesmo texto de OP-10005, em modo fallback. “O dinheiro no CDB tem garantia?” retornou o panorama financeiro. A busca de operações precedia a de impostos e a palavra “dinheiro” acionava o panorama antes do conceito de garantia. Isso foi reproduzido sem modelo; não é atribuído a um incidente observado do provedor. As três perguntas exatas usadas pelo usuário não foram fornecidas.

Agora os assuntos específicos vêm primeiro: operação autorizada, KB-010 e KB-013, respectivamente. Produto, valor e data explícitos restringem a busca; ausência de correspondência encaminha, sem substituir por outro pedido. Corrigido também o reconhecimento de “ação” dentro de “aplicação”. A memória por sessão guarda somente IDs de fontes consultadas, não instruções ou perguntas livres. Resposta igual sobre assunto diferente pode interromper a conversa; limite de etapas e falta de fonte encaminham sem retry pago.

## Regra final de atendimento

O pedido final do usuário substituiu a ajuda durante a fila: ajuda opcional acontece antes de encaminhar. Ao encaminhar, o protocolo preserva histórico/consultas e o compositor e a IA são bloqueados. A API recusa chat nos estados `queued` e `human` e descarta resposta concluída depois da mudança de estado. Assumir libera mensagens destinadas ao atendente, sem IA paralela. Segurança, reclamação e encerramento de conta continuam acessíveis.

O atendente tem campo próprio e botão **Enviar resposta**, sem depender de geração, revisão ou checkbox do copiloto. O copiloto é opcional: **Usar rascunho na conversa** copia texto editável e fontes verificadas; o envio explícito confirma a revisão. Rascunho transferido fica bloqueado se chegar mensagem nova; atualizar o rascunho ou editar como resposta manual permite continuar. Texto manual não recebe fontes inventadas. Envio é local e simulado.

O copiloto também oferece **Assumir este atendimento** no próprio painel, estado de geração, erro com alternativa manual e explicação para botão desabilitado. Troca de persona/caso durante uma operação assíncrona é revalidada antes de aplicar resultado. Reset cria outra geração de sessão e invalida transições/respostas antigas, sem apagar ledger ou orçamento.

## Segurança e limites

- Conta, papel, ações e operações são validados no servidor. Tokens de sessões diferentes da mesma persona não compartilham memória; não há gravação automática de instruções em KB.
- Artigos públicos selecionados têm SHA-256 fixado em `kb-integrity.json`. Alteração ou fonte ausente bloqueia a resposta e encaminha. Atualizar conteúdo exige revisão e atualização deliberada do manifesto. Conteúdo já verificado é mantido em cache.
- Histórico, resumo e pesquisa são dados não confiáveis. Para fatos financeiros, o modelo só escolhe uma introdução da lista fechada; os fatos são anexados pelo servidor. Para artigos, escolhe texto de trechos permitidos, validado por igualdade exata. Texto fora da lista, fonte desconhecida, HTML, link arbitrário ou instrução de exfiltração é recusado. A renderização escapa texto; ações e links de fontes vêm de listas conhecidas.
- Fraude tem prioridade mesmo em mensagem que pede outra conta; não há consulta da conta alheia. CPF com/sem pontuação ou com espaços e valores de senha/token são removidos antes de persistir, usar no modelo ou mostrar como mensagem. Não coletar segredos reais.
- Prioridade é determinística: segurança; vulnerabilidade ou pessoa com 60+; normal. Ordenação por prioridade e depois abertura real mais antiga; encerrados ficam depois. Abertura real é imutável e exibida em Brasília, separada do relógio financeiro do case. Legado sem data real é marcado como não registrado.

O login/persona é demonstrativo, não identidade bancária. Histórico e mensagens humanas ficam no navegador; não há sincronização entre dispositivos nem transporte humano persistente no servidor. O controle de envio manual é local, não uma autorização de produção. Não se afirma imunidade a injection/poisoning, cobertura de todas as formas de segredo ou das 40 perguntas. Mudanças no conteúdo das fontes, autenticação real, persistência multiusuário e infraestrutura precisam de revisão própria.

## Verificações executadas

- API em memória: três assuntos distintos; fraude com pedido de outra conta; formatos de CPF/senha; valores/datas/produtos incompatíveis; rejeição de “Seu dinheiro já caiu”; isolamento de sessões; ações/operações alheias; fila e tomada por papel errado; resposta tardia descartada.
- Casos adversariais com fetch falso: fonte alterada temporariamente e restaurada; falso SYSTEM em histórico/resumo; instrução persistente; saída com HTML, link arbitrário, instrução interna ou chave fictícia. Fonte modificada foi bloqueada; saída não autorizada virou fallback. Memória guardou fontes, sem o texto de envenenamento.
- Navegador com bundle React e Fastify em memória: perguntas distintas, atalhos por teclado, escolha explícita de operação própria, botão sem repetição, fila bloqueada, assumir, resposta humana e fontes preservadas.
- Celular 390×740: assumir no copiloto, rascunho vazio, falha de geração, escrever/enviar manualmente, copiar/editar/enviar rascunho e conferir na visão do cliente. Sem chamada de modelo no envio manual. Escalar segurança após assumir e Reset voltaram a funcionar.
- Fila com registros de teste: segurança antes de prioridade/normal, FIFO, encerrados depois, data BRT e indicação de legado sem data real. Nenhuma alteração em registros do usuário.
- Capturas desktop/mobile e fila inspecionadas localmente. Testes existentes afetados e viewports 1165×600, 390×740, 390×440 e 580×375 executados. `yarn verify` passou com 11 testes unitários, tipos, lint e OpenAPI atualizado; build passou, mantendo o aviso de bundle grande.

Os 34 E2E e chamadas reais Luna/Terra documentados anteriormente pertencem à entrega anterior. Esta rodada não repetiu chamadas reais nem a suíte completa do case. Docker/Compose já foram construídos/verificados na entrega anterior; não houve novo deploy, publicação de imagem, configuração de segredo remoto ou merge.
