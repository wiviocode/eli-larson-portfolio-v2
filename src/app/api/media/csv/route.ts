import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mediaItems } from "@/db/schema";
import { asc, sql } from "drizzle-orm";
import { revalidatePublicPages } from "@/lib/revalidate";
import { normalizeQuotes } from "@/lib/utils";

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  fields.push(current);
  return fields;
}

export async function GET() {
  const items = await db
    .select()
    .from(mediaItems)
    .orderBy(asc(mediaItems.sortOrder));

  const header = "id,fileName,caption,altText";
  const rows = items.map((item) => {
    const id = String(item.id);
    const fileName = escapeCsvField(item.fileName || "");
    const caption = escapeCsvField(item.caption || "");
    const altText = escapeCsvField(item.altText || "");
    return `${id},${fileName},${caption},${altText}`;
  });

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="captions.csv"',
    },
  });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 });
  }

  const headerFields = parseCsvLine(lines[0]).map((f) => f.trim().toLowerCase());
  const idIdx = headerFields.indexOf("id");
  const captionIdx = headerFields.indexOf("caption");
  const altTextIdx = headerFields.indexOf("alttext");

  if (idIdx === -1) {
    return NextResponse.json({ error: "CSV must contain an 'id' column" }, { status: 400 });
  }

  // Collect rows first (last row wins for duplicate ids), then apply them all
  // in a single UPDATE instead of one statement per row.
  const errors: string[] = [];
  const rows = new Map<
    number,
    { row: number; caption: string | null; altText: string | null }
  >();

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const id = parseInt(fields[idIdx]?.trim());

    if (isNaN(id)) {
      errors.push(`Row ${i + 1}: invalid id`);
      continue;
    }

    const caption =
      captionIdx !== -1 && fields[captionIdx] !== undefined
        ? normalizeQuotes(fields[captionIdx].trim())
        : null;
    const altText =
      altTextIdx !== -1 && fields[altTextIdx] !== undefined
        ? normalizeQuotes(fields[altTextIdx].trim())
        : null;

    if (caption === null && altText === null) continue;

    rows.delete(id);
    rows.set(id, { row: i + 1, caption, altText });
  }

  let updated = 0;

  if (rows.size > 0) {
    const values = sql.join(
      [...rows].map(
        ([id, r]) =>
          sql`(${id}::int, ${r.caption}::text, ${r.altText}::text, ${r.caption !== null}::boolean, ${r.altText !== null}::boolean)`
      ),
      sql`, `
    );
    const result = await db.execute<{ id: number }>(sql`
      UPDATE media_items AS m
      SET
        caption = CASE WHEN v.set_caption THEN v.caption ELSE m.caption END,
        alt_text = CASE WHEN v.set_alt THEN v.alt_text ELSE m.alt_text END,
        updated_at = now()
      FROM (VALUES ${values}) AS v(id, caption, alt_text, set_caption, set_alt)
      WHERE m.id = v.id
      RETURNING m.id
    `);

    const matched = new Set(result.rows.map((r) => Number(r.id)));
    updated = matched.size;
    for (const [id, r] of rows) {
      if (!matched.has(id)) errors.push(`Row ${r.row}: no item with id ${id}`);
    }
  }

  if (updated > 0) {
    revalidatePublicPages();
  }

  return NextResponse.json({ updated, errors });
}
