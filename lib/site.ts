/**
 * Single source of truth for anything that appears in a meta tag, a share card
 * or a crawler's index. Everything that renders metadata reads from here so the
 * title in the browser tab, the OG card and the sitemap can never drift apart.
 */

/**
 * Absolute origin the site is served from, without a trailing slash.
 *
 * Resolution order: an explicit NEXT_PUBLIC_SITE_URL wins, then the domain
 * Railway injects into the build, then localhost for `next dev`. Open Graph and
 * Twitter both reject relative image URLs, so this has to resolve to something
 * absolute in production or share cards render blank.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const railway = process.env.RAILWAY_PUBLIC_DOMAIN;
  if (railway) return `https://${railway}`;

  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();

export const siteName = "Nigeria Mass Weddings Map";

/** Used where the full name is too long to sit well — the PWA tile, mainly. */
export const siteShortName = "Mass Weddings";

export const siteTagline =
  "A decade of state-sponsored mass weddings, against the poverty and money behind them";

/**
 * Kept under ~160 characters so search results and link previews show it whole
 * rather than truncating mid-sentence.
 */
export const siteDescription =
  "Every government-sponsored mass wedding in Nigeria over the past decade, mapped against state poverty rates, marriage age and federal allocations.";

/** The longer version, for the structured-data payload where length is free. */
export const siteDescriptionLong =
  "An interactive map of every government-sponsored mass wedding recorded in Nigeria over the past decade — plotted by state, sized by couples married and set against multidimensional poverty, median age at first marriage, household electricity, population and FAAC allocation. Every ceremony carries its source URL; unsourced figures are left blank rather than estimated.";

export const siteKeywords = [
  "Nigeria",
  "mass wedding",
  "mass weddings Nigeria",
  "state-sponsored marriage",
  "Kano mass wedding",
  "Hisbah",
  "northern Nigeria",
  "child marriage",
  "age at first marriage",
  "multidimensional poverty",
  "FAAC allocation",
  "open data",
  "data journalism",
  "interactive map",
];

export const siteLocale = "en_NG";

/** Shown as the author/publisher across metadata and structured data. */
export const siteCreator = {
  name: "Prosper Otemuyiwa",
  url: "https://github.com/unicodeveloper",
  twitter: "@unicodeveloper",
};

export const siteRepository = "https://github.com/unicodeveloper/massweddings";

/**
 * Share-card geometry. 1200x630 is the ratio Facebook, LinkedIn, Slack and
 * X all crop cleanly, so one image serves every channel.
 */
export const ogImageSize = { width: 1200, height: 630 };

/**
 * The share card is a fixed asset rather than a per-request render. Crawlers
 * fetch it far more often than people share the page, and several of them
 * (WhatsApp especially) give up on a slow image and unfurl with no preview at
 * all — a static file behind the CDN never loses that race. JPEG because the
 * card is a textured print poster with no flat areas to band: it encodes to a
 * quarter of the PNG's weight with no visible loss on the type.
 */
export const ogImage = {
  url: "/og-wedding-belt.jpg",
  type: "image/jpeg",
  ...ogImageSize,
  alt: 'A 1960s-style Nigerian tourism poster reading "The Wedding Belt", above the line "Come to Nigeria single. Leave married. All government sponsored". A registrar sits at a trestle table with a ledger while a queue of couples in babban riga and veils stretches back past a mud-brick city wall.',
} as const;

/** Brand colours, matched to the app's dark shell rather than re-picked. */
export const siteColors = {
  background: "#0a0a0a",
  foreground: "#fafafa",
  muted: "#8a8a8a",
  border: "#2a2a2a",
};
