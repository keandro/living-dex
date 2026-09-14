# Living Dex — contexto do projeto

Cole isto no início da conversa (ou deixe o arquivo na raiz do projeto) para dar contexto
sobre o que já foi feito e por quê.

---

Estou construindo um rastreador de **living dex de Pokémon** para uso pessoal. Fale comigo em
português. Prefiro trabalhar em passos pequenos: um passo por vez, eu rodo no terminal e colo a
saída antes de seguir. Estou no **Windows**, então use `python` (não `python3`) e PowerShell nos
comandos. Quando o assunto for novo para mim, explique o conceito antes de mandar o código.

## O que é

Uma living dex é ter um exemplar de cada Pokémon guardado nas caixas do PC do jogo. O app mostra
as caixas (6 × 5 = 30 por caixa, igual ao jogo), marca quem já foi capturado e mostra os dados
completos de cada Pokémon num modal.

Começou como um HTML único com os dados embutidos. Foi reescrito como **banco SQLite + servidor
Python + front que só consome a API**, porque eu quero adicionar outras Pokédex depois (Johto,
Kanto etc.) sem duplicar Pokémon: os dados do Pokémon pertencem ao catálogo, e cada Pokédex é só
uma lista ordenada de referências.

## Arquivos

```
pokedex.db          banco SQLite (1085 Pokémon, ~900 KB)
servidor.py         servidor + API, só biblioteca padrão (http.server + sqlite3)
estilo.css          CSS compartilhado por todas as páginas (variáveis, sidebar, caixas, modal)
tema-preload.js     aplica o tema salvo antes da 1ª pintura, pra não dar flash — sem defer/async
comum.js            compartilhado: api() e o botão de tema (todas as páginas carregam)
livingdex.js        compartilhado: TIPO/CHART, montagem das caixas e o modal de detalhe —
                    exporta iniciarLivingDex(idsPokedex), quem chama é o JS de cada página
index.html + home.js              página inicial: lista as living dex com o progresso de cada uma
paldea.html + dex.js              Paldea + Kitakami + Blueberry — chama iniciarLivingDex([1,2,3])
legends-za.html + legends-za.js   Lumiose + Mega Dimension — chama iniciarLivingDex([4,5])
sword-shield.html + sword-shield.js   Galar + Isle of Armor + Crown Tundra — iniciarLivingDex([6,7,8])
baixar_sprites.py   baixa os sprites (normal + shiny) do pokemondb para sprites/, para uso offline
sprites/            sprites locais: sprites/normal/<slug>.jpg e sprites/shiny/<slug>.jpg
fonts/jost.woff2    fonte Jost (variável, pesos 300–600) baixada do Google Fonts, servida local
```

Rodar: `python servidor.py` e abrir `http://localhost:8000`.
Porta alternativa: `$env:PORTA=9000; python servidor.py`. Escuta em `0.0.0.0`, então dá para abrir
do celular na mesma rede pelo IP da máquina.

## Banco

```sql
pokemon(slug PK, num_nacional, nome, forma, especie, sprite, altura_m, peso_kg,
        taxa_captura, amizade_base, exp_base, taxa_genero, ciclos_ovo, geracao,
        lendario, mitico)
pokemon_tipo(slug, ordem, tipo)
pokemon_stat(slug, stat, valor)
pokemon_habilidade(slug, ordem, habilidade, oculta)
pokemon_grupo_ovo(slug, grupo)
evolucao(slug_de, slug_para, metodo)
pokedex(id, nome, jogo, ordem, living_dex_id)
pokedex_entrada(pokedex_id, num_regional, slug)
captura(living_dex_id + slug PK, marcado_em)
pokemon_forma_especial(id, slug, tipo['mega'|'gigantamax'], nome, sprite, tipo1, tipo2, fonte_url)
```

Conteúdo atual: 1025 espécies + 60 formas regionais = **1085 registros**; 553 evoluções;
oito Pokédex cadastradas, em três living dex:
- **Scarlet & Violet**: Paldea (400), Kitakami (99), Blueberry (165) — 664 entradas.
- **Legends: Z-A**: Lumiose (232, jogo base), Mega Dimension (132, DLC) — 364 entradas.
- **Sword & Shield**: Galar (400, jogo base), Isle of Armor (110, DLC), Crown Tundra (74, DLC)
  — 584 entradas.

Dentro de cada living dex os Pokémon não se repetem entre as Pokédex. Pra Scarlet & Violet e
Legends: Z-A isso já vinha pronto da fonte (pokemondb pré-filtra). Pra Sword & Shield **não**
vinha — as páginas de Isle of Armor/Crown Tundra do pokemondb listam de novo um monte de Pokémon
que já tavam na Pokédex base (ex.: Isle of Armor repete 101 dos 400 de Galar) — por isso tive que
filtrar na mão: cada entrada só entra na primeira Pokédex em que aparece (ordem: Galar → Isle of
Armor → Crown Tundra), renumerando a ordem regional depois de tirar as repetidas.

Além disso, **125 formas especiais** em `pokemon_forma_especial` (não são Pokédex, não contam
capturado nem entram nas caixas — são só informação extra mostrada no modal): 92 Mega Evoluções
(todas as clássicas de X/Y e ORAS, mais as novas exclusivas da Legends: Z-A) e 33 Gigantamax
(as 32 espécies conhecidas + Urshifu com as 2 formas de estilo).

### Convenções que precisam ser mantidas

- **`slug` é a chave de tudo**, inclusive da captura. Segue o padrão do pokemondb, que já separa
  formas: `wooper-paldean`, `tauros-paldean-combat`, `exeggutor-alolan`, `qwilfish-hisuian`.
  O mesmo slug serve de nome do arquivo de sprite.
- Marcar captura por slug é o que evita contar duas vezes o mesmo Pokémon em Pokédex diferentes.
- Tipos, stats, habilidades e grupos de ovo ficam no banco em **inglês, minúsculo**
  (`fire`, `special-attack`, `poison-point`, `water1`). A tradução para português é feita no
  front, nos mapas `TIPO`, `STATS` e `GRUPO_OVO` do `livingdex.js`.
- Nomes de Pokémon e de habilidades ficam em inglês — não existe tradução oficial, o pokemondb
  faz igual.
- `taxa_genero`: -1 é sem gênero; senão é o número de oitavos que são fêmeas (4 = 50/50).
- **Evolução de forma regional sempre liga forma com forma**, nunca a forma base. Ex.:
  `wooper-paldean → clodsire` (não `wooper → clodsire`), `meowth-galarian → perrserker`,
  `sneasel-hisuian → sneasler`. Quando a pré-evolução não tem forma própria (ex.: Exeggcute não
  vira "exeggcute-alolan"), o galho regional nasce direto da espécie base, em paralelo ao galho
  normal: `exeggcute → exeggutor` **e** `exeggcute → exeggutor-alolan`, `dartrix → decidueye` **e**
  `dartrix → decidueye-hisuian`, `pikachu → raichu` **e** `pikachu → raichu-alolan`. O
  `build_db.py`/CSVs originais tinham ligado todas essas ~40 evoluções à forma base errada (ou
  simplesmente não tinham a linha), o que fazia a cadeia evolutiva sumir ou mostrar species erradas
  no modal — já corrigido direto no `pokedex.db`, mas se reconstruir o banco do zero a partir dos
  CSVs, esse ponto tem que ser revisado nome a nome de novo.
- As **defesas de tipo não estão no banco** — são calculadas no `livingdex.js` a partir da constante
  `CHART` (tipo atacante → efetividade).
- Os sprites são locais, em `sprites/normal/<slug>.jpg` e `sprites/shiny/<slug>.jpg`, baixados do
  pokemondb (conjunto `home`, ícones do Pokémon HOME) pelo `baixar_sprites.py`. O `livingdex.js`
  (`sprite()`/`spriteShiny()`) só aponta pro caminho local, servido pelo próprio `servidor.py`
  — não depende mais de internet depois de baixado. Rodar `baixar_sprites.py` de novo pula o que
  já existe, então serve pra baixar só o que faltar (Pokémon novo, forma nova). O conjunto
  `scarlet-violet` do pokemondb só tem sprite normal, sem shiny, por isso não foi usado.
- **Mega Evolução / Gigantamax não são Pokémon separados** — não têm slug próprio, não entram em
  `pokedex_entrada` nem em captura, é só informação a mais no modal (seção "Mega Evolução" e
  "Gigantamax", do lado de "Outras formas"). Cada linha de `pokemon_forma_especial` guarda o
  `sprite` (nome do arquivo **com extensão**, porque a fonte varia) e o `fonte_url` de onde veio,
  pro `baixar_sprites.py` conseguir rebaixar do zero. A maioria vem do pokemondb (`.jpg`); as Megas
  novas da Z-A que a Pokémon HOME ainda não desenhou usam de fallback o ícone do próprio jogo via
  Bulbapedia (`.png`) — por isso essas ficam com uma qualidade de imagem visivelmente menor que o
  resto do app. `tipo1`/`tipo2` só é preenchido quando o tipo muda na transformação (ex.: Mega
  Charizard X vira Fogo/Dragão); quando é `NULL` o front usa o tipo normal do Pokémon.

## API

| rota | o que faz |
|---|---|
| `GET /api/pokedex` | Pokédex cadastradas com total e quantos capturados (já scoped por living dex) |
| `GET /api/pokedex/<id>` | entradas da Pokédex: número regional, slug, nome, forma, tipos, capturado |
| `GET /api/pokemon/<living_dex_id>/<slug>` | registro completo + cadeia evolutiva + em quais Pokédex aparece; `capturado` é só dessa living dex |
| `GET /api/busca/<termo>` | busca no catálogo inteiro, inclusive quem não está em Pokédex nenhuma |
| `POST /api/captura/<living_dex_id>/<slug>` | marca como capturado nessa living dex |
| `DELETE /api/captura/<living_dex_id>/<slug>` | desmarca nessa living dex |

A cadeia evolutiva sobe até a raiz da linha e devolve a árvore com ramos, para casos como Applin →
Appletun / Dipplin → Hydrapple / Flapple, e os métodos saem legíveis em português
("999 Moedas Gimmighoul", "Nível 25, de dia").

## De onde vieram os dados

Dos CSVs oficiais do projeto PokéAPI
(`https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/`): `pokemon`,
`pokemon_species`, `pokemon_types`, `pokemon_stats`, `pokemon_abilities`, `pokemon_egg_groups`,
`pokemon_evolution`, mais tabelas de apoio. Existe um `build_db.py` que gera o banco do zero a
partir desses CSVs, mas ele não está nesta pasta — se precisar regerar, peça para reconstruir.

A **ordem regional e os tipos de cada Pokédex** (não vêm nos CSVs da PokéAPI, que só têm o dex
nacional) foram conferidos no pokemondb, direto das páginas de cada jogo:
- Scarlet & Violet: `pokemondb.net/pokedex/game/scarlet-violet` (Paldea) + as páginas do Teal Mask
  e Indigo Disk pra Kitakami/Blueberry.
- Legends: Z-A: `pokemondb.net/pokedex/game/legends-z-a` (Lumiose, 232 entradas) e
  `.../legends-z-a/mega-dimension` (DLC Mega Dimension, 132 entradas — pago, adiciona Megas novas
  e tem Pokédex própria, listada como jogo separado dentro da mesma living dex "Legends: Z-A").
  As duas já vêm sem repetir Pokémon entre si.
- Sword & Shield: `pokemondb.net/pokedex/game/sword-shield` (Galar, 400) +
  `.../sword-shield/isle-of-armor` (211 antes de filtrar repetido) +
  `.../sword-shield/crown-tundra` (210 antes de filtrar repetido). Diferente da Z-A, essas páginas
  **repetem** Pokémon da Pokédex base — tive que deduplicar na mão (ver seção Banco).
Pra uma Pokédex nova (Johto, Kanto, Hisui…), o caminho é o mesmo: achar a página do jogo no
pokemondb, extrair número regional + slug + tipos na ordem que aparece, conferir que o slug já
existe no catálogo (senão precisa adicionar o Pokémon primeiro), **deduplicar contra as Pokédex já
cadastradas se a fonte não vier filtrada**, e inserir em `pokedex` + `pokedex_entrada`.

**Pegadinha ao extrair da página do pokemondb**: quando o Pokémon mostrado na lista é uma forma
regional (ex. Meowth-galarian em Sword & Shield), o link `<a href="/pokedex/...">` aponta pro slug
BASE (`/pokedex/meowth`), mas o `<img>` ao lado já mostra o sprite certo da forma regional
(`.../meowth-galarian.jpg`). Extrair o slug do `href` dá o Pokémon errado (base em vez da forma).
O jeito certo é tirar o slug do **nome do arquivo do sprite**, não do link — foi assim que achei
13 Meowth/Ponyta/Corsola/etc. errados antes de inserir os dados da Sword & Shield.

A lista de **Mega Evolução** veio da tabela "List of Pokémon in the Mega Evolution Pokédex" do
Bulbapedia (a Mega Dex de dentro do jogo Legends: Z-A) — conferi que ela já cobre 100% da lista
histórica de X/Y + Omega Ruby/Alpha Sapphire, então não precisou de fonte separada pras Megas
clássicas. A lista de **Gigantamax** veio da página "Gigantamax" do Bulbapedia (tabelas do jogo
base de Sword/Shield + da DLC Isle of Armor).

## Decisões já tomadas (não precisa rediscutir)

- Servidor em Python puro, sem dependências — nada de FastAPI/Flask/venv.
- Clique no card **abre o modal**; marcar como capturado é um botão dentro do modal.
- O progresso fica no banco (tabela `captura`), não no `localStorage`. Isso faz o progresso ser o
  mesmo no PC e no celular.
- **Captura é separada por living dex (por jogo), não global por slug.** `captura` tem chave
  composta `(living_dex_id, slug)` — cada `pokedex` tem uma coluna `living_dex_id` (1 = Scarlet &
  Violet, 2 = Legends: Z-A, 3 = Sword & Shield) que agrupa as Pokédex de um mesmo jogo. Isso existe
  porque um Pokémon pode aparecer em mais de um jogo (ex.: Grookey está no Blueberry do S&V **e**
  no Galar do Sword & Shield) — marcar capturado num não pode marcar no outro, já que são caixas
  de save files diferentes. O `livingdex.js` guarda `estado.livingDexId` (setado por
  `iniciarLivingDex(livingDexId, idsPokedex)`) e manda ele em toda chamada que depende de captura:
  `POST/DELETE /api/captura/<living_dex_id>/<slug>` e `GET /api/pokemon/<living_dex_id>/<slug>`.
  As rotas que só listam Pokédex (`/api/pokedex`, `/api/pokedex/<id>`) não precisam do id porque o
  servidor já sabe o `living_dex_id` de cada Pokédex pelo banco. Ao cadastrar uma living dex nova,
  não esquecer de dar um `living_dex_id` novo pras Pokédex dela e usar esse número no
  `iniciarLivingDex()` da página.
- O catálogo tem todas as espécies, não só as das Pokédex atuais, justamente para que adicionar uma
  Pokédex nova seja só inserir em `pokedex_entrada`.
- O front tem um **menu lateral fixo** (sempre à esquerda, inclusive no celular — não vira barra
  no topo) e cada living dex é um **HTML separado** (`index.html` = início, `paldea.html` = Paldea,
  `legends-za.html` = Legends: Z-A), não uma SPA com rotas em hash. Isso foi escolha deliberada pra
  facilitar adicionar living dex novas depois: cada uma ganha seu próprio arquivo, sem mexer nas
  outras. `estilo.css`, `tema-preload.js`, `comum.js` (api + tema) e `livingdex.js` (`TIPO`, `CHART`,
  montagem das caixas, modal de detalhe) são compartilhados por todas as páginas de living dex — só
  a lista de quais Pokédex mostrar é específica de cada página, e isso vira uma chamada de uma
  linha: `iniciarLivingDex([1, 2, 3])` no `dex.js` do Paldea, `iniciarLivingDex([4, 5])` no
  `legends-za.js`. Sem essa filtragem por id, toda página mostraria as Pokédex de todo mundo.
- **Não existe `<header>` no topo.** Toda a área de controle de uma living dex (progresso, busca,
  filtro "só faltando", progresso por Pokédex e a navegação entre caixas) fica dentro da própria
  sidebar, num bloco `.sidebar-dex` logo abaixo do menu de páginas. O `#main` ao lado só tem as
  caixas. Os ids (`#sub`, `#done`, `#total`, `#prog`, `#q`, `#onlyMissing`, `#subs`, `#nav`) não
  mudaram, só a posição no HTML — o `livingdex.js` não sabe nem precisa saber onde eles estão.
- Padrão pra cadastrar uma living dex nova (ex.: Johto): 1) inserir a(s) Pokédex no banco (anotar
  os ids que o SQLite atribuiu); 2) criar `johto.html` copiando o padrão de `legends-za.html`
  (sidebar completa + `.sidebar-dex` + `#main` + `<dialog id="modal">`, carregando `comum.js` →
  `livingdex.js` → `johto.js`) e um `johto.js` de uma linha só, tipo
  `iniciarLivingDex([ids da Johto]).catch(...)`; 3) adicionar o item no `<nav>` da sidebar **em
  todo HTML existente** (a sidebar é duplicada em cada página, de propósito, pra não precisar de
  template no servidor); 4) adicionar a entrada em `LIVING_DEXES` no `home.js`.

## Pontos em aberto

- Importar o progresso da versão antiga (um HTML único que salvava no `localStorage` por nome do
  Pokémon, não por slug).
- Cadastrar novas Pokédex (Johto, Kanto, Hisui…) — falta decidir a fonte da ordem regional. Cada
  uma vira um HTML novo, seguindo o padrão descrito acima.
- Ajustes de layout no modal.
- As 44 Megas novas da Legends: Z-A estão com sprite de qualidade inferior (ícone de menu do jogo,
  via Bulbapedia) porque a Pokémon HOME ainda não tem a arte delas. Quando a HOME atualizar (ou o
  pokemondb passar a espelhar), dá pra rodar `baixar_sprites.py` de novo depois de trocar o
  `fonte_url` dessas linhas em `pokemon_forma_especial` pra apontar pro pokemondb.
