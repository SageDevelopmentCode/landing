---
name: sagefield-garden
description: The Sage Field "Garden" design system used by the home page. Use whenever building, redesigning, or restyling any public-facing Sage Field page or section (marketing pages, program pages, tours, enrollment, highlights, blog landing, etc.), or when asked to make something "look like the home page", "match the new design", or "use our design system". Covers tokens, typography, components in app/_garden, section anatomy, motion recipes, and hard-won GSAP gotchas.
---

# Sage Field "Garden" design system

The home page (`app/page.tsx` → `app/_home/HomePage.tsx`) is the reference build. When in doubt, open the matching home section in `app/_home/sections/` and copy its structure.

## The feel
Warm, playful, premium. It's made for parents of 4–11 year olds: friendly enough to feel like childhood, polished enough to trust with tuition money.
- **Real photos of the kids carry the page.** Frame them as polaroids, sticky notes, blobs and tickets: things you'd find in a classroom.
- **Pastel paper colors on warm cream,** with coral as the action color and sage as the calm secondary.
- **Chunky display type** (Bricolage Grotesque), **rounded body** (Nunito), and **handwritten accents** (Gochi Hand).
- **Motion is springy and tactile,** never slick or corporate. Things tilt, wiggle, draw themselves, flip, and get checked off.

## Non-negotiables
1. **Keep real copy word for word.** Never invent claims, prices, dates or quotes. Handwritten microcopy ("psst — you can drag these around!", "scroll to grow 🌱") is fine but keep it small, decorative, never factual, and never in a real person's voice.
2. **Accessible by default:**
   - Semantic headings (one `h1` per page).
   - Hover effects also work on `:focus-visible`.
   - Decorative SVGs get `aria-hidden`.
   - Photos get alt text, unless they're purely decorative (then `alt=""`).
3. **Reduced motion and phones always work.**
   - Run GSAP only inside `gsap.matchMedia()`. Use `MQ_MOTION` for any motion, and `MQ_DESKTOP_MOTION` (≥1024px + motion OK) for pinned/scrubbed or pointer effects.
   - The markup must render its final, readable state with no JS animation.
   - Below `lg`, swap heavy scroll effects for stacked layouts or a `Marquee` row.
4. **Images:** use `next/image` with an accurate `sizes`. Use `preload` (not the deprecated `priority`) only for the first hero images.

## Getting started on a new page
```tsx
// app/<route>/page.tsx  (server component)
import GardenRoot from "@/app/_garden/GardenRoot";
import MyPage from "./MyPage";
export default function Page() {
  return <GardenRoot><MyPage /></GardenRoot>;
}

// app/<route>/MyPage.tsx
"use client";
import Navbar from "@/app/components/Navbar";
import GardenShell, { useDialogs } from "@/app/_garden/GardenShell";
export default function MyPage() {
  return (
    <GardenShell navbar={<Navbar darkStyle />}>{/* sections */}</GardenShell>
  );
}
```
- **`GardenRoot`:**
  - Loads the fonts (`app/_garden/fonts.ts`).
  - Applies the `.sf-garden` scope (`app/_garden/garden.css`).
  - Every `sf-*` class and `--sf-*` token only works inside it.
- **`GardenShell`:**
  - Provides Lenis smooth scroll, the Footer, the enrollment popup, the waitlist + contact dialogs, and the floating SMS button.
  - Call `useDialogs()` to get `openWaitlist()` and `openContact()`; don't mount your own dialogs.
  - It also applies `overflow-x-clip`.
- **Navbar:** use `<Navbar darkStyle />` over light (cream/pastel) tops. Use `<Navbar lightText />` only if a page opens on a dark photo.

## Tokens (`app/_garden/garden.css`)
| Token | Hex | Use |
|---|---|---|
| `--sf-cream` | #fff8ef | page background |
| `--sf-ink` | #2b2a26 | headings, primary text, dark panels |
| `--sf-soft` | #5b5850 | body copy, secondary text |
| `--sf-coral` / `--sf-coral-deep` | #f29a8f / #e07a6e | primary CTA, highlights / its shadow + text on coral tints |
| `--sf-sage` / `--sf-sage-deep` | #6b9474 / #4a6354 | secondary CTA, nature accents / its shadow |
| `--sf-butter` | #ffe58a | sticky notes, tape, stickers, "pay attention" |
| `--sf-mint` | #cdeed5 | sage-family tint, success states |
| `--sf-sky` | #cfe6fb | calm tint, community sections |
| `--sf-lav` | #e8d8f1 | playful tint |
| `--sf-peach` | #ffdcc7 | warm tint (tuition, callouts) |

- **Writing tokens in Tailwind:** `bg-[var(--sf-butter)]`, `text-[var(--sf-soft)]`, `bg-[var(--sf-mint)]/45`.
- **Section rhythm:** alternate cream (no class) and white with light pastel washes at 35–50% opacity (`bg-[var(--sf-mint)]/45`, `bg-[var(--sf-sky)]/35`, `bg-[var(--sf-peach)]/45`, `bg-[var(--sf-butter)]/50`, `bg-[var(--sf-lav)]/40`). Use one solid dark panel (`bg-[var(--sf-ink)]`) sparingly for emphasis, as with homeschool pricing.

**Type**
- `.sf-display` is Bricolage, weight 800, tracking −0.035em. Use it for all headings, prices and big numerals. Section `h2`: `text-5xl md:text-7xl`. Hero `h1`: `lg:text-[7.4rem]`.
- Body text inherits Nunito. Lead paragraphs: `text-lg leading-relaxed text-[var(--sf-soft)]`. Use `font-extrabold` for UI labels and buttons.
- `.sf-hand` is Gochi Hand. Use it for subtitles (`text-2xl text-[var(--sf-sage-deep)]`), captions, notes and "step 1" labels. Never use it for paragraphs.
- **Highlighted phrase:** `font-extrabold text-[var(--sf-ink)] bg-[linear-gradient(transparent_60%,var(--sf-butter)_60%)]`. Swap butter for mint or sky per section. With `Runs` from motion, pass this as `highlightClassName`.

**Shape and depth**
- **Radius:** cards `rounded-[28px]`–`rounded-[36px]`, big panels `rounded-[40px]`/`[44px]`, pills and buttons `rounded-full`, polaroid photos `rounded-[3px]` inside the frame.
- **Soft card shadow:** `shadow-[0_20px_50px_-30px_rgba(43,42,38,0.5)]` (or `0_30px_60px_-35px` for big cards).
- **Chunky "toy" shadow** (buttons, contact rows): `shadow-[0_6px_0_0_<deeper color>]`, which presses down on `active:`.
- **Tilt:** set a small rotation with inline `style={{ rotate: "-2deg" }}`, then straighten on hover (`hover:!rotate-0` or `hover:rotate-0`).

## Components (`app/_garden/`)
| Import | What / when |
|---|---|
| `btnPop`, `btnSage`, `btnOutline` from `ui` | Button class strings: coral primary, sage secondary, ink outline. Use on `<Link>` or `<button>`. |
| `Pill` (`tint`: coral, sage, butter, sky, lav) from `ui` | Section eyebrow badge, usually with an emoji: `<Pill tint="sage">🌱 Welcome</Pill>`. Also used for chips and dates. |
| `Draw` + `Squiggle`, `Sun`, `Leaf`, `Arrow`, `Star` from `ui` | Hand-drawn doodles; any `[data-draw]` path draws itself on view. `Draw`'s `className` sets its display (pass `hidden lg:block` etc.). |
| `.sf-polaroid` | White photo frame (10px padding, deeper bottom). Add tape with an absolutely positioned pastel `span` (`-top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-3`). |
| `.sf-blob` | Morphing organic mask; put it on an `overflow-hidden` wrapper around an `Image`. |
| `.sf-paper` | Notebook-lined background for forms. |
| `.sf-ticket` | Notched ticket edges (Shadow Day). |
| `.sf-flip`, `.sf-flip-inner`, `.sf-face`, `.sf-back` | Flip cards: hover flips, `data-flipped="true"` flips on tap. |
| `.sf-wiggle`, `.sf-spin-slow` | Hover wiggle (sticky notes); slow spin for decorative circles. |
| `GardenShell`, `useDialogs` | Page chrome plus `openWaitlist` / `openContact`. |
| `EnrollForm` | Interest form wired to `submitWaitlist`. Style it with the `theme` prop; `onSuccess` is a good place for confetti. |
| `FaqList` (+ `filterFaqs`) | Themed accordion with the same search behaviour as `FAQAccordion`. |
| `BioDialog` | Accessible bio modal / bottom sheet for `TeamMember`s. |
| `Reveal` | Fades and slides its direct children in on view (`y`, `x`, `stagger`, `delay`). The default wrapper for blocks of copy and card grids. |
| `WordsReveal` | Masked word-by-word heading reveal. Use it for section `h2`s; it keeps spaces. |
| `Runs` | Renders `Run[]` copy with highlighted phrases. |
| `CountUp` | Prices and numbers count up on view; the final value is server-rendered. |
| `Magnetic` | The primary hero or contact CTA leans toward the cursor (fine pointers only). |
| `Marquee` | Endless row that speeds up with scroll velocity and pauses on hover or focus. Use it for photo rows, theme pills and the phone fallback for split scroll. |
| `Parallax`, `ClipReveal`, `ScrubWords`, `HorizontalTrack` | Available but not used on the home page. Reach for them only if a page truly needs them, and keep the Garden styling. |
| `useMediaQuery` | SSR-safe media query (false on the server), for picking interaction modes such as drag only with `(pointer: fine)`. |
| `hooks`: `useLatestPost`, `usePastHero`, `formatPostDate` | Blog preview data and helpers. |

Shared types (`Run`, `FaqGroup`, `FaqItem`, `TeamMember`) live in `app/_garden/types.ts`. Page copy belongs in a content file next to the page; for the home page it's `app/_home/content.tsx`. Don't put copy in the kit.

## Section anatomy
```tsx
<section className="py-24 lg:py-32 bg-[var(--sf-mint)]/45">
  <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
    <div className="mx-auto max-w-3xl text-center">
      <Pill tint="sage">🌿 {COPY.badge}</Pill>
      <WordsReveal text={COPY.heading} className="sf-display mt-5 text-5xl md:text-7xl" />
      <p className="sf-hand mt-2 text-2xl text-[var(--sf-sage-deep)]">{COPY.subtitle}</p>
      <Reveal>
        <p className="mt-6 text-lg leading-relaxed text-[var(--sf-soft)]">{COPY.body}</p>
      </Reveal>
    </div>
    <Reveal className="mt-14 grid gap-6 md:grid-cols-3" stagger={0.1} y={50}>{/* cards */}</Reveal>
    <div className="mt-10 text-center"><Link href="…" className={btnPop}>{COPY.cta}</Link></div>
  </div>
</section>
```
- **Order:** Pill → heading → handwritten subtitle → body → content → CTA.
- **Alignment:** left-aligned two-column versions are fine for text plus visual (see `Offer`, `Partnership`).
- **One idea per section.** Each section gets one signature interaction at most; pick from `recipes.md`.

## Motion recipes
See **`recipes.md`** (next to this file) for copy-ready patterns from the home page:
- polaroid-scatter hero that gathers on scroll
- draggable polaroids
- sticky-note schedule
- blob programs with a sticker CTA
- seed-to-sage growing illustration
- split scroll with the tick-off sticky note
- converging partnership bubbles
- flip cards
- grade-band toggle
- postcard and ticket cards
- confetti on form success

## GSAP and Lenis gotchas (learned the hard way here)
- **Never put Tailwind `translate-*`, `scale-*` or `rotate-*` utilities on an element GSAP animates.** GSAP folds them into its own transform, and the class states (hover, toggled scale or opacity) then stop working. Animate a wrapper and keep CSS transforms on an inner element.
- **Draw-on SVG paths:** use `pathLength={1}` with `strokeDasharray="1 2"`, animating `strokeDashoffset` 1 → 0. Plain `"1"` leaves a round-cap dot at the path end.
- **Sticky or pinned frames must fit in 100vh** at 1440×900. Measure the inner column's `scrollHeight` against the viewport height; compact spacing at `lg` if it runs over.
- **Snap rails need `scroll-padding-inline`** equal to their padding, or the first card snaps flush to the edge.
- **Space between words:** `WordsReveal` puts spaces outside the inline-block masks, so don't hand-roll a word splitter that puts them inside.
- **Already handled:** `SmoothScroll` re-measures ScrollTrigger when the page height changes, and `GardenShell` clips horizontal overflow, so rotated polaroids can bleed safely.
- **Order of effects:** child effects run before parent effects. Create pinned ScrollTriggers top to bottom in DOM order, or call `ScrollTrigger.refresh()` afterwards.
- **Modals:** Lenis ignores scrolling inside `.fixed`, `[role=dialog]` and `[data-lenis-prevent]`. Mark any other inner scroll area with `data-lenis-prevent`.
- **Headless testing:** in a hidden or background browser tab, requestAnimationFrame is throttled, so scrubbed animations won't advance from `scrollTo` alone. Use real wheel scrolling and screenshots to verify.

## Pre-ship checklist
- [ ] Every string comes from real copy; nothing invented beyond small decorative notes.
- [ ] One `h1`; section headings are `h2`.
- [ ] At 1440×900 every pinned or sticky part fits and scrubs forwards and backwards.
- [ ] At 375px: no horizontal scroll (`documentElement.scrollWidth === clientWidth`), heavy effects have their fallbacks, and the Navbar menu icon is visible.
- [ ] With reduced motion, everything is readable and nothing is left hidden mid-animation.
- [ ] Hover-only details are reachable by keyboard focus and by tapping.
- [ ] `npx tsc --noEmit`, `npx eslint <changed paths>` and `npx next build` pass.
