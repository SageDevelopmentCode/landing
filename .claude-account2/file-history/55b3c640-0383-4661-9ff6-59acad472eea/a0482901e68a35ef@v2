# Plan: Fix Unread Message Count / markMessagesRead

## Context

The messaging system has a `read_at` column on `messaging.messages` (nullable timestamp) and a `markMessagesRead` server action that's supposed to stamp it when a user opens a conversation. However, unread counts never decrease — every message ever received shows as unread. The root cause is a silent RLS failure: the user's Supabase client cannot UPDATE rows where `sender_id != auth.uid()`, so `markMessagesRead` updates 0 rows without throwing an error. The fix is to switch `markMessagesRead` to use `createAdminClient()` (bypasses RLS) while keeping the participant check implicit from the query filter.

We also need a migration SQL file to document the messaging schema and add the correct RLS policy so the `read_at` update works even for the user client in the future.

## Files to Modify

- `app/parent/messages/actions.ts` — fix `markMessagesRead` to use `createAdminClient`
- `migrations/add-messaging-schema.sql` — new file: documents schema + adds UPDATE policy for `read_at`

## Implementation

### 1. Fix `markMessagesRead` in `actions.ts`

Change the function to use `createAdminClient()` instead of `createServerSupabaseClient()`. The safety check is preserved by the `.eq("conversation_id", conversationId).neq("sender_id", userId).is("read_at", null)` filters — only the correct conversation's inbound unread messages are touched.

```ts
// Before (silently fails due to RLS):
export async function markMessagesRead(conversationId: string, userId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase
    .schema("messaging")
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);
}

// After (uses admin client to bypass RLS):
export async function markMessagesRead(conversationId: string, userId: string): Promise<void> {
  const adminClient = createAdminClient();
  await adminClient
    .schema("messaging")
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);
}
```

`createAdminClient` is already imported at the top of `actions.ts`.

### 2. Create `migrations/add-messaging-schema.sql`

This documents the schema that was created directly in Supabase and adds the missing UPDATE policy for `read_at`. The user must run this against their Supabase instance. Key policy to add:

```sql
-- Allow participants to mark incoming messages as read (update read_at)
CREATE POLICY "participants can mark messages read"
  ON messaging.messages
  FOR UPDATE
  USING (
    conversation_id IN (
      SELECT conversation_id
      FROM messaging.conversation_participants
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (true);
```

The migration file will also include the full schema DDL (CREATE TABLE statements, indexes, existing SELECT/INSERT policies) so the schema is version-controlled and reproducible.

## What Changes Behavior

- Opening a conversation → `markMessagesRead` now actually updates `read_at` → next call to `getConversations` returns `unreadCount = 0`
- Realtime: new messages from the other person while the chat is open → `markMessagesRead` is called immediately → they don't accumulate as unread
- Works identically on both parent (`MessagesPage.tsx`) and admin (`AdminMessagesPage.tsx`) sides since they both call the same `markMessagesRead` action

## Verification

1. Log in as a parent user who has received messages
2. Navigate to `/parent/messages` — unread badge should show
3. Click the conversation — badge should disappear and not reappear on page refresh
4. Log in as admin, go to `/admin/messages` — same behavior
5. Send a message from admin → parent side should show unread badge, then clear when parent opens the chat
