"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, LogOut, User as UserIcon } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { isSelfHostedMode } from "@/lib/app-mode";
import { cn } from "@/lib/utils";
import { SignInModal } from "./sign-in-modal";

/**
 * Sign-in control for the header. Hidden in self-hosted mode, where the server's
 * own Valyu key does the work and there is nobody to sign in as.
 */
export function AccountButton() {
  const { user, isAuthenticated, isLoading, signOut } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (isSelfHostedMode()) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => (isAuthenticated ? setShowMenu(!showMenu) : setShowModal(true))}
        disabled={isLoading}
        className={cn(
          "flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md border border-border px-2.5 text-xs transition-colors hover:bg-accent lg:min-h-0 lg:min-w-0 lg:py-1.5",
          isLoading && "opacity-50"
        )}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isAuthenticated && user ? (
          user.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.picture} alt="" className="h-5 w-5 rounded-full object-cover" />
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </span>
          )
        ) : (
          <UserIcon className="h-3.5 w-3.5" />
        )}
        <span className="hidden max-w-[120px] truncate sm:inline">
          {isAuthenticated && user ? user.name || user.email : "Sign in"}
        </span>
      </button>

      {showMenu && isAuthenticated && user && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-lg border border-border bg-card p-3 shadow-xl">
          <p className="truncate text-xs font-medium">{user.name || "Signed in"}</p>
          <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
          <p className="mt-2 border-t border-border pt-2 text-[10px] leading-relaxed text-muted-foreground">
            Live Feed, Intel and state briefings run on your Valyu credits.
          </p>
          <button
            onClick={() => {
              signOut();
              setShowMenu(false);
            }}
            className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      )}

      <SignInModal open={showModal} onOpenChange={setShowModal} />
    </div>
  );
}
