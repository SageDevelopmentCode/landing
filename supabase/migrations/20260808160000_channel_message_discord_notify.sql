CREATE OR REPLACE TRIGGER "send-channel-message-notification"
  AFTER INSERT ON messaging.channel_messages
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://vonuwpzepwrbdlectspd.supabase.co/functions/v1/send-channel-message-notification',
    'POST',
    '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbnV3cHplcHdyYmRsZWN0c3BkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI0OTQ1MCwiZXhwIjoyMDg3ODI1NDUwfQ.3WsQFnDPv-gfhYhGvCMGAOHvWhIrdGDZVgZhIT8SnfU","x-webhook-secret":"sagefield"}',
    '{}',
    '5000'
  );
