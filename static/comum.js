/* Living Dex — compartilhado entre todas as paginas: chamada da API e o botao de tema. */

const api = async (r, opt) => {
  const res = await fetch("/api" + r, opt);
  if (!res.ok) throw new Error(r + " → " + res.status);
  return res.json();
};

(function () {
  const btn = document.getElementById("tema");
  if (!btn) return;
  function pintar() {
    const escuro = document.documentElement.dataset.theme === "dark";
    btn.textContent = escuro ? "☀️" : "🌙";
    btn.setAttribute("aria-pressed", String(escuro));
  }
  btn.addEventListener("click", () => {
    const escuro = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = escuro ? "dark" : "light";
    try { localStorage.setItem("tema", document.documentElement.dataset.theme); } catch (e) {}
    pintar();
  });
  pintar();
})();
