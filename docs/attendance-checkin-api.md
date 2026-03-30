# Attendance Check-in API Guide (Mobile App)

This guide covers how the parent-facing mobile app interacts with the `attendance.check_ins` Supabase table.

---

## 1. Schema Reference

**Table:** `attendance.check_ins`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `student_id` | `uuid` | NO | — | FK → `admin.students(id)` |
| `checked_in_by` | `uuid` | NO | — | FK → `admin.users(id)`; must match `auth.uid()` |
| `checked_in_at` | `timestamptz` | NO | `NOW()` | Set automatically on insert |
| `checked_out_at` | `timestamptz` | YES | `NULL` | `NULL` means still checked in |
| `notes` | `text` | YES | `NULL` | Optional parent note |
| `is_deleted` | `boolean` | NO | `FALSE` | Soft delete flag |
| `created_at` | `timestamptz` | NO | `NOW()` | |
| `updated_at` | `timestamptz` | NO | `NOW()` | |

**Indexes:**

- `idx_check_ins_student_date` — `(student_id, checked_in_at DESC)` — fast per-student date range queries
- `idx_check_ins_open` — partial index on `checked_out_at` where `checked_out_at IS NULL AND is_deleted = FALSE` — fast "currently checked in" lookups

---

## 2. Authentication Requirements

- The user must be authenticated via Supabase Auth before any operation.
- `checked_in_by` **must equal** `auth.uid()` — enforced by RLS on both INSERT and SELECT.
- Use the Supabase anon key together with the user's active session token (handled automatically by the Supabase client when the user is signed in).

**RLS policies summary:**

| Policy | Operation | Condition |
|---|---|---|
| `parents_read_own_checkins` | SELECT | `checked_in_by = auth.uid()` |
| `parents_insert_checkins` | INSERT | `checked_in_by = auth.uid()` |

Admins use the service role key (bypasses RLS entirely — server-side only).

---

## 3. Check-In (INSERT)

```typescript
const { data, error } = await supabase
  .schema('attendance')
  .from('check_ins')
  .insert({
    student_id: '<student-uuid>',
    checked_in_by: user.id,     // auth.uid() — required by RLS
    notes: 'Optional note',     // optional
    // checked_in_at defaults to NOW()
  })
  .select()
  .single()
```

---

## 4. Check-Out (UPDATE)

```typescript
const { data, error } = await supabase
  .schema('attendance')
  .from('check_ins')
  .update({ checked_out_at: new Date().toISOString() })
  .eq('id', checkInId)
  .eq('checked_in_by', user.id)   // safety: only update own records
  .select()
  .single()
```

---

## 5. Query: Is Student Currently Checked In?

Returns the open check-in record if the student is currently checked in, or `null` if not.

```typescript
const { data } = await supabase
  .schema('attendance')
  .from('check_ins')
  .select('*')
  .eq('student_id', studentId)
  .is('checked_out_at', null)
  .eq('is_deleted', false)
  .order('checked_in_at', { ascending: false })
  .limit(1)
  .maybeSingle()
```

---

## 6. Query: Today's Check-in History

```typescript
const today = new Date()
today.setHours(0, 0, 0, 0)

const { data } = await supabase
  .schema('attendance')
  .from('check_ins')
  .select('*')
  .eq('student_id', studentId)
  .gte('checked_in_at', today.toISOString())
  .eq('is_deleted', false)
  .order('checked_in_at', { ascending: false })
```

---

## 7. Soft Delete

Use soft delete instead of a hard DELETE to preserve history.

```typescript
await supabase
  .schema('attendance')
  .from('check_ins')
  .update({ is_deleted: true })
  .eq('id', checkInId)
  .eq('checked_in_by', user.id)
```

---

## 8. TypeScript Types

Generated types live in `app/types/database.types.ts`.

```typescript
import type { Database } from '@/types/database.types'

type CheckInRow    = Database['attendance']['Tables']['check_ins']['Row']
type CheckInInsert = Database['attendance']['Tables']['check_ins']['Insert']
type CheckInUpdate = Database['attendance']['Tables']['check_ins']['Update']
```

**`Row` shape:**

```typescript
{
  id:             string
  student_id:     string
  checked_in_by:  string
  checked_in_at:  string        // ISO 8601 timestamptz
  checked_out_at: string | null // null = still checked in
  notes:          string | null
  is_deleted:     boolean
  created_at:     string
  updated_at:     string
}
```

---

## 9. Error Handling

Always check `error` on every Supabase call:

```typescript
const { data, error } = await supabase.schema('attendance').from('check_ins').insert(...)

if (error) {
  // error.code is a Postgres error code string
  switch (error.code) {
    case '42501': // insufficient_privilege
      // RLS blocked the operation — checked_in_by likely doesn't match auth.uid()
      break
    case '23503': // foreign_key_violation
      // student_id doesn't exist in admin.students
      break
    default:
      // unexpected error
  }
}
```

---

## 10. Common Gotchas

- **Always use `.schema('attendance')`** — the table is NOT in the `public` schema. Omitting it will return a "relation does not exist" error.
- **`checked_in_by` must equal `auth.uid()`** — if it doesn't, INSERT will be blocked by RLS and SELECT will return 0 rows with no error (silent failure).
- **React Native:** use `createClient` from `@supabase/supabase-js` directly. Do not use the SSR client (`createServerClient` / `createBrowserClient` from `@supabase/ssr`) — those are for Next.js server/browser environments only.
- **`checked_out_at` filtering:** always combine with `.eq('is_deleted', false)` to exclude soft-deleted records from open check-in queries.

---

## Related Files

| File | Purpose |
|---|---|
| `migrations/add-attendance-checkin.sql` | Full schema definition and RLS policies |
| `app/types/database.types.ts` | Generated TypeScript types (see `attendance` schema, line ~251) |
| `app/lib/supabase-browser.ts` | Browser Supabase client setup — follow same pattern in mobile |
| `app/actions/getStripeTransactions.ts` | Example of `.schema()` query pattern |

---

## Verification

1. Run the INSERT in Supabase's SQL editor while authenticated as a parent to confirm it succeeds.
2. To confirm RLS, attempt an INSERT where `checked_in_by` is a different user's UUID — it should be blocked with error code `42501`.
3. Confirm the open check-in query returns `null` after a check-out is performed.
