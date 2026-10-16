"use client";

import { useMemo } from "react";
import { formatRwf } from "@/lib/marketplaceStore";
import { mapApiDealToLocal } from "@/lib/mapApiDeal";
import {
  liveDealListOptions,
  useListTransportDealsQuery,
} from "@/store/actions/deals";
import {
  DelivererJobActions,
  deliveryPriceNote,
} from "@/components/marketplace/TransportActions";
import {
  FulfillmentSteps,
  isFulfillmentStatus,
} from "@/components/marketplace/FulfillmentSteps";
import {
  EmptyState,
  Panel,
  StatusBadge,
} from "@/components/marketplace/uiBits";
import { getSession } from "@/lib/session";
import type { Deal } from "@/lib/marketplaceTypes";

const OPEN = new Set<Deal["status"]>(["transport_open", "transport_quoted"]);

export function TransportJobsPanel() {
  const session = getSession();
  const {
    data: apiDeals = [],
    isLoading,
    isError,
  } = useListTransportDealsQuery(undefined, liveDealListOptions);

  const jobs = useMemo(() => {
    return apiDeals
      .map(mapApiDealToLocal)
      .sort((a, b) =>
        (b.transportOpenedAt ?? b.createdAt).localeCompare(
          a.transportOpenedAt ?? a.createdAt
        )
      );
  }, [apiDeals]);

  const openJobs = jobs.filter((deal) => OPEN.has(deal.status));
  const mine = jobs.filter(
    (deal) =>
      (deal.logisticsEmail === session?.email ||
        deal.transportQuotes.some(
          (quote) => quote.logisticsEmail === session?.email
        )) &&
      (isFulfillmentStatus(deal.status) || deal.status === "transport_quoted")
  );

  return (
    <div className="grid grid-cols-1 gap-4.25">
      <Panel
        title="Transport notices"
        subtitle="Paid deliveries. Accept a price the owner set, or propose one for them to confirm."
      >
        {isLoading && openJobs.length === 0 ? (
          <EmptyState message="Loading transport requests…" />
        ) : isError && openJobs.length === 0 ? (
          <EmptyState message="Transport requests could not be loaded. Refresh the page to try again." />
        ) : openJobs.length === 0 ? (
          <EmptyState message="No open transport requests right now." />
        ) : (
          <div className="flex flex-col gap-3">
            {openJobs.map((deal) => (
              <TransportJobCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="My deliveries"
        subtitle="Packaging, transit, and delivery confirmation for jobs you accepted."
      >
        {mine.length === 0 ? (
          <EmptyState message="You have not taken a delivery yet." />
        ) : (
          <div className="flex flex-col gap-2">
            {mine.map((deal) => (
              <div
                key={deal.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-1.25 border border-soko-line px-3.5 py-3"
              >
                <div>
                  <strong className="block text-[0.8125rem]">
                    {deal.product}
                  </strong>
                  <RouteLine deal={deal} />
                  {isFulfillmentStatus(deal.status) ? (
                    <FulfillmentSteps deal={deal} actor="logistics" />
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <b className="text-[0.75rem]">
                    {formatRwf(
                      deal.transportFee ?? deal.transportOfferedFee ?? 0
                    )}
                  </b>
                  <StatusBadge status={deal.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function RouteLine({ deal }: { deal: Deal }) {
  return (
    <small className="mt-1 block text-[0.6875rem] leading-snug text-soko-muted">
      <span className="block">
        Pickup: {deal.pickupLocation?.trim() || "Business address not set"}
      </span>
      <span className="block">
        Delivery: {deal.deliveryLocation?.trim() || "Delivery address not set"}
      </span>
    </small>
  );
}

function TransportJobCard({ deal }: { deal: Deal }) {
  const note = deliveryPriceNote(deal);
  return (
    <article className="rounded-1.25 border border-soko-line px-3.5 py-3.5">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <strong className="block text-[0.8125rem]">{deal.product}</strong>
          <small className="text-[0.5625rem] text-soko-muted">
            {deal.confirmedQty ?? deal.quantity} {deal.unit}
          </small>
          <RouteLine deal={deal} />
        </div>
        <StatusBadge status={deal.status} />
      </div>
      <p className="m-0 mb-3 text-[0.625rem] text-soko-muted">
        Owner: {deal.supplierName ?? "Seller"} · Buyer:{" "}
        {deal.buyerBusiness || deal.buyerName}
      </p>
      {note ? (
        <p className="m-0 mb-3 text-[0.6875rem] text-soko-ink">{note}</p>
      ) : null}
      <DelivererJobActions deal={deal} />
    </article>
  );
}
