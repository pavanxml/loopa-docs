# LOOPA Docs

The standalone documentation website for [LOOPA](https://github.com/pavanxml/loopa), with searchable guides, copyable commands, mobile navigation, light/dark themes, diagrams, and an API reference.

This repository contains the documentation website. To run the social application, use the [application repository](https://github.com/pavanxml/loopa) and its setup guide.

## Run locally

Use Node.js 24 and npm:

```sh
git clone https://github.com/pavanxml/loopa-docs.git
cd loopa-docs
npm ci
npm run dev
```

Open http://localhost:4173. The preview watches Markdown and presentation assets; refresh the browser after an edit. Restart it after changing the generator or navigation configuration. No database, login, application server, or secret configuration is required.

## Build and deploy

```sh
npm ci
npm run build
```

Publish the contents of **`public/docs/`** to a static website host. The directory contains `index.html`, the guide pages, assets, and `search-index.json`.

| Setting | Value |
| --- | --- |
| Node version | 24 |
| Install command | `npm ci` (include development dependencies) |
| Build command | `npm run build` |
| Output directory | `public/docs` |
| Runtime/start command | None |
| Environment variables | None required |

Relative links support hosting at a domain root or a subdirectory. Keep the HTML files, assets, and search index together. Use HTTP/HTTPS hosting rather than opening files directly, because search fetches its index. GitHub Pages must be configured separately; pushing this source does not automatically deploy a website.

See [publishing the documentation](docs/DOCS_SITE.md) for more commands, preview options, and packaging instructions.

## Edit the handbook

- [Guide index](docs/README.md): all application guides.
- `docs/*.md`: application documentation and publishing instructions.
- `docs/assets/`: diagrams.
- `docs-site/config.mjs`: navigation, titles, and source repository URLs.
- `docs-site/assets/`: styles, browser interactions, and icons.
- `docs-site/build.mjs`: Markdown-to-HTML generator.
- `docs-site/serve.mjs`: local preview server.

The generated `public/docs/` directory is ignored by Git; build it after cloning. Application source links point to `pavanxml/loopa`, while the site's GitHub and “View source” links point to this repository.

## Verify

```sh
npm run build
npm test
```

Tests use installed Google Chrome by default and an isolated static server on port 4173. They check every page, local link, asset, search anchor, clipboard copying, keyboard search, saved theme, mobile navigation, and reading without JavaScript.

If Chrome is unavailable, install Playwright Chromium:

```sh
npx playwright install chromium
```

Linux/WSL:

```sh
PLAYWRIGHT_CHANNEL=chromium npm test
```

PowerShell:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chromium'
npm test
Remove-Item Env:PLAYWRIGHT_CHANNEL
```

The docs describe the application's current capabilities and [limitations](docs/LIMITATIONS.md). Deploying this static site does not deploy the social app or its database.
