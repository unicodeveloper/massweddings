import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";
import { StructuredData } from "@/components/structured-data";
import {
  siteColors,
  siteCreator,
  siteDescription,
  siteKeywords,
  siteLocale,
  siteName,
  siteShortName,
  siteTagline,
  siteUrl,
} from "@/lib/site";

export const metadata: Metadata = {
  // Everything below can use relative paths once this is set; without it the
  // generated OG and Twitter image URLs come out relative and no scraper
  // resolves them.
  metadataBase: new URL(siteUrl),

  title: {
    default: `${siteName} — ${siteTagline}`,
    template: `%s — ${siteName}`,
  },
  description: siteDescription,
  keywords: siteKeywords,
  applicationName: siteName,
  category: "news",

  authors: [{ name: siteCreator.name, url: siteCreator.url }],
  creator: siteCreator.name,
  publisher: siteCreator.name,

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: siteLocale,
    url: "/",
    siteName,
    title: `${siteName} — ${siteTagline}`,
    description: siteDescription,
    // Images come from app/opengraph-image.tsx, which Next resolves to an
    // absolute URL against metadataBase automatically.
  },

  twitter: {
    card: "summary_large_image",
    site: siteCreator.twitter,
    creator: siteCreator.twitter,
    title: `${siteName} — ${siteTagline}`,
    description: siteDescription,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Without this Google shows a thumbnail-sized preview at best; the map
      // card is the whole pitch, so let it run full width.
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  // Standalone iOS install: dark status bar to match the app shell.
  appleWebApp: {
    capable: true,
    title: siteShortName,
    statusBarStyle: "black-translucent",
  },

  // Stops iOS Safari turning the FAAC figures and couple counts into tel: links.
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },

  other: {
    // Read by Slack and a few other unfurlers that ignore OG for attribution.
    "article:author": siteCreator.name,
  },
};

export const viewport: Viewport = {
  themeColor: siteColors.background,
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // Deliberately not locking maximumScale/userScalable: the map handles its own
  // pinch gestures, but blocking page zoom outright fails WCAG 1.4.4 for anyone
  // who needs to enlarge the panel text.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className="dark">
      <head>
        <StructuredData />
      </head>
      <body className={`${GeistMono.className} min-h-screen antialiased`}>{children}</body>
    </html>
  );
}
