#!/usr/bin/env python3
"""Baixa os sprites (normal e shiny) de todos os Pokemon do banco para
static/sprites/, para o app funcionar offline. Sem dependencias externas.

Roda de novo quando quiser (por exemplo depois de adicionar Pokemon novos):
pula o que ja foi baixado.

    python baixar_sprites.py
"""
import os
import sqlite3
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

RAIZ = os.path.dirname(os.path.abspath(__file__))
BANCO = os.path.join(RAIZ, "pokedex.db")
PASTA = os.path.join(RAIZ, "static", "sprites")
CONJUNTOS = {
    "normal": "https://img.pokemondb.net/sprites/home/normal/2x/{}.jpg",
    "shiny": "https://img.pokemondb.net/sprites/home/shiny/2x/{}.jpg",
}
PARALELO = 8


def baixar_um(tarefa):
    slug, tipo, url, destino = tarefa
    if os.path.exists(destino) and os.path.getsize(destino) > 0:
        return ("pulado", slug, tipo, None)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            dados = resp.read()
        with open(destino, "wb") as f:
            f.write(dados)
        return ("baixado", slug, tipo, None)
    except Exception as e:
        return ("falhou", slug, tipo, str(e))


def baixar_lote(nome, tarefas):
    """tarefas: lista de (chave, tipo, url, destino)"""
    total = len(tarefas)
    baixado = pulado = falhou = 0
    falhas = []

    print(f"{nome}: {total} sprites...")
    with ThreadPoolExecutor(max_workers=PARALELO) as ex:
        for i, r in enumerate(ex.map(baixar_um, tarefas), 1):
            status, slug, tipo, erro = r
            if status == "baixado":
                baixado += 1
            elif status == "pulado":
                pulado += 1
            else:
                falhou += 1
                falhas.append(f"{tipo}/{slug}: {erro}")
            if i % 200 == 0 or i == total:
                print(f"  {i}/{total}  (baixados {baixado}, ja tinha {pulado}, falhas {falhou})")

    print(f"  pronto: {baixado} baixados, {pulado} ja existiam, {falhou} falharam.")
    return falhas


def main():
    if not os.path.exists(BANCO):
        sys.exit(f"banco nao encontrado: {BANCO}")
    con = sqlite3.connect(BANCO)
    slugs = [r[0] for r in con.execute("SELECT slug FROM pokemon ORDER BY num_nacional")]
    for tipo in CONJUNTOS:
        os.makedirs(os.path.join(PASTA, tipo), exist_ok=True)

    tarefas = [
        (slug, tipo, molde.format(slug), os.path.join(PASTA, tipo, f"{slug}.jpg"))
        for slug in slugs
        for tipo, molde in CONJUNTOS.items()
    ]
    falhas = baixar_lote("Pokemon (normal + shiny)", tarefas)

    # Mega Evolucao / Gigantamax: nome do arquivo (com extensao) e URL de origem
    # ja ficam salvos no banco, porque a fonte varia (pokemondb pra maioria, um
    # icone do Bulbapedia pras Megas novas da Legends: Z-A que a Pokemon HOME
    # ainda nao desenhou).
    especiais = con.execute(
        "SELECT slug, tipo, sprite, fonte_url FROM pokemon_forma_especial").fetchall()
    tarefas_especiais = [
        (f"{slug}/{sprite}", tipo, url, os.path.join(PASTA, "normal", sprite))
        for slug, tipo, sprite, url in especiais
    ]
    falhas += baixar_lote("Mega Evolução / Gigantamax", tarefas_especiais)

    if falhas:
        print("\nFalhas (o app vai tentar mostrar mesmo assim, mas a imagem vai faltar):")
        for f in falhas:
            print(" -", f)


if __name__ == "__main__":
    main()
