-- Message file attachments
-- Run this in the Supabase SQL editor.

-- Create a storage bucket for non-image file attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-files',
  'message-files',
  true,
  20971520, -- 20 MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
);

-- Allow authenticated users to upload
-- Path convention: {senderId}/{conversationId}/{timestamp}-{filename}
CREATE POLICY "Authenticated users can upload message files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'message-files');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Users can delete their own message files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'message-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add file attachment columns to the messages table
ALTER TABLE messaging.messages ADD COLUMN IF NOT EXISTS file_url  TEXT;
ALTER TABLE messaging.messages ADD COLUMN IF NOT EXISTS file_name TEXT;
