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

/* menu lateral em gaveta no celular */
(function () {
  const btn = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (!btn || !sidebar || !backdrop) return;

  function fechar() {
    sidebar.classList.remove("aberta");
    backdrop.classList.remove("ativo");
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = "☰";
  }
  function abrir() {
    sidebar.classList.add("aberta");
    backdrop.classList.add("ativo");
    btn.setAttribute("aria-expanded", "true");
    btn.textContent = "✕";
  }
  btn.addEventListener("click", () => {
    sidebar.classList.contains("aberta") ? fechar() : abrir();
  });
  backdrop.addEventListener("click", fechar);
  sidebar.addEventListener("click", ev => {
    if (ev.target.closest("a")) fechar();
  });
  document.addEventListener("keydown", ev => {
    if (ev.key === "Escape") fechar();
  });
})();
