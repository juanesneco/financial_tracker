# Track 02: Authentication

| Field | Value |
|-------|-------|
| **Owner** | Juanes |
| **Priority** | P1 — Must Have |
| **Status** | Done (5/5) |
| **Phases** | 1 |
| **Dependencies** | 01_infrastructure |

## Summary

OTP-only authentication flow (no passwords, no magic links). Users enter their email, receive a branded 6-digit code via Resend, and verify it to create a session. Middleware protects all app routes, redirecting unauthenticated users to the login page.

## Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 02-SD-001 | OTP send endpoint (generate code, store in DB, send via Resend) | 5 | Done |
| 02-SD-002 | OTP verify endpoint (validate code, create user, return token) | 8 | Done |
| 02-SD-003 | Login page (two-step email → code flow) | 5 | Done |
| 02-SD-004 | Middleware route protection (redirect unauthenticated users) | 5 | Done |
| 02-SD-005 | OTP email branding config | 3 | Done |

**Total Points:** 26

## Key Files

| Purpose | Path |
|---------|------|
| Send OTP API route | `app/api/auth/send-otp/route.ts` |
| Verify OTP API route | `app/api/auth/verify-otp/route.ts` |
| Login page | `app/(auth)/login/page.tsx` |
| Route protection middleware | `middleware.ts` |
| OTP email branding config | `lib/auth/config.ts` |
| Auth callback handler | `app/auth/callback/route.ts` |

## Notes

- OTP codes stored in `otp_codes` table (shared across JENG apps)
- Email sent from `noreply@juanesngtz.com` with branded template
- Primary color `#0d4ea6` and accent `#D4915E` used in email template
- Login page detects existing session and auto-redirects to home
- Middleware updates Supabase session on every request via cookies
