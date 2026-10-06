"use client";

import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { btn } from "@/lib/ui";

type PublicNavProps = {
  onLogin: () => void;
  onHome?: () => void;
};

export function PublicNav({ onLogin, onHome }: PublicNavProps) {
  return (
    <header className="sticky top-0 z-50 h-19 border-b border-[#e7e5de] bg-white">
      <div className="mx-auto flex h-full max-w-310 items-center justify-between px-6">
        <Logo onHome={onHome} />
        <button type="button" className={btn.buyCompact} onClick={onLogin}>
          Log in <Icon name="arrow" size={16} />
        </button>
      </div>
    </header>
  );
}
