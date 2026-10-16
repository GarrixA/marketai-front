"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/lib/ui";
import { formatRwf } from "@/lib/marketplaceStore";

export type PaymentReceipt = {
  ok: boolean;
  amount: number;
  reference: string;
  paidAt: string;
  mode: string;
  message?: string;
};

export function paymentReference(id?: string | null) {
  const digits = (id ?? "").replace(/\D/g, "");
  const raw = digits || String(Date.now());
  return raw.slice(-12).padStart(12, "0");
}

export function formatPaymentTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PaymentResultDialog({
  receipt,
  onClose,
  onRetry,
}: {
  receipt: PaymentReceipt | null;
  onClose: () => void;
  onRetry: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!receipt) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [receipt, onClose]);

  return (
    <AnimatePresence>
      {receipt ? (
        <div className="fixed inset-0 z-140 grid place-items-center overflow-y-auto p-4">
          <motion.button
            type="button"
            aria-label="Close payment result"
            className="print-hide absolute inset-0 border-0 bg-soko-navy/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-result-title"
            className="print-receipt relative w-full max-w-sm rounded-2xl bg-white px-6 pt-5 pb-6 text-center shadow-2xl"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              className="print-hide absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full text-[#98a2b3] hover:text-soko-ink"
              onClick={onClose}
              aria-label="Close"
            >
              <Icon name="close" size={16} />
            </button>

            <span
              className={`mx-auto mt-3 grid h-14 w-14 place-items-center rounded-full text-white ${
                receipt.ok ? "bg-[#12b76a]" : "bg-[#f04438]"
              }`}
            >
              {receipt.ok ? (
                <Icon name="check" size={28} />
              ) : (
                <Icon name="close" size={26} />
              )}
            </span>

            <h3
              id="payment-result-title"
              className="m-0 mt-4 text-xl font-bold text-[#1c1f26]"
            >
              {receipt.ok ? "Payment Success!" : "Payment Failure!"}
            </h3>
            <p className="m-0 mt-1.5 text-sm text-[#98a2b3]">
              {receipt.ok
                ? "Your payment has been successfully done."
                : "Your payment could not be processed."}
            </p>
            {!receipt.ok && receipt.message ? (
              <p className="m-0 mt-2 text-[0.75rem] text-[#b42318]">
                {receipt.message}
              </p>
            ) : null}

            <p className="m-0 mt-6 text-sm text-[#98a2b3]">Total Payment</p>
            <p className="m-0 mt-1 text-3xl font-bold tracking-tight text-[#1c1f26]">
              {formatRwf(receipt.amount)}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 text-left">
              <div className="rounded-xl border border-[#eaecf0] px-3 py-2.5">
                <p className="m-0 text-[0.6875rem] text-[#98a2b3]">
                  Ref Number
                </p>
                <p className="m-0 mt-1 text-sm font-semibold text-[#344054]">
                  {receipt.reference}
                </p>
              </div>
              <div className="rounded-xl border border-[#eaecf0] px-3 py-2.5">
                <p className="m-0 text-[0.6875rem] text-[#98a2b3]">
                  Payment Time
                </p>
                <p className="m-0 mt-1 text-sm font-semibold text-[#344054]">
                  {formatPaymentTime(receipt.paidAt)}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-[#eaecf0] px-3 py-2.5 text-left">
              <p className="m-0 text-[0.6875rem] text-[#98a2b3]">
                Payment Mode
              </p>
              <p className="m-0 mt-1 text-sm font-semibold tracking-wide text-[#344054] uppercase">
                {receipt.mode}
              </p>
            </div>

            <div className="print-hide mt-6 flex flex-col items-center gap-3">
              {receipt.ok ? (
                <>
                  <button
                    type="button"
                    className="inline-flex h-11 min-w-40 items-center justify-center rounded-lg border-0 bg-[#128c7e] px-5 text-sm font-semibold text-white"
                    onClick={() => window.print()}
                  >
                    Print Invoice
                  </button>
                  <button
                    type="button"
                    className="border-0 bg-transparent text-sm font-semibold text-[#128c7e]"
                    onClick={() => {
                      router.push("/dashboard/orders");
                      onClose();
                    }}
                  >
                    Track delivery
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="inline-flex h-11 min-w-40 items-center justify-center rounded-lg border-0 bg-[#f04438] px-5 text-sm font-semibold text-white"
                  onClick={onRetry}
                >
                  Retry Payment
                </button>
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
