-- ═══════════════════════════════════════════════════════════════════════════════
-- Seed Categories & Subcategories
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- Categories
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO financial_tracker.categories (name, icon, color, display_order) VALUES
  ('Food & Dining',      '🍽️', '#E57373', 1),
  ('Transportation',     '🚗', '#64B5F6', 2),
  ('Housing',            '🏠', '#81C784', 3),
  ('Entertainment',      '🎬', '#BA68C8', 4),
  ('Shopping',           '🛍️', '#FFB74D', 5),
  ('Health',             '💊', '#4DB6AC', 6),
  ('Education',          '📚', '#7986CB', 7),
  ('Subscriptions',      '📱', '#A1887F', 8),
  ('Personal Care',      '💈', '#F06292', 9),
  ('Travel',             '✈️', '#4FC3F7', 10),
  ('Gifts & Donations',  '🎁', '#AED581', 11),
  ('Other',              '📦', '#90A4AE', 12);

-- ─────────────────────────────────────────────────────────────────────────────
-- Subcategories
-- ─────────────────────────────────────────────────────────────────────────────

-- Food & Dining
INSERT INTO financial_tracker.subcategories (category_id, name, display_order)
SELECT id, unnest, row_number() OVER ()
FROM financial_tracker.categories,
     unnest(ARRAY['Groceries', 'Restaurants', 'Coffee', 'Delivery', 'Snacks'])
WHERE name = 'Food & Dining';

-- Transportation
INSERT INTO financial_tracker.subcategories (category_id, name, display_order)
SELECT id, unnest, row_number() OVER ()
FROM financial_tracker.categories,
     unnest(ARRAY['Gas', 'Uber / Taxi', 'Parking', 'Public Transit', 'Maintenance'])
WHERE name = 'Transportation';

-- Housing
INSERT INTO financial_tracker.subcategories (category_id, name, display_order)
SELECT id, unnest, row_number() OVER ()
FROM financial_tracker.categories,
     unnest(ARRAY['Rent', 'Utilities', 'Internet', 'Cleaning', 'Repairs'])
WHERE name = 'Housing';

-- Entertainment
INSERT INTO financial_tracker.subcategories (category_id, name, display_order)
SELECT id, unnest, row_number() OVER ()
FROM financial_tracker.categories,
     unnest(ARRAY['Movies', 'Concerts', 'Games', 'Sports', 'Hobbies'])
WHERE name = 'Entertainment';

-- Shopping
INSERT INTO financial_tracker.subcategories (category_id, name, display_order)
SELECT id, unnest, row_number() OVER ()
FROM financial_tracker.categories,
     unnest(ARRAY['Clothing', 'Electronics', 'Home Goods', 'Online Shopping'])
WHERE name = 'Shopping';

-- Health
INSERT INTO financial_tracker.subcategories (category_id, name, display_order)
SELECT id, unnest, row_number() OVER ()
FROM financial_tracker.categories,
     unnest(ARRAY['Doctor', 'Pharmacy', 'Gym', 'Insurance'])
WHERE name = 'Health';

-- Education
INSERT INTO financial_tracker.subcategories (category_id, name, display_order)
SELECT id, unnest, row_number() OVER ()
FROM financial_tracker.categories,
     unnest(ARRAY['Courses', 'Books', 'Supplies', 'Tuition'])
WHERE name = 'Education';

-- Subscriptions
INSERT INTO financial_tracker.subcategories (category_id, name, display_order)
SELECT id, unnest, row_number() OVER ()
FROM financial_tracker.categories,
     unnest(ARRAY['Streaming', 'Software', 'Music', 'Cloud Storage'])
WHERE name = 'Subscriptions';

-- Personal Care
INSERT INTO financial_tracker.subcategories (category_id, name, display_order)
SELECT id, unnest, row_number() OVER ()
FROM financial_tracker.categories,
     unnest(ARRAY['Haircut', 'Skincare', 'Spa', 'Laundry'])
WHERE name = 'Personal Care';

-- Travel
INSERT INTO financial_tracker.subcategories (category_id, name, display_order)
SELECT id, unnest, row_number() OVER ()
FROM financial_tracker.categories,
     unnest(ARRAY['Flights', 'Hotels', 'Activities', 'Food (Travel)'])
WHERE name = 'Travel';

-- Gifts & Donations
INSERT INTO financial_tracker.subcategories (category_id, name, display_order)
SELECT id, unnest, row_number() OVER ()
FROM financial_tracker.categories,
     unnest(ARRAY['Gifts', 'Charity', 'Tips'])
WHERE name = 'Gifts & Donations';

-- Other
INSERT INTO financial_tracker.subcategories (category_id, name, display_order)
SELECT id, unnest, row_number() OVER ()
FROM financial_tracker.categories,
     unnest(ARRAY['Fees', 'Taxes', 'Miscellaneous'])
WHERE name = 'Other';
