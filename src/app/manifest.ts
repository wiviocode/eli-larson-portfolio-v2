import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eli Larson — Sports Photography & Videography",
    short_name: "Eli Larson",
    description:
      "Sports photography and videography portfolio of Eli Larson, Lincoln, NE.",
    start_url: "/",
    display: "browser",
    background_color: "#f5f5f5",
    theme_color: "#E31616",
    icons: [
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
