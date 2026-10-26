document.documentElement.classList.add("js");
try {
  const saved = localStorage.getItem("loopa-docs-theme");
  document.documentElement.dataset.theme = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
} catch { document.documentElement.dataset.theme = "light"; }
