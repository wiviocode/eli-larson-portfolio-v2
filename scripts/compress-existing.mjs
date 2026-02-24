/**
 * Compresses all existing photos to optimized WebP using R2.
 *
 * Run with: node scripts/compress-existing.mjs
 * Requires POSTGRES_URL and R2_* vars in .env.local
 */

import { readFileSync } from "fs";
import { randomUUID } from "crypto";
import { createPool } from "@vercel/postgres";
import sharp from "sharp";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Load .env.local
const envFile = readFileSync(".env.local", "utf8");
const envVars = {};
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^"|"$/g, "");
}

const pool = createPool({ connectionString: envVars.POSTGRES_URL });

const s3 = new S3Client({
  region: "auto",
  endpoint: envVars.R2_ENDPOINT,
  credentials: {
    accessKeyId: envVars.R2_ACCESS_KEY_ID,
    secretAccessKey: envVars.R2_SECRET_ACCESS_KEY,
  },
});
const BUCKET = envVars.R2_BUCKET_NAME;
const PUBLIC_URL = envVars.R2_PUBLIC_URL;

const MAX_DIMENSION = 2400;
const WEBP_QUALITY = 82;
const HQ_MAX_DIMENSION = 4096;
const HQ_WEBP_QUALITY = 95;

async function compressAndReupload(blobUrl) {
  // Fetch original (could be Vercel Blob or R2)
  const res = await fetch(blobUrl);
  const originalBuffer = Buffer.from(await res.arrayBuffer());
  const originalSize = originalBuffer.length;

  // Process with sharp
  const metadata = await sharp(originalBuffer).metadata();

  // Standard version
  let stdPipeline = sharp(originalBuffer).rotate();
  if ((metadata.width || 0) > MAX_DIMENSION || (metadata.height || 0) > MAX_DIMENSION) {
    stdPipeline = stdPipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  const stdBuffer = await stdPipeline.webp({ quality: WEBP_QUALITY }).toBuffer();

  // HQ version
  let hqPipeline = sharp(originalBuffer).rotate();
  if ((metadata.width || 0) > HQ_MAX_DIMENSION || (metadata.height || 0) > HQ_MAX_DIMENSION) {
    hqPipeline = hqPipeline.resize(HQ_MAX_DIMENSION, HQ_MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  const hqBuffer = await hqPipeline.webp({ quality: HQ_WEBP_QUALITY }).toBuffer();

  const finalMeta = await sharp(stdBuffer).metadata();

  // Extract dominant color
  const { dominant } = await sharp(stdBuffer)
    .resize(64, 64, { fit: "cover" })
    .stats();
  const dominantColor = `#${dominant.r.toString(16).padStart(2, "0")}${dominant.g.toString(16).padStart(2, "0")}${dominant.b.toString(16).padStart(2, "0")}`;

  // Upload both versions to R2
  const id = randomUUID();
  const stdKey = `photos/${id}.webp`;
  const hqKey = `photos/${id}-hq.webp`;

  await Promise.all([
    s3.send(new PutObjectCommand({
      Bucket: BUCKET, Key: stdKey, Body: stdBuffer, ContentType: "image/webp",
    })),
    s3.send(new PutObjectCommand({
      Bucket: BUCKET, Key: hqKey, Body: hqBuffer, ContentType: "image/webp",
    })),
  ]);

  return {
    newUrl: `${PUBLIC_URL}/${stdKey}`,
    hqUrl: `${PUBLIC_URL}/${hqKey}`,
    width: finalMeta.width,
    height: finalMeta.height,
    dominantColor,
    originalSize,
    optimizedSize: stdBuffer.length,
  };
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

async function main() {
  const { rows } = await pool.query(`
    SELECT id, blob_url, hq_blob_url FROM media_items
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
        `UPDATE media_items SET blob_url = $1, hq_blob_url = $2, width = $3, height = $4, dominant_color = $5 WHERE id = $6`,
        [result.newUrl, result.hqUrl, result.width, result.height, result.dominantColor, row.id]
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
  if (totalOriginal > 0) {
    console.log(`Total: ${formatBytes(totalOriginal)} → ${formatBytes(totalOptimized)} (${((1 - totalOptimized / totalOriginal) * 100).toFixed(0)}% smaller)`);
  }

  await pool.end();
}

main().catch(console.error);
