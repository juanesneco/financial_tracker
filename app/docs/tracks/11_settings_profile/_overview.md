# Track 11: Settings & Profile

| Field | Value |
|-------|-------|
| **Owner** | Juanes |
| **Priority** | P1 — Must Have |
| **Status** | Done (5/5) |
| **Phases** | 1 |
| **Dependencies** | 02_authentication |

## Summary

User profile and preferences page. Users can edit their display name, select currency preference (MXN or USD), and view account info (role, member since date). Super admins see a badge indicator. Logout clears the session and redirects to login.

## Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 11-SD-001 | Display name editing | 3 | Done |
| 11-SD-002 | Currency preference (MXN/USD) | 3 | Done |
| 11-SD-003 | Account info display (role, member since) | 3 | Done |
| 11-SD-004 | Admin badge for super admins | 2 | Done |
| 11-SD-005 | Logout functionality | 2 | Done |

**Total Points:** 13

## Key Files

| Purpose | Path |
|---------|------|
| Settings page | `app/(app)/settings/page.tsx` |

## Notes

- Currency preference stored in `ft_profiles.currency` and used throughout the app
- Admin badge shown when `is_super_admin` is true on the profile
- Logout uses Supabase `signOut()` and redirects to `/login`
- Member since date derived from `created_at` on the profile record
