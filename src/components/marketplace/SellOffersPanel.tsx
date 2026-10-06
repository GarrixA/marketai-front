"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon, btn } from "@/lib/ui";
import {
  createBuyFromListing,
  formatRwf,
} from "@/lib/marketplaceStore";
import { waitForAction } from "@/lib/actionDelay";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import {
  EmptyState,
  Field,
  Panel,
  fieldClass,
} from "@/components/marketplace/uiBits";
import {
  TradeResultModal,
  type TradeResult,
} from "@/components/marketplace/TradeResultModal";
import { ActionOverlay, ButtonLoader } from "@/components/ActionLoader";
import { markSellOffersSeen } from "@/lib/sellOffersSeen";
import { getSession } from "@/lib/session";
import type { SellOffer } from "@/lib/marketplaceTypes";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function BuyOfferModal({
  offer,
  onClose,
  onConfirm,
}: {
  offer: SellOffer;
  onClose: () => void;
  onConfirm: (qty: number, delivery: string) => void | Promise<void>;
}) {
  const [qty, setQty] = useState(String(offer.minOrder));
  const [delivery, setDelivery] = useState("Kigali");
  const [loading, setLoading] = useState(false);

  return (
    <div className="fixed inset-0 z-100 grid place-items-center overflow-y-auto bg-[#08141cb8] p-4 backdrop-blur-sm sm:p-6">
      <div className="relative my-auto w-full max-w-100 rounded-2.5 bg-white px-5 py-6 sm:px-7">
        {loading ? <ActionOverlay label="Sending buy request…" /> : null}
        <button
          type="button"
          className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full border border-[#ddd] bg-white disabled:opacity-50"
          onClick={onClose}
          disabled={loading}
          aria-label="Close buy modal"
        >
          <Icon name="close" size={16} />
        </button>
        <h3 className="m-0 pr-8 font-display text-[1.125rem] font-bold">
          Buy from {offer.ownerName}
        </h3>
        <p className="mt-1 mb-4 text-[0.625rem] text-soko-muted">
          {offer.product} · {offer.grade} · {formatRwf(offer.pricePerUnit)}/tray
        </p>
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (loading) return;
            setLoading(true);
            await waitForAction();
            await onConfirm(Number(qty) || offer.minOrder, delivery);
            setLoading(false);
          }}
        >
          <Field label="Quantity (trays)">
            <input
              className={fieldClass}
              type="number"
              min={offer.minOrder}
              max={offer.quantity}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              required
              disabled={loading}
            />
          </Field>
          <Field label="Delivery location">
            <input
              className={fieldClass}
              value={delivery}
              onChange={(e) => setDelivery(e.target.value)}
              required
              disabled={loading}
            />
          </Field>
          <p className="m-0 text-[0.625rem] text-soko-muted">
            Estimated total{" "}
            <b className="text-soko-ink">
              {formatRwf((Number(qty) || 0) * offer.pricePerUnit)}
            </b>
          </p>
          <button
            type="submit"
            className={`${btn.buyCompact} w-full sm:px-5.5 sm:py-3.5`}
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
        </form>
      </div>
    </div>
  );
}

export function SellOffersPanel() {
  const { sellOffers } = useMarketplace();
  const session = getSession();
  const email = session?.email ?? "";
  const [roleFilter, setRoleFilter] = useState<"all" | "supplier" | "aggregator">(
    "all"
  );
  const [buying, setBuying] = useState<SellOffer | null>(null);
  const [tradeResult, setTradeResult] = useState<TradeResult | null>(null);

  useEffect(() => {
    if (!email) return;
    markSellOffersSeen(email);
  }, [email, sellOffers.length]);

  const offers = useMemo(() => {
    return sellOffers
      .filter((item) => item.ownerEmail !== email)
      .filter((item) =>
        roleFilter === "all" ? true : item.ownerRole === roleFilter
      )
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }, [sellOffers, email, roleFilter]);

  return (
    <>
      <div className="space-y-4">
        <Panel
          title="Confirmed sell offers"
          subtitle="Only products a supplier or aggregator confirmed with Sell → Confirm sell order."
          action={
            <div className="inline-flex rounded-full bg-[#e8ebe6] p-1">
              {(
                [
                  ["all", "All"],
                  ["supplier", "Suppliers"],
                  ["aggregator", "Aggregators"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRoleFilter(value)}
                  className={`rounded-full border-0 px-3.5 py-1.5 text-[0.6875rem] font-bold ${
                    roleFilter === value
                      ? "bg-soko-green text-white"
                      : "bg-transparent text-soko-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        >
          {offers.length === 0 ? (
            <EmptyState message="No confirmed sell offers yet. When a seller confirms Sell, it appears here." />
          ) : (
            <div className="flex flex-col gap-3">
              {offers.map((item) => (
                <article
                  key={item.id}
                  className="rounded-1.25 border border-[#e5e4df] px-3.5 py-3.5"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="relative grid h-9 w-9 place-items-center rounded-full bg-[#e8ecf0] text-[0.6875rem] font-extrabold text-soko-green">
                        {initials(item.ownerName)}
                      </span>
                      <div>
                        <strong className="block text-[0.8125rem]">
                          {item.ownerName}
                        </strong>
                        <small className="text-[0.5625rem] text-soko-muted">
                          {item.product} · {item.grade}
                        </small>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#eef1f4] px-2 py-0.75 text-[0.5rem] font-bold tracking-wide text-soko-green uppercase">
                      {item.ownerRole}
                    </span>
                  </div>

                  <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <p className="m-0 font-display text-[1.125rem] font-bold">
                        {formatRwf(item.pricePerUnit)}
                        <span className="text-[0.6875rem] font-semibold text-soko-muted">
                          {" "}
                          / tray
                        </span>
                      </p>
                      <p className="m-0 mt-1 text-[0.625rem] text-soko-muted">
                        {item.quantity} trays available · Min {item.minOrder} ·{" "}
                        {item.location}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={btn.buySm}
                      onClick={() => setBuying(item)}
                    >
                      Buy
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {buying ? (
        <BuyOfferModal
          offer={buying}
          onClose={() => setBuying(null)}
          onConfirm={async (qty, delivery) => {
            if (!session) return;
            const deal = createBuyFromListing({
              listingId: buying.listingId,
              quantity: qty,
              buyerEmail: session.email,
              buyerName: session.name,
              buyerBusiness: session.businessName,
              deliveryLocation: delivery,
            });
            setBuying(null);
            if (!deal) return;
            setTradeResult({
              kind: "buy",
              title: "Buy request sent",
              message:
                "The seller can confirm or reject this request from Buy Requests.",
              details: [
                `${deal.product}`,
                `${deal.quantity} trays · ${formatRwf(deal.targetPrice)}/tray`,
                `Delivery to ${deal.deliveryLocation}`,
                deal.supplierName ? `Seller ${deal.supplierName}` : "",
              ].filter(Boolean),
            });
          }}
        />
      ) : null}

      <TradeResultModal
        result={tradeResult}
        onClose={() => setTradeResult(null)}
      />
    </>
  );
}
