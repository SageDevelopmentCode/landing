# Sagefield School Landing Page - Styling Guide

**Project**: Education Website Landing Page
**Framework**: Next.js 16.1.6 + React 19 + Tailwind CSS v4
**Last Updated**: 2026-02-18

---

## Table of Contents
1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Spacing System](#spacing-system)
4. [Layout & Grid](#layout--grid)
5. [Components](#components)
6. [Shadows & Effects](#shadows--effects)
7. [Animations](#animations)
8. [Responsive Design](#responsive-design)
9. [Quick Reference](#quick-reference)

---

## Color Palette

### Primary Colors
| Color Name | Hex Code | Usage | Tailwind Class |
|------------|----------|-------|----------------|
| Primary Orange | `#FF6B35` | CTA buttons, accents, links | `bg-[#FF6B35]` |
| Orange Hover | `#FF8566` | Button hover states | `hover:bg-[#FF8566]` |
| Orange Active | `#E85A28` | Button active/pressed states | `active:bg-[#E85A28]` |

### Background Colors
| Color Name | Hex Code | Usage | Tailwind Class |
|------------|----------|-------|----------------|
| Warm Beige | `#FFF5ED` | Hero section, warm backgrounds | `bg-[#FFF5ED]` |
| Light Beige | `#FFFAF7` | Alternate section backgrounds | `bg-[#FFFAF7]` |
| Cream | `#FEF6F0` | Card backgrounds | `bg-[#FEF6F0]` |
| White | `#FFFFFF` | Primary content areas | `bg-white` |

### Text Colors
| Color Name | Hex Code | Usage | Tailwind Class |
|------------|----------|-------|----------------|
| Text Primary | `#1A1A1A` | Headings, important text | `text-[#1A1A1A]` |
| Text Secondary | `#4A4A4A` | Body text, paragraphs | `text-[#4A4A4A]` |
| Text Muted | `#6B6B6B` | Captions, metadata | `text-[#6B6B6B]` |
| Text Light | `#8F8F8F` | Placeholder, disabled text | `text-[#8F8F8F]` |

### Neutral Colors
| Color Name | Hex Code | Usage | Tailwind Class |
|------------|----------|-------|----------------|
| Neutral 100 | `#F5F5F5` | Light backgrounds | `bg-gray-100` |
| Neutral 200 | `#E5E5E5` | Borders, dividers | `border-gray-200` |
| Neutral 300 | `#D4D4D4` | Subtle borders | `border-gray-300` |
| Neutral 400 | `#A3A3A3` | Icons, logos | `text-gray-400` |

---

## Typography

### Font Families
```css
Primary: 'Geist Sans' (imported via next/font/google)
Monospace: 'Geist Mono' (imported via next/font/google)
```

### Type Scale
| Element | Size (rem/px) | Weight | Line Height | Tailwind Classes |
|---------|---------------|--------|-------------|------------------|
| Hero Title | 4.5rem / 72px | 800 | 1.1 | `text-7xl font-extrabold leading-tight` |
| H1 | 3.5rem / 56px | 700 | 1.1 | `text-5xl md:text-6xl font-bold leading-tight` |
| H2 | 3rem / 48px | 700 | 1.2 | `text-4xl md:text-5xl font-bold` |
| H3 | 2.25rem / 36px | 600 | 1.2 | `text-3xl md:text-4xl font-semibold` |
| H4 | 1.875rem / 30px | 600 | 1.3 | `text-2xl md:text-3xl font-semibold` |
| H5 | 1.5rem / 24px | 600 | 1.4 | `text-xl md:text-2xl font-semibold` |
| H6 | 1.25rem / 20px | 600 | 1.4 | `text-lg md:text-xl font-semibold` |
| Body Large | 1.25rem / 20px | 400 | 1.6 | `text-lg md:text-xl leading-relaxed` |
| Body | 1rem / 16px | 400 | 1.5 | `text-base leading-normal` |
| Body Small | 0.875rem / 14px | 400 | 1.5 | `text-sm` |
| Caption | 0.75rem / 12px | 400 | 1.4 | `text-xs` |

### Font Weights
| Weight | Value | Tailwind Class |
|--------|-------|----------------|
| Light | 300 | `font-light` |
| Normal | 400 | `font-normal` |
| Medium | 500 | `font-medium` |
| Semibold | 600 | `font-semibold` |
| Bold | 700 | `font-bold` |
| Extrabold | 800 | `font-extrabold` |

### Responsive Typography Examples
```html
<!-- Hero Heading -->
<h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">

<!-- Section Heading -->
<h2 class="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A1A1A]">

<!-- Body Text -->
<p class="text-base md:text-lg text-[#4A4A4A] leading-relaxed">
```

---

## Spacing System

### Base Scale (4px unit)
| Name | Size (rem/px) | Tailwind Class | Usage |
|------|---------------|----------------|-------|
| 0 | 0 | `m-0`, `p-0` | Reset |
| 1 | 0.25rem / 4px | `m-1`, `p-1` | Tiny gaps |
| 2 | 0.5rem / 8px | `m-2`, `p-2` | Small gaps |
| 3 | 0.75rem / 12px | `m-3`, `p-3` | Element spacing |
| 4 | 1rem / 16px | `m-4`, `p-4` | Default spacing |
| 5 | 1.25rem / 20px | `m-5`, `p-5` | Medium spacing |
| 6 | 1.5rem / 24px | `m-6`, `p-6` | Card padding |
| 8 | 2rem / 32px | `m-8`, `p-8` | Large padding |
| 10 | 2.5rem / 40px | `m-10`, `p-10` | Feature cards |
| 12 | 3rem / 48px | `m-12`, `p-12` | Section spacing |
| 16 | 4rem / 64px | `m-16`, `p-16` | Large sections |
| 20 | 5rem / 80px | `m-20`, `p-20` | Extra large |
| 24 | 6rem / 96px | `m-24`, `p-24` | Hero sections |
| 32 | 8rem / 128px | `m-32`, `p-32` | Major sections |

### Section Padding (Responsive)
```html
<!-- Mobile: 48px, Tablet: 80px, Desktop: 112px -->
<section class="py-12 md:py-20 lg:py-28">

<!-- Alternative: Mobile: 64px, Desktop: 128px -->
<section class="py-16 lg:py-32">
```

### Container Padding
```html
<div class="px-4 sm:px-6 lg:px-8">
```

---

## Layout & Grid

### Container Widths
| Breakpoint | Max Width | Tailwind Class |
|------------|-----------|----------------|
| Default | 1280px | `max-w-7xl` |
| Extra Large | 1536px | `max-w-[1536px]` |
| Content Narrow | 768px | `max-w-3xl` |
| Content Medium | 1024px | `max-w-5xl` |

### Standard Container
```html
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <!-- Content -->
</div>
```

### Breakpoints
| Size | Width | Device |
|------|-------|--------|
| sm | 640px | Large phones |
| md | 768px | Tablets |
| lg | 1024px | Laptops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large screens |

### Grid Patterns
```html
<!-- 3-Column Grid (responsive) -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">

<!-- 2-Column Split -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

<!-- 4-Column Footer -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
```

---

## Components

### Buttons

#### Primary Button (Orange CTA)
**Specifications:**
- Background: `#FF6B35`
- Text: White
- Padding: 16px 32px (vertical horizontal)
- Border Radius: 8px
- Font: 16px, Semibold (600)
- Shadow: Small on default, Medium on hover
- Hover: Background `#FF8566`, lift -2px
- Active: Background `#E85A28`

**Tailwind Classes:**
```html
<button class="bg-[#FF6B35] hover:bg-[#FF8566] active:bg-[#E85A28] text-white font-semibold px-8 py-4 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-250">
  Call to Action
</button>
```

#### Secondary Button (Outline)
**Specifications:**
- Background: Transparent
- Border: 2px solid `#FF6B35`
- Text: `#FF6B35`
- Padding: 14px 30px (accounting for border)
- Border Radius: 8px

**Tailwind Classes:**
```html
<button class="bg-transparent border-2 border-[#FF6B35] text-[#FF6B35] hover:bg-[#FFF5ED] font-semibold px-8 py-3.5 rounded-lg transition-all duration-250">
  Learn More
</button>
```

### Cards

#### Feature Card (Icon + Text)
**Specifications:**
- Background: White
- Padding: 40px
- Border Radius: 16px
- Shadow: `0 2px 8px rgba(0,0,0,0.08)`
- Hover: Shadow `0 8px 24px rgba(0,0,0,0.12)`, lift -4px
- Icon Container: 64px circle, background `#FFF5ED`
- Icon: 32px, color `#FF6B35`
- Title: H5 (24px), Bold
- Description: Base (16px), `#4A4A4A`

**Tailwind Classes:**
```html
<div class="bg-white p-10 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300">
  <div class="w-16 h-16 bg-[#FFF5ED] rounded-full flex items-center justify-center mb-6">
    <svg class="w-8 h-8 text-[#FF6B35]"><!-- Icon --></svg>
  </div>
  <h3 class="text-xl md:text-2xl font-semibold text-[#1A1A1A] mb-4">Title</h3>
  <p class="text-base text-[#4A4A4A] leading-relaxed">Description text</p>
</div>
```

#### Blog/News Card
**Specifications:**
- Background: White
- Border Radius: 12px
- Overflow: Hidden
- Image: Aspect ratio 16:9, object-fit cover
- Content Padding: 24px
- Shadow: Small, expands on hover
- Title: H6 (20px), Semibold
- Meta: Small (14px), `#6B6B6B`

**Tailwind Classes:**
```html
<div class="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
  <div class="aspect-video">
    <img src="..." class="w-full h-full object-cover" alt="..." />
  </div>
  <div class="p-6">
    <p class="text-sm text-[#6B6B6B] mb-2">Date • Category</p>
    <h3 class="text-lg md:text-xl font-semibold text-[#1A1A1A] mb-3">Article Title</h3>
    <p class="text-base text-[#4A4A4A]">Brief description...</p>
  </div>
</div>
```

#### Statistics Card
**Specifications:**
- Display: Flex column, center aligned
- Padding: 32px
- Number: 72px, Extrabold (800), `#FF6B35`
- Label: 18px, `#4A4A4A`
- Suffix: (+, Years, etc.)

**Tailwind Classes:**
```html
<div class="flex flex-col items-center justify-center p-8">
  <div class="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#FF6B35] mb-2">
    38+
  </div>
  <p class="text-base md:text-lg text-[#4A4A4A] text-center">Years of Excellence</p>
</div>
```

### Icon Boxes
**Specifications:**
- Size: 64px × 64px (large), 48px × 48px (medium), 32px × 32px (small)
- Background: `#FFF5ED` or gradient
- Border Radius: 12px or full circle
- Padding: 16px
- Icon Color: `#FF6B35`

**Tailwind Classes:**
```html
<!-- Square -->
<div class="w-16 h-16 bg-[#FFF5ED] rounded-xl flex items-center justify-center">
  <svg class="w-8 h-8 text-[#FF6B35]">...</svg>
</div>

<!-- Circle -->
<div class="w-16 h-16 bg-[#FFF5ED] rounded-full flex items-center justify-center">
  <svg class="w-8 h-8 text-[#FF6B35]">...</svg>
</div>
```

---

## Shadows & Effects

### Shadow Scale
| Name | Value | Tailwind Class | Usage |
|------|-------|----------------|-------|
| None | none | `shadow-none` | Flat elements |
| XS | `0 1px 2px rgba(0,0,0,0.05)` | `shadow-xs` | Subtle depth |
| SM | `0 1px 3px rgba(0,0,0,0.1)` | `shadow-sm` | Buttons, small cards |
| MD | `0 4px 6px rgba(0,0,0,0.1)` | `shadow-md` | Default cards |
| LG | `0 10px 15px rgba(0,0,0,0.1)` | `shadow-lg` | Elevated cards |
| XL | `0 20px 25px rgba(0,0,0,0.1)` | `shadow-xl` | Modals, popovers |
| 2XL | `0 25px 50px rgba(0,0,0,0.25)` | `shadow-2xl` | High elevation |

### Custom Card Shadows
```html
<!-- Default Card -->
<div class="shadow-[0_2px_8px_rgba(0,0,0,0.08)]">

<!-- Hover Card -->
<div class="hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
```

### Border Radius
| Size | Value (px/rem) | Tailwind Class | Usage |
|------|----------------|----------------|-------|
| None | 0 | `rounded-none` | Square elements |
| SM | 6px / 0.375rem | `rounded-sm` | Small elements |
| MD | 8px / 0.5rem | `rounded-md` | Buttons |
| LG | 12px / 0.75rem | `rounded-lg` | Cards, images |
| XL | 16px / 1rem | `rounded-xl` | Feature cards |
| 2XL | 24px / 1.5rem | `rounded-2xl` | Hero cards |
| 3XL | 32px / 2rem | `rounded-3xl` | Large images |
| Full | 9999px | `rounded-full` | Circles, pills |

---

## Animations

### Transition Durations
```html
Fast: duration-150 (150ms)
Normal: duration-250 (250ms)
Slow: duration-300 (300ms)
Slower: duration-500 (500ms)
```

### Timing Functions
```html
Ease In: ease-in
Ease Out: ease-out
Ease In-Out: ease-in-out
```

### Common Transitions
```html
<!-- All Properties -->
<div class="transition-all duration-250">

<!-- Specific Properties -->
<div class="transition-colors duration-150">
<div class="transition-shadow duration-300">
<div class="transition-transform duration-250">
```

### Hover Effects

#### Lift Effect
```html
<div class="hover:-translate-y-1 transition-transform duration-250">
```

#### Scale Effect
```html
<div class="hover:scale-105 transition-transform duration-300">
```

#### Shadow Expansion
```html
<div class="shadow-sm hover:shadow-lg transition-shadow duration-300">
```

#### Color Shift
```html
<button class="bg-[#FF6B35] hover:bg-[#FF8566] transition-colors duration-250">
```

---

## Responsive Design

### Mobile-First Breakpoint Strategy
```html
<!-- Base: Mobile 320px+ -->
<!-- sm: 640px+ -->
<!-- md: 768px+ -->
<!-- lg: 1024px+ -->
<!-- xl: 1280px+ -->
<!-- 2xl: 1536px+ -->
```

### Responsive Typography
```html
<!-- Hero -->
<h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl">

<!-- Section Heading -->
<h2 class="text-3xl sm:text-4xl md:text-5xl">

<!-- Body -->
<p class="text-base md:text-lg">
```

### Responsive Spacing
```html
<!-- Section Padding -->
<section class="py-12 md:py-16 lg:py-24 xl:py-32">

<!-- Container Padding -->
<div class="px-4 sm:px-6 lg:px-8">

<!-- Card Padding -->
<div class="p-6 md:p-8 lg:p-10">

<!-- Gap -->
<div class="gap-6 md:gap-8 lg:gap-10">
```

### Responsive Grids
```html
<!-- 1 → 2 → 3 Columns -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

<!-- 1 → 2 Columns -->
<div class="grid grid-cols-1 lg:grid-cols-2">

<!-- 1 → 2 → 4 Columns -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
```

### Show/Hide at Breakpoints
```html
<!-- Hidden on mobile, visible on desktop -->
<div class="hidden lg:block">

<!-- Visible on mobile, hidden on desktop -->
<div class="block lg:hidden">
```

---

## Quick Reference

### Section Templates

#### Hero Section
```html
<section class="bg-[#FFF5ED] py-16 lg:py-24 xl:py-32">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#1A1A1A] leading-tight mb-6">
          Hero Title
        </h1>
        <p class="text-lg md:text-xl text-[#4A4A4A] leading-relaxed mb-8">
          Description text
        </p>
        <button class="bg-[#FF6B35] hover:bg-[#FF8566] text-white font-semibold px-8 py-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-250">
          Get Started
        </button>
      </div>
      <div>
        <!-- Image -->
      </div>
    </div>
  </div>
</section>
```

#### Partner Logo Strip
```html
<section class="bg-white py-12">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex flex-wrap justify-center items-center gap-8 md:gap-12">
      <img src="..." alt="..." class="h-12 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
      <!-- More logos -->
    </div>
  </div>
</section>
```

#### Feature Grid (3 Columns)
```html
<section class="bg-white py-16 lg:py-24">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
        Section Heading
      </h2>
      <p class="text-lg md:text-xl text-[#4A4A4A] max-w-3xl mx-auto">
        Description
      </p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <!-- Feature Cards -->
    </div>
  </div>
</section>
```

#### Two-Column Content
```html
<section class="bg-[#FFFAF7] py-16 lg:py-24">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <img src="..." alt="..." class="w-full rounded-xl" />
      </div>
      <div>
        <h2 class="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-6">
          Heading
        </h2>
        <p class="text-base md:text-lg text-[#4A4A4A] leading-relaxed mb-6">
          Content
        </p>
        <!-- More content -->
      </div>
    </div>
  </div>
</section>
```

#### Statistics Display
```html
<section class="bg-white py-16 lg:py-24">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
      <!-- Stat Cards -->
    </div>
  </div>
</section>
```

#### Footer
```html
<footer class="bg-[#1A1A1A] text-white py-16">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
      <!-- Footer Columns -->
    </div>
    <div class="border-t border-gray-700 pt-8">
      <p class="text-sm text-gray-400 text-center">
        © 2026 Sagefield School. All rights reserved.
      </p>
    </div>
  </div>
</footer>
```

---

## Color Combinations Guide

### Primary Combinations
| Background | Text | Accent | Use Case |
|------------|------|--------|----------|
| `#FFF5ED` | `#1A1A1A` | `#FF6B35` | Hero sections |
| `#FFFFFF` | `#4A4A4A` | `#FF6B35` | Content sections |
| `#FFFAF7` | `#1A1A1A` | `#FF6B35` | Alternate sections |
| `#FF6B35` | `#FFFFFF` | `#FFFFFF` | CTA buttons |
| `#1A1A1A` | `#FFFFFF` | `#FF6B35` | Footer |

---

## Accessibility Checklist

- ✅ Color contrast meets WCAG AA (4.5:1 for text, 3:1 for large text)
- ✅ Focus visible states on all interactive elements
- ✅ Alt text for all images
- ✅ ARIA labels for icon-only buttons
- ✅ Proper heading hierarchy (H1 → H6)
- ✅ Touch targets minimum 44×44px
- ✅ Keyboard navigation support

### Focus States
```html
<button class="focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:ring-offset-2">
```

---

## Performance Optimization

### Images
- Use Next.js `<Image>` component
- Specify width and height
- Use WebP format with fallbacks
- Implement lazy loading

```jsx
import Image from 'next/image'

<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  className="rounded-xl"
  loading="lazy"
/>
```

### Fonts
Already optimized with `next/font/google` ✅

---

## File Structure Recommendation

```
app/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Container.tsx
│   │   └── Section.tsx
│   ├── Hero.tsx
│   ├── Partners.tsx
│   ├── Features.tsx
│   ├── Programs.tsx
│   ├── Statistics.tsx
│   ├── News.tsx
│   └── Footer.tsx
├── globals.css
├── layout.tsx
└── page.tsx
```

---

## Notes

- Tailwind CSS v4 uses `@theme inline` in CSS instead of `tailwind.config.js`
- Custom colors defined with bracket notation: `bg-[#FF6B35]`
- Geist fonts already imported in layout.tsx
- All measurements follow 4px spacing scale
- Mobile-first approach for all responsive design

---

**End of Styling Guide**
