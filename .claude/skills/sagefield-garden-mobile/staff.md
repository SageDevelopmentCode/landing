# Mobile Garden for staff and super-admin screens

Staff screens (`apps/mobile/src/app/(staff)/`) use the same Garden kit, tokens, fonts and non-negotiables as the parent app. Read `SKILL.md` first. This file covers what changes when the reader is a teacher or a super admin using the app as a work tool many times a day.

**Reference build:** the staff Home.
- Route: `apps/mobile/src/app/(staff)/home.tsx` (composition only).
- Data and writes: `src/features/staff-home/useStaffHome.ts`. Pure helpers are in `staffHomeUtils.ts`.
- Feedback: `src/features/staff-home/garden/useStaffHomeFeedback.ts`.
- UI: `src/features/staff-home/garden/StaffHomeParts.tsx` and `StaffHomeSheets.tsx` (`StaffHomeChrome` mounts every sheet once).

## The staff flavour
| Parent app | Staff app |
|---|---|
| A calm story, warm and a little playful | A fast work surface. Warm, but every pixel earns its place |
| Polaroids, sticky notes, tilted tape | No polaroids. Ticket cards for time-bound things (tours, conferences), tinted alert cards for "act now" |
| One CTA per step card | One primary action per **row** (`GardenButton size="sm"`). Tapping the row opens the full sheet |
| Confetti for setup milestones | Confetti only for a real shift milestone ("Everyone's checked in 🎉") |
| Toasts thank the parent | Toasts **name the student** ("Ava R. marked present") so a teacher moving fast can confirm without looking back |

- **Density:** list rows are about 66pt high, with a 44pt avatar, the name, then a row of status pills. Group lists in white `gardenCard` panels with a small header (colour dot, title, count) rather than a full-bleed list.
- **Status:** always colour, icon and text together. The reference `STATUS_META` is in `StaffHomeParts.tsx`:
  - Unmarked: coral
  - Present: sage ✓
  - Picked Up: mint 🚗
  - Absent: butter 🌙
- **Coral is still "do this":** unpaid, pickup not recorded, Confirm Pickup.
- **Progress:** pair a thin sage progress bar with a `HandNote` under the day bar ("4 of 18 still to mark", or "all 18 marked ✓"). Notes stay feedback only.
- **Role:** show the role as a pill in the hero (sage for Teacher, lav for Super Admin). Admin-only affordances, like the tappable tours ticket, render as a plain `View` for other roles. Never show a disabled button.
- **Clear steps in sheets:** number the stages of a multi-step task, for example "1 Attendance", then "2 Pickup". When a stage isn't available yet, show a dashed hint box saying what unlocks it ("Mark Ava present first, then record pickup here"). Don't hide it.

## Wiring
- **Toast host:** `src/app/(staff)/_layout.tsx` wraps everything in `GardenToastProvider`, outside `BottomSheetModalProvider`, exactly like `(tabs)/_layout.tsx`. `useToast()` works on every staff screen.
- **Read-only preview** is a parent-side concept, so staff screens don't need `useWriteGuard`.
- **External staff sheets** spread `gardenSheetChrome` and use Bricolage titles:
  - `StaffWeekActivityPrefsSheet`
  - `StaffSchoolDayFoodPrefsSheet`
  - `StaffAllBirthdaysSheet`
  - `StaffConferenceBookingsSheet`
  - `ActivityPreferencesSheet`

  Their bodies still use the older theme. Restyle them fully when you next touch them.

## Patterns worth copying
1. **Per-row lock, not a global lock.** `useStaffHome` keeps `pending: Record<studentId, SavingKey>` and mirrors it in a ref, updated inside the setter callback, never during render. Row buttons and sheet tiles are disabled only while *that* student is saving, so a teacher can check in a line of kids back to back.
2. **Writes take the entity explicitly** (`togglePresent(student, friday)`) instead of reading `selectedStudent`, which a sheet's `onDismiss` can null out mid-request. They return `{ ok, skipped?, canceled? }`.
3. **Undo over confirm for reversible actions.** "Hide from today's list" acts immediately, then shows a 5s info toast with **Undo**, which calls the restore write. The Undo checks the user is still on the same day.
4. **Confirm only what loses data.**
   - Un-marking Present when a pickup is recorded uses `Alert.alert`, because deleting the record also clears the pickup.
   - Sign out uses `Alert.alert` too.
5. **Sheets stay open on failure.** Confirm Pickup only dismisses on success. On error the sheet stays put and an error toast offers Retry.
6. **Milestone detection.** `arm()` sets a ref just before an attendance write and disarms it if the write fails or is skipped. An effect on `statusCounts.unmarked` fires confetti only when it goes from >0 to 0 on today's date and the change came from the teacher's own action. Browsing days or refreshing never celebrates.
7. **Every loader reports `{ ok }`.**
   - `reload()` drives `useRefreshFeedback` ("You're up to date" or Retry).
   - Per-section `*Error` flags show `GardenErrorCard` instead of an empty list.
   - Sheets that fetch on open (add student, allergies, pickup contacts) toast an error with Retry.

## Staff tools in the kit
Import these from `@/components/garden`. Reach for them before building your own.
| Piece | Use it for |
|---|---|
| `GardenDateField` | Any date input. A pill that opens a cream wheel picker with Today and Yesterday shortcuts. Takes a local `YYYY-MM-DD` value. The year range always includes the current value. `localDateKey()` gives today's date in local time (never use `toISOString()` for a calendar day). `components/photos/DatePickerField` re-exports it. |
| `useDiscardGuard(dirty, opts)` | Every form. Covers swipe-back, Android back and the hero back button through `usePreventRemove`. Pass `guard.back` to the back button, and call `guard.leave(fn?)` after a successful save. |
| `GardenActionSheet` | ⋮ and long-press menus, instead of `Alert` used as a menu. Call `ref.present({ title, subtitle?, actions })`. The chosen action runs after the sheet closes, so a confirm `Alert` that follows doesn't fight the animation. Mount it once per screen. |
| `GardenStepCard` and `GardenHintBox` | Numbered stages of a task (Write → Add photos → Post). A `"locked"` state shows a dashed box explaining what unlocks the stage. `GardenHintBox` is the same dashed or tinted guidance on its own: what happens when you publish, consent warnings, why something is blocked. |
| `useStaffRole()` (`features/staff-shared`) | `{ userId, role, isSuperAdmin, isOwner(createdBy) }`. Owner-only affordances such as edit and delete render only for the owner. Never show a disabled button. |

Reference builds that use these:
- `features/staff-feed` (compose with per-file upload retry).
- `features/staff-photos` (upload queue, consent check).
- `features/staff-activities` (three-step form).
- `features/staff-newsletters` (`NewsletterEditorProvider` shares one live draft across the editor, section editor and preview).
- `features/staff-payroll`.
- The staff feed and calendar reuse the parent hooks in `mode: "staff"` (`useFeedList("staff")`, `useParentCalendar({ mode: "staff" })`).

Gotchas:
- **RLS row counts.** A write blocked by RLS returns no error and changes 0 rows. Check `update(…, { count: "exact" })`. Don't use `.select()` after a soft delete, because the read policy hides deleted rows and the RETURNING fails.
- **Upload before you replace.** Upload new files first. Write new child rows before deleting old ones. Re-link kept images by storage path; never re-download and re-upload them.

## Staff pre-ship additions
- [ ] Every row action shows loading, then a toast naming the student. Failures toast with Retry.
- [ ] Reversible removals have Undo. Data-losing changes confirm first.
- [ ] Two quick taps on different rows both save (per-row lock).
- [ ] Role-gated affordances checked as both Teacher and Super Admin.
- [ ] Empty states use the *selected* date, not today.
