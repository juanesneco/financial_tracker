/**
 * Step 10: Migrate Images from Glide Storage → Supabase Storage
 *
 * Downloads images/PDFs from Glide's GCS and uploads to Supabase storage:
 *   1. Expense receipts (J_ledger.csv image/uploaded) → receipts/{user_id}/{expense_id}.{ext}
 *   2. Income source logos (J_income_source.csv image/uploaded) → logos/{source_id}.{ext}
 *   3. User avatars (J_users.csv image/uploaded) → avatars/{user_id}.{ext}
 *
 * Updates the corresponding DB records with the new storage URLs.
 */

import { readCSV, loadMappings, supabaseAdmin, log } from "./helpers";
import path from "path";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getExtFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname).toLowerCase().replace(".", "");
    if (["jpg", "jpeg", "png", "gif", "webp", "pdf", "heic"].includes(ext)) {
      return ext;
    }
  } catch {}
  return "jpg"; // default fallback
}

function getMimeType(ext: string): string {
  const mimes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    pdf: "application/pdf",
    heic: "image/heic",
  };
  return mimes[ext] || "application/octet-stream";
}

async function downloadFile(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) {
      log("10", `  Download failed (${response.status}): ${url.slice(0, 100)}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log("10", `  Download error: ${message} — ${url.slice(0, 100)}`);
    return null;
  }
}

async function uploadToStorage(
  bucket: string,
  storagePath: string,
  data: Buffer,
  contentType: string
): Promise<string | null> {
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(storagePath, data, {
      contentType,
      upsert: true,
    });

  if (error) {
    log("10", `  Upload error (${bucket}/${storagePath}): ${error.message}`);
    return null;
  }

  // Return the storage path (not a public URL since buckets are private)
  return `${bucket}/${storagePath}`;
}

// ─── Ensure Buckets Exist ─────────────────────────────────────────────────────

async function ensureBuckets() {
  const buckets = ["receipts", "logos", "avatars"];
  for (const bucket of buckets) {
    const { error } = await supabaseAdmin.storage.createBucket(bucket, {
      public: false,
    });
    if (error && !error.message.includes("already exists")) {
      log("10", `  Warning creating bucket "${bucket}": ${error.message}`);
    }
  }
}

// ─── 1. Expense Receipts ──────────────────────────────────────────────────────

async function migrateExpenseReceipts() {
  log("10", "── Expense Receipts ──");

  const rows = readCSV("J_ledger.csv");
  const mappings = loadMappings();

  let migrated = 0;
  let skipped = 0;
  const defaultUserId = mappings.users["oln3M90-R.CB-GcdkYSK1w"];

  for (const row of rows) {
    const imageUrl = (row["image/uploaded"] || "").trim();
    if (!imageUrl) continue;

    const glideId = row["🔒 Row ID"]?.trim();
    if (!glideId) { skipped++; continue; }

    // Look up the expense in DB by original_glide_id
    const { data: expense } = await supabaseAdmin
      .from("ft_expenses")
      .select("id, user_id, receipt_url")
      .eq("original_glide_id", glideId)
      .single();

    // Also check deposits
    if (!expense) {
      const { data: deposit } = await supabaseAdmin
        .from("ft_deposits")
        .select("id")
        .eq("original_glide_id", glideId)
        .single();

      if (!deposit) {
        log("10", `  No DB record for glide_id ${glideId}, skipping image`);
        skipped++;
        continue;
      }
      // Deposits don't have receipt_url, skip
      continue;
    }

    // Skip if already has a receipt_url that's not a Glide URL
    if (expense.receipt_url && !expense.receipt_url.includes("googleapis.com")) {
      continue;
    }

    const ext = getExtFromUrl(imageUrl);
    const data = await downloadFile(imageUrl);
    if (!data) { skipped++; continue; }

    const userId = expense.user_id || defaultUserId;
    const storagePath = `${userId}/${expense.id}.${ext}`;

    const result = await uploadToStorage("receipts", storagePath, data, getMimeType(ext));
    if (!result) { skipped++; continue; }

    // Update expense with new receipt_url
    const { error: updateError } = await supabaseAdmin
      .from("ft_expenses")
      .update({ receipt_url: storagePath })
      .eq("id", expense.id);

    if (updateError) {
      log("10", `  Failed to update expense ${expense.id}: ${updateError.message}`);
      skipped++;
    } else {
      migrated++;
    }
  }

  log("10", `Receipts: ${migrated} migrated, ${skipped} skipped`);
}

// ─── 2. Income Source Logos ───────────────────────────────────────────────────

async function migrateIncomeSourceLogos() {
  log("10", "── Income Source Logos ──");

  const rows = readCSV("J_income_source.csv");
  const mappings = loadMappings();

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const imageUrl = (row["image/uploaded"] || "").trim();
    if (!imageUrl) continue;

    const glideId = row["🔒 Row ID"]?.trim();
    if (!glideId) { skipped++; continue; }

    const sourceId = mappings.income_sources[glideId];
    if (!sourceId) {
      log("10", `  No mapping for income_source ${glideId}`);
      skipped++;
      continue;
    }

    const ext = getExtFromUrl(imageUrl);
    const data = await downloadFile(imageUrl);
    if (!data) { skipped++; continue; }

    const storagePath = `${sourceId}.${ext}`;
    const result = await uploadToStorage("logos", storagePath, data, getMimeType(ext));
    if (!result) { skipped++; continue; }

    // income_sources doesn't have an image column yet — we'll store it but
    // the column would need to be added via migration. For now, log it.
    log("10", `  ✓ Uploaded logo for source ${sourceId}: logos/${storagePath}`);
    migrated++;
  }

  log("10", `Logos: ${migrated} migrated, ${skipped} skipped`);
}

// ─── 3. User Avatars ─────────────────────────────────────────────────────────

async function migrateUserAvatars() {
  log("10", "── User Avatars ──");

  const rows = readCSV("J_users.csv");
  const mappings = loadMappings();

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const imageUrl = (row["image/uploaded"] || "").trim();
    if (!imageUrl) continue;

    const glideId = row["🔒 Row ID"]?.trim();
    if (!glideId) { skipped++; continue; }

    const userId = mappings.users[glideId];
    if (!userId) {
      log("10", `  No mapping for user ${glideId}`);
      skipped++;
      continue;
    }

    const ext = getExtFromUrl(imageUrl);
    const data = await downloadFile(imageUrl);
    if (!data) { skipped++; continue; }

    const storagePath = `${userId}.${ext}`;
    const result = await uploadToStorage("avatars", storagePath, data, getMimeType(ext));
    if (!result) { skipped++; continue; }

    // Update profile avatar_url
    const { error: updateError } = await supabaseAdmin
      .from("ft_profiles")
      .update({ avatar_url: `avatars/${storagePath}` })
      .eq("id", userId);

    if (updateError) {
      log("10", `  Failed to update avatar for ${userId}: ${updateError.message}`);
      skipped++;
    } else {
      migrated++;
    }
  }

  log("10", `Avatars: ${migrated} migrated, ${skipped} skipped`);
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function migrateImages() {
  await ensureBuckets();
  await migrateExpenseReceipts();
  await migrateIncomeSourceLogos();
  await migrateUserAvatars();
}
