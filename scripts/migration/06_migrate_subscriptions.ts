/**
 * Step 6: Migrate subscriptions from J_subscriptions.csv
 *
 * Columns:
 *   🔒 Row ID, keys/userID, timestamp/initial, timestamp/final,
 *   title, day, amount, status/text, status/boolean
 */

import {
  supabaseAdmin,
  readCSV,
  loadMappings,
  parseGlideDate,
  log,
} from "./helpers";

export async function migrateSubscriptions() {
  log("06", "Migrating subscriptions...");
  const mappings = loadMappings();

  const records = readCSV("J_subscriptions.csv");
  log("06", `  Found ${records.length} subscription records`);

  let inserted = 0;

  for (const row of records) {
    const glideId = row["🔒 Row ID"];
    const glideUserId = row["keys/userID"]?.trim();
    const title = row["title"]?.trim();
    const amountStr = row["amount"]?.trim();
    const dayStr = row["day"]?.trim();
    const startDateStr = row["timestamp/initial"]?.trim();
    const endDateStr = row["timestamp/final"]?.trim();
    const statusText = row["status/text"]?.trim();
    const statusBool = row["status/boolean"]?.trim();

    if (!title || !amountStr) continue;

    const userId = mappings.users[glideUserId];
    if (!userId) {
      console.error(`  No user mapping for: ${glideUserId}`);
      continue;
    }

    const amount = parseFloat(amountStr.replace(/,/g, ""));
    if (amount <= 0 || isNaN(amount)) continue;

    const renewalDay = dayStr ? parseInt(dayStr) : null;
    const startDate = parseGlideDate(startDateStr);
    const endDate = parseGlideDate(endDateStr);
    const isActive = statusBool === "true" || statusText === "Active";

    const { error } = await supabaseAdmin
      .from("ft_subscriptions")
      .insert({
        user_id: userId,
        title,
        amount,
        currency: "MXN",
        renewal_day: renewalDay && renewalDay >= 1 && renewalDay <= 31 ? renewalDay : null,
        start_date: startDate,
        end_date: endDate,
        is_active: isActive,
        original_glide_id: glideId,
      });

    if (error) {
      console.error(`  Failed to insert subscription "${title}":`, error.message);
      continue;
    }

    inserted++;
  }

  log("06", `Subscriptions migrated: ${inserted}/${records.length}`);
}

if (require.main === module) {
  migrateSubscriptions().catch(console.error);
}
