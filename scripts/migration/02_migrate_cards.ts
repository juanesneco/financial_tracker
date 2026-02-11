/**
 * Step 2: Migrate 18 cards from J_cards.csv
 *
 * Columns: 🔒 Row ID, keys/userID, bank, 4_digits, type
 * Maps user IDs via mapping.json
 */

import { supabaseAdmin, readCSV, loadMappings, saveMappings, log } from "./helpers";

export async function migrateCards() {
  log("02", "Migrating cards...");
  const mappings = loadMappings();
  const records = readCSV("J_cards.csv");

  log("02", `  Found ${records.length} card records`);

  let inserted = 0;

  for (const row of records) {
    const glideId = row["🔒 Row ID"];
    const glideUserId = row["keys/userID"];
    const bank = row["bank"]?.trim();
    const lastFour = row["4_digits"]?.trim() || null;
    const cardType = row["type"]?.trim().toLowerCase() || null;

    const userId = mappings.users[glideUserId];
    if (!userId) {
      console.error(`  No user mapping for Glide ID: ${glideUserId}`);
      continue;
    }

    // Validate card_type
    const validType = cardType === "credit" || cardType === "debit" ? cardType : null;

    // Build label from bank + type + last4
    const label = [bank, validType ? validType.charAt(0).toUpperCase() + validType.slice(1) : null, lastFour ? `(${lastFour})` : null]
      .filter(Boolean)
      .join(" ");

    const { data, error } = await supabaseAdmin
      .from("ft_cards")
      .insert({
        user_id: userId,
        bank,
        last_four: lastFour,
        card_type: validType,
        label,
        original_glide_id: glideId,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  Failed to insert card ${bank} ${lastFour}:`, error.message);
      continue;
    }

    mappings.cards[glideId] = data.id;
    inserted++;
  }

  saveMappings(mappings);
  log("02", `Cards migrated: ${inserted}/${records.length}`);
}

if (require.main === module) {
  migrateCards().catch(console.error);
}
