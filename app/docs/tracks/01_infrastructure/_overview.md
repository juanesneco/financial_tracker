# Track 01: Infrastructure

| Field | Value |
|-------|-------|
| **Owner** | Juanes |
| **Priority** | P1 — Must Have |
| **Status** | Done (5/5) |
| **Phases** | 1 |
| **Dependencies** | None |

## Summary

Foundation layer for the Financial Tracker app. Sets up the `financial_tracker` PostgreSQL schema on the shared JENG Supabase instance, configures PostgREST views with the `ft_*` prefix, initializes browser and server Supabase clients, adds PWA support, and provides shared utility helpers for date/currency formatting.

## Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 01-SD-001 | Supabase schema setup (`financial_tracker` schema, `ft_*` views) | 8 | Done |
| 01-SD-002 | Environment variables & Supabase clients (browser + server) | 5 | Done |
| 01-SD-003 | PostgREST view configuration with `security_invoker = true` | 5 | Done |
| 01-SD-004 | PWA manifest & favicon | 3 | Done |
| 01-SD-005 | Utility helpers (`format-utils.ts`, `utils.ts`) | 5 | Done |

**Total Points:** 26

## Key Files

| Purpose | Path |
|---------|------|
| Browser Supabase client | `lib/supabase/client.ts` |
| Server Supabase client | `lib/supabase/server.ts` |
| CRUD query functions (30+) | `lib/supabase/queries.ts` |
| Date/currency formatting | `lib/format-utils.ts` |
| Class name utility (cn) | `lib/utils.ts` |
| TypeScript types | `lib/types/index.ts` |
| Database type definitions | `lib/types/database.ts` |
| PWA manifest | `public/manifest.json` |
| App icon | `public/icon.svg` |

## Notes

- Schema uses `financial_tracker` with public views prefixed `ft_*` to bridge to PostgREST
- All views use `security_invoker = true` for RLS enforcement
- Browser client uses `persistSession: true`; server client uses cookie-based auth
- `queries.ts` exports 30+ typed CRUD functions covering all tables
- PWA configured as standalone with "Financial Tracker" name and off-white background
