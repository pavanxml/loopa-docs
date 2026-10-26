import http from "node:http";
import fs from "node:fs/promises";
import { watch } from "node:fs";
import path from "node:path";
import { buildDocs, output, root } from "./build.mjs";

await buildDocs();
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml" };
const server = http.createServer(async (request, response) => {
  try {
    if (!["GET", "HEAD"].includes(request.method)) { response.writeHead(405); response.end(); return; }
    let pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    const file = path.resolve(output, `.${pathname}`);
    if (!file.startsWith(output + path.sep)) { response.writeHead(403); response.end("Forbidden"); return; }
    const bytes = await fs.readFile(file);
    response.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    response.end(request.method === "HEAD" ? undefined : bytes);
  } catch { response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); response.end("Page not found. Return to /index.html to browse LOOPA Docs."); }
});
const port = Number(process.env.DOCS_PORT || 4173);
server.listen(port, "127.0.0.1", () => console.log(`LOOPA Docs: http://localhost:${port}`));
server.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
const watchers = [];
if (process.argv.includes("--watch")) {
  let timer, building = false, pending = false;
  const rebuild = async () => { if (building) { pending = true; return; } building = true; try { await buildDocs(); } catch (error) { console.error(error.message); } finally { building = false; if (pending) { pending = false; await rebuild(); } } };
  for (const directory of ["docs", "docs/assets", "docs-site", "docs-site/assets"]) watchers.push(watch(path.join(root, directory), () => { clearTimeout(timer); timer = setTimeout(rebuild, 150); }));
  console.log("Watching guide and presentation files. Refresh the browser after changes. Restart for generator/config changes.");
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { for (const watcher of watchers) watcher.close(); server.close(() => process.exit(0)); });
