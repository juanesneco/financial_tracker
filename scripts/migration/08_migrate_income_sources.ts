/**
 * Step 8: Migrate income sources from J_income_source.csv
 *
 * Columns:
 *   🔒 Row ID, keys/userID, source_name, initials, legal/name,
 *   legal/address, legal/city_state_zip, legal/ID, HTML/template (skip),
 *   totals/num_income, totals/amount_all, ...
 *
 * Note: Skip HTML invoice templates. Only extract source metadata.
 */

import {
  supabaseAdmin,
  readCSV,
  loadMappings,
  saveMappings,
  log,
} from "./helpers";

export async function migrateIncomeSources() {
  log("08", "Migrating income sources...");
  const mappings = loadMappings();

  const records = readCSV("J_income_source.csv");
  log("08", `  Found ${records.length} income source records`);

  let inserted = 0;

  for (const row of records) {
    const glideId = row["🔒 Row ID"];
    const glideUserId = row["keys/userID"]?.trim();
    const sourceName = row["source_name"]?.trim();
    const initials = row["initials"]?.trim() || null;
    const legalName = row["legal/name"]?.trim() || null;
    const legalAddress = row["legal/address"]?.trim() || null;
    const legalCityStateZip = row["legal/city_state_zip"]?.trim() || null;
    const legalId = row["legal/ID"]?.trim() || null;

    if (!sourceName || !glideUserId) continue;

    const userId = mappings.users[glideUserId];
    if (!userId) {
      console.error(`  No user mapping for: ${glideUserId}`);
      continue;
    }

    const { data, error } = await supabaseAdmin
      .from("ft_income_sources")
      .insert({
        user_id: userId,
        source_name: sourceName,
        initials,
        legal_name: legalName,
        legal_address: legalAddress,
        legal_city_state_zip: legalCityStateZip,
        legal_id: legalId,
        original_glide_id: glideId,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  Failed to insert income source "${sourceName}":`, error.message);
      continue;
    }

    mappings.income_sources[glideId] = data.id;
    inserted++;
  }

  saveMappings(mappings);
  log("08", `Income sources migrated: ${inserted}/${records.length}`);
}

if (require.main === module) {
  migrateIncomeSources().catch(console.error);
}
