-- Allow authenticated users (including parents) to read activity image metadata
-- for published, public activities — needed for mobile cover thumbnails.

CREATE POLICY "authenticated_select_published_activity_images"
ON teachers.activity_images
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teachers.activities a
    WHERE a.id = activity_images.activity_id
      AND a.status = 'published'
      AND a.visibility = 'public'
      AND a.is_deleted = false
  )
);

-- Allow signed URL generation for published activity cover images in storage.

CREATE POLICY "authenticated_read_published_activity_images_storage"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'activity-images'
  AND EXISTS (
    SELECT 1
    FROM teachers.activity_images ai
    INNER JOIN teachers.activities a ON a.id = ai.activity_id
    WHERE ai.storage_path = name
      AND a.status = 'published'
      AND a.visibility = 'public'
      AND a.is_deleted = false
  )
);
