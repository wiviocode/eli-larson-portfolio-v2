import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Eli Larson — Sports Photography & Videography";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const headshotArrayBuffer = await fetch(
    new URL("../../public/eli-headshot.jpeg", import.meta.url)
  ).then((res) => res.arrayBuffer());

  const headshotBase64 = Buffer.from(headshotArrayBuffer).toString("base64");
  const headshotSrc = `data:image/jpeg;base64,${headshotBase64}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#111111",
          position: "relative",
        }}
      >
        {/* Subtle background pattern — diagonal lines */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.03,
            backgroundImage:
              "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 20px)",
            display: "flex",
          }}
        />

        {/* Left: Headshot */}
        <div
          style={{
            width: "400px",
            height: "100%",
            display: "flex",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <img
            src={headshotSrc}
            width={400}
            height={630}
            style={{
              width: "400px",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 20%",
            }}
          />
          {/* Gradient overlay for smooth transition into dark bg */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "160px",
              height: "100%",
              background:
                "linear-gradient(to right, rgba(17,17,17,0), #111111)",
              display: "flex",
            }}
          />
          {/* Bottom gradient */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "100px",
              background:
                "linear-gradient(to top, rgba(17,17,17,0.8), transparent)",
              display: "flex",
            }}
          />
          {/* Red accent bar on left edge */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "5px",
              height: "100%",
              backgroundColor: "#E31616",
              display: "flex",
            }}
          />
        </div>

        {/* Right: Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: "40px",
            paddingRight: "80px",
            position: "relative",
          }}
        >
          {/* Red accent line */}
          <div
            style={{
              width: "50px",
              height: "4px",
              backgroundColor: "#E31616",
              borderRadius: "2px",
              marginBottom: "28px",
              display: "flex",
            }}
          />

          {/* Name */}
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span
              style={{
                fontSize: 76,
                color: "#ffffff",
                fontFamily: "Georgia, serif",
                lineHeight: 1,
                fontWeight: 400,
              }}
            >
              Eli Larson
            </span>
            <span
              style={{
                fontSize: 76,
                color: "#E31616",
                fontFamily: "Georgia, serif",
                lineHeight: 1,
              }}
            >
              .
            </span>
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "5px",
              textTransform: "uppercase",
              marginTop: "22px",
              fontFamily: "Arial, sans-serif",
              display: "flex",
            }}
          >
            Sports Photography & Videography
          </div>

          {/* Divider */}
          <div
            style={{
              width: "100%",
              height: "1px",
              backgroundColor: "rgba(255,255,255,0.08)",
              marginTop: "28px",
              marginBottom: "28px",
              display: "flex",
            }}
          />

          {/* Tagline */}
          <div
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.25)",
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              lineHeight: 1.5,
              display: "flex",
            }}
          >
            Let&apos;s create something worth watching.
          </div>

          {/* Website URL */}
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.2)",
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginTop: "32px",
              fontFamily: "Arial, sans-serif",
              display: "flex",
            }}
          >
            eli-larson.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
