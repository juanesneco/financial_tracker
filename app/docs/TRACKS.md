# Financial Tracker — Track Index

**63 / 63 sub-deliverables passing (100%)** · Last updated 2026-03-15

## Overview

| # | Track | Status | Progress | What's Left |
|---|-------|--------|----------|-------------|
| 01 | Infrastructure | **Done** | 5/5 | — |
| 02 | Authentication | **Done** | 5/5 | — |
| 03 | App Shell | **Done** | 7/7 | — |
| 04 | Expense Management | **Done** | 8/8 | — |
| 05 | Income Management | **Done** | 4/4 | — |
| 06 | Cards & Subscriptions | **Done** | 6/6 | — |
| 07 | Budgets | **Done** | 4/4 | — |
| 08 | Balance Sheet | **Done** | 5/5 | — |
| 09 | Statistics & Analytics | **Done** | 4/4 | — |
| 10 | Deposits | **Done** | 3/3 | — |
| 11 | Settings & Profile | **Done** | 5/5 | — |

---

## Track Details

<details>
<summary>Track 01: Infrastructure (5/5)</summary>

| ID | Title | Status |
|----|-------|--------|
| 01-SD-001 | Supabase schema setup (`financial_tracker` schema, `ft_*` views) | ✅ |
| 01-SD-002 | Environment variables & Supabase clients (browser + server) | ✅ |
| 01-SD-003 | PostgREST view configuration with `security_invoker = true` | ✅ |
| 01-SD-004 | PWA manifest & favicon | ✅ |
| 01-SD-005 | Utility helpers (`format-utils.ts`, `utils.ts`) | ✅ |

</details>

<details>
<summary>Track 02: Authentication (5/5)</summary>

| ID | Title | Status |
|----|-------|--------|
| 02-SD-001 | OTP send endpoint (generate code, store in DB, send via Resend) | ✅ |
| 02-SD-002 | OTP verify endpoint (validate code, create user, return token) | ✅ |
| 02-SD-003 | Login page (two-step email → code flow) | ✅ |
| 02-SD-004 | Middleware route protection (redirect unauthenticated users) | ✅ |
| 02-SD-005 | OTP email branding config | ✅ |

</details>

<details>
<summary>Track 03: App Shell (7/7)</summary>

| ID | Title | Status |
|----|-------|--------|
| 03-SD-001 | Root layout with fonts (Inter + DM Serif Display), ThemeProvider, Toaster | ✅ |
| 03-SD-002 | App layout with sidebar (desktop) + mobile bottom nav | ✅ |
| 03-SD-003 | Header component with back button & theme toggle | ✅ |
| 03-SD-004 | Sidebar navigation (desktop lg:1024px+) | ✅ |
| 03-SD-005 | Mobile bottom nav with floating "Add" button | ✅ |
| 03-SD-006 | Responsive add behavior (`useResponsiveAdd` hook + `AddSlideOver`) | ✅ |
| 03-SD-007 | Dark mode support via next-themes | ✅ |

</details>

<details>
<summary>Track 04: Expense Management (8/8)</summary>

| ID | Title | Status |
|----|-------|--------|
| 04-SD-001 | Add expense form (amount, title, category, subcategory, payment method, card, date, note, comments, receipt) | ✅ |
| 04-SD-002 | Add expense page (mobile) with form integration | ✅ |
| 04-SD-003 | Expenses list with filters (search, category, payment method, date range) | ✅ |
| 04-SD-004 | Expenses grouped by date with pagination (50/page) | ✅ |
| 04-SD-005 | Expense detail page with view/edit modes | ✅ |
| 04-SD-006 | Expense delete functionality | ✅ |
| 04-SD-007 | Receipt upload to Supabase storage | ✅ |
| 04-SD-008 | Category & subcategory system with emojis | ✅ |

</details>

<details>
<summary>Track 05: Income Management (4/4)</summary>

| ID | Title | Status |
|----|-------|--------|
| 05-SD-001 | Income sources CRUD (source name, initials, legal name/address) | ✅ |
| 05-SD-002 | Income records form (amount, source, date, description) | ✅ |
| 05-SD-003 | Add income page | ✅ |
| 05-SD-004 | Income list page with source management | ✅ |

</details>

<details>
<summary>Track 06: Cards & Subscriptions (6/6)</summary>

| ID | Title | Status |
|----|-------|--------|
| 06-SD-001 | Cards CRUD (bank, last 4, credit/debit type) | ✅ |
| 06-SD-002 | Subscriptions CRUD (title, amount, renewal day, card assignment) | ✅ |
| 06-SD-003 | Subscriptions grouped by card in accordion | ✅ |
| 06-SD-004 | Active/inactive toggle for subscriptions | ✅ |
| 06-SD-005 | Card deletion protection (can't delete with active subscriptions) | ✅ |
| 06-SD-006 | Active monthly total calculation | ✅ |

</details>

<details>
<summary>Track 07: Budgets (4/4)</summary>

| ID | Title | Status |
|----|-------|--------|
| 07-SD-001 | Budget CRUD (category selection, amount) | ✅ |
| 07-SD-002 | Progress bar with spending vs budget | ✅ |
| 07-SD-003 | Over-budget visual alerts | ✅ |
| 07-SD-004 | Current month scope | ✅ |

</details>

<details>
<summary>Track 08: Balance Sheet (5/5)</summary>

| ID | Title | Status |
|----|-------|--------|
| 08-SD-001 | Combined income + expense transaction view | ✅ |
| 08-SD-002 | Summary cards (total income, total expenses, net balance) | ✅ |
| 08-SD-003 | Filters (type, category, payment method, date range, search) | ✅ |
| 08-SD-004 | Dual layout — table (desktop) / cards (mobile) | ✅ |
| 08-SD-005 | Pagination (50/page) | ✅ |

</details>

<details>
<summary>Track 09: Statistics & Analytics (4/4)</summary>

| ID | Title | Status |
|----|-------|--------|
| 09-SD-001 | Category breakdown pie/donut chart | ✅ |
| 09-SD-002 | 6-month trend bar chart | ✅ |
| 09-SD-003 | Top categories with progress bars | ✅ |
| 09-SD-004 | Month selector navigation | ✅ |

</details>

<details>
<summary>Track 10: Deposits (3/3)</summary>

| ID | Title | Status |
|----|-------|--------|
| 10-SD-001 | Deposit CRUD (amount, title, date, note) | ✅ |
| 10-SD-002 | Total deposits display | ✅ |
| 10-SD-003 | Access restriction (juanes/ivonne only) | ✅ |

</details>

<details>
<summary>Track 11: Settings & Profile (5/5)</summary>

| ID | Title | Status |
|----|-------|--------|
| 11-SD-001 | Display name editing | ✅ |
| 11-SD-002 | Currency preference (MXN/USD) | ✅ |
| 11-SD-003 | Account info display (role, member since) | ✅ |
| 11-SD-004 | Admin badge for super admins | ✅ |
| 11-SD-005 | Logout functionality | ✅ |

</details>
