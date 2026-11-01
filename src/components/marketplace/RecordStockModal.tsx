"use client";

import { useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { Icon, btn } from "@/lib/ui";
import { upsertInventory, publishSellOffer } from "@/lib/marketplaceStore";
import { waitForAction } from "@/lib/actionDelay";
import { Field, fieldClass } from "@/components/marketplace/uiBits";
import { ActionOverlay, ButtonLoader } from "@/components/ActionLoader";
import { getSession, type DashboardRole } from "@/lib/session";
import type { InventoryItem, SellerRole } from "@/lib/marketplaceTypes";

const GRADE_OPTIONS = [
  "Large",
  "Medium",
  "Small",
  "Mixed",
  "Organic Large",
  "Free-range",
] as const;

const GRADE_LABEL_KEYS: Record<string, string> = {
  Large: "grades.large",
  Medium: "grades.medium",
  Small: "grades.small",
  Mixed: "grades.mixed",
  "Organic Large": "grades.organicLarge",
  "Free-range": "grades.freeRange",
};

type RecordStockModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: {
    product: string;
    grade: string;
    quantity: number;
    pricePerUnit: number;
    location: string;
    isUpdate: boolean;
  }) => void;
  initial?: InventoryItem | null;
};

export function RecordStockModal({
  open,
  onClose,
  onSuccess,
  initial = null,
}: RecordStockModalProps) {
  const { t } = useTranslation("listProductForSale");
  const { t: tSellOffers } = useTranslation("sellOffers");
  const { t: tBuy } = useTranslation("buyRequests");
  const { t: tDeals } = useTranslation("deals");
  const session = getSession();
  const [product] = useState("Fresh eggs");
  const [grade, setGrade] = useState(initial?.grade ?? "Large");
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? 100));
  const [price, setPrice] = useState(String(initial?.pricePerUnit ?? 4000));
  const [location, setLocation] = useState(
    initial?.location ??
      (session?.businessName.includes("Hub")
        ? "Musanze Aggregator Depot"
        : "Musanze")
  );
  const [minOrder, setMinOrder] = useState(String(initial?.minOrder ?? 10));
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const gradeChoices = GRADE_OPTIONS.includes(
    grade as (typeof GRADE_OPTIONS)[number]
  )
    ? [...GRADE_OPTIONS]
    : [grade, ...GRADE_OPTIONS];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || loading) return;

    setLoading(true);
    await waitForAction();

    const ownerRole: SellerRole =
      session.role === "aggregator" ? "aggregator" : "supplier";
    const qty = Number(quantity) || 0;
    const pricePerUnit = Number(price) || 0;

    const listingId = upsertInventory({
      id: initial?.id,
      ownerEmail: session.email,
      ownerName: session.businessName,
      ownerRole,
      product,
      grade,
      quantity: qty,
      unit: "trays",
      pricePerUnit,
      location,
      paymentMethod: initial?.paymentMethod ?? "MTN MoMo",
      minOrder: Number(minOrder) || 1,
      trades: initial?.trades ?? 0,
      completionRate: initial?.completionRate ?? 100,
      rating: initial?.rating ?? 100,
      responseMins: initial?.responseMins ?? 15,
    });

    publishSellOffer({
      listingId,
      ownerEmail: session.email,
      ownerName: session.businessName,
      ownerRole,
      product,
      grade,
      quantity: qty,
      pricePerUnit,
      location,
      minOrder: Number(minOrder) || 1,
    });

    setLoading(false);
    onClose();
    onSuccess?.({
      product,
      grade,
      quantity: qty,
      pricePerUnit,
      location,
      isUpdate: Boolean(initial?.id),
    });
  };

  return (
    <div className="fixed inset-0 z-100 grid place-items-center overflow-y-auto bg-soko-navy/72 p-4 backdrop-blur-sm sm:p-6">
      <div className="relative my-auto max-h-[min(94vh,100%)] w-full max-w-125 overflow-auto rounded-2.5 bg-white px-5 py-6 sm:px-8 sm:py-7">
        {loading ? <ActionOverlay label="Confirming sell…" /> : null}
        <button
          type="button"
          className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full border border-soko-line bg-white disabled:opacity-50 sm:top-4 sm:right-4"
          onClick={onClose}
          disabled={loading}
          aria-label="Close record stock"
        >
          <Icon name="close" />
        </button>

        <h2 className="m-0 pr-10 font-display text-[1.25rem] font-bold sm:text-[1.375rem]">
          {initial ? tSellOffers("confirmSellOrder") : t("title")}
        </h2>
        <p className="mt-1 mb-5 text-[0.6875rem] text-soko-muted">
          {initial
            ? "Review price and trays, then confirm this sell order."
            : "Publish stock buyers can purchase from your workspace."}
        </p>

        <form
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          onSubmit={submit}
        >
          <Field label={tBuy("product")}>
            <input
              className={`${fieldClass} disabled:opacity-80`}
              value={product}
              readOnly
              disabled
              aria-label="Product (eggs only)"
            />
          </Field>
          <Field label={t("grade")}>
            <select
              className={fieldClass}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              required
              disabled={loading}
            >
              {gradeChoices.map((option) => (
                <option key={option} value={option}>
                  {GRADE_LABEL_KEYS[option]
                    ? t(GRADE_LABEL_KEYS[option])
                    : option}
                </option>
              ))}
            </select>
          </Field>
          <Field label={tBuy("quantityTrays")}>
            <input
              className={fieldClass}
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              disabled={loading}
            />
          </Field>
          <Field label="Price / tray (RWF)">
            <input
              className={fieldClass}
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              disabled={loading}
            />
          </Field>
          <Field label="Min order (trays)">
            <input
              className={fieldClass}
              type="number"
              min={1}
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              required
              disabled={loading}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Farm / depot location">
              <input
                className={fieldClass}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                disabled={loading}
              />
            </Field>
          </div>
          <div className="mt-1 flex gap-2 sm:col-span-2">
            <button
              type="submit"
              className={`${btn.sellCompact} min-w-0 flex-1 sm:px-5.5 sm:py-3.5`}
              disabled={loading}
            >
              {loading ? (
                <ButtonLoader label="Processing…" />
              ) : (
                <>
                  {initial ? tSellOffers("confirmSellOrder") : t("listForSale")}{" "}
                  <Icon name="arrow" />
                </>
              )}
            </button>
            <button
              type="button"
              className={`${btn.outline} shrink-0 px-3.5 py-2.75 text-sm sm:min-w-28 sm:px-4.5`}
              onClick={onClose}
              disabled={loading}
            >
              {tDeals("cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function canRecordStock(role: DashboardRole) {
  return role === "supplier" || role === "aggregator" || role === "admin";
}
