/**
 * Step 7: Migrate budgets from J_ledg_budget.csv
 *
 * Columns:
 *   🔒 Row ID, keys/userID, keys/categoryID, timestamp/uploaded, amount
 *
 * Note: keys/categoryID references main category IDs from J_ledg_main_categories.csv
 */

import {
  supabaseAdmin,
  readCSV,
  loadMappings,
  log,
} from "./helpers";

export async function migrateBudgets() {
  log("07", "Migrating budgets...");
  const mappings = loadMappings();

  const records = readCSV("J_ledg_budget.csv");
  log("07", `  Found ${records.length} budget records`);

  let inserted = 0;

  for (const row of records) {
    const glideId = row["🔒 Row ID"];
    const glideUserId = row["keys/userID"]?.trim();
    const glideCategoryId = row["keys/categoryID"]?.trim();
    const amountStr = row["amount"]?.trim();

    if (!amountStr || !glideCategoryId) continue;

    const userId = mappings.users[glideUserId];
    if (!userId) {
      console.error(`  No user mapping for: ${glideUserId}`);
      continue;
    }

    const amount = parseFloat(amountStr.replace(/,/g, ""));
    if (amount <= 0 || isNaN(amount)) continue;

    // Try mapping as a main category first
    let categoryId = mappings.categories[glideCategoryId] || null;
    let subcategoryId: string | null = null;

    // If not a main category, try as subcategory
    if (!categoryId) {
      subcategoryId = mappings.subcategories[glideCategoryId] || null;
      if (subcategoryId) {
        // Look up the parent category
        const { data: sub } = await supabaseAdmin
          .from("ft_subcategories")
          .select("category_id")
          .eq("id", subcategoryId)
          .single();
        categoryId = sub?.category_id || null;
      }
    }

    if (!categoryId && !subcategoryId) {
      console.error(`  No category/subcategory mapping for Glide ID: ${glideCategoryId}`);
      continue;
    }

    const { error } = await supabaseAdmin
      .from("ft_budgets")
      .insert({
        user_id: userId,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        amount,
        original_glide_id: glideId,
      });

    if (error) {
      console.error(`  Failed to insert budget for category ${glideCategoryId}:`, error.message);
      continue;
    }

    inserted++;
  }

  log("07", `Budgets migrated: ${inserted}/${records.length}`);
}

if (require.main === module) {
  migrateBudgets().catch(console.error);
}
