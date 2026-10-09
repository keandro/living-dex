#!/usr/bin/env python3
"""Gera dados/catalogo.sql a partir do pokedex.db atual.

O dump NÃO inclui os dados da tabela `captura` (progresso de captura é pessoal,
não deve ir pro repositório) — só a estrutura dela, vazia. Rode este script de
novo sempre que o banco mudar (Pokédex nova, correção de dado etc.) pra manter
o dump versionado em dia; quem clonar o repositório usa `montar_banco.py` pra
recriar o pokedex.db a partir dele.
"""
import sqlite3
from pathlib import Path

RAIZ = Path(__file__).parent
ORIGEM = RAIZ / "pokedex.db"
DESTINO = RAIZ / "dados" / "catalogo.sql"


def main():
    con = sqlite3.connect(ORIGEM)
    linhas = [
        linha for linha in con.iterdump()
        if not linha.startswith('INSERT INTO "captura"')
        and not linha.startswith("INSERT INTO captura")
    ]
    con.close()

    DESTINO.parent.mkdir(exist_ok=True)
    DESTINO.write_text("\n".join(linhas) + "\n", encoding="utf-8")
    print(f"{DESTINO.relative_to(RAIZ)} gerado ({len(linhas)} linhas, sem dados de captura).")


if __name__ == "__main__":
    main()
