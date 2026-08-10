import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import dataset from "@/data/weddings.json";
import { ogImageSize, siteColors, siteName } from "@/lib/site";

/**
 * One share card, rendered for both the Open Graph and Twitter slots. Facebook,
 * LinkedIn, Slack, WhatsApp, Discord and X all crop 1200x630 cleanly, so a
 * single image covers every channel rather than one per network.
 *
 * The figures are read out of the built dataset instead of being hardcoded, so
 * a rebuild that finds new ceremonies updates the card at the next deploy
 * rather than quietly leaving a stale number in every link preview.
 */

/**
 * Satori reads ttf/otf/woff but not woff2, which is all the `geist` package
 * exposes through its font loader — hence the two vendored ttf files in
 * `assets/fonts`. Read at module scope so the cost is paid once per build.
 */
const fontDir = path.join(process.cwd(), "assets", "fonts");
const geistRegular = fs.readFileSync(path.join(fontDir, "GeistMono-Regular.ttf"));
const geistSemiBold = fs.readFileSync(path.join(fontDir, "GeistMono-SemiBold.ttf"));

interface Stats {
  editions?: number;
  statesCovered?: number;
  totalCouples?: number;
}

interface Event {
  year?: number;
}

function headlineStats() {
  const stats = (dataset as { stats?: Stats }).stats ?? {};
  const events = ((dataset as { events?: Event[] }).events ?? []).filter(
    (event): event is Event & { year: number } => typeof event.year === "number",
  );

  const years = events.map((event) => event.year);
  const span = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : "—";

  return [
    { value: String(stats.editions ?? events.length), label: "ceremonies" },
    { value: (stats.totalCouples ?? 0).toLocaleString("en-GB"), label: "couples" },
    { value: String(stats.statesCovered ?? 0), label: "states" },
    { value: span, label: "on record" },
  ];
}

/** The two-ring mark, inlined because satori cannot fetch an external asset. */
function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="8.4" cy="12" r="6.5" stroke={siteColors.foreground} strokeWidth={2} />
      <circle cx="17.55" cy="12" r="4.3" stroke={siteColors.foreground} strokeWidth={2} />
    </svg>
  );
}

export function renderShareCard() {
  const stats = headlineStats();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: siteColors.background,
          color: siteColors.foreground,
          padding: 64,
          fontFamily: "Geist Mono",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Mark size={40} />
          <div
            style={{
              display: "flex",
              fontSize: 20,
              letterSpacing: 4,
              color: siteColors.muted,
              textTransform: "uppercase",
            }}
          >
            {siteName}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 60,
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: -1.5,
              maxWidth: 980,
            }}
          >
            A decade of state-sponsored mass weddings, and the poverty behind them.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              lineHeight: 1.4,
              color: siteColors.muted,
              maxWidth: 900,
            }}
          >
            Every ceremony plotted by state and sized by couples, against poverty rates, age at
            first marriage and federal allocations. Every figure carries its source.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            borderTop: `1px solid ${siteColors.border}`,
            paddingTop: 28,
          }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{ display: "flex", flexDirection: "column", gap: 6, width: 268 }}
            >
              <div style={{ display: "flex", fontSize: 38, fontWeight: 600 }}>{stat.value}</div>
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  letterSpacing: 2,
                  color: siteColors.muted,
                  textTransform: "uppercase",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...ogImageSize,
      fonts: [
        { name: "Geist Mono", data: geistRegular, weight: 400, style: "normal" },
        { name: "Geist Mono", data: geistSemiBold, weight: 600, style: "normal" },
      ],
    },
  );
}
