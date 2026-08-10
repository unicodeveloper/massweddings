import { renderShareCard } from "@/lib/og-image";
import { ogImageSize, siteDescription } from "@/lib/site";

/**
 * X crops the same 1200x630 to its summary_large_image slot, so this is the
 * Open Graph card again rather than a second design to keep in sync.
 */
export const alt = siteDescription;
export const size = ogImageSize;
export const contentType = "image/png";

export default function TwitterImage() {
  return renderShareCard();
}
