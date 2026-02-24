import { NextRequest, NextResponse } from "next/server";
import { createPresignedUpload } from "@/lib/r2";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

const MAX_SIZE = 200 * 1024 * 1024; // 200MB

export async function POST(req: NextRequest) {
  try {
    const { fileName, contentType, size } = await req.json();

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: `File type not allowed: ${contentType}` },
        { status: 400 }
      );
    }

    if (size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 200MB)" },
        { status: 400 }
      );
    }

    const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
    const objectKey = `uploads/${randomUUID()}.${ext}`;

    const presignedUrl = await createPresignedUpload(objectKey, contentType);

    return NextResponse.json({ presignedUrl, objectKey });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
