/**
 * Step 3: Migrate subcategories from J_ledg_subcategories.csv
 *
 * Main categories were already inserted via SQL migration (00004).
 * This script inserts subcategories and maps them via original_glide_id.
 *
 * Subcategory CSV columns:
 *   🔒 Row ID, keys/categoryID, keys/usersID, visibility/show, title,
 *   lookup/main_category_title, ..., template/AI_emoji, template/emoji_title, ...
 */

import { supabaseAdmin, readCSV, loadMappings, saveMappings, log } from "./helpers";

export async function migrateCategories() {
  log("03", "Migrating subcategories...");
  const mappings = loadMappings();

  // First, load the category mappings from the database (inserted by SQL migration)
  const { data: categories, error: catError } = await supabaseAdmin
    .from("ft_categories")
    .select("id, name, original_glide_id");

  if (catError || !categories) {
    console.error("Failed to load categories:", catError?.message);
    return;
  }

  // Build category mapping: glide_id -> supabase_uuid
  for (const cat of categories) {
    if (cat.original_glide_id) {
      mappings.categories[cat.original_glide_id] = cat.id;
    }
  }

  log("03", `  Loaded ${categories.length} categories from database`);

  // Read subcategories CSV
  const records = readCSV("J_ledg_subcategories.csv");
  log("03", `  Found ${records.length} subcategory records in CSV`);

  let inserted = 0;
  let displayOrder = 1;

  for (const row of records) {
    const glideId = row["🔒 Row ID"];
    const glideCategoryId = row["keys/categoryID"];
    const title = row["title"]?.trim();
    const emoji = row["template/AI_emoji"]?.trim() || null;

    if (!title) {
      log("03", `  Skipping row with empty title: ${glideId}`);
      continue;
    }

    // Map parent category
    const categoryId = mappings.categories[glideCategoryId];
    if (!categoryId) {
      log("03", `  No category mapping for Glide category ID: ${glideCategoryId} (subcategory: ${title})`);
      continue;
    }

    const { data, error } = await supabaseAdmin
      .from("ft_subcategories")
      .insert({
        category_id: categoryId,
        name: title,
        emoji,
        display_order: displayOrder++,
        original_glide_id: glideId,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  Failed to insert subcategory "${title}":`, error.message);
      continue;
    }

    mappings.subcategories[glideId] = data.id;
    inserted++;
  }

  saveMappings(mappings);
  log("03", `Subcategories migrated: ${inserted}/${records.length}`);
}

if (require.main === module) {
  migrateCategories().catch(console.error);
}
