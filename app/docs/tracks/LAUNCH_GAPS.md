# Financial Tracker — Launch Gap Analysis

**Date:** 2026-03-15
**Current status:** 11/11 tracks done, 63/63 sub-deliverables passing. Core financial tracking feature-complete.

---

## High Priority — Users will expect these

| Gap | Why it matters |
|-----|---------------|
| **Data export (CSV/PDF)** | Users need to pull their data for taxes, accountants, or personal records. No export = trapped data. |
| **Recurring expenses** | Subscriptions are tracked but don't auto-generate monthly expenses. Users will manually re-enter the same charges every month. |
| **Empty states & onboarding** | A new user lands on a dashboard with zero data. Without guided empty states ("Add your first expense"), it feels broken. |
| **Error boundaries** | No global error handling visible. A failed Supabase query could crash the page with no recovery path. |
| **Loading / skeleton states** | Pages likely flash or show nothing while data loads. Skeleton screens prevent the "is it broken?" moment. |

## Medium Priority — Polish for retention

| Gap | Why it matters |
|-----|---------------|
| **Offline support (PWA)** | Manifest exists but no service worker. The app won't work without connectivity despite being "installable." |
| **Notifications / reminders** | Budget approaching limit, subscription renewal coming up — push or in-app alerts keep users engaged. |
| **Expense search from home** | Global search or quick-find across all expenses from the dashboard. Currently you have to navigate to the expenses list first. |
| **Multi-month budget view** | Budgets are current-month only. No way to see "how did I do last month?" for budgets specifically. |
| **Confirmation toasts everywhere** | Verify that every create/update/delete action gives clear feedback via Sonner toasts. |

## Lower Priority — Nice to have post-launch

| Gap | Why it matters |
|-----|---------------|
| **Expense attachments beyond receipts** | Multiple images per expense, or PDF invoices. |
| **Shared household view** | juanes + ivonne see each other's data? Or is it fully individual? The deposits restriction hints at shared use but the model isn't clear. |
| **Goals / savings targets** | "Save $X by December" with progress tracking. |
| **Automated categorization** | Suggest category based on title (e.g., "Uber" → Transport). |
| **Accessibility audit** | Color contrast in dark mode, screen reader labels, keyboard navigation. |

---

## Summary

~80% launch-ready. The core product works. What's missing isn't more features — it's the **edges**: what happens when things go wrong (errors, offline, empty data), and the quality-of-life pieces that prevent user frustration in the first week (export, recurring expenses, loading states).

**Top 3 to prioritize:** data export, recurring expenses, empty states. These make the biggest difference between "side project" and "app I trust with my money."
