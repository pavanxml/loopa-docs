# Current limitations

[Documentation index](README.md)

These notes distinguish working application paths from incomplete features and deployment work. They describe the inspected implementation, not a full security audit or a capacity certification.

## Product status

| Area | Current boundary |
| --- | --- |
| Core social flows | Accounts, Drops/media, interactions, follows, private follow approvals, Sparks, discovery, and messaging have implemented paths and automated coverage |
| Email | Queued persistently; requires real SMTP settings and a running worker; verification does not currently gate posting; no verification resend endpoint |
| OAuth | Google/GitHub code and local-provider tests exist; live provider credentials, callback setup, and end-to-end verification are deployment work |
| Polls | API can store poll configuration; voting, result UI, and a full poll lifecycle are absent |
| Push notifications | `pushEnabled` is stored, but no browser/mobile push delivery service is implemented |
| Event reminders | A preference exists; no scheduled reminder worker is provided |
| Message history | API supports timestamp paging; UI loads recent history without an older-message control; equal timestamps can make paging incomplete |
| Message reactions/files | Reaction table/read support and a `file` message kind exist; no reaction-write endpoint or arbitrary-file upload workflow is provided |
| Private communities | Content is hidden before joining, but join is immediate; private does not mean approval-only |
| Invite-only communities | Join creates a pending row; no membership approval endpoint/UI is provided |
| Community ownership | Owners cannot leave; a complete ownership-transfer workflow is absent |
| Community posts | Current handler stores text/type/tags, but ignores media, poll data, and location from the shared create-post schema |
| Saved collections | Basic create/assign/read paths exist; no rename/delete collection endpoint |
| Mention policy | Preference is stored; complete mention parsing/notification/enforcement is not implemented |
| Messaging policy changes | DM policy is checked when creating a conversation; existing conversations are primarily controlled by membership and blocks |
| Compose assistance | Local tag/caption heuristics, not an external AI model |
| Video | Optional metadata/posters; no transcoding, adaptive streaming pipeline, music catalogue, or calling |
| Encryption | No end-to-end encryption for messages |
| Mobile | Responsive web UI; no native mobile application package |

## Capacity and storage

One persistent application host is the supported shape. SQLite is synchronous, media is local, uploads process within requests, and file serving reads each file into memory. Redis supports shared counters/events but does not distribute persistent database or media storage. Production load capacity and failover have not been established.

Feed snapshots contain at most 300 candidates and expire after 15 minutes. Other list endpoints have fixed limits or only partial pagination. Nearby discovery uses saved location data; it is not continuous live tracking.

## Moderation and privacy details

Platform admin and moderator roles are separate from community roles. Direct user suspension through `/api/admin/users` is admin-only; report resolution through `/api/admin/reports` currently allows moderators to choose `suspend_user`. The accepted report `note` field is not persisted. Review staff permissions/workflows before assigning roles publicly. There is no general production admin bootstrap or role-management CLI.

Basic account discovery/avatar information may remain public even for a private profile. External HTTPS media URLs are outside LOOPA's protected local-file storage. Muting affects feed selection rather than content authorization. An SSE connection rechecks authorization during delivery/heartbeats, not continuously between them.

## Retention and operational work

Account deletion anonymizes identity and revokes sessions; it does not erase all content, uploads, logs, or backups. Expired Spark rows are pruned when the Sparks list is read; uploaded files are not automatically deleted with them. No complete retention or orphaned-media cleanup job is provided. Pending/failed email can retain recovery links until handled; delivery is at least once and may duplicate after a crash.

Before public use, validate your actual HTTPS proxy, SMTP delivery, OAuth providers if enabled, backup/restore process, staff permissions, capacity, monitoring, and data-retention choices. The existing tests are useful regression evidence but do not establish enterprise readiness or Instagram feature parity.
