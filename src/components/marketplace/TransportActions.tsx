"use client";

import { useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { btn } from "@/lib/ui";
import { formatRwf, acceptTransportQuote } from "@/lib/marketplaceStore";
import { formatApiError } from "@/lib/apiError";
import { isPersistedDeal } from "@/lib/mapApiDeal";
import { ButtonLoader } from "@/components/ActionLoader";
import { Field, fieldClass } from "@/components/marketplace/uiBits";
import {
  useAcceptOfferedTransportMutation,
  useConfirmTransportMutation,
  useQuoteTransportMutation,
} from "@/store/actions/deals";
import type { Deal } from "@/lib/marketplaceTypes";

export function deliveryPriceNote(deal: Deal) {
  if (deal.status === "transport_accepted" && deal.transportFee) {
    return `Delivery confirmed at ${formatRwf(deal.transportFee)}${
      deal.logisticsName ? ` · ${deal.logisticsName}` : ""
    }.`;
  }
  if (deal.status === "transport_quoted" && deal.transportFee) {
    return `${deal.logisticsName || "A deliverer"} proposed ${formatRwf(deal.transportFee)} for delivery.`;
  }
  if (deal.status === "transport_open" && deal.transportOfferedFee) {
    return `Delivery price ${formatRwf(deal.transportOfferedFee)}. Waiting for a deliverer to accept.`;
  }
  if (deal.status === "transport_open") {
    return "Waiting for a deliverer to accept the delivery.";
  }
  return null;
}

export function ConfirmTransportButton({ deal }: { deal: Deal }) {
  const { t } = useTranslation("logisticsDashboard");
  const [error, setError] = useState("");
  const [confirmTransport, { isLoading }] = useConfirmTransportMutation();
  const quote = deal.transportQuotes[0];
  const fee = deal.transportFee ?? quote?.fee;

  return (
    <div className="mt-3">
      <p className="m-0 text-[0.6875rem] text-soko-ink">
        {t("proposedDeliveryPrice", {
          transporter:
            quote?.logisticsName || deal.logisticsName || "Deliverer",
          amount: formatRwf(fee ?? 0),
        })}
        {quote?.note ? ` · ${quote.note}` : ""}
      </p>
      <button
        type="button"
        className={`${btn.sellCompact} mt-2`}
        disabled={isLoading}
        onClick={async () => {
          setError("");
          try {
            if (isPersistedDeal(deal.id)) {
              await confirmTransport(deal.id).unwrap();
            } else if (quote) {
              acceptTransportQuote(deal.id, quote.logisticsEmail);
            }
          } catch (err) {
            setError(formatApiError(err));
          }
        }}
      >
        {isLoading ? (
          <ButtonLoader label="Confirming…" />
        ) : (
          "Confirm delivery price"
        )}
      </button>
      {error ? (
        <p className="m-0 mt-2 text-[0.6875rem] text-[#b42318]">{error}</p>
      ) : null}
    </div>
  );
}

export function DelivererJobActions({ deal }: { deal: Deal }) {
  const [fee, setFee] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [quoteTransport, { isLoading: quoting }] = useQuoteTransportMutation();
  const [acceptOffered, { isLoading: accepting }] =
    useAcceptOfferedTransportMutation();
  const busy = quoting || accepting;
  const offered = deal.transportOfferedFee;

  if (deal.status === "transport_accepted") {
    return (
      <p className="m-0 text-[0.6875rem] text-soko-green-2">
        Delivery confirmed
        {deal.transportFee ? ` · ${formatRwf(deal.transportFee)}` : ""}.
      </p>
    );
  }

  if (deal.status === "transport_quoted") {
    return (
      <p className="m-0 text-[0.6875rem] text-soko-ink">
        Price sent
        {deal.transportFee ? ` · ${formatRwf(deal.transportFee)}` : ""}. Waiting
        for the product owner to confirm.
      </p>
    );
  }

  if (offered) {
    return (
      <div>
        <p className="m-0 text-[0.6875rem] text-soko-ink">
          Delivery fee is <b>{formatRwf(offered)}</b>.
        </p>
        <button
          type="button"
          className={`${btn.primaryCompact} mt-2`}
          disabled={busy}
          onClick={async () => {
            setError("");
            try {
              await acceptOffered(deal.id).unwrap();
            } catch (err) {
              setError(formatApiError(err));
            }
          }}
        >
          {accepting ? (
            <ButtonLoader label="Accepting…" />
          ) : (
            `Accept delivery · ${formatRwf(offered)}`
          )}
        </button>
        {error ? (
          <p className="m-0 mt-2 text-[0.6875rem] text-[#b42318]">{error}</p>
        ) : null}
      </div>
    );
  }

  return (
    <form
      className="grid grid-cols-[1fr_1.4fr_auto] gap-2 max-sm:grid-cols-1"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        const amount = Number(fee);
        if (!Number.isFinite(amount) || amount <= 0) {
          setError("Enter the delivery amount.");
          return;
        }
        setError("");
        try {
          await quoteTransport({
            id: deal.id,
            body: { fee: amount, note: note.trim() || undefined },
          }).unwrap();
        } catch (err) {
          setError(formatApiError(err));
        }
      }}
    >
      <Field label="Delivery amount (RWF)">
        <input
          className={fieldClass}
          type="number"
          min={1}
          value={fee}
          onChange={(event) => setFee(event.target.value)}
          required
          disabled={busy}
          aria-label="Delivery amount in RWF"
        />
      </Field>
      <Field label="Note">
        <input
          className={fieldClass}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          disabled={busy}
        />
      </Field>
      <div className="flex items-end">
        <button type="submit" className={btn.primaryCompact} disabled={busy}>
          {quoting ? <ButtonLoader label="Sending…" /> : "Send amount"}
        </button>
      </div>
      {error ? (
        <p className="m-0 text-[0.6875rem] text-[#b42318] sm:col-span-3">
          {error}
        </p>
      ) : null}
    </form>
  );
}
