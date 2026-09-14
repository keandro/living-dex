#!/usr/bin/env python3
"""Living Dex — servidor local. Sem dependencias: python3 servidor.py"""
import json, os, re, sqlite3, sys, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

RAIZ = os.path.dirname(os.path.abspath(__file__))
BANCO = os.path.join(RAIZ, "pokedex.db")
PORTA = int(os.environ.get("PORTA", 8000))

local = threading.local()
escrita = threading.Lock()


def db():
    if not hasattr(local, "con"):
        local.con = sqlite3.connect(BANCO, check_same_thread=False)
        local.con.row_factory = sqlite3.Row
        local.con.execute("PRAGMA foreign_keys=ON")
    return local.con


def linhas(sql, *a):
    return [dict(r) for r in db().execute(sql, a)]


# --------------------------------------------------------------- consultas
def listar_pokedex():
    return linhas("""
        SELECT d.id, d.nome, d.jogo,
               count(e.slug)                                        AS total,
               count(c.slug)                                        AS capturados
        FROM pokedex d
        JOIN pokedex_entrada e ON e.pokedex_id = d.id
        LEFT JOIN captura c    ON c.slug = e.slug AND c.living_dex_id = d.living_dex_id
        GROUP BY d.id ORDER BY d.ordem""")


def entradas(pokedex_id):
    return linhas("""
        SELECT e.num_regional, p.slug, p.nome, p.forma, p.sprite,
               (SELECT group_concat(t.tipo, '/')
                  FROM pokemon_tipo t WHERE t.slug = p.slug ORDER BY t.ordem) AS tipos,
               (c.slug IS NOT NULL) AS capturado
        FROM pokedex_entrada e
        JOIN pokemon p      ON p.slug = e.slug
        JOIN pokedex d      ON d.id = e.pokedex_id
        LEFT JOIN captura c ON c.slug = e.slug AND c.living_dex_id = d.living_dex_id
        WHERE e.pokedex_id = ?
        ORDER BY e.num_regional""", pokedex_id)


def detalhe(living_dex_id, slug):
    p = linhas("SELECT * FROM pokemon WHERE slug = ?", slug)
    if not p:
        return None
    p = p[0]
    p["tipos"] = [r["tipo"] for r in linhas(
        "SELECT tipo FROM pokemon_tipo WHERE slug = ? ORDER BY ordem", slug)]
    p["stats"] = {r["stat"]: r["valor"] for r in linhas(
        "SELECT stat, valor FROM pokemon_stat WHERE slug = ?", slug)}
    p["habilidades"] = linhas(
        "SELECT habilidade, oculta FROM pokemon_habilidade WHERE slug = ? ORDER BY ordem", slug)
    p["grupos_ovo"] = [r["grupo"] for r in linhas(
        "SELECT grupo FROM pokemon_grupo_ovo WHERE slug = ? ORDER BY grupo", slug)]
    p["capturado"] = bool(linhas(
        "SELECT 1 FROM captura WHERE slug = ? AND living_dex_id = ?", slug, living_dex_id))
    p["pokedex"] = linhas("""
        SELECT d.nome, e.num_regional
        FROM pokedex_entrada e JOIN pokedex d ON d.id = e.pokedex_id
        WHERE e.slug = ? ORDER BY d.ordem""", slug)
    p["evolucao"] = cadeia(slug)
    p["formas"] = linhas("""
        SELECT p2.slug, p2.nome, p2.forma, p2.sprite,
               (SELECT group_concat(t.tipo, '/')
                  FROM pokemon_tipo t WHERE t.slug = p2.slug ORDER BY t.ordem) AS tipos,
               (c.slug IS NOT NULL) AS capturado
        FROM pokemon p2
        LEFT JOIN captura c ON c.slug = p2.slug AND c.living_dex_id = ?
        WHERE p2.num_nacional = ? AND p2.slug != ?
        ORDER BY p2.slug""", living_dex_id, p["num_nacional"], slug)
    p["especiais"] = linhas("""
        SELECT tipo, nome, sprite, tipo1, tipo2
        FROM pokemon_forma_especial WHERE slug = ? ORDER BY id""", slug)
    return p


def cadeia(slug):
    """sobe ate a raiz da linha evolutiva e devolve a arvore inteira"""
    raiz, visto = slug, set()
    while True:
        anterior = linhas("SELECT slug_de FROM evolucao WHERE slug_para = ?", raiz)
        if not anterior or anterior[0]["slug_de"] in visto:
            break
        visto.add(raiz)
        raiz = anterior[0]["slug_de"]

    def no(s):
        info = linhas("""SELECT p.slug, p.nome, p.sprite,
                         (SELECT group_concat(t.tipo,'/') FROM pokemon_tipo t
                           WHERE t.slug = p.slug ORDER BY t.ordem) AS tipos
                         FROM pokemon p WHERE p.slug = ?""", s)
        if not info:
            return None
        item = info[0]
        item["seguintes"] = []
        for r in linhas("SELECT slug_para, metodo FROM evolucao WHERE slug_de = ?", s):
            filho = no(r["slug_para"])
            if filho:
                filho["metodo"] = r["metodo"]
                item["seguintes"].append(filho)
        return item

    return no(raiz)


def buscar(termo, limite=30):
    return linhas("""
        SELECT p.slug, p.nome, p.forma, p.sprite, p.num_nacional
        FROM pokemon p WHERE p.nome LIKE ? OR p.slug LIKE ?
        ORDER BY p.num_nacional LIMIT ?""", f"%{termo}%", f"%{termo}%", limite)


def marcar(living_dex_id, slug, valor):
    with escrita:
        con = db()
        if valor:
            con.execute("INSERT OR IGNORE INTO captura (living_dex_id, slug) VALUES (?, ?)",
                        (living_dex_id, slug))
        else:
            con.execute("DELETE FROM captura WHERE living_dex_id = ? AND slug = ?",
                        (living_dex_id, slug))
        con.commit()
    return {"slug": slug, "capturado": bool(valor)}


# --------------------------------------------------------------- http
ROTAS = [
    (r"^/api/pokedex$",                      lambda m: listar_pokedex()),
    (r"^/api/pokedex/(\d+)$",                lambda m: entradas(int(m.group(1)))),
    (r"^/api/pokemon/(\d+)/([\w.-]+)$",      lambda m: detalhe(int(m.group(1)), m.group(2))),
    (r"^/api/busca/(.+)$",                   lambda m: buscar(m.group(1))),
    (r"^/api/capturas$",                     lambda m: linhas("SELECT living_dex_id, slug FROM captura")),
]


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=RAIZ, **kw)

    def log_message(self, fmt, *args):
        if args and isinstance(args[0], str) and "/api/" in args[0]:
            sys.stderr.write("%s\n" % (fmt % args))

    def end_headers(self):
        # arquivos estaticos (html/css/js/sprites) sempre revalidam com o servidor antes de usar
        # o cache do navegador — evita rodar JS/CSS desatualizado depois de uma mudanca no app
        if not self.path.split("?")[0].startswith("/api/"):
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def responder(self, dados, status=200):
        corpo = json.dumps(dados, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(corpo)

    def do_GET(self):
        caminho = self.path.split("?")[0]
        if caminho.startswith("/api/"):
            from urllib.parse import unquote
            caminho = unquote(caminho)
            for padrao, fn in ROTAS:
                m = re.match(padrao, caminho)
                if m:
                    dados = fn(m)
                    return self.responder(dados if dados is not None
                                          else {"erro": "nao encontrado"},
                                          200 if dados is not None else 404)
            return self.responder({"erro": "rota desconhecida"}, 404)
        return super().do_GET()

    def do_POST(self):
        m = re.match(r"^/api/captura/(\d+)/([\w.-]+)$", self.path)
        if m:
            return self.responder(marcar(int(m.group(1)), m.group(2), True))
        self.responder({"erro": "rota desconhecida"}, 404)

    def do_DELETE(self):
        m = re.match(r"^/api/captura/(\d+)/([\w.-]+)$", self.path)
        if m:
            return self.responder(marcar(int(m.group(1)), m.group(2), False))
        self.responder({"erro": "rota desconhecida"}, 404)


if __name__ == "__main__":
    if not os.path.exists(BANCO):
        sys.exit(f"banco nao encontrado: {BANCO}")
    total = sqlite3.connect(BANCO).execute("SELECT count(*) FROM pokemon").fetchone()[0]
    print(f"Living Dex — {total} Pokémon no banco")
    print(f"http://localhost:{PORTA}   (Ctrl+C para parar)")
    ThreadingHTTPServer(("0.0.0.0", PORTA), Handler).serve_forever()
