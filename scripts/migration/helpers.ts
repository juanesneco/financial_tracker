import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { parse } from "csv-parse/sync";
import path from "path";

// Load .env.local before anything else
config({ path: path.resolve(__dirname, "../../.env.local") });

// ─── Supabase Admin Client ────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "https://api.juanesngtz.com";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

if (!SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required. Set it in .env.local");
}

export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── CSV Data Directory ───────────────────────────────────────────────────────

export const CSV_DIR = path.resolve(__dirname, "../../../financial_os/glide_data");

// ─── Mapping Store ────────────────────────────────────────────────────────────

const MAPPING_FILE = path.resolve(__dirname, "mapping.json");

export interface Mappings {
  users: Record<string, string>;       // glide_id -> supabase_uuid
  categories: Record<string, string>;  // glide_id -> supabase_uuid
  subcategories: Record<string, string>;
  cards: Record<string, string>;
  income_sources: Record<string, string>;
}

export function loadMappings(): Mappings {
  if (existsSync(MAPPING_FILE)) {
    return JSON.parse(readFileSync(MAPPING_FILE, "utf-8"));
  }
  return {
    users: {},
    categories: {},
    subcategories: {},
    cards: {},
    income_sources: {},
  };
}

export function saveMappings(mappings: Mappings) {
  writeFileSync(MAPPING_FILE, JSON.stringify(mappings, null, 2));
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

export function readCSV(filename: string): Record<string, string>[] {
  const filePath = path.join(CSV_DIR, filename);
  const content = readFileSync(filePath, "utf-8");

  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
  }) as Record<string, string>[];

  return records;
}

// ─── Date Parser ──────────────────────────────────────────────────────────────

/**
 * Parse Glide date format "M/D/YYYY, HH:MM:SS AM/PM" to "YYYY-MM-DD"
 */
export function parseGlideDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === "") return null;

  // Try to extract the date portion before the comma
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;

  const month = match[1].padStart(2, "0");
  const day = match[2].padStart(2, "0");
  const year = match[3];

  return `${year}-${month}-${day}`;
}

// ─── Batch Insert Helper ──────────────────────────────────────────────────────

export async function batchInsert(
  table: string,
  rows: Record<string, unknown>[],
  batchSize: number = 500
): Promise<number> {
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabaseAdmin.from(table).insert(batch);

    if (error) {
      console.error(`  Error inserting batch ${Math.floor(i / batchSize) + 1} into ${table}:`, error.message);
      // Try inserting one by one to find the problematic row
      for (const row of batch) {
        const { error: singleError } = await supabaseAdmin.from(table).insert(row);
        if (singleError) {
          console.error(`  Failed row:`, JSON.stringify(row).slice(0, 200));
          console.error(`  Error:`, singleError.message);
        } else {
          inserted++;
        }
      }
    } else {
      inserted += batch.length;
    }
  }

  return inserted;
}

// ─── Logger ───────────────────────────────────────────────────────────────────

export function log(step: string, message: string) {
  console.log(`[${step}] ${message}`);
}
