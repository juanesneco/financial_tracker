# Financial Tracker — UI Design System

Design tokens and visual conventions used across the app. Mobile-first with Tailwind CSS 4.

---

## 1. Color Palette

### Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#0d4ea6` | Buttons, active nav, links |
| Primary Foreground | `#FFFFFF` | Text on primary |
| Secondary | `#E8EDF3` | Secondary backgrounds |
| Accent | `#D4915E` | Warm amber highlights, floating action button |
| Accent Foreground | `#FFFFFF` | Text on accent |
| Background | `oklch(0.97 0.005 80)` | Page background (off-white) |
| Foreground | `#1C1C1C` | Primary text |
| Card | `#FFFFFF` | Card surfaces |
| Muted | `#F0F0EC` | Subdued backgrounds |
| Muted Foreground | `#6B6B6B` | Secondary text |
| Border | `#D4D4CF` | Dividers, outlines |
| Destructive | `#DC3545` | Delete actions, alerts |

### Dark Mode

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#4d8fd6` | Lightened blue for dark backgrounds |
| Background | `#1A1A1A` | Page background |
| Card | `#262626` | Card surfaces |
| Accent | `#E8A870` | Lightened amber |

### Chart Colors (13-color array)

```
#0d4ea6, #D4915E, #3d7bc9, #E8B88A, #0a3d82,
#c27a44, #6a9fd8, #f0d4b8, #083066, #a8622e,
#97bce4, #f5e2ce, #05214a
```

---

## 2. Typography

| Role | Font | Variable |
|------|------|----------|
| Sans-serif (body) | Inter | `--font-inter` |
| Serif (headings) | DM Serif Display | `--font-dm-serif` |
| Monospace | ui-monospace, SFMono-Regular | system stack |

### Fluid Sizing

Uses `clamp()` for responsive type scaling across breakpoints.

---

## 3. Border Radius

| Token | Value |
|-------|-------|
| Base (`--radius`) | `1.25rem` (20px) |
| `sm` | base − 4px |
| `md` | base − 2px |
| `lg` | base |
| `xl` | base + 4px |
| `2xl` | base + 8px |
| `3xl` | base + 12px |
| `4xl` | base + 16px |

---

## 4. Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| `md` | 768px | Mobile → tablet transition |
| `lg` | 1024px | Tablet → desktop (sidebar appears) |

Mobile-first: base styles target phones, `md:` and `lg:` progressively enhance.

---

## 5. Custom CSS Classes

| Class | Purpose |
|-------|---------|
| `.card-warm` | Card with backdrop blur and warm shadow |
| `.glass-nav` | Navigation bar with backdrop blur effect |
| `.btn-pill` | Pill-shaped button variant |
| `.fade-in` | Opacity 0→1 animation (0.6s ease-out) |
| `.fade-in-delay-1` | Staggered fade with 0.1s delay |
| `.fade-in-delay-2` | Staggered fade with 0.2s delay |
| `.fade-in-delay-3` | Staggered fade with 0.3s delay |
| `.safe-area-top` | Padding for notched devices (top) |
| `.safe-area-bottom` | Padding for notched devices (bottom) |
| `.section-label` | Uppercase, 0.8rem, 0.25em letter-spacing |

---

## 6. shadcn/ui Components in Use

| Component | File | Usage |
|-----------|------|-------|
| Card | `components/ui/card.tsx` | Content containers |
| Button | `components/ui/button.tsx` | Actions (default, ghost, outline, destructive) |
| Input | `components/ui/input.tsx` | Text inputs |
| Textarea | `components/ui/textarea.tsx` | Multi-line inputs |
| Label | `components/ui/label.tsx` | Form labels |
| Select | `components/ui/select.tsx` | Dropdowns (Radix-based) |
| Badge | `components/ui/badge.tsx` | Status indicators |
| Dialog | `components/ui/dialog.tsx` | Modals for confirmations/edits |
| Accordion | `components/ui/accordion.tsx` | Collapsible sections (subscriptions) |
| Sheet | `components/ui/sheet.tsx` | Side drawer (AddSlideOver) |
| Table | `components/ui/table.tsx` | Data tables (balance sheet) |

---

## 7. Animation & Interaction Patterns

- **Page load:** `.fade-in.visible` — 0.6s ease-out opacity transition
- **Button hover:** `translateY(-2px)` with shadow increase
- **Card hover:** Slight background shift + elevation
- **Active nav item:** `scale-110` on mobile bottom nav
- **Transitions:** 0.2s ease default for color/transform changes

---

## 8. Layout Conventions

- **Max-width containers:** `max-w-lg lg:max-w-3xl` or `max-w-2xl lg:max-w-5xl`
- **Page padding:** `p-4 md:p-6`
- **Mobile nav:** Bottom bar with floating "Add" button (`-mt-7` elevation)
- **Desktop nav:** Left sidebar (16rem width, visible at `lg:`)
- **Safe areas:** CSS `env(safe-area-inset-*)` for PWA on notched devices
