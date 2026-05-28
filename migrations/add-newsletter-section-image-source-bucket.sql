ALTER TABLE newsletters.section_images
  ADD COLUMN source_bucket TEXT NOT NULL DEFAULT 'newsletter-images';
