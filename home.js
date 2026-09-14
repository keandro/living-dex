/* Living Dex — pagina inicial: lista as living dex disponiveis com o progresso de cada uma.
   Cada entrada agrupa uma ou mais Pokedex do banco (ex.: Scarlet & Violet = Paldea + Kitakami +
   Blueberry). */
const LIVING_DEXES = [
  {
    nome: "Red, Blue & Yellow",
    pagina: "red-blue-yellow.html",
    jogo: "Kanto (RBY)",
    pokedexIds: [13],
  },
  {
    nome: "Gold, Silver & Crystal",
    pagina: "gold-silver-crystal.html",
    jogo: "Johto (GSC)",
    pokedexIds: [14],
  },
  {
    nome: "Ruby, Sapphire & Emerald",
    pagina: "ruby-sapphire-emerald.html",
    jogo: "Hoenn (RSE)",
    pokedexIds: [15],
  },
  {
    nome: "FireRed & LeafGreen",
    pagina: "firered-leafgreen.html",
    jogo: "Kanto (FRLG)",
    pokedexIds: [16],
  },
  {
    nome: "Diamond & Pearl",
    pagina: "diamond-pearl.html",
    jogo: "Sinnoh (D/P)",
    pokedexIds: [17],
  },
  {
    nome: "Platinum",
    pagina: "platinum.html",
    jogo: "Sinnoh (Pt)",
    pokedexIds: [18],
  },
  {
    nome: "HeartGold & SoulSilver",
    pagina: "heartgold-soulsilver.html",
    jogo: "Johto",
    pokedexIds: [12],
  },
  {
    nome: "Black & White",
    pagina: "black-white.html",
    jogo: "Unova (B/W)",
    pokedexIds: [19],
  },
  {
    nome: "Black 2 & White 2",
    pagina: "black-white-2.html",
    jogo: "Unova (B2/W2)",
    pokedexIds: [20],
  },
  {
    nome: "X & Y",
    pagina: "x-y.html",
    jogo: "Central Kalos, Coastal Kalos, Mountain Kalos",
    pokedexIds: [9, 10, 11],
  },
  {
    nome: "Omega Ruby & Alpha Sapphire",
    pagina: "omega-ruby-alpha-sapphire.html",
    jogo: "Hoenn (ORAS)",
    pokedexIds: [21],
  },
  {
    nome: "Sun & Moon",
    pagina: "sun-moon.html",
    jogo: "Alola (S/M)",
    pokedexIds: [22],
  },
  {
    nome: "Ultra Sun & Ultra Moon",
    pagina: "ultra-sun-ultra-moon.html",
    jogo: "Alola (USUM)",
    pokedexIds: [23],
  },
  {
    nome: "Let's Go, Pikachu & Eevee",
    pagina: "lets-go-pikachu-eevee.html",
    jogo: "Kanto (LGPE)",
    pokedexIds: [24],
  },
  {
    nome: "Sword & Shield",
    pagina: "sword-shield.html",
    jogo: "Galar, Isle of Armor, Crown Tundra",
    pokedexIds: [6, 7, 8],
  },
  {
    nome: "Brilliant Diamond & Shining Pearl",
    pagina: "brilliant-diamond-shining-pearl.html",
    jogo: "Sinnoh (BDSP)",
    pokedexIds: [25],
  },
  {
    nome: "Legends: Arceus",
    pagina: "legends-arceus.html",
    jogo: "Hisui",
    pokedexIds: [26],
  },
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
