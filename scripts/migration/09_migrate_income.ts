/**
 * Step 9: Migrate Income Records from Glide → ft_income_records
 *
 * Maps:
 *   J_income.csv → financial_tracker.income_records
 *
 * Resolves:
 *   - keys/userID    → mappings.users    → user_id
 *   - keys/sourceID  → mappings.income_sources → income_source_id
 */

import {
  readCSV,
  loadMappings,
  saveMappings,
  parseGlideDate,
  batchInsert,
  log,
} from "./helpers";

export async function migrateIncome() {
  const mappings = loadMappings();
  const rows = readCSV("J_income.csv");

  log("09", `Read ${rows.length} income records from CSV`);

  // Default user (Juanes) if mapping not found
  const defaultUserId = mappings.users["oln3M90-R.CB-GcdkYSK1w"];

  const records: Record<string, unknown>[] = [];
  let skipped = 0;

  for (const row of rows) {
    const glideId = row["🔒 Row ID"]?.trim();
    if (!glideId) {
      skipped++;
      continue;
    }

    // Resolve user
    const glideUserId = row["keys/userID"]?.trim();
    const userId = glideUserId
      ? mappings.users[glideUserId] || defaultUserId
      : defaultUserId;

    if (!userId) {
      log("09", `  Skipping ${glideId}: no user mapping for ${glideUserId}`);
      skipped++;
      continue;
    }

    // Resolve income source
    const glideSourceId = row["keys/sourceID"]?.trim();
    const incomeSourceId = glideSourceId
      ? mappings.income_sources[glideSourceId] || null
      : null;

    if (glideSourceId && !incomeSourceId) {
      log("09", `  Warning: no income_source mapping for ${glideSourceId} (row ${glideId})`);
    }

    // Parse amount — strip commas
    const rawAmount = (row["total_MXN"] || "").replace(/,/g, "").trim();
    const amount = parseFloat(rawAmount);
    if (!amount || amount <= 0) {
      log("09", `  Skipping ${glideId}: invalid amount "${row["total_MXN"]}"`);
      skipped++;
      continue;
    }

    // Parse date — try multiple sources:
    // 1. timestamp/due_date (M/D/YYYY format)
    // 2. timestamp/added (M/D/YYYY format)
    // 3. time/day (YYYYMMDD format, e.g. "20220612")
    let date =
      parseGlideDate(row["timestamp/due_date"] || "") ||
      parseGlideDate(row["timestamp/added"] || "");

    if (!date) {
      const dayField = (row["time/day"] || "").trim();
      if (dayField && /^\d{8}$/.test(dayField)) {
        const y = dayField.slice(0, 4);
        const m = dayField.slice(4, 6);
        const d = dayField.slice(6, 8);
        date = `${y}-${m}-${d}`;
      }
    }

    if (!date) {
      log("09", `  Skipping ${glideId}: no valid date`);
      skipped++;
      continue;
    }

    // Description = title from Glide
    const description = (row["title"] || "").trim() || null;

    records.push({
      user_id: userId,
      income_source_id: incomeSourceId,
      amount,
      currency: "MXN",
      date,
      description,
      original_glide_id: glideId,
    });
  }

  log("09", `Prepared ${records.length} income records (${skipped} skipped)`);

  if (records.length > 0) {
    const inserted = await batchInsert("ft_income_records", records);
    log("09", `Inserted ${inserted} income records`);
  }

  saveMappings(mappings);
}
