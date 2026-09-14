/* Living Dex — logica compartilhada por toda pagina de living dex e pela Pokedex Nacional
   (caixas ou grade unica + modal de detalhe). Cada pagina de living dex so chama
   iniciarLivingDex(livingDexId, [ids das Pokedex que ela mostra]) no fim do seu proprio .js;
   a Pokedex Nacional chama iniciarCatalogo() (sem captura, sem caixas). Depende de comum.js
   (api, tema). Quando estado.livingDexId e' null estamos na consulta avulsa: sem botao de
   marcar, sem contador/progresso, sem "so faltando". */

const TIPO = {
  normal:   ["Normal",   "#9299a4"], fire:     ["Fire",     "#e2603a"],
  water:    ["Water",    "#3d82d1"], electric: ["Electric", "#d7a417"],
  grass:    ["Grass",    "#4a9d4f"], ice:      ["Ice",      "#4fb3c4"],
  fighting: ["Fighting", "#bf4a45"], poison:   ["Poison",   "#9455a8"],
  ground:   ["Ground",   "#b08a42"], flying:   ["Flying",   "#7b8fd4"],
  psychic:  ["Psychic",  "#d1568a"], bug:      ["Bug",      "#7a9c33"],
  rock:     ["Rock",     "#9b8659"], ghost:    ["Ghost",    "#60539b"],
  dragon:   ["Dragon",   "#4a5ec0"], dark:     ["Dark",     "#5a5158"],
  steel:    ["Steel",    "#6d8593"], fairy:    ["Fairy",    "#cf6c9c"],
};
const ORDEM_TIPOS = Object.keys(TIPO);

/* efetividade do tipo atacante sobre o defensor */
const CHART = {
  normal:   {rock:.5, steel:.5, ghost:0},
  fire:     {grass:2, ice:2, bug:2, steel:2, fire:.5, water:.5, rock:.5, dragon:.5},
  water:    {fire:2, ground:2, rock:2, water:.5, grass:.5, dragon:.5},
  electric: {water:2, flying:2, electric:.5, grass:.5, dragon:.5, ground:0},
  grass:    {water:2, ground:2, rock:2, fire:.5, grass:.5, poison:.5, flying:.5, bug:.5, dragon:.5, steel:.5},
  ice:      {grass:2, ground:2, flying:2, dragon:2, fire:.5, water:.5, ice:.5, steel:.5},
  fighting: {normal:2, ice:2, rock:2, dark:2, steel:2, poison:.5, flying:.5, psychic:.5, bug:.5, fairy:.5, ghost:0},
  poison:   {grass:2, fairy:2, poison:.5, ground:.5, rock:.5, ghost:.5, steel:0},
  ground:   {fire:2, electric:2, poison:2, rock:2, steel:2, grass:.5, bug:.5, flying:0},
  flying:   {grass:2, fighting:2, bug:2, electric:.5, rock:.5, steel:.5},
  psychic:  {fighting:2, poison:2, psychic:.5, steel:.5, dark:0},
  bug:      {grass:2, psychic:2, dark:2, fire:.5, fighting:.5, poison:.5, flying:.5, ghost:.5, steel:.5, fairy:.5},
  rock:     {fire:2, ice:2, flying:2, bug:2, fighting:.5, ground:.5, steel:.5},
  ghost:    {psychic:2, ghost:2, dark:.5, normal:0},
  dragon:   {dragon:2, steel:.5, fairy:0},
  dark:     {psychic:2, ghost:2, fighting:.5, dark:.5, fairy:.5},
  steel:    {ice:2, rock:2, fairy:2, fire:.5, water:.5, electric:.5, steel:.5},
  fairy:    {fighting:2, dragon:2, dark:2, fire:.5, poison:.5, steel:.5},
};

const GRUPO_OVO = {
  monster:"Monstro", water1:"Água 1", water2:"Água 2", water3:"Água 3", bug:"Inseto",
  flying:"Voador", ground:"Campo", fairy:"Fada", plant:"Planta", humanshape:"Humanoide",
  mineral:"Mineral", indeterminate:"Amorfo", ditto:"Ditto", dragon:"Dragão", "no-eggs":"Sem ovos",
};
const STATS = [
  ["hp","HP"], ["attack","Ataque"], ["defense","Defesa"],
  ["special-attack","Atq. Esp."], ["special-defense","Def. Esp."], ["speed","Velocidade"],
];

const titulo = s => s.split("-").map(p => p[0].toUpperCase() + p.slice(1)).join(" ");
const sprite = s => `/static/sprites/normal/${s}.jpg`;
const spriteShiny = s => `/static/sprites/shiny/${s}.jpg`;
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const chip = t => `<i style="background:${TIPO[t][1]}">${TIPO[t][0]}</i>`;
const badgeEspecial = p => p.mitico ? `<span class="especial mitico">Mítico</span>`
  : p.lendario ? `<span class="especial lendario">Lendário</span>` : "";

const CORES_DEX = ["#a4433c", "#1f7a6a", "#2f4fa0", "#8a5a2b", "#6b3d8f"];
const estado = { livingDexId: null, dexes: [], entradas: {}, capturados: new Set(), total: 0 };

/* ---------------------------------------------------------------- montagem */
async function iniciarLivingDex(livingDexId, idsPokedex) {
  estado.livingDexId = livingDexId;
  const todas = await api("/pokedex");
  estado.dexes = todas.filter(d => idsPokedex.includes(d.id));
  const listas = await Promise.all(estado.dexes.map(d => api("/pokedex/" + d.id)));
  estado.dexes.forEach((d, i) => {
    d.cor = CORES_DEX[i % CORES_DEX.length];
    estado.entradas[d.id] = listas[i];
    listas[i].forEach(e => { if (e.capturado) estado.capturados.add(e.slug); });
  });
  estado.total = listas.reduce((s, l) => s + l.length, 0);

  const main = document.getElementById("main");
  const nav = document.getElementById("nav");
  const subs = document.getElementById("subs");
  main.innerHTML = ""; nav.innerHTML = ""; subs.innerHTML = "";
  document.getElementById("total").textContent = "/" + estado.total;
  document.getElementById("sub").textContent =
    `${estado.dexes.map(d => d.nome).join(" · ")} — ${estado.total} Pokémon, caixas de 30`;

  estado.dexes.forEach(d => {
    const s = el("span", null, `${d.nome} <b id="sub-${d.id}">0/${d.total}</b>`);
    s.style.setProperty("--cor", d.cor);
    subs.appendChild(s);

    const entradas = estado.entradas[d.id];
    const nCaixas = Math.ceil(entradas.length / 30);
    for (let c = 0; c < nCaixas; c++) {
      const fatia = entradas.slice(c * 30, c * 30 + 30);
      const id = `dex${d.id}-caixa${c + 1}`;

      const p = el("a", "pill", `${d.nome} ${c + 1} <b>0/${fatia.length}</b>`);
      p.href = "#" + id; p.dataset.caixa = id;
      p.style.borderColor = d.cor + "55";
      nav.appendChild(p);

      const box = el("section", "box");
      box.id = id;
      box.style.setProperty("--cor", d.cor);
      box.appendChild(el("h2", null,
        `Caixa ${c + 1} de ${nCaixas} <span class="reg">${d.nome}</span>` +
        `<span class="cnt">0/${fatia.length}</span>`));
      const grid = el("div", "grid");
      fatia.forEach(e => grid.appendChild(celula(e)));
      box.appendChild(grid);
      main.appendChild(box);
    }
  });
  pintar();
}

/* Pagina de consulta (Pokedex Nacional): lista o catalogo inteiro, sem caixas nem captura. */
async function iniciarCatalogo() {
  estado.livingDexId = null;
  const lista = await api("/catalogo");
  estado.total = lista.length;

  document.getElementById("sub").textContent = `${estado.total} Pokémon, em ordem da Pokédex Nacional`;

  const main = document.getElementById("main");
  main.innerHTML = "";
  const box = el("section", "box");
  const grid = el("div", "grid");
  lista.forEach(e => grid.appendChild(celula(e)));
  box.appendChild(grid);
  main.appendChild(box);
}

function celula(e) {
  const b = el("div", estado.livingDexId != null ? "cell" : "cell sem-captura");
  b.tabIndex = 0;
  b.setAttribute("role", "button");
  b.dataset.slug = e.slug;
  b.dataset.busca = (e.nome + " " + (e.forma || "") + " " + e.slug).toLowerCase();
  const tipos = (e.tipos || "").split("/").filter(Boolean).map(chip).join("");
  const marca = estado.livingDexId != null
    ? `<button class="mark" type="button" aria-label="Marcar/desmarcar capturado"></button>` : "";
  b.innerHTML =
    marca +
    `<span class="idx">${String(e.num_regional).padStart(3, "0")}</span>` +
    `<img loading="lazy" alt="" src="${sprite(e.sprite)}">` +
    `<span class="nm">${e.nome}</span>` +
    (e.forma ? `<span class="fm">${e.forma}</span>` : "") +
    `<span class="ty">${tipos}</span>`;
  b.addEventListener("click", () => abrir(e.slug));
  b.addEventListener("keydown", ev => {
    if (ev.target === b && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); abrir(e.slug); }
  });
  if (estado.livingDexId != null) {
    const btnMark = b.querySelector(".mark");
    let iniciadoPorMouse = false;
    btnMark.addEventListener("mousedown", ev => {
      ev.preventDefault();  // nao deixa selecionar texto nem arrastar a imagem
      ev.stopPropagation();
      iniciadoPorMouse = true;
      arrastandoCaptura = !estado.capturados.has(e.slug);
      document.body.classList.add("arrastando-captura");
      definirCaptura(e.slug, arrastandoCaptura);
    });
    btnMark.addEventListener("click", ev => {
      ev.stopPropagation();
      if (iniciadoPorMouse) { iniciadoPorMouse = false; return; }  // ja foi tratado no mousedown
      alternarCaptura(e.slug);  // veio do teclado (Enter/Espaço)
    });
  }
  return b;
}

/* Arrastar com o mouse por cima de várias células marca (ou desmarca) todas de uma vez:
   pressionar o .mark de uma célula decide o sentido (marcar se ela não tava, desmarcar se já
   tava) e o mesmo sentido vale pra toda célula que o mouse passar por cima até soltar o botão. */
let arrastandoCaptura = null;

function definirCaptura(slug, valor) {
  if (estado.capturados.has(slug) === valor) return;
  valor ? estado.capturados.add(slug) : estado.capturados.delete(slug);
  pintar(); filtrar();
  api(`/captura/${estado.livingDexId}/${slug}`, { method: valor ? "POST" : "DELETE" })
    .catch(err => {
      valor ? estado.capturados.delete(slug) : estado.capturados.add(slug);
      pintar(); filtrar();
      alert("Falha ao atualizar: " + err.message);
    });
}

function alternarCaptura(slug) {
  definirCaptura(slug, !estado.capturados.has(slug));
}

function pintar() {
  document.querySelectorAll(".cell").forEach(c =>
    c.classList.toggle("capturado", estado.capturados.has(c.dataset.slug)));
  document.getElementById("done").textContent = estado.capturados.size;
  document.getElementById("prog").style.width =
    (estado.total ? estado.capturados.size / estado.total * 100 : 0) + "%";

  estado.dexes.forEach(d => {
    const n = estado.entradas[d.id].filter(e => estado.capturados.has(e.slug)).length;
    document.getElementById("sub-" + d.id).textContent = `${n}/${d.total}`;
  });
  document.querySelectorAll(".box").forEach(box => {
    const cels = [...box.querySelectorAll(".cell")];
    const n = cels.filter(c => estado.capturados.has(c.dataset.slug)).length;
    box.querySelector(".cnt").textContent = `${n}/${cels.length}`;
    const pil = document.querySelector(`.pill[data-caixa="${box.id}"] b`);
    if (pil) pil.textContent = `${n}/${cels.length}`;
  });
}

function filtrar() {
  const q = document.getElementById("q").value.trim().toLowerCase();
  const btnSo = document.getElementById("onlyMissing");
  const so = btnSo && btnSo.getAttribute("aria-pressed") === "true";
  document.querySelectorAll(".cell").forEach(c => {
    const okQ = !q || c.dataset.busca.includes(q);
    const okM = !so || !estado.capturados.has(c.dataset.slug);
    c.classList.toggle("hide", !(okQ && okM));
  });
  document.querySelectorAll(".box").forEach(box =>
    box.classList.toggle("empty", ![...box.querySelectorAll(".cell")].some(c => !c.classList.contains("hide"))));
}

/* ---------------------------------------------------------------- detalhe */
async function abrir(slug) {
  const modal = document.getElementById("modal");
  const det = document.getElementById("det");
  det.innerHTML = `<div class="topo"><span>Carregando…</span></div>`;
  if (!modal.open) modal.showModal();
  const p = await api(estado.livingDexId != null
    ? `/pokemon/${estado.livingDexId}/${slug}` : `/pokemon/${slug}`);
  det.innerHTML = "";
  det.appendChild(topo(p));
  det.appendChild(secoes(p));
}

function topo(p) {
  const t = el("div", "topo");
  t.innerHTML =
    `<div class="sprites">
       <img class="normal" src="${sprite(p.sprite)}" alt="">
       <div class="shiny"><img src="${spriteShiny(p.sprite)}" alt=""><span>Shiny</span></div>
     </div>` +
    `<div><div class="num">Nº ${String(p.num_nacional).padStart(4, "0")}</div>` +
    `<h3>${p.nome}${badgeEspecial(p)}</h3>` +
    (p.forma ? `<div class="forma">Forma ${p.forma}</div>` : "") +
    `<div class="tipos">${p.tipos.map(chip).join("")}</div></div>`;

  const acoes = el("div", "acoes");
  const x = el("button", "fechar", "✕");
  x.title = "Fechar";
  x.addEventListener("click", () => document.getElementById("modal").close());
  acoes.append(x);
  if (estado.livingDexId != null) {
    const b = el("button", "marcar");
    const marcado = estado.capturados.has(p.slug);
    b.dataset.on = marcado ? "1" : "0";
    b.textContent = marcado ? "✓ Capturado" : "Marcar como capturado";
    b.addEventListener("click", async () => {
      b.disabled = true;
      try {
        await alternarCaptura(p.slug);
        const agora = estado.capturados.has(p.slug);
        b.dataset.on = agora ? "1" : "0";
        b.textContent = agora ? "✓ Capturado" : "Marcar como capturado";
      } finally { b.disabled = false; }
    });
    acoes.append(b);
  }
  t.appendChild(acoes);
  return t;
}

function secoes(p) {
  const wrap = el("div", "secoes");

  const genero = p.taxa_genero < 0 ? "Sem gênero"
    : `${100 - p.taxa_genero * 12.5}% macho · ${p.taxa_genero * 12.5}% fêmea`;
  const hab = p.habilidades.map(h =>
    `${titulo(h.habilidade)}${h.oculta ? ' <span class="oculta">(oculta)</span>' : ""}`).join("<br>");

  wrap.appendChild(secao("Dados", `<table class="dados">
    <tr><td>Espécie</td><td>${p.especie || "—"}</td></tr>
    <tr><td>Altura</td><td>${p.altura_m.toFixed(1).replace(".", ",")} m</td></tr>
    <tr><td>Peso</td><td>${p.peso_kg.toFixed(1).replace(".", ",")} kg</td></tr>
    <tr><td>Habilidades</td><td>${hab || "—"}</td></tr>
    <tr><td>Geração</td><td>${p.geracao}${p.lendario ? " · lendário" : ""}${p.mitico ? " · mítico" : ""}</td></tr>
  </table>`));

  wrap.appendChild(secao("Treinamento e reprodução", `<table class="dados">
    <tr><td>Taxa de captura</td><td>${p.taxa_captura ?? "—"}</td></tr>
    <tr><td>Amizade base</td><td>${p.amizade_base ?? "—"}</td></tr>
    <tr><td>Exp. base</td><td>${p.exp_base ?? "—"}</td></tr>
    <tr><td>Grupos de ovo</td><td>${p.grupos_ovo.map(g => GRUPO_OVO[g] || g).join(", ") || "—"}</td></tr>
    <tr><td>Gênero</td><td>${genero}</td></tr>
    <tr><td>Ciclos de ovo</td><td>${p.ciclos_ovo} (~${(p.ciclos_ovo * 257).toLocaleString("pt-BR")} passos)</td></tr>
  </table>`));

  wrap.appendChild(secao("Stats base", statsHtml(p)));
  wrap.appendChild(secao("Defesas de tipo", defesasHtml(p.tipos)));

  if (p.formas.length) {
    const formas = el("div", "sec");
    formas.style.gridColumn = "1 / -1";
    formas.appendChild(el("h4", null, "Outras formas"));
    const grade = el("div", "evo");
    p.formas.forEach(f => grade.appendChild(formaHtml(f)));
    formas.appendChild(grade);
    wrap.appendChild(formas);
  }

  const megas = p.especiais.filter(e => e.tipo === "mega");
  if (megas.length) {
    const sec = el("div", "sec");
    sec.style.gridColumn = "1 / -1";
    sec.appendChild(el("h4", null, "Mega Evolução"));
    const grade = el("div", "evo");
    megas.forEach(e => grade.appendChild(especialHtml(e, p)));
    sec.appendChild(grade);
    wrap.appendChild(sec);
  }

  const gmax = p.especiais.filter(e => e.tipo === "gigantamax");
  if (gmax.length) {
    const sec = el("div", "sec");
    sec.style.gridColumn = "1 / -1";
    sec.appendChild(el("h4", null, "Gigantamax"));
    const grade = el("div", "evo");
    gmax.forEach(e => grade.appendChild(especialHtml(e, p)));
    sec.appendChild(grade);
    wrap.appendChild(sec);
  }

  const evo = el("div", "sec");
  evo.style.gridColumn = "1 / -1";
  evo.appendChild(el("h4", null, "Evolução"));
  evo.appendChild(p.evolucao ? cadeiaHtml(p.evolucao, p.slug)
                             : el("p", null, "Não evolui."));
  wrap.appendChild(evo);

  const dex = el("div", "sec");
  dex.style.gridColumn = "1 / -1";
  dex.appendChild(el("h4", null, "Nas Pokédex"));
  dex.appendChild(el("div", "dexes", p.pokedex.length
    ? p.pokedex.map(d => `<span><b>${String(d.num_regional).padStart(3, "0")}</b> ${d.nome}</span>`).join("")
    : "Ainda não está em nenhuma Pokédex cadastrada."));
  wrap.appendChild(dex);
  return wrap;
}

function secao(titulo_, html) {
  const s = el("div", "sec");
  s.appendChild(el("h4", null, titulo_));
  s.appendChild(el("div", null, html));
  return s;
}

function statsHtml(p) {
  const cor = TIPO[p.tipos[0]][1];
  let total = 0;
  const linhas = STATS.map(([k, rot]) => {
    const v = p.stats[k] ?? 0;
    total += v;
    const min = k === "hp" ? 2 * v + 110 : Math.floor((2 * v + 5) * 0.9);
    const max = k === "hp" ? 2 * v + 204 : Math.floor((2 * v + 99) * 1.1);
    return `<div class="stat"><span class="lbl">${rot}</span><span class="val">${v}</span>` +
      `<span class="barra"><i style="width:${Math.min(100, v / 180 * 100)}%;background:${cor}"></i></span>` +
      `<span class="mn">${min}</span><span class="mx">${max}</span></div>`;
  }).join("");
  return linhas +
    `<div class="stat total"><span class="lbl">Total</span><span class="val">${total}</span>` +
    `<span></span><span class="mn">mín</span><span class="mx">máx</span></div>` +
    `<p class="oculta" style="margin:8px 0 0">Mín e máx no nível 100: mínimo com natureza contrária, 0 EV/0 IV; máximo com natureza favorável, 252 EV/31 IV.</p>`;
}

function defesasHtml(tipos) {
  return `<div class="def">` + ORDEM_TIPOS.map(atk => {
    const m = tipos.reduce((acc, def) => acc * (CHART[atk][def] ?? 1), 1);
    const cls = m === 0 ? "x0" : m === 4 ? "x4" : m === 2 ? "x2"
              : m === .5 ? "x05" : m === .25 ? "x025" : "";
    const rot = m === 1 ? "" : m === .5 ? "½" : m === .25 ? "¼" : String(m);
    return `<div class="${cls}"><b style="background:${TIPO[atk][1]}">${TIPO[atk][0].slice(0, 3)}</b>` +
           `<span>${rot || "&nbsp;"}</span></div>`;
  }).join("") + `</div>`;
}

function cadeiaHtml(no, atual) {
  const linha = el("div", "linha");
  linha.appendChild(noHtml(no, atual));
  if (no.seguintes.length) {
    const ramo = el("div", "ramo");
    no.seguintes.forEach(f => {
      const l = el("div", "linha");
      l.appendChild(el("span", "met", "→<br>" + (f.metodo || "")));
      l.appendChild(cadeiaHtml(f, atual));
      ramo.appendChild(l);
    });
    linha.appendChild(ramo);
  }
  const box = el("div", "evo");
  box.appendChild(linha);
  return box;
}

function noHtml(no, atual) {
  const b = el("button", "no");
  b.innerHTML = `<img src="${sprite(no.sprite)}" alt="">` +
    `<span class="n">${no.nome}</span>` +
    `<span class="ty" style="display:flex;gap:3px;justify-content:center">` +
    (no.tipos || "").split("/").filter(Boolean).map(chip).join("") + `</span>`;
  if (no.slug === atual) b.classList.add("atual");
  b.addEventListener("click", () => abrir(no.slug));
  return b;
}

function formaHtml(f) {
  const b = el("button", "no");
  b.innerHTML = `<img src="${sprite(f.sprite)}" alt="">` +
    `<span class="n">${f.forma || titulo(f.slug)}</span>` +
    `<span class="ty" style="display:flex;gap:3px;justify-content:center">` +
    (f.tipos || "").split("/").filter(Boolean).map(chip).join("") + `</span>`;
  if (f.capturado) b.classList.add("capturado");
  b.addEventListener("click", () => abrir(f.slug));
  return b;
}

function especialHtml(e, p) {
  const tipos = e.tipo1 ? [e.tipo1, e.tipo2].filter(Boolean) : p.tipos;
  const b = el("div", "no especial");
  b.innerHTML = `<img src="/static/sprites/normal/${e.sprite}" alt="">` +
    `<span class="n">${e.nome}</span>` +
    `<span class="ty" style="display:flex;gap:3px;justify-content:center">` +
    tipos.map(chip).join("") + `</span>`;
  return b;
}

/* ---------------------------------------------------------------- eventos */
const campoQ = document.getElementById("q");
if (campoQ) campoQ.addEventListener("input", filtrar);
const btnOnlyMissing = document.getElementById("onlyMissing");
if (btnOnlyMissing) btnOnlyMissing.addEventListener("click", e => {
  const b = e.currentTarget;
  b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true");
  filtrar();
});
document.getElementById("modal").addEventListener("click", e => {
  if (e.target.id === "modal") e.target.close();   // clique fora fecha
});
document.addEventListener("mousemove", ev => {
  if (arrastandoCaptura === null) return;
  if (!(ev.buttons & 1)) { arrastandoCaptura = null; return; }  // botao foi solto fora da janela
  const alvo = document.elementFromPoint(ev.clientX, ev.clientY);
  const cell = alvo && alvo.closest(".cell");
  if (cell && cell.dataset.slug) definirCaptura(cell.dataset.slug, arrastandoCaptura);
});
document.addEventListener("mouseup", () => {
  arrastandoCaptura = null;
  document.body.classList.remove("arrastando-captura");
});
