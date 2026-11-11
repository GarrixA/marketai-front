"use client";

import { useState, type ReactNode } from "react";
import useTranslation from "next-translate/useTranslation";
import { ButtonLoader } from "@/components/ActionLoader";
import { Icon, btn } from "@/lib/ui";
import { formatApiError } from "@/lib/apiError";
import { formatRwf } from "@/lib/marketplaceStore";
import {
  useConfirmDeliveryMutation,
  useConfirmPackagingMutation,
  useRequestDeliveryConfirmationMutation,
  useRequestPackagingMutation,
} from "@/store/actions/deals";
import type { Deal, DealStatus } from "@/lib/marketplaceTypes";

const STEPS = [
  { id: "packaging", key: "packaging" },
  { id: "inTransit", key: "inTransit" },
  { id: "buyerConfirms", key: "buyerConfirms" },
  { id: "paidOut", key: "paidOut" },
] as const;

const FULFILLMENT: DealStatus[] = [
  "transport_accepted",
  "packaging_requested",
  "in_transit",
  "delivery_pending",
  "delivered",
];

export function isFulfillmentStatus(status: DealStatus) {
  return FULFILLMENT.includes(status);
}

function stepIndex(status: DealStatus) {
  switch (status) {
    case "transport_accepted":
    case "packaging_requested":
      return 0;
    case "in_transit":
      return 1;
    case "delivery_pending":
      return 2;
    case "delivered":
      return 4;
    default:
      return 0;
  }
}

export function FulfillmentSteps({
  deal,
  actor,
  showTrack = true,
}: {
  deal: Deal;
  actor: "logistics" | "supplier" | "buyer";
  showTrack?: boolean;
}) {
  const { t } = useTranslation("deals");
  const current = stepIndex(deal.status);
  return (
    <div className="mt-3">
      {showTrack ? (
        <ol className="m-0 flex list-none gap-2 p-0">
          {STEPS.map((step, index) => {
            const done = index < current;
            const active = index === current;
            return (
              <li key={step.id} className="min-w-0 flex-1">
                <span
                  className={`block h-1.5 rounded-full ${
                    done || active ? "bg-soko-navy" : "bg-soko-line"
                  }`}
                />
                <span
                  className={`mt-1.5 flex items-center gap-1 text-[0.625rem] leading-tight font-semibold ${
                    active ? "text-soko-navy" : "text-soko-muted"
                  }`}
                >
                  {done ? <Icon name="check" size={12} /> : null}
                  {t(step.key)}
                </span>
              </li>
            );
          })}
        </ol>
      ) : null}
      <FulfillmentAction deal={deal} actor={actor} />
    </div>
  );
}

/** Product-owner action: confirm packaging so logistics can mark the deal in transit. */
export function ConfirmPackagingButton({
  deal,
  className = "mt-3",
}: {
  deal: Deal;
  className?: string;
}) {
  const [error, setError] = useState("");
  const [confirmPackaging, { isLoading }] = useConfirmPackagingMutation();

  if (deal.status !== "packaging_requested") return null;

  return (
    <div className={className}>
      <div className="rounded-1.25 border border-[#f79009]/40 bg-[#fff4e5] px-3 py-3">
        <p className="m-0 text-[0.75rem] font-bold text-soko-ink">
          Logistics is ready to collect
        </p>
        <p className="m-0 mt-1 text-[0.6875rem] leading-snug text-soko-muted">
          Confirm that {deal.product} is packaged so delivery can move in
          transit
          {deal.logisticsName ? ` with ${deal.logisticsName}` : ""}.
        </p>
        <button
          type="button"
          className={`${btn.sellCompact} mt-3`}
          disabled={isLoading}
          onClick={async () => {
            if (isLoading) return;
            setError("");
            try {
              await confirmPackaging(deal.id).unwrap();
            } catch (err) {
              setError(formatApiError(err));
            }
          }}
        >
          {isLoading ? (
            <ButtonLoader label="Confirming…" />
          ) : (
            <>
              Confirm packaging is done <Icon name="check" size={16} />
            </>
          )}
        </button>
        {error ? (
          <p className="m-0 mt-2 text-[0.6875rem] text-[#b42318]">{error}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Logistics action: ask the buyer to confirm they received the goods. */
export function RequestDeliveryConfirmationButton({
  deal,
  className = "mt-3",
}: {
  deal: Deal;
  className?: string;
}) {
  const { t } = useTranslation("logisticsDashboard");
  const [error, setError] = useState("");
  const [requestDelivery, { isLoading }] =
    useRequestDeliveryConfirmationMutation();

  if (deal.status !== "in_transit") return null;

  return (
    <div className={className}>
      <div className="rounded-1.25 border border-soko-navy/20 bg-soko-slate px-3 py-3">
        <p className="m-0 text-[0.75rem] font-bold text-soko-ink">
          Delivery arrived?
        </p>
        <p className="m-0 mt-1 text-[0.6875rem] leading-snug text-soko-muted">
          Ask {deal.buyerBusiness || deal.buyerName} to confirm they received{" "}
          {deal.product}. Payment stays held until they confirm.
        </p>
        <button
          type="button"
          className={`${btn.primaryCompact} mt-3`}
          disabled={isLoading}
          onClick={async () => {
            if (isLoading) return;
            setError("");
            try {
              await requestDelivery(deal.id).unwrap();
            } catch (err) {
              setError(formatApiError(err));
            }
          }}
        >
          {isLoading ? (
            <ButtonLoader label="Sending…" />
          ) : (
            <>
              {t("askBuyerConfirmDelivery")} <Icon name="truck" size={16} />
            </>
          )}
        </button>
        {error ? (
          <p className="m-0 mt-2 text-[0.6875rem] text-[#b42318]">{error}</p>
        ) : null}
      </div>
    </div>
  );
}

function FulfillmentAction({
  deal,
  actor,
}: {
  deal: Deal;
  actor: "logistics" | "supplier" | "buyer";
}) {
  const { t: tLogistics } = useTranslation("logisticsDashboard");
  const { t: tOrders } = useTranslation("orders");
  const [error, setError] = useState("");
  const [requestPackaging, { isLoading: requestingPack }] =
    useRequestPackagingMutation();
  const [confirmDelivery, { isLoading: confirmingDelivery }] =
    useConfirmDeliveryMutation();
  const busy = requestingPack || confirmingDelivery;

  const run = async (action: () => Promise<unknown>) => {
    if (busy) return;
    setError("");
    try {
      await action();
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  let body: ReactNode = null;

  if (actor === "logistics" && deal.status === "transport_accepted") {
    body = (
      <button
        type="button"
        className={`${btn.primaryCompact} mt-3`}
        disabled={busy}
        onClick={() => run(() => requestPackaging(deal.id).unwrap())}
      >
        {requestingPack ? (
          <ButtonLoader label="Requesting…" />
        ) : (
          "Request packaging confirmation"
        )}
      </button>
    );
  } else if (actor === "logistics" && deal.status === "packaging_requested") {
    body = (
      <p className="m-0 mt-3 text-[0.6875rem] text-soko-ink">
        Waiting for {deal.supplierName || "the product owner"} to confirm
        packaging.
      </p>
    );
  } else if (actor === "supplier" && deal.status === "packaging_requested") {
    body = <ConfirmPackagingButton deal={deal} className="mt-3" />;
  } else if (actor === "logistics" && deal.status === "in_transit") {
    body = <RequestDeliveryConfirmationButton deal={deal} className="mt-3" />;
  } else if (deal.status === "in_transit") {
    body = (
      <p className="m-0 mt-3 text-[0.6875rem] text-soko-ink">
        Packaging is confirmed. This product is in transit.
      </p>
    );
  } else if (actor === "logistics" && deal.status === "delivery_pending") {
    body = (
      <p className="m-0 mt-3 text-[0.6875rem] text-soko-ink">
        Waiting for {deal.buyerBusiness || deal.buyerName} to confirm delivery.
      </p>
    );
  } else if (actor === "buyer" && deal.status === "delivery_pending") {
    body = (
      <button
        type="button"
        className={`${btn.buyCompact} mt-3`}
        disabled={busy}
        onClick={() => run(() => confirmDelivery(deal.id).unwrap())}
      >
        {confirmingDelivery ? (
          <ButtonLoader label="Confirming…" />
        ) : (
          "Confirm delivery"
        )}
      </button>
    );
  } else if (deal.status === "delivered") {
    body = (
      <p className="m-0 mt-3 text-[0.6875rem] text-soko-ink">
        {actor === "logistics" ? (
          tLogistics("deliveredFeeInIncome", {
            amount: formatRwf(deal.deliveryPayout ?? deal.transportFee ?? 0),
          })
        ) : actor === "supplier" ? (
          deal.platformFee != null && deal.deliveryPayout != null ? (
            tOrders("sellerPayoutSummary", {
              netAmount: formatRwf(deal.sellerPayout ?? 0),
              platformFeePercent: 5,
              platformFee: formatRwf(
                deal.transportFee != null
                  ? deal.platformFee - (deal.transportFee - deal.deliveryPayout)
                  : deal.platformFee
              ),
              deliveryFee: formatRwf(deal.transportFee ?? deal.deliveryPayout),
            })
          ) : (
            <>
              Buyer confirmed delivery. You receive{" "}
              <b>{formatRwf(deal.sellerPayout ?? 0)}</b> after a 5% platform fee
              {deal.platformFee != null
                ? ` (${formatRwf(
                    deal.transportFee != null && deal.deliveryPayout != null
                      ? deal.platformFee -
                          (deal.transportFee - deal.deliveryPayout)
                      : deal.platformFee
                  )})`
                : ""}
              . Delivery
              {deal.transportFee != null || deal.deliveryPayout != null
                ? ` (${formatRwf(deal.transportFee ?? deal.deliveryPayout ?? 0)})`
                : ""}{" "}
              was paid by the buyer.
            </>
          )
        ) : (
          "You confirmed delivery. The held payment has been released."
        )}
      </p>
    );
  }

  if (!body && !error) return null;
  return (
    <div>
      {body}
      {error ? (
        <p className="m-0 mt-2 text-[0.6875rem] text-[#b42318]">{error}</p>
      ) : null}
    </div>
  );
}
