ALTER TABLE waitlist.submissions ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE contact.submissions ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
