/**
 * Migration script: adds dominant_color column and backfills existing photos.
 *
 * Run with: node scripts/add-dominant-color.mjs
 * Requires POSTGRES_URL in .env.local (run `vercel env pull` first)
 */

import { readFileSync } from "fs";
import { createPool } from "@vercel/postgres";
import sharp from "sharp";

// Load .env.local
const envFile = readFileSync(".env.local", "utf8");
const envVars = {};
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^"|"$/g, "");
}

const pool = createPool({ connectionString: envVars.POSTGRES_URL });

async function extractDominantColor(url) {
  try {
    const res = await fetch(url);
    const buffer = Buffer.from(await res.arrayBuffer());
    const { dominant } = await sharp(buffer).resize(64, 64, { fit: "cover" }).stats();
    return `#${dominant.r.toString(16).padStart(2, "0")}${dominant.g.toString(16).padStart(2, "0")}${dominant.b.toString(16).padStart(2, "0")}`;
  } catch (e) {
    console.error(`  Failed to extract color: ${e.message}`);
    return null;
  }
}

async function main() {
  // 1. Add column if it doesn't exist
  console.log("Adding dominant_color column...");
  await pool.query(`
    ALTER TABLE media_items ADD COLUMN IF NOT EXISTS dominant_color TEXT
  `);
  console.log("Column added (or already exists).\n");

  // 2. Backfill existing photos
  const { rows } = await pool.query(`
    SELECT id, blob_url FROM media_items
    WHERE type = 'photo' AND blob_url IS NOT NULL AND dominant_color IS NULL
  `);

  if (rows.length === 0) {
    console.log("No photos need backfilling.");
  } else {
    console.log(`Backfilling ${rows.length} photos...\n`);
    for (const row of rows) {
      process.stdout.write(`  #${row.id}: ${row.blob_url.slice(0, 60)}... `);
      const color = await extractDominantColor(row.blob_url);
      if (color) {
        await pool.query(`UPDATE media_items SET dominant_color = $1 WHERE id = $2`, [color, row.id]);
        console.log(`→ ${color}`);
      } else {
        console.log("→ skipped");
      }
    }
  }

  console.log("\nDone!");
  await pool.end();
}

main().catch(console.error);
