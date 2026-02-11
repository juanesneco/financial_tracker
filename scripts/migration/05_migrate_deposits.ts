/**
 * Step 5: Migrate deposit records from J_ledger.csv
 *
 * Only rows where type = "Deposit" are imported into the deposits table.
 * All deposits are assigned to the user referenced in the CSV.
 *
 * Ledger CSV columns (relevant for deposits):
 *   🔒 Row ID, keys/userID, type, date, title, deposit (amount), comments
 */

import {
  supabaseAdmin,
  readCSV,
  loadMappings,
  parseGlideDate,
  batchInsert,
  log,
} from "./helpers";

const JUANES_GLIDE_ID = "oln3M90-R.CB-GcdkYSK1w";

export async function migrateDeposits() {
  log("05", "Migrating deposits...");
  const mappings = loadMappings();

  const records = readCSV("J_ledger.csv");

  // Filter to deposits only
  const depositRecords = records.filter((r) => r["type"]?.trim() === "Deposit");
  log("05", `  Deposit records: ${depositRecords.length}`);

  const rows: Record<string, unknown>[] = [];
  let skipped = 0;

  for (const row of depositRecords) {
    const glideId = row["🔒 Row ID"];
    const glideUserId = row["keys/userID"]?.trim();
    const dateStr = row["date"]?.trim();
    const title = row["title"]?.trim() || null;
    const depositAmountStr = row["deposit"]?.trim() || row["amount/show"]?.trim() || row["expense_MXN"]?.trim();
    const comments = row["comments"]?.trim() || null;

    // Parse amount
    const amount = parseFloat(depositAmountStr?.replace(/,/g, "") || "0");
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

    // Map user (default to Juanes)
    let userId = mappings.users[glideUserId];
    if (!userId) {
      userId = mappings.users[JUANES_GLIDE_ID];
    }

    rows.push({
      user_id: userId,
      amount,
      date,
      title,
      note: comments,
      original_glide_id: glideId,
    });
  }

  log("05", `  Prepared ${rows.length} deposit rows (skipped ${skipped})`);

  const inserted = await batchInsert("ft_deposits", rows, 500);
  log("05", `Deposits migrated: ${inserted}/${rows.length}`);
}

if (require.main === module) {
  migrateDeposits().catch(console.error);
}
