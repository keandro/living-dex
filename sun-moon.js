/* Living Dex — Sun & Moon (Alola (S/M)). */
iniciarLivingDex(15, [22]).catch(err => {
  document.getElementById("main").innerHTML =
    `<p class="carregando">Falha ao falar com o servidor: ${err.message}<br>
     Confira se o servidor.py está rodando nesta pasta.</p>`;
});
