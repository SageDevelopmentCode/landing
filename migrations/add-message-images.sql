-- Message image attachments
-- Run this in the Supabase SQL editor if not already applied.

-- Create the storage bucket (public, 5 MB limit, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-images',
  'message-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);

-- Allow authenticated users to upload
-- Path convention: {senderId}/{conversationId}/{timestamp}-{filename}
CREATE POLICY "Authenticated users can upload message images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'message-images');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Users can delete their own message images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'message-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add image_url column to the messages table
ALTER TABLE messaging.messages ADD COLUMN IF NOT EXISTS image_url TEXT;
