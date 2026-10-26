# API reference

[Documentation index](README.md)

This reference covers the route handlers under [src/app/api](https://github.com/pavanxml/loopa/tree/main/src/app/api). Routes are same-origin and currently unversioned. `<id>`, `<username>`, `<slug>`, `<tag>`, `<kind>`, `<filename>`, and `<provider>` below are path parameters, not literal text.

## Request and response conventions

Send JSON with `Content-Type: application/json`, except multipart uploads. Authentication uses the `loopa_access` and `loopa_refresh` cookies; there is no documented Bearer-token API. Non-browser mutation requests must send `X-Loopa-Request: 1`. A supplied `Origin` must still match `APP_URL`; the custom header does not override a mismatched origin.

Typical success and failure responses:

```json
{"ok":true,"data":{"id":"created-id"}}
```

```json
{"ok":false,"error":{"code":"validation_error","message":"Some fields need attention.","fields":{"body":["Required"]}}}
```

`data` varies by route. Creation usually returns 201; normal success returns 200. Common errors include 400 invalid input/expired cursor, 401 unauthenticated, 403 forbidden/origin/policy failure, 404 missing or inaccessible content, 409 conflict, 413 oversized request, 422 validation/media rejection, and 429 rate limiting. Unexpected failures use a generic 500 response. Health can return 503.

Media returns bytes, SSE returns an event stream, and OAuth endpoints redirect. These successful responses do not use the JSON envelope. Do not cache authenticated API responses in a public proxy.

Access labels: **Public** permits an anonymous request; results can still depend on identity/privacy. **Session** requires a signed-in active user. **Staff** requires a platform admin or moderator; individual actions can add restrictions.

## Accounts and authentication

| Method | Route | Access | Input / behavior |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | Public | `{email, username, password, displayName}`; creates account/session and queues verification mail |
| POST | `/api/auth/login` | Public | `{emailOrUsername, password}`; sets cookies |
| POST | `/api/auth/logout` | Cookie-based | Revokes current session family and clears cookies |
| POST | `/api/auth/refresh` | Refresh cookie | Rotates session and returns `{id, username, role}` |
| GET | `/api/auth/me` | Session | Current account/profile data |
| POST | `/api/auth/forgot-password` | Public | `{email}`; same generic response for known/unknown addresses |
| POST | `/api/auth/reset-password` | Reset token | `{token, password}`; resets password and revokes sessions |
| POST | `/api/auth/verify-email` | Verification token | `{token}` |
| GET | `/api/auth/oauth/providers` | Public | Enabled provider names/IDs |
| GET | `/api/auth/oauth/<provider>` | Public | `provider=google` or `github`; optional `next`; begins redirect flow |
| GET | `/api/auth/oauth/<provider>/callback` | OAuth state | Provider callback with authorization code/state; redirects |
| PATCH | `/api/account` | Session | `{action:"deactivate"}` or `{action:"delete"}` |

Signup usernames are 3–24 lowercase letters/digits/underscores and cannot be reserved or entirely numeric. Passwords must be 8–72 characters and no more than 72 UTF-8 bytes. Token lifetimes and session behavior are described in [architecture](ARCHITECTURE.md).

## Profiles and relationships

| Method | Route | Access | Input / behavior |
| --- | --- | --- | --- |
| GET | `/api/users/<username>` | Public | Profile summary, counts, relationship flags, `canView`, `isSelf`; private details filtered |
| PATCH | `/api/users/<username>` | Owner | Profile fields and policies; see below |
| GET | `/api/users/<username>/posts` | Public | `limit` 1–50 (default 20), optional post-ID `cursor`; returns `items`, `nextCursor` |
| GET | `/api/users/<username>/followers` | Public | `type=following` selects following; default is followers; account privacy applies |
| POST | `/api/users/<username>/follow` | Session | Toggles follow/request; returns `following` and `requested` |
| GET | `/api/follow-requests` | Session | Incoming requests, up to 100 |
| PATCH | `/api/follow-requests` | Recipient | `{id, action:"accept"}` or `"decline"` |
| GET | `/api/connections` | Session | `box=incoming` (default), `outgoing`, or `accepted` |
| POST | `/api/connections` | Session | `{username}`; sends connection request |
| PATCH | `/api/connections/<id>` | Recipient | `{action:"accept"}` or `"decline"` |
| DELETE | `/api/connections/<id>` | Participant | Removes/cancels connection |

Profile PATCH accepts optional `displayName`, `bio`, `location`, `website`, `avatarUrl`, `skills`, `privacy`, `dmPolicy`, `followPolicy`, `commentPolicy`, `mentionPolicy`, `latitude`, and `longitude`. `privacy` is `public`, `followers`, or `private`; `followPolicy` is `open` or `approval_required`; the other policies use `everyone`, `followers`, or `none`. For DMs, `followers` means people the recipient follows. Server validation and route checks are the source of truth for policy behavior.

## Posts, media, and discovery

| Method | Route | Access | Input / behavior |
| --- | --- | --- | --- |
| GET | `/api/feed` | Public | `mode=for_you` (default), `following`, `reels`, or `explore`; `limit` 1–50; optional snapshot `cursor` |
| POST | `/api/posts` | Session | Create-post body below; returns `{id}` |
| GET | `/api/posts/<id>` | Public | Visible post in feed format |
| PATCH | `/api/posts/<id>` | Session | `{hidden:true}` or `false`; changes only viewer's feed hiding |
| DELETE | `/api/posts/<id>` | Owner | Soft-deletes own post |
| POST | `/api/posts/<id>/like` | Session | Toggle; returns `{liked}` |
| POST | `/api/posts/<id>/save` | Session | Toggle; returns `{saved}` |
| GET | `/api/posts/<id>/comments` | Public | Comments for an accessible post |
| POST | `/api/posts/<id>/comments` | Session | `{body, parentId?}`; body 1–1,000 characters; parent must belong to this post |
| POST | `/api/uploads` | Session | Multipart `file`, one file per request; returns media metadata |
| GET | `/api/media/<kind>/<filename>` | Visibility checked | `kind=image` or `video`; bytes or single range response |
| GET | `/api/search` | Public | `q` 1–100 chars; `type=all/users/posts/hashtags/communities/events`; `limit` 1–30, default 10 |
| GET | `/api/discover` | Public | `tab=for_you/people/communities/trending/topics/nearby`; nearby needs identity/location to be useful |
| GET | `/api/topics/<tag>` | Public | Topic summary and visible posts |
| POST | `/api/topics/<tag>` | Session | Toggles topic follow |
| POST | `/api/ai/compose-assist` | Session | `{draft}` up to 3,000 chars; heuristic hashtags/caption suggestions |

Create-post example:

```json
{
  "type": "text",
  "body": "My first Drop on LOOPA #hello",
  "visibility": "public",
  "mediaUrls": []
}
```

`type` accepts `text`, `image`, `video`, `question`, and `poll`. Audience is `public`, `followers`, `friends`, or `private`. Optional `location` is up to 120 characters. Non-poll posts need a body or media; body is at most 3,000 characters with at most 10 hashtag occurrences. A post supports at most 10 attachments.

Each `mediaUrls` entry has `url`, `kind` (`image` or `video`), and optional `thumbnailUrl`, `width`, `height`, `durationMs`. Use metadata from `/api/uploads`. Local media must be owned by the session user. HTTPS URLs are also accepted; external hosting controls their availability/privacy.

Poll creation accepts `poll: {question, options, closesInHours?}` with 2–6 options and an optional 1–168-hour duration value. Poll data is stored; voting, poll rendering, and expiry processing are not implemented as a complete feature.

Feed returns `{items, nextCursor}`. Pass its cursor back unchanged with the same mode and identity. Snapshots expire after 15 minutes and contain at most 300 candidates. On `cursor_expired`, start again without a cursor. Privacy changes can make a page shorter. Profile cursors and message cursors use different formats and are not interchangeable.

## Sparks, Stash, and notifications

| Method | Route | Access | Input / behavior |
| --- | --- | --- | --- |
| GET | `/api/moments` | Session | Active Sparks grouped by author in `reels` (internal response name) |
| POST | `/api/moments` | Session | `{kind:"text"/"photo"/"video", text?, mediaUrl?}`; text up to 280 chars; expires in 24 hours |
| POST | `/api/moments/<id>/react` | Session | `{emoji, reply?}`; emoji 1–8 chars, optional reply up to 500 |
| GET | `/api/collections` | Session | `collections`, visible `savedPosts`, and `savedOther` |
| POST | `/api/collections` | Session | `{name}` of 1–40 chars |
| PATCH | `/api/collections` | Owner | `{collectionId, postId}` moves an already saved post; null collection removes assignment; alternatively `{collectionId, itemType:"event"/"community", itemId}` adds an item |
| GET | `/api/notifications` | Session | `limit` 1–50, default 20; `items` and `unreadCount` |
| PATCH | `/api/notifications` | Session | `{id}` marks one read; `{markAll:true}` marks all read |
| GET | `/api/notifications/preferences` | Session | Current switches, represented as stored integers/defaults |
| PATCH | `/api/notifications/preferences` | Session | Boolean preference fields |

Preference keys are `likes`, `comments`, `follows`, `connection_request`, `messages`, `mentions`, `community_activity`, `event_reminder`, `invitation`, `moderation_action`, and `pushEnabled`. Persisting a preference does not mean an external push service or event-reminder scheduler exists.

## Whispers

| Method | Route | Access | Input / behavior |
| --- | --- | --- | --- |
| GET | `/api/conversations` | Session | Optional `q`; up to 50 accessible conversations with participants/unread counts |
| POST | `/api/conversations` | Session | `{participantUsernames:[...], title?}`; 1–50 supplied names; reuses existing direct conversation where applicable |
| GET | `/api/conversations/<id>/messages` | Participant | `limit` 1–50, default 20; optional `before` timestamp; returns chronological `items` and timestamp `nextCursor`; also marks read |
| POST | `/api/conversations/<id>/messages` | Participant | `{body?, kind?, mediaUrl?, replyToId?}`; body up to 4,000 chars; text or media required |
| DELETE | `/api/conversations/<id>/messages` | Sender | `messageId` query parameter; soft-deletes own message |
| PATCH | `/api/conversations/<id>/read` | Participant | Marks read and publishes read event |
| POST | `/api/conversations/<id>/typing` | Participant | Publishes typing signal |
| GET | `/api/conversations/<id>/stream` | Participant | SSE with cookie/session and block checks |

Message `kind` accepts `text`, `image`, `video`, or `file`; the uploader itself only accepts image/video content. Replies must reference an undeleted message in the same conversation. New conversations enforce recipient DM policies. Timestamp-based message pagination has no tie-breaker for messages sharing the same timestamp.

SSE sends JSON inside `data:` frames, including:

```text
data: {"type":"connected","conversationId":"conversation-id"}

data: {"type":"typing","conversationId":"conversation-id","userId":"user-id","username":"maya"}

```

Other event types are `message` (message in `payload`), `read` (`userId`), and `deleted` (`messageId`). Heartbeat comments occur every 25 seconds. There are no durable event IDs/replay guarantees; fetch recent messages on reconnection.

## Communities and events

| Method | Route | Access | Input / behavior |
| --- | --- | --- | --- |
| GET | `/api/communities` | Public | `limit` 1–50, default 20; optional `mine=true` |
| POST | `/api/communities` | Session | `{name, slug, description?, privacy?, rules?}` |
| GET | `/api/communities/<slug>` | Public | Metadata; content filtered for nonmembers of restricted communities |
| PATCH | `/api/communities/<slug>` | Community admin+ | Optional `name`, `description`, `privacy`, `rules`, `iconUrl`, `coverUrl` |
| DELETE | `/api/communities/<slug>` | Owner | Soft-deletes community |
| POST | `/api/communities/<slug>/members` | Session | Joins public/private immediately; invite-only creates pending membership |
| DELETE | `/api/communities/<slug>/members` | Member | Leaves; owner cannot leave |
| PATCH | `/api/communities/<slug>/members` | Community admin+ | `{userId, role:"admin"/"moderator"/"member"}`; actor cannot target an existing peer/superior; does not approve pending membership |
| POST | `/api/communities/<slug>/posts` | Active member | Validates create-post body; current handler persists text/type/tags and forces post visibility to `public`, subject to community/account access |
| GET | `/api/events` | Public | `scope=upcoming/popular/community/nearby/recommended`; `limit` 1–50, default 20 |
| POST | `/api/events` | Session | Event body below; community event requires moderator+ |
| GET | `/api/events/<id>` | Public | Visible event, attendees, and viewer attendance |
| DELETE | `/api/events/<id>` | Host | Cancels event |
| POST | `/api/events/<id>/attend` | Session | Toggles attendance with capacity checks |

Community names are 2–60 characters; slugs are 3–32 lowercase letters, digits, or hyphens. Privacy is `public`, `private`, or `invite_only`. Descriptions are at most 500 characters and rules at most 2,000. Pending membership approval and ownership transfer do not have routes in this version. The community-post handler does not persist supplied media, poll data, or location; use text community posts rather than assuming parity with `/api/posts`.

Event creation requires `title` (3–120 chars), `mode` (`online` or `offline`), and ISO datetime `startAt`. Online mode needs `onlineUrl`; offline needs `location`. Optional fields are `description`, `category`, `endAt` (after start), `capacity` (1–100,000), `communityId`, and paired `latitude`/`longitude`.

## Safety, moderation, and health

| Method | Route | Access | Input / behavior |
| --- | --- | --- | --- |
| GET | `/api/safety` | Session | Current blocked/muted account lists |
| POST | `/api/safety` | Session | `{username, action:"block"/"unblock"/"mute"/"unmute"}` |
| POST | `/api/reports` | Session | `{reason, details?, postId?, commentId?, reportedUserId?}` |
| GET | `/api/admin/overview` | Staff | Platform statistics and growth data |
| GET | `/api/admin/reports` | Staff | `status` defaults to `pending`; up to 100 reports |
| PATCH | `/api/admin/reports` | Staff | `{reportId, action:"dismiss"/"remove_content"/"suspend_user", note?}`; note is accepted but not currently persisted |
| GET | `/api/admin/users` | Staff | Optional `q`; up to 100 accounts |
| PATCH | `/api/admin/users` | Admin only | `{userId, action:"suspend"/"reinstate"}`; excludes self/admin suspension |
| GET | `/api/health` | Public | Database `SELECT 1`; returns `{status:"ready"}` or 503 |

Report reasons are `spam`, `harassment`, `hate_speech`, `violence`, `nudity`, `misinformation`, `self_harm`, or `other`; details are at most 500 characters. Report resolution currently permits moderators to use `suspend_user`, unlike the admin-only direct user-status endpoint. Review this distinction when assigning staff roles.

## Try the API locally

This PowerShell example prompts for credentials and keeps session cookies in memory. Run against your local development app and use an existing test account:

```powershell
$loopaCredential = Get-Credential -Message 'Enter your LOOPA username or email and password'
$loopaLogin = @{
  emailOrUsername = $loopaCredential.UserName
  password = $loopaCredential.GetNetworkCredential().Password
} | ConvertTo-Json
$loopaHeaders = @{ 'X-Loopa-Request' = '1' }
Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method Post -Headers $loopaHeaders -ContentType 'application/json' -Body $loopaLogin -SessionVariable loopaSession
Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/me' -WebSession $loopaSession
$loopaPost = @{ type = 'text'; body = 'Hello from the API'; visibility = 'private'; mediaUrls = @() } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3000/api/posts' -Method Post -Headers $loopaHeaders -ContentType 'application/json' -Body $loopaPost -WebSession $loopaSession
Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/logout' -Method Post -Headers $loopaHeaders -WebSession $loopaSession
$loopaLogin = $null
$loopaCredential = $null
```

The example creates one private Drop. Do not paste real credentials into committed scripts. For Linux/WSL, public reads need no cookie handling:

```sh
curl --fail http://localhost:3000/api/health
curl --fail 'http://localhost:3000/api/feed?mode=explore&limit=5'
```

For browser uploads, use `FormData` with the `file` field and `X-Loopa-Request: 1`; let the browser supply the multipart Content-Type boundary. The upload response includes `storageKey`, `url`, `kind`, and optional thumbnail/dimension/duration metadata. Image limits are 10 MB; video limits are 25 MB; the whole multipart request is capped at 26 MiB.
