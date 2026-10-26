# User guide

[Documentation index](README.md)

## Find your way around

| LOOPA name | Route | What it does |
| --- | --- | --- |
| The Loop | `/home` | Feed and followed accounts' activity |
| Radar | `/discover` | Search and discover people, posts, topics, communities, and events |
| Flicks | `/reels` | Watch video Drops |
| Sparks | `/moments` | Create and view updates available for 24 hours |
| Whispers | `/messages` | Conversations and live messages |
| Echoes | `/notifications` | Activity notifications and follow requests |
| Studio | `/create` | Create a Drop |
| Your Orbit | `/profile` | Your profile; another person is at `/profile/<username>` |
| Stash | `/saved` | Saved posts and collections |
| Communities | `/communities` | Groups, group posts, members, and events |
| Events | `/events` | Activities and attendance |
| Connections | `/connections` | Send and respond to connection requests |
| Settings | `/settings` | Account, privacy preferences, notifications, appearance, and safety lists |

Desktop uses a sidebar with a **More** menu. Mobile has five primary destinations in its bottom navigation; other routes remain available through page links or their URLs.

## Create an account

1. Open `/signup` and enter your display name, email, username, and password.
2. Use a username of 3–24 lowercase letters, numbers, or underscores. All-numeric and reserved names are rejected.
3. Use a password of at least 8 characters and at most 72 UTF-8 bytes.
4. After registration, you are signed in. If email delivery is configured, use the verification link from your inbox.

Sign in at `/login` using your email or username. Reset a forgotten password at `/forgot-password`. Reset links expire after one hour and verification links after 24 hours. Posting does not currently require a verified email.

## Publish and interact with Drops

Open **Studio**, write a caption, add photos or video, choose the available audience, and publish. A Drop supports up to 10 media attachments, a 3,000-character body, and 10 hashtag occurrences. Upload each file before publishing.

Images accept JPEG, PNG, WebP, and GIF inputs up to 10 MB; the server converts images into JPEG, so animation/transparency are not retained. Videos accept MP4, WebM, and QuickTime inputs up to 25 MB. Playback depends on the browser's support for the uploaded codec; the server does not transcode videos.

On a Drop you can like, comment, save to **Stash**, and share its link. The menu offers hiding a Drop from your feed and deleting your own Drop. Hiding does not delete the author's content. A shared link still respects the viewer's access permissions.

Follow accounts to populate the **Following** feed. Refresh The Loop for new results; pagination keeps a stable ordering for up to 15 minutes.

## Your Orbit and privacy

Open **Your Orbit → Edit Orbit** to update profile details and choose a public or private profile. Click your profile photo to upload an avatar. Username/display name/avatar are basic discovery information; making an Orbit private does not make the entire account invisible.

For a private Orbit, new followers send a request. Approve or decline incoming requests in **Echoes**. Existing followers retain access unless removed through the available relationship controls or blocking.

Post visibility and account privacy work together: a public Drop from a private account still requires access to that account. Followers-only posts require a follow; friends-only posts require an accepted connection; private posts are author-only. Community restrictions can further narrow access.

**Settings → Privacy** stores messaging, follow, comment, and mention preferences. The messaging choice **People you follow** means the recipient must follow the person starting the conversation. See [limitations](LIMITATIONS.md) for policy gaps, including mention handling and existing conversations.

## Sparks and Flicks

Create a text, photo, or video **Spark** on `/moments`. View your own and followed accounts' active Sparks in the viewer, move between items, pause playback, and react. Expiry removes a Spark from active views after 24 hours; it does not guarantee physical deletion of stored files.

Open **Flicks** to watch accessible video Drops. Their likes, comments, and account visibility use the same underlying post system.

## Whispers

Start a conversation with a username, then send text or an uploaded image/video. You can reply to a message, see typing/read updates, and delete your own messages. Deletion leaves the conversation in place. The app receives updates through a live connection while the conversation is open and fetches recent history when reconnecting.

Blocking between participants makes the conversation unavailable to the blocked pair under the current access rules. Messages are not end-to-end encrypted. The current screen shows recent messages without an older-history paging control.

## Communities, events, and connections

Create or browse communities and join one to participate. **Public** communities expose content; **private** communities hide content until you join, but joining is immediate. **Invite-only** joining creates a pending membership; a complete approval workflow is not currently provided. These modes differ from private-profile follow requests, which do have approval controls.

Events can be online or in person. Online events require a join URL; in-person events require a location. Choose attendance to join or cancel your attendance. Capacity limits are checked by the backend. Community event creation requires sufficient community privileges.

Connections are mutual accepted relationships, distinct from following an account. They control access to friends-only Drops.

## Safety and account controls

Use a profile's block control to cut off access and remove follow, follow-request, and connection relationships in both directions. Unblocking does not recreate those relationships. Muting suppresses that person's feed content without acting as a privacy barrier. Manage blocked and muted lists in Settings.

Deactivating signs you out and hides your active account; a successful password login reactivates it. Deleting anonymizes account/profile details and revokes sessions. It is not a complete erasure of every authored item, uploaded file, or backup. See [current limitations](LIMITATIONS.md).
