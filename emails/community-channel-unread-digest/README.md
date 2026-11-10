# Community channel unread digest — email preview

Sample HTML for the daily cron digest sent to enrolled families with new unread community messages.

## Refresh preview

From the repo root:

```bash
npx tsx emails/community-channel-unread-digest/render-preview.ts
```

Then open `preview.html` in a browser.

## Admin UI

Super admins can also preview at `/admin/email-previews/community-channel-unread-digest`.

## Production

Run `supabase/migrations/20261110160000_community_channel_digest_log.sql` in the **Supabase SQL editor** before the cron sends digests.
