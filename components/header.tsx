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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      <Logo className="min-w-0" />

      <div className="flex items-center gap-4">
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
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-accent disabled:opacity-60"
        >
          {isRebuilding ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {isRebuilding ? "Rebuilding…" : "Rebuild"}
        </button>
      </div>
    </header>
  );
}
