-- Wildflowers, Fireflies, and Honey Bees community channels (non-default).
-- Run manually in the Supabase SQL editor (production).

INSERT INTO messaging.channels (name, description, created_by, is_default)
SELECT v.name, v.description, creator.id, false
FROM (
  VALUES
    ('Wildflowers 🌼 — Miss Joy', 'Pre-K–K classroom community'),
    ('Fireflies ✨ — Miss Zelinda', '1st–2nd classroom community'),
    ('Honey Bees 🐝 — Miss Sabrina', '3rd–4th classroom community')
) AS v(name, description)
CROSS JOIN (
  SELECT u.id
  FROM admin.users u
  WHERE u.role = 'super_admin'
    AND u.is_deleted = false
  ORDER BY u.created_at
  LIMIT 1
) AS creator
WHERE NOT EXISTS (
  SELECT 1 FROM messaging.channels c WHERE c.name = v.name
);
