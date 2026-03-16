# Track 03: App Shell

| Field | Value |
|-------|-------|
| **Owner** | Juanes |
| **Priority** | P1 — Must Have |
| **Status** | Done (7/7) |
| **Phases** | 1, 2 |
| **Dependencies** | 02_authentication |

## Summary

Application chrome shared across all pages: root layout with fonts and providers, responsive navigation (sidebar on desktop, bottom nav on mobile), header with back button and theme toggle, and the responsive add behavior that shows a slide-over on desktop or navigates to a full page on mobile.

## Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 03-SD-001 | Root layout with fonts (Inter + DM Serif Display), ThemeProvider, Toaster | 5 | Done |
| 03-SD-002 | App layout with sidebar (desktop) + mobile bottom nav | 8 | Done |
| 03-SD-003 | Header component with back button & theme toggle | 3 | Done |
| 03-SD-004 | Sidebar navigation (desktop lg:1024px+) | 5 | Done |
| 03-SD-005 | Mobile bottom nav with floating "Add" button | 5 | Done |
| 03-SD-006 | Responsive add behavior (`useResponsiveAdd` hook + `AddSlideOver`) | 5 | Done |
| 03-SD-007 | Dark mode support via next-themes | 3 | Done |

**Total Points:** 34

## Key Files

| Purpose | Path |
|---------|------|
| Root layout (fonts, providers) | `app/layout.tsx` |
| App layout (sidebar + nav) | `app/(app)/layout.tsx` |
| Page header | `components/layout/Header.tsx` |
| Desktop sidebar | `components/layout/Sidebar.tsx` |
| Mobile bottom nav | `components/layout/MobileNav.tsx` |
| Desktop slide-over for add | `components/shared/AddSlideOver.tsx` |
| Responsive add hook | `hooks/useResponsiveAdd.ts` |
| Global styles & theme tokens | `app/globals.css` |

## Notes

- Sidebar visible at `lg:` (1024px+), 16rem width
- Mobile bottom nav has 5 items: Home, Balance, Add (floating), Statistics, More
- Floating "Add" button uses `-mt-7` for elevation with accent amber color
- Sidebar conditionally shows Deposits (juanes/ivonne) and Design Kit (admins)
- `useResponsiveAdd` detects viewport and either opens `AddSlideOver` (Sheet) or navigates to `/add`
- Dark mode via `next-themes` ThemeProvider with system detection
