import { NextResponse } from "next/server";
import { db } from "@/db";
import { mediaItems } from "@/db/schema";
import { isNull, sql } from "drizzle-orm";
import { revalidatePublicPages } from "@/lib/revalidate";
import sharp from "sharp";

export async function POST() {
  const items = await db
    .select({ id: mediaItems.id, blobUrl: mediaItems.blobUrl })
    .from(mediaItems)
    .where(isNull(mediaItems.dominantColor));

  const needsFix = items.filter((i) => i.blobUrl);
  const colors: { id: number; color: string }[] = [];

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

      colors.push({ id: item.id, color });
    } catch {
      // skip failed items
    }
  }

  // Write every color in one statement instead of one UPDATE per item.
  if (colors.length > 0) {
    const values = sql.join(
      colors.map((c) => sql`(${c.id}::int, ${c.color}::text)`),
      sql`, `
    );
    await db.execute(sql`
      UPDATE media_items AS m
      SET dominant_color = v.color
      FROM (VALUES ${values}) AS v(id, color)
      WHERE m.id = v.id
    `);
    revalidatePublicPages();
  }

  return NextResponse.json({ fixed: colors.length, total: needsFix.length });
}
