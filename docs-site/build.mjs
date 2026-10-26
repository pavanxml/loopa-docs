import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";
import { pages, repository, applicationRepository } from "./config.mjs";
import { icon } from "./icons.mjs";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const output = path.join(root, "public/docs");
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const plain = (value) => value.replace(/<[^>]*>/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[`*_#]/g, "");
const slugify = (value) => plain(value).toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/ /g, "-");
const href = (page) => `./${page.slug}.html`;
const codeBlock = (text, language = "sh") => `<div class="code-block"><div class="code-top"><span><span class="terminal-dot"></span>${escape(({ sh: "Terminal", powershell: "PowerShell", json: "JSON", dotenv: ".env", text: "Reference" })[language] ?? language)}</span><button class="copy-button" aria-label="Copy code">${icon("copy")}<span>Copy</span></button></div><pre><code>${escape(text)}</code></pre></div>`;

function navigation(active) {
  return [...new Set(pages.map((p) => p.group))].map((group) => `<div class="nav-group"><p>${group}</p>${pages.filter((p) => p.group === group).map((p) => `<a href="${href(p)}" ${p.slug === active ? 'aria-current="page"' : ""}>${icon(p.icon)}<span>${p.label}</span>${p.slug === "api" ? '<span class="nav-badge">API</span>' : ""}</a>`).join("")}</div>`).join("");
}

function home() {
  return `<div class="home-intro"><div class="eyebrow"><span class="status-dot"></span> THE LOOPA HANDBOOK</div><h1>A little guidance.<br><span>A lot of possibility.</span></h1><p>Your space for people, ideas, and everything in between.<br class="desktop-break"> Let’s get your Loop up and running.</p><div class="hero-actions"><a class="button primary" href="./setup.html">Start building ${icon("arrow")}</a><a class="text-link" href="./user-guide.html">Explore the app ${icon("arrow")}</a></div><div class="orbit-art" aria-hidden="true"><div class="orbit-line one"></div><div class="orbit-line two"></div><div class="orbit-core">${icon("orbit")}</div><span class="orbit-point p1">${icon("code")}</span><span class="orbit-point p2">${icon("database")}</span><span class="orbit-point p3">${icon("compass")}</span></div></div>
  <section class="quickstart"><div class="section-heading"><div><span class="eyebrow">FROM ZERO TO YOUR FIRST DROP</span><h2 id="quick-start">Your next five commands.</h2></div><span class="pill">Node.js 24</span></div>${codeBlock("git clone https://github.com/pavanxml/loopa.git\ncd loopa\nnpm ci\nnpm run setup\nnpm run dev")}<div class="quick-note">${icon("info")}<span>Open <a href="http://localhost:3000">localhost:3000</a>, create an account, and make yourself at home.</span><a href="./setup.html">Full setup guide ${icon("arrow")}</a></div></section>
  <section class="path-section"><div class="section-heading"><div><span class="eyebrow">CHOOSE YOUR NEXT STEP</span><h2 id="explore">A place for every question.</h2></div></div><div class="path-grid">${[
    ["compass", "Get to know LOOPA", "Drops, Sparks, Whispers. Find your way around your new social space.", "user-guide"],
    ["layers", "Look under the hood", "Follow the path from a browser request to the database and back.", "architecture"],
    ["rocket", "Ready for the world?", "Set up hosting, email, and backups before welcoming your people.", "deployment"],
  ].map(([i, title, description, page]) => `<a class="path-card" href="./${page}.html"><span class="card-icon">${icon(i)}</span><h3>${title}</h3><p>${description}</p><span class="card-arrow">Read the guide ${icon("arrow")}</span></a>`).join("")}</div></section>
  <section class="stack-strip"><div><span class="eyebrow">FAMILIAR TOOLS. ONE CONNECTED APP.</span><h2>Small enough to understand.<br>Yours to build on.</h2></div><div class="stack-tags"><span>Next.js</span><span>React</span><span>TypeScript</span><span>Tailwind CSS</span><span>SQLite</span></div></section>
  <aside class="callout">${icon("info")}<div><strong>A note before you go live</strong><p>LOOPA supports multiple accounts on one persistent host. See <a href="./limitations.html">current limitations</a> and the <a href="./deployment.html">deployment guide</a> to understand what is ready and what needs more work.</p></div></aside>`;
}

function layout(page, body, headings, minutes) {
  const index = pages.indexOf(page), previous = pages[index - 1], next = pages[index + 1];
  const nav = navigation(page.slug);
  const brand = `<a class="brand" href="./index.html" aria-label="LOOPA documentation home"><span class="brand-mark">${icon("orbit")}</span><span>loopa<span class="brand-dot">.</span></span><span class="brand-divider"></span><span class="brand-docs">docs</span></a>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(page.label)} · LOOPA Docs</title><meta name="description" content="${escape(page.description)}"><meta name="theme-color" content="#7764e8"><link rel="icon" href="./assets/favicon.svg" type="image/svg+xml"><script src="./assets/theme.js"></script><link rel="stylesheet" href="./assets/docs.css"><script src="./assets/docs.js" defer></script></head><body>
  <a class="skip-link" href="#main">Skip to content</a><header class="header">${brand}<button class="search-trigger" data-search-open>${icon("search")}<span>Search the docs...</span><kbd>Ctrl K</kbd></button><div class="header-actions"><a class="github-link" href="${repository}" target="_blank" rel="noopener noreferrer">${icon("github")}<span>GitHub</span>${icon("external")}</a><span class="header-divider"></span><button class="icon-button" id="theme-toggle" aria-label="Switch to dark theme">${icon("sun")}</button><button class="icon-button mobile-menu" id="nav-open" aria-label="Open navigation">${icon("menu")}</button></div></header>
  <aside class="sidebar"><nav aria-label="Documentation">${nav}</nav><a class="sidebar-bottom" href="./docs-site.html"><span class="mini-icon">${icon("book")}</span><span><strong>These docs travel, too.</strong><small>Host them anywhere ${icon("arrow")}</small></span></a><div class="sidebar-footer"><span class="status-dot"></span> Built for your next idea</div></aside>
  <div class="page-layout ${page.slug === "index" ? "is-home" : ""}"><main id="main" tabindex="-1"><div class="breadcrumbs"><span>Documentation</span><span>/</span><strong>${escape(page.label)}</strong></div>${page.slug === "index" ? body : `<header class="article-header"><div class="eyebrow">${escape(page.group)}</div><h1>${escape(page.title)}</h1><p>${escape(page.description)}</p><div class="article-meta">${icon("book")} ${minutes} min read <span>·</span> LOOPA handbook</div></header><article class="prose">${body}</article><nav class="page-pagination" aria-label="Adjacent guides">${previous ? `<a href="${href(previous)}"><small>← Previous</small><strong>${previous.label}</strong></a>` : "<span></span>"}${next ? `<a href="${href(next)}"><small>Next →</small><strong>${next.label}</strong></a>` : ""}</nav>`}<footer class="page-footer"><span>Made for the people building their own Loop.</span><a href="${repository}/blob/main/docs/${page.file}" target="_blank" rel="noopener noreferrer">View source ${icon("external")}</a></footer></main>${page.slug === "index" ? "" : `<aside class="toc"><div>ON THIS PAGE</div><nav aria-label="On this page">${headings.filter((h) => h.depth === 2).map((h) => `<a href="#${h.id}">${escape(h.text)}</a>`).join("")}</nav><a class="toc-top" href="#main">Back to top ↑</a></aside>`}</div>
  <dialog class="search-dialog" id="search-dialog" aria-labelledby="search-label"><div class="search-dialog-top">${icon("search")}<label class="sr-only" id="search-label" for="docs-query">Search documentation</label><input id="docs-query" type="search" placeholder="What are you looking for?" autocomplete="off"><button class="icon-button" data-dialog-close aria-label="Close search">${icon("close")}</button></div><div class="search-results" id="search-results" aria-live="polite"></div><div class="search-footer"><span>Search across the entire handbook</span><span><kbd>esc</kbd> to close</span></div></dialog>
  <dialog class="nav-dialog" id="nav-dialog" aria-label="Documentation navigation"><div class="nav-dialog-header">${brand}<button class="icon-button" data-dialog-close aria-label="Close navigation">${icon("close")}</button></div><nav aria-label="Mobile documentation">${nav}</nav></dialog><div class="toast" id="toast" role="status" aria-live="polite"></div><noscript><div class="noscript-note">All guides are available without JavaScript. Use the navigation links to browse; search and copy controls need JavaScript.</div></noscript></body></html>`;
}

export async function buildDocs() {
  await fs.mkdir(path.join(output, "assets"), { recursive: true });
  const search = [];
  for (const page of pages) {
    const source = await fs.readFile(path.join(root, "docs", page.file), "utf8");
    const content = source.replace(/^# .+\r?\n/, "").replace(/^\[Documentation index\]\(README.md\)\r?\n/m, "");
    const headings = [], ids = new Map();
    let current = { title: page.label, url: href(page), text: page.description, page: page.label };
    const parser = new Marked({ gfm: true, renderer: {
      heading({ tokens, depth, text }) {
        const base = slugify(text), count = ids.get(base) ?? 0;
        ids.set(base, count + 1);
        const id = count ? `${base}-${count}` : base;
        headings.push({ id, depth, text: plain(text) });
        search.push(current);
        current = { title: plain(text), url: `${href(page)}#${id}`, text: "", page: page.label };
        return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}<a class="heading-link" href="#${id}" aria-label="Link to ${escape(plain(text))}">#</a></h${depth}>`;
      },
      code({ text, lang }) { current.text += ` ${text}`; return codeBlock(text, lang || "text"); },
      paragraph({ tokens, text }) { current.text += ` ${plain(text)}`; return `<p>${this.parser.parseInline(tokens)}</p>`; },
      html({ text }) { return escape(text); },
    }, walkTokens(token) {
      if (token.type === "link" || token.type === "image") {
        const url = token.href;
        if (url.startsWith("assets/")) { token.href = `./${url}`; return; }
        if (url.startsWith("#") || /^https?:\/\//.test(url)) return;
        if (/^[a-z]+:/i.test(url)) { token.href = "#"; return; }
        const [target, anchor] = url.split("#");
        const doc = pages.find((p) => p.file === target);
        token.href = doc ? `${href(doc)}${anchor ? `#${anchor}` : ""}` : `${applicationRepository}/${target === "../src/app/api" ? "tree" : "blob"}/main/${target.replace(/^\.\.\//, "")}${anchor ? `#${anchor}` : ""}`;
      }
    } });
    let body = parser.parse(content);
    body = body.replace(/<table>/g, '<div class="table-scroll" role="region" aria-label="Reference table" tabindex="0"><table>').replace(/<\/table>/g, "</table></div>").replace(/<td>(GET|POST|PATCH|DELETE)<\/td>/g, (_, method) => `<td><span class="method ${method.toLowerCase()}">${method}</span></td>`);
    search.push(current);
    // Index complete sections, including table rows/list text, without relying on render order.
    const sections = content.split(/(?=^#{2,6} )/m);
    for (const section of sections) {
      const title = /^#{2,6} (.+)/.exec(section)?.[1];
      search.push({ page: page.label, title: title ? plain(title) : page.label, url: `${href(page)}${title ? `#${slugify(title)}` : ""}`, text: plain(section).replace(/\s+/g, " ").trim() });
    }
    await fs.writeFile(path.join(output, `${page.slug}.html`), layout(page, page.slug === "index" ? home() : body, headings, Math.max(1, Math.ceil(source.split(/\s+/).length / 220))));
  }
  // Only the explicit guide list and these presentation assets enter the public bundle.
  for (const file of ["docs.css", "docs.js", "theme.js", "favicon.svg"]) await fs.copyFile(path.join(root, "docs-site/assets", file), path.join(output, "assets", file));
  for (const file of ["architecture.svg", "database.svg"]) await fs.copyFile(path.join(root, "docs/assets", file), path.join(output, "assets", file));
  const unique = [...new Map(search.filter((s) => !s.url.startsWith("./index.html#")).map((s) => [s.url, s])).values()];
  await fs.writeFile(path.join(output, "search-index.json"), JSON.stringify(unique));
  console.log(`Built ${pages.length} documentation pages → public/docs`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildDocs();
