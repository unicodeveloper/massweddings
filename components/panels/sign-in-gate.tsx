"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { isSelfHostedMode } from "@/lib/app-mode";
import { SignInModal } from "@/components/auth/sign-in-modal";

/**
 * Wraps the features that spend Valyu credits. In hosted mode a reader has to
 * sign in first, so the searches run on their own account rather than ours.
 * Self-hosted deployments use the server's key and skip the gate entirely.
 */
export function SignInGate({
  feature,
  description,
  children,
}: {
  feature: string;
  description: string;
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuthStore();
  const [showModal, setShowModal] = useState(false);

  if (isSelfHostedMode() || isAuthenticated) return <>{children}</>;

  return (
    <>
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-muted">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">{feature} needs a Valyu account</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Sign in with Valyu
        </button>
        <p className="text-[10px] text-muted-foreground">
          The map and every chart stay open to everyone — only live search needs a session.
        </p>
      </div>

      <SignInModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
}
