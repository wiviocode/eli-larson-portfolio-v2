import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/db";
import { mediaItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { fetchBuffer, uploadBuffer, keyFromUrl } from "@/lib/r2";
import { cropPhoto, InvalidPhotoCrop, parsePhotoCrop, photoDominantColor } from "@/lib/photo-processing";
import { randomUUID } from "crypto";

export const maxDuration = 60;

function mediaId(value: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new InvalidPhotoCrop("Invalid media ID.");
  }
  return id;
}

function cropError(error: unknown) {
  if (error instanceof InvalidPhotoCrop || error instanceof SyntaxError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error("Photo crop failed:", error);
  return NextResponse.json({ error: "Unable to process this photo. Please try again." }, { status: 500 });
}

/** Apply a crop to the uncropped master; keep full display resolution. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = mediaId((await params).id);
    const crop = parsePhotoCrop(await req.json());
    const [item] = await db.select().from(mediaItems).where(eq(mediaItems.id, id));
    if (!item || item.type !== "photo") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const sourceUrl = item.hqBlobUrl || item.blobUrl;
    const key = sourceUrl && keyFromUrl(sourceUrl);
    if (!key) {
      return NextResponse.json({ error: "No supported source image" }, { status: 400 });
    }

    const cropped = await cropPhoto(await fetchBuffer(key), crop);
    const newUrl = await uploadBuffer(`photos/${randomUUID()}.webp`, cropped.buffer, "image/webp");

    // Preserve the master even for legacy uploads with no HQ field. Keep old
    // immutable display URLs available to visitors with a cached gallery page.
    const [updated] = await db.update(mediaItems).set({
      blobUrl: newUrl,
      hqBlobUrl: item.hqBlobUrl || sourceUrl,
      width: cropped.width,
      height: cropped.height,
      dominantColor: cropped.dominantColor,
      cropData: JSON.stringify(crop),
      updatedAt: new Date(),
    }).where(eq(mediaItems.id, id)).returning();

    revalidatePublicPages();
    return NextResponse.json(updated);
  } catch (error) {
    return cropError(error);
  }
}

/** Restore the uncropped master directly, without another lossy encode. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = mediaId((await params).id);
    const [item] = await db.select().from(mediaItems).where(eq(mediaItems.id, id));
    if (!item || item.type !== "photo" || !item.hqBlobUrl) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const key = keyFromUrl(item.hqBlobUrl);
    if (!key) {
      return NextResponse.json({ error: "Invalid source URL" }, { status: 400 });
    }

    const source = await fetchBuffer(key);
    const metadata = await sharp(source).metadata();
    const dominantColor = await photoDominantColor(source);
    const [updated] = await db.update(mediaItems).set({
      blobUrl: item.hqBlobUrl,
      width: metadata.autoOrient.width,
      height: metadata.autoOrient.height,
      dominantColor,
      cropData: null,
      updatedAt: new Date(),
    }).where(eq(mediaItems.id, id)).returning();

    revalidatePublicPages();
    return NextResponse.json(updated);
  } catch (error) {
    return cropError(error);
  }
}
