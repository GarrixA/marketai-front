"use client";

import { useState, type ReactNode } from "react";
import { Icon, btn } from "@/lib/ui";
import {
  confirmDealQuantity,
  formatRwf,
  payDeal,
  requestTransport,
  acceptTransportQuote,
} from "@/lib/marketplaceStore";
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
import type { Deal } from "@/lib/marketplaceTypes";

function ConfirmForm({ deal }: { deal: Deal }) {
  const session = getSession();
  const [qty, setQty] = useState(String(deal.quantity));
  const [price, setPrice] = useState(String(deal.targetPrice || 4000));
  const [pickup, setPickup] = useState(
    session?.businessName.includes("Hub")
      ? "Musanze Aggregator Depot"
      : "Musanze"
  );
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="mt-3 grid grid-cols-3 gap-2 max-sm:grid-cols-1"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!session || loading) return;
        setLoading(true);
        await waitForAction();
        confirmDealQuantity({
          dealId: deal.id,
          supplierEmail: session.email,
          supplierName: session.businessName,
          confirmedQty: Number(qty) || 0,
          offerPrice: Number(price) || 0,
          pickupLocation: pickup,
        });
        setLoading(false);
      }}
    >
      <Field label="Confirm qty">
        <input
          className={fieldClass}
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          disabled={loading}
        />
      </Field>
      <Field label="Offer / tray">
        <input
          className={fieldClass}
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          disabled={loading}
        />
      </Field>
      <Field label="Pickup location">
        <input
          className={fieldClass}
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          disabled={loading}
        />
      </Field>
      <div className="col-span-full">
        <button type="submit" className={btn.sellCompact} disabled={loading}>
          {loading ? <ButtonLoader label="Confirming…" /> : "Confirm quantity"}
        </button>
      </div>
    </form>
  );
}

function BusyButton({
  className,
  label,
  busyLabel,
  onClick,
}: {
  className: string;
  label: ReactNode;
  busyLabel: string;
  onClick: () => void;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      className={className}
      disabled={loading}
      onClick={async () => {
        if (loading) return;
        setLoading(true);
        await waitForAction();
        onClick();
        setLoading(false);
      }}
    >
      {loading ? <ButtonLoader label={busyLabel} /> : label}
    </button>
  );
}

export function DealsPanel({
  perspective,
}: {
  perspective: "buyer" | "supplier";
}) {
  const { deals } = useMarketplace();
  const session = getSession();
  const email = session?.email ?? "";

  const actionable =
    perspective === "buyer"
      ? deals.filter((d) => d.buyerEmail === email)
      : deals.filter(
          (d) =>
            (d.status === "requested" && d.buyerEmail !== email) ||
            d.supplierEmail === email
        );

  return (
    <Panel
      title={perspective === "buyer" ? "Deals & payments" : "Deal confirmations"}
      subtitle={
        perspective === "buyer"
          ? "Pay once the supplier confirms quantity."
          : "Confirm stock, watch payments, then request transport."
      }
    >
      {actionable.length === 0 ? (
        <EmptyState message="No deals in this workspace yet." />
      ) : (
        <div className="flex flex-col gap-3">
          {actionable.map((deal) => {
            const isMineAsSupplier = deal.supplierEmail === email;
            const canConfirm =
              perspective === "supplier" && deal.status === "requested";
            const canPay =
              perspective === "buyer" &&
              deal.status === "confirmed" &&
              deal.buyerEmail === email;
            const showPaymentNotice =
              perspective === "supplier" &&
              isMineAsSupplier &&
              (deal.status === "paid" ||
                deal.status === "transport_open" ||
                deal.status === "transport_quoted" ||
                deal.status === "transport_accepted");
            const canRequestTransport =
              perspective === "supplier" &&
              isMineAsSupplier &&
              deal.status === "paid";
            const canAcceptQuote =
              perspective === "supplier" &&
              isMineAsSupplier &&
              deal.status === "transport_quoted";

            return (
              <article
                key={deal.id}
                className="rounded-1.25 border border-[#e5e4df] px-3.5 py-3.5"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <strong className="block text-[0.8125rem]">
                      {deal.product}
                    </strong>
                    <small className="text-[0.5625rem] text-soko-muted">
                      {perspective === "buyer"
                        ? deal.supplierName ?? "Waiting for supplier"
                        : deal.buyerBusiness}{" "}
                      · {deal.quantity} {deal.unit} → {deal.deliveryLocation}
                    </small>
                  </div>
                  <StatusBadge status={deal.status} />
                </div>

                {showPaymentNotice ? (
                  <div className="mb-3 rounded-1.25 bg-[#e8edf3] px-3 py-2.5 text-[0.6875rem] text-[#3a5166]">
                    <strong className="block">Payment received</strong>
                    {formatRwf(deal.paidAmount ?? 0)} for {deal.confirmedQty}{" "}
                    trays
                    {deal.paidAt
                      ? ` · ${new Date(deal.paidAt).toLocaleString()}`
                      : ""}
                  </div>
                ) : null}

                {canConfirm ? <ConfirmForm deal={deal} /> : null}

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
                    <BusyButton
                      className={btn.buyCompact}
                      busyLabel="Paying…"
                      label="Record payment"
                      onClick={() => payDeal(deal.id)}
                    />
                  </div>
                ) : null}

                {canRequestTransport ? (
                  <BusyButton
                    className={`${btn.sellCompact} mt-3`}
                    busyLabel="Requesting…"
                    label={
                      <>
                        Request transport <Icon name="truck" size={16} />
                      </>
                    }
                    onClick={() => requestTransport(deal.id)}
                  />
                ) : null}

                {canAcceptQuote && deal.transportQuotes.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    <p className="m-0 text-[0.625rem] font-bold tracking-wide text-soko-muted uppercase">
                      Logistics quotes
                    </p>
                    {deal.transportQuotes.map((q) => (
                      <div
                        key={q.logisticsEmail}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-1.25 bg-[#f5f5f1] px-3 py-2.5"
                      >
                        <div className="text-[0.6875rem]">
                          <strong>{q.logisticsName}</strong>
                          <span className="text-soko-muted">
                            {" "}
                            · {formatRwf(q.fee)}
                            {q.note ? ` · ${q.note}` : ""}
                          </span>
                        </div>
                        <BusyButton
                          className={btn.sellCompact}
                          busyLabel="Accepting…"
                          label="Accept quote"
                          onClick={() =>
                            acceptTransportQuote(deal.id, q.logisticsEmail)
                          }
                        />
                      </div>
                    ))}
                  </div>
                ) : null}

                {deal.status === "transport_accepted" && isMineAsSupplier ? (
                  <p className="mt-3 mb-0 text-[0.625rem] text-soko-green-2">
                    Transport booked
                    {deal.transportFee
                      ? ` · ${formatRwf(deal.transportFee)}`
                      : ""}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
