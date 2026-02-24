import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert AP-style sports photography caption writer. You write formal, descriptive captions for sports and athletics photographs.

Your captions follow these rules:
- Written in present tense for the action, past tense for game results
- Include the full name of the athlete (if known), their jersey number, team, and position
- Describe the specific action visible in the photo
- Include the venue name, city, and state
- Include the date and context (opponent, score, significance)
- End with a factual detail about the result, record, or historical significance
- Use proper AP style (abbreviations, punctuation, state names)
- One paragraph, typically 2-4 sentences
- Professional journalism tone — no editorializing or hyperbole

Here are examples of the caption style to match:

Example 1: "Nebraska Cornhuskers freshman forward Braden Frager dribbles a basketball as his shadow is cast across a tunnel wall at Pinnacle Bank Arena in Lincoln, Nebraska, on Sunday, Dec. 7, 2025. Nebraska defeated Creighton 71-50, extending the Cornhuskers' unbeaten record to 9-0 with their 13th consecutive victory."

Example 2: "Nebraska Cornhuskers senior guard Sam Hoiberg drives to the basket for a layup against Kansas State during the Hall of Fame Classic championship game at T-Mobile Center in Kansas City, Missouri. Hoiberg's free throw with 0.6 seconds remaining lifted Nebraska to an 86-85 win over Kansas State in the championship game of the Hall of Fame Classic on Friday, Nov. 21, 2025, giving Nebraska the Hall of Fame Classic title for the first time in program history."

Example 3: "A Sumner-Eddyville-Miller ball carrier delivers a stiff-arm to a Stuart defender while fighting for extra yardage during the Class D-6 six-man state championship game at Ron and Carol Cope Stadium in Kearney, Neb. Stuart rallied from an 18-point deficit to defeat Sumner-Eddyville-Miller 42-38 on Nov. 22, 2024, claiming the program's first state football title."

Example 4: "Nebraska Cornhuskers libero Laney Choboy lets out a scream after winning a set during a Big Ten match against the Rutgers Scarlet Knights at the Bob Devaney Sports Center in Lincoln, Neb. The No. 2 Huskers swept the Scarlet Knights 25-15, 25-16, 25-12 in front of 8,500 fans on Oct. 12, 2024."

Example 5: "Silhouetted against a summer sky, young fans perch atop a chain-link fence to watch the action during social media influencer Cam Wilder's basketball park takeover in Lincoln, Neb. The impromptu event on July 7, 2024, drew an estimated crowd of more than 1,000 people to the courts near South Street and Normal Boulevard before police shut it down due to safety concerns."

Write a single caption paragraph for the provided image. If the user provides context notes, incorporate those details (names, dates, scores, event details) into the caption. Describe what is actually visible in the image and combine it with the provided context. Output ONLY the caption text with no quotes or extra formatting.`;

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, note } = await req.json();

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

    const userMessage = note
      ? `Write an AP-style caption for this photo. Context from the photographer: ${note}`
      : "Write an AP-style caption for this photo based on what you can see.";

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
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

    const caption =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ caption });
  } catch (error) {
    console.error("Caption generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate caption" },
      { status: 500 }
    );
  }
}
