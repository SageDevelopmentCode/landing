ALTER TABLE waitlist.submissions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE contact.submissions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false NOT NULL;

CREATE INDEX IF NOT EXISTS idx_waitlist_submissions_is_deleted ON waitlist.submissions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_is_deleted ON contact.submissions(is_deleted);
