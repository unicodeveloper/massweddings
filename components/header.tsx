"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useWeddingsStore } from "@/stores/weddings-store";
import { AccountButton } from "@/components/auth/account-button";
import { Logo } from "@/components/logo";

interface HeaderProps {
  onRebuild: () => void;
}

export function Header({ onRebuild }: HeaderProps) {
  const { isRebuilding, builtAt, error } = useWeddingsStore();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3 md:px-4">
      <Logo className="min-w-0" />

      <div className="flex shrink-0 items-center gap-2 md:gap-4">
        {error && <span className="max-w-xs truncate text-xs text-destructive">{error}</span>}

        <span className="hidden text-[11px] text-muted-foreground md:inline">
          Data by{" "}
          <a
            href="https://www.valyu.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground hover:underline"
          >
            Valyu
          </a>
        </span>

        <AccountButton />

        <button
          onClick={onRebuild}
          disabled={isRebuilding}
          title={
            builtAt
              ? `Last rebuilt ${new Date(builtAt).toLocaleString("en-GB")}. Takes several minutes.`
              : "Build the dataset from scratch. Takes several minutes."
          }
          aria-label={isRebuilding ? "Rebuilding dataset" : "Rebuild dataset"}
          className="flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-md border border-border px-2.5 text-xs transition-colors hover:bg-accent disabled:opacity-60 lg:min-h-0 lg:min-w-0 lg:px-3 lg:py-1.5"
        >
          {isRebuilding ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {/* Icon-only on phones — the label is the first thing worth dropping. */}
          <span className="hidden sm:inline">{isRebuilding ? "Rebuilding…" : "Rebuild"}</span>
        </button>
      </div>
    </header>
  );
}
