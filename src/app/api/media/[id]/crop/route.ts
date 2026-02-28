import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mediaItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { fetchBuffer, uploadBuffer, deleteByUrl, keyFromUrl } from "@/lib/r2";
import { randomUUID } from "crypto";

const MAX_DIMENSION = 2400;
const WEBP_QUALITY = 82;

/** POST — Apply crop to an image */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { x, y, width, height, rotation = 0 } = await req.json();

  const [item] = await db
    .select()
    .from(mediaItems)
    .where(eq(mediaItems.id, parseInt(id)));

  if (!item || item.type !== "photo") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sourceUrl = item.hqBlobUrl || item.blobUrl;
  if (!sourceUrl) {
    return NextResponse.json({ error: "No source image" }, { status: 400 });
  }

  const key = keyFromUrl(sourceUrl);
  if (!key) {
    return NextResponse.json({ error: "Invalid source URL" }, { status: 400 });
  }

  const sourceBuffer = await fetchBuffer(key);

  // Rotate first (so crop coordinates align with rotated image), then crop
  let pipeline = sharp(sourceBuffer);
  if (rotation !== 0) {
    pipeline = pipeline.rotate(rotation);
  }
  pipeline = pipeline.extract({ left: Math.round(x), top: Math.round(y), width: Math.round(width), height: Math.round(height) });

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const croppedBuffer = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();

  // Get final dimensions
  const meta = await sharp(croppedBuffer).metadata();
  const finalWidth = meta.width || width;
  const finalHeight = meta.height || height;

  // Dominant color
  const { dominant } = await sharp(croppedBuffer)
    .resize(64, 64, { fit: "cover" })
    .stats();
  const dominantColor = `#${dominant.r.toString(16).padStart(2, "0")}${dominant.g.toString(16).padStart(2, "0")}${dominant.b.toString(16).padStart(2, "0")}`;

  // Upload new cropped version
  const newKey = `photos/${randomUUID()}.webp`;
  const newUrl = await uploadBuffer(newKey, croppedBuffer, "image/webp");

  // Delete old blobUrl (but not hqBlobUrl)
  if (item.blobUrl && item.blobUrl !== item.hqBlobUrl) {
    try { await deleteByUrl(item.blobUrl); } catch { /* ignore */ }
  }

  // Update DB
  const cropData = JSON.stringify({ x, y, width, height, rotation });
  const [updated] = await db
    .update(mediaItems)
    .set({
      blobUrl: newUrl,
      width: finalWidth,
      height: finalHeight,
      dominantColor,
      cropData,
      updatedAt: new Date(),
    })
    .where(eq(mediaItems.id, parseInt(id)))
    .returning();

  return NextResponse.json(updated);
}

/** DELETE — Revert crop (regenerate blobUrl from hqBlobUrl without cropping) */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [item] = await db
    .select()
    .from(mediaItems)
    .where(eq(mediaItems.id, parseInt(id)));

  if (!item || item.type !== "photo" || !item.hqBlobUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const key = keyFromUrl(item.hqBlobUrl);
  if (!key) {
    return NextResponse.json({ error: "Invalid source URL" }, { status: 400 });
  }

  const sourceBuffer = await fetchBuffer(key);
  const meta = await sharp(sourceBuffer).metadata();
  const origW = meta.width || 1200;
  const origH = meta.height || 800;

  // Resize to standard gallery size (no crop)
  let pipeline = sharp(sourceBuffer).rotate();
  if (origW > MAX_DIMENSION || origH > MAX_DIMENSION) {
    pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const stdBuffer = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();
  const finalMeta = await sharp(stdBuffer).metadata();
  const finalWidth = finalMeta.width || origW;
  const finalHeight = finalMeta.height || origH;

  // Dominant color
  const { dominant } = await sharp(stdBuffer)
    .resize(64, 64, { fit: "cover" })
    .stats();
  const dominantColor = `#${dominant.r.toString(16).padStart(2, "0")}${dominant.g.toString(16).padStart(2, "0")}${dominant.b.toString(16).padStart(2, "0")}`;

  // Upload new uncropped version
  const newKey = `photos/${randomUUID()}.webp`;
  const newUrl = await uploadBuffer(newKey, stdBuffer, "image/webp");

  // Delete old cropped blobUrl
  if (item.blobUrl && item.blobUrl !== item.hqBlobUrl) {
    try { await deleteByUrl(item.blobUrl); } catch { /* ignore */ }
  }

  // Update DB — clear cropData
  const [updated] = await db
    .update(mediaItems)
    .set({
      blobUrl: newUrl,
      width: finalWidth,
      height: finalHeight,
      dominantColor,
      cropData: null,
      updatedAt: new Date(),
    })
    .where(eq(mediaItems.id, parseInt(id)))
    .returning();

  return NextResponse.json(updated);
}
