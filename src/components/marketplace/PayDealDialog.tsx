"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Icon } from "@/lib/ui";
import { formatRwf } from "@/lib/marketplaceStore";
import { formatApiError } from "@/lib/apiError";
import { ButtonLoader } from "@/components/ActionLoader";
import {
  DeliveryAddressFields,
  emptyDeliveryAddress,
  formatDeliveryAddress,
  type DeliveryAddressValue,
} from "@/components/forms/DeliveryAddressFields";
import { hasDeliveryAddress } from "@/lib/deliveryAddress";
import {
  PaymentResultDialog,
  paymentReference,
  type PaymentReceipt,
} from "@/components/marketplace/PaymentResultDialog";
import {
  usePayDealMutation,
  usePreviewDeliveryQuoteMutation,
} from "@/store/actions/deals";
import type { PayDealRequest } from "@/types/deal";
import useTranslation from "next-translate/useTranslation";

type Method = PayDealRequest["method"];
type OperatorId = "mtn" | "airtel";

const payIndigo = "#5b4dff";
const formEase = [0.22, 1, 0.36, 1] as const;
const selectionSpring = {
  type: "spring" as const,
  stiffness: 460,
  damping: 34,
};

const formVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir * 36,
    filter: "blur(6px)",
  }),
  center: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -36,
    filter: "blur(6px)",
  }),
};

function formatRouteAddress(value: string | null | undefined) {
  if (!value?.trim()) return "";
  return value
    .replace(/\s*·\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*$/, "")
    .trim();
}

export function PayDealDialog({
  dealId,
  amount,
  productAmount,
  deliveryFee,
  supplierName,
  purpose = "Deal payment",
  pickupLocation,
  deliveryLocation,
  onClose,
}: {
  dealId: string;
  amount: number;
  productAmount: number;
  deliveryFee: number;
  supplierName: string;
  purpose?: string;
  pickupLocation?: string | null;
  deliveryLocation: string;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<Method | null>(null);
  const [step, setStep] = useState<"details" | "address" | "edit">("details");
  const [direction, setDirection] = useState(1);
  const reduceMotion = useReducedMotion();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [phone, setPhone] = useState("");
  const [operatorChoice, setOperatorChoice] = useState<OperatorId>("mtn");
  const [draftAddress, setDraftAddress] = useState<DeliveryAddressValue>(
    emptyDeliveryAddress()
  );
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const { t } = useTranslation("deals");
  const [payDeal, { isLoading: paying }] = usePayDealMutation();
  const [previewQuote, { isLoading: quoting }] =
    usePreviewDeliveryQuoteMutation();
  const propsQuoteKey = [
    amount,
    productAmount,
    deliveryFee,
    pickupLocation ?? "",
    deliveryLocation,
  ].join("|");
  const [quotePropsKey, setQuotePropsKey] = useState(propsQuoteKey);
  const [quoteOverride, setQuoteOverride] = useState<{
    productAmount: number;
    deliveryFee: number;
    totalAmount: number;
    pickupLocation: string | null;
    deliveryLocation: string;
  } | null>(null);

  // Reset quote overrides when the deal amounts / route props change.
  if (quotePropsKey !== propsQuoteKey) {
    setQuotePropsKey(propsQuoteKey);
    setQuoteOverride(null);
  }

  const productDue = quoteOverride?.productAmount ?? productAmount;
  const deliveryDue = quoteOverride?.deliveryFee ?? deliveryFee;
  const totalDue = quoteOverride?.totalAmount ?? amount;
  const routePickup = quoteOverride?.pickupLocation ?? pickupLocation ?? null;
  const routeDelivery = quoteOverride?.deliveryLocation ?? deliveryLocation;

  const localPhone = rwandaMobile(phone);
  const operator = operatorChoice;
  const savedAddress = deliveryLocation.trim();
  const busy = paying || quoting;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const refreshQuote = async (nextLocation?: string) => {
    const quote = await previewQuote({
      id: dealId,
      body: nextLocation ? { deliveryLocation: nextLocation } : {},
    }).unwrap();
    setQuoteOverride({
      productAmount: quote.productAmount,
      deliveryFee: quote.deliveryFee,
      totalAmount: quote.totalAmount,
      pickupLocation: quote.pickupLocation,
      deliveryLocation: quote.deliveryLocation,
    });
    return quote;
  };

  const pan = digitsOnly(cardNumber);
  const brand = cardBrand(pan);
  const cardReady =
    luhn(pan) && expiryValid(expiry) && digitsOnly(cvv).length >= 3;
  const mobileReady = Boolean(localPhone && operator);

  const choose = (next: Method) => {
    setStep("details");
    if (next === method) return;
    setDirection(next === "MOBILE_MONEY" ? 1 : -1);
    setMethod(next);
    setError("");
  };

  const reviewAddress = () => {
    if (method === "CARD" && !cardReady) return;
    if (method === "MOBILE_MONEY" && !mobileReady) return;
    setDirection(1);
    setError("");
    setStep("address");
  };

  const formTransition = reduceMotion
    ? { duration: 0.01 }
    : { duration: 0.34, ease: formEase };

  const submit = async (nextLocation?: string) => {
    if (!method) return;
    if (method === "CARD" && !cardReady) return;
    if (method === "MOBILE_MONEY" && (!localPhone || !operator)) return;
    setError("");
    const account =
      method === "CARD" ? pan.slice(-4) : `+250${localPhone ?? ""}`;
    const mode = method === "CARD" ? "Card" : "Mobile money";
    try {
      if (nextLocation) {
        await refreshQuote(nextLocation);
      }
      const saved = await payDeal({
        id: dealId,
        body: {
          method,
          account,
          ...(nextLocation ? { deliveryLocation: nextLocation } : {}),
        },
      }).unwrap();
      setReceipt({
        ok: true,
        amount: saved.payment?.amount ?? totalDue,
        reference: paymentReference(saved.payment?.id),
        paidAt: saved.payment?.paidAt ?? new Date().toISOString(),
        mode: saved.payment?.account
          ? `${mode} ${saved.payment.account}`
          : mode,
      });
    } catch (err) {
      setReceipt({
        ok: false,
        amount: totalDue,
        reference: paymentReference(),
        paidAt: new Date().toISOString(),
        mode,
        message: formatApiError(err),
      });
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-130 grid place-items-center overflow-y-auto bg-soko-navy/72 p-4 backdrop-blur-sm"
        onClick={() => {
          if (!busy) onClose();
        }}
      >
        <motion.div
          layout
          role="dialog"
          aria-modal="true"
          aria-labelledby="pay-deal-title"
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          transition={{ layout: { duration: 0.38, ease: formEase } }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="absolute top-4 right-4 z-10 grid h-8 w-8 place-items-center rounded-full border border-soko-line bg-white text-soko-muted hover:text-soko-navy"
            onClick={onClose}
            disabled={busy}
            aria-label="Close payment"
          >
            <Icon name="close" size={16} />
          </button>

          <div className="px-5 pt-5 pb-4 sm:px-6">
            <h3
              id="pay-deal-title"
              className="m-0 pr-8 text-xl font-bold tracking-tight text-[#2a2e37]"
            >
              Payment
            </h3>
            <p className="m-0 mt-1 text-[0.75rem] text-soko-muted">
              {formatRwf(totalDue)} stays held until delivery is complete.
            </p>
            <div className="mt-3 space-y-1 rounded-xl border border-[#e6e8ee] bg-[#fbfbfd] px-3 py-2.5 text-[0.75rem] text-[#2a2e37]">
              <div className="flex justify-between gap-3">
                <span>{t("traysAmount")}</span>
                <strong>{formatRwf(productDue)}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span>{t("deliveryAmount")}</span>
                <strong>{formatRwf(deliveryDue)}</strong>
              </div>
              <p className="m-0 text-[0.6875rem] leading-snug text-soko-muted">
                {formatRouteAddress(routePickup) || t("pickupNotSet")}
                {" → "}
                {formatRouteAddress(routeDelivery) || t("deliveryNotSet")}
              </p>
              <div className="flex justify-between gap-3 border-t border-[#e6e8ee] pt-1.5">
                <span className="font-semibold">{t("totalDue")}</span>
                <strong>{formatRwf(totalDue)}</strong>
              </div>
            </div>
          </div>

          <div
            role="radiogroup"
            aria-label="Payment method"
            className={`border-t border-[#e4e4e4] bg-[#e8e8e8] ${method ? "" : "pb-3"}`}
          >
            <MethodRow
              selected={method === "CARD"}
              label="Credit card"
              icon={<CardGlyph />}
              onClick={() => choose("CARD")}
              trailing={<BrandStrip active={brand} compact />}
            />
            <div className="mx-4 h-px bg-[#d9d9d9]" />
            <MethodRow
              selected={method === "MOBILE_MONEY"}
              label="Mobile money"
              icon={<MomoGlyph />}
              onClick={() => choose("MOBILE_MONEY")}
            />
          </div>

          <div className="relative">
            <AnimatePresence
              mode="popLayout"
              initial={false}
              custom={direction}
            >
              {method === "CARD" && step === "details" ? (
                <motion.div
                  key="CARD"
                  custom={direction}
                  variants={formVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={formTransition}
                  className="px-5 py-5 sm:px-6"
                >
                  <p className="m-0 text-[1.05rem] font-medium text-[#8b909a]">
                    Pay with
                  </p>
                  <div className="mt-3">
                    <BrandStrip active={brand} />
                  </div>

                  <label className="mt-5 block text-[1.02rem] font-medium text-[#8b909a]">
                    Card number
                    <input
                      className="mt-2 w-full rounded-xl border border-[#e4e6ec] bg-white px-4 py-3.5 text-base tracking-[0.08em] text-soko-ink outline-none placeholder:tracking-normal placeholder:text-[#c5c9d2] focus:border-[#5b4dff]"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="1234 1234 1234 1234"
                      value={formatCard(cardNumber)}
                      onChange={(event) =>
                        setCardNumber(
                          digitsOnly(event.target.value).slice(0, 19)
                        )
                      }
                    />
                  </label>
                  {pan.length >= 13 && !luhn(pan) ? (
                    <p className="m-0 mt-1.5 text-[0.6875rem] text-[#b42318]">
                      Check the card number.
                    </p>
                  ) : null}

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <label className="block text-[1.02rem] font-medium text-[#8b909a]">
                      Exp Date
                      <input
                        className="mt-2 w-full rounded-xl border border-[#e4e6ec] bg-white px-4 py-3.5 text-base text-soko-ink outline-none placeholder:text-[#c5c9d2] focus:border-[#5b4dff]"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM / YY"
                        value={formatExpiry(expiry)}
                        onChange={(event) =>
                          setExpiry(digitsOnly(event.target.value).slice(0, 4))
                        }
                      />
                    </label>
                    <label className="block text-[1.02rem] font-medium text-[#8b909a]">
                      CVV2
                      <input
                        className="mt-2 w-full rounded-xl border border-[#e4e6ec] bg-white px-4 py-3.5 text-base tracking-[0.2em] text-soko-ink outline-none placeholder:tracking-normal placeholder:text-[#c5c9d2] focus:border-[#5b4dff]"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder="123"
                        maxLength={4}
                        value={cvv}
                        onChange={(event) =>
                          setCvv(digitsOnly(event.target.value).slice(0, 4))
                        }
                      />
                    </label>
                  </div>
                  <p className="m-0 mt-2 text-[0.6875rem] leading-snug text-soko-muted">
                    Only the last 4 digits are stored. The security code is not
                    sent.
                  </p>

                  {error ? (
                    <p className="m-0 mt-3 text-[0.6875rem] text-[#b42318]">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    className={`mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl border-0 text-base font-semibold text-white disabled:cursor-not-allowed ${
                      cardReady ? "" : "opacity-40"
                    }`}
                    style={{ background: payIndigo }}
                    disabled={!cardReady || busy}
                    onClick={reviewAddress}
                  >
                    {busy ? (
                      <ButtonLoader label="Paying…" />
                    ) : (
                      `Pay ${formatRwf(totalDue)}`
                    )}
                  </button>
                </motion.div>
              ) : null}

              {method === "MOBILE_MONEY" && step === "details" ? (
                <motion.div
                  key="MOBILE_MONEY"
                  custom={direction}
                  variants={formVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={formTransition}
                  className="px-5 py-5 sm:px-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="m-0 text-sm text-[#8b909a]">Payment to</p>
                      <p className="m-0 mt-0.5 text-base font-extrabold tracking-tight text-[#1c1f26]">
                        {supplierName}
                      </p>
                    </div>
                    <div>
                      <p className="m-0 text-sm text-[#8b909a]">For</p>
                      <p
                        className="m-0 mt-0.5 text-base font-bold"
                        style={{ color: payIndigo }}
                      >
                        {purpose}
                      </p>
                    </div>
                  </div>

                  <label className="mt-5 block text-sm font-medium text-[#4b5160]">
                    Amount
                    <span className="mt-2 flex overflow-hidden rounded-xl border border-[#e4e6ec] bg-white">
                      <span className="flex items-center border-r border-[#e4e6ec] px-3 text-sm font-semibold text-[#4b5160]">
                        RWF
                      </span>
                      <input
                        className="min-w-0 flex-1 border-0 bg-white px-3 py-3 text-sm text-soko-ink outline-none"
                        readOnly
                        value={totalDue.toLocaleString("en-RW")}
                        aria-label="Amount in Rwandan francs"
                      />
                    </span>
                  </label>

                  <p className="m-0 mt-4 text-sm font-medium text-[#4b5160]">
                    Operator
                  </p>
                  <div
                    role="radiogroup"
                    aria-label="Mobile money operator"
                    className="mt-2 grid grid-cols-2 gap-3"
                  >
                    {(
                      [
                        ["mtn", "MTN"],
                        ["airtel", "Airtel"],
                      ] as const
                    ).map(([id, label]) => {
                      const on = operator === id;
                      return (
                        <motion.button
                          key={id}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          aria-label={label}
                          className="relative flex flex-col items-center gap-2 rounded-2xl border border-[#e6e8ee] bg-[#fbfbfd] px-3 py-4"
                          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                          onClick={() => setOperatorChoice(id)}
                        >
                          {on ? (
                            <motion.span
                              layoutId="operator-selection"
                              className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-[#5b4dff] bg-[#5b4dff]/10"
                              transition={
                                reduceMotion
                                  ? { duration: 0.01 }
                                  : selectionSpring
                              }
                            />
                          ) : null}
                          <span
                            className={`absolute top-2.5 right-2.5 z-10 h-3.5 w-3.5 rounded-full border ${
                              on
                                ? "border-[#5b4dff] bg-[#5b4dff] shadow-[inset_0_0_0_2px_white]"
                                : "border-[#d0d4dc] bg-white"
                            }`}
                          />
                          <motion.span
                            aria-hidden="true"
                            className="relative z-10"
                            animate={
                              reduceMotion
                                ? undefined
                                : { scale: on ? 1 : 0.94, y: on ? -1 : 0 }
                            }
                            transition={selectionSpring}
                          >
                            {id === "mtn" ? <MtnMark /> : <AirtelMark />}
                          </motion.span>
                          <span className="relative z-10 text-sm font-semibold text-[#2a2e37]">
                            {label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  <label className="mt-4 block text-sm font-medium text-[#4b5160]">
                    Phone number
                    <span className="mt-2 flex overflow-hidden rounded-xl border border-[#e4e6ec] bg-white focus-within:border-[#5b4dff]">
                      <span className="flex items-center gap-1.5 border-r border-[#e4e6ec] px-3 text-sm font-semibold text-[#1c1f26]">
                        <RwandaFlag />
                        +250
                      </span>
                      <input
                        className="min-w-0 flex-1 border-0 bg-white px-3 py-3 text-sm text-soko-ink outline-none placeholder:text-[#9aa0ab]"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder={phonePlaceholder(operator)}
                        value={phone}
                        onChange={(event) =>
                          setPhone(formatMobileGroups(event.target.value))
                        }
                      />
                    </span>
                  </label>
                  {phone.trim() && !localPhone ? (
                    <p className="m-0 mt-1.5 text-[0.6875rem] text-[#b42318]">
                      Enter a Rwanda mobile number, for example 078 000 000 0.
                    </p>
                  ) : null}

                  {error ? (
                    <p className="m-0 mt-3 text-[0.6875rem] text-[#b42318]">
                      {error}
                    </p>
                  ) : null}

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="inline-flex h-12 items-center justify-center rounded-full border-2 bg-white text-base font-semibold disabled:opacity-60"
                      style={{ borderColor: payIndigo, color: payIndigo }}
                      onClick={onClose}
                      disabled={busy}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={`inline-flex h-12 items-center justify-center rounded-full border-0 text-base font-semibold disabled:cursor-not-allowed ${
                        mobileReady
                          ? "text-white"
                          : "bg-[#eceef3] text-[#b7bcc6]"
                      }`}
                      style={
                        mobileReady ? { background: payIndigo } : undefined
                      }
                      disabled={!mobileReady || busy}
                      onClick={reviewAddress}
                    >
                      {busy ? <ButtonLoader label="Paying…" /> : "Pay"}
                    </button>
                  </div>
                </motion.div>
              ) : null}

              {step === "address" ? (
                <motion.div
                  key="address"
                  custom={direction}
                  variants={formVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={formTransition}
                  className="px-5 py-5 sm:px-6"
                >
                  <p className="m-0 text-sm text-[#8b909a]">Delivery address</p>
                  <h4 className="m-0 mt-1 text-lg font-bold text-[#1c1f26]">
                    Use this address?
                  </h4>
                  <p className="m-0 mt-3 rounded-2xl border border-[#e6e8ee] bg-[#fbfbfd] px-4 py-3 text-sm leading-relaxed text-[#2a2e37]">
                    {savedAddress ||
                      "No delivery address is saved for this order."}
                  </p>
                  {error ? (
                    <p className="m-0 mt-3 text-[0.6875rem] text-[#b42318]">
                      {error}
                    </p>
                  ) : null}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="inline-flex h-12 items-center justify-center rounded-full border-2 bg-white text-base font-semibold disabled:opacity-60"
                      style={{ borderColor: payIndigo, color: payIndigo }}
                      disabled={busy}
                      onClick={() => {
                        setDirection(-1);
                        setError("");
                        setStep("edit");
                      }}
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-12 items-center justify-center rounded-full border-0 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ background: payIndigo }}
                      disabled={!savedAddress || busy}
                      onClick={() => {
                        void submit();
                      }}
                    >
                      {busy ? <ButtonLoader label="Paying…" /> : "Use this"}
                    </button>
                  </div>
                </motion.div>
              ) : null}

              {step === "edit" ? (
                <motion.div
                  key="edit-address"
                  custom={direction}
                  variants={formVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={formTransition}
                  className="px-5 py-5 sm:px-6"
                >
                  <p className="m-0 text-sm text-[#8b909a]">Delivery address</p>
                  <h4 className="m-0 mt-1 text-lg font-bold text-[#1c1f26]">
                    Update address
                  </h4>
                  <div className="mt-4">
                    <DeliveryAddressFields
                      value={draftAddress}
                      onChange={setDraftAddress}
                      disabled={busy}
                      required
                    />
                  </div>
                  {error ? (
                    <p className="m-0 mt-3 text-[0.6875rem] text-[#b42318]">
                      {error}
                    </p>
                  ) : null}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="inline-flex h-12 items-center justify-center rounded-full border-2 bg-white text-base font-semibold disabled:opacity-60"
                      style={{ borderColor: payIndigo, color: payIndigo }}
                      disabled={busy}
                      onClick={() => {
                        setDirection(-1);
                        setError("");
                        setStep("address");
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-12 items-center justify-center rounded-full border-0 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ background: payIndigo }}
                      disabled={!hasDeliveryAddress(draftAddress) || busy}
                      onClick={() => {
                        const next = formatDeliveryAddress(draftAddress).trim();
                        if (!next || next === "—") return;
                        void submit(next);
                      }}
                    >
                      {busy ? <ButtonLoader label="Paying…" /> : "Use this"}
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
      <PaymentResultDialog
        receipt={receipt}
        onRetry={() => {
          setReceipt(null);
          setStep("details");
          setError("");
        }}
        onClose={() => {
          const succeeded = receipt?.ok;
          setReceipt(null);
          if (succeeded) onClose();
        }}
      />
    </>
  );
}

function MethodRow({
  selected,
  label,
  icon,
  trailing,
  onClick,
}: {
  selected: boolean;
  label: string;
  icon: ReactNode;
  trailing?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className="relative flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5"
      onClick={onClick}
    >
      {selected ? (
        <motion.span
          layoutId="pay-method-bg"
          className="absolute inset-0 bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)]"
          transition={selectionSpring}
        />
      ) : null}
      <span
        className={`relative z-10 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
          selected ? "border-[#3b6cff]" : "border-[#b9bdc6]"
        }`}
      >
        {selected ? (
          <motion.span
            layoutId="pay-method-dot"
            className="h-2.5 w-2.5 rounded-full bg-[#3b6cff]"
            transition={selectionSpring}
          />
        ) : null}
      </span>
      <span className="relative z-10">{icon}</span>
      <span className="relative z-10 text-[0.95rem] font-medium text-[#2c313a]">
        {label}
      </span>
      {trailing ? (
        <span className="relative z-10 ml-auto hidden shrink-0 sm:block">
          {trailing}
        </span>
      ) : null}
    </button>
  );
}

function BrandStrip({
  active,
  compact = false,
}: {
  active: ReturnType<typeof cardBrand>;
  compact?: boolean;
}) {
  const brands = [
    ["visa", <VisaMark key="visa" />],
    ["mastercard", <MastercardMark key="mc" />],
    ["amex", <AmexMark key="amex" />],
    ["discover", <DiscoverMark key="discover" />],
  ] as const;

  return (
    <span
      className={`inline-flex flex-wrap items-center ${compact ? "gap-1" : "gap-1.5"}`}
    >
      {brands.map(([id, mark]) => (
        <span
          key={id}
          className={`grid place-items-center rounded-md border bg-white ${
            compact ? "h-6 w-9" : "h-8 w-12"
          } ${active === id ? "border-[#5b4dff]" : "border-[#e4e6ec]"}`}
        >
          {mark}
        </span>
      ))}
    </span>
  );
}

function CardGlyph() {
  return (
    <span className="grid h-8 w-8 place-items-center text-[#1c2430]">
      <Icon name="card" size={22} />
    </span>
  );
}

function MomoGlyph() {
  return (
    <span className="grid h-8 w-8 place-items-center rounded-md bg-[#a21caf] text-[0.65rem] font-black tracking-tight text-white">
      mo
    </span>
  );
}

function VisaMark() {
  return (
    <span className="text-[0.55rem] font-black tracking-tight text-[#1a1f71] italic">
      VISA
    </span>
  );
}

function MastercardMark() {
  return (
    <span className="relative h-3.5 w-5">
      <span className="absolute top-0 left-0 h-3.5 w-3.5 rounded-full bg-[#eb001b]" />
      <span className="absolute top-0 left-1.5 h-3.5 w-3.5 rounded-full bg-[#f79e1b] mix-blend-multiply" />
    </span>
  );
}

function AmexMark() {
  return (
    <span className="rounded-[2px] bg-[#2e77bc] px-0.5 text-[0.4rem] font-black tracking-tight text-white">
      AMEX
    </span>
  );
}

function DiscoverMark() {
  return (
    <span className="text-[0.38rem] font-black tracking-tight text-[#111]">
      DISC
    </span>
  );
}

function MtnMark() {
  return (
    <span className="grid h-12 w-16 place-items-center rounded-md bg-[#ffcc00] text-[0.8rem] font-black tracking-tight text-[#004a98]">
      MTN
    </span>
  );
}

function AirtelMark() {
  return (
    <span className="grid h-12 w-16 place-items-center rounded-md bg-[#ed1c24] text-[0.72rem] font-black text-white">
      airtel
    </span>
  );
}

function RwandaFlag() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
      <rect width="18" height="6" fill="#00a1de" />
      <rect y="6" width="18" height="3" fill="#fad201" />
      <rect y="9" width="18" height="3" fill="#20603d" />
      <circle cx="4.2" cy="3.1" r="1.5" fill="#fad201" />
    </svg>
  );
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function formatCard(value: string) {
  return digitsOnly(value)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();
}

function formatExpiry(value: string) {
  const digits = digitsOnly(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

function cardBrand(number: string) {
  if (number.startsWith("4")) return "visa" as const;
  if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number))
    return "mastercard" as const;
  if (number.startsWith("34") || number.startsWith("37"))
    return "amex" as const;
  if (number.startsWith("6")) return "discover" as const;
  return null;
}

function luhn(number: string) {
  if (number.length < 13 || number.length > 19) return false;
  let sum = 0;
  let alternate = false;
  for (let index = number.length - 1; index >= 0; index -= 1) {
    let digit = Number(number[index]);
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

function expiryValid(value: string) {
  const digits = digitsOnly(value);
  if (digits.length !== 4) return false;
  const month = Number(digits.slice(0, 2));
  const year = 2000 + Number(digits.slice(2));
  if (month < 1 || month > 12) return false;
  const end = new Date(year, month, 1);
  return end > new Date();
}

function formatMobileGroups(value: string) {
  let digits = digitsOnly(value);
  if (digits.startsWith("250")) digits = `0${digits.slice(3)}`;
  return digits.slice(0, 10).replace(/(\d{3})(?=\d)/g, "$1 ");
}

function phonePlaceholder(operator: OperatorId | null) {
  if (operator === "mtn") return "78/9 000 000 0";
  if (operator === "airtel") return "72/3 000 000 0";
  return "000 000 000 0";
}

function rwandaMobile(value: string) {
  const local = digitsOnly(value).replace(/^(?:250|0)/, "");
  return /^7\d{8}$/.test(local) ? local : null;
}
