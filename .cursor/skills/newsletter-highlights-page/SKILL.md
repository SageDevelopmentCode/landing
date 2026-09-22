---
name: newsletter-highlights-page
description: >-
  Build a school-year weekly highlights page and update WeekRecapPreview from
  a Supabase newsletter and photo folder. Use when creating /highlights/
  school-year/week-N pages, updating the week recap preview, or when the user
  provides a newsletter plus public/assets/highlights/ photos.
---

# Newsletter Highlights Page

Build a full school-year weekly highlights page and roll forward the shared WeekRecapPreview + homepage card from a Supabase newsletter and a user-provided photo folder.

**Code + content workflow** — creates pages, updates preview data, and compresses images. For Instagram carousel copy only, use [newsletter-carousel-highlights](../newsletter-carousel-highlights/SKILL.md). For parent email, use [school-year-newsletter-email](../school-year-newsletter-email/SKILL.md).

## When to use

- User asks to create a highlights page, week recap, or weekly photo recap on the website
- User provides a newsletter ID/title/week **and** a photo folder path
- User references `@newsletter-highlights-page`

## Prerequisites

- Supabase MCP available (`user-supabase`)
- Sage Field project ID: `vonuwpzepwrbdlectspd`
- Photo folder exists under `public/assets/highlights/` (user may need to add photos first)
- Newsletter is published (or user confirms draft content is final)

## Required inputs

Ask if not provided:

| Input | Example | Notes |
| ----- | ------- | ----- |
| Newsletter | UUID, "Week 2", title fragment | Same lookup as carousel skill |
| Photo folder | `public/assets/highlights/school_week_two` | Must be under `public/assets/highlights/` |
| Field Friday | theme + activities | Ask if not in newsletter DB. For live signup page + Stripe + homepage promo, use [friday-field-day-page](../friday-field-day-page/SKILL.md) |
| Program | `school-year` (default) | Summer paths in [reference.md](reference.md) |

## Workflow

Copy this checklist and track progress:

```
- [ ] Step 1: Identify newsletter (ID or search)
- [ ] Step 2: Query Supabase MCP (read-only)
- [ ] Step 3: Compress photos in folder
- [ ] Step 4: View images and inventory filenames
- [ ] Step 5: Map class updates to grade bands
- [ ] Step 6: Create highlights page (week-N)
- [ ] Step 7: Update rolling preview module
- [ ] Step 8: Update highlights index
- [ ] Step 9: Update homepage + community grids
- [ ] Step 9b: Update inline recap pages (homeschool, etc.)
- [ ] Step 9c: Update Hero.tsx highlights slide
- [ ] Step 9d: Update shadow page (last two school-year weeks)
- [ ] Step 10: Add photos to gallery
- [ ] Step 11: Build and verify
```

### Step 1: Identify newsletter

User may provide:

- UUID (from URL `sagefield.co/newsletter/{id}`)
- Title fragment (e.g. "Week Two", "Week 2")
- Week number (search `title` / `week_range`)

If unclear, list recent newsletters via MCP (see [reference.md](reference.md)).

### Step 2: Query Supabase (read-only)

Use `execute_sql` on project `vonuwpzepwrbdlectspd`. **Read-only SELECT only.**

Never use `apply_migration` or write DDL on the hosted project. See `.cursor/rules/supabase-migrations-manual.mdc`.

### Step 3: Compress photos

```bash
npm run compress:highlights -- public/assets/highlights/school_week_two
```

Replace the path with the user's folder. If `sharp` is unavailable, use macOS `sips` fallback documented in [reference.md](reference.md).

### Step 4: View images and inventory

1. List all image files in the folder (preserve exact filenames — some have spaces)
2. **View** a representative subset of photos to write accurate captions
3. Select images for:
   - Hero carousel (first 6–8 strong shots)
   - `SCHOOL_YEAR_LATEST_PREVIEW_IMAGES` (6 images for marquee strip)
   - Cover image for highlights index card + `SCHOOL_YEAR_LATEST_CARD`
   - Full `WEEK_IMAGES` grid (all usable photos with captions)

Use exact filenames in paths: `/assets/highlights/{folder_name}/{filename}`.

### Step 5: Map class updates to grade bands

Class Updates use `teacher_updates.body` (markdown per teacher). Join `admin.users` for `full_name`. Skip empty bodies.

Map teachers to **public grade-band labels** using the internal table in [reference.md](reference.md). Use grade bands in all public copy — never teacher names or community names (Firefly, Honeybee).

| Public label       | Grades   |
| ------------------ | -------- |
| Primary            | Pre-K–K  |
| Lower Elementary   | 1st–2nd  |
| Upper Elementary   | 3rd–4th  |

Extract 4 highlight bullets per grade band (emoji, label, short desc) from newsletter content.

### Step 6: Create highlights page

Copy structure from the most recent school-year week page (canonical: [`app/highlights/school-year/week-1/page.tsx`](../../../app/highlights/school-year/week-1/page.tsx)) into `app/highlights/school-year/week-N/page.tsx`.

Update:

- `BASE` constant (web path, e.g. `/assets/highlights/school_week_two`)
- `WEEK_IMAGES` array with captions for every photo
- `CAROUSEL_COUNT` to match hero carousel image count
- `PRIMARY_HIGHLIGHTS`, `LOWER_ELEMENTARY_HIGHLIGHTS`, `UPPER_ELEMENTARY_HIGHLIGHTS` (4–5 bullets each)
- Hero badge, heading, subtitle copy
- Field Friday / Beyond Academics section when applicable
- Component export name (e.g. `SchoolYearWeekTwoPage`)
- Enrollment CTA links unchanged

Page sections (mirror Week 1):

1. Hero carousel with week badge (`School Year 2026–27 · Week N`)
2. Three "What We Learned" grade-band cards
3. Beyond Academics / Field Friday block
4. Photo grid with lightbox
5. Enrollment CTA

### Step 7: Update rolling preview module

**Overwrite** [`app/lib/highlights/school-year-latest-preview.ts`](../../../app/lib/highlights/school-year-latest-preview.ts) with the new week's data. This file powers `WeekRecapPreview` and the homepage card — it always reflects the **latest** published week.

Exports to update:

```ts
SCHOOL_YEAR_LATEST_RECAP        // badge, heading, subtitle, body, ctaLabel, href
SCHOOL_YEAR_LATEST_PREVIEW_IMAGES  // 6 image paths
SCHOOL_YEAR_LATEST_PRIMARY      // 4 highlight bullets
SCHOOL_YEAR_LATEST_LOWER
SCHOOL_YEAR_LATEST_UPPER
SCHOOL_YEAR_LATEST_CARD         // week, dates, theme, href, coverImage
```

`WeekRecapPreview` imports from this file — no component changes needed unless structure changes.

Preview copy should be shorter than the full page (2–3 sentence body, concise bullet descs).

### Step 8: Update highlights index

Prepend the new week to `SCHOOL_YEAR_WEEKS` in [`app/highlights/page.tsx`](../../../app/highlights/page.tsx) (newest first):

```ts
{
  week: N,
  dates: "Aug 24–28",
  theme: "Theme from newsletter",
  href: "/highlights/school-year/week-N",
  coverImage: "/assets/highlights/school_week_two/cover.jpg",
}
```

Keep prior weeks in the array for archival navigation.

### Step 9: Update homepage + community grids

Both files import `SCHOOL_YEAR_LATEST_CARD` — no change needed if Step 7 updated the card correctly.

Update section intro copy in [`app/page.tsx`](../../../app/page.tsx) and [`app/community/page.tsx`](../../../app/community/page.tsx) if week number or theme changed materially (e.g. "Week 2" instead of "Week 1").

`WeekRecapPreview` on [`app/apply/page.tsx`](../../../app/apply/page.tsx) and tour page inherit the update automatically.

### Step 9b: Update inline recap pages

Some pages have **duplicated inline recap sections** with hardcoded summer-week constants instead of `WeekRecapPreview`. These go stale every school year.

**Required:** [`app/homeschool/page.tsx`](../../../app/homeschool/page.tsx) — replace the inline recap block with `<WeekRecapPreview className="bg-sage-50" />` and remove `WEEK*_PREVIEW_IMAGES` / highlight constants plus any `previewGalleryRef` scroll animation.

**Optional checks** (still on summer recaps unless user asks):

- [`app/free/page.tsx`](../../../app/free/page.tsx)

Prefer `WeekRecapPreview` over duplicating preview constants — it auto-updates when Step 7 is done. The shadow page is handled separately in Step 9d (two-week recap, not `WeekRecapPreview`).

### Step 9c: Update Hero slide

Update the school-year highlights slide in [`app/components/Hero.tsx`](../../../app/components/Hero.tsx). It is the **second slide** in the `slides` array (immediately after the Welcome slide).

Replace these fields each week — mirror `SCHOOL_YEAR_LATEST_RECAP` and `SCHOOL_YEAR_LATEST_CARD` from Step 7:

| Field | Source |
| ----- | ------ |
| `image` | `SCHOOL_YEAR_LATEST_CARD.coverImage` |
| `title` | `School Year Week N Highlights Are Live!` |
| `description` | `SCHOOL_YEAR_LATEST_RECAP.subtitle` (one-line teaser) |
| `buttonLabel` | `View Week N Recap →` |
| `buttonHref` | `SCHOOL_YEAR_LATEST_RECAP.href` |

### Step 9d: Update shadow page (last two school-year weeks)

**Required.** Update [`app/shadow/page.tsx`](../../../app/shadow/page.tsx) at `/shadow` (the $20 Shadow Day landing page). This is **not** [`app/shadow-tour/page.tsx`](../../../app/shadow-tour/page.tsx) (`/shadow-tour`, legacy $95 tour).

The shadow page shows a **two-week** combined recap (auto-scroll carousel, expandable photo grid, side-by-side grade-band cards). Do **not** replace it with `WeekRecapPreview` — that component only covers the latest single week.

When week **N** ships, showcase weeks **N-1** and **N**:

1. **Identify weeks** — after Step 8, read `SCHOOL_YEAR_WEEKS` in [`app/highlights/page.tsx`](../../../app/highlights/page.tsx) (or [`app/lib/highlights/weeks.ts`](../../../app/lib/highlights/weeks.ts)): index `[0]` = latest (N), index `[1]` = prior (N-1).
2. **Image arrays** — copy every `.src` from each week's `WEEK_IMAGES` into `WEEK{N-1}_IMAGES` and `WEEK{N}_IMAGES`. Set `CAROUSEL_IMAGES = [...WEEK{N-1}_IMAGES, ...WEEK{N}_IMAGES]`. Drop the oldest week's image array (e.g. when shipping week 6, remove `WEEK4_IMAGES`).
3. **Hero mosaic (desktop)** — update 3 hardcoded paths in the hero right column: tall image from latest week, square from prior week, square from latest week. Pick strong action shots (cover images from each week page are good defaults).
4. **Highlight constants** — copy `PRIMARY_HIGHLIGHTS`, `LOWER_ELEMENTARY_HIGHLIGHTS`, `UPPER_ELEMENTARY_HIGHLIGHTS` from both week pages into six shadow constants (`WEEK{N-1}_PRIMARY_HIGHLIGHTS`, etc.). Remove the dropped week's constants.
5. **Recap copy** — badge: `Weeks {N-1} & {N} in Review`; subtext references both weeks in school-year framing.
6. **Grade-band grid** — 3 columns (Primary, Lower Elementary, Upper Elementary), each with Week {N-1} and Week {N} cards. Update the `.map()` config object keys (`week4`/`week5` or `weekPrev`/`weekLatest`) **and** the JSX badge labels (`Week 4`, `Week 5`) to match the new week numbers whenever constants are renamed.
7. **Recap CTAs** — links to `/highlights/school-year/week-{N-1}` and `/week-{N}` with labels `View Full Week {N-1} Recap →` / `View Full Week {N} Recap →`.

**Carousel note:** Do not break the `requestAnimationFrame` loop reset — it must find the visible scrollable element (`scrollWidth > clientWidth`), not the hidden mobile ref. See [reference.md](reference.md).

Full field list and naming patterns: [reference.md — Shadow page two-week recap](reference.md#shadow-page-two-week-recap).

### Step 10: Add photos to gallery

In [`app/gallery/page.tsx`](../../../app/gallery/page.tsx):

1. Add `SCHOOL_YEAR_WEEK_N` array with all filenames from the compressed folder
2. Prepend to `ALL_IMAGES` (newest first)
3. Update hero badge if needed (e.g. `School Year & Summer 2026` when school-year photos are included)

Use alt text like `School Year Week N — {filename}`.

### Step 11: Build and verify

```bash
npm run build
```

Spot-check routes:

- `/highlights/school-year/week-N` — full page, carousel, grid, lightbox
- `/highlights` — new card appears first in School Year section
- `/` — Hero carousel highlights slide + WeekRecapPreview marquee + grade cards + CTA
- `/apply` — WeekRecapPreview section
- `/community` — highlights grid card
- `/homeschool` — WeekRecapPreview (not stale summer inline recap)
- `/shadow` — two-week recap badge, carousel auto-scroll, grade-band cards, recap links
- `/gallery` — new week's photos appear at top of grid

## Copy rules

Same voice as [newsletter-carousel-highlights](../newsletter-carousel-highlights/SKILL.md):

**Grade bands in public copy** — name Primary, Lower Elementary, or Upper Elementary in page body text and captions where natural.

**Never include:**

- Teacher names
- Classroom community names (Firefly, Honeybee)

**Tone:** Warm, professional, concrete. Show academics and enrichments through what students actually did.

**No generic opener** explaining what Sage Field is — identity emerges from activities described.

**Field Friday:** Dedicated section when user provides theme/activities or newsletter mentions Field Day Friday. Ask user if unknown. For the live `/friday` signup page, Stripe labels, and homepage promo, use [friday-field-day-page](../friday-field-day-page/SKILL.md).

**Photo captions:** Short, specific, outcome-oriented (what students are doing + grade band or activity when visible).

## Example usage

User message:

> @newsletter-highlights-page Week 2 school year newsletter
> Photos: `public/assets/highlights/school_week_two`
> Field Friday: Ocean Explorers — tide pools, sand art, shell sorting

Agent actions:

1. Read this skill
2. MCP fetch newsletter + class updates
3. Compress images in `school_week_two`
4. View photos, write captions
5. Create `app/highlights/school-year/week-2/page.tsx`
6. Overwrite `school-year-latest-preview.ts`
7. Prepend to `SCHOOL_YEAR_WEEKS` in highlights index
8. Update homepage section copy if needed
9. Replace homeschool inline recap with `WeekRecapPreview`
10. Update Hero.tsx highlights slide
11. Update `app/shadow/page.tsx` with weeks N-1 and N photos, highlights, and recap links
12. Add photos to `app/gallery/page.tsx`
13. `npm run build`

## Out of scope

- Instagram carousel copy ([newsletter-carousel-highlights](../newsletter-carousel-highlights/SKILL.md))
- Zoho parent email ([school-year-newsletter-email](../school-year-newsletter-email/SKILL.md))
- `app/links/page.tsx`, `app/meet-miss-joy/page.tsx`
- Supabase DDL / migrations
- Canva design or social posting

## Verify before delivering

- [ ] Newsletter fetched from Supabase (not pasted guesswork)
- [ ] Images compressed in user-provided folder
- [ ] Highlights page created at correct route with all photos captioned
- [ ] `school-year-latest-preview.ts` updated with new week data
- [ ] Highlights index prepended with new week card
- [ ] Homeschool page uses `WeekRecapPreview` (no stale inline summer recap)
- [ ] Gallery updated with new week's photos
- [ ] Hero.tsx highlights slide updated to latest week
- [ ] Shadow page shows weeks N-1 & N (photos, badge, grade-band cards, recap links)
- [ ] Shadow page carousel auto-scrolls on desktop and mobile
- [ ] No teacher names or community names in public copy
- [ ] Field Friday section included when applicable
- [ ] `npm run build` passes

## Reference

- SQL queries, file touch list, naming conventions, Week 1 canonical paths: [reference.md](reference.md)
- Carousel copy rules and grade-band mapping: [newsletter-carousel-highlights/reference.md](../newsletter-carousel-highlights/reference.md)
- Newsletter email queries: [school-year-newsletter-email/reference.md](../school-year-newsletter-email/reference.md)
