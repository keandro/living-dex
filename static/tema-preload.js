/* Aplica o tema salvo antes da primeira renderizacao, pra nao dar flash de tema errado.
   Carregado sem defer/async de proposito: precisa rodar antes do CSS pintar a pagina. */
(function () {
  try {
    var t = localStorage.getItem("tema");
    if (!t) t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = t;
  } catch (e) {}
})();
