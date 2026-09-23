-- Family map address fixes
-- Run in the Supabase SQL editor (production). Do not run via MCP.
--
-- After running updates, clear the geocode cache so /admin/family-map re-fetches:
--   DELETE FROM admin.address_geocodes;

-- Fix invalid state codes (ST -> TX)
UPDATE parent_app.applications
SET address_state = 'TX'
WHERE g1_full_name = 'Faviola Diaz'
  AND child_legal_name ILIKE '%Raven%'
  AND address_state = 'ST';

UPDATE parent_app.applications
SET address_state = 'TX'
WHERE g1_full_name ILIKE '%Deangelo%'
  AND address_state = 'ST';

-- Fix incomplete address (confirm full address with parent before running)
-- Bianca Sallesse Somensari — replace placeholders with verified values
UPDATE parent_app.applications
SET
  address_street = '405 Warm Springs Dr',  -- confirm with parent
  address_city = 'Round Rock',              -- confirm with parent
  address_state = 'TX',
  address_zip = '78664'                     -- confirm with parent
WHERE g1_full_name ILIKE '%Somensari%'
  AND address_street = '405 warm';

-- Clear stale geocode cache entries (or DELETE FROM admin.address_geocodes; for full refresh)
DELETE FROM admin.address_geocodes
WHERE address_key IN (
  '7813 arezzo dr, round rock, st, 78665',
  '7813 arezzo dr, round rock, tx, 78665',
  '403 e sixth st, georgetown, st, 78626',
  '403 e sixth st, georgetown, tx, 78626',
  '405 warm'
);

-- Bad geocode: Deangelo was cached as Seguin TX 78155 instead of Georgetown 78626
DELETE FROM admin.address_geocodes
WHERE address_key = '403 e sixth st, georgetown, tx, 78626';
