/**
 * Sync: Insert missing expenses and deposits from J_ledger.csv
 *
 * Skips rows already in DB (by original_glide_id).
 * Handles both old Glide row IDs and new-format IDs.
 *
 * Usage: npx tsx scripts/migration/run_sync_ledger.ts
 */

import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(__dirname, "../../.env.local") });

import {
  readCSV,
  loadMappings,
  parseGlideDate,
  batchInsert,
  supabaseAdmin,
  log,
} from "./helpers";

async function main() {
  console.log("═══ Sync: Insert missing expenses + deposits ═══\n");

  const mappings = loadMappings();
  const rows = readCSV("J_ledger.csv");
  const defaultUserId = mappings.users["oln3M90-R.CB-GcdkYSK1w"];

  // Load existing glide IDs from both tables
  const { data: existingExpenses } = await supabaseAdmin
    .from("ft_expenses")
    .select("original_glide_id");
  const { data: existingDeposits } = await supabaseAdmin
    .from("ft_deposits")
    .select("original_glide_id");

  const existingExpenseIds = new Set(
    (existingExpenses || []).map((r: { original_glide_id: string }) => r.original_glide_id)
  );
  const existingDepositIds = new Set(
    (existingDeposits || []).map((r: { original_glide_id: string }) => r.original_glide_id)
  );

  log("sync", `Existing expenses: ${existingExpenseIds.size}, deposits: ${existingDepositIds.size}`);

  // Load subcategory lookup for resolving category_id from subcategory_id
  const { data: subcategories } = await supabaseAdmin
    .from("ft_subcategories")
    .select("id, category_id, original_glide_id");
  const subMap = new Map<string, { id: string; category_id: string }>();
  for (const sub of subcategories || []) {
    if (sub.original_glide_id) {
      subMap.set(sub.original_glide_id, { id: sub.id, category_id: sub.category_id });
    }
  }

  // Load categories for fallback
  const { data: categories } = await supabaseAdmin
    .from("ft_categories")
    .select("id, name, original_glide_id");
  const catByGlide = new Map<string, string>();
  const otherCategoryId = categories?.find((c: { name: string }) => c.name === "Other Expenses")?.id;
  for (const cat of categories || []) {
    if (cat.original_glide_id) catByGlide.set(cat.original_glide_id, cat.id);
  }

  const newExpenses: Record<string, unknown>[] = [];
  const newDeposits: Record<string, unknown>[] = [];
  let skippedExp = 0;
  let skippedDep = 0;

  for (const row of rows) {
    const glideId = (row["🔒 Row ID"] || row["Row ID"] || "").trim();
    if (!glideId) continue;

    const type = (row["type"] || "").trim();

    // Resolve user
    const glideUserId = (row["keys/userID"] || "").trim();
    const userId = glideUserId
      ? mappings.users[glideUserId] || defaultUserId
      : defaultUserId;

    // Parse date
    let date = parseGlideDate(row["date"] || "");
    if (!date) {
      const dayField = (row["time/day"] || "").trim();
      if (dayField && /^\d{8}$/.test(dayField)) {
        date = `${dayField.slice(0, 4)}-${dayField.slice(4, 6)}-${dayField.slice(6, 8)}`;
      }
    }

    if (type === "Expense") {
      if (existingExpenseIds.has(glideId)) continue;

      // Parse amount
      const rawAmount = (row["expense_MXN"] || row["amount/show"] || "")
        .replace(/,/g, "")
        .trim();
      const amount = parseFloat(rawAmount);
      if (!amount || amount <= 0) {
        skippedExp++;
        continue;
      }

      if (!date) {
        skippedExp++;
        continue;
      }

      // Resolve subcategory + category
      const glideSubId = (row["keys/subcategoryID"] || "").trim();
      let subcategoryId: string | null = null;
      let categoryId: string | null = null;

      if (glideSubId) {
        // Try as subcategory first
        const sub = subMap.get(glideSubId);
        if (sub) {
          subcategoryId = sub.id;
          categoryId = sub.category_id;
        } else {
          // Try as category
          const catId = catByGlide.get(glideSubId) || mappings.categories[glideSubId];
          if (catId) {
            categoryId = catId;
          } else {
            // Try subcategory mapping
            const subId = mappings.subcategories[glideSubId];
            if (subId) {
              subcategoryId = subId;
              // Look up category from DB
              const subData = (subcategories || []).find(
                (s: { id: string }) => s.id === subId
              );
              categoryId = subData?.category_id || otherCategoryId || null;
            } else {
              categoryId = otherCategoryId || null;
            }
          }
        }
      } else {
        categoryId = otherCategoryId || null;
      }

      // Resolve card
      const glideCardId = (row["keys/cardID"] || "").trim();
      const cardId = glideCardId ? mappings.cards[glideCardId] || null : null;

      // Payment method
      const pm = (row["payment_method"] || "").toLowerCase().trim();
      const paymentMethod = pm === "card" || pm === "cash" ? pm : null;

      const title = (row["title"] || "").trim() || null;
      const comments = (row["comments"] || "").trim() || null;

      newExpenses.push({
        user_id: userId,
        amount,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        date,
        title,
        note: title,
        payment_method: paymentMethod,
        card_id: cardId,
        comments,
        currency: "MXN",
        original_glide_id: glideId,
      });
    } else if (type === "Deposit") {
      if (existingDepositIds.has(glideId)) continue;

      const rawAmount = (row["deposit"] || row["amount/show"] || row["expense_MXN"] || "")
        .replace(/,/g, "")
        .trim();
      const amount = parseFloat(rawAmount);
      if (!amount || amount <= 0) {
        skippedDep++;
        continue;
      }

      if (!date) {
        skippedDep++;
        continue;
      }

      const title = (row["title"] || "").trim() || null;
      const note = (row["comments"] || "").trim() || null;

      newDeposits.push({
        user_id: userId,
        amount,
        date,
        title,
        note,
        original_glide_id: glideId,
      });
    }
  }

  log("sync", `New expenses to insert: ${newExpenses.length} (${skippedExp} skipped)`);
  log("sync", `New deposits to insert: ${newDeposits.length} (${skippedDep} skipped)`);

  if (newExpenses.length > 0) {
    const inserted = await batchInsert("ft_expenses", newExpenses);
    log("sync", `Inserted ${inserted} expenses`);
  }

  if (newDeposits.length > 0) {
    const inserted = await batchInsert("ft_deposits", newDeposits);
    log("sync", `Inserted ${inserted} deposits`);
  }

  // Final counts
  const { count: expTotal } = await supabaseAdmin
    .from("ft_expenses")
    .select("*", { count: "exact", head: true });
  const { count: depTotal } = await supabaseAdmin
    .from("ft_deposits")
    .select("*", { count: "exact", head: true });

  console.log("\n═══ FINAL COUNTS ═══");
  console.log(`  Expenses: ${expTotal} (CSV: 7318)`);
  console.log(`  Deposits: ${depTotal} (CSV: 133)`);
  console.log("═══ DONE ═══\n");
}

main().catch(console.error);
