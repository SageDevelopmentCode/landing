# Mobile Garden recipes

Each recipe names the function in the parent Home that implements it. Read that source for the full version and copy its structure rather than re-inventing it. Paths are relative to `apps/mobile/src/features/parent-home/garden/`.

Shared imports:
```tsx
import {
  Garden, GardenFonts, GardenRadii, GardenTints, gardenCard, gardenShadowSm,
  Display, HandNote, Pill, CountBadge, StickyNote, Polaroid, SeedProgress,
  GardenButton, GardenSectionHeader, GardenEmpty, GardenErrorCard, GardenSkeleton,
  PressableScale, Confetti, useToast, haptic,
} from "@/components/garden";
```

---

## 1. Hero with greeting, badges and avatar
**Source:** `GardenHero` in `GardenHomeParts.tsx`
- **Left column:** a `HandNote` greeting (`getGreeting()` from `@/components/HomeHeroHeader`), a `Display size={36}` name with `numberOfLines={1}`, and a butter `Pill` showing the date.
- **Right side:** 44pt round white icon buttons (`PressableScale`), then the avatar.
  - Unread count: `<CountBadge count={n} />` absolutely positioned at top −3 / right −4.
  - "Something to do": a 9pt coral dot.
- Each button's `accessibilityLabel` includes the state ("Notifications, 3 unread").

## 2. "Today" sticky note
**Source:** `TodayNote`
```tsx
<View style={{ paddingHorizontal: 22, marginBottom: 24 }}>
  <StickyNote tilt={-1.2}>
    <HandNote size={18} color="#7a5a00">{hasToday ? "today at Sage Field" : "coming up next"}</HandNote>
    <PressableScale pressedScale={0.98} onPress={openEventSheet} accessibilityLabel={`${evt.title}, ${time}`}>
      <Text style={{ fontFamily: GardenFonts.display, fontSize: 22, color: Garden.ink }}>{evt.title}</Text>
      <Text style={{ fontFamily: GardenFonts.bodyBold, fontSize: 13.5, color: "#5c4500" }}>{dateLabel} · {time}</Text>
    </PressableScale>
  </StickyNote>
</View>
```
Use one sticky note per screen at most. It marks the single most time-relevant thing.

## 3. Numbered "next steps" stack with seed progress
**Source:** `NextStepsStack` and `useNextSteps`
- Build a `Step[]` (`{ key, emoji, title, body, cta, tint, onPress, extra? }`) from the hook's flags.
  - On Home that's tuition action, activity preferences and onboarding.
  - Only push a step when it's actually needed.
- **Header:** `GardenSectionHeader` with `note={`${n} things need you`}`.
- **Each card:** a `PressableScale` in `GardenTints[tint].bg` with a white numbered bubble, `HandNote` "step i of n", an emoji and title, the body text, an optional `extra` (`<SeedProgress doneFlags={…}/>`), and one `GardenButton tone="ink" size="sm" iconRight="arrow-forward"`.
- **Entrance:** stagger with `entering={FadeInDown.delay(i * 70).springify()}`.
- **Empty state:** `<GardenEmpty emoji="🌿" title="All caught up!" body="Nothing needs your attention right now." />`.

## 4. Polaroid rail
**Source:** `ChildrenPolaroids`
```tsx
<ScrollView horizontal showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ gap: 16, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8 }}>
  {kids.map((k, i) => (
    <PressableScale key={k.id} onPress={() => open(k.id)} accessibilityLabel={`${first}, with ${teacher}. View profile`}>
      <Polaroid uri={k.photo} initials={initials} caption={first} subcaption={teacher}
        tilt={TILTS[i % 5]} tapeColor={TAPES[i % 5]} bg={avatarColor(name).bg} />
    </PressableScale>
  ))}
</ScrollView>
```
Tilts cycle through −2, 1.5, −1, 2, −1.5. Tapes cycle through butter, sky, lav, peach, mint. Keep the scale on the pressable and the tilt on the polaroid.

## 5. Ticket card
**Source:** `ConferenceTickets`
- A row card with a 72pt sage date stub (weekday, a big Bricolage day number, month), a dashed perforation line, then the details: `HandNote` "🎟️ conference", the name in Display 19, then the "with …" and date · time lines, plus a format row with an Ionicon.
- Use it for any booked, time-specific thing: conferences, tours, Shadow Days.

## 6. Date-chip event rows + toy CTA card
**Source:** `EventRow`, `EventsList` and `ShareEventCard`
- **Row:** a `gardenCard` with radius 20 and a 46pt date chip tinted `evt.color + "22"` (month in caps, day in Display). The title gets `numberOfLines={2}`, then the meta, a category pill and a chevron. Tapping it opens the detail sheet.
- **CTA card:** a sage block with a `borderBottomWidth: 4` in `sageDeep`, which is the mobile "toy shadow" for large cards. It holds a white icon circle, a Display title, a subtitle and an `add-circle` icon.

## 7. Snap rails
**Source:** `ActivitiesRail`, `TuitionSection` (`TuitionPostcard`) and `NewslettersRail`
```tsx
<ScrollView horizontal decelerationRate="fast" snapToInterval={cardWidth + gap}
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ gap: 10, paddingHorizontal: 18, paddingBottom: 6 }}>
```
- Cards are `gardenCard` with radius 22–24 and `overflow: "hidden"`.
- Image cards get a white date chip on the photo, or a butter "badge" sticker tilted 3°, plus a dark bottom `LinearGradient` behind the label.
- **Status colour:** coral for "needs you" ("Pay now") and sage for settled ("Paid ✓", "Manage plan").
- **States:** show `GardenSkeleton` cards while loading and a `GardenEmpty` row when the list is empty.

## 8. Async action feedback (the core pattern)
**Source:** `useGardenFeedback.ts` (`pickPhoto`, `messageTeacher`, `toggleTask`)
```ts
// hook handler returns { ok, error?, canceled? } and accepts an onStart callback
const pickPhoto = useCallback(async () => {
  if (h.isReadOnlyPreview) return toast.show(READ_ONLY_TOAST);
  let id = -1;
  const r = await h.handlePickParentImage({
    onUploadStart: () => { id = toast.show({ tone: "loading", title: "Uploading your photo…" }); },
  });
  if (r.canceled) return;                       // user backed out: say nothing
  if (r.ok) toast.update(id, { tone: "success", title: "Photo updated" });
  else toast.update(id, { tone: "error", title: "Photo didn't upload",
    message: "Check your connection and try again.",
    action: { label: "Retry", onPress: () => void pickPhotoRef.current?.() } });
}, [h, toast]);
```
- When the action lives in a button, use `GardenButton loading loadingLabel="Opening…"` instead of a loading toast.
- For a Retry that calls the same callback, keep a ref that is updated inside a `useEffect`. The React Compiler is on.

## 9. Pull to refresh with a quiet confirmation
**Source:** `refresh` in `useGardenFeedback.ts`
- The data hook exposes `reload()`, which re-runs the loaders without flipping `loading` back to true. That way nothing jumps to skeletons.
- On success: `toast.show({ tone: "success", title: "You're up to date", duration: 1600, silent: true })` plus `haptic.tap()`.
- On failure: an error toast with Retry.

## 10. Garden bottom-sheet chrome
**Source:** `sheetChrome` and `Backdrop` in `GardenHomeSheets.tsx`
```tsx
const sheetChrome = {
  backgroundStyle: { backgroundColor: Garden.cream, borderRadius: GardenRadii.panel },
  handleIndicatorStyle: { backgroundColor: "rgba(43,42,38,0.25)", width: 44 },
  backdropComponent: (p) => <BottomSheetBackdrop {...p} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.35} />,
  enablePanDownToClose: true,
};
<BottomSheetModal ref={ref} {...sheetChrome} snapPoints={["62%", "90%"]}>…</BottomSheetModal>
```
- **Inside the sheet:**
  - A `Display` title.
  - Detail rows with a 38pt tinted icon square and a 44pt minimum height.
  - Uppercase muted block labels.
  - Full-width `GardenButton`s at the bottom.
- **Checklist pattern:** a "next up" butter card with one coral CTA, then rows with a Gochi step number. The label navigates and a circle checkbox toggles; give the checkbox `accessibilityRole="checkbox"`.

## 11. Celebrations
**Source:** `toggleTask` and `onBookingsChanged` in `useGardenFeedback.ts`
- Mount `<Confetti ref={confettiRef} />` once per screen, in its chrome.
- Fire it only at real milestones: the last setup step done, a conference booked.
- Pair it with a success toast ("All set up! 🎉", "Conference booked").
- Confetti is a no-op under Reduce Motion, so the toast still carries the message.
