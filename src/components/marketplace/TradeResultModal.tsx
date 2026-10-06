"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Icon, btn } from "@/lib/ui";

export type TradeResult = {
  kind: "buy" | "sell";
  title: string;
  message: string;
  details?: string[];
};

type TradeResultModalProps = {
  result: TradeResult | null;
  onClose: () => void;
};

export function TradeResultModal({ result, onClose }: TradeResultModalProps) {
  const isBuy = result?.kind === "buy";

  return (
    <AnimatePresence>
      {result ? (
        <div className="fixed inset-0 z-110 grid place-items-center p-6">
          <motion.button
            type="button"
            aria-label="Close confirmation"
            className="absolute inset-0 border-0 bg-[#08141cb8] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="trade-result-title"
            className="relative w-full max-w-105 overflow-hidden rounded-2.5 bg-white px-8 py-8 text-center shadow-xl max-sm:px-5"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "tween", duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-full border border-[#ddd] bg-white"
              onClick={onClose}
              aria-label="Close"
            >
              <Icon name="close" />
            </button>

            <span
              className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${
                isBuy
                  ? "bg-[#dcfce7] text-[#16a34a]"
                  : "bg-[#fee2e2] text-[#dc2626]"
              }`}
            >
              <Icon name="check" size={28} />
            </span>

            <p
              className={`mt-4 mb-0 text-[0.625rem] font-extrabold tracking-[0.12rem] uppercase ${
                isBuy ? "text-[#16a34a]" : "text-[#dc2626]"
              }`}
            >
              {isBuy ? "Buy confirmed" : "Sell confirmed"}
            </p>
            <h2
              id="trade-result-title"
              className="my-2 font-display text-[1.375rem] font-bold"
            >
              {result.title}
            </h2>
            <p className="m-0 text-xs leading-relaxed text-soko-muted">
              {result.message}
            </p>

            {result.details && result.details.length > 0 ? (
              <ul className="mt-4 mb-0 space-y-1.5 rounded-1.25 bg-[#f5f5f1] px-4 py-3 text-left text-[0.6875rem] text-soko-ink">
                {result.details.map((line) => (
                  <li key={line} className="flex gap-2">
                    <Icon name="check" size={14} className="mt-0.5 shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <button
              type="button"
              className={`${isBuy ? btn.buyCompact : btn.sellCompact} mt-6 w-full sm:px-5.5 sm:py-3.5`}
              onClick={onClose}
            >
              Done <Icon name="arrow" />
            </button>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
