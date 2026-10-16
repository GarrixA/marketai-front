"use client";

import { useState } from "react";
import { Icon, btn } from "@/lib/ui";
import {
  formatRwf,
  requestTransport as requestLocalTransport,
  acceptTransportQuote,
} from "@/lib/marketplaceStore";
import { formatApiError } from "@/lib/apiError";
import { isPersistedDeal } from "@/lib/mapApiDeal";
import { ButtonLoader } from "@/components/ActionLoader";
import { Field, fieldClass } from "@/components/marketplace/uiBits";
import {
  useAcceptOfferedTransportMutation,
  useConfirmTransportMutation,
  useQuoteTransportMutation,
  useRequestTransportMutation,
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
    return "No delivery price yet. A deliverer can propose one.";
  }
  return null;
}

export function RequestTransportForm({ deal }: { deal: Deal }) {
  const [fee, setFee] = useState("");
  const [error, setError] = useState("");
  const [requestTransport, { isLoading }] = useRequestTransportMutation();

  return (
    <form
      className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"
      onSubmit={async (event) => {
        event.preventDefault();
        if (isLoading) return;
        setError("");
        const trimmed = fee.trim();
        const amount = trimmed === "" ? undefined : Number(trimmed);
        if (amount != null && (!Number.isFinite(amount) || amount <= 0)) {
          setError("Enter a delivery price above zero, or leave it blank.");
          return;
        }
        try {
          if (isPersistedDeal(deal.id)) {
            await requestTransport({
              id: deal.id,
              body: amount != null ? { fee: amount } : {},
            }).unwrap();
          } else {
            requestLocalTransport(deal.id, amount);
          }
        } catch (err) {
          setError(formatApiError(err));
        }
      }}
    >
      <Field label="Delivery price (optional)">
        <input
          className={fieldClass}
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="Leave blank for the deliverer to set"
          value={fee}
          onChange={(event) => setFee(event.target.value)}
          disabled={isLoading}
          aria-label="Delivery price in RWF, optional"
        />
      </Field>
      <button type="submit" className={btn.sellCompact} disabled={isLoading}>
        {isLoading ? (
          <ButtonLoader label="Requesting…" />
        ) : (
          <>
            Request transport <Icon name="truck" size={16} />
          </>
        )}
      </button>
      {error ? (
        <p className="m-0 text-[0.6875rem] text-[#b42318] sm:col-span-2">
          {error}
        </p>
      ) : (
        <p className="m-0 text-[0.6875rem] text-soko-muted sm:col-span-2">
          Include a price, or leave it empty and the deliverer will propose one
          for you to confirm.
        </p>
      )}
    </form>
  );
}

export function ConfirmTransportButton({ deal }: { deal: Deal }) {
  const [error, setError] = useState("");
  const [confirmTransport, { isLoading }] = useConfirmTransportMutation();
  const quote = deal.transportQuotes[0];
  const fee = deal.transportFee ?? quote?.fee;

  return (
    <div className="mt-3">
      <p className="m-0 text-[0.6875rem] text-soko-ink">
        {quote?.logisticsName || deal.logisticsName || "Deliverer"} proposed{" "}
        <b>{formatRwf(fee ?? 0)}</b>
        {quote?.note ? ` · ${quote.note}` : ""}.
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
          Owner set the delivery price at <b>{formatRwf(offered)}</b>.
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
