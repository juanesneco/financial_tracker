# Active Tasks

All phases (0–6) are complete. The items below are post-launch polish and testing tasks.

## Post-Migration Verification
- [ ] Manual testing: verify all pages render correctly with real data for each user
- [ ] Verify add expense flow works end-to-end (with card selection, payment method)
- [ ] Verify expense edit/delete works
- [ ] Verify cards CRUD works
- [ ] Verify subscriptions CRUD works
- [ ] Verify budgets page shows correct spent vs budget
- [ ] Verify deposits page works for Juanes
- [ ] Verify statistics charts render with real data
- [ ] Verify settings page profile update works
- [ ] Test login flow for all 5 users

## Known Issues
- [ ] 2,490 expense records skipped during migration (no valid amount or date) — investigate if recoverable
- [ ] 22 deposit records skipped during migration — investigate if recoverable
- [ ] 2 subcategories not migrated (1 "Deposit" with no parent category, 1 "Nails" duplicate name)
- [ ] Income records table exists but no migration script was written for income records (only income sources)
- [ ] Categories/subcategories RLS is SELECT-only for all authenticated users — no per-user filtering (by design, shared data)
