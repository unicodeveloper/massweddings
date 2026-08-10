import { renderShareCard } from "@/lib/og-image";
import { ogImageSize, siteDescription } from "@/lib/site";

export const alt = siteDescription;
export const size = ogImageSize;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderShareCard();
}
