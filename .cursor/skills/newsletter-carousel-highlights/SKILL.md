---
name: newsletter-carousel-highlights
description: >-
  Generate social media carousel slide copy (heading + body) from Supabase
  newsletter records. Use when creating Instagram or social recap carousel
  slides, weekly highlight posts, or when the user references a newsletter ID
  and wants carousel headings and bodies from Class Updates and Field Friday.
---

# Newsletter Carousel Highlights

Generate social media carousel slide copy for Sage Field weekly newsletters. Content comes from Supabase `newsletters` schema — not pasted guesswork. Output is **heading + body per slide** for Instagram/social carousels (8–10 slides typical).

**Copy-generation only** — no code changes, Canva design, or social posting unless the user separately asks.

## When to use

- User asks for carousel slides, Instagram highlights, or social recap from a newsletter
- User provides a newsletter ID, title, week number, or week range
- User references `@newsletter-carousel-highlights`

## Prerequisites

- Supabase MCP available (`user-supabase`)
- Sage Field project ID: `vonuwpzepwrbdlectspd`
- Newsletter is published (or user confirms draft content is final)

## Workflow

Copy this checklist and track progress:

```
- [ ] Step 1: Identify newsletter (ID or search)
- [ ] Step 2: Query Supabase MCP (read-only)
- [ ] Step 3: Map teacher updates to grade bands
- [ ] Step 4: Draft slides from class content
- [ ] Step 5: Apply voice and copy rules
- [ ] Step 6: Add Field Friday slide if applicable
- [ ] Step 7: Verify and output slides
```

### Step 1: Identify newsletter

User may provide:

- UUID (from URL `sagefield.co/newsletter/{id}`)
- Title fragment (e.g. "Week One", "Week 1")
- Week number (search `title` / `week_range`)

If unclear, list recent newsletters via MCP (see [reference.md](reference.md)).

### Step 2: Query Supabase (read-only)

Use `execute_sql` on project `vonuwpzepwrbdlectspd`. **Read-only SELECT only.**

Never use `apply_migration` or write DDL on the hosted project. See `.cursor/rules/supabase-migrations-manual.mdc`.

Full queries: [reference.md](reference.md). Shared SQL also documented in [school-year-newsletter-email/reference.md](../school-year-newsletter-email/reference.md).

### Step 3: Map class updates to grade bands

Class Updates use `teacher_updates.body` (markdown per teacher). Join `admin.users` for `full_name`. Skip empty bodies.

Map teachers to **public grade-band labels** using the internal table in [reference.md](reference.md). Use grade bands in slide output — never teacher names or community names (Firefly, Honeybee).

| Public label       | Grades   |
| ------------------ | -------- |
| Primary            | Pre-K–K  |
| Lower Elementary   | 1st–2nd  |
| Upper Elementary   | 3rd–4th  |

### Step 4: Draft slides

Default structure (~10 slides; adjust to 8–10 based on content density):

| Slide | Source                  | Notes                                                          |
| ----- | ----------------------- | -------------------------------------------------------------- |
| 1     | Cover                   | Week + `week_range`; brief cross-grade recap                   |
| 2–3   | Primary class update(s) | Split if two distinct themes (e.g. community + inquiry)        |
| 4–5   | Lower Elementary        | Routines + academics/activities                                |
| 6–8   | Upper Elementary        | Community + academics + enrichments (art, nature, music, etc.) |
| 9     | Field Friday            | All grade levels; ask user if not in newsletter                |
| 10    | Closing                 | Short; cross-grade wrap-up                                     |

- Split rich teacher write-ups into multiple slides (do not paste full markdown)
- Merge thin slides when a grade band has little content
- Pull specifics: academics, activities, outcomes, student behaviors/results

### Step 5: Apply voice and copy rules

**Grade bands in every body** — name Primary, Lower Elementary, or Upper Elementary (or Pre-K/Kindergarten, 1st–2nd, 3rd–4th) inside the body text, not only in headings.

**Never include:**

- Teacher names
- Classroom community names (Firefly, Honeybee)

**Body length:** 2–3 sentences max. Specific, outcome-oriented, impressive to prospective parents.

**No opener sentences** that explain what Sage Field is (e.g. "We're a microschool…"). Identity should emerge from the activities and results described.

**Tone:** Warm, professional, concrete over generic. Show academics and enrichments through what students actually did.

**Philosophy integration** (subtle — woven into headings/bodies when content supports it, not lecture-style):

- Source voice: `app/components/EducationalPhilosophySection.tsx`, `app/components/PhilosophyApproachesSection.tsx`, `app/components/WhatWeOfferSection.tsx`, `app/components/WelcomeSection.tsx`
- Use naturally when relevant: hands-on learning, inquiry, whole-child, small groups (~10), movement & nature, TEKS-aligned academics, project-based, emotional regulation, creative expression, Field Day Friday

Canonical example: [reference.md](reference.md) → Week 1 School Year '26–'27.

### Step 6: Field Friday slide

Add a dedicated Field Friday slide when:

- User provides theme and activities (often required — Field Friday may not be in the newsletter DB)
- Newsletter Upcoming Events or class updates mention Field Friday / Field Day Friday
- Weekly schedule context: unique outdoor experience (`app/components/WeeklySchedule.tsx`)

Format: all grade levels; list specific activities; tie to hands-on / outdoor / project-based learning when natural.

If theme is unknown, ask the user before finalizing.

### Step 7: Output format

Deliver numbered slides in chat:

```markdown
### Slide 1 — Cover
**Heading:** ...
**Body:** ...

### Slide 2 — Primary (Pre-K / Kindergarten)
**Heading:** ...
**Body:** ...
```

Optional: offer Instagram caption or 8-slide condensed version if user wants fewer slides.

## Example usage

User message:

> @newsletter-carousel-highlights make carousel slides for Week 1 school year newsletter

Agent actions:

1. Read this skill
2. MCP `execute_sql` — fetch newsletter + class updates
3. Map teachers → grade bands (internal only)
4. Draft 8–10 slides with headings and bodies
5. Ask for Field Friday details if not in newsletter

User message with extra context:

> @newsletter-carousel-highlights newsletter 007754b1-1abb-4e77-83b1-0f7914e01e53
> Field Friday was Wild Safari — silhouettes, binoculars, bingo, hide and seek

## Out of scope

- Photo selection / Canva design
- Writing code or posting to social platforms
- DDL or migrations on production via MCP
- Pasting full teacher narratives verbatim into slides

## Verify before delivering

- [ ] Newsletter fetched from Supabase (not pasted guesswork)
- [ ] Every body names the grade band (Primary / Lower Elementary / Upper Elementary)
- [ ] No teacher names or community names in output
- [ ] Bodies are 2–3 sentences, specific, outcome-oriented
- [ ] No generic "we are a microschool" opener on each slide
- [ ] Field Friday included when user provided or newsletter mentions it
- [ ] Slide count is 8–10 unless user requests otherwise

## Reference

- SQL queries, grade-band mapping, philosophy voice, canonical example: [reference.md](reference.md)
- Related skill (newsletter email): [school-year-newsletter-email](../school-year-newsletter-email/SKILL.md)
- Related skill (highlights page + WeekRecapPreview): [newsletter-highlights-page](../newsletter-highlights-page/SKILL.md)
- Newsletter schema: `supabase/migrations/20260801012118_remote_schema.sql` (`newsletters` schema)
