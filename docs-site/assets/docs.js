(() => {
  const $ = (selector) => document.querySelector(selector);
  const searchDialog = $("#search-dialog"), input = $("#docs-query"), results = $("#search-results");
  const navDialog = $("#nav-dialog"), themeButton = $("#theme-toggle"), toast = $("#toast");
  let indexPromise, searchRevision = 0, toastTimer;
  const announce = (text) => { toast.textContent = text; toast.classList.add("visible"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("visible"), 2500); };
  const updateTheme = () => themeButton.setAttribute("aria-label", `Switch to ${document.documentElement.dataset.theme === "dark" ? "light" : "dark"} theme`);
  updateTheme();
  themeButton.addEventListener("click", () => {
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("loopa-docs-theme", theme); } catch { /* theme still works for this page */ }
    updateTheme();
  });
  if (/Mac|iPhone|iPad/.test(navigator.platform)) $(".search-trigger kbd").textContent = "⌘ K";
  function message(title, detail) {
    const box = document.createElement("div"); box.className = "search-empty";
    const heading = document.createElement("strong"), p = document.createElement("p");
    heading.textContent = title; p.textContent = detail; box.append(heading, p); results.replaceChildren(box);
  }
  async function search() {
    const revision = ++searchRevision, query = input.value.trim().toLowerCase();
    if (!query) { message("A shortcut to your next answer.", "Try “setup”, “SMTP”, “backups”, or an API route."); return; }
    message("Searching the handbook…", "Finding the most relevant sections.");
    try {
      indexPromise ??= fetch("./search-index.json").then((response) => { if (!response.ok) throw new Error("Search unavailable"); return response.json(); }).catch((error) => { indexPromise = null; throw error; });
      const index = await indexPromise;
      if (revision !== searchRevision) return;
      const terms = query.split(/\s+/);
      const hits = index.map((entry) => {
        const title = `${entry.title} ${entry.page}`.toLowerCase(), text = `${title} ${entry.text}`.toLowerCase();
        return { ...entry, score: terms.every((term) => text.includes(term)) ? terms.reduce((score, term) => score + (title.includes(term) ? 10 : 1), 0) + (title.includes(query) ? 5 : 0) : 0 };
      }).filter((entry) => entry.score).sort((a, b) => b.score - a.score).slice(0, 12);
      if (!hits.length) { message("No matching pages yet.", "Try a shorter phrase, a feature name, or a command such as “npm”."); return; }
      const fragment = document.createDocumentFragment();
      const count = document.createElement("p"); count.className = "search-count"; count.textContent = `${hits.length} matching sections`; fragment.append(count);
      for (const hit of hits) {
        const link = document.createElement("a"), label = document.createElement("span"), title = document.createElement("strong"), snippet = document.createElement("p");
        link.className = "search-result"; link.href = hit.url; label.textContent = hit.page; title.textContent = hit.title;
        const start = Math.max(0, hit.text.toLowerCase().indexOf(terms[0]) - 50);
        snippet.textContent = `${start ? "…" : ""}${hit.text.slice(start, start + 165)}${hit.text.length > start + 165 ? "…" : ""}`;
        link.append(label, title, snippet); link.addEventListener("click", () => searchDialog.close()); fragment.append(link);
      }
      results.replaceChildren(fragment);
    } catch { if (revision === searchRevision) message("Search could not load.", "You can still browse every guide using the navigation. Try your search again in a moment."); }
  }
  const openSearch = () => { if (navDialog.open) navDialog.close(); if (!searchDialog.open) searchDialog.showModal(); input.focus(); search(); };
  document.querySelectorAll("[data-search-open]").forEach((button) => button.addEventListener("click", openSearch));
  input.addEventListener("input", search);
  document.addEventListener("keydown", (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openSearch(); } });
  searchDialog.addEventListener("keydown", (event) => {
    const links = [...results.querySelectorAll("a")], current = links.indexOf(document.activeElement);
    if (event.key === "ArrowDown" && links.length) { event.preventDefault(); links[Math.min(current + 1, links.length - 1)].focus(); }
    if (event.key === "ArrowUp") { event.preventDefault(); current > 0 ? links[current - 1].focus() : input.focus(); }
    if (event.key === "Enter" && document.activeElement === input && links[0]) { event.preventDefault(); links[0].click(); }
  });
  $("#nav-open").addEventListener("click", () => navDialog.showModal());
  document.querySelectorAll("[data-dialog-close]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
  for (const dialog of [searchDialog, navDialog]) dialog.addEventListener("click", (event) => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  document.querySelectorAll(".copy-button").forEach((button) => button.addEventListener("click", async () => {
    const text = button.closest(".code-block").querySelector("code").textContent;
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else { const field = document.createElement("textarea"); field.value = text; field.style.position = "fixed"; field.style.opacity = "0"; document.body.append(field); field.select(); const copied = document.execCommand("copy"); field.remove(); button.focus(); if (!copied) throw new Error("Copy unavailable"); }
      button.querySelector("span").textContent = "Copied!"; announce("Commands copied to your clipboard.");
      setTimeout(() => { button.querySelector("span").textContent = "Copy"; }, 2000);
    } catch { announce("Copy was blocked. Select the code and copy it manually."); }
  }));
  const tocLinks = [...document.querySelectorAll(".toc nav a")];
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) tocLinks.forEach((link) => { if (link.hash === `#${visible.target.id}`) link.setAttribute("aria-current", "location"); else link.removeAttribute("aria-current"); });
    }, { rootMargin: "-90px 0px -65% 0px" });
    document.querySelectorAll(".prose h2").forEach((heading) => observer.observe(heading));
  }
})();
