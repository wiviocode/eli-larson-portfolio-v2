import { NextResponse } from "next/server";
import { db } from "@/db";
import { mediaItems } from "@/db/schema";
import { isNull, eq } from "drizzle-orm";
import sharp from "sharp";

export async function POST() {
  const items = await db
    .select()
    .from(mediaItems)
    .where(isNull(mediaItems.dominantColor));

  const needsFix = items.filter((i) => i.blobUrl);
  let fixed = 0;

  for (const item of needsFix) {
    try {
      const res = await fetch(item.blobUrl!);
      const buf = Buffer.from(await res.arrayBuffer());
      const { dominant } = await sharp(buf)
        .resize(64, 64, { fit: "cover" })
        .stats();
      const color = `#${[dominant.r, dominant.g, dominant.b]
        .map((c) => c.toString(16).padStart(2, "0"))
        .join("")}`;

      await db
        .update(mediaItems)
        .set({ dominantColor: color })
        .where(eq(mediaItems.id, item.id));
      fixed++;
    } catch {
      // skip failed items
    }
  }

  return NextResponse.json({ fixed, total: needsFix.length });
}
