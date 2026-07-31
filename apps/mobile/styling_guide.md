# Sagefield React Native Style Guide

Derived from the web dashboard (`app/parent/dashboard/`) to maintain visual consistency across platforms.

---

## Colors

### Primary

| Token          | Hex       | Usage                               |
| -------------- | --------- | ----------------------------------- |
| primary        | `#f29a8f` | Buttons, active states, focus rings |
| primary-hover  | `#e88d82` | Button hover/pressed states         |
| primary-active | `#d47f75` | Button active/deep press            |

### Sage (Brand Green)

| Token    | Hex       | Usage                        |
| -------- | --------- | ---------------------------- |
| sage-50  | `#F2F7F3` | Light backgrounds            |
| sage-100 | `#E0EDE2` | Tinted cards                 |
| sage-200 | `#C8DFCB` | Borders on sage surfaces     |
| sage-300 | `#BFD8C0` | Subtle highlights            |
| sage-400 | `#97C09B` | Icons, decorative            |
| sage-500 | `#7FA888` | Secondary text on light      |
| sage-600 | `#6B9474` | Navigation active            |
| sage-700 | `#5E7C68` | Headings, primary brand text |
| sage-800 | `#4A6354` | Strong text on light bg      |
| sage-900 | `#374B3F` | Darkest accents              |

**Nav active color**: `#4a7c59` (slightly lighter sage variant used for tab highlights)

### Neutrals (Gray)

| Token    | Value     | Usage                    |
| -------- | --------- | ------------------------ |
| gray-50  | `#f9fafb` | Page backgrounds, inputs |
| gray-100 | `#f3f4f6` | Dividers, borders        |
| gray-200 | `#e5e7eb` | Standard borders         |
| gray-400 | `#9ca3af` | Placeholder text, icons  |
| gray-500 | `#6b7280` | Tertiary/secondary text  |
| gray-600 | `#4b5563` | Body text                |
| gray-700 | `#374151` | Emphasized body text     |
| gray-800 | `#1f2937` | Headings                 |

### Backgrounds

| Token      | Hex       | Usage                      |
| ---------- | --------- | -------------------------- |
| background | `#ffffff` | Default screen background  |
| welcome-bg | `#FFF9F5` | Dashboard/home screen tint |
| badge-bg   | `#FFF4EC` | Badge/pill backgrounds     |

### Status Colors

| State      | Background             | Border                  | Text                    |
| ---------- | ---------------------- | ----------------------- | ----------------------- |
| Success    | `#ecfdf5` (emerald-50) | `#a7f3d0` (emerald-200) | `#047857` (emerald-700) |
| Warning    | `#fffbeb` (amber-50)   | `#fde68a` (amber-200)   | `#b45309` (amber-700)   |
| Danger     | `#fff1f2` (rose-50)    | `#ffe4e6` (rose-100)    | `#be123c` (rose-700)    |
| Error text | —                      | —                       | `#ef4444` (red-500)     |

### Accent Colors (Pastel)

| Token         | Hex       |
| ------------- | --------- |
| blush-pink    | `#FFB3BA` |
| butter-yellow | `#FFFFBA` |
| lavender      | `#E0BBE4` |
| sky-blue      | `#BAE1FF` |
| mint-cream    | `#BAFFC9` |

---

## Typography

### Font Families

| Role      | Font           | Style                      |
| --------- | -------------- | -------------------------- |
| Heading   | Merriweather   | Serif — elegant, formal    |
| Body      | Poppins        | Sans-serif — clean, modern |
| Signature | Dancing Script | Handwriting — cursive      |

> In React Native: load via `expo-font` or `@expo-google-fonts/poppins`, `@expo-google-fonts/merriweather`, `@expo-google-fonts/dancing-script`.

### Type Scale

| Role            | Size | Weight | Color                |
| --------------- | ---- | ------ | -------------------- |
| Page Title      | 24px | 700    | `#5E7C68` (sage-700) |
| Section Heading | 20px | 600    | gray-800 (`#1f2937`) |
| Card Title      | 16px | 600    | gray-800 (`#1f2937`) |
| Section Label   | 14px | 700    | gray-800 (`#1f2937`) |
| Body Text       | 14px | 400    | gray-600 / gray-700  |
| Form Label      | 12px | 600    | gray-600 (`#4b5563`) |
| Small / Caption | 12px | 400    | gray-400 / gray-500  |

### Line Height

- Paragraphs: `1.7` (approximately `lineHeight: fontSize * 1.7` in RN)
- Labels/titles: default (tight)

---

## Spacing

Base-4 spacing scale (matching Tailwind's default):

| Step | Value | Usage                              |
| ---- | ----- | ---------------------------------- |
| 0.5  | 2px   | Micro nudges                       |
| 1    | 4px   | Tight gaps between inline elements |
| 1.5  | 6px   | Navigation item gaps               |
| 2    | 8px   | Icon-to-text gaps                  |
| 3    | 12px  | Small internal padding             |
| 4    | 16px  | Standard card padding              |
| 5    | 20px  | Section padding                    |
| 6    | 24px  | Section padding (large)            |
| 8    | 32px  | Section vertical spacing           |
| 10   | 40px  | Large section gaps                 |
| 12   | 48px  | Page-level padding                 |

---

## Border Radius

| Token        | Value  | Usage                         |
| ------------ | ------ | ----------------------------- |
| rounded-lg   | 8px    | Inputs, small components      |
| rounded-xl   | 12px   | Cards, modals, info boxes     |
| rounded-2xl  | 16px   | Large containers              |
| rounded-full | 9999px | Pills, avatars, close buttons |

---

## Shadows

| Token      | Usage                              |
| ---------- | ---------------------------------- |
| shadow-sm  | Cards, subtle elevation            |
| shadow     | Standard modals/sheets             |
| shadow-2xl | Full-screen drawers, bottom sheets |

React Native equivalents:

```js
// shadow-sm
shadowColor: '#000',
shadowOffset: { width: 0, height: 1 },
shadowOpacity: 0.05,
shadowRadius: 2,
elevation: 1,

// shadow (standard)
shadowColor: '#000',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.10,
shadowRadius: 8,
elevation: 4,

// shadow-2xl
shadowColor: '#000',
shadowOffset: { width: 0, height: 8 },
shadowOpacity: 0.18,
shadowRadius: 24,
elevation: 12,
```

---

## Component Patterns

### Buttons

```js
// Primary
{
  backgroundColor: '#f29a8f',
  paddingHorizontal: 20,
  paddingVertical: 10,
  borderRadius: 12,
  fontWeight: '600',
  fontSize: 14,
  color: '#ffffff',
}

// Secondary
{
  backgroundColor: 'transparent',
  color: '#6b7280',   // gray-500
  fontSize: 12,
  fontWeight: '600',
}

// Disabled
{ opacity: 0.5 }
```

### Cards

```js
// Standard
{
  backgroundColor: '#ffffff',
  borderWidth: 1,
  borderColor: '#e5e7eb',   // gray-200
  borderRadius: 12,
  padding: 16,
}

// Tinted
{
  backgroundColor: '#f9fafb',  // gray-50
  borderRadius: 12,
  padding: 16,
}

// Status (replace values per status color table)
{
  backgroundColor: statusBg,
  borderWidth: 1,
  borderColor: statusBorder,
  borderRadius: 12,
  padding: 12,   // or 16
}
```

### Form Inputs

```js
// Label
{
  fontSize: 12,
  fontWeight: '600',
  color: '#4b5563',  // gray-600
  marginBottom: 4,
}

// Input
{
  backgroundColor: '#ffffff',
  borderWidth: 1,
  borderColor: '#e5e7eb',   // gray-200
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 8,
  fontSize: 14,
  color: '#1f2937',  // gray-800
}

// Placeholder color
placeholderTextColor: '#9ca3af'  // gray-400

// Focus state
borderColor: '#f29a8f'  // primary

// Error text
{ fontSize: 12, color: '#ef4444' }  // red-500
```

### Info / Alert Boxes

```js
// Neutral
{ backgroundColor: '#F2F7F3', borderWidth: 1, borderColor: '#f3f4f6', borderRadius: 12, padding: 12 }

// Warning
{ backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 12, padding: 12 }

// Danger
{ backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#ffe4e6', borderRadius: 12, padding: 12 }

// Success
{ backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', borderRadius: 12, padding: 12 }
```

### Navigation / Tabs

```js
// Active tab
{
  color: '#4a7c59',
  backgroundColor: 'rgba(74, 124, 89, 0.08)',
  fontWeight: '600',
  borderRadius: 6,
}

// Inactive tab
{ color: '#4b5563' }  // gray-600

// Hover/Press
{ color: '#4a7c59', backgroundColor: '#f9fafb' }

// Font
{ fontSize: 14, fontFamily: 'Poppins' }
```

### Modals / Bottom Sheets

```js
// Backdrop
{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }

// Sheet
{ backgroundColor: '#ffffff', ...shadow2xl }

// Header (sticky)
{
  backgroundColor: '#ffffff',
  borderBottomWidth: 1,
  borderBottomColor: '#f3f4f6',
  paddingHorizontal: 24,
  paddingVertical: 16,
}

// Body (scrollable)
{ paddingHorizontal: 24, paddingVertical: 24 }

// Footer (sticky)
{
  backgroundColor: '#ffffff',
  borderTopWidth: 1,
  borderTopColor: '#f3f4f6',
  paddingHorizontal: 24,
  paddingVertical: 16,
}

// Spring animation (Reanimated / Animated)
{ damping: 28, stiffness: 300 }
```

### Signature Block

```js
// Unsigned
{
  backgroundColor: '#f9fafb',  // gray-50
  borderWidth: 1,
  borderColor: '#e5e7eb',      // gray-200
  borderRadius: 12,
  padding: 16,
}

// Signed
{
  backgroundColor: '#ecfdf5',  // emerald-50
  borderWidth: 1,
  borderColor: '#a7f3d0',      // emerald-200
  borderRadius: 12,
  padding: 12,
}

// Font
{ fontFamily: 'DancingScript', fontStyle: 'italic' }
```

---

## Overlay / Z-index

| Context             | Z-index |
| ------------------- | ------- |
| Sticky headers/nav  | 10      |
| Dropdowns           | 50      |
| Modal backdrop      | 60      |
| Modal/sheet content | 70      |

---

## Animation Principles

- **Slide-in sheets**: translate from right (or bottom on mobile), spring easing
- **Fade overlays**: opacity `0 → 1`
- **Spring params**: `damping: 28–30`, `stiffness: 300`
- **Interactive elements**: always have a pressed/hover state (color shift or opacity change)
- **Buttons/links**: color transitions on all interactive elements

---

## Design Principles

1. **Warm & welcoming** — coral primary + sage green secondary; never cold or sterile
2. **Card-first layouts** — content lives in cards with subtle borders and light backgrounds
3. **Sticky navigation** — headers and action footers stay visible while content scrolls
4. **Status visibility** — color-coded success/warning/danger states used consistently
5. **Mobile-first** — single column default, expand with breakpoints
6. **Accessible contrast** — gray-600+ on white, never gray-400 for body text

---

## Apply / Auth Flow Patterns

> Source: `app/apply/start/StartPageClient.tsx`

### Split-Panel Auth Layout

- **Left panel**: image/brand panel — `lg:w-1/2`, full height on desktop, `h-64` on mobile; contains background slideshow + gradient overlay + thumbnail strip
- **Right panel**: auth form panel — `flex-1`, `bg-welcome-bg` (`#FFF9F5`), centered content, `max-w-md` form container

### Panel Entrance Animations

```
Left panel:  x: -40 → 0, opacity 0 → 1, duration 0.7s, easeOut
Right panel: y: 30 → 0, opacity 0 → 1, delay 0.35s, duration 0.6s, easeOut
```

### Background Slideshow

- Images cycle every **7 seconds** via `setInterval`
- Transition: `AnimatePresence mode="sync"`, opacity `0 → 1` over `0.8s`
- **Gradient overlay**: `bg-gradient-to-br from-black/50 via-black/20 to-black/10`
- Thumbnail strip: `w-12 h-12 rounded-xl border-2` per thumb
  - Active: `scale-105 border-white/60`
  - Inactive: `opacity-60 border-white/30`

### Auth Mode Transitions (AnimatePresence)

```
Enter: x: 20 → 0, opacity 0 → 1, duration 0.3s
Exit:  x: -20, opacity 0, duration 0.3s
```

Modes: `"choose"` → `"create"` or `"login"`, managed via `useState<Mode>`

### Badge / Pill

```
bg:             #FFF4EC (badge-bg)
color:          black
fontSize:       12px (xs)
fontWeight:     600
borderRadius:   9999px (rounded-full)
paddingH:       16px
paddingV:       6px
```

### Choice Cards (Mode Selector)

```
bg:           white
border:       1px #e5e7eb (gray-200)
borderRadius: 16px (rounded-2xl)
padding:      20px
shadow:       shadow-sm
hoverBorder:  #f29a8f (primary)
icon circle:  bg=primary/10, size=40×40, rounded-full, icon size=20
```

### Inline Error / Message Boxes

These use custom colors distinct from the standard status system:

```js
// Error
{ backgroundColor: '#F2C6C6', border: '1px solid #E6B7B2', color: '#A55858' }

// Success / message
{ backgroundColor: '#CDE8D0', border: '1px solid #BFD8C0', color: '#4A7C59' }

// Shared
{ borderRadius: 12px, paddingH: 16px, paddingV: 12px, fontSize: 14px }
```

### OTP Input Row

```
Count:         6 individual inputs
Size:          w-11 (44px) × h-13 (52px)
text:          center, fontSize=18px (lg), fontWeight=600
border:        1px gray-200, borderRadius=8px
focus:         border primary (#f29a8f)
gap:           10px (gap-2.5)
autoComplete:  "one-time-code" on first input
paste handler: fills all 6 digits, auto-submits if complete
```

### Primary Button (Full-Width)

```
width:        100% (w-full)
padding:      px=32px, py=16px
bg:           #f29a8f, text: white
borderRadius: 8px (rounded-lg)
fontWeight:   600, fontSize: 14px
shadow:       shadow-md → shadow-lg on hover
disabled:     opacity=0.6, cursor=not-allowed
loading:      inline Spinner SVG + text swap ("Sending…" / "Verifying…")
```

### Back / Tertiary Button

```
color:        gray-400 → gray-600 on hover
fontSize:     14px, fontWeight: normal
icon:         ArrowLeft size=14, gap=6px
background:   none
border:       none
```

### Inline Text Link (Secondary Action)

```
// Subdued (e.g. "sign in with password")
fontSize: 12px
color: gray-400 → gray-600 on hover

// Prominent (e.g. "Log in" / "Back to sign in")
color: primary (#f29a8f) → primary-hover (#e88d82) on hover
```

No border, no background on either variant.

### Spinner Component

```
SVG, animate-spin, size: 20×20 (h-5 w-5)
Circle: opacity=0.25, stroke=currentColor, strokeWidth=4
Path:   opacity=0.75, fill=currentColor
```

---

### Passwordless Email Verification Flow

> Sources: `app/apply/start/StartPageClient.tsx`, `app/login/LoginForm.tsx`

#### 1. Flow Overview

Two-step pattern used inside both **CreateMode** and **LoginMode**:

| Step | View key    | Description                                  |
| ---- | ----------- | -------------------------------------------- |
| 1    | `otp-email` | Email entry form (+ Full Name in CreateMode) |
| 2    | `otp-code`  | 6-digit code entry form                      |

Both steps render inside the same `AnimatePresence mode="wait"` wrapper that governs all auth-mode transitions:

```
Enter: x: 20 → 0, opacity 0 → 1, duration 0.3s
Exit:  x: -20, opacity 0, duration 0.3s
```

The internal `view` state (`"otp-email"` / `"otp-code"`) is a local toggle within each mode component — it does **not** trigger the outer AnimatePresence; only switching the top-level `mode` (`"choose"` / `"create"` / `"login"`) does.

---

#### 2. Step 1 — Email Entry Screen

**Badge/pill** — see existing [Badge / Pill](#badge--pill) spec. Text varies by context (e.g. "Create Account", "Welcome Back").

**Back / Tertiary Button** — see existing [Back / Tertiary Button](#back--tertiary-button) spec.

- Content: "Back"
- Placement: above badge, `mb-6` (24px)

**Heading**

```
fontFamily:   Merriweather (font-heading)
fontSize:     30px (text-3xl)
fontWeight:   700 (bold)
color:        gray-800 (#1f2937)
marginBottom: 32px (mb-8)
```

Content by mode:

- CreateMode → `"Let's get you set up"`
- LoginMode → `"Continue your application"`

**Subtitle / description**

```
fontFamily:  Poppins (font-body)
fontSize:    14px (text-sm)
color:       gray-500 (#6b7280)
marginTop:   -16px (-mt-4)  ← negative pull toward heading
```

Content:

- CreateMode → `"We'll send a 6-digit code to verify your email — no password needed."`
- LoginMode → `"Enter your email and we'll send a 6-digit code — no password needed."`

**Full Name input** (CreateMode only)

Label: `"Full Name"` — see label spec below.
Input: standard form input — see input spec below.
Placeholder: `"Jane Smith"`

**Email input** (both modes)

Label: `"Email"` (CreateMode) / `"Email address"` (LoginMode) — see label spec below.
Input: standard form input — see input spec below.
Placeholder: `"jane@example.com"` / `"you@example.com"`

**Label styling** (shared)

```
fontSize:     14px (text-sm)
fontWeight:   600 (font-semibold)
color:        gray-700 (#374151)
fontFamily:   Poppins (font-body)
marginBottom: 6px (mb-1.5)
display:      block
```

**Input styling** (shared)

```
width:        100% (w-full)
paddingH:     16px (px-4)
paddingV:     12px (py-3)
border:       1px solid gray-200 (#e5e7eb)
borderRadius: 8px (rounded-lg)
fontFamily:   Poppins (font-body)
fontSize:     14px (text-sm)
color:        gray-800 (#1f2937)
placeholder:  gray-400 (#9ca3af)
outline:      none
focus:        border-color → primary (#f29a8f), transition-colors
```

**Submit button** — see existing [Primary Button (Full-Width)](#primary-button-full-width) spec.

| Mode       | Default text               | Loading text |
| ---------- | -------------------------- | ------------ |
| CreateMode | `"Send verification code"` | `"Sending…"` |
| LoginMode  | `"Send code"`              | `"Sending…"` |

**Alt action link** ("Sign in with password instead")

```
fontSize:   12px (text-xs)
fontFamily: Poppins (font-body)
color:      gray-400 → gray-600 on hover
background: none / border: none
display:    block, text-center
```

Appears below the submit button in LoginMode only. Switches view to `"password"`.

---

#### 3. Step 2 — Code Entry Screen

**Heading**: `"Check your inbox"` — same styling as Step 1 heading.

**Subtitle**

Same styling as Step 1 subtitle (`-mt-4`, gray-500, 14px Poppins).

Content: `"We sent a 6-digit code to [email]. Check your inbox and enter it below."`

Inline email display:

```
<strong> or <span>
fontWeight: 600 (font-semibold)
color:      gray-700 (#374151)
```

**OTP label**: `"Verification code"`

```
fontSize:     14px (text-sm)
fontWeight:   600 (font-semibold)
color:        gray-700 (#374151)
fontFamily:   Poppins (font-body)
marginBottom: 12px (mb-3)
display:      block
```

**OTP Input Row** (expanded from existing spec with full interaction behaviors)

```
Count:        6 individual inputs
Layout:       flex row, justify-center, gap=10px (gap-2.5)
Size:         w-11 (44px) × h-13 (52px)
text:         center, fontSize=18px (text-lg), fontWeight=600 (font-semibold)
fontFamily:   Poppins (font-body)
color:        gray-800 (#1f2937)
border:       1px solid gray-200 (#e5e7eb)
borderRadius: 8px (rounded-lg)
outline:      none
focus:        border-color → primary (#f29a8f), transition-colors

HTML attrs:
  type="text"
  inputMode="numeric"
  maxLength={1}
  autoComplete="one-time-code"  ← first input only
  autoComplete="off"            ← all other inputs
```

**Interaction behaviors:**

```
onChange:
  - Reject non-digit characters (guard: /^\d$/)
  - Update digit at index
  - If value entered and index < 5 → focus next input

onKeyDown:
  - Backspace on empty field (index > 0) → focus previous input

onPaste (first input only):
  - Prevent default
  - Strip non-digits, take first 6 characters
  - Fill all 6 digit slots
  - If 6 digits pasted → auto-submit form (setTimeout requestSubmit, 0)
  - If fewer than 6 → focus input at pasted.length (capped at 5)
```

**Submit button** — see existing [Primary Button (Full-Width)](#primary-button-full-width) spec.

| Mode       | Default text                | Loading text   |
| ---------- | --------------------------- | -------------- |
| CreateMode | `"Verify & Create Account"` | `"Verifying…"` |
| LoginMode  | `"Verify code"`             | `"Verifying…"` |

**"Use a different email" link**

```
display:    inline-flex, items-center
gap:        6px (gap-1.5)
fontSize:   14px (text-sm)
fontWeight: 500 (font-medium)
fontFamily: Poppins (font-body)
color:      primary (#f29a8f) → primary-hover (#e88d82) on hover
justify:    center
icon:       ArrowLeft, size=14, vertically centered
```

On click: resets view to `"otp-email"`, clears all OTP digits, clears error and message state.

---

#### 4. Error & Success Message Boxes (flow-specific)

See existing [Inline Error / Message Boxes](#inline-error--message-boxes) sub-section for colors and layout.

**Animation note — `LoginForm.tsx`:**
In `app/login/LoginForm.tsx`, error and message boxes animate in using `motion.div`:

```
initial: { opacity: 0, y: -10 }
animate: { opacity: 1, y: 0 }
duration: default (Framer Motion)
```

This entrance animation is not present in `StartPageClient.tsx`, where message boxes render as plain `<p>` elements.

---

#### 5. Back / Tertiary Button (reminder)

See existing [Back / Tertiary Button](#back--tertiary-button) spec.

- Content: `"Back"`
- Placement: above the badge/pill, `mb-6` (24px) below the button itself
