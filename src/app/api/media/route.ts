import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mediaItems } from "@/db/schema";
import { asc, max } from "drizzle-orm";

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

  const [item] = await db
    .insert(mediaItems)
    .values({
      ...body,
      sortOrder: nextOrder,
    })
    .returning();

  return NextResponse.json(item, { status: 201 });
}
