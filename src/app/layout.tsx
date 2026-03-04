import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.eli-larson.com"),
  title: {
    default: "Eli Larson — Sports Photography & Videography",
    template: "%s — Eli Larson",
  },
  description:
    "Sports photography and videography by Eli Larson. Media Assistant for Nebraska Men's Basketball and Social Media Manager for Nebraska Track & Field. Lincoln, NE.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Eli Larson — Sports Photography & Videography",
    description:
      "Sports photography and videography by Eli Larson. Media Assistant for Nebraska Men's Basketball and Social Media Manager for Nebraska Track & Field. Lincoln, NE.",
    type: "website",
    locale: "en_US",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${inter.variable}`}>
      <head />
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Eli Larson",
              url: "https://www.eli-larson.com",
              jobTitle: "Sports Photographer & Videographer",
              description:
                "Media Assistant for Nebraska Men's Basketball and Social Media Manager for Nebraska Track & Field.",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Lincoln",
                addressRegion: "NE",
                addressCountry: "US",
              },
              sameAs: [
                "https://www.instagram.com/strike_lnk/",
                "https://www.linkedin.com/in/eli-larson/",
              ],
            }),
          }}
        />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
