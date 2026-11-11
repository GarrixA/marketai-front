"use client";

import { useMemo } from "react";
import useTranslation from "next-translate/useTranslation";
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
  RequestDeliveryConfirmationButton,
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

function isMyDelivery(deal: Deal, email?: string, userId?: string) {
  if (userId && deal.logisticsUserId && deal.logisticsUserId === userId) {
    return true;
  }
  if (email && deal.logisticsEmail && deal.logisticsEmail === email) {
    return true;
  }
  if (
    email &&
    deal.transportQuotes.some((quote) => quote.logisticsEmail === email)
  ) {
    return true;
  }
  return false;
}

export function TransportJobsPanel() {
  const { t } = useTranslation("logisticsDashboard");
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
      isMyDelivery(deal, session?.email, session?.userId) &&
      (isFulfillmentStatus(deal.status) || deal.status === "transport_quoted")
  );

  return (
    <div className="grid grid-cols-1 gap-4.25">
      <Panel
        title={t("transportNotices")}
        subtitle={t("transportNoticesDescription")}
      >
        {isLoading && openJobs.length === 0 ? (
          <EmptyState message="Loading transport requests…" />
        ) : isError && openJobs.length === 0 ? (
          <EmptyState message="Transport requests could not be loaded. Refresh the page to try again." />
        ) : openJobs.length === 0 ? (
          <EmptyState message={t("noOpenTransportRequests")} />
        ) : (
          <div className="flex flex-col gap-3">
            {openJobs.map((deal) => (
              <TransportJobCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </Panel>

      <Panel title={t("myDeliveries")} subtitle={t("myDeliveriesDescription")}>
        {mine.length === 0 ? (
          <EmptyState message="You have not taken a delivery yet." />
        ) : (
          <div className="flex flex-col gap-3">
            {mine.map((deal) => (
              <MyDeliveryCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function RouteLine({ deal }: { deal: Deal }) {
  const { t } = useTranslation("logisticsDashboard");
  return (
    <small className="mt-1 block text-[0.6875rem] leading-snug text-soko-muted">
      <span className="block">
        {t("pickup")}:{" "}
        {deal.pickupLocation?.trim() || "Business address not set"}
      </span>
      <span className="block">
        {t("delivery")}:{" "}
        {deal.deliveryLocation?.trim() || "Delivery address not set"}
      </span>
    </small>
  );
}

function MyDeliveryCard({ deal }: { deal: Deal }) {
  return (
    <article className="rounded-1.25 border border-soko-line px-3.5 py-3.5">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <strong className="block text-[0.8125rem]">{deal.product}</strong>
          <RouteLine deal={deal} />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusBadge status={deal.status} />
          <b className="text-[0.75rem]">
            {formatRwf(deal.transportFee ?? deal.transportOfferedFee ?? 0)}
          </b>
        </div>
      </div>
      {deal.status === "in_transit" ? (
        <RequestDeliveryConfirmationButton deal={deal} />
      ) : isFulfillmentStatus(deal.status) ? (
        <FulfillmentSteps deal={deal} actor="logistics" />
      ) : null}
    </article>
  );
}

function TransportJobCard({ deal }: { deal: Deal }) {
  const { t } = useTranslation("logisticsDashboard");
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
        {t("owner")}: {deal.supplierName ?? "Seller"} · {t("buyer")}:{" "}
        {deal.buyerBusiness || deal.buyerName}
      </p>
      {note ? (
        <p className="m-0 mb-3 text-[0.6875rem] text-soko-ink">{note}</p>
      ) : null}
      <DelivererJobActions deal={deal} />
    </article>
  );
}
