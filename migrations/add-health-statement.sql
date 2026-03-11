-- ── Table: parent_app.student_health_statement ───────────────────────────────

-- Enable RLS (blocks all access by default; service_role bypasses it anyway)
ALTER TABLE parent_app.student_health_statement ENABLE ROW LEVEL SECURITY;

-- Policy: allow service_role (admin client) full read/write
CREATE POLICY "Admin full access to health statement"
  ON parent_app.student_health_statement
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grants (service_role is already granted schema usage, but re-stating is safe)
GRANT USAGE ON SCHEMA parent_app TO service_role;
GRANT ALL ON TABLE parent_app.student_health_statement TO service_role;


-- ── Storage bucket: religious-exemption-affidavits ───────────────────────────
-- Path convention: {parentId}/{studentId}/{timestamp}-{filename}
-- The first folder segment is the parentId — used to scope access.

-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload religious exemption affidavits"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'religious-exemption-affidavits'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can read their own files
CREATE POLICY "Users can read their own religious exemption affidavits"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'religious-exemption-affidavits'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can delete their own files
CREATE POLICY "Users can delete their own religious exemption affidavits"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'religious-exemption-affidavits'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Service role (admin client) can do everything — needed for listReligiousExemptions
CREATE POLICY "Service role full access to religious exemption affidavits"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'religious-exemption-affidavits')
  WITH CHECK (bucket_id = 'religious-exemption-affidavits');
