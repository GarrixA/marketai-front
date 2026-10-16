"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Icon, btn } from "@/lib/ui";
import { ButtonLoader } from "@/components/ActionLoader";

export type AppResponseVariant =
  "confirm" | "success" | "error" | "warning" | "info";

export type AppResponseDialogProps = {
  open: boolean;
  variant: AppResponseVariant;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

const VARIANT_STYLES: Record<
  AppResponseVariant,
  { badge: string; label: string; icon: "check" | "close" | "star" }
> = {
  confirm: {
    badge: "bg-soko-slate text-soko-navy",
    label: "Please confirm",
    icon: "star",
  },
  success: {
    badge: "bg-[#e8f7ee] text-soko-green-2",
    label: "Success",
    icon: "check",
  },
  error: {
    badge: "bg-[#fdecea] text-[#b42318]",
    label: "Error",
    icon: "close",
  },
  warning: {
    badge: "bg-[#fff4e5] text-soko-cta-hover",
    label: "Warning",
    icon: "star",
  },
  info: {
    badge: "bg-soko-slate text-soko-navy",
    label: "Info",
    icon: "star",
  },
};

export function AppResponseDialog({
  open,
  variant,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onClose,
}: AppResponseDialogProps) {
  const style = VARIANT_STYLES[variant];
  const isConfirm = variant === "confirm";

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-120 grid place-items-center p-6">
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 border-0 bg-soko-navy/72 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={loading ? undefined : onClose}
            disabled={loading}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-response-title"
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
              className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-full border border-soko-line bg-white disabled:opacity-50"
              onClick={onClose}
              disabled={loading}
              aria-label="Close"
            >
              <Icon name="close" />
            </button>

            <span
              className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${style.badge}`}
            >
              <Icon name={style.icon} size={28} />
            </span>

            <p
              className={`mt-4 mb-0 text-[0.625rem] font-extrabold tracking-[0.12rem] uppercase ${
                variant === "error"
                  ? "text-[#b42318]"
                  : variant === "success"
                    ? "text-soko-green-2"
                    : "text-soko-navy"
              }`}
            >
              {style.label}
            </p>
            <h2
              id="app-response-title"
              className="my-2 font-display text-[1.375rem] font-bold"
            >
              {title}
            </h2>
            <p className="m-0 text-xs leading-relaxed text-soko-muted">
              {message}
            </p>

            <div
              className={`mt-6 flex gap-2 ${isConfirm ? "flex-col-reverse sm:flex-row" : ""}`}
            >
              {isConfirm ? (
                <button
                  type="button"
                  className={`${btn.outline} w-full sm:flex-1`}
                  onClick={onClose}
                  disabled={loading}
                >
                  {cancelLabel}
                </button>
              ) : null}
              <button
                type="button"
                className={`${
                  destructive
                    ? btn.sellCompact
                    : variant === "error"
                      ? btn.primaryCompact
                      : btn.primaryCompact
                } w-full ${isConfirm ? "sm:flex-1" : ""} sm:px-5.5 sm:py-3.5`}
                onClick={onConfirm}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <ButtonLoader label="Working…" />
                ) : (
                  <>
                    {confirmLabel} <Icon name="arrow" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
