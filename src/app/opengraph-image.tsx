import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Eli Larson — Sports Photography & Videography";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#111111",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontSize: 80, color: "#ffffff" }}>Eli Larson</span>
          <span style={{ fontSize: 80, color: "#E31616" }}>.</span>
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "6px",
            textTransform: "uppercase",
            marginTop: 20,
            fontFamily: "Arial, sans-serif",
          }}
        >
          Sports Photography & Videography
        </div>
        <div
          style={{
            width: 120,
            height: 3,
            backgroundColor: "#E31616",
            borderRadius: 2,
            marginTop: 24,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
