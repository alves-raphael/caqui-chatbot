#!/usr/bin/env python3
"""Confere as respostas da solução contra dados/perguntas_teste.jsonl.

Entrada: um JSONL com uma linha por pergunta respondida:
    {"id": "PT-01", "resposta": "texto que a solução respondeu", "acao": "responder"}

O campo "acao" é opcional. Quando vem, é comparado com "acao_esperada".
As pistas (deve_conter / nao_deve_conter) são comparadas sem diferenciar
maiúsculas de minúsculas. Elas são pistas: o critério é a resposta_esperada.

Uso:
    python3 ferramentas/checar_respostas.py respostas.jsonl
    python3 ferramentas/checar_respostas.py respostas.jsonl --regras 1,4,5
"""

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

PERGUNTAS = Path(__file__).resolve().parent.parent / "dados" / "perguntas_teste.jsonl"


def ler_jsonl(caminho):
    linhas = []
    with open(caminho, encoding="utf-8") as f:
        for n, linha in enumerate(f, 1):
            if linha.strip():
                try:
                    linhas.append(json.loads(linha))
                except json.JSONDecodeError as e:
                    sys.exit(f"{caminho}:{n}: JSON inválido ({e})")
    return linhas


def checar(pergunta, resposta):
    """Devolve a lista de problemas encontrados (vazia quando passa)."""
    texto = (resposta.get("resposta") or "").lower()
    problemas = []
    for termo in pergunta.get("deve_conter", []):
        if termo.lower() not in texto:
            problemas.append(f"faltou: {termo!r}")
    for termo in pergunta.get("nao_deve_conter", []):
        if termo.lower() in texto:
            problemas.append(f"não devia conter: {termo!r}")
    acao = resposta.get("acao")
    if acao and acao != pergunta["acao_esperada"]:
        problemas.append(f"ação {acao!r}, esperada {pergunta['acao_esperada']!r}")
    return problemas


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("respostas", help="JSONL com id, resposta e (opcional) acao")
    parser.add_argument("--regras", help="regras a conferir, ex.: 1,4,5,geral (padrão: todas)")
    parser.add_argument("--perguntas", default=PERGUNTAS, help="caminho do perguntas_teste.jsonl")
    args = parser.parse_args()

    perguntas = ler_jsonl(args.perguntas)
    if args.regras:
        escolhidas = {r.strip() for r in args.regras.split(",")}
        perguntas = [p for p in perguntas if str(p["regra"]) in escolhidas]
    respostas = {r["id"]: r for r in ler_jsonl(args.respostas) if "id" in r}

    por_regra = defaultdict(lambda: [0, 0])
    sem_resposta = []
    for p in perguntas:
        regra = str(p["regra"])
        r = respostas.get(p["id"])
        if r is None:
            sem_resposta.append(p["id"])
            continue
        problemas = checar(p, r)
        por_regra[regra][1] += 1
        if problemas:
            print(f"FALHOU {p['id']} (regra {regra}): {p['pergunta']}")
            for problema in problemas:
                print(f"    {problema}")
            print(f"    esperado: {p['resposta_esperada']}")
        else:
            por_regra[regra][0] += 1

    print()
    print("Por regra (passou / respondidas):")
    for regra in sorted(por_regra, key=lambda x: (not x.isdigit(), int(x) if x.isdigit() else 0)):
        ok, total = por_regra[regra]
        print(f"  regra {regra:>5}: {ok}/{total}")
    if sem_resposta:
        print(f"\nSem resposta ({len(sem_resposta)}): {', '.join(sem_resposta)}")

    total_ok = sum(ok for ok, _ in por_regra.values())
    total = sum(t for _, t in por_regra.values())
    print(f"\nTotal: {total_ok}/{total} passaram nas pistas.")
    print("Lembrete: passar nas pistas não prova que a resposta está certa. Leiam as respostas.")
    sys.exit(0 if total and total_ok == total and not sem_resposta else 1)


if __name__ == "__main__":
    main()
