"use client";

import { useMemo, useState } from "react";
import { Icon, btn } from "@/lib/ui";
import {
  createBuyFromListing,
  formatRwf,
  removeInventory,
} from "@/lib/marketplaceStore";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import { EmptyState, Field, fieldClass } from "@/components/marketplace/uiBits";
import { RecordStockModal } from "@/components/marketplace/RecordStockModal";
import {
  TradeResultModal,
  type TradeResult,
} from "@/components/marketplace/TradeResultModal";
import { ActionOverlay, ButtonLoader } from "@/components/ActionLoader";
import { waitForAction } from "@/lib/actionDelay";
import { getSession, type DashboardRole } from "@/lib/session";
import type { InventoryItem } from "@/lib/marketplaceTypes";

type MarketMode = "buy" | "sell";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ProductCard({
  item,
  action,
  onAction,
}: {
  item: InventoryItem;
  action: "Buy" | "Sell";
  onAction: () => void;
}) {
  const maxValue = item.quantity * item.pricePerUnit;
  const minValue = item.minOrder * item.pricePerUnit;

  return (
    <article className="rounded-1.75 border border-[#ddded9] bg-white px-4.5 py-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="relative grid h-9 w-9 place-items-center rounded-full bg-[#e8ecf0] text-[0.6875rem] font-extrabold text-soko-green">
            {initials(item.ownerName)}
            <i className="absolute right-0 bottom-0 h-2.25 w-2.25 rounded-full border-2 border-white bg-soko-amber" />
          </span>
          <div>
            <strong className="block text-[0.8125rem]">{item.ownerName}</strong>
            <small className="text-[0.5625rem] text-soko-muted">
              {item.trades} trades ({item.completionRate.toFixed(2)}%) ·{" "}
              {item.rating.toFixed(2)}%
            </small>
          </div>
        </div>
        <span className="rounded-full bg-[#eef1f4] px-2 py-0.75 text-[0.5rem] font-bold tracking-wide text-soko-green uppercase">
          {item.ownerRole}
        </span>
      </div>

      <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="m-0 font-display text-[1.25rem] font-bold">
            {formatRwf(item.pricePerUnit)}{" "}
            <span className="text-[0.75rem] font-semibold text-soko-muted">
              / tray
            </span>
          </p>
          <p className="m-0 mt-1 text-[0.6875rem] text-soko-ink">
            {item.product} · {item.grade}
          </p>
        </div>
        <p className="m-0 text-right text-[0.625rem] text-soko-muted">
          Available{" "}
          <b className="text-soko-ink">
            {item.quantity} {item.unit}
          </b>
        </p>
      </div>

      <p className="m-0 mb-3 text-[0.625rem] text-soko-muted">
        Limit {formatRwf(minValue)} – {formatRwf(maxValue)} · {item.location}
      </p>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-[0.625rem] text-soko-muted">
          <span className="inline-flex items-center gap-1 truncate">
            <Icon name="pin" size={13} />
            {item.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="truck" size={13} />
            {item.responseMins} min
          </span>
        </div>
        <button
          type="button"
          className={action === "Sell" ? btn.sellSm : btn.buySm}
          onClick={onAction}
        >
          {action}
        </button>
      </div>
    </article>
  );
}

function BuyQtyModal({
  item,
  onClose,
  onConfirm,
}: {
  item: InventoryItem;
  onClose: () => void;
  onConfirm: (qty: number, delivery: string) => void | Promise<void>;
}) {
  const [qty, setQty] = useState(String(item.minOrder));
  const [delivery, setDelivery] = useState("Kigali");
  const [loading, setLoading] = useState(false);

  return (
    <div className="fixed inset-0 z-100 grid place-items-center bg-[#08141cb8] p-6 backdrop-blur-sm">
      <div className="relative w-full max-w-100 rounded-2.5 bg-white px-7 py-6">
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
          Buy from {item.ownerName}
        </h3>
        <p className="mt-1 mb-4 text-[0.625rem] text-soko-muted">
          {item.product} · {item.grade} · {formatRwf(item.pricePerUnit)}/tray
        </p>
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (loading) return;
            setLoading(true);
            await waitForAction();
            await onConfirm(Number(qty) || item.minOrder, delivery);
            setLoading(false);
          }}
        >
          <Field label="Quantity (trays)">
            <input
              className={fieldClass}
              type="number"
              min={item.minOrder}
              max={item.quantity}
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
              {formatRwf((Number(qty) || 0) * item.pricePerUnit)}
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

export function ProductMarketPanel({ role }: { role: DashboardRole }) {
  const { inventory } = useMarketplace();
  const session = getSession();
  const email = session?.email ?? "";

  const defaultMode: MarketMode =
    role === "supplier" ? "sell" : role === "buyer" ? "buy" : "buy";
  const [mode, setMode] = useState<MarketMode>(defaultMode);
  const [gradeFilter, setGradeFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [stockOpen, setStockOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [buying, setBuying] = useState<InventoryItem | null>(null);
  const [tradeResult, setTradeResult] = useState<TradeResult | null>(null);

  const showToggle = role === "aggregator";
  const activeMode: MarketMode = showToggle
    ? mode
    : role === "supplier"
      ? "sell"
      : "buy";

  const grades = useMemo(() => {
    const set = new Set(inventory.map((i) => i.grade));
    return ["All", ...Array.from(set)];
  }, [inventory]);

  const list = useMemo(() => {
    let rows =
      activeMode === "sell"
        ? inventory.filter((i) => i.ownerEmail === email)
        : inventory.filter((i) => i.ownerEmail !== email && i.quantity > 0);

    // Buyers and aggregators (buy mode) can buy from suppliers and aggregators
    if (activeMode === "buy") {
      rows = rows.filter(
        (i) => i.ownerRole === "supplier" || i.ownerRole === "aggregator"
      );
    }

    if (gradeFilter !== "All") {
      rows = rows.filter((i) => i.grade === gradeFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(
        (i) =>
          i.ownerName.toLowerCase().includes(q) ||
          i.product.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q) ||
          i.grade.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [inventory, email, activeMode, gradeFilter, query]);

  const cardAction: "Buy" | "Sell" = activeMode === "buy" ? "Buy" : "Sell";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {showToggle ? (
          <div className="inline-flex rounded-full bg-[#e8ebe6] p-1">
            {(["buy", "sell"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-full border-0 px-5 py-2 text-[0.75rem] font-bold capitalize ${
                  mode === m
                    ? m === "buy"
                      ? "bg-[#22c55e] text-white shadow-sm"
                      : "bg-[#ef4444] text-white shadow-sm"
                    : "bg-transparent text-soko-muted"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        ) : (
          <span
            className={`rounded-full px-3 py-1.5 text-[0.6875rem] font-bold ${
              role === "supplier"
                ? "bg-[#fee2e2] text-[#dc2626]"
                : "bg-[#dcfce7] text-[#16a34a]"
            }`}
          >
            {role === "supplier" ? "Your sell listings" : "Buy from market"}
          </span>
        )}

        <span className="ml-auto rounded-full border border-[#ddd] bg-white px-3 py-1.5 text-[0.6875rem] font-bold">
          RWF
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          className={`${fieldClass} max-w-55`}
          placeholder="Search seller, product, location…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className={fieldClass}
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
        >
          {grades.map((g) => (
            <option key={g} value={g}>
              {g === "All" ? "All grades" : g}
            </option>
          ))}
        </select>
        <span className="self-center text-[0.625rem] text-soko-muted">
          {list.length} product{list.length === 1 ? "" : "s"}
        </span>
      </div>

      {list.length === 0 ? (
        <EmptyState
          message={
            activeMode === "sell"
              ? "No sell listings yet. Publish stock to start selling."
              : "No products available to buy right now."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3.25 sm:grid-cols-2">
          {list.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              action={cardAction}
              onAction={() => {
                if (cardAction === "Buy") {
                  setBuying(item);
                  return;
                }
                setEditing(item);
                setStockOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {activeMode === "sell" && list.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {list.slice(0, 3).map((item) => (
            <button
              key={`rm-${item.id}`}
              type="button"
              className="border-0 bg-transparent text-[0.5625rem] text-soko-muted underline"
              onClick={() => removeInventory(item.id)}
            >
              Remove {item.grade}
            </button>
          ))}
        </div>
      ) : null}

      <RecordStockModal
        key={editing?.id ?? "new"}
        open={stockOpen}
        initial={editing}
        onClose={() => {
          setStockOpen(false);
          setEditing(null);
        }}
        onSuccess={(result) => {
          setTradeResult({
            kind: "sell",
            title: result.isUpdate
              ? "Sell order confirmed"
              : "Listing published",
            message: result.isUpdate
              ? "Your sell offer has been updated and is visible to buyers."
              : "Your product is now live for buyers on the marketplace.",
            details: [
              `${result.product} · ${result.grade}`,
              `${result.quantity} trays @ ${formatRwf(result.pricePerUnit)}/tray`,
              result.location,
            ],
          });
        }}
      />

      {buying ? (
        <BuyQtyModal
          item={buying}
          onClose={() => setBuying(null)}
          onConfirm={(qty, delivery) => {
            if (!session) return;
            const item = buying;
            createBuyFromListing({
              listingId: item.id,
              quantity: qty,
              buyerEmail: session.email,
              buyerName: session.name,
              buyerBusiness: session.businessName,
              deliveryLocation: delivery,
            });
            setBuying(null);
            setTradeResult({
              kind: "buy",
              title: "Buy request sent",
              message:
                "The seller has been notified. They will confirm quantity before payment.",
              details: [
                `${item.product} · ${item.grade}`,
                `${qty} trays from ${item.ownerName}`,
                `Delivery to ${delivery}`,
                `Est. ${formatRwf(qty * item.pricePerUnit)}`,
              ],
            });
          }}
        />
      ) : null}

      <TradeResultModal
        result={tradeResult}
        onClose={() => setTradeResult(null)}
      />
    </div>
  );
}
