# School Year Tuition Status — Reference

## Supabase project

- Project ID: `vonuwpzepwrbdlectspd`
- Schemas: `parent_app`, `billing`
- MCP tool: `execute_sql` (read-only SELECT)

## Month index table (2026–27 school year)

Tuition month index matches `dateToSchoolYearMonthIndex` in `shared/billing/school-year-attendance.ts` and `selected_months` / `selected_weeks` in Stripe metadata.

| Index | Month key | Calendar month | Tuition due | Late fee after |
| ----- | --------- | -------------- | ----------- | -------------- |
| 1 | `aug_26` | August 2026 | Aug 10* | Aug 13* |
| 2 | `sep_26` | September 2026 | Sep 1 | Sep 4 |
| 3 | `oct_26` | October 2026 | Oct 1 | Oct 4 |
| 4 | `nov_26` | November 2026 | Nov 1 | Nov 4 |
| 5 | `dec_26` | December 2026 | Dec 1 | Dec 4 |
| 6 | `jan_27` | January 2027 | Jan 1 | Jan 4 |
| 7 | `feb_27` | February 2027 | Feb 1 | Feb 4 |
| 8 | `mar_27` | March 2027 | Mar 1 | Mar 4 |
| 9 | `apr_27` | April 2027 | Apr 1 | Apr 4 |
| 10 | `may_27` | May 2027 | May 1 | May 4 |

\*August is the only month with a non-1st due date and a non-4th late-fee date.

## Main query: paid / not paid for a month

Replace `{month_index}` with integer 1–10 before running.

```sql
WITH school_year_enrolled AS (
  SELECT
    a.id AS application_id,
    a.student_id,
    a.child_legal_name,
    a.preferred_name,
    a.child_grade,
    a.program,
    a.drop_in_program,
    a.g1_full_name,
    a.g1_email,
    a.admin_tags,
    CASE
      WHEN a.program = 'homeschool_drop_in'
        AND a.drop_in_program IN ('school_year_26_27', 'both')
      THEN 'homeschool_drop_in'
      ELSE 'school_year'
    END AS billing_type
  FROM parent_app.applications a
  WHERE a.status = 'enrolled'
    AND (
      a.program IN ('school_year_26_27', 'both')
      OR (
        a.program = 'homeschool_drop_in'
        AND a.drop_in_program IN ('school_year_26_27', 'both')
      )
    )
    AND NOT ('Don''t Include' = ANY(COALESCE(a.admin_tags, ARRAY[]::text[])))
),
supply_fee_paid AS (
  SELECT DISTINCT st.student_id
  FROM billing.stripe_transactions st
  WHERE st.payment_type = 'supply_fee'
    AND st.status = 'completed'
    AND st.is_deleted = false
    AND st.student_id IS NOT NULL
),
month_paid AS (
  SELECT DISTINCT st.student_id
  FROM billing.stripe_transactions st
  WHERE st.status = 'completed'
    AND st.is_deleted = false
    AND st.student_id IS NOT NULL
    AND (
      -- Full-time school year tuition for the month
      (
        st.payment_type = 'school_year_tuition'
        AND EXISTS (
          SELECT 1
          FROM unnest(string_to_array(COALESCE(st.metadata->>'selected_months', ''), ',')) AS m(val)
          WHERE NULLIF(trim(m.val), '')::int = {month_index}
        )
      )
      OR (
        -- Homeschool drop-in for the month
        st.payment_type = 'homeschool_dropin'
        AND st.metadata->>'program' = 'school_year_26_27'
        AND (
          EXISTS (
            SELECT 1
            FROM unnest(string_to_array(COALESCE(st.metadata->>'selected_weeks', ''), ',')) AS w(val)
            WHERE NULLIF(trim(w.val), '')::int = {month_index}
          )
          OR COALESCE(st.metadata->>'week_selections', '') LIKE '%"week":{month_index}%'
          OR COALESCE(st.metadata->>'week_selections', '') LIKE '%"week": {month_index}%'
        )
      )
      OR (
        -- Supply fee bundled with school year tuition for the month
        st.payment_type = 'supply_fee'
        AND st.metadata->>'bundle_type' = 'school_year_tuition'
        AND (st.metadata->>'bundle_month_index')::int = {month_index}
      )
      OR (
        -- Supply fee bundled with homeschool drop-in for the month
        st.payment_type = 'supply_fee'
        AND st.metadata->>'bundle_type' = 'homeschool'
        AND (st.metadata->>'bundle_month_index')::int = {month_index}
      )
    )
)
SELECT
  e.child_legal_name,
  COALESCE(NULLIF(e.preferred_name, ''), e.child_legal_name) AS display_name,
  e.child_grade,
  e.program,
  e.drop_in_program,
  e.billing_type,
  e.g1_full_name,
  e.g1_email,
  CASE WHEN mp.student_id IS NOT NULL THEN 'paid' ELSE 'not_paid' END AS month_status
FROM school_year_enrolled e
INNER JOIN supply_fee_paid sf ON sf.student_id = e.student_id
LEFT JOIN month_paid mp ON mp.student_id = e.student_id
ORDER BY month_status, e.billing_type, e.child_legal_name;
```

### Example: September 2026

Substitute `{month_index}` → `2`:

```sql
-- Same query as above with all {month_index} replaced by 2
```

Expected baseline: query returns `paid` / `not_paid` rows grouped by `billing_type`. Counts change as families pay — re-run for current numbers.

## Summary counts query

Optional quick counts after substituting `{month_index}`:

```sql
-- Wrap main query:
SELECT month_status, billing_type, COUNT(*) AS student_count
FROM (
  -- paste main SELECT here
) sub
GROUP BY month_status, billing_type
ORDER BY month_status, billing_type;
```

## Deduped unpaid parent emails

Run in application logic from main query results, or use:

```sql
WITH main AS (
  -- paste full main query with {month_index} substituted
)
SELECT
  g1_email,
  billing_type,
  string_agg(display_name, ', ' ORDER BY display_name) AS students,
  COUNT(*) AS student_count
FROM main
WHERE month_status = 'not_paid'
GROUP BY g1_email, billing_type
ORDER BY billing_type, g1_email;
```

## Reminder template mapping

| `billing_type` | Zoho builder (prefer month-specific if exists) |
| -------------- | ---------------------------------------------- |
| `school_year` | `buildSchoolYear{Month}TuitionReminderEmail` or `buildSchoolYearTuitionReminderEmail` |
| `homeschool_drop_in` | `buildSchoolYear{Month}DropInTuitionReminderEmail` or `buildHomeschoolDropInTuitionReminderEmail` |

Known month-specific builders in `app/lib/zoho.ts` (update as new months are added):

- September: `buildSchoolYearSeptemberTuitionReminderEmail`, `buildSchoolYearSeptemberDropInTuitionReminderEmail`

Admin send path: `app/admin/components/ApplicationDetailSidebar.tsx` → School Year Outreach tab.

## Optional: enrolled without supply fee

Only run when user explicitly asks. Does **not** filter by month payment.

```sql
WITH school_year_enrolled AS (
  SELECT
    a.student_id,
    a.child_legal_name,
    a.preferred_name,
    a.child_grade,
    a.program,
    a.drop_in_program,
    a.g1_full_name,
    a.g1_email
  FROM parent_app.applications a
  WHERE a.status = 'enrolled'
    AND (
      a.program IN ('school_year_26_27', 'both')
      OR (
        a.program = 'homeschool_drop_in'
        AND a.drop_in_program IN ('school_year_26_27', 'both')
      )
    )
    AND NOT ('Don''t Include' = ANY(COALESCE(a.admin_tags, ARRAY[]::text[])))
),
supply_fee_paid AS (
  SELECT DISTINCT st.student_id
  FROM billing.stripe_transactions st
  WHERE st.payment_type = 'supply_fee'
    AND st.status = 'completed'
    AND st.is_deleted = false
    AND st.student_id IS NOT NULL
)
SELECT
  e.child_legal_name,
  COALESCE(NULLIF(e.preferred_name, ''), e.child_legal_name) AS display_name,
  e.child_grade,
  e.program,
  e.g1_email
FROM school_year_enrolled e
LEFT JOIN supply_fee_paid sf ON sf.student_id = e.student_id
WHERE sf.student_id IS NULL
ORDER BY e.child_legal_name;
```

## Payment logic notes

Mirrors `apps/mobile/src/lib/student-month-enrollment.ts`:

| Transaction type | Paid for month when |
| ---------------- | ------------------- |
| `school_year_tuition` | `selected_months` CSV contains month index |
| `homeschool_dropin` | `program = school_year_26_27` and (`selected_weeks` contains index OR `week_selections` JSON has matching week) |
| `supply_fee` | `bundle_month_index` matches and `bundle_type` is `school_year_tuition` or `homeschool` |

Enrollment filter mirrors `isSchoolYearApp` in `app/lib/school-year-attending-students.ts`.
