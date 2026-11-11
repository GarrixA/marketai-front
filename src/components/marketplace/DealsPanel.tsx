"use client";

import { useEffect, useMemo, useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { btn } from "@/lib/ui";
import {
  formatRwf,
  isDealForSupplier,
  isRfqDeal,
} from "@/lib/marketplaceStore";
import {
  ConfirmTransportButton,
  deliveryPriceNote,
} from "@/components/marketplace/TransportActions";
import {
  ConfirmPackagingButton,
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
import { formatApiError } from "@/lib/apiError";
import {
  liveDealListOptions,
  useListIncomingDealsQuery,
  useListMyDealsQuery,
  usePreviewDeliveryQuoteMutation,
} from "@/store/actions/deals";
import type { Deal } from "@/lib/marketplaceTypes";
import type { DeliveryQuotePreview } from "@/types/deal";

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
  const { t } = useTranslation("deals");
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
  const [paying, setPaying] = useState<{
    deal: Deal;
    quote: DeliveryQuotePreview;
  } | null>(null);

  return (
    <Panel
      title={
        perspective === "buyer" ? t("dealsAndPayments") : t("dealConfirmations")
      }
      subtitle={
        perspective === "buyer"
          ? t("payAfterSupplierConfirms")
          : t("dealConfirmationsDescription")
      }
    >
      {loading && actionable.length === 0 ? (
        <EmptyState message="Loading deals…" />
      ) : failed && actionable.length === 0 ? (
        <EmptyState message="Deals could not be loaded. Refresh the page to try again." />
      ) : actionable.length === 0 ? (
        <EmptyState message={t("noWorkspaceDeals")} />
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
                        ? (deal.supplierName ?? t("awaitingSupplier"))
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
                        : t("paymentReceived")}
                    </strong>
                    {formatRwf(deal.paidAmount ?? 0)} for {deal.confirmedQty}{" "}
                    {deal.unit}
                    {deal.transportFee != null
                      ? ` · trays ${formatRwf(
                          (deal.offerPrice ?? 0) * (deal.confirmedQty ?? 0)
                        )} + delivery ${formatRwf(deal.transportFee)}`
                      : ""}
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
                  <BuyerPayActions
                    deal={deal}
                    onPay={(quote) => setPaying({ deal, quote })}
                  />
                ) : null}

                {canConfirmTransport ? (
                  <ConfirmTransportButton deal={deal} />
                ) : null}

                {priceNote && !showPaymentNotice && !canConfirmTransport ? (
                  <p className="mt-3 mb-0 text-[0.6875rem] text-soko-ink">
                    {priceNote}
                  </p>
                ) : null}

                {deal.status === "transport_accepted" &&
                perspective === "supplier" ? (
                  <p className="mt-3 mb-0 text-[0.625rem] text-soko-green-2">
                    Transport booked
                    {deal.transportFee
                      ? ` · ${formatRwf(deal.transportFee)}`
                      : ""}
                    . Waiting for logistics to request packaging.
                  </p>
                ) : null}

                {perspective === "supplier" &&
                deal.status === "packaging_requested" ? (
                  <ConfirmPackagingButton deal={deal} />
                ) : null}

                {isFulfillmentStatus(deal.status) &&
                perspective === "supplier" &&
                deal.status !== "packaging_requested" ? (
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
          dealId={paying.deal.id}
          productAmount={paying.quote.productAmount}
          deliveryFee={paying.quote.deliveryFee}
          amount={paying.quote.totalAmount}
          supplierName={paying.deal.supplierName ?? "the seller"}
          purpose={paying.deal.product}
          pickupLocation={paying.quote.pickupLocation}
          deliveryLocation={
            paying.quote.deliveryLocation || paying.deal.deliveryLocation
          }
          onClose={() => setPaying(null)}
        />
      ) : null}
    </Panel>
  );
}

function formatRouteAddress(value: string | null | undefined) {
  if (!value?.trim()) return "";
  return value
    .replace(/\s*·\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*$/, "")
    .trim();
}

function BuyerPayActions({
  deal,
  onPay,
}: {
  deal: Deal;
  onPay: (quote: DeliveryQuotePreview) => void;
}) {
  const { t } = useTranslation("deals");
  const [preview, { data, error, isLoading, isError }] =
    usePreviewDeliveryQuoteMutation();
  const trays = (deal.offerPrice ?? 0) * (deal.confirmedQty ?? deal.quantity);

  useEffect(() => {
    void preview({ id: deal.id });
  }, [deal.id, deal.deliveryLocation, preview]);

  const quote = data;
  const total = quote?.totalAmount ?? trays;
  const ready = Boolean(quote);

  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-1.25 border border-soko-line bg-soko-slate/40 px-3 py-2.5 text-[0.6875rem] text-soko-ink">
        <div className="flex items-center justify-between gap-3">
          <span>{t("traysAmount")}</span>
          <strong>{formatRwf(quote?.productAmount ?? trays)}</strong>
        </div>
        <div className="mt-1.5 flex items-start justify-between gap-3">
          <span className="shrink-0">{t("deliveryAmount")}</span>
          <strong className="text-right">
            {isLoading && !quote
              ? t("estimatingDelivery")
              : quote
                ? formatRwf(quote.deliveryFee)
                : "—"}
          </strong>
        </div>
        {quote ? (
          <p className="m-0 mt-1.5 text-[0.625rem] leading-snug text-soko-muted">
            {formatRouteAddress(quote.pickupLocation) || t("pickupNotSet")}
            {" → "}
            {formatRouteAddress(quote.deliveryLocation) || t("deliveryNotSet")}
          </p>
        ) : null}
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-soko-line pt-2 text-[0.75rem]">
          <span className="font-semibold">{t("totalDue")}</span>
          <strong>{formatRwf(total)}</strong>
        </div>
        {isError ? (
          <p className="m-0 mt-2 text-[#b42318]">
            {formatApiError(error) || t("deliveryQuoteFailed")}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[0.6875rem]">
          {t("paySupplier", {
            amount: formatRwf(total),
            supplier: deal.supplierName,
          })}
        </span>
        <button
          type="button"
          className={btn.buyCompact}
          disabled={!ready || isLoading}
          onClick={() => {
            if (quote) onPay(quote);
          }}
        >
          {t("proceedToPayment")}
        </button>
        {isError ? (
          <button
            type="button"
            className="border-0 bg-transparent p-0 text-[0.6875rem] text-soko-green-2 underline"
            onClick={() => void preview({ id: deal.id })}
          >
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}
