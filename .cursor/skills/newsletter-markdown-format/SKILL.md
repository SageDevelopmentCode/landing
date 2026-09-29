---
name: newsletter-markdown-format
description: >-
  Convert pasted plain text into newsletter-safe markdown for the teacher
  dashboard (Class Updates teacher updates and other section bodies). Adds
  section dividers, bold section titles, and moderate keyword emphasis while
  preserving wording. Use when the user pastes a draft update, asks to format
  text for the newsletter editor, or references @newsletter-markdown-format.
  Not for Supabase email or carousel workflows.
disable-model-invocation: true
---

# Newsletter Markdown Format

Turn pasted plain text into markdown you can paste into the teacher newsletter editor at `/teacher/dashboard/newsletter` — **Class Updates → teacher update** textareas and other section bodies use the same markdown.

**Preserve wording** — keep every sentence and fact from the author; normalize markdown syntax, add **section structure** (`---` between major blocks), and apply **moderate keyword bold** so parents can scan. Do not rewrite for tone, add emojis not in the paste, or invent content.

| Allowed | Still forbidden |
| ------- | --------------- |
| `**bold**` on existing words/phrases | Rewording, tone edits, new facts |
| `---` between distinct sections | New paragraphs the user did not provide |
| Bold section lines from paste (emoji titles, `Math • ELA`) | Teacher name, grade band, or UI section title |
| Emojis already in the paste | New emojis |

**Not this skill:** pulling content from Supabase or building outreach copy. Use [school-year-newsletter-email](../school-year-newsletter-email/SKILL.md), [newsletter-carousel-highlights](../newsletter-carousel-highlights/SKILL.md), or [newsletter-highlights-page](../newsletter-highlights-page/SKILL.md) for those workflows.

## When to use

- User pastes a draft teacher update, welcome blurb, events list, or reminders text
- User asks to format text for the newsletter dashboard or teacher update field
- User references `@newsletter-markdown-format`

## Prerequisites

- User provides the source text in the message (required)
- No Supabase, file edits, or commits unless the user separately asks

## Required inputs

| Input | Required | Notes |
| ----- | -------- | ----- |
| Pasted source text | Yes | Google Docs, Notes, email, etc. |
| `target` | No | `teacher_update` (default) or `section_body` — same markdown rules |
| `context` | No | e.g. "bulleted highlights only", "narrative only — minimal bold" |

## Workflow

Copy this checklist and track progress:

```
- [ ] Step 1: Read pasted text and optional target/context
- [ ] Step 2: Normalize structure, emphasis, and markdown syntax
- [ ] Step 3: Self-check against supported syntax
- [ ] Step 4: Output single copy-paste code block
```

### Step 1: Read input

Confirm you have the full paste. If the user only describes content without pasting it, ask them to paste the draft.

### Step 2: Normalize

Apply rules in [reference.md](reference.md). Summary:

**Syntax and cleanup**

- Strip trailing whitespace; normalize smart quotes where they break markdown
- Bullets: `•`, `*`, `–`, etc. → `- ` per line (keep `1.` ordered lists only when clearly intentional and short)
- Italic `_…_` when clearly intentional (match editor toolbar in `NewsletterPageClient.tsx`)
- Bare URLs → `[label](url)` when a label exists nearby; else short domain or URL as label
- Visual separators in paste → normalized `---` (see section breaks below)
- `# Heading` lines → `**Heading**` on its own line
- Strip/flatten HTML; keep text content
- **Do not** add teacher name, grade band, or section title (UI shows those)
- **Do not** rewrite sentences

**Section structure**

- Detect major blocks: subject headers (`Math • ELA`), emoji titles, `Field Friday`, spelling appendices, etc.
- Put each block title on its own line as `**Title**` (see [reference.md — Section breaks](reference.md#section-breaks)).
- Insert blank-line-wrapped `---` **between** major blocks, not between every paragraph.
- **Narrative-only** pastes (single-flow community/reflection letters with no subject headers): skip dividers and skip most inline keyword bold unless the user asks otherwise.

**Keyword emphasis (moderate)**

- Bold existing text only; follow priority order in [reference.md — Keyword emphasis](reference.md#keyword-emphasis-moderate).
- Cap about **1–3 curriculum/topic terms per section** so the update stays scannable, not fully bold.

**Paragraphs vs line breaks:** Preview uses `remarkBreaks` — blank line between paragraphs; single newlines within a paragraph become line breaks.

### Step 3: Self-check

Before sending output:

- No `#` headings, `![images]`, raw `<p>` / HTML tags, tables, or fenced code blocks
- Bullets use `- ` not `•`
- Dividers are exactly `---` on their own line, wrapped with blank lines between major sections
- At least one `---` when the paste has 2+ distinct topical sections; **no** `---` for narrative-only posts with no section breaks
- Bold does not break `**` pairing (use straight quotes near bold when needed)
- No bold on entire long paragraphs or every proper noun
- Links use `[text](https://…)` form

### Step 4: Output (critical)

1. One short line: e.g. "Copy the block below into your teacher update (or section body)."
2. **One** fenced markdown code block containing **only** the final markdown — no extra commentary inside the block.
3. No repository changes unless the user asked to save the text somewhere.

## Supported syntax (quick reference)

| Feature | Use |
| ------- | --- |
| Bold | `**text**` — section titles, labels, moderate keywords |
| Italic | `_text_` |
| Bullets | `- item` |
| Link | `[label](https://…)` |
| Divider | `---` on its own line between major sections |
| Subhead in update | `**Theme**` on its own line (not `#`) |
| Keyword emphasis | See [reference.md](reference.md#keyword-emphasis-moderate) |

Full matrix and before/after examples: [reference.md](reference.md).

## Rendering source of truth

Markdown is rendered in:

- `app/teacher/dashboard/newsletter/[id]/preview/PreviewClient.tsx`
- `app/newsletter/[id]/PublicNewsletterClient.tsx`

Custom components: `p`, `strong`, `em`, `ul`, `ol`, `li`, `a`, `br`, `hr` with `remarkBreaks`.
