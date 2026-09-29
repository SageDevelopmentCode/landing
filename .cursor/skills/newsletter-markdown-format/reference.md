# Newsletter markdown reference

Syntax accepted by the teacher newsletter editor and public newsletter preview. Toolbar actions in `app/teacher/dashboard/newsletter/NewsletterPageClient.tsx` match these conventions.

## Supported vs unsupported

| Syntax | Supported | Notes |
| ------ | --------- | ----- |
| `**bold**` | Yes | Editor Bold button |
| `_italic_` | Yes | Editor Italic button |
| `- bullet` | Yes | Editor inserts `\n- ` |
| `[text](url)` | Yes | Editor link button |
| `---` horizontal rule | Yes | Editor divider inserts `\n---\n` |
| Single newline | Yes | `remarkBreaks` → line break |
| Blank line between blocks | Yes | New paragraph |
| `1. ordered` | Yes | Styled; use only when order matters |
| `**line**` as subhead | Yes | Preferred over `#` |
| `# ATX headings` | Avoid | Not in custom renderers; use `**Title**` |
| `![alt](url)` images | No | Use section image uploads |
| HTML tags | No | Flatten to plain text |
| Tables, blockquotes, code fences | No | Unstyled or inconsistent |

## Conversion rules

### Whitespace and quotes

- Trim trailing spaces on lines.
- Replace curly quotes with straight quotes when they interfere with `**` or `_` pairing.
- Collapse 3+ consecutive blank lines to 2.

### Bullets

Convert leading markers to `- `:

- `•`, `·`, `◦`, `▪`
- `*` or `–` or `—` when used as bullet (not emphasis)
- Tab-indented lines that were list items in Docs

Keep numbered lists as `1.` only when the source is clearly sequential steps (short lists). Otherwise use `-`.

### Emphasis

- `__bold__` → `**bold**`
- `*italic*` or `__italic__` in running text → `_italic_` when clearly italic (do not break list markers)

### Links

- `https://example.com/path` alone → `[example.com](https://example.com/path)` or keep descriptive text from the same line: `See our [signup page](https://…)`.
- Already markdown links: leave unchanged if valid.

### Section breaks

Use `---` to separate **distinct topical sections** in multi-part weekly updates.

**Insert `---` (with blank lines before and after):**

- Between multi-subject blocks (`Math • ELA`, `Science • Social Studies`, `Art • Music`, etc.)
- After a short intro paragraph when the intro is separate from the first subject block
- Before a spelling-word appendix or similar add-on block
- Before a closing thank-you when it follows a structured block (optional if it reads as one continuous sign-off)

**Do not insert `---`:**

- Between every paragraph within the same section
- In **narrative-only** pastes: continuous community or reflection letters with no subject headers (no section titles to separate)

**Format:** Match the editor divider: `\n\n---\n\n` between blocks.

Normalize stray rules in the paste (`___`, `***`, em-dash lines) to:

```
---
```

### Keyword emphasis (moderate)

Bold **existing text only** — never substitute words. Apply in priority order; stop when the section is scannable.

1. **Section / subsection titles** — Whole line on its own: `**🍂 Our Week of Wonder**`, `**Math • ELA**`, `**Field Friday**`, `**Reading & Spelling**`.
2. **List category labels** — `**Challenge words:**`, `**High Frequency Words:**`, or the full line `**This week's focus: Long E Vowel Teams**` when the paste treats it as a header.
3. **Named projects and themes** — Quoted titles in the paste: `"How to Make a PB&J"` → `**How to Make a PB&J**` (drop surrounding quotes when bolding).
4. **Event / theme names** — First mention in that section, e.g. **At the Zoo**, **Harvest Veggie Quinoa Bowls**.
5. **Unit / topic names** — About **1–3 per section**, terms a parent would scan for: **regrouping**, **states of matter**, **complimentary colors**, **Explanatory and Procedural Writing Unit**.

**Do not bold:** whole sentences, every proper noun, individual spelling list items, or filler words.

**Narrative-only exception:** For single-flow letters with no section headers, do not add dividers and do not add inline keyword bold unless the user requests emphasis.

### Dividers (paste cleanup)

Replace lines that are only `___`, `***`, `---` (with optional spaces), or em-dash rules with normalized `---` as described in [Section breaks](#section-breaks).

### Headings from paste

```
# Science week
```

→

```
**Science week**
```

Same for `##` / `###` — one bold line, no `#`.

### HTML

Strip tags; keep inner text. `<br>` → newline. `<b>` → `**`. `<i>` → `_`. `<a href="…">` → markdown link.

### Do not add

- Teacher name or "My class this week" header
- Grade band or community name (unless already in the paste)
- New sentences, facts, or emojis the user did not provide
- Section dividers or keyword bold in narrative-only pastes (unless user asks)

## Before / after examples

### Multi-subject weekly update (sections + moderate bold)

**Before (paste):**

```
Happy first week of fall! The fireflies have been enjoying our morning read out louds.

Math • ELA
In math, we have continued our focus on addition with counting on using a number line. Second grade has continued mastering how to add 2 digit numbers with and without regrouping.

Field Friday
Our Friday theme this week was At the Zoo! We followed up with painting our own zoo animal and zoo bingo during lunch.
```

**After:**

```
Happy first week of fall! The fireflies have been enjoying our morning read out louds.

---

**Math • ELA**

In math, we have continued our focus on addition with counting on using a number line. Second grade has continued mastering how to add 2 digit numbers with and without **regrouping**.

---

**Field Friday**

Our Friday theme this week was **At the Zoo**! We followed up with painting our own zoo animal and zoo bingo during lunch.
```

### Narrative-only (no dividers, minimal bold)

**Before (paste):**

```
Time is flying by! I want to remind all of us to pause and not miss the goodness happening right in front of us.

Thank you to this incredible community for showing up and helping Sage Field become a place of community and open doors.
```

**After:**

```
Time is flying by! I want to remind all of us to pause and not miss the goodness happening right in front of us.

Thank you to this incredible community for showing up and helping Sage Field become a place of community and open doors.
```

(No `---`; no added `**` unless the paste already had emphasis.)

### Google Doc bullets and bold

**Before (paste):**

```
This week we explored habitats.

• Forest animals
• River ecosystems
• **Field trip Friday** — dress for mud
```

**After:**

```
This week we explored habitats.

- Forest animals
- River ecosystems
- **Field trip Friday** — dress for mud
```

### Bare URL

**Before:**

```
Register here: https://sagefield.co/events/friday-field-day
```

**After:**

```
Register here: [sagefield.co/events/friday-field-day](https://sagefield.co/events/friday-field-day)
```

### Themes with divider

**Before:**

```
We finished our poetry unit.

_________________________

Next week we start fractions in math.
```

**After:**

```
We finished our poetry unit.

---

Next week we start **fractions** in math.
```

### Accidental markdown heading

**Before:**

```
# Reading corner

Students chose books for independent reading.
```

**After:**

```
**Reading corner**

Students chose books for independent reading.
```

## Smoke-test checklist

After formatting any paste, verify:

1. Output is a single code block with no nested fences.
2. Preview would show bullets as disc lists (`- ` only).
3. `---` appears alone on a line, with blank lines between major sections when the paste has multiple topical blocks.
4. No `#` at line start.
5. Wording matches the source (no rewrites).
6. Section divider count matches structure (0 for narrative-only; 1+ between distinct sections otherwise).
7. Moderate bold: section titles and labels bolded; ~1–3 topic terms per section; not an entire paragraph.

Manual check: paste into a draft teacher update → **Preview** at `/teacher/dashboard/newsletter/{id}/preview`.
