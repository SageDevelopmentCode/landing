-- Add access_password column to newsletters for parent password gate
ALTER TABLE newsletters.newsletters ADD COLUMN access_password TEXT;
