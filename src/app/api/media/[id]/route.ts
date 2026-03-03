import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { mediaItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deleteByUrl } from "@/lib/r2";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // If setting featured, unset all others first
  if (body.isFeatured) {
    await db
      .update(mediaItems)
      .set({ isFeatured: false })
      .where(eq(mediaItems.isFeatured, true));
  }

  const [item] = await db
    .update(mediaItems)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(mediaItems.id, parseInt(id)))
    .returning();

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  revalidatePath("/");
  return NextResponse.json(item);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [item] = await db
    .select()
    .from(mediaItems)
    .where(eq(mediaItems.id, parseInt(id)));

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete both standard and HQ blobs (skips non-R2 URLs gracefully)
  if (item.blobUrl) {
    try { await deleteByUrl(item.blobUrl); } catch { /* ignore */ }
  }
  if (item.hqBlobUrl) {
    try { await deleteByUrl(item.hqBlobUrl); } catch { /* ignore */ }
  }

  await db.delete(mediaItems).where(eq(mediaItems.id, parseInt(id)));

  revalidatePath("/");
  return NextResponse.json({ success: true });
}
