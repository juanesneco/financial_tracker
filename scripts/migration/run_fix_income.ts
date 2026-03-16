/**
 * Fix: Insert the 280 income records that were skipped due to missing timestamp dates.
 * These records use time/day (YYYYMMDD) format instead.
 *
 * Usage: npx tsx scripts/migration/run_fix_income.ts
 */

import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(__dirname, "../../.env.local") });

import {
  readCSV,
  loadMappings,
  parseGlideDate,
  batchInsert,
  log,
  supabaseAdmin,
} from "./helpers";

async function main() {
  console.log("═══ Fix: Insert missing income records ═══\n");

  const mappings = loadMappings();
  const rows = readCSV("J_income.csv");
  const defaultUserId = mappings.users["oln3M90-R.CB-GcdkYSK1w"];

  // Get already-inserted glide IDs to avoid duplicates
  const { data: existing } = await supabaseAdmin
    .from("ft_income_records")
    .select("original_glide_id");

  const existingIds = new Set((existing || []).map((r: { original_glide_id: string }) => r.original_glide_id));
  log("fix", `Found ${existingIds.size} existing income records in DB`);

  const records: Record<string, unknown>[] = [];
  let skipped = 0;
  let alreadyExists = 0;

  for (const row of rows) {
    const glideId = row["🔒 Row ID"]?.trim();
    if (!glideId) { skipped++; continue; }

    // Skip if already in DB
    if (existingIds.has(glideId)) {
      alreadyExists++;
      continue;
    }

    // Resolve user
    const glideUserId = row["keys/userID"]?.trim();
    const userId = glideUserId
      ? mappings.users[glideUserId] || defaultUserId
      : defaultUserId;
    if (!userId) { skipped++; continue; }

    // Resolve income source
    const glideSourceId = row["keys/sourceID"]?.trim();
    const incomeSourceId = glideSourceId
      ? mappings.income_sources[glideSourceId] || null
      : null;

    // Parse amount
    const rawAmount = (row["total_MXN"] || "").replace(/,/g, "").trim();
    const amount = parseFloat(rawAmount);
    if (!amount || amount <= 0) { skipped++; continue; }

    // Parse date — try all formats
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

    if (!date) { skipped++; continue; }

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

  log("fix", `Already in DB: ${alreadyExists}`);
  log("fix", `New records to insert: ${records.length}`);
  log("fix", `Skipped (no data): ${skipped}`);

  if (records.length > 0) {
    const inserted = await batchInsert("ft_income_records", records);
    log("fix", `Inserted ${inserted} income records`);
  }

  // Final validation
  const { count } = await supabaseAdmin
    .from("ft_income_records")
    .select("*", { count: "exact", head: true });
  log("fix", `Total income records in DB: ${count}`);

  console.log("\n═══ DONE ═══\n");
}

main().catch(console.error);
