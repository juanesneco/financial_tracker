/**
 * Step 4: Migrate expense records from J_ledger.csv
 *
 * Only rows where type = "Expense" are imported.
 * Deposits (type = "Deposit") are handled by script 05.
 *
 * Ledger CSV columns:
 *   🔒 Row ID, keys/userID, keys/subcategoryID, type, date, title,
 *   expense_MXN, amount/show, status_JENG/text, ..., deposit,
 *   keys/cardID, payment_method, lookup/card_title, comments, image/uploaded
 */

import {
  supabaseAdmin,
  readCSV,
  loadMappings,
  saveMappings,
  parseGlideDate,
  batchInsert,
  log,
} from "./helpers";

// Juanes's Glide ID (default for orphan rows)
const JUANES_GLIDE_ID = "oln3M90-R.CB-GcdkYSK1w";

export async function migrateExpenses() {
  log("04", "Migrating expenses...");
  const mappings = loadMappings();

  const records = readCSV("J_ledger.csv");
  log("04", `  Total ledger records: ${records.length}`);

  // Filter to expenses only
  const expenseRecords = records.filter((r) => r["type"]?.trim() === "Expense");
  log("04", `  Expense records: ${expenseRecords.length}`);

  const rows: Record<string, unknown>[] = [];
  let skipped = 0;

  for (const row of expenseRecords) {
    const glideId = row["🔒 Row ID"];
    const glideUserId = row["keys/userID"]?.trim();
    const glideSubcategoryId = row["keys/subcategoryID"]?.trim();
    const dateStr = row["date"]?.trim();
    const title = row["title"]?.trim() || null;
    const amountStr = row["expense_MXN"]?.trim() || row["amount/show"]?.trim();
    const glideCardId = row["keys/cardID"]?.trim() || null;
    const paymentMethod = row["payment_method"]?.trim()?.toLowerCase() || null;
    const comments = row["comments"]?.trim() || null;

    // Parse amount
    const amount = parseFloat(amountStr?.replace(/,/g, "") || "0");
    if (amount <= 0 || isNaN(amount)) {
      skipped++;
      continue;
    }

    // Parse date
    const date = parseGlideDate(dateStr);
    if (!date) {
      skipped++;
      continue;
    }

    // Map user (default to Juanes if no mapping)
    let userId = mappings.users[glideUserId];
    if (!userId) {
      userId = mappings.users[JUANES_GLIDE_ID];
    }

    // Map subcategory → get category from subcategory
    const subcategoryId = mappings.subcategories[glideSubcategoryId] || null;

    // Look up category from subcategory
    let categoryId: string | null = null;
    if (subcategoryId) {
      // Find which category this subcategory belongs to
      const { data: sub } = await supabaseAdmin
        .from("ft_subcategories")
        .select("category_id")
        .eq("id", subcategoryId)
        .single();
      categoryId = sub?.category_id || null;
    }

    // If we still don't have a category, try mapping subcategoryID as a category
    if (!categoryId) {
      categoryId = mappings.categories[glideSubcategoryId] || null;
    }

    // Last resort: get first "Other Expenses" category
    if (!categoryId) {
      const { data: otherCat } = await supabaseAdmin
        .from("ft_categories")
        .select("id")
        .eq("name", "Other Expenses")
        .single();
      categoryId = otherCat?.id || null;
    }

    if (!categoryId) {
      skipped++;
      continue;
    }

    // Map card
    const cardId = glideCardId ? mappings.cards[glideCardId] || null : null;

    // Map payment method
    const validPaymentMethod =
      paymentMethod === "card" || paymentMethod === "cash" ? paymentMethod : null;

    rows.push({
      user_id: userId,
      amount,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      date,
      title,
      note: title, // use title as note for backwards compatibility
      payment_method: validPaymentMethod,
      card_id: cardId,
      comments,
      currency: "MXN",
      original_glide_id: glideId,
    });
  }

  log("04", `  Prepared ${rows.length} expense rows (skipped ${skipped})`);

  // Batch insert
  const inserted = await batchInsert("ft_expenses", rows, 500);
  log("04", `Expenses migrated: ${inserted}/${rows.length}`);
}

if (require.main === module) {
  migrateExpenses().catch(console.error);
}
