import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mediaItems } from "@/db/schema";
import { asc, max } from "drizzle-orm";
import sharp from "sharp";

async function extractDominantColor(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const buffer = Buffer.from(await res.arrayBuffer());
    const { dominant } = await sharp(buffer).resize(64, 64, { fit: "cover" }).stats();
    const hex = `#${dominant.r.toString(16).padStart(2, "0")}${dominant.g.toString(16).padStart(2, "0")}${dominant.b.toString(16).padStart(2, "0")}`;
    return hex;
  } catch {
    return null;
  }
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

  // Extract dominant color for photos
  let dominantColor: string | null = null;
  if (body.type === "photo" && body.blobUrl) {
    dominantColor = await extractDominantColor(body.blobUrl);
  }

  const [item] = await db
    .insert(mediaItems)
    .values({
      ...body,
      dominantColor,
      sortOrder: nextOrder,
    })
    .returning();

  return NextResponse.json(item, { status: 201 });
}
