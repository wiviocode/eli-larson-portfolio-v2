import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Eli Larson — Sports Photography & Videography";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TTF_UA =
  "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)";

async function getInstrumentSerif() {
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap",
    { headers: { "User-Agent": TTF_UA } }
  ).then((r) => r.text());
  const url = css.match(/src: url\((.+?)\)/)?.[1];
  if (!url) throw new Error("Font URL not found");
  return fetch(url).then((r) => r.arrayBuffer());
}

async function getInter() {
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
    { headers: { "User-Agent": TTF_UA } }
  ).then((r) => r.text());
  const url = css.match(/src: url\((.+?)\)/)?.[1];
  if (!url) throw new Error("Font URL not found");
  return fetch(url).then((r) => r.arrayBuffer());
}

export default async function OGImage() {
  const [instrumentSerifFont, interFont] = await Promise.all([
    getInstrumentSerif(),
    getInter(),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#f5f5f5",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <span
            style={{
              fontSize: 190,
              fontFamily: "Instrument Serif",
              color: "#111",
              lineHeight: 0.9,
              display: "flex",
            }}
          >
            Eli Larson<span style={{ color: "#E31616" }}>.</span>
          </span>
          <div
            style={{
              width: "100%",
              height: "5px",
              backgroundColor: "#E31616",
              marginTop: "14px",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#666",
              letterSpacing: "6px",
              textTransform: "uppercase",
              marginTop: "30px",
              fontFamily: "Inter",
              display: "flex",
            }}
          >
            Sports Photography &amp; Videography
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#999",
              letterSpacing: "2px",
              marginTop: "10px",
              fontFamily: "Inter",
              display: "flex",
            }}
          >
            Lincoln, NE
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Instrument Serif",
          data: instrumentSerifFont,
          style: "normal",
          weight: 400,
        },
        { name: "Inter", data: interFont, style: "normal", weight: 400 },
      ],
    }
  );
}
