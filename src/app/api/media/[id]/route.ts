import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mediaItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { del } from "@vercel/blob";

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

  // Delete blob if exists
  if (item.blobUrl) {
    try {
      await del(item.blobUrl);
    } catch {
      // Blob may already be deleted
    }
  }

  await db.delete(mediaItems).where(eq(mediaItems.id, parseInt(id)));

  return NextResponse.json({ success: true });
}
