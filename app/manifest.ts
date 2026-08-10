import type { MetadataRoute } from "next";
import { siteColors, siteDescription, siteName, siteShortName } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteName,
    short_name: siteShortName,
    description: siteDescription,
    start_url: "/",
    display: "standalone",
    background_color: siteColors.background,
    theme_color: siteColors.background,
    categories: ["news", "education", "reference"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
