-- Seed channel members for classroom community channels.
-- Run only after 20261110143000_classroom_community_channels.sql.
-- Run manually in the Supabase SQL editor (production).

-- Wildflowers (Miss Joy)
-- Students: Alina Spence, Archie Cours, William Asher Walton, Claire Owens, Dax Lane Hernaez,
--   Gabriel Omeara, Grace Elaine Hill, Hawk Jackson, Iluka Kubacak, Maple Golan, Raven Diaz,
--   Sable Ocean Herrera-Warren, Elsie Ward, Katherine Nieto
-- Grantee: libbyajackson3@gmail.com (Hawk Jackson household)
INSERT INTO messaging.channel_members (channel_id, user_id)
SELECT ch.id, u.id
FROM messaging.channels ch
JOIN admin.users u ON lower(u.email) = ANY (
  ARRAY[
    'nicoletspence@gmail.com',
    'bkgernert@gmail.com',
    'faiththompson85@yahoo.com',
    'amberowensmassage@yahoo.com',
    'therapist.jessi@gmail.com',
    'omearakelsey@gmail.com',
    'sarah.d.grace@gmail.com',
    'family@jacksonstackson.com',
    'libbyajackson3@gmail.com',
    'britnikubacak@gmail.com',
    'bargolan1992@gmail.com',
    'faviola86a@icloud.com',
    'jameylynwarren@gmail.com',
    'wardfamily2403@gmail.com',
    'dania.nieto03@gmail.com',
    'itsmsjoy@gmail.com'
  ]::text[]
)
WHERE ch.name = 'Wildflowers 🌼 — Miss Joy'
  AND u.is_deleted = false
ON CONFLICT DO NOTHING;

-- Fireflies (Miss Zelinda)
-- Students: James Ellis Schiller, Grayson Carretta, Hannah Ticer, Hunter Elliott,
--   Nargis Grace Alia Hernandez, Steely Kubacak, Martina Londono
-- Grantee: cesarh79@gmail.com (Nargis Hernandez household)
INSERT INTO messaging.channel_members (channel_id, user_id)
SELECT ch.id, u.id
FROM messaging.channels ch
JOIN admin.users u ON lower(u.email) = ANY (
  ARRAY[
    'hayden37schiller@gmail.com',
    'rachel.t.carretta@gmail.com',
    'rebekah.ticer@gmail.com',
    'laurachyde@gmail.com',
    'shahparali21@gmail.com',
    'cesarh79@gmail.com',
    'britnikubacak@gmail.com',
    'wardfamily2403@gmail.com',
    'zelinda.sagefield@gmail.com'
  ]::text[]
)
WHERE ch.name = 'Fireflies ✨ — Miss Zelinda'
  AND u.is_deleted = false
ON CONFLICT DO NOTHING;

-- Honey Bees (Miss Sabrina)
-- Students: Abigail Ticer, Lucia Aster Bacon, Benjamin Scott Barajas, Calvin James Canales,
--   Camila Barker, Reagan Emerson Schiller, James Oliver Gordon Hill, John Willis Omeara,
--   Lorelei Hubbard, Noah Mastrangelo, Sloane Alisa Jack, Thomas S Somensari
-- Grantees: nshparber@gmail.com (Sloane), mmastrangelo1980@gmail.com (Noah)
INSERT INTO messaging.channel_members (channel_id, user_id)
SELECT ch.id, u.id
FROM messaging.channels ch
JOIN admin.users u ON lower(u.email) = ANY (
  ARRAY[
    'rebekah.ticer@gmail.com',
    'emily.misseri@gmail.com',
    'a.dl0499@icloud.com',
    'thecanalesfamilia@gmail.com',
    'jessicabarker715@gmail.com',
    'hayden37schiller@gmail.com',
    'sarah.d.grace@gmail.com',
    'omearakelsey@gmail.com',
    'goteamhubbard@proton.me',
    'rosalynwrobel@gmail.com',
    'mmastrangelo1980@gmail.com',
    'jeremyjack@gmail.com',
    'nshparber@gmail.com',
    'biasall@hotmail.com',
    'sabrina.sagefield@gmail.com'
  ]::text[]
)
WHERE ch.name = 'Honey Bees 🐝 — Miss Sabrina'
  AND u.is_deleted = false
ON CONFLICT DO NOTHING;
