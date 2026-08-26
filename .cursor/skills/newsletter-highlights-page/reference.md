# Newsletter Highlights Page — Reference

## Supabase project

- Project ID: `vonuwpzepwrbdlectspd`
- Schema: `newsletters`
- MCP tool: `execute_sql` (read-only SELECT)

Shared list/search queries: [school-year-newsletter-email/reference.md](../school-year-newsletter-email/reference.md).

## List recent newsletters

```sql
SELECT id, title, week_range, status, published_at, created_at
FROM newsletters.newsletters
WHERE is_deleted = false
ORDER BY created_at DESC
LIMIT 20;
```

## Search by title or week

```sql
SELECT id, title, week_range, status, published_at
FROM newsletters.newsletters
WHERE is_deleted = false
  AND (
    title ILIKE '%week two%'
    OR title ILIKE '%week 2%'
    OR week_range ILIKE '%aug%'
  )
ORDER BY created_at DESC;
```

Replace the `ILIKE` patterns with what the user provided.

## Fetch full newsletter content

Replace `{newsletter_id}` with the UUID.

```sql
SELECT
  n.id,
  n.title,
  n.week_range,
  n.status,
  s.id AS section_id,
  s.label,
  s.body,
  s.is_class_updates,
  s.sort_order,
  tu.id AS teacher_update_id,
  tu.body AS teacher_body,
  u.id AS teacher_id,
  u.full_name AS teacher_name
FROM newsletters.newsletters n
JOIN newsletters.sections s ON s.newsletter_id = n.id
LEFT JOIN newsletters.teacher_updates tu
  ON tu.section_id = s.id AND s.is_class_updates = true
LEFT JOIN admin.users u ON u.id = tu.teacher_id
WHERE n.id = '{newsletter_id}'
  AND n.is_deleted = false
ORDER BY s.sort_order, u.full_name;
```

## Grade-band mapping (internal — never in public copy)

Map `teacher_name` → public label. Update when staff changes.

| Teacher (first name) | Public label       | Grades  | Community name (do NOT use) |
| -------------------- | ------------------ | ------- | --------------------------- |
| Joy                  | Primary            | Pre-K–K | —                           |
| Zelinda              | Lower Elementary   | 1st–2nd | Firefly                     |
| Sabrina              | Upper Elementary   | 3rd–4th | Honeybee                    |
| Paige                | (confirm with user)| —       | —                           |

## Files touched each week

| File | Action |
| ---- | ------ |
| `public/assets/highlights/{folder}/` | Compress images (user provides folder) |
| `app/highlights/school-year/week-N/page.tsx` | **Create** new page (copy from previous week) |
| `app/lib/highlights/school-year-latest-preview.ts` | **Overwrite** with latest week data |
| `app/highlights/page.tsx` | **Prepend** to `SCHOOL_YEAR_WEEKS` array |
| `app/page.tsx` | Update section intro copy if week/theme changed |
| `app/community/page.tsx` | Update section intro copy if week/theme changed |

**Auto-updated via imports (no edit needed if preview module is correct):**

- `app/components/WeekRecapPreview.tsx` — imports `SCHOOL_YEAR_LATEST_*`
- `app/apply/page.tsx` — renders `WeekRecapPreview`
- `app/page.tsx` / `app/community/page.tsx` — `PREVIEW_WEEKS = [SCHOOL_YEAR_LATEST_CARD]`

**Out of scope (do not edit unless user asks):**

- `app/components/Hero.tsx`
- `app/links/page.tsx`
- `app/meet-miss-joy/page.tsx`

## Naming conventions

### Photo folders

| Week | Folder name | BASE constant |
| ---- | ----------- | ------------- |
| 1 | `school_week_one` | `/assets/highlights/school_week_one` |
| 2 | `school_week_two` | `/assets/highlights/school_week_two` |
| 3 | `school_week_three` | `/assets/highlights/school_week_three` |
| N | `school_week_{word}` | `/assets/highlights/school_week_{word}` |

Use spelled-out ordinals (`one`, `two`, `three`) matching existing pattern.

### Routes

| Week | Page path | href |
| ---- | --------- | ---- |
| N | `app/highlights/school-year/week-N/page.tsx` | `/highlights/school-year/week-N` |

### Preview module exports

All in `app/lib/highlights/school-year-latest-preview.ts`:

```ts
const BASE = "/assets/highlights/school_week_two";

export const SCHOOL_YEAR_LATEST_RECAP = {
  badge: "School Year 2026–27 · Week 2",
  heading: "See Week 2 of Our School Year",
  subtitle: "...",       // 1 sentence teaser
  body: "...",           // 2–3 sentences
  ctaLabel: "View Full Week 2 Recap →",
  href: "/highlights/school-year/week-2",
};

export const SCHOOL_YEAR_LATEST_PREVIEW_IMAGES = [ /* 6 paths */ ];
export const SCHOOL_YEAR_LATEST_PRIMARY = [ /* 4 bullets */ ];
export const SCHOOL_YEAR_LATEST_LOWER = [ /* 4 bullets */ ];
export const SCHOOL_YEAR_LATEST_UPPER = [ /* 4 bullets */ ];

export const SCHOOL_YEAR_LATEST_CARD = {
  week: 2,
  dates: "Aug 24–28",
  theme: "Theme from newsletter",
  href: "/highlights/school-year/week-2",
  coverImage: `${BASE}/best-cover-shot.jpg`,
};
```

## Image compression

### Primary: npm script (sharp)

```bash
npm run compress:highlights -- public/assets/highlights/school_week_two
```

Script: `scripts/compress-highlight-images.mjs` — max edge 1920px, JPEG quality 82, in-place overwrite.

### Fallback: macOS sips

If `sharp` install fails:

```bash
for f in public/assets/highlights/school_week_two/*.{JPG,jpg,JPEG,jpeg,PNG,png}; do
  [ -f "$f" ] && sips -Z 1920 "$f" --out "$f"
done
```

## Image selection guide

| Use | Count | Criteria |
| --- | ----- | -------- |
| Hero carousel | 6–8 | Strongest action shots, variety across grade bands |
| Preview marquee | 6 | Best mix for `WeekRecapPreview` scrolling strip |
| Index card cover | 1 | Single most compelling image (often outdoor/group) |
| Photo grid | All usable | Every non-blurry photo with specific caption |

**Important:** Preserve exact filenames including spaces (e.g. `B5E9BAE4-8895-4A91-BE6A-E8D0232594E0 2.JPG`).

View images before writing captions — describe what students are doing, not generic labels.

## Highlights page structure

Canonical template: `app/highlights/school-year/week-1/page.tsx`

Key constants at top of file:

```ts
const BASE = "/assets/highlights/school_week_one";
const WEEK_IMAGES: { src: string; caption: string }[] = [ /* all photos */ ];
const CAROUSEL_COUNT = 8;
const PRIMARY_HIGHLIGHTS = [ /* emoji, label, desc */ ];
const LOWER_ELEMENTARY_HIGHLIGHTS = [ /* ... */ ];
const UPPER_ELEMENTARY_HIGHLIGHTS = [ /* ... */ ];
```

Sections in render:

1. Navbar + hero carousel (auto-advance, prev/next)
2. Badge + week title + subtitle
3. "What We Learned" — 3 grade-band cards
4. "Beyond Academics" — Field Friday themed block
5. Photo gallery grid (opens lightbox)
6. Enrollment CTA
7. Footer + FloatingSMSButton

## Summer program (future)

If user requests summer highlights instead of school-year:

| Item | School year | Summer |
| ---- | ----------- | ------ |
| Page path | `app/highlights/school-year/week-N/` | `app/highlights/summer/week-N/` |
| Photo folder | `school_week_{word}` | `summer_week_{word}` |
| Index array | `SCHOOL_YEAR_WEEKS` | `SUMMER_WEEKS` |
| Preview module | `school-year-latest-preview.ts` | No rolling preview yet — confirm with user |

Default to school-year unless user specifies summer.

## Canonical example — Week 1 School Year '26–'27

| Item | Value |
| ---- | ----- |
| Newsletter ID | `007754b1-1abb-4e77-83b1-0f7914e01e53` |
| Week range | August 17–21 |
| Photo folder | `public/assets/highlights/school_week_one` |
| Page | `app/highlights/school-year/week-1/page.tsx` |
| Preview module | `app/lib/highlights/school-year-latest-preview.ts` (currently Week 1 data) |
| Field Friday | Wild Safari — animal silhouettes, safari binoculars, safari bingo, animal hide-and-seek |

Use Week 1 as the gold standard for page structure, copy tone, and image handling.

## Philosophy voice (use subtly)

Read when drafting — weave naturally, do not lecture.

| Theme | Ideas |
| ----- | ----- |
| How we learn | Hands-on, experiential, curiosity, creative problem-solving |
| Approaches | Montessori-inspired, Waldorf-inspired rhythm, Reggio-inspired inquiry |
| Academics | TEKS-aligned, discussion and reflection |
| Whole child | Emotional regulation, confidence, belonging |
| Setting | Small groups (~10), outdoor-focused, movement & nature |
| Programs | Field Day Friday, project-based learning |

Source files: `app/components/EducationalPhilosophySection.tsx`, `PhilosophyApproachesSection.tsx`, `WhatWeOfferSection.tsx`, `WelcomeSection.tsx`, `WeeklySchedule.tsx`.
