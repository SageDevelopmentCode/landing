---
name: sagefield-garden-mobile
description: The Sage Field "Garden" design system for the mobile app (Expo / React Native in apps/mobile), covering both the parent app and the staff / super-admin app. Use whenever building, redesigning, or restyling any parent-facing screen (Home, Children, Tuition, Calendar, Messages, Feed, sheets, onboarding) or any staff screen in app/(staff) (staff Home, attendance, students, admin tools; see staff.md), or when asked to "match the new Home", "use the mobile Garden design", or add toasts/haptics/feedback to a parent screen. Covers tokens, fonts, the components/garden kit, screen anatomy, the data-hook pattern, feedback (toasts, haptics, confetti), sheets, accessibility, and gotchas learned building the parent Home.
---

# Sage Field "Garden" for the parent mobile app

The parent Home (`apps/mobile/src/app/(tabs)/home.tsx`) is the reference build. Its UI pieces are in `apps/mobile/src/features/parent-home/garden/`, and its data and handlers are in `apps/mobile/src/features/parent-home/useParentHome.ts`. When in doubt, open the matching part in `GardenHomeParts.tsx` and copy its structure. Copy-ready patterns are in **`recipes.md`** next to this file.

## The feel
Same brand as the website. Read "The feel" and "Non-negotiables" in the web skill (`.claude/skills/sagefield-garden/SKILL.md`) for the voice, palette and copy rules. On a phone the feel becomes:
- **Warm cream paper** (`Garden.cream`) with pastel tints. Coral is for "do this" and sage is for calm and success.
- **Chunky display type** (Bricolage), **rounded body text** (Nunito) and **small handwritten notes** (Gochi Hand).
- **Tactile, gentle feedback:** everything you touch gives a little, buzzes softly and answers back with a toast, a state change or a checkmark. Motion is smooth and quiet, never bouncy.
- **One calm vertical story** ordered by priority. Never a wall of equal cards.

## Non-negotiables
1. **Keep real copy word for word.** Reuse existing strings. Toasts and handwritten notes ("step 1 of 2", "say hi to a teacher") are UI feedback only. They never state facts, prices or dates.
2. **Every tap target is at least 44×44pt** (`MIN_TAP`). Small links get `hitSlop` of 10–12.
3. **Reduced motion always works.** Gate motion with Reanimated's `useReducedMotion()`. Confetti, pulsing skeletons and big entrances are skipped, and the final state renders without animation.
   **Calm motion:** no overshoot. Use `gardenEnter` / `gardenPopIn` / `gardenLayout` instead of `.springify()` or `ZoomIn`. Pops stay at or below 1.1×, entrances move 12px or less, and staggers are about 40ms.
4. **No new native modules.** Don't add react-native-svg, lottie, moti or expo-blur. A native module needs a new dev build and breaks OTA (`eas update`). Plain Views, Reanimated, Ionicons and emoji cover every recipe.
5. **Writes go through the screen's data hook**, which returns `{ ok, error?, canceled? }`. The UI reacts to that result with feedback and never calls Supabase directly.
6. **Respect read-only preview.** When `isReadOnlyPreview` is set (an admin is viewing as a parent), block writes and show the info toast ("Preview mode").
7. **No eyebrows above headings.** A screen or section starts with its `Display` heading. Don't put a `HandNote`, `Pill` or uppercase label above it (no "fresh from the classroom" over "Family feed"). Handwritten notes go *below* a heading (`GardenSectionHeader` `note`), inside cards and sticky notes, or as inline feedback. The only exception is the parent Home greeting ("Good evening,").

## Staff & admin screens
Screens in `src/app/(staff)/` use this same system with a denser, faster "work tool" flavour: one primary action per row, toasts that name the student, Undo for reversible actions, and confetti only for real shift milestones. **Read `staff.md` next to this file** before building one. The staff Home (`src/app/(staff)/home.tsx` + `src/features/staff-home/`) is the staff reference build. The toast host is already mounted in `src/app/(staff)/_layout.tsx`.

## Getting started on a new parent screen
```tsx
// src/app/(tabs)/<screen>.tsx
import { Garden } from "@/components/garden";
import { BottomTabInset } from "@/constants/theme";
import { RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChildrenScreen() {
  const c = useChildren();            // src/features/children/useChildren.ts — state, loading, handlers
  const fb = useChildrenFeedback(c);  // src/features/children/garden/useChildrenFeedback.ts — toasts/haptics
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Garden.cream }} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BottomTabInset + 32 }}
        refreshControl={<RefreshControl refreshing={fb.refreshing} onRefresh={() => void fb.refresh()} tintColor={Garden.sage} />}
      >
        {/* hero → what needs you → content sections */}
      </ScrollView>
      {/* sheets / overlays mounted once, like GardenHomeChrome */}
    </SafeAreaView>
  );
}
```
- **Structure:**
  - Data and handlers go in `src/features/<area>/use<Area>.ts`, modelled on `useParentHome.ts`.
  - Garden UI goes in `src/features/<area>/garden/`.
  - The route file only composes the two.
- **Toasts:** `GardenToastProvider` is already mounted in `src/app/(tabs)/_layout.tsx`. Call `useToast()` anywhere under the tabs.
- **Hidden screens:** register them with `<Tabs.Screen name="…" options={{ href: null }} />` so they keep the floating tab bar.

## Tokens (`src/components/garden/gardenTheme.ts`)
| Token | Value | Use |
|---|---|---|
| `Garden.cream` | #fff8ef | screen background, sheet background |
| `Garden.ink` / `soft` / `muted` | #2b2a26 / #5b5850 / #8a867c | headings / body / meta |
| `Garden.line` | #efe6d8 | card borders |
| `Garden.coral` / `coralDeep` | #f29a8f / #e07a6e | primary action, alerts, badges |
| `Garden.sage` / `sageDeep` | #6b9474 / #4a6354 | secondary action, success, links |
| `Garden.butter`, `mint`, `sky`, `lav`, `peach` | pastels | sticky notes, tiles, tints |
| `GardenTints[tint]` | `{ bg, fg }` | readable pastel pairs for pills, steps, empty states |
| `GardenFonts` | `display` (Bricolage 800), `displayBold`, `body` / `bodySemi` / `bodyBold` / `bodyHeavy` (Nunito), `hand` (Gochi Hand) | all text |
| `GardenRadii` | `sm` 14, `md` 20, `card` 28, `panel` 36, `pill` 999 | shapes |
| `gardenCard`, `gardenShadow`, `gardenShadowSm` | | white card surface and shadows |
| `GardenSprings` | `press`, `pop`, `gentle` | Reanimated springs, all tuned to settle without overshoot |
| `GardenMotion` | `fast` 160, `base` 220, `slow` 300 ms, `ease` (out-cubic) | timing presets for `withTiming` |
| `gardenEnter(i, { step?, max?, base? })` | fade + 8px rise, 40ms capped stagger | list and card `entering` |
| `gardenPopIn(delay?)` | fade + scale from 0.85 | check icons, pills, dots `entering` |
| `gardenLayout()` | eased `LinearTransition` | lists that reflow (`layout`) |
| `MIN_TAP` = 44, `DISPLAY_MAX_SCALE` = 1.35 | | tap size and Dynamic Type cap for display text |

Fonts load in `src/app/_layout.tsx` (`@expo-google-fonts/bricolage-grotesque`, `nunito` and `gochi-hand`). A new weight must be added to `useFonts` there.

## Components (`src/components/garden/`, import from `@/components/garden`)
| Component | When to use |
|---|---|
| `PressableScale` | Any tappable card, tile, chip or row. Eases to 0.97 with a light haptic. Props: `pressedScale`, `haptics` (`"tap"` \| `"select"` \| `"press"` \| `false`), `accessibilityLabel`. It replaces hover. |
| `GardenButton` | Real buttons. Tones: `coral` \| `sage` \| `ink` \| `outline` \| `butter`. Sizes: `md` \| `sm`. Also `icon`, `iconRight`, `loading` and `loadingLabel` ("Opening…"), `success` and `successLabel` (✓ morph), `fullWidth`. It has a toy shadow that presses down. **The mobile coral face is coral-deep**, because white text on light coral is too faint at phone sizes. |
| `Display` | Bricolage headings (`size` 22 for sections, 26–28 for sheets, 36 for the hero). Has `accessibilityRole="header"` and a Dynamic Type cap. |
| `HandNote` | Gochi Hand notes: the Home greeting, step counters ("step 1 of 3"), sticky-note labels ("next up →"), notes *under* a heading. Never above a heading, never paragraphs. |
| `Pill` | Status chip with a `tint`. |
| `CountBadge` | Unread counts. Nudges softly when the count changes (not on first render) and renders nothing at 0. |
| `StickyNote` | A "today" or "next up" note with tape. `tilt` is clamped to ±2°. |
| `Polaroid` | A child photo with a taped frame, initials fallback, handwritten caption and subcaption. |
| `SeedProgress` | Step progress as dots that sprout 🌱. Accepts `doneFlags` for out-of-order steps and announces as a progressbar. |
| `GardenSectionHeader` | Section title, an optional handwritten `note`, and an optional "View all →" link. |
| `GardenEmpty` | Emoji, the real empty-state copy, an optional body and an optional outline CTA. |
| `GardenErrorCard` | An inline load failure with a Retry button (`retrying` state). Don't fail silently. |
| `GardenSkeleton` | A cream-tinted pulsing placeholder that matches the final layout. |
| `Confetti` | `ref.current.fire()` for real milestones only. A no-op under Reduce Motion. |
| `useToast()` | `show({ tone, title, message?, action?, duration?, silent? })` returns an id. Also `update(id, …)` and `dismiss(id)`. Tones: `success` \| `info` \| `error` \| `loading`. |
| `haptic` | `tap`, `select`, `press`, `success`, `warning`, `error`. |

## Screen anatomy (how the Home is ordered, and why)
1. **Hero:** a handwritten greeting, the name in Display type, a date pill, and icon buttons with badges (checklist dot, notification count, avatar for the profile sheet). The greeting is Home-only: every other screen's hero starts with its `Display` title (see rule 7).
2. **What's happening:** the `TodayNote` sticky note and any booked conference tickets.
3. **What needs you:** `NextStepsStack` merges Action Needed and setup progress into numbered steps, each with one ink CTA. When there's nothing to do it shows "All caught up! 🌿".
4. **Your people:** child polaroids and teacher chips with a Message button that has a loading state.
5. **Everything else:** events, activities, tuition, newsletters, community, photos, rewards and feedback.

Rules:
- One idea per section, separated by about 26–30pt.
- Collections go in **horizontal snap rails** (`snapToInterval`, padding `GUTTER` = 18).
- There is never horizontal *page* scroll.

## Feedback matrix
| Situation | Do this |
|---|---|
| Tap on a card, tile or chip | `PressableScale` (haptic `tap`) |
| Segment, toggle or checkbox change | `haptic.select()` |
| Async action started from a button (open chat, retry) | `GardenButton loading` + `loadingLabel`, then navigate. On failure, an error toast with Retry. |
| Background save or upload | `const id = toast.show({ tone: "loading", … })`, then `toast.update(id, { tone: "success" \| "error", action: Retry })` |
| A sheet saved and already shows its own state | A short success toast ("Preferences saved") |
| A step checked off | A toast showing "3 of 8 done" and the step name. At the last step, confetti plus "All set up! 🎉". |
| Section failed to load | Inline `GardenErrorCard` |
| Nothing to show | `GardenEmpty` with the real copy |
| Pull to refresh | `RefreshControl` (sage), then a quiet "You're up to date" toast or an error toast with Retry |
| Read-only preview | Block the write and show the "Preview mode" info toast |
| Destructive action (sign out) | Confirm with `Alert.alert` first |

`src/features/parent-home/garden/useGardenFeedback.ts` is the reference: it wraps the hook's handlers and only reacts to their results.

## Sheets
Use `@gorhom/bottom-sheet` with the Garden chrome from `GardenHomeSheets.tsx`:
- Cream `backgroundStyle` with `GardenRadii.panel`.
- A soft handle.
- A backdrop at opacity 0.35 that closes on press.
- `enablePanDownToClose`.

Use `enableDynamicSizing` for short sheets and `snapPoints` (for example `["62%", "90%"]`) for long ones. Put primary actions at the bottom, in the thumb zone, as full-width `GardenButton`s. Mount every sheet once per screen, the way `GardenHomeChrome` does.

## Accessibility
- Every `PressableScale` gets an `accessibilityLabel` that says what happens.
- Checkboxes use `accessibilityRole="checkbox"` and `accessibilityState={{ checked }}`.
- Segmented controls use `tablist` / `tab` with `selected`.
- Toasts call `AccessibilityInfo.announceForAccessibility`.
- Display text caps at `DISPLAY_MAX_SCALE`. Body text caps at about 1.3–1.4 and wraps instead of truncating important titles: event titles get `numberOfLines={2}`.
- Status colour is never the only signal. Pair it with text: "Paid ✓" in sage, "Pay now" in coral.

## Gotchas (learned building the parent Home)
- **Toast layering:** the toast host must render after `BottomSheetModalProvider`, or toasts hide under sheets. It's already wired up in `(tabs)/_layout.tsx`.
- **Android shadows:** put the elevation on the outer view, not inside an `overflow: hidden` parent.
- **React Compiler is on** (`app.json`). Don't assign refs during render; do it in an effect.
- **Transform order:** keep the press-scale on `PressableScale` and the tilt on the inner `Polaroid` or `StickyNote`. Two transforms on one view fight.
- **Testing in the iOS Simulator:**
  - Screenshots lag several seconds behind input, so a 3s toast can come and go unseen. Temporarily raise `duration` while verifying.
  - The first tap after a fling only stops the momentum. Wait before tapping.
  - Fast Refresh doesn't always remount layouts. Force a reload with `node -e 'const W=require("ws");const w=new W("ws://localhost:8081/message");w.on("open",()=>{w.send(JSON.stringify({version:2,method:"reload"}));setTimeout(()=>process.exit(0),300)})'`.
- **Linting:** ESLint doesn't cover `apps/mobile` (the root config ignores it). Use `npx tsc --noEmit`, where about 40 pre-existing errors live in other screens and in `supabase/functions`. Make sure you add none.

## Pre-ship checklist
- [ ] Every string comes from real copy. Toasts and notes are feedback only.
- [ ] No eyebrow text above any heading (Home greeting excepted).
- [ ] Data and writes live in a `use<Area>` hook. The UI only reacts to `{ ok, error, canceled }`.
- [ ] Every write path has feedback: loading, then success or error with Retry. Read-only preview is guarded.
- [ ] Loading skeletons match the final layout. Empty and error states exist for every section.
- [ ] Tap targets are 44pt or more. Labels and roles are set.
- [ ] `npx tsc --noEmit` adds no new errors.
- [ ] Simulator walkthrough of every tap, sheet and link, plus pull to refresh.
- [ ] Reduce Motion is on, the largest Dynamic Type works, and the layout holds at iPhone SE width.
