"use client";

import { useMemo, useState } from "react";
import { btn } from "@/lib/ui";
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
import { PayDealDialog } from "@/components/marketplace/PayDealDialog";
import { mapApiDealToLocal } from "@/lib/mapApiDeal";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import { ConfirmDealForm } from "@/components/marketplace/ConfirmDealForm";
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
import type { Deal } from "@/lib/marketplaceTypes";

function mergeDeals(local: Deal[], remote: Deal[]) {
  const byId = new Map<string, Deal>();
  for (const deal of local) byId.set(deal.id, deal);
  for (const deal of remote) byId.set(deal.id, deal);
  return Array.from(byId.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function DealsPanel({
  perspective,
}: {
  perspective: "buyer" | "supplier";
}) {
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

  const remoteDeals = useMemo(() => {
    const rows =
      perspective === "buyer"
        ? myApiDeals.map(mapApiDealToLocal)
        : incomingApiDeals.map(mapApiDealToLocal);
    return rows;
  }, [perspective, myApiDeals, incomingApiDeals]);

  const actionable = useMemo(() => {
    // Local RFQs stay on Buy Requests; product purchases come from the API.
    const localForPanel =
      perspective === "buyer"
        ? deals.filter((d) => d.buyerEmail === email && !isRfqDeal(d))
        : deals.filter(
            (d) =>
              !isRfqDeal(d) && isDealForSupplier(d, email, inventory, userId)
          );
    return mergeDeals(localForPanel, remoteDeals);
  }, [perspective, deals, email, inventory, userId, remoteDeals]);

  const loading =
    (canFetchMine && mineLoading) || (canFetchIncoming && incomingLoading);
  const failed =
    (canFetchMine && mineError) || (canFetchIncoming && incomingError);
  const [paying, setPaying] = useState<Deal | null>(null);

  return (
    <Panel
      title={
        perspective === "buyer" ? "Deals & payments" : "Deal confirmations"
      }
      subtitle={
        perspective === "buyer"
          ? "Pay once the supplier confirms available quantity."
          : "New buy requests appear here — confirm available quantity or reject, then manage transport."
      }
    >
      {loading && actionable.length === 0 ? (
        <EmptyState message="Loading deals…" />
      ) : failed && actionable.length === 0 ? (
        <EmptyState message="Deals could not be loaded. Refresh the page to try again." />
      ) : actionable.length === 0 ? (
        <EmptyState message="No deals in this workspace yet." />
      ) : (
        <div className="flex flex-col gap-3">
          {actionable.map((deal) => {
            const isMineAsSupplier =
              deal.supplierEmail === email ||
              Boolean(userId && deal.supplierUserId === userId);
            const canConfirm =
              perspective === "supplier" && deal.status === "requested";
            const canPay =
              perspective === "buyer" &&
              deal.status === "confirmed" &&
              deal.buyerEmail === email;
            const paid = [
              "paid",
              "transport_open",
              "transport_quoted",
              "transport_accepted",
              "packaging_requested",
              "in_transit",
              "delivery_pending",
              "delivered",
            ].includes(deal.status);
            const showPaymentNotice =
              paid &&
              (perspective === "buyer"
                ? deal.buyerEmail === email
                : isMineAsSupplier);
            const instrument =
              deal.paymentMethod === "CARD"
                ? `card ${deal.paymentAccount ?? ""}`
                : deal.paymentMethod === "MOBILE_MONEY"
                  ? `mobile money ${deal.paymentAccount ?? ""}`
                  : deal.paymentAccount;
            const canRequestTransport =
              perspective === "supplier" &&
              isMineAsSupplier &&
              deal.status === "paid";
            const canConfirmTransport =
              perspective === "supplier" &&
              isMineAsSupplier &&
              deal.status === "transport_quoted";
            const priceNote = deliveryPriceNote(deal);

            return (
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
                      {perspective === "buyer"
                        ? (deal.supplierName ?? "Waiting for supplier")
                        : deal.buyerBusiness}{" "}
                      · {deal.quantity} {deal.unit} → {deal.deliveryLocation}
                    </small>
                  </div>
                  <StatusBadge status={deal.status} />
                </div>

                {showPaymentNotice ? (
                  <div className="mb-3 rounded-1.25 bg-soko-slate px-3 py-2.5 text-[0.6875rem] text-soko-green-2">
                    <strong className="block">
                      {perspective === "buyer"
                        ? "Payment succeeded"
                        : "Payment received"}
                    </strong>
                    {formatRwf(deal.paidAmount ?? 0)} for {deal.confirmedQty}{" "}
                    {deal.unit}
                    {instrument ? ` · ${instrument}` : ""}
                    {deal.paymentReleaseStatus === "RELEASED"
                      ? " · released"
                      : " · held until delivery is complete"}
                    {deal.paidAt
                      ? ` · ${new Date(deal.paidAt).toLocaleString()}`
                      : ""}
                    {priceNote ? (
                      <span className="mt-1 block">{priceNote}</span>
                    ) : null}
                  </div>
                ) : null}

                {canConfirm ? <ConfirmDealForm deal={deal} /> : null}

                {canPay ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="text-[0.6875rem]">
                      Pay{" "}
                      <b>
                        {formatRwf(
                          (deal.offerPrice ?? 0) * (deal.confirmedQty ?? 0)
                        )}
                      </b>{" "}
                      to {deal.supplierName}
                    </span>
                    <button
                      type="button"
                      className={btn.buyCompact}
                      onClick={() => setPaying(deal)}
                    >
                      Proceed to payment
                    </button>
                  </div>
                ) : null}

                {canRequestTransport ? (
                  <RequestTransportForm deal={deal} />
                ) : null}

                {canConfirmTransport ? (
                  <ConfirmTransportButton deal={deal} />
                ) : null}

                {priceNote && !showPaymentNotice && !canConfirmTransport ? (
                  <p className="mt-3 mb-0 text-[0.6875rem] text-soko-ink">
                    {priceNote}
                  </p>
                ) : null}

                {deal.status === "transport_accepted" && isMineAsSupplier ? (
                  <p className="mt-3 mb-0 text-[0.625rem] text-soko-green-2">
                    Transport booked
                    {deal.transportFee
                      ? ` · ${formatRwf(deal.transportFee)}`
                      : ""}
                  </p>
                ) : null}

                {isFulfillmentStatus(deal.status) &&
                perspective === "supplier" &&
                isMineAsSupplier ? (
                  <FulfillmentSteps deal={deal} actor="supplier" />
                ) : null}
                {(deal.status === "delivery_pending" ||
                  deal.status === "delivered") &&
                perspective === "buyer" &&
                deal.buyerEmail === email ? (
                  <FulfillmentSteps
                    deal={deal}
                    actor="buyer"
                    showTrack={false}
                  />
                ) : null}
              </article>
            );
          })}
        </div>
      )}
      {paying ? (
        <PayDealDialog
          dealId={paying.id}
          amount={(paying.offerPrice ?? 0) * (paying.confirmedQty ?? 0)}
          supplierName={paying.supplierName ?? "the seller"}
          purpose={paying.product}
          deliveryLocation={paying.deliveryLocation}
          onClose={() => setPaying(null)}
        />
      ) : null}
    </Panel>
  );
}
