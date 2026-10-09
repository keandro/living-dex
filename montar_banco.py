#!/usr/bin/env python3
"""Cria o pokedex.db do zero a partir de dados/catalogo.sql.

Rode isso logo depois de clonar o repositório, antes de iniciar o servidor
pela primeira vez. Recria o catálogo inteiro (Pokémon, tipos, stats,
habilidades, Pokédex de cada jogo, Mega/Gigantamax etc.) com a tabela de
captura vazia — ou seja, progresso zerado, pronto pra começar a marcar.
"""
import sqlite3
import sys
from pathlib import Path

RAIZ = Path(__file__).parent
BANCO = RAIZ / "pokedex.db"
DUMP = RAIZ / "dados" / "catalogo.sql"


def main():
    if not DUMP.exists():
        print(f"Não achei {DUMP.relative_to(RAIZ)} — confira se o repositório foi clonado por completo.")
        sys.exit(1)

    if BANCO.exists():
        resposta = input(
            f"{BANCO.name} já existe. Apagar e recriar? Isso apaga qualquer progresso de "
            "captura salvo nele. [s/N] "
        )
        if resposta.strip().lower() != "s":
            print("Cancelado.")
            sys.exit(1)
        BANCO.unlink()
        for extra in (BANCO.with_suffix(".db-shm"), BANCO.with_suffix(".db-wal")):
            extra.unlink(missing_ok=True)

    con = sqlite3.connect(BANCO)
    con.executescript(DUMP.read_text(encoding="utf-8"))
    con.commit()
    con.close()
    print(f"{BANCO.name} criado a partir de {DUMP.relative_to(RAIZ)}.")


if __name__ == "__main__":
    main()
