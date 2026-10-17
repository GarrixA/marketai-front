"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { ProfileMenu } from "@/components/ProfileMenu";
import { getSession, patchSession, type UserSession } from "@/lib/session";
import { authService } from "@/services/auth.service";

let sessionSnapshot: UserSession | null | undefined;

function subscribeSession(onStoreChange: () => void) {
  const sync = () => {
    sessionSnapshot = getSession();
    onStoreChange();
  };
  window.addEventListener("soko-session", sync);
  return () => window.removeEventListener("soko-session", sync);
}

function getSessionSnapshot() {
  if (sessionSnapshot === undefined) sessionSnapshot = getSession();
  return sessionSnapshot;
}

type PublicNavProps = {
  onLogin: () => void;
  onHome?: () => void;
};

export function PublicNav({ onLogin, onHome }: PublicNavProps) {
  const session = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    () => null
  );

  useEffect(() => {
    if (!session?.userId) return;
    let cancelled = false;
    (async () => {
      try {
        const me = await authService.getMe();
        if (cancelled) return;
        const name =
          `${me.firstName ?? ""} ${me.lastName ?? ""}`.trim() ||
          getSession()?.name ||
          "My account";
        const businessName =
          me.profile?.businessName || me.profile?.displayName || name;
        patchSession({
          name,
          email: me.email,
          phone: me.phone,
          businessName,
          avatarUrl: me.profile?.avatarUrl ?? null,
        });
      } catch {
        // Keep the stored session if the profile request fails.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.userId]);

  const logout = () => {
    void authService.logout();
  };

  const accountLabel = session?.name?.trim() || "My account";

  return (
    <header className="sticky top-0 z-50 h-19 border-b border-soko-line bg-white">
      <div className="mx-auto flex h-full max-w-310 items-center justify-between px-6">
        <Logo onHome={onHome} />
        {session ? (
          <ProfileMenu
            onLogout={logout}
            displayName={accountLabel}
            avatarUrl={session.avatarUrl}
          />
        ) : (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-3 rounded-md border-0 bg-[#F07500] px-4.25 py-2.75 text-sm font-bold text-white hover:bg-[#d86800]"
            onClick={onLogin}
          >
            Log in <Icon name="arrow" size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
