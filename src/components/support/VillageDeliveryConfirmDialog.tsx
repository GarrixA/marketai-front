"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ButtonLoader } from "@/components/ActionLoader";
import { Icon, btn } from "@/lib/ui";

type Props = {
  open: boolean;
  /** Short village name for compact button labels. */
  villageName: string;
  /** Full selected admin path, e.g. Itaba, Mumena, Nyamirambo, Nyarugenge, KIGALI. */
  selectedAddressLabel: string;
  mismatchMessage: string;
  busy?: boolean;
  purpose?: "delivery" | "pickup" | "both";
  onConfirm: () => void;
  onCancel: () => void;
};

export function VillageDeliveryConfirmDialog({
  open,
  villageName,
  selectedAddressLabel,
  mismatchMessage,
  busy = false,
  purpose = "delivery",
  onConfirm,
  onCancel,
}: Props) {
  const isPickup = purpose === "pickup";
  const isBoth = purpose === "both";
  const addressLabel = selectedAddressLabel.trim() || villageName;

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-125 grid place-items-center p-6">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 border-0 bg-soko-navy/72 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={busy ? undefined : onCancel}
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
              className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full border border-soko-line bg-white disabled:opacity-50"
              onClick={onCancel}
              disabled={busy}
              aria-label="Close"
            >
              <Icon name="close" size={16} />
            </button>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#fff4e5] text-soko-cta-hover">
              <Icon name="pin" size={22} />
            </span>
            <p className="mt-4 text-[0.625rem] font-extrabold tracking-[0.12em] text-soko-ink uppercase">
              Please confirm
            </p>
            <h3 className="mt-2 font-display text-[1.25rem] font-bold text-soko-ink">
              {isPickup
                ? "Use your selected pickup address?"
                : isBoth
                  ? "Use your selected delivery / pickup address?"
                  : "Use your selected delivery address?"}
            </h3>
            <p className="mt-3 rounded-1.25 border border-soko-line bg-[#f9fafb] px-3 py-2.5 text-sm font-semibold leading-relaxed text-soko-ink">
              {addressLabel}
            </p>
            {mismatchMessage ? (
              <p className="mt-3 text-sm leading-relaxed text-[#b42318]">
                {mismatchMessage}
              </p>
            ) : null}
            <p className="mt-3 text-sm leading-relaxed text-soko-muted">
              {isPickup ? (
                <>
                  Confirm pickup at the address above. We will set coordinates
                  inside <b>{addressLabel}</b>, preferring a point near a road
                  when possible — not another village with the same name.
                </>
              ) : isBoth ? (
                <>
                  Confirm delivery and pickup at the address above. We will set
                  coordinates inside <b>{addressLabel}</b>, preferring a point
                  near a road when possible — not another village with the same
                  name.
                </>
              ) : (
                <>
                  Confirm delivery at the address above. We will set coordinates
                  inside <b>{addressLabel}</b>, preferring a point near a road
                  when possible — not another village with the same name.
                </>
              )}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
              <button
                type="button"
                className={`${btn.outline} w-full justify-center`}
                onClick={onCancel}
                disabled={busy}
              >
                Fix address
              </button>
              <button
                type="button"
                className={`${btn.primaryCompact} w-full justify-center`}
                onClick={onConfirm}
                disabled={busy}
              >
                {busy ? (
                  <ButtonLoader label="Setting location…" />
                ) : (
                  <>
                    {isPickup
                      ? `Yes, pick up in ${villageName}`
                      : isBoth
                        ? `Yes, use ${villageName}`
                        : `Yes, deliver in ${villageName}`}{" "}
                    <Icon name="check" size={16} />
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
