/* Living Dex — X & Y (Central Kalos + Coastal Kalos + Mountain Kalos). */
iniciarLivingDex(4, [9, 10, 11]).catch(err => {
  document.getElementById("main").innerHTML =
    `<p class="carregando">Falha ao falar com o servidor: ${err.message}<br>
     Confira se o servidor.py está rodando nesta pasta.</p>`;
});
