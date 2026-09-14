/* Living Dex — Sword & Shield (Galar + Isle of Armor + Crown Tundra). */
iniciarLivingDex(3, [6, 7, 8]).catch(err => {
  document.getElementById("main").innerHTML =
    `<p class="carregando">Falha ao falar com o servidor: ${err.message}<br>
     Confira se o servidor.py está rodando nesta pasta.</p>`;
});
