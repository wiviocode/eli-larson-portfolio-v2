import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Eli Larson — Sports Photography & Videography Portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const instrumentSerifData = fetch(
  new URL("./fonts/InstrumentSerif-Regular.ttf", import.meta.url)
).then((r) => r.arrayBuffer());

export default async function OGImage() {
  const instrumentSerif = await instrumentSerifData;

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
              display: "flex",
            }}
          >
            Sports Photography & Videography
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#999",
              letterSpacing: "2px",
              marginTop: "10px",
              display: "flex",
            }}
          >
            Lincoln, NE
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#bbb",
              fontFamily: "Instrument Serif",
              fontStyle: "italic",
              marginTop: "28px",
              display: "flex",
            }}
          >
            Let&apos;s create something worth watching.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Instrument Serif",
          data: instrumentSerif,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
