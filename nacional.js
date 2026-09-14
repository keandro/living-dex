/* Living Dex — Pokédex Nacional: consulta o catálogo inteiro, sem captura nem caixas. */
iniciarCatalogo().catch(err => {
  document.getElementById("main").innerHTML =
    `<p class="carregando">Falha ao falar com o servidor: ${err.message}<br>
     Confira se o servidor.py está rodando nesta pasta.</p>`;
});
