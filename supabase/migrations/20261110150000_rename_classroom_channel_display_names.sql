-- Rename classroom community channels to display names (emoji + lead teacher).
-- Run manually in the Supabase SQL editor (production).

UPDATE messaging.channels
SET name = 'Wildflowers 🌼 — Miss Joy', updated_at = now()
WHERE name = 'Wildflowers';

UPDATE messaging.channels
SET name = 'Fireflies ✨ — Miss Zelinda', updated_at = now()
WHERE name = 'Fireflies';

UPDATE messaging.channels
SET name = 'Honey Bees 🐝 — Miss Sabrina', updated_at = now()
WHERE name = 'Honey Bees';
