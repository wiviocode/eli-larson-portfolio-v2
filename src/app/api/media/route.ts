import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mediaItems } from "@/db/schema";
import { asc, max } from "drizzle-orm";
import sharp from "sharp";
import { put, del } from "@vercel/blob";

const MAX_DIMENSION = 2400; // max px on longest side (retina-friendly)
const WEBP_QUALITY = 82; // good balance of quality vs file size

async function optimizePhoto(originalUrl: string) {
  const res = await fetch(originalUrl);
  const originalBuffer = Buffer.from(await res.arrayBuffer());

  // Get original metadata
  const metadata = await sharp(originalBuffer).metadata();
  const origW = metadata.width || 1200;
  const origH = metadata.height || 800;

  // Resize if larger than max, always convert to WebP
  let pipeline = sharp(originalBuffer).rotate(); // .rotate() auto-orients from EXIF

  if (origW > MAX_DIMENSION || origH > MAX_DIMENSION) {
    pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const optimizedBuffer = await pipeline
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  // Get final dimensions
  const finalMeta = await sharp(optimizedBuffer).metadata();
  const width = finalMeta.width || origW;
  const height = finalMeta.height || origH;

  // Extract dominant color from the optimized buffer
  const { dominant } = await sharp(optimizedBuffer)
    .resize(64, 64, { fit: "cover" })
    .stats();
  const dominantColor = `#${dominant.r.toString(16).padStart(2, "0")}${dominant.g.toString(16).padStart(2, "0")}${dominant.b.toString(16).padStart(2, "0")}`;

  // Upload optimized version to Blob
  const filename = originalUrl.split("/").pop()?.replace(/\.[^.]+$/, "") || "photo";
  const blob = await put(`${filename}.webp`, optimizedBuffer, {
    access: "public",
    contentType: "image/webp",
  });

  // Delete the original uncompressed blob
  try {
    await del(originalUrl);
  } catch {
    // Original may already be gone
  }

  return {
    blobUrl: blob.url,
    width,
    height,
    dominantColor,
    originalSize: originalBuffer.length,
    optimizedSize: optimizedBuffer.length,
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

  // Auto-increment sortOrder
  const [result] = await db
    .select({ maxOrder: max(mediaItems.sortOrder) })
    .from(mediaItems);
  const nextOrder = (result?.maxOrder ?? -1) + 1;

  let finalValues = { ...body, sortOrder: nextOrder };

  // Optimize photos: resize, compress to WebP, extract dominant color
  if (body.type === "photo" && body.blobUrl) {
    try {
      const optimized = await optimizePhoto(body.blobUrl);
      finalValues = {
        ...finalValues,
        blobUrl: optimized.blobUrl,
        width: optimized.width,
        height: optimized.height,
        dominantColor: optimized.dominantColor,
      };
    } catch (err) {
      console.error("Photo optimization failed, using original:", err);
      // Fall back to original — still try to get dominant color
      try {
        const res = await fetch(body.blobUrl);
        const buf = Buffer.from(await res.arrayBuffer());
        const { dominant } = await sharp(buf).resize(64, 64, { fit: "cover" }).stats();
        finalValues.dominantColor = `#${dominant.r.toString(16).padStart(2, "0")}${dominant.g.toString(16).padStart(2, "0")}${dominant.b.toString(16).padStart(2, "0")}`;
      } catch {
        // ignore
      }
    }
  }

  const [item] = await db
    .insert(mediaItems)
    .values(finalValues)
    .returning();

  return NextResponse.json(item, { status: 201 });
}
