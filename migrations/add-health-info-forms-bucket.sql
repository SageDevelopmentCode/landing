-- Storage bucket: health-info-forms
-- Private bucket. All access is via service_role (admin client with signed URLs).
-- Path convention: forms/{studentId}/{timestamp}-{filename}

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'health-info-forms',
  'health-info-forms',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
);

-- Service role (admin client) has full access — no parent-facing policy needed.
CREATE POLICY "Service role full access to health info forms"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'health-info-forms')
  WITH CHECK (bucket_id = 'health-info-forms');
