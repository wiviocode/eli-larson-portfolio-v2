import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Eli Larson — Sports Photography & Videography";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const instrumentSerifData = fetch(
  new URL("./fonts/InstrumentSerif-Regular.ttf", import.meta.url)
).then((r) => r.arrayBuffer());

const interBoldData = fetch(
  new URL("./fonts/Inter-Bold.ttf", import.meta.url)
).then((r) => r.arrayBuffer());

const interSemiBoldData = fetch(
  new URL("./fonts/Inter-SemiBold.ttf", import.meta.url)
).then((r) => r.arrayBuffer());

export default async function OGImage() {
  const [instrumentSerif, interBold, interSemiBold] = await Promise.all([
    instrumentSerifData,
    interBoldData,
    interSemiBoldData,
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
            Sports Photography & Videography
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
          data: instrumentSerif,
          style: "normal",
          weight: 400,
        },
        { name: "Inter", data: interBold, style: "normal", weight: 700 },
        { name: "Inter", data: interSemiBold, style: "normal", weight: 600 },
      ],
    }
  );
}
