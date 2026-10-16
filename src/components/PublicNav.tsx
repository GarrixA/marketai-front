"use client";

import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";

type PublicNavProps = {
  onLogin: () => void;
  onHome?: () => void;
};

export function PublicNav({ onLogin, onHome }: PublicNavProps) {
  return (
    <header className="sticky top-0 z-50 h-19 border-b border-soko-line bg-white">
      <div className="mx-auto flex h-full max-w-310 items-center justify-between px-6">
        <Logo onHome={onHome} />
        <button
          type="button"
          className="inline-flex items-center justify-center gap-3 rounded-md border-0 bg-[#F07500] px-4.25 py-2.75 text-sm font-bold text-white hover:bg-[#d86800]"
          onClick={onLogin}
        >
          Log in <Icon name="arrow" size={16} />
        </button>
      </div>
    </header>
  );
}
