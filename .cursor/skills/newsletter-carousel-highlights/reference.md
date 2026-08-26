# Newsletter Carousel Highlights — Reference

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
    title ILIKE '%week one%'
    OR title ILIKE '%week 1%'
    OR week_range ILIKE '%aug%'
  )
ORDER BY created_at DESC;
```

Replace the `ILIKE` patterns with what the user provided.

## Fetch full newsletter content (carousel source)

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

## Section mapping for carousels

| Section label    | Carousel use                                              |
| ---------------- | --------------------------------------------------------- |
| Welcome Message  | Cover slide tone only — do not paste verbatim             |
| Class Updates    | Primary / Lower / Upper Elementary slides (main source)   |
| Upcoming Events  | Field Friday hint if theme listed; otherwise ask user     |
| Parent Reminders | Skip unless user wants a reminders slide (rare)           |
| Photo Gallery    | Skip (photos are visual pairing, not slide copy)          |

Class update bodies are **markdown** — extract themes, activities, and outcomes; do not render markdown in carousel output.

## Grade-band mapping (internal — never in slide copy)

Map `teacher_name` → public label. Update when staff changes.

| Teacher (first name) | Public label       | Grades  | Community name (do NOT use in slides) |
| -------------------- | ------------------ | ------- | ------------------------------------- |
| Joy                  | Primary            | Pre-K–K | —                                     |
| Zelinda              | Lower Elementary   | 1st–2nd | Firefly                               |
| Sabrina              | Upper Elementary   | 3rd–4th | Honeybee                              |
| Paige                | (confirm with user)| —       | —                                     |

If teacher unknown or unmapped, use grade band from user input or ask.

## Philosophy voice (use subtly in headings/bodies)

Read when drafting — do not quote marketing copy verbatim on every slide.

| Theme | Phrases / ideas to weave in when content supports them |
| ----- | -------------------------------------------------------- |
| How we learn | Hands-on learning, experiential, curiosity, creative problem-solving |
| Approaches | Montessori-inspired (child-led, manipulatives), Waldorf-inspired (rhythm, nature), Reggio-inspired (inquiry, projects) |
| Academics | TEKS-aligned, rigorous without rigid, discussion and reflection |
| Whole child | Emotional regulation, social development, confidence, belonging |
| Setting | Small groups (~10 per class), outdoor-focused microschool, movement & nature |
| Programs | Field Day Friday — unique outdoor experience; project-based learning |
| Offerings | Art, music, nature studies, homesteading, minimal worksheets, real-world engagement |

Source files:

- `app/components/EducationalPhilosophySection.tsx`
- `app/components/PhilosophyApproachesSection.tsx`
- `app/components/WhatWeOfferSection.tsx`
- `app/components/WelcomeSection.tsx`
- `app/components/WeeklySchedule.tsx` (Field Day Friday)

## Canonical example — Week 1 School Year '26–'27

Newsletter ID: `007754b1-1abb-4e77-83b1-0f7914e01e53`  
Week range: August 17–21  
Field Friday (user-provided; not in DB): Wild Safari — animal silhouettes, safari binoculars, safari bingo, animal hide-and-seek

Use this as the gold standard for tone, length, and structure.

---

### Slide 1 — Cover

**Heading:** Education Through Connection & Exploration

**Body:** Week one of our 2026–27 school year is complete. From our primary classroom through upper elementary — inquiry circles, writing workshops, animal care, and a Wild Safari Field Friday — our students hit the ground running. Here's a look at what the first week held.

---

### Slide 2 — Primary (Pre-K / Kindergarten)

**Heading:** A Strong Foundation, Together

**Body:** Our primary students spent week one learning classroom expectations, mapping their new environment, and practicing handwriting their names daily. By Friday, our Pre-K and Kindergarten learners were navigating their space with confidence, joining group discussions, and forming the friendships that turn a classroom into a community.

---

### Slide 3 — Primary (Pre-K / Kindergarten)

**Heading:** Curiosity Over Worksheets

**Body:** In our primary classroom, the "I Think, I Wonder, I Know" routine had Pre-K and Kindergarten students making predictions, defending ideas, and revising their thinking aloud. Questions like *"What do you think a bean is?"* sparked real debate — and organic math was woven in along the way.

---

### Slide 4 — Lower Elementary (1st–2nd Grade)

**Heading:** Rhythm, Routine & Emotional Safety

**Body:** Our lower elementary students worked through each area of the classroom — learning not just *what* the expectations are, but *why* they exist. First and second graders practiced quiet time as a thoughtful bridge from lunch into focused afternoon work, with boundaries and transitions built through conversation, not commands.

---

### Slide 5 — Lower Elementary (1st–2nd Grade)

**Heading:** Hands-On, Child-Led Learning

**Body:** Lower elementary morning work cycles put our 1st and 2nd graders in the driver's seat — letter boards, sticky-note equations, dice games for addition and subtraction, and one-on-one reading to establish individual levels. Afternoons focused on pencil grip, letter formation, and punctuation, plus show-and-tell and "All About Me" posters.

---

### Slide 6 — Upper Elementary (3rd–4th Grade)

**Heading:** Small Groups, Big Community

**Body:** With roughly 10 students per class, every upper elementary child is known by name, strengths, and learning style. Our 3rd and 4th graders practiced sharing ideas, supported one another through new routines, and by Friday were already taking ownership of their learning environment.

---

### Slide 7 — Upper Elementary (3rd–4th Grade)

**Heading:** TEKS-Aligned Academics, Sage Field Style

**Body:** Upper elementary students worked through directed writing with grammar and conventions, independent editing through the CUPS strategy, and free writing sparked by *"I think…," "I notice…,"* and *"I wonder…"* prompts. Our 3rd and 4th graders began *The Wild Robot* — comparing book to film, making inferences, and building vocabulary — while math review covered addition, subtraction, multiplication, rounding, PEMDAS, and number sense.

---

### Slide 8 — Upper Elementary (3rd–4th Grade)

**Heading:** Head, Heart & Hands

**Body:** Our upper elementary students explored free painting and discussed process vs. product in art. Third and fourth graders learned respectful chicken care — including how animals stay cool in Texas heat — and helped prepare frozen treats. On keyboards, they located notes and played simple songs, while several practiced public speaking through Sharing.

---

### Slide 9 — Field Friday

**Heading:** Field Day Friday: Wild Safari 🦁

**Body:** Students across all grade levels — primary through upper elementary — crafted animal silhouettes, built working safari binoculars, played safari bingo, and went on an animal hide-and-seek hunt across campus. Fine motor skills, spatial awareness, teamwork, and creative problem-solving — all in one outdoor adventure.

---

### Slide 10 — Closing

**Heading:** This Is Sage Field

**Body:** From our primary classroom to upper elementary, the curiosity, confidence, and community are already showing. School year 2026–27 has officially begun — and we're just getting started. 🌿

---

## Condensing to 8 slides

If the user wants fewer slides, merge in this order:

1. Slides 2 + 3 (Primary community + inquiry)
2. Slides 7 + 8 (Upper academics + enrichments)
3. Drop Slide 10 (end on Field Friday)
