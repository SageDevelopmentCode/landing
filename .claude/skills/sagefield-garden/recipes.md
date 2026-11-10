# Garden motion and layout recipes

Each recipe names the home page file that implements it. Read that file for the full version, and copy the structure rather than re-inventing it. The snippets show the essential moves.

All GSAP code lives inside:
```tsx
useGSAP(() => {
  const mm = gsap.matchMedia();
  mm.add(MQ_DESKTOP_MOTION /* or MQ_MOTION */, () => { /* tweens */ });
  return () => mm.revert();
}, { scope: ref });
```
Imports: `import { gsap, useGSAP, ScrollTrigger, MQ_MOTION, MQ_DESKTOP_MOTION } from "@/app/_garden/gsap";`

---

## 1. Polaroid-scatter hero that gathers on scroll
**Source:** `app/_home/sections/Hero.tsx`

- **Layout:**
  - The headline is centered, with a squiggle under the key words: `<Draw className="absolute -bottom-3 left-0 w-full"><Squiggle color="var(--sf-butter)"/></Draw>`.
  - 6–8 polaroids are absolutely placed from a `SPOTS` array (`x`, `y`, `r` rotation, `d` depth) using `lg:left-[var(--x)] lg:top-[var(--y)]` and inline `rotate`.
  - Below `lg`, the same links become a horizontal snap row.
- **Element layers:** `Link` (position + CSS rotate) › `[data-gather]` (scroll tween) › `[data-par]` (mouse parallax) › the polaroid (hover scale). Keeping these separate avoids the GSAP/Tailwind transform clash.
- **Mouse parallax:** `gsap.quickTo(el, "x"|"y")` per polaroid. Its target is the pointer offset from the center × 46/34 px × depth.
- **Gather:**
```ts
gsap.to(g, {
  x: () => (centerX - (link.offsetLeft + link.offsetWidth / 2)) * 0.85,
  y: () => centerY - (link.offsetTop + link.offsetHeight / 2),
  rotate: (i % 2 ? 1 : -1) * (4 + i), scale: 0.72, ease: "none",
  scrollTrigger: { trigger: root, start: "top top", end: "bottom 35%", scrub: 0.8, invalidateOnRefresh: true },
});
```
- **Entrance:** polaroids drop in with `back.out(1.6)` and a random rotation, staggered by 0.07.
- **Doodles:** `Sun`, `Leaf` and `Star` sit at the edges with `hidden lg:block`.

## 2. Draggable polaroid cards
**Source:** `Welcome` in `app/_home/sections/Story.tsx`
- Uses framer-motion: `drag={canDrag}`, `dragConstraints={areaRef}`, `whileHover={{ rotate: 0, scale: 1.04 }}`, `whileDrag={{ scale: 1.08 }}`, and a spring `whileInView` entrance from a doubled tilt.
- `canDrag = useMediaQuery("(pointer: fine)")`, so touch users scroll normally.
- Add a handwritten hint with an `Arrow` doodle, shown on desktop only.

## 3. Sticky-note schedule
**Source:** `Offer` in `app/_home/sections/Story.tsx`
- Notes are pastel blocks with a white tape strip, a small inline rotation (−2° / 1.5° / −1°) and the `.sf-wiggle` hover.
- They sit in 3 columns on `sm`, then stack with alternating side margins at `lg` so long text isn't cramped.
- The highlight card is solid coral, with a white `Leaf` doodle bleeding off the corner.

## 4. Blob image with a sticker CTA
**Source:** the programs in `Offer`
```tsx
<div className="relative mx-auto aspect-square w-[82%] max-w-[420px]">
  <div className="sf-blob absolute inset-0 overflow-hidden" style={{ animationDelay: `${-i * 5}s` }}>
    <Image src={…} alt={…} fill className="object-cover" sizes="…" />
  </div>
  <Link href="/apply" className="absolute -right-2 top-4 flex h-28 w-28 rotate-12 items-center justify-center rounded-full bg-[var(--sf-butter)] … hover:rotate-0">…</Link>
</div>
```
Offset `animationDelay` so neighbouring blobs don't morph in sync.

## 5. "Seed to sage" growing illustration
**Source:** `Philosophy` in `app/_home/sections/Story.tsx`
- A sticky SVG on the left and a list of steps on the right.
- One timeline is scrubbed by the list (`trigger: "[data-pillars]", start: "top 70%", end: "bottom 60%"`):
  - The stem path draws (`strokeDashoffset` 1 → 0).
  - The seed shrinks from 1.6×.
  - Leaves `[data-sprout]` scale from 0 at their base (`transformOrigin: "50% 100%"`, etc.) at 0.6, 1.5 and 2.4.
  - The bloom spins in at 3.3.
- Each step card slides in from the right with `back.out(1.4)`.

## 6. Split scroll with the tick-off sticky note
**Source:** `Continuity` in `app/_home/sections/Community.tsx`
- **Structure:** `section.lg:h-[260vh]` › `div.lg:sticky.lg:top-0.lg:h-screen.grid.lg:grid-cols-[1fr_1.75fr_1fr]` › left column / copy / right column.
- **Columns:** each is `hidden lg:block h-screen overflow-hidden` around a flex stack of tilted, taped polaroids. The image list is doubled so the stack never runs out.
- **Motion:**
```ts
const st = { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.6 };
gsap.fromTo("[data-col-up]",   { yPercent: 0 },   { yPercent: -48, ease: "none", scrollTrigger: st });
gsap.fromTo("[data-col-down]", { yPercent: -48 }, { yPercent: 0,   ease: "none", scrollTrigger: st });
// the same trigger ticks off each [data-why] row at 0.08 + i * 0.28:
tl.fromTo(row, { opacity: 0.35 }, { opacity: 1 }, at)
  .fromTo(tick, { strokeDashoffset: 1 }, { strokeDashoffset: 0 }, at)
  .fromTo(mark, { backgroundSize: "0% 40%" }, { backgroundSize: "100% 40%" }, at + 0.04);
```
- **Fit:** the middle column must be ≤ 100vh. Tight spacing works: `mt-3`/`mt-4`/`mt-5`, heading at `lg:text-[3.4rem] xl:text-6xl`.
- **Phones:** copy first, then a `Marquee` row of the same polaroids. By default the ticks render checked, so no-motion users see the final state.

## 7. Converging bubbles diagram
**Source:** `Partnership` in `app/_home/sections/Community.tsx`
- Three pastel circles (`aspect-square rounded-full`) sit on a hand-drawn loop path that draws on scroll (`scrub`).
- The bubbles pop in with `back.out(2)`. Put `data-bubble` on the positioned wrapper and the hover `scale-110` on the inner button, never both on one element.

## 8. Flip cards
**Source:** `app/_home/sections/Team.tsx`
```tsx
<div className="sf-flip h-[420px]" data-flipped={isFlipped}>
  <button onClick={toggle} aria-pressed={isFlipped} className="sf-flip-inner relative block h-full w-full">
    <div className="sf-face absolute inset-0 …">front: photo + name/role</div>
    <div className="sf-face sf-back absolute inset-0 …">back: bio (overflow-y-auto, data-lenis-prevent)</div>
  </button>
</div>
```
Hover flips on devices that can hover; tap toggles everywhere.

## 9. Toggle with an animated pill
**Source:** `app/_home/sections/Tuition.tsx`
- Use `role="tablist"` buttons, with a `motion.span layoutId="sf-band"` behind the active one.
- The changing price is wrapped in `AnimatePresence mode="wait"` with a spring entrance from `y: 40, rotate: -6`.
- Price "stickers" are pastel circles with `CountUp` inside.

## 10. Postcard and ticket
**Source:** `TourAndShadow` in `app/_home/sections/Visit.tsx`
- **Postcard:** a white card with `-rotate-1 hover:rotate-0`, a photo with a dashed "stamp" corner, and a host chip.
- **Ticket:** the `.sf-ticket` notches, a dashed perforation (`border-t-2 border-dashed border-white/50`) between the photo and the details, and a 🎟️ badge.

## 11. Confetti on success
**Source:** `Enroll` in `app/_home/sections/Visit.tsx`
```ts
async function celebrate() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const confetti = (await import("canvas-confetti")).default;
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 }, colors: ["#f29a8f", "#ffe58a", "#cdeed5", "#cfe6fb", "#e8d8f1"] });
}
<EnrollForm onSuccess={celebrate} theme={{ … }} />
```
Wrap the form in a `.sf-paper` card with a coral tape strip.

## 12. Theme-pill and photo marquees
**Source:** `app/_home/sections/Life.tsx`
- Use two opposing `Marquee`s inside a `-rotate-2` wrapper: pastel pills of week themes, and a polaroid photo strip that links to Instagram.
- Mark purely decorative marquees `aria-hidden`.
