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

A pasta era só um monte de arquivo solto (mais de 60 na raiz) até ficar difícil de achar coisa —
agora tá organizada em pastas:

```
pokedex.db          banco SQLite (1085 Pokémon, ~900 KB)
servidor.py         servidor + API, só biblioteca padrão (http.server + sqlite3)
baixar_sprites.py   baixa os sprites (normal + shiny) do pokemondb para static/sprites/
index.html + nacional.html + nacional.js   as duas páginas que ficam na raiz (ver por quê abaixo)

static/              tudo que é compartilhado — CSS, JS comum, fonte, sprites
  estilo.css          CSS de todas as páginas (variáveis, sidebar, caixas, modal)
  tema-preload.js      aplica o tema salvo antes da 1ª pintura, sem defer/async
  comum.js             api() e o botão de tema
  livingdex.js          TIPO/CHART, montagem das caixas e o modal — exporta
                        iniciarLivingDex(livingDexId, idsPokedex) e iniciarCatalogo()
  home.js               monta os cards da página inicial
  fonts/jost.woff2      fonte Jost (variável, pesos 300–600)
  sprites/normal|shiny/<slug>.jpg

living-dex/           um par <jogo>.html + <jogo>.js por living dex (ver lista abaixo)
```

**`index.html` fica na raiz por exigência do próprio `http.server`**: `GET /` só serve
`index.html` automaticamente se ele estiver na pasta raiz servida, então não dava pra mover pra
dentro de uma subpasta. Deixei `nacional.html`/`nacional.js` do lado dele na raiz por serem as
duas páginas "de entrada" (não são uma living dex específica), pra ficar claro que são de
natureza diferente das 19 dentro de `living-dex/`.

Todo caminho pra `static/` no HTML e no `sprite()`/`spriteShiny()` do `livingdex.js` é
**absoluto** (`/static/...`), não relativo — assim funciona igual não importa se a página que
carrega é `index.html` (raiz) ou `living-dex/paldea.html` (uma pasta a mais de profundidade), sem
precisar calcular `../` em cada lugar.

Cada living dex é um par `<jogo>.html` + `<jogo>.js` dentro de `living-dex/`, todos seguindo o
mesmo molde (ver "Decisões já tomadas"). As 19 atuais, em ordem de criação:

```
paldea.html                        Scarlet & Violet     livingDexId 1
legends-za.html                    Legends: Z-A         livingDexId 2
sword-shield.html                  Sword & Shield       livingDexId 3
x-y.html                           X & Y                livingDexId 4
heartgold-soulsilver.html          HeartGold & SoulSilver  livingDexId 5
red-blue-yellow.html               Red, Blue & Yellow   livingDexId 6
gold-silver-crystal.html           Gold, Silver & Crystal  livingDexId 7
ruby-sapphire-emerald.html         Ruby, Sapphire & Emerald  livingDexId 8
firered-leafgreen.html             FireRed & LeafGreen  livingDexId 9
diamond-pearl.html                 Diamond & Pearl      livingDexId 10
platinum.html                      Platinum             livingDexId 11
black-white.html                   Black & White        livingDexId 12
black-white-2.html                 Black 2 & White 2    livingDexId 13
omega-ruby-alpha-sapphire.html     Omega Ruby & Alpha Sapphire  livingDexId 14
sun-moon.html                      Sun & Moon           livingDexId 15
ultra-sun-ultra-moon.html          Ultra Sun & Ultra Moon  livingDexId 16
lets-go-pikachu-eevee.html         Let's Go, Pikachu & Eevee  livingDexId 17
brilliant-diamond-shining-pearl.html  Brilliant Diamond & Shining Pearl  livingDexId 18
legends-arceus.html                Legends: Arceus      livingDexId 19
```

`paldea.js` já se chamou `dex.js` (era o primeiro, criado antes de virar convenção o nome bater
com o `.html`) — renomeado durante essa reorganização, não tem mais exceção ao padrão.

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
**26 Pokédex cadastradas, em 19 living dex** (5.360 entradas no total) — praticamente todo jogo
principal da série está coberto (ver lista completa de arquivos acima). As únicas com mais de uma
Pokédex: Scarlet & Violet (Paldea+Kitakami+Blueberry), Legends: Z-A (Lumiose+Mega Dimension),
Sword & Shield (Galar+Isle of Armor+Crown Tundra) e X & Y (Central/Coastal/Mountain Kalos) — o
resto é uma Pokédex só por living dex.

Dentro de cada living dex os Pokémon não se repetem entre as Pokédex. Isso já vinha pronto da
fonte pra quase todo mundo (pokemondb pré-filtra os DLC contra a base, ou nem tem múltiplas
Pokédex pra repetir). A **exceção é Sword & Shield**: as páginas de Isle of Armor/Crown Tundra do
pokemondb listam de novo um monte de Pokémon que já tavam na Pokédex base (ex.: Isle of Armor
repete 101 dos 400 de Galar) — tive que filtrar na mão: cada entrada só entra na primeira Pokédex
em que aparece (ordem: Galar → Isle of Armor → Crown Tundra), renumerando a ordem regional depois
de tirar as repetidas.

Como os `nome` de Pokédex de living dex diferentes podem cair na mesma região (Kanto aparece em
RBY, FRLG e Let's Go; Johto em GSC e HGSS; Hoenn em RSE e ORAS; Sinnoh em D/P, Platinum e BDSP;
Alola em S/M e USUM), e a coluna `pokedex.nome` é `UNIQUE`, o padrão pra desambiguar é
`"Região (abreviação do jogo)"` — `Kanto (RBY)`, `Kanto (FRLG)`, `Kanto (LGPE)`, `Johto (GSC)`,
`Johto (HGSS)`, `Hoenn (RSE)`, `Hoenn (ORAS)`, `Sinnoh (D/P)`, `Sinnoh (Pt)`, `Sinnoh (BDSP)`,
`Alola (S/M)`, `Alola (USUM)`. Só usa o nome puro da região quando ela não se repete em nenhuma
outra living dex (Paldea, Galar, Lumiose, as três de Kalos, Hisui).

Além disso, **125 formas especiais** em `pokemon_forma_especial` (não são Pokédex, não contam
capturado nem entram nas caixas — são só informação extra mostrada no modal): 92 Mega Evoluções
(todas as clássicas de X/Y e ORAS, mais as novas exclusivas da Legends: Z-A) e 33 Gigantamax
(as 32 espécies conhecidas + Urshifu com as 2 formas de estilo).

### Convenções que precisam ser mantidas

- **`slug` é a chave de tudo**, inclusive da captura. Segue o padrão do pokemondb, que já separa
  formas: `wooper-paldean`, `tauros-paldean-combat`, `exeggutor-alolan`, `qwilfish-hisuian`.
  O mesmo slug serve de nome do arquivo de sprite.
- Marcar captura por slug (dentro da mesma living dex) é o que evita contar duas vezes o mesmo
  Pokémon em Pokédex diferentes do mesmo jogo. Entre living dex diferentes a captura já **não** é
  compartilhada — ver a decisão sobre `captura(living_dex_id, slug)` mais abaixo.
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
- Os sprites são locais, em `static/sprites/normal/<slug>.jpg` e `static/sprites/shiny/<slug>.jpg`,
  baixados do pokemondb (conjunto `home`, ícones do Pokémon HOME) pelo `baixar_sprites.py`. O
  `livingdex.js` (`sprite()`/`spriteShiny()`) aponta pro caminho absoluto `/static/sprites/...`,
  servido pelo próprio `servidor.py` — não depende mais de internet depois de baixado. Rodar
  `baixar_sprites.py` de novo pula o que já existe, então serve pra baixar só o que faltar
  (Pokémon novo, forma nova). O conjunto `scarlet-violet` do pokemondb só tem sprite normal, sem
  shiny, por isso não foi usado.
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
| `GET /api/pokemon/<slug>` | mesma coisa, sem living dex — usado pela Pokédex Nacional, `capturado` sempre `false` |
| `GET /api/catalogo` | catálogo inteiro (1085) em ordem de Pokédex Nacional — usado só pela página de consulta |
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
- X & Y: `pokemondb.net/pokedex/game/x-y`, uma página só com três seções (`#dex-central-kalos`,
  `#dex-coastal-kalos`, `#dex-mountain-kalos`) — 153+153+151, sem repetir entre si. O jogo não tem
  DLC. Por ser Geração 6, a página mostra sprite do conjunto antigo `bank` (`.png`, sem forma
  regional nenhuma ainda existir), não `home` — não afeta nada aqui porque o app sempre usa o
  conjunto `home` pra tudo, independente de quando o Pokémon apareceu pela primeira vez. A página
  também tem um link de "National Pokédex" na barra lateral do próprio pokemondb — **não é** uma
  seção da Pokédex do jogo, é só um link de navegação do site, então não teve nada pra ignorar de
  propósito.
- HeartGold & SoulSilver: `pokemondb.net/pokedex/game/heartgold-soulsilver` — uma Pokédex só (o
  "New Johto Dex", 256 entradas), sem seções e sem DLC. Sprite do conjunto `heartgold-soulsilver`
  na página (mais um formato de path diferente), de novo irrelevante pro app porque sempre baixa
  do `home`.
- Os outros 14 jogos (Red/Blue/Yellow, Gold/Silver/Crystal, Ruby/Sapphire/Emerald,
  FireRed/LeafGreen, Diamond/Pearl, Platinum, Black/White, Black 2/White 2,
  Omega Ruby/Alpha Sapphire, Sun/Moon, Ultra Sun/Ultra Moon, Let's Go Pikachu/Eevee,
  Brilliant Diamond/Shining Pearl, Legends: Arceus): todos em `pokemondb.net/pokedex/game/<slug>`
  (slug de cada um no arquivo `.html`/`.js` correspondente), a maioria uma Pokédex só sem seção
  nem DLC. Duas exceções:
  - **Sun/Moon e Ultra Sun/Ultra Moon** têm 5 seções na página (`Alola dex` + 4 ilhas). Usei só a
    `Alola dex` (302 e 403 entradas) — é a Pokédex regional única de verdade, com os lendários e
    Ultra Beasts incluídos; as 4 ilhas são só uma visão "onde encontrar" que não bate exatamente
    com ela (tem Pokémon repetido entre ilhas e falta lendário/UB), não são Pokédex separadas de
    fato como as 3 seções de X & Y.
  - **Legends: Arceus** tem 16 formas hisuianas escondidas atrás do slug base (mesma pegadinha do
    Sword & Shield, ver abaixo).
Pra uma Pokédex de um jogo ainda mais novo, o caminho é o mesmo: achar a página no pokemondb,
extrair número regional + slug + tipos na ordem que aparece, conferir que o slug já existe no
catálogo (senão precisa adicionar o Pokémon primeiro), **deduplicar contra as Pokédex já
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
- **A Pokédex Nacional (`nacional.html`) não é uma living dex** — é só consulta ao catálogo
  inteiro (1085, incluindo formas regionais), em ordem nacional, sem caixa de 30 e sem marcar
  captura. Ela usa o mesmo `livingdex.js` (reaproveita `celula()`, o modal, tudo), só que chama
  `iniciarCatalogo()` em vez de `iniciarLivingDex()`, o que deixa `estado.livingDexId = null`. Todo
  lugar do `livingdex.js` que depende de captura confere `estado.livingDexId != null` antes de
  mexer (o botão "Marcar como capturado" no modal, o botãozinho `.mark` de cada célula, o `.mark`
  não aparece na Pokédex Nacional). O `servidor.py` trata isso com `detalhe(slug, living_dex_id=None)`
  — sem `living_dex_id`, `capturado` sempre volta `false` e a rota vira `GET /api/pokemon/<slug>`
  (sem o número na frente). Se cadastrar outra página desse tipo (sem captura), é só seguir esse
  padrão: `livingDexId = null` e checagens `!= null` ao redor de tudo que mexe em captura.
- O catálogo tem todas as espécies, não só as das Pokédex atuais, justamente para que adicionar uma
  Pokédex nova seja só inserir em `pokedex_entrada`.
- O front tem um **menu lateral fixo** (sempre à esquerda, inclusive no celular — não vira barra
  no topo) e cada living dex é um **HTML separado** dentro de `living-dex/` (`index.html` na raiz
  = início, `living-dex/paldea.html` = Paldea, `living-dex/legends-za.html` = Legends: Z-A), não
  uma SPA com rotas em hash. Isso foi escolha deliberada pra facilitar adicionar living dex novas
  depois: cada uma ganha seu próprio arquivo, sem mexer nas outras. `static/estilo.css`,
  `static/tema-preload.js`, `static/comum.js` (api + tema) e `static/livingdex.js` (`TIPO`,
  `CHART`, montagem das caixas, modal de detalhe) são compartilhados por todas — só a lista de
  quais Pokédex mostrar é específica de cada página, e isso vira uma chamada de uma linha:
  `iniciarLivingDex(1, [1, 2, 3])` no `paldea.js`, `iniciarLivingDex(2, [4, 5])` no
  `legends-za.js`. Sem essa filtragem por id, toda página mostraria as Pokédex de todo mundo.
- **Não existe `<header>` no topo.** Toda a área de controle de uma living dex (progresso, busca,
  filtro "só faltando", progresso por Pokédex e a navegação entre caixas) fica dentro da própria
  sidebar, num bloco `.sidebar-dex` logo abaixo do menu de páginas. O `#main` ao lado só tem as
  caixas. Os ids (`#sub`, `#done`, `#total`, `#prog`, `#q`, `#onlyMissing`, `#subs`, `#nav`) não
  mudaram, só a posição no HTML — o `livingdex.js` não sabe nem precisa saber onde eles estão.
- Padrão pra cadastrar uma living dex nova (ex.: um jogo que sair no futuro): 1) escolher o
  próximo `living_dex_id` livre e inserir a(s) Pokédex no banco com ele; 2) criar
  `living-dex/<jogo>.html` copiando o padrão de qualquer página existente ali dentro (sidebar
  completa + `.sidebar-dex` + `#main` + `<dialog id="modal">`, carregando `../static/comum.js` →
  `../static/livingdex.js` → `<jogo>.js`, com os links da sidebar pra `../index.html` e
  `../nacional.html`) e um `living-dex/<jogo>.js` de uma linha só, tipo
  `iniciarLivingDex(<living_dex_id>, [ids das Pokédex]).catch(...)`; 3) adicionar o item no `<nav>`
  da sidebar **em todo HTML existente** (a sidebar é duplicada em cada página, de propósito, pra
  não precisar de template no servidor — com 21 páginas isso já foi feito por script em vez de
  editar arquivo por arquivo, ver commits correspondentes); 4) adicionar a entrada em
  `LIVING_DEXES` no `static/home.js`, com `pagina: "living-dex/<jogo>.html"`; 5) se o `nome` da
  Pokédex colidir com uma já cadastrada (região repetida), desambiguar como
  `"Região (abreviação do jogo)"` (ver seção Banco).
- **Reorganização em pastas** (`static/` + `living-dex/`, `index.html`/`nacional.html`/
  `nacional.js` na raiz): feita quando a raiz já tinha mais de 60 arquivos soltos e ficou difícil
  de identificar coisa. `index.html` tem que ficar na raiz porque é o único jeito do
  `http.server` servir `GET /` sem listar diretório. Toda referência a `static/` (CSS, JS
  compartilhado, fonte, sprite) é **caminho absoluto** (`/static/...`), não relativo — assim as
  páginas da raiz e as de `living-dex/` (uma pasta a mais de profundidade) usam a mesma referência
  sem precisar calcular `../`. `servidor.py` não precisou de nenhuma mudança pra isso — o
  `SimpleHTTPRequestHandler` já serve qualquer subpasta automaticamente.

## Pontos em aberto

- Importar o progresso da versão antiga (um HTML único que salvava no `localStorage` por nome do
  Pokémon, não por slug).
- Praticamente toda a série principal já está cadastrada (19 living dex). O que ainda não entrou:
  jogos muito novos que saírem depois desta lista, e spin-offs sem sistema de caixas de PC de
  verdade (Pokémon GO, Colosseum/XD) — esses não fazem muito sentido como "living dex" tradicional.
- Ajustes de layout no modal.
- As 44 Megas novas da Legends: Z-A estão com sprite de qualidade inferior (ícone de menu do jogo,
  via Bulbapedia) porque a Pokémon HOME ainda não tem a arte delas. Quando a HOME atualizar (ou o
  pokemondb passar a espelhar), dá pra rodar `baixar_sprites.py` de novo depois de trocar o
  `fonte_url` dessas linhas em `pokemon_forma_especial` pra apontar pro pokemondb.
