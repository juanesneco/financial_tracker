# Completed Tasks

## Initial Build (Pre-expansion)
- [x] Project scaffolding with Next.js 16
- [x] Supabase auth with OTP flow (send-otp, verify-otp)
- [x] Database schema v1 (profiles, categories, subcategories, expenses)
- [x] 12 categories + ~50 subcategories seeded
- [x] Storage bucket for receipts with RLS
- [x] Design system ("Clean Ledger" — sage green + warm amber)
- [x] Dashboard page with monthly total and category breakdown
- [x] Add expense form with receipt upload
- [x] Sidebar + MobileNav components
- [x] Header component with theme toggle
- [x] Design Kit showcase page
- [x] Middleware for protected routes
- [x] Format utilities (currency, date)

## Phase 0: Ralph Setup
- [x] Created `.ralph/` directory with all project management files
- [x] `@context.md`, `@active.md`, `@completed.md`, `@future.md`
- [x] `PROMPT.md`, `status.json`, `progress.json`, `ralph.sh`

## Phase 1: Database Schema Expansion
- [x] Created `supabase/migrations/00003_expand_schema.sql`
  - Expanded profiles (role, avatar_url, is_super_admin)
  - Expanded categories (emoji, budget_default, original_glide_id)
  - Expanded subcategories (emoji, original_glide_id)
  - Expanded expenses (title, payment_method, card_id, comments, currency, original_glide_id)
  - Created tables: cards, deposits, subscriptions, budgets, income_sources, income_records
  - RLS policies for all new tables (24 policies total)
  - Indexes on all new tables
  - Updated_at triggers for cards, subscriptions, budgets, income_sources
  - Public views: ft_cards, ft_deposits, ft_subscriptions, ft_budgets, ft_income_sources, ft_income_records
  - GRANT permissions on all views and tables
- [x] Created `supabase/migrations/00004_replace_categories.sql`
  - Replaced 12 seeded categories with 13 Glide main categories (with emojis and original_glide_id)
- [x] Ran both migrations against production database
- [x] Verified all tables/views/policies created
- [x] Granted USAGE on `financial_tracker` schema to authenticator, anon, authenticated, service_role
- [x] Fixed all views with `security_invoker = true` to enforce RLS through views

## Phase 2: Data Migration
- [x] Created `scripts/migration/helpers.ts` (Supabase admin client, CSV parser, date parser, batch insert, mapping store)
- [x] Created `scripts/migration/01_create_users.ts` — 5 users with paginated findUserByEmail
- [x] Created `scripts/migration/02_migrate_cards.ts` — 18 cards
- [x] Created `scripts/migration/03_migrate_categories.ts` — 102 subcategories
- [x] Created `scripts/migration/04_migrate_expenses.ts` — 4,685 expenses (orphans default to Juanes)
- [x] Created `scripts/migration/05_migrate_deposits.ts` — 111 deposits
- [x] Created `scripts/migration/06_migrate_subscriptions.ts` — 12 subscriptions
- [x] Created `scripts/migration/07_migrate_budgets.ts` — 22 budgets
- [x] Created `scripts/migration/08_migrate_income_sources.ts` — 29 income sources
- [x] Created `scripts/migration/run_migration.ts` — Master runner with validation
- [x] Ran full migration successfully
- [x] Validated row counts
- [x] Created missing profiles for Juanes and Majo (auth trigger didn't fire for pre-existing users)
- [x] Reassigned 111 deposits from Ivonne (JENG) to Juanes (deposits = money Juanes received)

### Migration Results
| Entity | Count | Notes |
|---|---|---|
| Users | 5 | All found in auth (pre-existing) |
| Cards | 18 | All migrated |
| Subcategories | 102 | 1 skipped (no parent), 1 duplicate name |
| Expenses | 4,685 | 2,490 skipped (no amount/date) |
| Deposits | 111 | 22 skipped (no amount/date) |
| Subscriptions | 12 | All migrated |
| Budgets | 22 | All migrated |
| Income Sources | 29 | All migrated |

### Expense Distribution
| User | Expenses | Total (MXN) |
|---|---|---|
| Ivonne Gutiérrez | 2,485 | $4,707,214.02 |
| Juanes Necoechea | 1,499 | $2,250,028.94 |
| Majo Mazoy | 364 | $570,233.43 |
| Ivonne (JENG) | 302 | $701,840.96 |
| Santiago Mazoy | 35 | $63,568.00 |

## Phase 3: Type System & Client Updates
- [x] Rewrote `lib/types/database.ts` with all 11 tables (Row/Insert/Update types)
- [x] Created `lib/types/index.ts` with app-level type aliases and interfaces
- [x] Created `lib/supabase/queries.ts` — centralized query functions for all entities
- [x] Updated `lib/format-utils.ts` — added formatCurrencyUSD, formatTransactionAmount, formatMonthYear, getMonthDateRange
- [x] Removed `<Database>` generic from Supabase client (SDK v2.95 incompatibility with manual types)

## Phase 4: Core UI
- [x] Rewrote dashboard (`app/(app)/page.tsx`) — month/year picker, dual summary cards (expenses + deposits), category breakdown, recent expenses with payment method indicators
- [x] Expanded add expense form (`app/(app)/add/page.tsx`) — title, payment method selector, card selector, comments field
- [x] Created expenses list (`app/(app)/expenses/page.tsx`) — search, category/payment filters, date range, pagination (50/page), grouped by date
- [x] Created expense detail (`app/(app)/expenses/[id]/page.tsx`) — view/edit toggle, all fields editable, delete with confirmation

## Phase 5: Extended UI
- [x] Created cards page (`app/(app)/cards/page.tsx`) — list/add/delete
- [x] Created subscriptions page (`app/(app)/subscriptions/page.tsx`) — active/inactive toggle, monthly total, add/delete
- [x] Created budgets page (`app/(app)/budgets/page.tsx`) — budget vs actual with progress bars, over-budget warnings
- [x] Created income page (`app/(app)/income/page.tsx`) — income sources management
- [x] Created deposits page (`app/(app)/deposits/page.tsx`) — deposits list with running total, add/delete
- [x] Created settings page (`app/(app)/settings/page.tsx`) — profile editing, role info, logout
- [x] Updated Sidebar navigation (Home, Expenses, Cards, Subscriptions, Budgets, Income, Deposits, Stats, Settings)
- [x] Updated MobileNav (changed Settings to "More")
- [x] Updated middleware protected paths (/cards, /subscriptions, /budgets, /income, /deposits)

## Phase 6: Advanced Features
- [x] Installed recharts dependency
- [x] Created statistics page (`app/(app)/statistics/page.tsx`) — pie chart, 6-month bar chart, top categories with percentage bars
- [x] Created `components/shared/MonthYearPicker.tsx` — reusable month/year navigation
- [x] Created `components/shared/ExpenseRow.tsx` — reusable expense list item
- [x] Created `components/shared/CategoryBadge.tsx` — category with emoji display (sm/md)
- [x] Created `components/shared/PaymentMethodIcon.tsx` — card/cash icon with optional label

## Infrastructure Fixes
- [x] Fixed PostgREST crash — removed stale `cabocare` schema from `PGRST_DB_SCHEMAS` in `/opt/supabase/supabase/docker/.env` on VPS
- [x] Fixed RLS bypass — all `ft_*` views recreated with `security_invoker = true` (PostgreSQL 15+ feature)
- [x] Fixed CSV parsing — `relax_quotes: true` correctly handles multi-line SVG fields (7,308 records, not 29K lines)
- [x] Fixed user creation — paginated `findUserByEmail` to handle 50+ users in auth
- [x] Fixed dotenv loading — moved `config()` into `helpers.ts` (ES module import hoisting)
- [x] Fixed recharts Tooltip formatter type (`number | undefined`)
- [x] Installed dependencies: csv-parse, dotenv, tsx (dev), recharts

## Build Verification
- [x] TypeScript compilation passes (`npx tsc --noEmit`)
- [x] Next.js build succeeds (`npm run build`) — all 17 routes compile
- [x] RLS verified — Juanes sees only his 1,499 expenses, 5 cards, 1 profile
