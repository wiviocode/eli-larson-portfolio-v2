import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { mediaItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest) {
  const items: { id: number; sortOrder: number }[] = await req.json();

  await db.transaction(async (tx) => {
    for (const item of items) {
      await tx
        .update(mediaItems)
        .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
        .where(eq(mediaItems.id, item.id));
    }
  });

  revalidatePath("/");

  return NextResponse.json({ success: true });
}
