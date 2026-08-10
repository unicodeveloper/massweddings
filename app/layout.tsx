import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nigeria Mass Weddings Map",
  description:
    "Every government-sponsored mass wedding in Nigeria over the past decade, mapped against state poverty rates, marriage age and federal allocations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${GeistMono.className} min-h-screen antialiased`}>{children}</body>
    </html>
  );
}
