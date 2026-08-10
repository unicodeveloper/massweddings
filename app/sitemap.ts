import type { MetadataRoute } from "next";
import dataset from "@/data/weddings.json";
import { siteUrl } from "@/lib/site";

/**
 * The map is a single page — state detail opens in a panel rather than at its
 * own URL — so the sitemap has one entry. Its lastModified tracks the dataset
 * build rather than the deploy, which is the date that actually changes what a
 * crawler would see.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const builtAt = (dataset as { builtAt?: string }).builtAt;

  return [
    {
      url: siteUrl,
      lastModified: builtAt ? new Date(builtAt) : new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
