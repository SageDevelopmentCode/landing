---
name: school-year-newsletter-welcome-message
description: >-
  Draft school-year weekly newsletter Welcome Message markdown by summarizing
  teacher class updates from Supabase. Uses classroom labels Wildflowers, Fireflies,
  and Honey Bees with Miss names. Use when writing week N welcome copy, summarizing
  Class Updates for the newsletter editor, or when the user references
  @school-year-newsletter-welcome-message. Output is copy-paste only; no DB writes.
disable-model-invocation: true
---

# School Year Newsletter Welcome Message

Author the **Welcome Message** section for school-year weekly newsletters. Source content is `teacher_updates.body` in Supabase — not pasted teacher drafts. Deliver **markdown** in a single copy-paste code block for the newsletter editor.

**Not this skill:** formatting raw teacher paste ([newsletter-markdown-format](../newsletter-markdown-format/SKILL.md)); Zoho outreach HTML ([school-year-newsletter-email](../school-year-newsletter-email/SKILL.md)).

## When to use

- User asks for a welcome message for school year week N
- User is building a newsletter and wants a summary of Class Updates in the Welcome Message field
- User references `@school-year-newsletter-welcome-message`

## Prerequisites

- Supabase MCP available (`user-supabase`)
- Sage Field project ID: `vonuwpzepwrbdlectspd`
- Class Updates populated (or user confirms partial weeks are OK)

## Optional inputs

| Input | Notes |
| ----- | ----- |
| Newsletter ID / week / title | Required unless inferable from context |
| `tone` | Default warm; `shorter` = one sentence per class |
| `include_closer` | Default yes (pointer to Class Updates, Events, Reminders) |

## Workflow

Copy this checklist and track progress:

```
- [ ] Step 1: Identify newsletter (ID or search)
- [ ] Step 2: Query Supabase MCP (read-only)
- [ ] Step 3: Map teachers to classroom labels
- [ ] Step 4: Draft welcome from non-empty teacher bodies
- [ ] Step 5: Output markdown code block (no Supabase writes)
```

### Step 1: Identify newsletter

User may provide:

- UUID (from URL `sagefield.co/newsletter/{id}`)
- Title fragment (e.g. `Week 7 Sage Field School Year`)
- Week number (search `title` / `week_range`)

If multiple matches (e.g. summer camp vs school year), prefer `title ILIKE '%school year%'`.

If unclear, list recent newsletters — see [school-year-newsletter-email/reference.md](../school-year-newsletter-email/reference.md).

### Step 2: Query Supabase (read-only)

Use `execute_sql` on project `vonuwpzepwrbdlectspd`. **Read-only SELECT only.**

Never use `apply_migration` or write DDL on the hosted project. See `.cursor/rules/supabase-migrations-manual.mdc`.

Use the **Fetch full newsletter content** query in [reference.md](reference.md) (shared with the email skill). From results:

- Read `title`, `week_range`, `status` from the newsletter row
- Keep rows where `is_class_updates = true` and `trim(teacher_body)` is non-empty
- Ignore Photo Gallery and other non–class-update sections for drafting (optional: skim Events/Reminders only for a single tie-in line if it connects to class work)

### Step 3: Map teachers to classroom labels

Match **first name** from `teacher_name` (`admin.users.full_name`) to community labels in [reference.md](reference.md).

**Heading pattern per class paragraph:** lead with **`{Community} ({Miss FirstName})`** in bold, then the summary in the same paragraph (or start the paragraph with that bold label).

**Paragraph order (age ascending):** Wildflowers → Fireflies → Honey Bees.

- **Unmapped teacher** with a non-empty update: one short paragraph using **Miss {FirstName}** only; ask the user to confirm the community name for the mapping table.
- **Empty `teacher_body`:** omit that class (no “updates coming soon” unless the user asks).

### Step 4: Draft welcome

**Structure**

1. Greeting + opener (1–2 sentences): welcome to the week, include `week_range` when available
2. One paragraph per class with content, in Wildflowers → Fireflies → Honey Bees order
3. Optional short closer: point parents to **Class Updates**, **Upcoming Events**, and **Parent Reminders** below
4. Sign-off (e.g. “The Sage Field Team”) when `include_closer` is yes

**Writing rules**

- Warm, parent-facing, complete sentences — not keyword lists or full spelling-word dumps
- **2–4 themes per class** drawn only from that teacher’s `teacher_body`
- **Do not** invent facts, paste full teacher narratives, or include Photo Gallery content
- **Do not** duplicate full Upcoming Events; at most one line if it clearly ties to something in class updates
- Markdown: `**bold**` sparingly; book titles `*Title*`; no HTML

Full mapping, naming note vs carousel/highlights skills, and a structural example: [reference.md](reference.md).

### Step 5: Deliver

- Return the welcome as **one fenced markdown code block** for copy-paste into the Welcome Message section
- Briefly note `week_range` and `status` (draft vs published) if helpful
- **Do not** UPDATE Supabase unless the user explicitly requests a write in a separate task

## Example usage

User message:

> Write the Week 7 school year welcome from teacher updates

Agent actions:

1. Read this skill
2. MCP `execute_sql` — find `Week 7 Sage Field School Year`, fetch class updates
3. Draft opener + Wildflowers / Fireflies / Honey Bees paragraphs
4. Output markdown code block only

## Out of scope

- Supabase UPDATE of `sections.body` for Welcome Message
- Zoho email HTML, server actions, admin outreach buttons
- Formatting pasted teacher text ([newsletter-markdown-format](../newsletter-markdown-format/SKILL.md))

## Reference

- SQL pointer, classroom table, example welcome: [reference.md](reference.md)
- Newsletter email (trimmed welcome in outreach): [school-year-newsletter-email](../school-year-newsletter-email/SKILL.md)
- Carousel / highlights (different public naming rules): [newsletter-carousel-highlights](../newsletter-carousel-highlights/SKILL.md)
