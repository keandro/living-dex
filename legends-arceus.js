/* Living Dex — Legends: Arceus (Hisui). */
iniciarLivingDex(19, [26]).catch(err => {
  document.getElementById("main").innerHTML =
    `<p class="carregando">Falha ao falar com o servidor: ${err.message}<br>
     Confira se o servidor.py está rodando nesta pasta.</p>`;
});
