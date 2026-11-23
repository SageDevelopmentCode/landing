---
name: sagefield-garden-portal
description: The Sage Field "Garden" design system for the signed-in web parent portal (any page under app/parent/*, such as Home, My Children, Tuition/Billing, Calendar, Messages, Newsletters, Preferences, Rewards and Forms, plus the admin "view as parent" pages that reuse them). Use whenever building, redesigning or restyling a parent portal page, sheet or dialog, when asked to "match the new parent Home", or when adding toasts, step-by-step sheets or feedback to a portal page. Builds on the sagefield-garden tokens; covers the shared portal kit in app/parent/_garden, page anatomy, feedback, sheets, admin preview and gotchas learned building the parent Home.
---

# Sage Field Garden for the parent portal (web)

The parent Home (`app/parent/home/`) is the reference build. Its page-specific parts are in `app/parent/home/garden/`.

> **Tokens, fonts and the overall feel come from `sagefield-garden`.** Read its *Tokens* and *Type* sections first. This skill overrides the marketing parts: no Lenis, no Navbar/Footer shell, no hero-sized section headings, no GSAP showpieces.
> For the Expo app use `sagefield-garden-mobile`. The portal mirrors it closely, so check the matching mobile screen for copy and section order.

## The feel
- **Same Garden palette, calmer and denser.** Parents come here to *do* things: pay, set preferences, book, check attendance. Each page tells one calm vertical story in priority order: what needs you, then your people, then everything else.
- **Real data carries the page.** Kids' photos become polaroids, events become date chips, conferences become tickets, notes become sticky notes.
- **Every tap answers back:** a state change, a ✓, a toast. Motion is springy but small. Lifts are 1–4px, tilts straighten on hover/focus, and nothing slides further than 16px.

## Non-negotiables
1. **Keep real copy word for word.** Reuse the existing strings. Toasts, hand notes ("step 2 of 3", "a little gift guide 🎁") and button labels are UI feedback only. They never state facts, prices, dates or policies.
2. **No eyebrows above headings.** A section starts with its `SectionHeader` title. Hand notes go *under* the heading. Don't put a `Pill` or uppercase label above an h2. The only exception is the Home greeting ("Good afternoon,").
3. **Status is never colour alone.** Always pair it with text: "✓ Paid" in mint, "Pay now" in coral, "Not set", "Unsaved changes", "🔒 Password protected".
4. **Accessible by default:**
   - one `h1` per page, sections use `h2`
   - tap targets at least 44px (`min-h-11`)
   - hover styles repeated on `:focus-visible`
   - radios and tabs use real roles (`role="radiogroup"`/`"radio"`, `"tablist"`/`"tab"`, `aria-pressed`)
   - decorative emoji and SVGs get `aria-hidden`
5. **Writes always give feedback** (see the matrix below) and are **blocked in admin preview**.
6. **Phones and reduced motion always work.** There's no horizontal page scroll at 375px, and every animation has a static final state.

## Getting started on a portal page
```tsx
// app/parent/<route>/page.tsx — server component (keep the existing auth + data loading)
return (
  <div className="bg-welcome-bg min-h-screen flex flex-col">
    <DashboardHeader sticky>…</DashboardHeader>   {/* shared header: NOT Garden, leave it */}
    <SharedAccessBanner … />
    <main className="flex-1"><MyPageClient {...data} /></main>
    <Footer />
  </div>
);

// app/parent/<route>/MyPageClient.tsx
"use client";
import PortalShell from "@/app/parent/_garden/PortalShell";
export default function MyPageClient(props: Props) {
  return <PortalShell><Content {...props} /></PortalShell>;
}
```
- **`PortalShell`** gives you the Garden tokens and fonts (`GardenIsland`), the toast host, and the container every sheet and dialog portals into. Use it once per page, around the page body only.
- **Data:** load it on the server in `page.tsx` and pass it in as props. Writes go through the existing server actions or API routes. Refresh with `router.refresh()` after a write that changes server data.
- **Container:** `mx-auto w-full max-w-6xl px-6 pb-20 pt-8 sm:pt-12`, with sections in `flex flex-col gap-14`.

## The portal kit (`app/parent/_garden/`)
| Import | What / when |
|---|---|
| `PortalShell` | Page wrapper (see above). |
| `sheet`: `GardenSheet` (default export) | Any detail, form or multi-step flow. Right drawer (480px) at ≥sm, bottom sheet on phones. Props: `open`, `onClose`, `title`, `icon` (emoji), `note` (hand note under the title, e.g. "2 of 3 booked"), `toolbar` (child tabs, filters), `footer` (sticky primary action), `onBack` (in-sheet detail views). Handles Esc, Tab trapping, focus restore and the scroll lock. |
| `sheet`: `GardenDialog` | Short modals and confirms (centred, or a bottom sheet on phones). `media` is a photo header. Use `layer="top"` for a confirm on top of a sheet. Put `data-autofocus` on the primary button. |
| `ui`: `SectionHeader` | Every section's `h2`: `title`, `note` (hand note under it), `action` (usually a `linkSoft` "View all →"), `id` (makes it focusable for jump links). |
| `ui`: `btnInkSm`, `btnCoralSm`, `btnSageSm`, `btnGhostSm`, `btnSheetPrimary`, `linkSoft` | Compact toy-shadow buttons. The marketing `btnPop`/`btnSage` in `app/_garden/ui` are hero-sized, so don't use them in the portal. **Ink** is for step CTAs, **coral-deep** for money and "pay", **sage** for save/confirm, **ghost** for secondary actions. |
| `ui`: `StepLabel` | Numbered step headings inside sheets. The number turns into a ✓ when `done`. |
| `ui`: `KidAvatar`, `avatarTint`, `getInitials`, `firstNameOf` | Photo or pastel-initials avatars, for children or teachers. |
| `ui`: `TINT_BG`, `TINT_FG`, `cardBase`, `CheckIcon`, `Arrow`, `Spinner` | Tint pairs (coral, butter, sky, lav, mint, peach), the soft card shell and small icons. |
| `feedback`: `usePortalFeedback(readOnly)` | Returns `{ toast, runSave, blockedByPreview }`. See the matrix below. |
| `feedback`: `celebrate()` | Confetti for real milestones only, such as booking a conference or finishing onboarding. A no-op under reduced motion. |
| `ui`: `StepProgress` | "Step 2 of 4" progress bar (with optional short step labels) for multi-step sheets. Put it in the sheet `toolbar`. Use `StepLabel` for in-body step headings. |
| `tabs`: `PillTabs`, `Segmented` | `PillTabs` is page-level tabs (`role="tablist"`, arrow keys, optional `badge` count or coral `dot`, always with sr-only labels). `Segmented` is a small mode switch (`role="radiogroup"`): Monthly/Weekly, Card/ACH, All day/Set a time. |
| `ChildSwitcher` (default export) | Child picker for pages and sheet toolbars: `chips` (phones, toolbars) or `cards` (desktop rail), an optional `attention` dot plus label, and it's hidden for a single child. |
| `ConfirmDialog` (default export) | Replaces `window.confirm()`. Coral (`danger`) or sage (`neutral`), `busy` + `busyLabel`, Cancel autofocused, renders above sheets. |
| `states`: `EmptyState`, `ErrorCard`, `Skeleton`, `SkeletonList` | Empty tint card (real copy), inline coral load-failure card with **Try again**, and loading placeholders. |
| `time`: `useNow`, `formatRelative`, `formatDayHeading`, `calendarDaysBetween` | Hydration-safe current time (`null` on the server, ticks on a shared timer), plus calendar-day relative times ("Yesterday", "Tue") and chat day headings. |
| `format` | `fmt12`, `formatEventTime`, `getEventDayMonth`, `formatLongDate`, `getGreeting`, `toYmd`. |
| `fields` | Form kit (promoted from My Children). `TextField` / `TextArea` (`required`, `optional`, `error`, `hint`, `maxLength` counter), `PhoneField`, `MaskedDateField` (MM/DD/YYYY), `SelectField`, `YesNoField`, `CheckChipGroup` (multi-select pills, "n selected"), `RadioCardGroup` (single-choice cards, `allowDeselect`), `CheckboxRow` (acknowledgements), `FieldError` / `FieldHint`, `LockedNote` ("🔒 save above to unlock"), `SavedNote`, `InlineError`, `SheetSaveFooter`, `SectionCard`, `InfoRow`, `IconButton`, `PencilIcon`, `TrashIcon`, `inputCls`. |
| `SignatureBlock` (default export) | Typed enrollment signature: print name → "Click to sign" → Save → mint "✓ Signed · date" card with Edit. Same props as the old `SectionSignatureBlock` plus `label` (toast) and `readOnlyPreview`. Editing the name after signing clears the signature. |
| `FileDropZone` (default export) | Upload list + drop zone for sheets: "n / max" pill, client validation (`validateUploadBatch`, same messages as before), "Uploading 2 of 3…", delete via ConfirmDialog. The page owns the network calls (`onFiles`, `onDelete`, `uploading`, `deletingKey`). `displayFileName` strips the timestamp prefix. |
| `copy`: `useCopy`, `CopyButton` | Clipboard with ✓ state + toast; on failure selects `selectEl` and shows an error toast. `CopyButton` needs a `label` ("Copy Guardian 1 cell phone"); `compact` is icon-only. |
| `unsaved`: `useUnsavedGuard(dirty)` | `{ confirm(action), dialog }`: wrap sheet `onClose` / child switches in `confirm` to ask "Discard changes?" when dirty; adds `beforeunload` while dirty. Render `dialog` once. |
| `Lightbox` (default export) | Full-screen viewer for `items: { key, url, alt, kind: "image" \| "video", caption?, dateLabel?, sharpening?, failed?, onRetry? }[]`. Portals above sheets; Esc closes only the lightbox. Wrap in `AnimatePresence`. Photos uses it through `photos/garden/PhotoLightbox`. |
| `sheet`: `GardenSheet` `size="wide"`, `bodyRef` | 720px drawer for long reading (contracts, feed posts). `bodyRef` gives the scrolling body, e.g. to scroll to the next unsigned section. `InPortal` is exported for custom overlays. |
| `@/app/_garden/toast`: `useToast()` | `show({ tone, title, message?, action?, duration? })` returns an id, then `update(id, …)` / `dismiss(id)`. Tones are `success`, `info`, `error` and `loading`. It's announced through `aria-live`. |
| `@/app/_garden/motion`: `Reveal`, `CountUp` | Gentle section entrances, and big numbers that count up. Leave the rest of the marketing motion kit alone. |

When a pattern is used on two portal pages, promote it into `app/parent/_garden/`. Keep page-specific parts next to the page (for example `app/parent/home/garden/`).

## Page anatomy
- **Order:** what needs you (numbered steps, tickets) → your people (children, teachers) → everything else (events, money, community, rewards, quick links).
- **Desktop:** `grid lg:grid-cols-[minmax(0,1fr)_360px] gap-14 lg:gap-10`. The main story goes on the left, dates and money in the right column. Don't make a tall right column sticky.
- **Collections** go in horizontal snap rails: `-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 [scroll-padding-inline:1.5rem] scrollbar-hide`, with `role="list"`.
- **Card recipes** (copy from Home):

  | Card | Use it for | Where |
  |---|---|---|
  | Polaroid | children, activities, newsletters | `.sf-polaroid` with a small inline `rotate`, plus `hover:!rotate-0` |
  | Ticket | conferences | `.sf-ticket` with a dashed stub |
  | Photo card | tuition | `TuitionCards` |
  | Step card | next steps | `NextSteps`: tint bg, number bubble, "step i of N", one ink CTA |
  | Sticky note | "coming up next", "would make my day" | butter bg, `rounded-[6px]`, slight tilt |
  | Dark ink panel | rewards | `bg-[var(--sf-ink)]`, **one per page at most** |
- **Empty states** use the real copy on a soft tint card, for example 🌿 "All caught up!" on `bg-[var(--sf-mint)]/70`.

## Feedback matrix
| Situation | Do this |
|---|---|
| Save, submit or book | `runSave({ successTitle, errorTitle, retry, fn })`. `fn` returns `{ ok, error? }`. You get a success toast, or an error toast with **Try again**. Show a `Spinner` + "Saving…" label on the button meanwhile. |
| Slow background save | Pass `loadingTitle`. The loading toast turns into success or error. |
| Copy to clipboard | Show ✓ in the button and a success toast. On failure, select the text and show an error toast telling the parent to copy it by hand. |
| A sheet saved and closes itself | A short success toast that names what saved ("Preferences saved · Cooking Class · Ava"). |
| A sheet section failed to load | An inline coral-tint card with a **Try again** button. Never leave a blank sheet. |
| A choice that isn't saved yet | Say so in text ("Unsaved changes", "2 unsaved changes") and keep the primary button disabled until there's something to save. |
| Real milestone | `celebrate()` plus a success toast. |
| Admin preview (`readOnlyPreview`) | `blockedByPreview()` shows the "Preview mode" toast and stops the write. Disable inputs where the old page did. |

## Sheets
- **Header:** emoji icon, Display title, and a hand note for progress ("1 child still to set", "3 of 5 set up"). Child or teacher pickers go in `toolbar` as `role="tablist"`.
- **Body:** number the steps with `StepLabel` (① choose a child, ② participation, ③ notes). Show skeletons while loading.
- **Footer:** one full-width `btnSheetPrimary`, plus a one-line status under it.
- **Detail views** stay inside the same sheet with `onBack`. Don't stack a second sheet.

## Admin preview contract
`/admin/impersonate/[parentId]/*` renders the **same client components** inside `pointer-events-none`. When you redesign a page:
- keep every `readOnlyPreview`, `*Interactive` and `suppress*` prop
- keep the `pointer-events-auto` wrappers around the parts admins may click
- update the impersonate `page.tsx` whenever you add a prop

## Gotchas (learned on the parent Home)
- **Transforms trap `position: fixed`.** GSAP `Reveal` leaves an inline transform, and so do hover lifts. Sheets and dialogs already portal into `PortalShell`'s container. Render other overlays (`OnboardingChecklist`, `HelpWidget`) outside any `Reveal`.
- **Never put Tailwind `translate-*`, `scale-*` or `rotate-*` on `Reveal`'s direct children.** Wrap them in a plain element.
- **Clock-dependent values** (greeting, "today", date pills) differ between server and browser. Render them after hydration with `useSyncExternalStore(subscribe, () => value, () => null)` instead of `useState(() => new Date())`.
- **Browser-only flags** (localStorage "seen" badges) use `useSyncExternalStore` with a `null` server snapshot, so badges never flicker in. Wrap storage access in try/catch.
- **Truncated text in grid or flex children** needs `min-w-0`, and grids need an explicit `grid-cols-1`. Otherwise one long name makes the card wider than the phone, and `overflow-x-clip` hides the overflow without telling you.
- **Images:** use `next/image` for `/assets/*` (`preload` only on the first hero image). Use `<img>` with an eslint-disable comment for signed Supabase URLs.
- **Opening a new tab after an `await`** gets blocked. Use an `<a target="_blank">` and run side effects (like copying a password) from its `onClick` without awaiting them.
- **Verifying in the browser pane:** screenshots can lag behind the page. Confirm sheet state through the DOM (`[role=dialog]`, `getBoundingClientRect()`).

## Pre-ship checklist
- [ ] Every string is real copy; only small UI microcopy is new.
- [ ] One `h1`, `SectionHeader` h2s, and no eyebrows above headings.
- [ ] 1440×900 and 375px both work, with `documentElement.scrollWidth === clientWidth`.
- [ ] Every sheet and dialog closes with Esc, keeps Tab inside, and returns focus to its trigger.
- [ ] Every write shows a success or error toast; errors offer Retry.
- [ ] The admin preview page still renders, and writes are blocked with the "Preview mode" toast.
- [ ] `npx tsc --noEmit`, `npx eslint <changed paths>` and `npx next build` pass.
