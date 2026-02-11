-- ═══════════════════════════════════════════════════════════════════════════════
-- Replace Categories with Glide Financial OS Categories
-- Deletes existing seeded categories (no production expense data yet)
-- Inserts Glide main categories with emojis, colors, and original_glide_id
-- Subcategories will be inserted by migration scripts (Phase 2) due to complex ID mapping
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. DELETE EXISTING SEEDED DATA
-- ─────────────────────────────────────────────────────────────────────────────

-- Subcategories first (FK constraint)
DELETE FROM financial_tracker.subcategories;

-- Then categories
DELETE FROM financial_tracker.categories;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. INSERT GLIDE MAIN CATEGORIES
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO financial_tracker.categories (name, icon, color, display_order, emoji, original_glide_id) VALUES
  ('Personal Spending',         '💸', '#9C27B0', 1,  '💸', 'zh9e0UshT6azasqEA3LpEQ'),
  ('Finance',                   '💰', '#4CAF50', 2,  '💰', 'puyp5peSTm60M20rssM1OA'),
  ('Utilities',                 '🔌', '#FF9800', 3,  '🔌', 'r0P8pAp.TOejFByXWeLTTA'),
  ('Food',                      '🍔', '#F44336', 4,  '🍔', 'RKJSsbhnSsO7BnraDYKQIw'),
  ('Transportation',            '🚗', '#2196F3', 5,  '🚗', 'fdLePIRtSYWq-TTr5GvJyQ'),
  ('Medical & Healthcare',      '⚕️', '#00BCD4', 6,  '⚕️', 'a.3DbYVw5SfuRQQ61dyWeYQ'),
  ('Recreation & Entertainment','🎉', '#E91E63', 7,  '🎉', 'y6cdmxBiRK2MqpWerUGfaw'),
  ('Business',                  '💼', '#607D8B', 8,  '💼', 'HqoZz-fARwGTbjZOi-kAXQ'),
  ('Other Expenses',            '💸', '#9E9E9E', 9,  '💸', 'hcdXe2v5RxyysoOMwcx-0w'),
  ('Self Development',          '📚', '#673AB7', 10, '📚', 'dOKCd0RlRluR6tRmLdIX.w'),
  ('Insurance',                 '🛡️', '#795548', 11, '🛡️', 'Ggwbpe45R0-8DefKnoIxbQ'),
  ('Boda Majo&Juanes',          '💒', '#FF4081', 12, '💒', 'zLbcy0SnT3yuuxVN0fOxFw'),
  ('SONIC 2017',                '🎮', '#00E5FF', 13, '🎮', 'j01W-VrtSymiqI0Ymlrtfg');
