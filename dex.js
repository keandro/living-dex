/* Living Dex — Paldea (Scarlet & Violet + Kitakami + Blueberry). */
iniciarLivingDex(1, [1, 2, 3]).catch(err => {
  document.getElementById("main").innerHTML =
    `<p class="carregando">Falha ao falar com o servidor: ${err.message}<br>
     Confira se o servidor.py está rodando nesta pasta.</p>`;
});
