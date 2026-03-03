import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mediaItems } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
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

  let updated = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const id = parseInt(fields[idIdx]?.trim());

    if (isNaN(id)) {
      errors.push(`Row ${i + 1}: invalid id`);
      continue;
    }

    const updates: Record<string, string | Date> = { updatedAt: new Date() };

    if (captionIdx !== -1 && fields[captionIdx] !== undefined) {
      updates.caption = normalizeQuotes(fields[captionIdx].trim());
    }
    if (altTextIdx !== -1 && fields[altTextIdx] !== undefined) {
      updates.altText = normalizeQuotes(fields[altTextIdx].trim());
    }

    if (Object.keys(updates).length <= 1) continue; // only updatedAt

    const [item] = await db
      .update(mediaItems)
      .set(updates)
      .where(eq(mediaItems.id, id))
      .returning();

    if (item) {
      updated++;
    } else {
      errors.push(`Row ${i + 1}: no item with id ${id}`);
    }
  }

  if (updated > 0) {
    revalidatePath("/");
  }

  return NextResponse.json({ updated, errors });
}
