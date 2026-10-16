"use client";

import { useState } from "react";
import { Icon, btn } from "@/lib/ui";
import {
  createBuyRequest,
  formatRwf,
  isDealForSupplier,
  isRfqDeal,
} from "@/lib/marketplaceStore";
import { waitForAction } from "@/lib/actionDelay";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import { ConfirmDealForm } from "@/components/marketplace/ConfirmDealForm";
import {
  EmptyState,
  Field,
  Panel,
  StatusBadge,
  fieldClass,
} from "@/components/marketplace/uiBits";
import {
  TradeResultModal,
  type TradeResult,
} from "@/components/marketplace/TradeResultModal";
import { ActionOverlay, ButtonLoader } from "@/components/ActionLoader";
import { getSession } from "@/lib/session";

export function BuyRequestsPanel({ mode }: { mode: "mine" | "incoming" }) {
  const { deals, inventory } = useMarketplace();
  const session = getSession();
  const email = session?.email ?? "";
  const userId = session?.userId;

  const [product, setProduct] = useState("Fresh eggs · Large");
  const [quantity, setQuantity] = useState("300");
  const [location, setLocation] = useState("Kigali");
  const [date, setDate] = useState("2026-10-12");
  const [price, setPrice] = useState("4000");
  const [notes, setNotes] = useState("");
  const [tradeResult, setTradeResult] = useState<TradeResult | null>(null);
  const [loading, setLoading] = useState(false);

  // This page only lists RFQs created here. Product/listing buys live on Deals.
  const list =
    mode === "mine"
      ? deals.filter((d) => d.buyerEmail === email && isRfqDeal(d))
      : deals.filter(
          (d) => isRfqDeal(d) && isDealForSupplier(d, email, inventory, userId)
        );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || loading) return;
    setLoading(true);
    await waitForAction();
    const qty = Number(quantity) || 0;
    createBuyRequest({
      buyerEmail: session.email,
      buyerName: session.name,
      buyerBusiness: session.businessName,
      product,
      quantity: qty,
      unit: "trays",
      deliveryLocation: location,
      requiredDate: date,
      targetPrice: Number(price) || 0,
      notes,
    });
    setNotes("");
    setLoading(false);
    setTradeResult({
      kind: "buy",
      title: "Buy request sent",
      message:
        "Suppliers can review this RFQ here and confirm or reject available quantity.",
      details: [
        product,
        `${qty} trays · needed by ${date}`,
        `Delivery to ${location}`,
        `Target ${formatRwf(Number(price) || 0)}/tray`,
      ],
    });
  };

  return (
    <>
      <div className="grid grid-cols-[1.1fr_1fr] gap-4.25 max-lg:grid-cols-1">
        {mode === "mine" ? (
          <Panel
            title="New buy request"
            subtitle="Publish an open RFQ. Buying a listed product notifies the seller on Deals instead."
          >
            <div className="relative">
              {loading ? <ActionOverlay label="Sending buy request…" /> : null}
              <form
                className="grid grid-cols-2 gap-3 max-sm:grid-cols-1"
                onSubmit={submit}
              >
                <Field label="Product">
                  <select
                    className={fieldClass}
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    required
                    disabled={loading}
                  >
                    {[
                      "Fresh eggs · Large",
                      "Fresh eggs · Medium",
                      "Fresh eggs · Small",
                      "Fresh eggs · Mixed",
                      "Fresh eggs · Organic Large",
                      "Fresh eggs · Free-range",
                    ].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Quantity (trays)">
                  <input
                    className={fieldClass}
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Field>
                <Field label="Delivery location">
                  <input
                    className={fieldClass}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Field>
                <Field label="Required date">
                  <input
                    className={fieldClass}
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Field>
                <Field label="Target price / tray (RWF)">
                  <input
                    className={fieldClass}
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={loading}
                  />
                </Field>
                <Field label="Notes">
                  <input
                    className={fieldClass}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Frequency, quality, packaging…"
                    disabled={loading}
                  />
                </Field>
                <div className="col-span-full">
                  <button
                    type="submit"
                    className={`${btn.buyCompact} w-full sm:w-auto sm:px-5.5 sm:py-3.5`}
                    disabled={loading}
                  >
                    {loading ? (
                      <ButtonLoader label="Sending…" />
                    ) : (
                      <>
                        Send buy request <Icon name="arrow" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </Panel>
        ) : (
          <Panel
            title="How confirmation works"
            subtitle="Confirm or reject requests for your listings only."
          >
            <ol className="m-0 list-decimal space-y-3 pl-4 text-xs text-soko-muted">
              <li>Buyers request stock from your product listings.</li>
              <li>Confirm available trays and your offer price, or reject.</li>
              <li>Buyer pays against the confirmed deal.</li>
              <li>You request transport once payment shows on the deal.</li>
            </ol>
          </Panel>
        )}

        <Panel
          title={mode === "mine" ? "My RFQs" : "Open RFQs"}
          subtitle={
            mode === "mine"
              ? "RFQs you published here. Product purchases appear under Deals."
              : "Open RFQs from buyers — confirm or reject available quantity."
          }
        >
          {list.length === 0 ? (
            <EmptyState
              message={
                mode === "mine"
                  ? "No RFQs yet. Use the form to publish one, or buy a product from Products (that goes to Deals)."
                  : "No open RFQs yet."
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {list.map((deal) => (
                <article
                  key={deal.id}
                  className="rounded-1.25 border border-soko-line px-3.5 py-3.5"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <strong className="block text-[0.8125rem]">
                        {deal.product}
                      </strong>
                      <small className="text-[0.5625rem] text-soko-muted">
                        {mode === "mine"
                          ? `${deal.supplierName ?? "To suppliers"} · ${deal.deliveryLocation}`
                          : `${deal.buyerBusiness} · ${deal.deliveryLocation}`}
                      </small>
                    </div>
                    <StatusBadge status={deal.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[0.625rem] max-sm:grid-cols-2">
                    <div>
                      <span className="block text-soko-muted">Requested</span>
                      <b>
                        {deal.quantity} {deal.unit}
                      </b>
                    </div>
                    <div>
                      <span className="block text-soko-muted">Target</span>
                      <b>{formatRwf(deal.targetPrice)}/tray</b>
                    </div>
                    <div>
                      <span className="block text-soko-muted">Needed by</span>
                      <b>{deal.requiredDate}</b>
                    </div>
                  </div>
                  {deal.confirmedQty ? (
                    <p className="mt-2 mb-0 text-[0.625rem] text-soko-green-2">
                      Confirmed {deal.confirmedQty} trays @{" "}
                      {formatRwf(deal.offerPrice ?? 0)}
                      {deal.supplierName ? ` · ${deal.supplierName}` : ""}
                    </p>
                  ) : null}
                  {mode === "incoming" && deal.status === "requested" ? (
                    <ConfirmDealForm deal={deal} />
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <TradeResultModal
        result={tradeResult}
        onClose={() => setTradeResult(null)}
      />
    </>
  );
}
