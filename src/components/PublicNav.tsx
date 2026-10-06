"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { btn } from "@/lib/ui";

type PublicNavProps = {
  onRegister: () => void;
  onLogin: () => void;
  onHome?: () => void;
};

export function PublicNav({ onRegister, onLogin, onHome }: PublicNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 h-19 border-b border-[#e7e5de] bg-white">
      <div className="mx-auto flex h-full max-w-310 items-center justify-between px-6">
        <Logo onHome={onHome} />
        <nav
          className={`gap-8.5 text-sm font-semibold max-md:absolute max-md:top-19 max-md:right-0 max-md:left-0 max-md:flex-col max-md:bg-white max-md:p-6 ${
            open ? "max-md:flex" : "flex max-md:hidden"
          }`}
        >
          <a href="#marketplace" className="hover:text-soko-green-2">
            Marketplace
          </a>
          <a href="#marketplace" className="hover:text-soko-green-2">
            Suppliers
          </a>
          <a href="#marketplace" className="hover:text-soko-green-2">
            Buy requests
          </a>
        </nav>
        <div className="flex items-center gap-2.5 max-md:hidden">
          <button className={btn.text} onClick={onLogin}>
            Log in
          </button>
          <button className={btn.outline} onClick={onRegister}>
            Register
          </button>
          <a className={btn.buyCompact} href="#marketplace">
            Browse market <Icon name="arrow" size={16} />
          </a>
        </div>
        <button
          className="hidden border-0 bg-transparent max-md:block"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          <Icon name="menu" />
        </button>
      </div>
    </header>
  );
}
