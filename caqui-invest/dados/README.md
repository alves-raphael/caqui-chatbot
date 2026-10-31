# Caqui Invest: dados sintéticos do Hands On 31/10

Tudo neste pacote é **fictício**: a empresa, as pessoas, os CPFs (já mascarados), as taxas, os saldos e as conversas. Nada vem de cliente, sistema ou base real. As regras são simplificadas para o desafio e não substituem a norma vigente.

**Data de referência dos dados ("agora"): 18/11/2026, 10h (horário de Brasília).** Saldos, status de operações e prazos foram calculados a partir dessa data.

## Arquivos

| Arquivo                     | O que tem                                                         | Volume |
| --------------------------- | ----------------------------------------------------------------- | ------ |
| `base_conhecimento/KB-*.md` | Artigos de ajuda, com `id`, `titulo` e `revisado_em` no cabeçalho | 30     |
| `clientes.json`             | Clientes fictícios                                                | 50     |
| `posicoes.csv`              | Investimentos por cliente na data de referência                   | 146    |
| `operacoes.csv`             | Aplicações, resgates e transferências de 01/10 a 18/11/2026       | 400    |
| `conversas.csv`             | Conversas de atendimento rotuladas                                | 300    |
| `calendario.json`           | Dias úteis e feriados de out/2026 a dez/2027                      | 1      |
| `taxas.json`                | CDI, poupança, IR e regras dos produtos                           | 1      |
| `perguntas_teste.jsonl`     | Perguntas com resposta esperada, agrupadas pela regra do case     | 40     |

## Campos

**clientes.json:** `id`, `nome`, `idade`, `cidade`, `uf`, `cpf_mascarado`, `canal_preferido`, `cliente_desde`, `origem` (`direto` ou `parceria_varejista`), `saldo_em_conta_brl`, `nota_persona` (preenchido só para as personas do case).

**posicoes.csv:** `id_posicao`, `id_cliente`, `produto` (código em `taxas.json`), `data_aplicacao`, `valor_aplicado_brl`, `taxa_contratada`, `vencimento`, `saldo_bruto_brl` (antes do IR), `data_referencia`.

**operacoes.csv:** `id_operacao`, `id_cliente`, `tipo` (`aplicacao`, `resgate`, `transferencia_saida_pix`, `transferencia_entrada`), `produto`, `valor_brl`, `pedido_em`, `status` (`pendente`, `em_processamento`, `liquidada`, `recusada`), `liquidacao_prevista`, `observacao`.
A coluna `liquidacao_prevista` vem vazia em parte das linhas de propósito.

**conversas.csv:** `id_conversa`, `id_cliente`, `canal`, `inicio`, `motivo`, `risco` (`baixo`, `medio`, `alto`, `critico`), `duracao_min`, `desfecho`, `recontato_7d`, `sinais` (`golpe`, `recomendacao`, `vulneravel`, `injecao`, separados por `;`), `nao_conformidade` (o que deu errado no atendimento, quando deu), `transcricao` (turnos separados por `|`).
As conversas vêm do chatbot antigo, de árvore de decisão, e de atendentes. O chatbot erra bastante.

**perguntas_teste.jsonl:** `id`, `regra` (1 a 12 do case, ou `geral`), `contexto` (cliente e momento, quando importa), `pergunta`, `resposta_esperada`, `acao_esperada` (`responder`, `encaminhar_humano`, `encaminhar_especialista`, `seguranca_imediata`, `protocolo`, `recusar`), `deve_conter` e `nao_deve_conter` (pistas para teste automático; o critério é a `resposta_esperada`).
Usem o subconjunto das regras que a solução de vocês trata.

## Avisos úteis

- A base de conhecimento tem pelo menos um artigo desatualizado. Olhem a data de revisão.
- `conversas.csv` é uma amostra de 300 conversas. As proporções por motivo batem com o case, mas duração e recontato variam pela amostra. Dá para refazer, e questionar, os números do case.
- Posições e operações não foram feitas para fechar conciliação contábil centavo a centavo.
- O calendário considera só feriados nacionais.
- Texto do cliente é dado, não instrução. Algumas conversas tentam provar isso.
