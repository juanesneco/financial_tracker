# Financial Tracker - System Context

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: PostgreSQL 15.8 (Supabase self-hosted on Hetzner VPS)
- **Auth**: Supabase Auth with OTP via Resend
- **Charts**: Recharts
- **Fonts**: Inter (body) + DM Serif Display (headings)

## Database Architecture
- **Schema**: `financial_tracker` (dedicated PostgreSQL schema)
- **Views**: Public views with `ft_` prefix bridge to PostgREST
  - `ft_profiles`, `ft_categories`, `ft_subcategories`, `ft_expenses`
  - `ft_deposits`, `ft_cards`, `ft_subscriptions`, `ft_budgets`
  - `ft_income_sources`, `ft_income_records`
- **RLS**: Row Level Security on all tables (user_id isolation)
- **Views use `security_invoker = true`** (PostgreSQL 15+ feature) to enforce RLS through views
- **No `db: { schema }`** in client — query prefixed views instead
- **No `<Database>` generic** on Supabase client — SDK v2.95 incompatible with manual types lacking `Relationships` arrays

## Tables (10 in financial_tracker schema)
1. `profiles` — id, display_name, currency, role, avatar_url, is_super_admin
2. `categories` — id, name, icon, color, display_order, emoji, budget_default, original_glide_id
3. `subcategories` — id, category_id, name, display_order, emoji, original_glide_id
4. `expenses` — id, user_id, amount, category_id, subcategory_id, date, title, note, payment_method, card_id, comments, currency, receipt_url, original_glide_id
5. `cards` — id, user_id, bank, last_four, card_type, label, original_glide_id
6. `deposits` — id, user_id, amount, date, title, note, original_glide_id
7. `subscriptions` — id, user_id, title, amount, currency, renewal_day, start_date, end_date, is_active, original_glide_id
8. `budgets` — id, user_id, category_id, subcategory_id, amount, original_glide_id
9. `income_sources` — id, user_id, source_name, initials, legal_name, legal_address, legal_city_state_zip, legal_id, original_glide_id
10. `income_records` — id, user_id, income_source_id, amount, currency, date, description, original_glide_id

## Supabase
- URL: `https://api.juanesngtz.com`
- Direct DB: `postgresql://postgres:<pw>@178.156.170.217:5433/postgres`
- psql path: `/opt/homebrew/opt/libpq/bin/psql`
- Docker compose: `/opt/supabase/supabase/docker/docker-compose.yml`
- PostgREST env: `/opt/supabase/supabase/docker/.env` (PGRST_DB_SCHEMAS=public,storage,graphql_public)
- OTP auth via Resend (shared `otp_codes` table in public schema)
- Storage: `receipts` bucket (private, per-user folder RLS)

## Design System ("Clean Ledger")
- Primary: Sage green `#4A7C6F` (dark: `#6AAE9A`)
- Accent: Warm amber `#D4915E` (dark: `#E8A870`)
- Background: `#FAFAF8` (dark: `#1A1A1A`)
- Border radius: `0.625rem`

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

## Users (5 family/team members)
| Glide ID | Name | Email | UUID | Role |
|---|---|---|---|---|
| oln3M90-R.CB-GcdkYSK1w | Juanes Necoechea | juanesngtz@gmail.com | b5fd940d-ccd0-4a32-acd0-4471baa6fc76 | super_admin |
| H8EDxMJfTSGXDT-3Krqacg | Ivonne (JENG) | ivonnegutz@hotmail.com | 212f34e2-6f01-44e8-8252-daa378ec7ad9 | All |
| AbN6.FXMRWSorXy9KxlPTQ | Majo Mazoy | mjmazoy@gmail.com | d57b76dd-12ca-46ab-956f-44541d5107ac | All |
| iDL9UFS6R0u.cR3C.szCSw | Santiago Mazoy | santiagomazoyr@gmail.com | 2f83adbe-bbed-40d0-8803-f025d88adf98 | All |
| hwbFC4lCTRm0pNG-FHA4Dg | Ivonne Gutiérrez | ivonnegutierrezgomez@gmail.com | db317204-770b-4e93-81f8-b30f2c936576 | All |

## Key Patterns
- Cookie-based server client, browser client with `persistSession: true`
- Triggers on `auth.users` must have unique names per project
- shadcn/ui components copied between projects (CSS variables)
- Untyped Supabase client (no `<Database>` generic) — views not compatible with SDK type system
- Deposits = money Juanes received from other users (inter-user repayments)

## Key Lessons Learned
- PostgREST `PGRST_DB_SCHEMAS` must match existing schemas or it crashes in a loop
- Views owned by `postgres` bypass RLS — must use `security_invoker = true` on PG 15+
- `listUsers()` is paginated (50/page default) — must paginate to find users beyond page 1
- ES module imports are hoisted — `dotenv.config()` must be in the imported module, not the importer
- Glide CSV exports have multi-line SVG data in fields — `relax_quotes: true` handles this correctly
- Pre-existing auth users don't trigger `on_auth_user_created` — profiles must be manually inserted
