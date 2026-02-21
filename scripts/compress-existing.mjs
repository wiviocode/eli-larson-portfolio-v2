/**
 * Compresses all existing photos to optimized WebP.
 *
 * Run with: node scripts/compress-existing.mjs
 * Requires POSTGRES_URL and BLOB_READ_WRITE_TOKEN in .env.local
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
const BLOB_TOKEN = envVars.BLOB_READ_WRITE_TOKEN;

const MAX_DIMENSION = 2400;
const WEBP_QUALITY = 82;

async function compressAndReupload(blobUrl) {
  // Fetch original
  const res = await fetch(blobUrl);
  const originalBuffer = Buffer.from(await res.arrayBuffer());
  const originalSize = originalBuffer.length;

  // Process with sharp
  const metadata = await sharp(originalBuffer).metadata();
  let pipeline = sharp(originalBuffer).rotate();

  if ((metadata.width || 0) > MAX_DIMENSION || (metadata.height || 0) > MAX_DIMENSION) {
    pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const optimizedBuffer = await pipeline
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const finalMeta = await sharp(optimizedBuffer).metadata();

  // Extract dominant color
  const { dominant } = await sharp(optimizedBuffer)
    .resize(64, 64, { fit: "cover" })
    .stats();
  const dominantColor = `#${dominant.r.toString(16).padStart(2, "0")}${dominant.g.toString(16).padStart(2, "0")}${dominant.b.toString(16).padStart(2, "0")}`;

  // Upload optimized version to Vercel Blob
  const filename = blobUrl.split("/").pop()?.replace(/\.[^.]+$/, "") || "photo";
  const uploadRes = await fetch(`https://blob.vercel-storage.com/${filename}.webp`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${BLOB_TOKEN}`,
      "x-api-version": "7",
      "x-content-type": "image/webp",
      "x-cache-control-max-age": "31536000",
    },
    body: optimizedBuffer,
  });

  if (!uploadRes.ok) {
    throw new Error(`Blob upload failed: ${uploadRes.status} ${await uploadRes.text()}`);
  }

  const uploadData = await uploadRes.json();

  // Delete original
  try {
    await fetch(`https://blob.vercel-storage.com/delete`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${BLOB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ urls: [blobUrl] }),
    });
  } catch {
    // ignore
  }

  return {
    newUrl: uploadData.url,
    width: finalMeta.width,
    height: finalMeta.height,
    dominantColor,
    originalSize,
    optimizedSize: optimizedBuffer.length,
  };
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

async function main() {
  const { rows } = await pool.query(`
    SELECT id, blob_url FROM media_items
    WHERE type = 'photo' AND blob_url IS NOT NULL
    ORDER BY id
  `);

  console.log(`Found ${rows.length} photos to compress.\n`);

  let totalOriginal = 0;
  let totalOptimized = 0;
  let succeeded = 0;
  let failed = 0;

  for (const row of rows) {
    process.stdout.write(`  #${row.id}: `);
    try {
      const result = await compressAndReupload(row.blob_url);

      await pool.query(
        `UPDATE media_items SET blob_url = $1, width = $2, height = $3, dominant_color = $4 WHERE id = $5`,
        [result.newUrl, result.width, result.height, result.dominantColor, row.id]
      );

      totalOriginal += result.originalSize;
      totalOptimized += result.optimizedSize;
      succeeded++;

      const savings = ((1 - result.optimizedSize / result.originalSize) * 100).toFixed(0);
      console.log(`${formatBytes(result.originalSize)} → ${formatBytes(result.optimizedSize)} (${savings}% smaller) → ${result.dominantColor}`);
    } catch (err) {
      failed++;
      console.log(`FAILED: ${err.message}`);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Compressed: ${succeeded}/${rows.length} (${failed} failed)`);
  console.log(`Total: ${formatBytes(totalOriginal)} → ${formatBytes(totalOptimized)} (${((1 - totalOptimized / totalOriginal) * 100).toFixed(0)}% smaller)`);

  await pool.end();
}

main().catch(console.error);
