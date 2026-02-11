/**
 * Master migration runner
 *
 * Executes all migration scripts in order with error handling.
 * Usage: npx tsx scripts/migration/run_migration.ts
 *
 * Prerequisites:
 *   1. Run SQL migrations 00003 and 00004 against the database first
 *   2. Install csv-parse: npm install csv-parse
 *   3. Ensure .env.local has SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from "dotenv";
import path from "path";

// Load .env.local
config({ path: path.resolve(__dirname, "../../.env.local") });

import { createUsers } from "./01_create_users";
import { migrateCards } from "./02_migrate_cards";
import { migrateCategories } from "./03_migrate_categories";
import { migrateExpenses } from "./04_migrate_expenses";
import { migrateDeposits } from "./05_migrate_deposits";
import { migrateSubscriptions } from "./06_migrate_subscriptions";
import { migrateBudgets } from "./07_migrate_budgets";
import { migrateIncomeSources } from "./08_migrate_income_sources";
import { supabaseAdmin } from "./helpers";

async function runValidation() {
  console.log("\n═══ VALIDATION ═══\n");

  // Count expenses
  const { count: expenseCount } = await supabaseAdmin
    .from("ft_expenses")
    .select("*", { count: "exact", head: true });
  console.log(`  Expenses: ${expenseCount}`);

  // Count deposits
  const { count: depositCount } = await supabaseAdmin
    .from("ft_deposits")
    .select("*", { count: "exact", head: true });
  console.log(`  Deposits: ${depositCount}`);

  // Count cards
  const { count: cardCount } = await supabaseAdmin
    .from("ft_cards")
    .select("*", { count: "exact", head: true });
  console.log(`  Cards: ${cardCount}`);

  // Count categories
  const { count: catCount } = await supabaseAdmin
    .from("ft_categories")
    .select("*", { count: "exact", head: true });
  console.log(`  Categories: ${catCount}`);

  // Count subcategories
  const { count: subCount } = await supabaseAdmin
    .from("ft_subcategories")
    .select("*", { count: "exact", head: true });
  console.log(`  Subcategories: ${subCount}`);

  // Count subscriptions
  const { count: subxCount } = await supabaseAdmin
    .from("ft_subscriptions")
    .select("*", { count: "exact", head: true });
  console.log(`  Subscriptions: ${subxCount}`);

  // Count budgets
  const { count: budgetCount } = await supabaseAdmin
    .from("ft_budgets")
    .select("*", { count: "exact", head: true });
  console.log(`  Budgets: ${budgetCount}`);

  // Count income sources
  const { count: incomeSourceCount } = await supabaseAdmin
    .from("ft_income_sources")
    .select("*", { count: "exact", head: true });
  console.log(`  Income Sources: ${incomeSourceCount}`);

  // Count users
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  console.log(`  Users: ${users?.users?.length || 0}`);

  console.log("\n═══ DONE ═══\n");
}

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  Financial Tracker — Glide Migration Runner");
  console.log("═══════════════════════════════════════════════\n");

  const steps = [
    { name: "Create Users", fn: createUsers },
    { name: "Migrate Cards", fn: migrateCards },
    { name: "Migrate Subcategories", fn: migrateCategories },
    { name: "Migrate Expenses", fn: migrateExpenses },
    { name: "Migrate Deposits", fn: migrateDeposits },
    { name: "Migrate Subscriptions", fn: migrateSubscriptions },
    { name: "Migrate Budgets", fn: migrateBudgets },
    { name: "Migrate Income Sources", fn: migrateIncomeSources },
  ];

  for (const step of steps) {
    console.log(`\n── ${step.name} ──`);
    try {
      await step.fn();
    } catch (error) {
      console.error(`\n  ❌ FAILED: ${step.name}`);
      console.error(error);
      console.error("\n  Stopping migration. Fix the error and re-run.\n");
      process.exit(1);
    }
  }

  await runValidation();
}

main().catch(console.error);
