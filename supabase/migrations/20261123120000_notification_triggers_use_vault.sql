-- Notification triggers: stop sending the service-role key.
--
-- The five notification triggers below used to call their edge functions through
-- supabase_functions.http_request with the service-role key hard-coded in the
-- Authorization header (and a weak, committed x-webhook-secret). That key is being
-- rotated, so the triggers now send ONLY an x-webhook-secret header, read at call time
-- from Supabase Vault. No secret lives in SQL or in git any more.
--
-- The request body is the same shape supabase_functions.http_request sends
-- ({ type, table, schema, record, old_record }), so the edge functions need no
-- payload changes.
--
-- BEFORE applying this migration in production:
--   1. Generate a long random value (e.g. `openssl rand -hex 32`).
--   2. Store it in Vault (SQL editor; do NOT commit the value):
--        select vault.create_secret('<value>', 'notify_webhook_secret',
--          'x-webhook-secret sent by notification triggers to edge functions');
--   3. Set the SAME value as WEBHOOK_SECRET on the edge functions
--      (`supabase secrets set WEBHOOK_SECRET=<value>`) and in Vercel.
--   4. Deploy the trigger-called edge functions with JWT verification off
--      (see supabase/config.toml); they authenticate with the webhook secret instead.
--
-- If the Vault secret is missing, the trigger logs a warning and skips the call.
-- It never blocks the insert or update that fired it.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.notify_edge_function()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  fn_name text := tg_argv[0];
  webhook_secret text;
begin
  select ds.decrypted_secret
    into webhook_secret
    from vault.decrypted_secrets ds
   where ds.name = 'notify_webhook_secret'
   limit 1;

  if webhook_secret is null or webhook_secret = '' then
    raise warning 'notify_edge_function: Vault secret "notify_webhook_secret" is missing; % was not called', fn_name;
    return null;
  end if;

  perform net.http_post(
    url := 'https://vonuwpzepwrbdlectspd.supabase.co/functions/v1/' || fn_name,
    body := jsonb_build_object(
      'type', tg_op,
      'table', tg_table_name,
      'schema', tg_table_schema,
      'record', case when tg_op = 'DELETE' then null else to_jsonb(new) end,
      'old_record', case when tg_op = 'INSERT' then null else to_jsonb(old) end
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', webhook_secret
    ),
    timeout_milliseconds := 5000
  );

  return null; -- AFTER trigger: return value is ignored
exception
  when others then
    -- A notification failure must never roll back the message, post or activity.
    raise warning 'notify_edge_function: calling % failed: %', fn_name, sqlerrm;
    return null;
end;
$$;

revoke all on function private.notify_edge_function() from public, anon, authenticated;

-- ─── Recreate the five triggers (same tables, events and conditions as before) ───

drop trigger if exists "send-message-notification" on messaging.messages;
create trigger "send-message-notification"
  after insert on messaging.messages
  for each row
  execute function private.notify_edge_function('send-message-notification');

drop trigger if exists "send-channel-message-notification" on messaging.channel_messages;
create trigger "send-channel-message-notification"
  after insert on messaging.channel_messages
  for each row
  execute function private.notify_edge_function('send-channel-message-notification');

drop trigger if exists "feed-post-notification" on feed.posts;
create trigger "feed-post-notification"
  after insert on feed.posts
  for each row
  execute function private.notify_edge_function('send-feed-notification');

drop trigger if exists "activity-publish-notification-insert" on teachers.activities;
create trigger "activity-publish-notification-insert"
  after insert on teachers.activities
  for each row
  when (
    new.status = 'published'
    and new.visibility = 'public'
    and new.is_deleted = false
  )
  execute function private.notify_edge_function('send-activity-notification');

drop trigger if exists "activity-publish-notification-update" on teachers.activities;
create trigger "activity-publish-notification-update"
  after update on teachers.activities
  for each row
  when (
    new.status = 'published'
    and new.visibility = 'public'
    and new.is_deleted = false
    and old.status is distinct from 'published'
  )
  execute function private.notify_edge_function('send-activity-notification');
