"use client";

import { useState } from "react";
import { btn } from "@/lib/ui";
import {
  confirmDealQuantity,
  rejectDeal,
} from "@/lib/marketplaceStore";
import { waitForAction } from "@/lib/actionDelay";
import { Field, fieldClass } from "@/components/marketplace/uiBits";
import { ButtonLoader } from "@/components/ActionLoader";
import { getSession } from "@/lib/session";
import type { Deal } from "@/lib/marketplaceTypes";

export function ConfirmDealForm({ deal }: { deal: Deal }) {
  const session = getSession();
  const [qty, setQty] = useState(String(deal.quantity));
  const [price, setPrice] = useState(String(deal.targetPrice || 4000));
  const [pickup, setPickup] = useState(
    deal.pickupLocation ??
      (session?.businessName.includes("Hub")
        ? "Musanze Aggregator Depot"
        : "Musanze")
  );
  const [loading, setLoading] = useState<"confirm" | "reject" | null>(null);

  if (!session) return null;

  return (
    <form
      className="mt-3 grid grid-cols-3 gap-2 max-sm:grid-cols-1"
      onSubmit={async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading("confirm");
        await waitForAction();
        confirmDealQuantity({
          dealId: deal.id,
          supplierEmail: session.email,
          supplierName: session.businessName,
          confirmedQty: Number(qty) || 0,
          offerPrice: Number(price) || 0,
          pickupLocation: pickup,
        });
        setLoading(null);
      }}
    >
      <Field label="Confirm qty">
        <input
          className={fieldClass}
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          disabled={Boolean(loading)}
        />
      </Field>
      <Field label="Offer / tray">
        <input
          className={fieldClass}
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          disabled={Boolean(loading)}
        />
      </Field>
      <Field label="Pickup location">
        <input
          className={fieldClass}
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          disabled={Boolean(loading)}
        />
      </Field>
      <div className="col-span-full flex flex-wrap gap-2">
        <button
          type="submit"
          className={btn.sellCompact}
          disabled={Boolean(loading)}
        >
          {loading === "confirm" ? (
            <ButtonLoader label="Confirming…" />
          ) : (
            "Confirm request"
          )}
        </button>
        <button
          type="button"
          className={btn.outline}
          disabled={Boolean(loading)}
          onClick={async () => {
            if (loading) return;
            setLoading("reject");
            await waitForAction();
            rejectDeal({
              dealId: deal.id,
              supplierEmail: session.email,
              supplierName: session.businessName,
            });
            setLoading(null);
          }}
        >
          {loading === "reject" ? (
            <ButtonLoader label="Rejecting…" />
          ) : (
            "Reject"
          )}
        </button>
      </div>
    </form>
  );
}
