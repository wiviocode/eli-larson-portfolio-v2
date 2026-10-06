import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function PUT(req: NextRequest) {
  const items: { id: number; sortOrder: number }[] = await req.json();

  if (
    !Array.isArray(items) ||
    items.some((i) => !Number.isInteger(i?.id) || !Number.isInteger(i?.sortOrder))
  ) {
    return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  }
  if (items.length === 0) return NextResponse.json({ success: true });

  // One UPDATE ... FROM (VALUES ...) instead of one statement per item.
  const values = sql.join(
    items.map((i) => sql`(${i.id}::int, ${i.sortOrder}::int)`),
    sql`, `
  );
  await db.execute(sql`
    UPDATE media_items AS m
    SET sort_order = v.sort_order, updated_at = now()
    FROM (VALUES ${values}) AS v(id, sort_order)
    WHERE m.id = v.id AND m.sort_order IS DISTINCT FROM v.sort_order
  `);

  revalidatePublicPages();

  return NextResponse.json({ success: true });
}
