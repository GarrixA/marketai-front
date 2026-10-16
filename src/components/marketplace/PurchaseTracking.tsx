"use client";

import { useMemo } from "react";
import { Icon } from "@/lib/ui";
import {
  formatRwf,
  isDealForSupplier,
  isRfqDeal,
} from "@/lib/marketplaceStore";
import {
  ConfirmTransportButton,
  RequestTransportForm,
  deliveryPriceNote,
} from "@/components/marketplace/TransportActions";
import {
  FulfillmentSteps,
  isFulfillmentStatus,
} from "@/components/marketplace/FulfillmentSteps";
import { mapApiDealToLocal } from "@/lib/mapApiDeal";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import {
  EmptyState,
  Panel,
  StatusBadge,
} from "@/components/marketplace/uiBits";
import { getSession } from "@/lib/session";
import {
  liveDealListOptions,
  useListIncomingDealsQuery,
  useListMyDealsQuery,
} from "@/store/actions/deals";
import type { Deal, DealStatus } from "@/lib/marketplaceTypes";

const FULFILLED: DealStatus[] = [
  "paid",
  "transport_open",
  "transport_quoted",
  "transport_accepted",
  "packaging_requested",
  "in_transit",
  "delivery_pending",
  "delivered",
];

const BUYER_STEPS = ["Paid", "Packaging", "In transit", "Delivered"] as const;

function trackIndex(status: DealStatus) {
  switch (status) {
    case "packaging_requested":
    case "transport_accepted":
      return 1;
    case "in_transit":
      return 2;
    case "delivery_pending":
      return 3;
    case "delivered":
      return 4;
    default:
      return 0;
  }
}

function buyerNote(deal: Deal) {
  switch (deal.status) {
    case "delivered":
      return "You confirmed delivery. The held payment has been released to the seller.";
    case "delivery_pending":
      return `${deal.logisticsName || "The deliverer"} asked you to confirm that ${deal.product} arrived.`;
    case "in_transit":
      return `Packaging is confirmed. ${deal.product} is in transit to ${deal.deliveryLocation}.`;
    case "packaging_requested":
      return "The deliverer is waiting for the seller to confirm packaging.";
    case "transport_accepted":
      return `Delivery is booked${
        deal.transportFee ? ` at ${formatRwf(deal.transportFee)}` : ""
      }. Packaging has not been confirmed yet.`;
    case "transport_quoted":
      return `${deal.logisticsName || "A deliverer"} proposed ${formatRwf(
        deal.transportFee ?? 0
      )}. Waiting for the seller to confirm that price.`;
    case "transport_open":
      return deal.transportOfferedFee
        ? `The seller requested delivery at ${formatRwf(deal.transportOfferedFee)}. Waiting for a deliverer to accept.`
        : "The seller requested delivery without a price. Waiting for a deliverer to propose one.";
    default:
      return `Paid and waiting to be delivered to ${deal.deliveryLocation}.`;
  }
}

function procedureIndex(status: DealStatus) {
  switch (status) {
    case "transport_open":
    case "transport_quoted":
      return 2;
    case "transport_accepted":
    case "packaging_requested":
      return 3;
    case "in_transit":
    case "delivery_pending":
      return 4;
    case "delivered":
      return 5;
    default:
      return 1;
  }
}

const SELLER_STEPS = [
  {
    title: "Payment received",
    body: "The buyer's payment is held until delivery is complete.",
  },
  {
    title: "Request transport",
    body: "Ask logistics to collect the goods and take them to the buyer.",
  },
  {
    title: "Accept a quote",
    body: "Choose a transporter. Booking them starts the delivery.",
  },
  {
    title: "Packaging",
    body: "When logistics asks, confirm the goods are packed.",
  },
  {
    title: "In transit",
    body: "After you confirm packaging, the product is marked in transit.",
  },
] as const;

function useTrackedDeals(perspective: "buyer" | "supplier") {
  const { deals, inventory } = useMarketplace();
  const session = getSession();
  const email = session?.email ?? "";
  const userId = session?.userId;
  const role = session?.role;
  const canFetchMine =
    perspective === "buyer" &&
    Boolean(session) &&
    (role === "buyer" || role === "aggregator" || role === "admin");
  const canFetchIncoming =
    perspective === "supplier" &&
    Boolean(session) &&
    (role === "supplier" || role === "aggregator" || role === "admin");

  const {
    data: myApiDeals = [],
    isLoading: mineLoading,
    isError: mineError,
  } = useListMyDealsQuery(undefined, {
    ...liveDealListOptions,
    skip: !canFetchMine,
  });
  const {
    data: incomingApiDeals = [],
    isLoading: incomingLoading,
    isError: incomingError,
  } = useListIncomingDealsQuery(undefined, {
    ...liveDealListOptions,
    skip: !canFetchIncoming,
  });

  const rows = useMemo(() => {
    const remote =
      perspective === "buyer"
        ? myApiDeals.map(mapApiDealToLocal)
        : incomingApiDeals.map(mapApiDealToLocal);
    const local =
      perspective === "buyer"
        ? deals.filter((deal) => deal.buyerEmail === email && !isRfqDeal(deal))
        : deals.filter(
            (deal) =>
              !isRfqDeal(deal) &&
              isDealForSupplier(deal, email, inventory, userId)
          );
    const byId = new Map<string, Deal>();
    for (const deal of local) byId.set(deal.id, deal);
    for (const deal of remote) byId.set(deal.id, deal);
    return Array.from(byId.values())
      .filter((deal) => FULFILLED.includes(deal.status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [
    perspective,
    deals,
    email,
    inventory,
    userId,
    myApiDeals,
    incomingApiDeals,
  ]);

  const loading =
    (canFetchMine && mineLoading) || (canFetchIncoming && incomingLoading);
  const failed =
    (canFetchMine && mineError) || (canFetchIncoming && incomingError);

  return { rows, loading, failed };
}

export function BuyerOrdersPanel() {
  const { rows, loading, failed } = useTrackedDeals("buyer");
  const waiting = rows.filter(
    (deal) => deal.status !== "in_transit" && deal.status !== "delivered"
  );
  const moving = rows.filter(
    (deal) => deal.status === "in_transit" || deal.status === "delivery_pending"
  );

  return (
    <div className="grid gap-4">
      <Panel
        title="My purchases"
        subtitle="What you paid for, and where each order is on the way to you."
      >
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Summary
            label="Waiting to be delivered"
            value={String(waiting.length)}
          />
          <Summary label="In transit" value={String(moving.length)} />
        </div>
        {loading && rows.length === 0 ? (
          <EmptyState message="Loading purchases…" />
        ) : failed && rows.length === 0 ? (
          <EmptyState message="Purchases could not be loaded. Refresh the page to try again." />
        ) : rows.length === 0 ? (
          <EmptyState message="Paid purchases will show up here, with delivery tracking." />
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((deal) => (
              <BuyerOrderCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

export function SupplierSalesPanel() {
  const { rows, loading, failed } = useTrackedDeals("supplier");

  return (
    <Panel
      title="Sales & delivery"
      subtitle="What you sold, and the steps to get it from your pickup to the buyer."
    >
      {loading && rows.length === 0 ? (
        <EmptyState message="Loading sales…" />
      ) : failed && rows.length === 0 ? (
        <EmptyState message="Sales could not be loaded. Refresh the page to try again." />
      ) : rows.length === 0 ? (
        <EmptyState message="Paid sales will show up here with the delivery steps." />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((deal) => (
            <SupplierSaleCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}
    </Panel>
  );
}

function BuyerOrderCard({ deal }: { deal: Deal }) {
  const current = trackIndex(deal.status);
  const amount =
    deal.paidAmount ??
    (deal.offerPrice ?? 0) * (deal.confirmedQty ?? deal.quantity);

  return (
    <article className="rounded-1.25 border border-soko-line px-3.5 py-3.5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <strong className="block text-[0.875rem]">{deal.product}</strong>
          <small className="text-[0.6875rem] text-soko-muted">
            {deal.supplierName ?? "Seller"} ·{" "}
            {deal.confirmedQty ?? deal.quantity} {deal.unit} ·{" "}
            {formatRwf(amount)}
          </small>
        </div>
        <StatusBadge status={deal.status} />
      </div>
      <TrackSteps current={current} />
      <p className="m-0 mt-3 text-[0.75rem] leading-snug text-soko-ink">
        {buyerNote(deal)}
      </p>
      {deal.status === "delivery_pending" || deal.status === "delivered" ? (
        <FulfillmentSteps deal={deal} actor="buyer" showTrack={false} />
      ) : null}
      <p className="m-0 mt-1 text-[0.6875rem] text-soko-muted">
        Deliver to {deal.deliveryLocation}
        {deal.pickupLocation ? ` · Pickup ${deal.pickupLocation}` : ""}
      </p>
    </article>
  );
}

function SupplierSaleCard({ deal }: { deal: Deal }) {
  const current = procedureIndex(deal.status);
  const amount =
    deal.paidAmount ??
    (deal.offerPrice ?? 0) * (deal.confirmedQty ?? deal.quantity);

  return (
    <article className="rounded-1.25 border border-soko-line px-3.5 py-3.5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <strong className="block text-[0.875rem]">{deal.product}</strong>
          <small className="text-[0.6875rem] text-soko-muted">
            {deal.buyerBusiness || deal.buyerName} ·{" "}
            {deal.confirmedQty ?? deal.quantity} {deal.unit} ·{" "}
            {formatRwf(amount)}
          </small>
        </div>
        <StatusBadge status={deal.status} />
      </div>
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {SELLER_STEPS.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li key={step.title} className="flex gap-3">
              <span
                className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.6875rem] font-bold ${
                  done
                    ? "bg-[#12b76a] text-white"
                    : active
                      ? "bg-[#5b4dff] text-white"
                      : "bg-[#f2f4f7] text-[#98a2b3]"
                }`}
              >
                {done ? <Icon name="check" size={14} /> : index + 1}
              </span>
              <div>
                <p className="m-0 text-[0.8125rem] font-bold text-soko-ink">
                  {step.title}
                </p>
                <p className="m-0 mt-0.5 text-[0.6875rem] leading-snug text-soko-muted">
                  {step.body}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="m-0 mt-3 text-[0.6875rem] text-soko-muted">
        {deal.pickupLocation ?? "Pickup not set"} → {deal.deliveryLocation}
      </p>
      {deal.status === "paid" ? <RequestTransportForm deal={deal} /> : null}
      {deal.status === "transport_quoted" ? (
        <ConfirmTransportButton deal={deal} />
      ) : null}
      {isFulfillmentStatus(deal.status) ? (
        <FulfillmentSteps deal={deal} actor="supplier" showTrack={false} />
      ) : null}
      {deliveryPriceNote(deal) && deal.status !== "transport_quoted" ? (
        <p className="m-0 mt-3 text-[0.6875rem] text-soko-ink">
          {deliveryPriceNote(deal)}
        </p>
      ) : null}
    </article>
  );
}

function TrackSteps({ current }: { current: number }) {
  return (
    <ol className="m-0 flex list-none gap-2 p-0">
      {BUYER_STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="min-w-0 flex-1">
            <span
              className={`block h-1.5 rounded-full ${
                done || active ? "bg-[#5b4dff]" : "bg-[#eaecf0]"
              }`}
            />
            <span
              className={`mt-1.5 block text-[0.625rem] leading-tight font-semibold ${
                active ? "text-[#5b4dff]" : "text-soko-muted"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-1.25 bg-soko-slate px-3 py-2.5">
      <p className="m-0 text-[0.625rem] font-bold tracking-wide text-soko-muted uppercase">
        {label}
      </p>
      <p className="m-0 mt-1 font-display text-xl font-bold text-soko-ink">
        {value}
      </p>
    </div>
  );
}
