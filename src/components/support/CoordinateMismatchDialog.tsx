"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Icon, btn } from "@/lib/ui";

type Props = {
  open: boolean;
  title?: string;
  message: string;
  onFixAddress: () => void;
  onRequestHelp: () => void;
  onClose: () => void;
};

export function CoordinateMismatchDialog({
  open,
  title = "Coordinates may not match village",
  message,
  onFixAddress,
  onRequestHelp,
  onClose,
}: Props) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-125 grid place-items-center p-6">
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 border-0 bg-soko-navy/72 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-105 overflow-hidden rounded-2.5 bg-white px-8 py-8 text-center shadow-xl max-sm:px-5"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{
              type: "tween",
              duration: 0.25,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <button
              type="button"
              className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full border border-soko-line bg-white"
              onClick={onClose}
              aria-label="Close"
            >
              <Icon name="close" size={16} />
            </button>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-soko-slate text-soko-navy">
              <Icon name="star" size={22} />
            </span>
            <p className="mt-4 text-[0.625rem] font-extrabold tracking-[0.12em] text-soko-ink uppercase">
              Please confirm
            </p>
            <h3 className="mt-2 font-display text-[1.25rem] font-bold text-soko-ink">
              {title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-soko-muted">
              {message}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
              <button
                type="button"
                className={`${btn.outline} w-full justify-center`}
                onClick={onFixAddress}
              >
                Fix address
              </button>
              <button
                type="button"
                className={`${btn.primaryCompact} w-full justify-center`}
                onClick={onRequestHelp}
              >
                Request for help <Icon name="arrow" size={16} />
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
