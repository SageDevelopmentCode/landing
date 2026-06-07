ALTER TABLE newsletters.newsletters
  ADD COLUMN IF NOT EXISTS cover_image_path TEXT DEFAULT NULL;
