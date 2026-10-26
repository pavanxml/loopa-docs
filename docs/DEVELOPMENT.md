# Development and testing

[Documentation index](README.md)

These instructions are for the [LOOPA application repository](https://github.com/pavanxml/loopa). To build or host this separate documentation website, use [Publish these docs](DOCS_SITE.md).

## Project layout

```text
src/app/                 App Router pages and layouts
src/app/(app)/           Social application screens (route group adds no URL segment)
src/app/api/             Backend HTTP route handlers
src/components/          Shared navigation, composer, media, cards, and UI
src/lib/                 Database, sessions, validation, access rules, ranking, clients
src/services/            Storage, SMTP, OAuth, realtime, heuristic compose assistance
src/types/               Shared TypeScript contracts
scripts/                 Setup, build, startup checks, mail worker, E2E server
tests/                   Vitest unit/integration suites
e2e/                     Playwright flows and small video fixture
prisma/seed.ts           Optional development seed using the SQLite runtime
prisma/schema.prisma     Legacy schema reference
docs/                    Application documentation and legacy PostgreSQL DDL
.data/                   Local database/media/test artifacts (ignored by Git)
```

## npm command reference

Run commands in the directory containing `package.json`.

| Command | Purpose |
| --- | --- |
| `npm ci` | Install exact lockfile dependency versions |
| `npm run setup` | Create private `.env` with a random secret if absent |
| `npm run dev` | Start Turbopack development server, normally on port 3000 |
| `npm run dev -- --port 3001` | Alternate port; update `APP_URL` to match first |
| `npm run db:seed` | Optional empty development database demo data |
| `npm run typecheck` | TypeScript check without emitted files |
| `npm run lint` | Alias for the same TypeScript check; no separate ESLint pass |
| `npm test` | Run Vitest suites |
| `npm run test:watch` | Vitest watch mode |
| `npm run build` | Build production bundle with build-worker SQLite set to memory |
| `npm start` | Validate production settings, then start the built server |
| `npm run mail:worker` | Continuous mail delivery worker loading `.env` |
| `npm run mail:worker -- --once` | One mail delivery batch |
| `npm run test:e2e` | Playwright against an isolated server on port 3100 |
| `npm run docs:dev` | Build/watch the docs and serve them on port 4173 |
| `npm run docs:build` | Generate the static documentation in `public/docs` |
| `npm run docs:preview` | Build and serve the static docs without watching |
| `npm run docs:test` | Test documentation navigation, search, copy controls, and mobile layout |
| `npm audit` | Check currently reported dependency advisories |

Legacy commands retained in `package.json`: `db:generate`, `db:generate:real`, `db:push`, `db:migrate`, `db:studio`. They invoke Prisma and are not the runtime SQLite setup/migration workflow. `db:seed` is the exception: it imports the SQLite database directly.

## Local checks

```sh
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The normal Vitest configuration uses in-memory SQLite and a test-only JWT secret. Suites cover validation/ranking/password hashing, route flows, authorization, sessions, uploads, search, communities/events, connections, OAuth using a local stand-in provider, and mail delivery using a local SMTP server. The PostgreSQL DDL suite checks a legacy reference; it does not validate a live PostgreSQL backend.

Playwright uses installed **Google Chrome** by default. If Chrome is absent, install the bundled Chromium browser:

```sh
npx playwright install chromium
```

Then select it for the test command. Linux/WSL:

```sh
PLAYWRIGHT_CHANNEL=chromium npm run test:e2e
```

PowerShell:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chromium'
npm run test:e2e
Remove-Item Env:PLAYWRIGHT_CHANNEL
```

Browser dependencies must be installed in the environment that runs Playwright. A Windows Chrome installation does not automatically supply a Linux/WSL browser.

## Test the production bundle

Build first. Linux/WSL:

```sh
npm run build
E2E_PRODUCTION=1 npm run test:e2e
```

PowerShell:

```powershell
npm run build
$env:E2E_PRODUCTION = '1'
npm run test:e2e
Remove-Item Env:E2E_PRODUCTION
```

If using bundled Chromium, also set `PLAYWRIGHT_CHANNEL` as above. The test harness starts Next directly with isolated test settings; it does not exercise the production `npm start` environment guard or prove live SMTP delivery.

## Test isolation and evidence

| Mode | Build directory | Data |
| --- | --- | --- |
| Local development | `.next-dev` | Configured SQLite/media paths |
| Production build/start | `.next` | Build workers use memory; server uses configured persistent paths |
| E2E development | `.next-e2e-turbo` | New `.data/e2e-<uuid>.db` and `.data/e2e-media-<uuid>` |
| E2E production | Existing `.next` | New isolated E2E database/media |

The E2E harness reserves port 3100 and does not reuse an existing server. It runs one worker and stores failure screenshots/traces under the ignored test output directory. Temporary E2E data remains under `.data`; clean only identified test artifacts after their processes stop, preserving the live database and uploads.

The five browser flows cover a photo Drop with interactions/share, private follow approval, two-browser live messaging/replies/deletion, mobile navigation/Sparks/profile layout, and real video playback/protected-media behavior. Test coverage is not proof of production capacity, live OAuth provider compatibility, or complete feature parity.

## Working on a change

Use shared Zod validation and server-side access helpers; client-side hiding is not authorization. Preserve the API envelope and use `apiClient`/`uploadClient` for cookie refresh and request headers. Keep database writes synchronous within `transaction()`, preserve media ownership checks, and update documentation when routes/configuration change.

Run checks relevant to the change and inspect `git diff` before committing. Keep `.env`, `.data`, uploads, dependencies, build caches, and logs out of Git. A normal source contribution can be committed and pushed from either PowerShell or Linux/WSL:

```sh
git status --short
git diff
git add README.md docs
git diff --cached
git commit -m "Document Loopa setup, features, API, and deployment"
git push origin HEAD
```

These example Git commands stage **documentation only** and push the current branch. Substitute the intended source paths/message for another change. GitHub write access must already be configured; inspect staged content before committing.
