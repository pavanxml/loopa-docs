# Deployment and operations

[Documentation index](README.md)

These instructions are for the [LOOPA application repository](https://github.com/pavanxml/loopa). To build or host this separate documentation website, use [Publish these docs](DOCS_SITE.md).

## Supported deployment shape

LOOPA can serve multiple accounts through one persistent Node.js host. Run **one web process**, a separate mail worker, an HTTPS reverse proxy, and durable local storage. SQLite and local media are the limiting architectural boundary; adding Redis does not enable multiple independent application hosts.

Do not deploy this version with ephemeral database/media directories or assume it will work unchanged in serverless/Edge functions. The backend requires Node's SQLite API, filesystem access, and long-lived SSE connections. There is no measured maximum user count or availability guarantee.

## Prepare and start

Use Node.js 24 and a dedicated application account with write access to the database and upload directories. Run these commands from the host where the app will execute:

```sh
git clone https://github.com/pavanxml/loopa.git
cd loopa
npm ci
npm run setup
```

Privately edit `.env` before starting production. Keep the generated random `JWT_SECRET`. Set a real HTTPS public origin and SMTP settings. Example configuration shape, using placeholders rather than working credentials:

```dotenv
APP_URL=https://social.example.com
SQLITE_PATH=.data/loopa.db
UPLOAD_DIR=.data/uploads
TRUST_PROXY=false
SMTP_URL=smtps://SMTP_USER:SMTP_PASSWORD@mail.example.com:465
MAIL_FROM="LOOPA <noreply@example.com>"
```

Do not replace the generated JWT secret with a placeholder. Percent-encode special characters in SMTP URL credentials as required by URL syntax. Provision a sender that your SMTP service accepts. Set `TRUST_PROXY=true` only when the proxy conditions below are met.

Default `.data/` must be retained across code releases, restarts, and deployments. If your release process replaces the checkout, use absolute `SQLITE_PATH` and `UPLOAD_DIR` paths in an independently persistent directory instead. Create a custom database's parent directory before starting; the runtime automatically creates only the default `.data` parent. Keep the worker on the same database and storage configuration.

Build and start the web app:

```sh
npm run typecheck
npm test
npm run build
npm start -- --hostname 127.0.0.1 --port 3000
```

In a second terminal, from the same application folder:

```sh
npm run mail:worker
```

For ongoing operation, supervise both commands with your host's service manager so they restart after a crash/reboot. Set their working directory to the application folder. The commands above run in the foreground and are not themselves a service installation.

`npm start` runs `scripts/check-env.mjs` first. It requires a non-placeholder secret of at least 32 characters, an HTTPS `APP_URL`, `SMTP_URL`, and `MAIL_FROM`. Passing these checks validates presence/basic format, not SMTP deliverability. Do not use demo seeding for a public deployment.

## Proxy requirements

- Terminate HTTPS at your public domain and forward to the local Node process. Production cookies are Secure and require HTTPS in the browser.
- Preserve the intended host/origin and keep `APP_URL` equal to the browser's public origin.
- If enabling `TRUST_PROXY`, replace incoming `X-Forwarded-For`/`X-Real-IP` values with trusted client information and prevent clients from reaching Node directly.
- Permit request bodies large enough for the app's 26 MiB multipart cap. The application still enforces 10 MiB image and 25 MiB video file limits.
- Disable response buffering for conversation SSE streams and allow idle periods longer than the 25-second heartbeat.
- Forward Range requests for video. Do not publicly cache private API/media responses or serve the upload directory directly.

Without trusted proxy mode, IP-scoped limits share a `direct` bucket. This can throttle several users together. Configure the proxy correctly instead of blindly trusting client-supplied forwarding headers.

## Check the deployment

On the host, Linux/WSL:

```sh
curl --fail http://127.0.0.1:3000/api/health
```

PowerShell equivalent:

```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:3000/api/health'
```

Expected JSON is `{"ok":true,"data":{"status":"ready"}}`. This checks the database, not SMTP, Redis, storage capacity, or an end-to-end login.

Also test the public HTTPS origin: register two test accounts, sign in, upload a photo/video, exchange a message between separate browser sessions, check follow approval, and verify password-reset delivery. Confirm content survives a normal process restart. Keep those test accounts/content separate from users' real activity.

## Email and monitoring

The worker checks the queue approximately every five seconds, attempts up to 20 messages per batch, and leases a message for 60 seconds. A failed send is retried with backoff, to a maximum of five attempts. It logs mail IDs and attempt counts; it does not intentionally print message bodies or recovery links. A successful send clears the queued recipient/body but keeps the row.

Monitor web/worker availability, API errors, 429 rates, disk space, SQLite lock errors, upload failures, open SSE connections, and the mail queue. Failed rows are not automatically retried forever. After correcting an SMTP problem, investigate failed deliveries and have users request fresh reset links where appropriate; there is no queue-management UI.

For a private, aggregate-only queue check, run from the app folder:

```sh
node --env-file=.env -e "const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(process.env.SQLITE_PATH||'.data/loopa.db',{readOnly:true});console.table(db.prepare('SELECT status, COUNT(*) AS count FROM mail_outbox GROUP BY status').all());db.close()"
```

Use the same configuration file as the worker. There is no automated cleanup policy for failed mail, expired tokens, or orphaned media in this version.

## Backup and restore

Back up **both the database and its matching media files**, plus private configuration if needed. Keep backups outside the Git repository with restricted access. Pending mail can contain usable account recovery links. A source ZIP or GitHub clone does not contain your user data.

### Simple stopped backup using default paths

1. Stop the web process and mail worker, including automatic service restarts. Wait for both to exit.
2. Copy the complete `.data` directory so any SQLite companion files and uploads stay together. With custom paths, copy the configured database directory and upload directory instead.
3. Copy `.env` privately if retaining configuration. Protect the backup and transfer it through a private channel.

Linux/WSL, from the application folder:

```sh
backup_dir="../loopa-private-backup-$(date +%Y%m%d-%H%M%S)"
umask 077
mkdir "$backup_dir"
cp -a .data "$backup_dir/"
cp .env "$backup_dir/"
```

PowerShell equivalent, from the application folder:

```powershell
$loopaBackup = Join-Path (Split-Path (Get-Location).Path -Parent) ('loopa-private-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $loopaBackup -ErrorAction Stop | Out-Null
Copy-Item -LiteralPath '.data' -Destination $loopaBackup -Recurse -ErrorAction Stop
Copy-Item -LiteralPath '.env' -Destination $loopaBackup -ErrorAction Stop
```

The PowerShell copy uses normal inherited filesystem permissions; place it in a location accessible only to the intended operator. `.data` can also contain test artifacts/logs, so this simple backup may be larger than the live data alone.

For online backups, use a SQLite-aware backup procedure or `VACUUM INTO` and coordinate a consistent media snapshot. Do not copy only the live `.db` during WAL writes and treat it as a complete backup. The stopped procedure above is the documented simplest path for moving laptops.

### Restore into a fresh destination

1. Clone the source and install dependencies on the destination operating system. Keep the new web app and worker stopped.
2. If the destination already has data, back it up and preserve it separately before restoring. Do not merge two live data directories.
3. Restore the backed-up `.data` to the application folder, or restore the configured custom paths. Restore matching uploads; database rows alone cannot reconstruct media.
4. Restore `.env` privately or run setup and re-enter its settings. Correct `APP_URL` and any machine-specific paths. Configure the mail worker only when you intend to resume pending deliveries.
5. Start locally with `npm run dev`, or build/start as above for production. Check accounts, posts, media, and messaging before accepting new writes.

Restoring data also restores session/outbox state. A restored mail queue may contain pending deliveries or old links; evaluate that before starting the worker. Changing only `JWT_SECRET` invalidates access JWTs but does **not** revoke stored refresh tokens; use session revocation if the goal is to sign everyone out.

## Updating the application

Back up first and stop the managed processes for a simple maintenance-window update. With a clean checkout on the intended branch:

```sh
git status --short
git pull --ff-only
npm ci
npm run typecheck
npm test
npm run build
```

Restart the web app and worker through your service manager, then repeat the health and user-flow checks. Preserve `.env`, the database, and media. Schema changes run when the app opens the database; there is no automatic down migration. Keep the previous code revision and consistent data backup as the recovery point, noting that restoring an older database loses writes made after that backup.
