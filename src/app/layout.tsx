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
  openGraph: {
    title: "Eli Larson — Sports Photography & Videography",
    description:
      "Sports photography and videography by Eli Larson. Lincoln, NE.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
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
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
