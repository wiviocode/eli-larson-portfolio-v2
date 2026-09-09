import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPublicMedia } from "@/lib/public-media";
import { getPresentation, savePresentation } from "@/lib/presentation-store";
import { parsePresentation } from "@/lib/presentation";
import { revalidatePublicPages } from "@/lib/revalidate";

export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [presentation, items] = await Promise.all([getPresentation(), getPublicMedia()]);
    return NextResponse.json({ ...presentation, items }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to load your presentation. Please try again." }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "Expected JSON" }, { status: 415 });
  let config;
  let revision: string | null;
  try {
    const body = await request.text();
    if (Buffer.byteLength(body) > 128_000) return NextResponse.json({ error: "Presentation is too large." }, { status: 413 });
    const input = JSON.parse(body);
    config = parsePresentation(input.config);
    if (input.revision !== null && (typeof input.revision !== "string" || !/^"[a-f0-9-]+"$/.test(input.revision))) throw new Error("Reload the page before saving.");
    revision = input.revision;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid presentation." }, { status: 400 });
  }
  try {
    const items = await getPublicMedia();
    const photoIds = new Set(items.filter(item => item.type === "photo" && item.blobUrl).map(item => item.id));
    const selected = [...config.editorPhotoIds, ...config.stories.flatMap(story => story.photoIds)];
    if (selected.some(id => !photoIds.has(id))) return NextResponse.json({ error: "Some selected photographs were removed. Remove the missing frames before saving." }, { status: 400 });
    const nextRevision = await savePresentation(config, revision);
    revalidatePublicPages();
    return NextResponse.json({ revision: nextRevision }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
    if (status === 412 || status === 409) return NextResponse.json({ error: "Another tab saved a newer edit. Reload this page before making further changes." }, { status: 409 });
    return NextResponse.json({ error: "Unable to save. Your changes are still here; please try again." }, { status: 503 });
  }
}
