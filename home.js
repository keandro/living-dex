/* Living Dex — pagina inicial: lista as living dex disponiveis com o progresso de cada uma.
   Cada entrada agrupa uma ou mais Pokedex do banco (ex.: Scarlet & Violet = Paldea + Kitakami +
   Blueberry). */
const LIVING_DEXES = [
  {
    nome: "Scarlet & Violet",
    pagina: "paldea.html",
    jogo: "Paldea, Kitakami, Blueberry",
    pokedexIds: [1, 2, 3],
  },
  {
    nome: "Legends: Z-A",
    pagina: "legends-za.html",
    jogo: "Lumiose, Mega Dimension",
    pokedexIds: [4, 5],
  },
  {
    nome: "Sword & Shield",
    pagina: "sword-shield.html",
    jogo: "Galar, Isle of Armor, Crown Tundra",
    pokedexIds: [6, 7, 8],
  },
];

async function montarHome() {
  const cont = document.getElementById("cardsHome");
  const todas = await api("/pokedex");
  cont.innerHTML = LIVING_DEXES.map(ld => {
    const suas = todas.filter(d => ld.pokedexIds.includes(d.id));
    const total = suas.reduce((s, d) => s + d.total, 0);
    const capturados = suas.reduce((s, d) => s + d.capturados, 0);
    const pct = total ? Math.round(capturados / total * 100) : 0;
    return `
      <a href="${ld.pagina}" class="card-dex">
        <h3>${ld.nome}</h3>
        <span class="jogo">${ld.jogo}</span>
        <div class="prog">
          <div class="track"><i style="width:${pct}%"></i></div>
          <span>${capturados}/${total} · ${pct}%</span>
        </div>
      </a>`;
  }).join("");
}

montarHome().catch(err => {
  document.getElementById("cardsHome").innerHTML =
    `<p class="carregando">Falha ao falar com o servidor: ${err.message}<br>
     Confira se o servidor.py está rodando nesta pasta.</p>`;
});
