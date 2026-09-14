/* Living Dex — Brilliant Diamond & Shining Pearl (Sinnoh (BDSP)). */
iniciarLivingDex(18, [25]).catch(err => {
  document.getElementById("main").innerHTML =
    `<p class="carregando">Falha ao falar com o servidor: ${err.message}<br>
     Confira se o servidor.py está rodando nesta pasta.</p>`;
});
