import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/db";
import { mediaItems } from "@/db/schema";
import { asc, max } from "drizzle-orm";
import sharp from "sharp";
import { fetchBuffer, uploadBuffer, deleteByUrl, publicUrl } from "@/lib/r2";
import { randomUUID } from "crypto";
import { photoDominantColor } from "@/lib/photo-processing";
import { prepareGraphic } from "@/lib/graphic-processing";
import { isMediaType } from "@/lib/media-library";

export const maxDuration = 60;

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
  const hqBuffer = await hqPipeline.webp({ quality: HQ_WEBP_QUALITY, smartSubsample: true }).toBuffer();

  // Get standard dimensions
  const finalMeta = await sharp(stdBuffer).metadata();
  const width = finalMeta.width || origW;
  const height = finalMeta.height || origH;

  // Dominant color
  const dominantColor = await photoDominantColor(stdBuffer);

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
    return NextResponse.json({ error: "Unable to load media." }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!isMediaType(body.type)) {
    return NextResponse.json({ error: "Choose Photos, Videos or Graphics." }, { status: 400 });
  }
  if (body.type === "graphic" && (typeof body.rawObjectKey !== "string" || !/^uploads\/[a-f0-9-]+\.[a-z0-9]+$/.test(body.rawObjectKey))) {
    return NextResponse.json({ error: "Upload a graphic before adding it to the library." }, { status: 400 });
  }

  const [result] = await db
    .select({ maxOrder: max(mediaItems.sortOrder) })
    .from(mediaItems);
  const nextOrder = (result?.maxOrder ?? -1) + 1;

  let finalValues = { ...body, sortOrder: nextOrder };

  // Remove rawObjectKey from the DB values — it's only used for processing
  delete finalValues.rawObjectKey;

  if (body.type === "graphic") {
    try {
      const source = await fetchBuffer(body.rawObjectKey);
      const { preview, width, height, extension, contentType } = await prepareGraphic(source);
      const graphicId = randomUUID();
      const blobUrl = await uploadBuffer(`graphics/${graphicId}.webp`, preview, "image/webp");
      const hqBlobUrl = await uploadBuffer(`graphics/${graphicId}-original.${extension}`, source, contentType);
      finalValues = {
        ...finalValues, blobUrl, width, height,
        // Preserve the original export, its transparency and native resolution.
        hqBlobUrl,
        dominantColor: "#f0f0f0", isFeatured: false,
      };
    } catch (error) {
      console.error("Graphic processing failed:", error);
      return NextResponse.json({ error: "Unable to process this graphic. Use a still PNG, JPEG, WebP or AVIF and try again." }, { status: 422 });
    }
  }

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
        finalValues.dominantColor = await photoDominantColor(buf);
      } catch { /* ignore */ }
    }
  }

  const [item] = await db
    .insert(mediaItems)
    .values(finalValues)
    .returning();

  // Graphics retain a byte-for-byte original under an immutable graphics key.
  // Only remove the temporary upload once both files and the DB row exist.
  if (body.type === "graphic") await deleteByUrl(publicUrl(body.rawObjectKey));

  revalidatePublicPages();
  return NextResponse.json(item, { status: 201 });
}
