"use client";

import { useState } from "react";
import { btn } from "@/lib/ui";
import { formatRwf, quoteTransport } from "@/lib/marketplaceStore";
import { waitForAction } from "@/lib/actionDelay";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import {
  EmptyState,
  Field,
  Panel,
  StatusBadge,
  fieldClass,
} from "@/components/marketplace/uiBits";
import { ButtonLoader } from "@/components/ActionLoader";
import { getSession } from "@/lib/session";

export function TransportJobsPanel() {
  const { deals } = useMarketplace();
  const session = getSession();
  const openJobs = deals.filter(
    (d) => d.status === "transport_open" || d.status === "transport_quoted"
  );
  const myQuotes = deals.filter((d) =>
    d.transportQuotes.some((q) => q.logisticsEmail === session?.email)
  );

  return (
    <div className="grid grid-cols-1 gap-4.25">
      <Panel
        title="Transport notices"
        subtitle="Paid deals waiting for a logistics quote. Updates live when buyers pay."
      >
        {openJobs.length === 0 ? (
          <EmptyState message="No open transport requests right now." />
        ) : (
          <div className="flex flex-col gap-3">
            {openJobs.map((deal) => (
              <TransportJobCard key={deal.id} dealId={deal.id} />
            ))}
          </div>
        )}
      </Panel>

      <Panel title="My quotes" subtitle="Quotes you have already submitted.">
        {myQuotes.length === 0 ? (
          <EmptyState message="You have not quoted any jobs yet." />
        ) : (
          <div className="flex flex-col gap-2">
            {myQuotes.map((deal) => {
              const quote = deal.transportQuotes.find(
                (q) => q.logisticsEmail === session?.email
              );
              return (
                <div
                  key={deal.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-1.25 border border-[#e5e4df] px-3.5 py-3"
                >
                  <div>
                    <strong className="block text-[0.8125rem]">
                      {deal.product}
                    </strong>
                    <small className="text-[0.5625rem] text-soko-muted">
                      {deal.pickupLocation} → {deal.deliveryLocation} ·{" "}
                      {deal.confirmedQty} trays
                    </small>
                  </div>
                  <div className="flex items-center gap-2">
                    <b className="text-[0.75rem]">
                      {formatRwf(quote?.fee ?? 0)}
                    </b>
                    <StatusBadge status={deal.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

function TransportJobCard({ dealId }: { dealId: string }) {
  const { deals } = useMarketplace();
  const session = getSession();
  const deal = deals.find((d) => d.id === dealId);
  const [fee, setFee] = useState("18500");
  const [note, setNote] = useState("Same-day pickup available");
  const [loading, setLoading] = useState(false);

  if (!deal) return null;

  const alreadyQuoted = deal.transportQuotes.some(
    (q) => q.logisticsEmail === session?.email
  );

  return (
    <article className="rounded-1.25 border border-[#e5e4df] px-3.5 py-3.5">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <strong className="block text-[0.8125rem]">{deal.product}</strong>
          <small className="text-[0.5625rem] text-soko-muted">
            {deal.pickupLocation ?? "Pickup TBD"} → {deal.deliveryLocation} ·{" "}
            {deal.confirmedQty ?? deal.quantity} trays
          </small>
        </div>
        <StatusBadge status={deal.status} />
      </div>
      <p className="m-0 mb-3 text-[0.625rem] text-soko-muted">
        Supplier: {deal.supplierName} · Buyer: {deal.buyerBusiness}
      </p>
      {alreadyQuoted ? (
        <p className="m-0 text-[0.6875rem] text-soko-green-2">
          Quote sent. Waiting for supplier acceptance.
        </p>
      ) : (
        <form
          className="grid grid-cols-[1fr_1.4fr_auto] gap-2 max-sm:grid-cols-1"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!session || loading) return;
            setLoading(true);
            await waitForAction();
            quoteTransport({
              dealId: deal.id,
              logisticsEmail: session.email,
              logisticsName: session.businessName,
              fee: Number(fee) || 0,
              note,
            });
            setLoading(false);
          }}
        >
          <Field label="Your fee (RWF)">
            <input
              className={fieldClass}
              type="number"
              min={0}
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              required
              disabled={loading}
            />
          </Field>
          <Field label="Note">
            <input
              className={fieldClass}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={loading}
            />
          </Field>
          <div className="flex items-end">
            <button
              type="submit"
              className={btn.primaryCompact}
              disabled={loading}
            >
              {loading ? <ButtonLoader label="Quoting…" /> : "Accept & quote"}
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
