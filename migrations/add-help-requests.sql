-- Help requests submitted by parents via the "Need Help?" widget
-- Run this in the Supabase SQL editor.

-- Table in admin schema
CREATE TABLE admin.help_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   UUID NOT NULL REFERENCES admin.users(id),
  description TEXT NOT NULL,
  page_url    TEXT,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON admin.help_requests TO service_role;

-- Storage bucket for help request file attachments (private, 10 MB, images + PDF)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'help-request-attachments',
  'help-request-attachments',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/pdf', 'application/pdf']
);

-- Parents can upload into their own folder
CREATE POLICY "Parents can upload help request attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'help-request-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Parents can read their own attachments
CREATE POLICY "Parents can read their own help request attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'help-request-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Service role can read all (for admin review)
CREATE POLICY "Service role can read all help request attachments"
  ON storage.objects FOR SELECT
  TO service_role
  USING (bucket_id = 'help-request-attachments');
