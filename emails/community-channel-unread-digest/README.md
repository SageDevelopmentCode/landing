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
