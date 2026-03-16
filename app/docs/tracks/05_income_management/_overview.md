# Track 05: Income Management

| Field | Value |
|-------|-------|
| **Owner** | Juanes |
| **Priority** | P1 — Must Have |
| **Status** | Done (4/4) |
| **Phases** | 3 |
| **Dependencies** | 03_app_shell |

## Summary

Income tracking with two linked entities: income sources (clients/employers with legal details) and income records (individual payments). Sources include legal name, address, and tax ID for invoice generation. Records link to a source and track amount, date, and description.

## Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 05-SD-001 | Income sources CRUD (source name, initials, legal name/address) | 8 | Done |
| 05-SD-002 | Income records form (amount, source, date, description) | 5 | Done |
| 05-SD-003 | Add income page | 3 | Done |
| 05-SD-004 | Income list page with source management | 5 | Done |

**Total Points:** 21

## Key Files

| Purpose | Path |
|---------|------|
| Income list & source management | `app/(app)/income/page.tsx` |
| Add income page | `app/(app)/add-income/page.tsx` |
| Income form component | `components/forms/IncomeForm.tsx` |

## Notes

- Income sources store legal details (name, address, city/state/zip, legal ID) for invoicing
- Sources ordered alphabetically by source name
- Income records link to a source via `income_source_id`
- `initials` field used for avatar-style display in source lists
