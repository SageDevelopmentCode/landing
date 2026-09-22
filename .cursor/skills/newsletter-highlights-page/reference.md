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
| `app/homeschool/page.tsx` | Replace inline recap with `WeekRecapPreview` (or update constants) |
| `app/gallery/page.tsx` | Add `SCHOOL_YEAR_WEEK_N` array + prepend to `ALL_IMAGES` |
| `app/components/Hero.tsx` | **Update** school-year highlights slide (2nd slide in `slides`) |
| `app/shadow/page.tsx` | **Update** — roll forward two-week recap (images, highlights, copy, links) |

**Auto-updated via imports (no edit needed if preview module is correct):**

- `app/components/WeekRecapPreview.tsx` — imports `SCHOOL_YEAR_LATEST_*`
- `app/apply/page.tsx` — renders `WeekRecapPreview`
- `app/page.tsx` / `app/community/page.tsx` — `PREVIEW_WEEKS = [SCHOOL_YEAR_LATEST_CARD]`

**Optional checks for stale inline recaps:**

- `app/free/page.tsx` — summer Week 1 inline recap

**Out of scope (do not edit unless user asks):**

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

### Shadow page constants (`app/shadow/page.tsx`)

The shadow page keeps **two** weeks of inline data. Constant suffixes shift forward each ship:

| When shipping week | Image arrays | Highlight arrays |
| ------------------ | ------------ | ---------------- |
| 5 | `WEEK4_IMAGES`, `WEEK5_IMAGES` | `WEEK4_PRIMARY_HIGHLIGHTS`, `WEEK5_PRIMARY_HIGHLIGHTS`, etc. |
| 6 | `WEEK5_IMAGES`, `WEEK6_IMAGES` | `WEEK5_*`, `WEEK6_*` (drop week 4) |

Pattern: `WEEK{N}_IMAGES`, `WEEK{N}_PRIMARY_HIGHLIGHTS`, `WEEK{N}_LOWER_ELEM_HIGHLIGHTS`, `WEEK{N}_UPPER_ELEM_HIGHLIGHTS`.

Also update the grade-band `.map()` config keys and JSX week badges when renaming constants.

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

### Hero slide fields

Update the school-year highlights slide in `app/components/Hero.tsx` (2nd entry in the `slides` array). Mirror Step 7 preview data for consistency:

```ts
{
  image: SCHOOL_YEAR_LATEST_CARD.coverImage,
  title: "School Year Week N Highlights Are Live!",
  description: SCHOOL_YEAR_LATEST_RECAP.subtitle,
  buttonLabel: "View Week N Recap →",
  buttonHref: SCHOOL_YEAR_LATEST_RECAP.href,
}
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

## Shadow page two-week recap

**File:** `app/shadow/page.tsx` — route `/shadow` ($20 Shadow Day landing page).

**Not** `app/shadow-tour/page.tsx` (`/shadow-tour`, legacy $95 tour).

### When to run

Every school-year week, after Step 6 creates the week-N highlights page and Step 8 prepends the index entry.

### Which weeks to show

Use the two most recent entries in `SCHOOL_YEAR_WEEKS` (newest first):

- `SCHOOL_YEAR_WEEKS[0]` — latest week N
- `SCHOOL_YEAR_WEEKS[1]` — prior week N-1

### What to update

| Area | Details |
| ---- | ------- |
| Image arrays | `WEEK{N-1}_IMAGES`, `WEEK{N}_IMAGES` — all `.src` values from each week's `WEEK_IMAGES` |
| Carousel | `CAROUSEL_IMAGES = [...WEEK{N-1}_IMAGES, ...WEEK{N}_IMAGES]`; feeds mobile strip, desktop strip, expandable grid |
| Hero mosaic | 3 hardcoded desktop paths: latest-week cover (tall), prior-week standout, latest-week second shot |
| Badge | `Weeks {N-1} & {N} in Review` |
| Subtext | School-year framing referencing both weeks |
| Highlights | 6 arrays copied from week pages: primary / lower / upper for each week |
| Grade-band grid | `lg:grid-cols-3` outer; inner `sm:grid-cols-2` with Week {N-1} and Week {N} cards per band |
| Recap CTAs | `/highlights/school-year/week-{N-1}` and `/highlights/school-year/week-{N}` |

Source of truth for highlight bullets: `PRIMARY_HIGHLIGHTS`, `LOWER_ELEMENTARY_HIGHLIGHTS`, `UPPER_ELEMENTARY_HIGHLIGHTS` at the top of each week's highlights page.

### Carousel auto-scroll gotcha

The shadow page drives mobile (`sm:hidden`) and desktop (`hidden sm:block`) carousels from one `requestAnimationFrame` loop. The loop-reset check **must** use the visible scrollable element:

```ts
const activeEl = refs
  .map((r) => r.current)
  .find((el) => el && el.scrollWidth > el.clientWidth);
if (activeEl && activeEl.scrollLeft >= activeEl.scrollWidth / 2) {
  pos = 0;
  // reset both refs
}
```

Using the first ref blindly breaks desktop auto-scroll because the hidden mobile carousel has `scrollWidth === 0`, so `scrollLeft >= scrollWidth / 2` is always true and `pos` never advances.

### Verification

- `/shadow` — badge shows correct week numbers, carousel drifts on desktop and mobile, grade-band cards match both weeks, recap links work

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
| Preview module | `app/lib/highlights/school-year-latest-preview.ts` (Week 1 archival data) |
| Field Friday | Wild Safari — animal silhouettes, safari binoculars, safari bingo, animal hide-and-seek |

## Canonical example — Week 2 School Year '26–'27

| Item | Value |
| ---- | ----- |
| Newsletter ID | `7aa820ee-0538-4707-a3cd-16a2b74bb0b0` |
| Week range | August 24–28 |
| Photo folder | `public/assets/highlights/school_week_two` |
| Page | `app/highlights/school-year/week-2/page.tsx` |
| Preview module | `app/lib/highlights/school-year-latest-preview.ts` (currently latest week) |
| Field Friday | Construction Zone — oobleck cement dig, hard-hat decorating, LEGO building |
| Community event | Sage Field Community Garden Event (Thursday) |

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
