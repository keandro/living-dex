/* Living Dex — Black 2 & White 2 (Unova (B2/W2)). */
iniciarLivingDex(13, [20]).catch(err => {
  document.getElementById("main").innerHTML =
    `<p class="carregando">Falha ao falar com o servidor: ${err.message}<br>
     Confira se o servidor.py está rodando nesta pasta.</p>`;
});
