# LOOPA documentation

These guides describe the [LOOPA application](https://github.com/pavanxml/loopa), reviewed against its source on **26 October 2026**. The active application stack is **Next.js, React, TypeScript, Tailwind CSS, and SQLite through Node.js**. The backend is implemented as Next.js route handlers. This separate repository contains the documentation website; see [publishing the docs](DOCS_SITE.md) to run it independently.

## Choose a guide

| Guide | What it covers |
| --- | --- |
| [Setup and commands](SETUP.md) | Clone, install, run, optional demo data, configuration, laptop transfer, and common startup problems |
| [User guide](USER_GUIDE.md) | Accounts, Drops, Sparks, Flicks, Whispers, privacy, and navigation |
| [Architecture](ARCHITECTURE.md) | How the frontend, backend, database, media storage, and workers fit together |
| [Database reference](DATABASE.md) | Runtime schema, table responsibilities, relationships, and schema changes |
| [API reference](API.md) | HTTP methods, routes, authentication, request examples, uploads, and live messaging |
| [Deployment and operations](DEPLOYMENT.md) | Production commands, persistent storage, email, backups, restoration, and health checks |
| [Publish these docs](DOCS_SITE.md) | Preview, build, and deploy the static documentation website |
| [Development and testing](DEVELOPMENT.md) | Project structure, npm commands, test isolation, and contribution workflow |
| [Current limitations](LIMITATIONS.md) | Incomplete workflows and areas requiring further validation |

## First run

Install Git and Node.js 24, then run these commands in PowerShell or a Linux/WSL terminal:

```sh
git clone https://github.com/pavanxml/loopa.git
cd loopa
npm ci
npm run setup
npm run dev
```

Open http://localhost:3000. Keep the terminal running; press **Ctrl+C** to stop the development server. See the setup guide before adding demo data or restoring an existing database.

## What is included

The application repository provides the web application, backend routes, SQLite schema initialization, media handling, mail worker, configuration templates, and automated tests. Dependencies are recreated by `npm ci`; `.env` is created by `npm run setup`; the database is initialized when the backend opens it.

The app supports multiple user accounts on one persistent host. It is not a complete Instagram replacement or a validated large-scale service. Read the deployment guide and limitations before making it public.
