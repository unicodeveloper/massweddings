import { cn } from "@/lib/utils";
import { siteName, siteTagline } from "@/lib/site";

/**
 * Two interlocking rings — the wedding read — drawn at two different radii so
 * they double as the map's own vocabulary, where every ceremony is a circle
 * scaled by the number of couples. The size difference is the dataset's whole
 * finding in one glyph: a handful of enormous ceremonies in the north west,
 * next to nothing elsewhere.
 *
 * Strokes are unusually heavy for the box because this has to survive being
 * rasterised down to a 16px favicon.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
      className={cn("h-5 w-5", className)}
    >
      <circle cx="8.4" cy="12" r="6.5" />
      <circle cx="17.55" cy="12" r="4.3" />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  /** Hide the tagline where vertical space is tight. */
  showTagline?: boolean;
}

/**
 * The full lockup: mark, wordmark and tagline. Renders as an h1 because the
 * only place it appears is the app header, which is the page's top heading.
 */
export function Logo({ className, showTagline = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark className="h-6 w-6 shrink-0 text-foreground" />
      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold leading-none tracking-tight">{siteName}</h1>
        {showTagline && (
          <p className="mt-1 hidden truncate text-[11px] text-muted-foreground sm:block">
            {siteTagline}
          </p>
        )}
      </div>
    </div>
  );
}
