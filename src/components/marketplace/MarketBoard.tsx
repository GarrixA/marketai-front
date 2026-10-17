"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ActionButton, ActionToggle, Icon } from "@/lib/ui";
import { EmptyState } from "@/components/marketplace/uiBits";
import { BuyQtyModal } from "@/components/marketplace/ProductMarketPanel";
import { ConfirmDealForm } from "@/components/marketplace/ConfirmDealForm";
import {
  TradeResultModal,
  type TradeResult,
} from "@/components/marketplace/TradeResultModal";
import { formatRwandaLocation } from "@/components/forms/RwandaLocationFields";
import { openRequestToDeal } from "@/lib/openBuyRequest";
import { availableStock } from "@/lib/eggType";
import { formatRwf } from "@/lib/marketplaceStore";
import { productImageSrc } from "@/lib/productImage";
import { getSession, type DashboardRole } from "@/lib/session";
import { useAppDialog } from "@/hooks/useAppDialog";
import { useCreateDealMutation } from "@/store/actions/deals";
import {
  useListMyProductsQuery,
  useListSellRequestsQuery,
} from "@/store/actions/products";
import { useListMarketBuyRequestsQuery } from "@/store/actions/requests";
import type { Deal } from "@/lib/marketplaceTypes";
import type { MarketplaceProduct } from "@/types/product";

function formatNeededBy(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function MarketCard({
  image,
  title,
  subtitle,
  price,
  unit,
  quantityLabel,
  location,
  badge,
  action,
}: {
  image: string;
  title: string;
  subtitle: string;
  price: number;
  unit: string;
  quantityLabel: string;
  location: string;
  badge: { label: string; className: string };
  action: ReactNode;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-1.75 border border-soko-line bg-white">
      <img
        src={image}
        alt={title}
        className="h-36 w-full object-cover object-[center_46%]"
      />
      <div className="flex flex-1 flex-col px-3 py-3.5 sm:px-4.5 sm:py-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <strong className="block truncate text-[0.8125rem] sm:text-[0.875rem]">
              {title}
            </strong>
            <small className="text-[0.5625rem] text-soko-muted sm:text-[0.625rem]">
              {subtitle}
            </small>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.75 text-[0.5rem] font-bold tracking-wide uppercase ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>

        <p className="m-0 mb-1 font-display text-[1.0625rem] font-bold sm:text-[1.125rem]">
          {Number(price || 0).toLocaleString("en-RW")}{" "}
          <span className="text-[0.75rem] font-semibold text-soko-muted">
            RWF / {unit}
          </span>
        </p>
        <p className="m-0 mb-1 text-[0.625rem] text-soko-ink sm:text-[0.6875rem]">
          {quantityLabel}
        </p>
        <p className="m-0 mb-3 line-clamp-2 flex items-start gap-1 text-[0.5625rem] text-soko-muted sm:text-[0.625rem]">
          <Icon name="pin" size={13} className="mt-0.5 shrink-0" />
          <span>{location}</span>
        </p>
        <div className="mt-auto">{action}</div>
      </div>
    </article>
  );
}

export function MarketBoard({ role }: { role: DashboardRole }) {
  const session = getSession();
  const { dialog, showError, showSuccess } = useAppDialog();
  const [createDeal] = useCreateDealMutation();
  const canBuy = role === "buyer" || role === "aggregator";
  const canSell = role === "supplier" || role === "aggregator";
  const { data: sellRequests = [], isLoading } = useListSellRequestsQuery(
    { excludeOwn: true },
    { skip: !canBuy }
  );
  const { data: openRequests = [], isLoading: requestsLoading } =
    useListMarketBuyRequestsQuery(undefined, {
      skip: !canSell,
      pollingInterval: 8_000,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    });
  const { data: myProducts = [] } = useListMyProductsQuery(undefined, {
    skip: !canSell,
  });

  const [marketTab, setMarketTab] = useState<"buy" | "sell">("buy");
  const [buying, setBuying] = useState<MarketplaceProduct | null>(null);
  const [selling, setSelling] = useState<Deal | null>(null);
  const [tradeResult, setTradeResult] = useState<TradeResult | null>(null);
  const showingBuy = role === "aggregator" ? marketTab === "buy" : canBuy;
  const showingSell = role === "aggregator" ? marketTab === "sell" : canSell;

  const listings = useMemo(
    () =>
      sellRequests.filter(
        (product) => product.isAvailable && product.availableQuantity > 0
      ),
    [sellRequests]
  );

  const requests = useMemo(
    () => openRequests.map(openRequestToDeal),
    [openRequests]
  );
  const offeredIds = useMemo(
    () =>
      new Set(
        openRequests
          .filter((request) => request.hasMyOffer)
          .map((request) => request.id)
      ),
    [openRequests]
  );

  return (
    <div className="space-y-8">
      {dialog}

      {role === "aggregator" ? (
        <ActionToggle
          value={marketTab}
          onChange={setMarketTab}
          options={[
            { value: "buy", label: "Buy", icon: "cart", activeVariant: "buy" },
            {
              value: "sell",
              label: "Sell",
              icon: "tag",
              activeVariant: "sell",
            },
          ]}
        />
      ) : null}

      {showingBuy ? (
        <section className="space-y-3">
          {isLoading ? (
            <EmptyState message="Loading listings…" />
          ) : listings.length === 0 ? (
            <EmptyState message="No listings yet." />
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {listings.map((product) => (
                <MarketCard
                  key={product.id}
                  image={productImageSrc(product.imageUrl)}
                  title={product.name}
                  subtitle={[
                    product.category?.name ?? "Uncategorized",
                    product.grade,
                    product.size,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  price={Number(product.price || 0)}
                  unit={product.unit.toLowerCase()}
                  quantityLabel={
                    product.sellMode === "LOT"
                      ? `Lot of ${product.availableQuantity} ${product.unit}`
                      : `Available ${product.availableQuantity} ${product.unit}`
                  }
                  location={`${formatRwandaLocation(product.location)}${
                    product.useMarketplaceLocation ? " · profile location" : ""
                  }`}
                  badge={{
                    label: product.sellMode === "LOT" ? "Whole lot" : "By unit",
                    className: "bg-[#dcfce7] text-[#16a34a]",
                  }}
                  action={
                    <ActionButton
                      variant="buy"
                      size="sm"
                      onClick={() => setBuying(product)}
                    >
                      Buy
                    </ActionButton>
                  }
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {showingSell ? (
        <section className="space-y-3">
          {requestsLoading ? (
            <EmptyState message="Loading buy requests…" />
          ) : requests.length === 0 ? (
            <EmptyState message="No open buy requests yet." />
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {requests.map((deal) => (
                <MarketCard
                  key={deal.id}
                  image={productImageSrc(null)}
                  title={deal.product}
                  subtitle={`${deal.buyerBusiness || deal.buyerName} · needed by ${formatNeededBy(deal.requiredDate)}`}
                  price={deal.targetPrice}
                  unit={deal.unit.toLowerCase()}
                  quantityLabel={(() => {
                    const stock = availableStock(
                      myProducts,
                      deal.product,
                      deal.unit
                    );
                    return `Requested ${deal.quantity} ${deal.unit} · You have ${stock.quantity} ${stock.unitLabel}`;
                  })()}
                  location={
                    deal.deliveryLocation || "Delivery location not set"
                  }
                  badge={{
                    label: "Request",
                    className: "bg-[#fff1e6] text-[#c2410c]",
                  }}
                  action={
                    offeredIds.has(deal.id) ? (
                      <p className="m-0 text-[0.625rem] font-semibold text-soko-green-2">
                        Offer sent
                      </p>
                    ) : (
                      <ActionButton
                        variant="sell"
                        size="sm"
                        onClick={() => setSelling(deal)}
                      >
                        Sell
                      </ActionButton>
                    )
                  }
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {buying ? (
        <BuyQtyModal
          product={buying}
          onClose={() => setBuying(null)}
          showError={showError}
          showSuccess={showSuccess}
          onConfirm={async (qty, delivery) => {
            if (!session) return;
            const product = buying;
            const ownerId = product.ownerId ?? product.owner?.id;
            if (!ownerId) {
              await showError(
                "This listing has no seller account attached. Try another product.",
                { title: "Could not send buy request" }
              );
              return;
            }

            const deal = await createDeal({
              productId: product.id,
              quantity: qty,
              deliveryLocation: delivery,
            }).unwrap();

            setBuying(null);
            const productLabel = deal.grade
              ? `${deal.productName} · ${deal.grade}`
              : deal.productName;
            setTradeResult({
              kind: "buy",
              title: "Buy request sent",
              message:
                "The seller was notified on Deals. They will confirm available quantity before payment.",
              details: [
                productLabel,
                `${deal.quantity} ${deal.unit.toLowerCase()} · ${formatRwf(deal.targetPrice)} / ${deal.unit.toLowerCase()}`,
                `Delivery to ${deal.deliveryLocation}`,
                deal.supplierName ? `Seller ${deal.supplierName}` : "",
              ].filter(Boolean),
            });
          }}
        />
      ) : null}

      {selling ? (
        <div className="fixed inset-0 z-100 grid place-items-center overflow-y-auto bg-soko-navy/72 p-4 backdrop-blur-sm sm:p-6">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="m-0 font-display text-lg font-bold">
                  Sell into request
                </h3>
                <p className="m-0 mt-1 text-xs text-soko-muted">
                  {selling.product} · {selling.quantity} {selling.unit} ·{" "}
                  {selling.buyerBusiness || selling.buyerName}
                </p>
              </div>
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-full border-0 bg-soko-slate text-soko-ink"
                onClick={() => setSelling(null)}
                aria-label="Close"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
            <ConfirmDealForm
              deal={selling}
              allowReject={false}
              onConfirmed={() => {
                const current = selling;
                setSelling(null);
                setTradeResult({
                  kind: "sell",
                  title: "Sell offer sent",
                  message:
                    "The buyer can review the quantity and price you confirmed.",
                  details: [
                    current.product,
                    `${current.quantity} ${current.unit}`,
                    current.buyerBusiness || current.buyerName,
                  ].filter(Boolean),
                });
              }}
            />
          </div>
        </div>
      ) : null}

      <TradeResultModal
        result={tradeResult}
        onClose={() => setTradeResult(null)}
      />
    </div>
  );
}
