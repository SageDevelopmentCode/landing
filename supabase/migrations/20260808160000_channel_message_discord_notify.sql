CREATE OR REPLACE TRIGGER "send-channel-message-notification"
  AFTER INSERT ON messaging.channel_messages
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://vonuwpzepwrbdlectspd.supabase.co/functions/v1/send-channel-message-notification',
    'POST',
    '{"Content-type":"application/json","Authorization":"Bearer <removed: superseded by 20261123120000_notification_triggers_use_vault.sql>","x-webhook-secret":"sagefield"}',
    '{}',
    '5000'
  );
