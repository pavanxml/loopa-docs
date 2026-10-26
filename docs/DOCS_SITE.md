# Publish the documentation

[Documentation index](README.md)

The handbook is a separate static website generated from the Markdown guides in `docs/`. It includes full-text section search, copy buttons, a page outline, mobile navigation, and a saved light/dark preference. Readers do not need an account.

## Preview the docs

Clone this documentation repository, using Node.js 24:

```sh
git clone https://github.com/pavanxml/loopa-docs.git
cd loopa-docs
npm ci
npm run dev
```

Open http://localhost:4173. Markdown and presentation assets rebuild when edited; refresh the browser to see changes. Restart the command after changing the generator or navigation configuration. Press **Ctrl+C** to stop.

To preview on another port in PowerShell:

```powershell
$env:DOCS_PORT = '4174'
npm run docs:preview
```

After stopping the preview, clear that shell setting with `Remove-Item Env:DOCS_PORT`. Linux/WSL equivalent:

```sh
DOCS_PORT=4174 npm run docs:preview
```

## Build a deployable website

```sh
npm run build
```

The output is **`public/docs/`**. It contains `index.html`, the guide pages, CSS, JavaScript, diagrams, and a search index. Upload the **contents of that directory** to a static host's publish directory. Keep the `assets/` directory and `search-index.json` beside the HTML pages.

| Static host setting | Value |
| --- | --- |
| Project root | The directory containing this repository's `package.json` |
| Build Node version | 24 |
| Install command | `npm ci` (include development dependencies) |
| Build command | `npm run build` |
| Publish/output directory | `public/docs` |
| Start command | None; serve static files |
| Entry page | `index.html` |
| Runtime environment variables | None for the documentation |

All website links and assets are relative, so the output works at a domain root or a subdirectory. Preserve the `.html` URLs and serve the directory's `index.html` for its root. An SPA fallback/rewrite is unnecessary. Use an HTTP/HTTPS static server rather than opening files directly: browser search fetches the local search index.

The docs need no SQLite, SMTP, or application secrets. Only the explicit list of guides and presentation assets is included in the build. Do not upload the whole repository, `.env`, or `.data` as the documentation's public directory.

## The application repository's docs route

The separate [application repository](https://github.com/pavanxml/loopa) has a companion docs integration in the local application changes: its `npm run dev` and `npm run build` commands build the documentation first, and `/docs` forwards to `/docs/index.html`. That integration must be committed to the application repository separately; this docs repository does not install or update the social app.

The documentation uses its own static styles and theme preference. The application still requires its normal runtime configuration, persistent database, and media storage. Hosting only these docs does not deploy the application; follow [Deploy the app](DEPLOYMENT.md) for that.

## Make an upload ZIP

After building, PowerShell can package only the public documentation:

```powershell
$loopaDocsArchive = Join-Path (Split-Path (Get-Location).Path -Parent) ('loopa-docs-site-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.zip')
Compress-Archive -Path 'public/docs/*' -DestinationPath $loopaDocsArchive -ErrorAction Stop
```

Extract the ZIP so `index.html` is at the static site's root. Some hosts accept a folder or ZIP upload; others require a repository build. Use the equivalent publish-directory settings for your chosen host. GitHub Pages requires its own Pages publishing configuration; committing the Markdown alone does not publish this generated website.

## Edit and verify

Edit content in `docs/*.md`. Navigation titles/groups are in `docs-site/config.mjs`; presentation is in `docs-site/assets/`; the build generator is `docs-site/build.mjs`. Diagrams live in `docs/assets/`. Avoid editing `public/docs/` directly because it is generated and ignored by Git.

```sh
npm run docs:build
npm run docs:test
```

Browser checks use installed Google Chrome by default. For the Playwright Chromium alternative, follow [the browser setup instructions](DEVELOPMENT.md#local-checks). The docs tests run a static preview on port 4173 and do not need an application database or login.

Commit the Markdown, docs-site source, scripts/configuration, and package changes. The website's “View source” links point to `pavanxml/loopa-docs` on `main`; application implementation references point to `pavanxml/loopa`. The `docs:*` command aliases are also available in this repository.
