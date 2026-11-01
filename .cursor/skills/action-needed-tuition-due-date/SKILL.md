---
name: action-needed-tuition-due-date
description: >-
  Updates parent web and mobile Action Needed school-year tuition due subtext in
  getTuitionActionSubtext. Use when rolling monthly tuition due copy on parent
  home or mobile home, changing "Due … · Tap to pay now", or when the user
  references @action-needed-tuition-due-date.
---

# Action Needed Tuition Due Date

Roll the **School Year Tuition** row subtext under **Action Needed** on parent home (web) and mobile home. Copy is hardcoded in `getTuitionActionSubtext()` — update it each month before tuition is due.

## When to use

- User asks to update Action Needed tuition due date or subtext
- Monthly roll before a school-year tuition due date (e.g. “November tuition”)
- User references `@action-needed-tuition-due-date`

## Files to edit (must match exactly)

| File | Consumers |
| ---- | --------- |
| `shared/action-needed.ts` | `app/parent/home/ActionNeededCard.tsx` → `HomePageClient.tsx` |
| `apps/mobile/src/lib/action-needed.ts` | `apps/mobile/src/app/(tabs)/home.tsx` |

**Do not edit** home pages or `ActionNeededCard.tsx` for due-date copy — they only call the helper.

The mobile file must stay in sync with `shared/action-needed.ts` (see comment at top of mobile file).

## Workflow

Copy this checklist and track progress:

```
- [ ] Step 1: Resolve school-year month → calendar due date
- [ ] Step 2: Build datePhrase and full paid-branch string
- [ ] Step 3: Update both action-needed.ts files (same string)
- [ ] Step 4: Verify both files identical; grep for stale Due … strings
```

### Step 1: Resolve due date

Map the user’s month to the official **Tuition due** column in [school-year-tuition-status/reference.md](../school-year-tuition-status/reference.md). Default school year: **2026–27**.

Examples: October → Oct 1; November → Nov 1; August → **Aug 10** (only non-1st due date).

For month index aliases, see [school-year-tuition-status/SKILL.md](../school-year-tuition-status/SKILL.md) Step 1.

### Step 2: Build copy

`getTuitionActionSubtext` returns:

| Condition | String |
| --------- | ------ |
| Any enrolled student still owes supply fee | `Pay supply fee first` (change only if product copy changes) |
| Supply fee paid for all | `Due {datePhrase} · Tap to pay now` |

**`datePhrase` rules:**

- Abbreviated month with period: `Nov. 1`, `Oct. 1`, `Aug. 10`
- Use Unicode middle dot before CTA: ` · Tap to pay now` (not a hyphen)
- If updating **within ~7 days before due**, prefer a relative lead-in when natural: `this Sunday, Nov. 1`, `this Tuesday, Sep. 1`
- Otherwise calendar-only: `Nov. 1`, `Sep. 1`
- Compute weekday from the due date and “today” (message date or billing `getCurrentDate`); do not hardcode months in this skill

If wording is ambiguous, ask once for the exact `datePhrase` or full paid-branch string.

**Paid-branch template:**

```text
Due {datePhrase} · Tap to pay now
```

**Example (Nov 2026, due Nov 1 on a Sunday, updated late October):**

```text
Due this Sunday, Nov. 1 · Tap to pay now
```

Only change the **paid-branch** literal in both files unless the user explicitly changes supply-fee copy.

### Step 3: Apply edits

In both `shared/action-needed.ts` and `apps/mobile/src/lib/action-needed.ts`, update the string in the `return anySupplyFeeUnpaid ? … : …` branch (the line after `"Pay supply fee first"`).

### Step 4: Verify

- Diff both files: paid-branch strings must be identical
- Search repo for old due strings (e.g. previous month’s `Due …` text)
- Confirm no accidental edits to plan files or unrelated “Pay supply fee first” on billing cards

## User copy-paste template

Offer this when inputs are missing:

```markdown
School-year month (or index 1–10):
Optional exact datePhrase (e.g. this Sunday, Nov. 1):
Optional override full paid-branch string:
```

## Out of scope

| Surface | Use instead |
| ------- | ------------- |
| Weekly newsletter amber tuition callout | [school-year-newsletter-email](../school-year-newsletter-email/SKILL.md) |
| Who has / has not paid for outreach | [school-year-tuition-status](../school-year-tuition-status/SKILL.md) |
| Admin outreach “tuition due” emails | `app/admin/constants/outreachEmails.ts`, Zoho builders |
| Billing card “Pay supply fee first” | `SchoolYearBillingSection.tsx`, `HomePageClient.tsx` tuition cards — separate UI |

## Related skills

- [school-year-tuition-status](../school-year-tuition-status/SKILL.md) — paid / not paid lists and due-date reference table
- [school-year-newsletter-email](../school-year-newsletter-email/SKILL.md) — newsletter tuition callout (different copy path)

## Future improvement

Consider deriving `datePhrase` from `shared/billing/school-year` and `Intl` instead of manual monthly string updates. Not implemented today.
