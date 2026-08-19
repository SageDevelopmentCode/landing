-- Activity publish push notification trigger.
-- Fires when an activity is first published (created as published, or draft → published).
-- Calls send-activity-notification edge function (deploy separately).
-- Run this in the Supabase SQL editor after deploying the edge function.

CREATE OR REPLACE TRIGGER "activity-publish-notification-insert"
  AFTER INSERT ON teachers.activities
  FOR EACH ROW
  WHEN (
    NEW.status = 'published'
    AND NEW.visibility = 'public'
    AND NEW.is_deleted = false
  )
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://vonuwpzepwrbdlectspd.supabase.co/functions/v1/send-activity-notification',
    'POST',
    '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbnV3cHplcHdyYmRsZWN0c3BkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI0OTQ1MCwiZXhwIjoyMDg3ODI1NDUwfQ.3WsQFnDPv-gfhYhGvCMGAOHvWhIrdGDZVgZhIT8SnfU","x-webhook-secret":"sagefield"}',
    '{}',
    '5000'
  );

CREATE OR REPLACE TRIGGER "activity-publish-notification-update"
  AFTER UPDATE ON teachers.activities
  FOR EACH ROW
  WHEN (
    NEW.status = 'published'
    AND NEW.visibility = 'public'
    AND NEW.is_deleted = false
    AND OLD.status IS DISTINCT FROM 'published'
  )
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://vonuwpzepwrbdlectspd.supabase.co/functions/v1/send-activity-notification',
    'POST',
    '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbnV3cHplcHdyYmRsZWN0c3BkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI0OTQ1MCwiZXhwIjoyMDg3ODI1NDUwfQ.3WsQFnDPv-gfhYhGvCMGAOHvWhIrdGDZVgZhIT8SnfU","x-webhook-secret":"sagefield"}',
    '{}',
    '5000'
  );
