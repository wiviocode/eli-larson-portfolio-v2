import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { mediaItems } from "@/db/schema";
import { asc, max } from "drizzle-orm";
import sharp from "sharp";
import { fetchBuffer, uploadBuffer, deleteByUrl, publicUrl } from "@/lib/r2";
import { randomUUID } from "crypto";

const MAX_DIMENSION = 2400;
const WEBP_QUALITY = 82;
const HQ_MAX_DIMENSION = 4096;
const HQ_WEBP_QUALITY = 95;

async function optimizePhoto(rawObjectKey: string) {
  const originalBuffer = await fetchBuffer(rawObjectKey);

  const metadata = await sharp(originalBuffer).metadata();
  const origW = metadata.width || 1200;
  const origH = metadata.height || 800;
  const oriented = sharp(originalBuffer).rotate();

  // Standard gallery version — 2400px, q82
  let stdPipeline = oriented.clone();
  if (origW > MAX_DIMENSION || origH > MAX_DIMENSION) {
    stdPipeline = stdPipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  const stdBuffer = await stdPipeline.webp({ quality: WEBP_QUALITY }).toBuffer();

  // High-quality version — 4096px, q95
  let hqPipeline = sharp(originalBuffer).rotate();
  if (origW > HQ_MAX_DIMENSION || origH > HQ_MAX_DIMENSION) {
    hqPipeline = hqPipeline.resize(HQ_MAX_DIMENSION, HQ_MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  const hqBuffer = await hqPipeline.webp({ quality: HQ_WEBP_QUALITY }).toBuffer();

  // Get standard dimensions
  const finalMeta = await sharp(stdBuffer).metadata();
  const width = finalMeta.width || origW;
  const height = finalMeta.height || origH;

  // Dominant color
  const { dominant } = await sharp(stdBuffer)
    .resize(64, 64, { fit: "cover" })
    .stats();
  const dominantColor = `#${dominant.r.toString(16).padStart(2, "0")}${dominant.g.toString(16).padStart(2, "0")}${dominant.b.toString(16).padStart(2, "0")}`;

  // Upload both versions to R2
  const id = randomUUID();
  const [stdUrl, hqUrl] = await Promise.all([
    uploadBuffer(`photos/${id}.webp`, stdBuffer, "image/webp"),
    uploadBuffer(`photos/${id}-hq.webp`, hqBuffer, "image/webp"),
  ]);

  // Delete raw upload
  try {
    await deleteByUrl(publicUrl(rawObjectKey));
  } catch { /* ignore */ }

  return {
    blobUrl: stdUrl,
    hqBlobUrl: hqUrl,
    width,
    height,
    dominantColor,
  };
}

export async function GET() {
  try {
    const items = await db
      .select()
      .from(mediaItems)
      .orderBy(asc(mediaItems.sortOrder));
    return NextResponse.json(items);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const [result] = await db
    .select({ maxOrder: max(mediaItems.sortOrder) })
    .from(mediaItems);
  const nextOrder = (result?.maxOrder ?? -1) + 1;

  let finalValues = { ...body, sortOrder: nextOrder };

  // Remove rawObjectKey from the DB values — it's only used for processing
  delete finalValues.rawObjectKey;

  if (body.type === "photo" && body.rawObjectKey) {
    try {
      const optimized = await optimizePhoto(body.rawObjectKey);
      finalValues = {
        ...finalValues,
        blobUrl: optimized.blobUrl,
        hqBlobUrl: optimized.hqBlobUrl,
        width: optimized.width,
        height: optimized.height,
        dominantColor: optimized.dominantColor,
      };
    } catch (err) {
      console.error("Photo optimization failed, using raw upload:", err);
      // Fall back to raw upload URL
      finalValues.blobUrl = publicUrl(body.rawObjectKey);
      try {
        const buf = await fetchBuffer(body.rawObjectKey);
        const { dominant } = await sharp(buf).resize(64, 64, { fit: "cover" }).stats();
        finalValues.dominantColor = `#${dominant.r.toString(16).padStart(2, "0")}${dominant.g.toString(16).padStart(2, "0")}${dominant.b.toString(16).padStart(2, "0")}`;
      } catch { /* ignore */ }
    }
  }

  const [item] = await db
    .insert(mediaItems)
    .values(finalValues)
    .returning();

  revalidatePath("/");
  return NextResponse.json(item, { status: 201 });
}
