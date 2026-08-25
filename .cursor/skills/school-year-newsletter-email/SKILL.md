---
name: school-year-newsletter-email
description: >-
  Build school-year weekly newsletter outreach emails from Supabase newsletter
  records. Use when creating week N school year newsletter emails, sending
  newsletter outreach from admin, or when the user references a newsletter ID
  and wants the zoho email template populated from Class Updates, Upcoming
  Events, and Parent Reminders.
---

# School Year Newsletter Email

Build parent outreach emails for school-year weekly newsletters. Content comes from Supabase `newsletters` schema — not pasted copy. Layout matches `buildSchoolYearWeekOneNewsletterEmail` in `app/lib/zoho.ts`.

## When to use

- User asks to create/send a school year week N newsletter email
- User provides a newsletter ID, title, or week number and wants the outreach email built
- User references `@school-year-newsletter-email`

## Prerequisites

- Supabase MCP available (`user-supabase`)
- Sage Field project ID: `vonuwpzepwrbdlectspd`
- Newsletter is published (or user confirms draft content is final)

## Workflow

Copy this checklist and track progress:

```
- [ ] Step 1: Identify newsletter (ID or search)
- [ ] Step 2: Query Supabase MCP (read-only)
- [ ] Step 3: Map sections to email blocks
- [ ] Step 4: Condense class updates to teasers
- [ ] Step 5: Build HTML in zoho.ts
- [ ] Step 6: Add server action + admin button
- [ ] Step 7: Verify link, password, section order
```

### Step 1: Identify newsletter

User may provide:

- UUID (from URL `sagefield.co/newsletter/{id}`)
- Title fragment (e.g. "Week Two")
- Week number (search `title` / `week_range`)

If unclear, list recent newsletters via MCP (see [reference.md](reference.md)).

### Step 2: Query Supabase (read-only)

Use `execute_sql` on project `vonuwpzepwrbdlectspd`. **Read-only SELECT only.**

Never use `apply_migration` or write DDL on the hosted project. See `.cursor/rules/supabase-migrations-manual.mdc`.

Full queries: [reference.md](reference.md).

### Step 3: Map sections to email

Default section labels (from `apps/mobile/src/lib/newsletters-actions.ts`):

| Section label     | Email block                                      |
| ----------------- | ------------------------------------------------ |
| Welcome Message   | Intro paragraph(s) after greeting                |
| Class Updates     | Condensed Classroom Highlights teasers           |
| Upcoming Events   | Upcoming Events bullets                          |
| Parent Reminders  | Parent Reminders bullets                         |
| Photo Gallery     | Skip (photos live in newsletter)                 |

Newsletter row fields:

| Field             | Email use                                        |
| ----------------- | ------------------------------------------------ |
| `id`              | `https://sagefield.co/newsletter/{id}`           |
| `title`           | CTA heading / subject inspiration                |
| `week_range`      | Subject line context                             |
| `access_password` | Password badge in CTA box                        |

Class Updates use `teacher_updates.body` (markdown per teacher). Join `admin.users` for `full_name`.

**Bodies are markdown** — convert `-` list items to HTML `<li>`; use `&amp;` in HTML attributes.

### Step 4: Condense class highlights

Do **not** paste full teacher write-ups into the email. One teaser bullet per teacher with non-empty body:

- Format: `{FirstName}'s Class ({grade band})` — 3–6 topic keywords
- Footer: "Read the full classroom stories, photos, and details in the newsletter above."

Known grade bands (update if staff changes):

| Teacher (first name) | Grade band   | Community name |
| -------------------- | ------------ | -------------- |
| Joy                  | Pre-K–K      | —              |
| Zelinda              | 1st–2nd      | Firefly        |
| Sabrina              | 3rd–4th      | Honeybee       |

If grade band unknown, use teacher name only or ask the user.

### Step 5: Build email in zoho.ts

Canonical template: `buildSchoolYearWeekOneNewsletterEmail` in `app/lib/zoho.ts`.

Section order:

1. Greeting `Hi ${firstName}!`
2. Welcome intro (trimmed from Welcome Message)
3. Newsletter CTA (main green box — link + password)
4. Classroom Highlights (teaser bullets)
5. Upcoming Events
6. Parent Reminders
7. Download the App (`https://sagefield.co/download`) — copy verbatim from week one
8. Referral Program — copy verbatim from week one
9. Share Your Story — copy verbatim from week one
10. Closing — Warmly, Sage Field School

Function signature:

```ts
export async function buildSchoolYearWeek{N}NewsletterEmail(opts: {
  g1FullName: string;
  childLegalName: string;
}): Promise<{ subject: string; content: string }>
```

Subject pattern: `Week {N} Newsletter — {short hook} 🌿`

HTML skeleton and static blocks: [reference.md](reference.md).

### Step 6: Wire up send path

Per week, add three files/changes (match summer newsletter pattern):

| File | Action |
| ---- | ------ |
| `app/lib/zoho.ts` | `buildSchoolYearWeek{N}NewsletterEmail` |
| `app/actions/sendSchoolYearWeek{N}NewsletterEmail.ts` | Thin `"use server"` wrapper calling `build*` + `sendZohoEmail` |
| `app/admin/components/ApplicationDetailSidebar.tsx` | Button on **School Year** Outreach tab |

Copy `sendSchoolYearWeekOneNewsletterEmail.ts` as the action template.

Admin handler pattern: state (`sending` / `sent` / `error`), `handleSendSchoolYearWeek{N}Newsletter`, refresh email thread on success.

Prefer separate `buildSchoolYearWeek{N}NewsletterEmail` functions per week (matches summer newsletters). A shared parameterized builder is optional only if the user requests it.

### Step 7: Verify

- Newsletter URL: `https://sagefield.co/newsletter/{id}`
- Password matches `access_password` from DB
- CTA appears before teaser bullets
- Events/reminders bullets match newsletter section content (condensed, not omitted)
- App download, referral, and testimonial blocks present

## Example usage

User message:

> Create the school year week 2 newsletter email from newsletter `abc123...`

Agent actions:

1. Read this skill
2. MCP `execute_sql` — fetch newsletter + sections
3. Map Welcome / Class / Events / Reminders
4. Add `buildSchoolYearWeekTwoNewsletterEmail` + action + admin button
5. Report newsletter link and subject line

## Out of scope

- Photo Gallery content in email body
- DDL or migrations on production via MCP
- Pasting full classroom narratives (use teasers + newsletter link)

## Reference

- SQL queries + HTML skeleton: [reference.md](reference.md)
- Social carousel slides (heading + body): [newsletter-carousel-highlights](../newsletter-carousel-highlights/SKILL.md)
- Canonical email: `app/lib/zoho.ts` → `buildSchoolYearWeekOneNewsletterEmail`
- Newsletter schema: `supabase/migrations/20260801012118_remote_schema.sql` (`newsletters` schema)
- Section defaults: `apps/mobile/src/lib/newsletters-actions.ts` → `DEFAULT_SECTIONS`
