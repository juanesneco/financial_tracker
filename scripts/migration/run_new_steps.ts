/**
 * Run only the new migration steps (09 + 10)
 *
 * Usage: npx tsx scripts/migration/run_new_steps.ts
 *
 * Assumes steps 01-08 already ran successfully and mapping.json is populated.
 */

import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(__dirname, "../../.env.local") });

import { migrateIncome } from "./09_migrate_income";
import { migrateImages } from "./10_migrate_images";
import { supabaseAdmin } from "./helpers";

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  Financial Tracker — New Steps (09 + 10)");
  console.log("═══════════════════════════════════════════════\n");

  // Step 09: Income Records
  console.log("\n── Migrate Income Records ──");
  try {
    await migrateIncome();
  } catch (error) {
    console.error("\n  ❌ FAILED: Migrate Income Records");
    console.error(error);
    process.exit(1);
  }

  // Step 10: Images
  console.log("\n── Migrate Images ──");
  try {
    await migrateImages();
  } catch (error) {
    console.error("\n  ❌ FAILED: Migrate Images");
    console.error(error);
    process.exit(1);
  }

  // Validation
  console.log("\n═══ VALIDATION ═══\n");

  const { count: incomeRecordCount } = await supabaseAdmin
    .from("ft_income_records")
    .select("*", { count: "exact", head: true });
  console.log(`  Income Records: ${incomeRecordCount}`);

  const { count: expenseCount } = await supabaseAdmin
    .from("ft_expenses")
    .select("*", { count: "exact", head: true });
  console.log(`  Expenses (total): ${expenseCount}`);

  // Count expenses with receipt_url
  const { count: receiptCount } = await supabaseAdmin
    .from("ft_expenses")
    .select("*", { count: "exact", head: true })
    .not("receipt_url", "is", null);
  console.log(`  Expenses with receipts: ${receiptCount}`);

  console.log("\n═══ DONE ═══\n");
}

main().catch(console.error);
