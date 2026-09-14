/* Living Dex — Let's Go, Pikachu & Eevee (Kanto (LGPE)). */
iniciarLivingDex(17, [24]).catch(err => {
  document.getElementById("main").innerHTML =
    `<p class="carregando">Falha ao falar com o servidor: ${err.message}<br>
     Confira se o servidor.py está rodando nesta pasta.</p>`;
});
