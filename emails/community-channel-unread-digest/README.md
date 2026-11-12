# Community channel unread digest — email preview

Sample HTML for the daily cron digest sent to **school-year enrolled families with supply fee paid** (see `fetchSchoolYearEnrolledFamilies`) when they have new unread community messages. Admin “live” sends from Outreach are not limited to this list.

## Refresh preview

From the repo root:

```bash
npx tsx emails/community-channel-unread-digest/render-preview.ts
```

Then open `preview.html` in a browser.

## Admin UI

Super admins can also preview at `/admin/email-previews/community-channel-unread-digest`.

## Production

Run these in the **Supabase SQL editor** before the cron sends digests:

1. `supabase/migrations/20261110160000_community_channel_digest_log.sql`
2. `supabase/migrations/20261110170000_get_last_community_channel_digest_sent.sql` (latest send per parent; required for correct dedupe at scale)

### Dedupe (avoid emailing the same backlog twice)

- **Primary watermark:** `parent_app.community_channel_digest_log.sent_at` — set to the latest `created_at` of messages included in the email. The cron only includes messages newer than `max(last digest sent_at, channel last_read_at)`.
- **In-app unread:** `messaging.channel_members.last_read_at` is usually updated when a parent opens a channel; after a successful digest the cron also advances it through the newest included message per channel (defense in depth).
- A run counts as successful only when the Zoho send **and** the digest log insert both succeed. If the log fails, Discord shows a **Dedupe / log failures** section so the next run does not silently repeat the same content.

Admin Outreach “live” sends do not write to `community_channel_digest_log`.
