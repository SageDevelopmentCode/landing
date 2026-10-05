# School Year Newsletter Welcome Message — Reference

## Supabase project

- Project ID: `vonuwpzepwrbdlectspd`
- Schema: `newsletters`
- MCP tool: `execute_sql` (read-only SELECT)

## SQL

Use the same queries as [school-year-newsletter-email/reference.md](../school-year-newsletter-email/reference.md):

- **List recent newsletters** / **Search by title or week** — to resolve the newsletter ID
- **Fetch full newsletter content** — replace `{newsletter_id}` with the UUID

After fetching, use only class-update rows with non-empty `teacher_body`.

## Classroom mapping

Parent-facing welcome copy uses **community name + Miss {FirstName}**. Update this table when staff or classroom names change (see also `scripts/*-teacher-account.sql` and offboarding scripts).

| First name (`teacher_name`) | Community label | Lead teacher title | Grades (internal) |
| --------------------------- | --------------- | ------------------ | ----------------- |
| Joy                         | Wildflowers     | Miss Joy           | Pre-K–K           |
| Zelinda                     | Fireflies       | Miss Zelinda       | 1st–2nd           |
| Sabrina                     | Honey Bees      | Miss Sabrina       | 3rd–4th           |

**Paragraph order:** Wildflowers → Fireflies → Honey Bees.

**Label format:** `**Wildflowers (Miss Joy)**` at the start of each class paragraph (or equivalent for other rows).

## Naming vs other newsletter skills

[newsletter-carousel-highlights](../newsletter-carousel-highlights/SKILL.md) and [newsletter-highlights-page](../newsletter-highlights-page/SKILL.md) use **grade-band labels** on public web/social copy and avoid community names (Firefly, Honeybee, etc.).

The **Welcome Message** in the parent newsletter is the exception: use Wildflowers, Fireflies, and Honey Bees here as specified above.

[school-year-newsletter-email](../school-year-newsletter-email/SKILL.md) email teasers may still use `{FirstName}'s Class ({grade band})` — that is separate from welcome-message drafting.

## Example output (structure only — abbreviate real weeks from DB)

```markdown
Hello Sage Field families,

Welcome to **Week 7**! This week (**September 28 – October 2**) our classrooms were busy with hands-on learning, community, and creativity.

**Wildflowers (Miss Joy)** followed their curiosity about found materials and began wondering how ants, food, and waste connect to caring for our environment. We celebrated Hispanic Heritage Month with *A Chair for My Mother* and clay chair-making, welcomed a new friend, and are weaving more Spanish into everyday routines.

**Fireflies (Miss Zelinda)** wrapped up September units with addition review, short-vowel phonics, properties-of-matter detective work, and continent/ocean globes. Field Friday was Camping Adventures, and students built their own omelettes step by step.

**Honey Bees (Miss Sabrina)** deepened division (including remainders), explored common and proper nouns, and used sensory details in writing. Cooking omelettes with Sage Field eggs, pumpkin mosaic art, and long-E spelling rounded out the week.

Thank you for reading along—see **Class Updates**, **Upcoming Events**, and **Parent Reminders** below for full details.

The Sage Field Team
```

Facts in a real draft must come from the current week’s `teacher_body` rows only; treat the example as layout, not copy to reuse verbatim.
