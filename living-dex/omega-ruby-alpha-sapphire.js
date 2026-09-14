/* Living Dex — Omega Ruby & Alpha Sapphire (Hoenn (ORAS)). */
iniciarLivingDex(14, [21]).catch(err => {
  document.getElementById("main").innerHTML =
    `<p class="carregando">Falha ao falar com o servidor: ${err.message}<br>
     Confira se o servidor.py está rodando nesta pasta.</p>`;
});
