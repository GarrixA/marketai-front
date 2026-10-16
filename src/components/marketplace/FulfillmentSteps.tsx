"use client";

import { useState, type ReactNode } from "react";
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
  "Packaging",
  "In transit",
  "Buyer confirms",
  "Paid out",
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
  const current = stepIndex(deal.status);
  return (
    <div className="mt-3">
      {showTrack ? (
        <ol className="m-0 flex list-none gap-2 p-0">
          {STEPS.map((label, index) => {
            const done = index < current;
            const active = index === current;
            return (
              <li key={label} className="min-w-0 flex-1">
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
                  {label}
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

function FulfillmentAction({
  deal,
  actor,
}: {
  deal: Deal;
  actor: "logistics" | "supplier" | "buyer";
}) {
  const [error, setError] = useState("");
  const [requestPackaging, { isLoading: requestingPack }] =
    useRequestPackagingMutation();
  const [confirmPackaging, { isLoading: confirmingPack }] =
    useConfirmPackagingMutation();
  const [requestDelivery, { isLoading: requestingDelivery }] =
    useRequestDeliveryConfirmationMutation();
  const [confirmDelivery, { isLoading: confirmingDelivery }] =
    useConfirmDeliveryMutation();
  const busy =
    requestingPack ||
    confirmingPack ||
    requestingDelivery ||
    confirmingDelivery;

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
    body = (
      <button
        type="button"
        className={`${btn.primaryCompact} mt-3`}
        disabled={busy}
        onClick={() => run(() => confirmPackaging(deal.id).unwrap())}
      >
        {confirmingPack ? (
          <ButtonLoader label="Confirming…" />
        ) : (
          "Confirm packaging is done"
        )}
      </button>
    );
  } else if (actor === "logistics" && deal.status === "in_transit") {
    body = (
      <button
        type="button"
        className={`${btn.primaryCompact} mt-3`}
        disabled={busy}
        onClick={() => run(() => requestDelivery(deal.id).unwrap())}
      >
        {requestingDelivery ? (
          <ButtonLoader label="Sending…" />
        ) : (
          "Ask buyer to confirm delivery"
        )}
      </button>
    );
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
          <>
            Delivered. Your fee{" "}
            <b>{formatRwf(deal.deliveryPayout ?? deal.transportFee ?? 0)}</b> is
            in Income.
          </>
        ) : actor === "supplier" ? (
          <>
            Buyer confirmed delivery. You receive{" "}
            <b>{formatRwf(deal.sellerPayout ?? 0)}</b> after a 5% platform fee
            {deal.platformFee != null
              ? ` (${formatRwf(deal.platformFee)})`
              : ""}{" "}
            and delivery
            {deal.deliveryPayout != null
              ? ` (${formatRwf(deal.deliveryPayout)})`
              : ""}
            .
          </>
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
