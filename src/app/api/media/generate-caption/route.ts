import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { normalizeQuotes } from "@/lib/utils";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert AP-style photo caption writer for a professional photojournalist's portfolio.

Structure:
- First sentence: present tense. Describe the visible action or subject — who, what, where.
- Second sentence: past tense. Provide context and background — when, why, result.

Style rules:
- Use full names on first reference (e.g. "Nebraska Cornhuskers sophomore guard Sam Hoiberg"), team name or last name after.
- Locations: city and state on first reference using AP state abbreviations (Neb., Kan., Mo., etc.). Full state name for states AP doesn't abbreviate (Iowa, Ohio, Texas, etc.).
- Dates in AP format: day of week, abbreviated month, day, year (e.g. "on Saturday, Dec. 7, 2025").
- No editorializing, no hyperbole, no opinion words (amazing, incredible, etc.).
- When describing groups of people, use "left" and "right" for spatial reference.
- Never start a caption with a bare proper name — lead with a descriptor (team, title, position).
- No photo credit line or photographer attribution in the caption.
- One paragraph, typically 2-4 sentences.

Web search:
- Use web search to verify and fill in details from the photographer's notes: full names, jersey numbers, event names, scores, dates, venues, records, and historical significance.
- If notes mention a game or event, search for the actual result and include it.

Metadata:
- If EXIF or file metadata includes a date, use it as the photo date. Do not mention camera settings.
- Use the filename for clues about the subject if helpful.

CRITICAL: Your final output must be ONLY the caption text itself — one paragraph, no preamble, no reasoning, no questions, no commentary, no "Let me search" narration, no markdown. If you cannot verify a detail, write the best caption you can with what you know. Never ask clarifying questions — just write the caption.`;

const EXAMPLES = `
Example 1: "Nebraska Cornhuskers freshman forward Braden Frager dribbles a basketball as his shadow is cast across a tunnel wall at Pinnacle Bank Arena in Lincoln, Neb., on Sunday, Dec. 7, 2025. Nebraska defeated Creighton 71-50, extending the Cornhuskers' unbeaten record to 9-0 with their 13th consecutive victory."

Example 2: "Nebraska Cornhuskers senior guard Sam Hoiberg drives to the basket for a layup against Kansas State during the Hall of Fame Classic championship game at T-Mobile Center in Kansas City, Mo. Hoiberg's free throw with 0.6 seconds remaining lifted Nebraska to an 86-85 win over Kansas State on Friday, Nov. 21, 2025, giving Nebraska the Hall of Fame Classic title for the first time in program history."

Example 3: "A Sumner-Eddyville-Miller ball carrier delivers a stiff-arm to a Stuart defender while fighting for extra yardage during the Class D-6 six-man state championship game at Ron and Carol Cope Stadium in Kearney, Neb. Stuart rallied from an 18-point deficit to defeat Sumner-Eddyville-Miller 42-38 on Nov. 22, 2024, claiming the program's first state football title."

Example 4: "Nebraska Cornhuskers libero Laney Choboy lets out a scream after winning a set during a Big Ten match against the Rutgers Scarlet Knights at the Bob Devaney Sports Center in Lincoln, Neb. The No. 2 Huskers swept the Scarlet Knights 25-15, 25-16, 25-12 in front of 8,500 fans on Oct. 12, 2024."

Example 5: "Silhouetted against a summer sky, young fans perch atop a chain-link fence to watch the action during social media influencer Cam Wilder's basketball park takeover in Lincoln, Neb. The impromptu event on July 7, 2024, drew an estimated crowd of more than 1,000 people to the courts near South Street and Normal Boulevard before police shut it down due to safety concerns."`;

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, note, metadata } = await req.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 }
      );
    }

    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 400 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const mediaType = contentType.startsWith("image/")
      ? (contentType as "image/jpeg" | "image/png" | "image/gif" | "image/webp")
      : "image/jpeg";

    // Build user message with metadata and notes
    const parts: string[] = [];

    parts.push("Write an AP-style caption for this photo.");

    if (metadata) {
      const metaParts: string[] = [];
      if (metadata.fileName) metaParts.push(`Filename: ${metadata.fileName}`);
      if (metadata.width && metadata.height) metaParts.push(`Dimensions: ${metadata.width}x${metadata.height}`);
      if (metadata.createdAt) metaParts.push(`Upload date: ${metadata.createdAt}`);
      if (metadata.altText) metaParts.push(`Alt text: ${metadata.altText}`);
      if (metaParts.length > 0) {
        parts.push(`\nPhoto metadata:\n${metaParts.join("\n")}`);
      }
    }

    if (note) {
      parts.push(`\nPhotographer's notes: ${note}`);
    }

    parts.push(`\nCaption examples to match:\n${EXAMPLES}`);

    const userMessage = parts.join("\n");

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 3,
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: "text",
              text: userMessage,
            },
          ],
        },
      ],
    });

    // With web search, the response has text blocks interleaved with search
    // tool_use/result blocks. Collect only text blocks after the last search
    // result — that's the final caption. If no searches, take all text.
    const blocks = response.content;
    let lastSearchIdx = -1;
    for (let i = blocks.length - 1; i >= 0; i--) {
      if (blocks[i].type === "web_search_tool_result") {
        lastSearchIdx = i;
        break;
      }
    }
    const caption = blocks
      .slice(lastSearchIdx + 1)
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text.trim())
      .filter((t) => t.length > 0)
      .join(" ");

    return NextResponse.json({ caption: normalizeQuotes(caption) });
  } catch (error) {
    console.error("Caption generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate caption" },
      { status: 500 }
    );
  }
}
