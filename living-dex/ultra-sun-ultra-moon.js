/* Living Dex — Ultra Sun & Ultra Moon (Alola (USUM)). */
iniciarLivingDex(16, [23]).catch(err => {
  document.getElementById("main").innerHTML =
    `<p class="carregando">Falha ao falar com o servidor: ${err.message}<br>
     Confira se o servidor.py está rodando nesta pasta.</p>`;
});
