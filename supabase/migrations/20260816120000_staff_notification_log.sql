CREATE TABLE IF NOT EXISTS admin.staff_notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type text NOT NULL,
  date date NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (notification_type, date)
);

ALTER TABLE admin.staff_notification_log ENABLE ROW LEVEL SECURITY;
