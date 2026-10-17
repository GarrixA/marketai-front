"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/Icon";
import { UserAvatar } from "@/components/UserAvatar";

const profileMenuEase = [0.22, 1, 0.36, 1] as const;

const profileMenuPanel = {
  hidden: {
    opacity: 0,
    x: 28,
    scale: 0.98,
    transition: { duration: 0.16, ease: profileMenuEase },
  },
  show: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.28,
      ease: profileMenuEase,
      when: "beforeChildren" as const,
      staggerChildren: 0.055,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    x: 24,
    scale: 0.98,
    transition: {
      duration: 0.18,
      ease: profileMenuEase,
      when: "afterChildren" as const,
      staggerChildren: 0.035,
      staggerDirection: -1,
    },
  },
};

const profileMenuItem = {
  hidden: { opacity: 0, x: 18 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.24, ease: profileMenuEase },
  },
  exit: {
    opacity: 0,
    x: 14,
    transition: { duration: 0.12, ease: profileMenuEase },
  },
};

export function ProfileMenu({
  onLogout,
  displayName,
  avatarUrl,
}: {
  onLogout: () => void;
  displayName: string;
  avatarUrl?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  const go = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-soko-line bg-soko-slate text-soko-ink hover:bg-white"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open profile menu"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <UserAvatar
          name={displayName}
          avatarUrl={avatarUrl}
          size="md"
          fallback="initials"
          className="border-0"
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            aria-label="Profile"
            className="absolute top-[calc(100%+0.5rem)] right-0 z-50 w-64 overflow-hidden rounded-2.5 border border-soko-line bg-white text-soko-ink shadow-lg"
            variants={profileMenuPanel}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <motion.div
              variants={profileMenuItem}
              className="flex items-center gap-2.5 border-b border-soko-line px-4 py-3"
            >
              <UserAvatar
                name={displayName}
                avatarUrl={avatarUrl}
                size="md"
                fallback="initials"
              />
              <div className="min-w-0">
                <strong className="block truncate text-[0.8125rem]">
                  {displayName}
                </strong>
                <small className="block truncate text-[0.625rem] text-soko-muted">
                  My account
                </small>
              </div>
            </motion.div>
            <motion.button
              type="button"
              role="menuitem"
              variants={profileMenuItem}
              className="mx-1.5 mt-1.5 flex items-center gap-3 rounded-1.25 border-0 bg-transparent px-3 py-2.5 text-left text-xs text-soko-ink hover:bg-soko-slate"
              onClick={() => go("/dashboard")}
            >
              <Icon name="grid" size={16} className="text-soko-muted" />
              <span className="flex-1 font-medium">Dashboard</span>
              <Icon name="chevron" size={14} className="text-soko-muted" />
            </motion.button>
            <motion.button
              type="button"
              role="menuitem"
              variants={profileMenuItem}
              className="mx-1.5 flex items-center gap-3 rounded-1.25 border-0 bg-transparent px-3 py-2.5 text-left text-xs text-soko-ink hover:bg-soko-slate"
              onClick={() => go("/dashboard/account")}
            >
              <Icon name="user" size={16} className="text-soko-muted" />
              <span className="flex-1 font-medium">My account</span>
              <Icon name="chevron" size={14} className="text-soko-muted" />
            </motion.button>
            <motion.button
              type="button"
              role="menuitem"
              variants={profileMenuItem}
              className="mx-1.5 flex items-center gap-3 rounded-1.25 border-0 bg-transparent px-3 py-2.5 text-left text-xs text-soko-ink hover:bg-soko-slate"
              onClick={() => go("/dashboard/settings")}
            >
              <Icon name="settings" size={16} className="text-soko-muted" />
              <span className="flex-1 font-medium">Settings</span>
              <Icon name="chevron" size={14} className="text-soko-muted" />
            </motion.button>
            <motion.div
              variants={profileMenuItem}
              className="mx-1.5 my-1 border-t border-soko-line"
            />
            <motion.button
              type="button"
              role="menuitem"
              variants={profileMenuItem}
              className="mx-1.5 mb-1.5 flex items-center gap-3 rounded-1.25 border-0 bg-transparent px-3 py-2.5 text-left text-xs font-medium text-[#b42318] hover:bg-[#fef3f2]"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              <Icon name="arrow" className="rotate-180" size={16} />
              <span>Logout</span>
            </motion.button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
