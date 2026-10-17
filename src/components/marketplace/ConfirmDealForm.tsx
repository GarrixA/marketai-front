"use client";

import { useMemo, useState } from "react";
import { btn } from "@/lib/ui";
import { confirmDealQuantity, rejectDeal } from "@/lib/marketplaceStore";
import { waitForAction } from "@/lib/actionDelay";
import { formatApiError } from "@/lib/apiError";
import { Field, fieldClass } from "@/components/marketplace/uiBits";
import { ButtonLoader } from "@/components/ActionLoader";
import { useAppDialog } from "@/hooks/useAppDialog";
import { formatBusinessLocation } from "@/lib/deliveryAddress";
import { availableStock, stockShortfallMessage } from "@/lib/eggType";
import { getSession } from "@/lib/session";
import type { Deal } from "@/lib/marketplaceTypes";
import { useGetMeQuery } from "@/store/actions/auth";
import {
  useConfirmDealMutation,
  useRejectDealMutation,
} from "@/store/actions/deals";
import { useCreateBuyRequestOfferMutation } from "@/store/actions/requests";
import { useListMyProductsQuery } from "@/store/actions/products";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isApiDeal(deal: Deal) {
  return UUID_RE.test(deal.id) && deal.source === "purchase";
}

function isOpenRfq(deal: Deal) {
  return UUID_RE.test(deal.id) && deal.source === "rfq";
}

export function ConfirmDealForm({
  deal,
  allowReject = true,
  onConfirmed,
}: {
  deal: Deal;
  allowReject?: boolean;
  onConfirmed?: () => void;
}) {
  const session = getSession();
  const { dialog, showError } = useAppDialog();
  const { data: me, isLoading: meLoading } = useGetMeQuery(undefined, {
    skip: !session,
  });
  const [confirmApiDeal] = useConfirmDealMutation();
  const [rejectApiDeal] = useRejectDealMutation();
  const [createOffer] = useCreateBuyRequestOfferMutation();
  const { data: myProducts = [], isLoading: productsLoading } =
    useListMyProductsQuery(undefined, {
      skip: !session || !isOpenRfq(deal),
    });
  const [qty, setQty] = useState(String(deal.quantity));
  const [price, setPrice] = useState(String(deal.targetPrice || 4000));
  const pickup = formatBusinessLocation(me);
  const [loading, setLoading] = useState<"confirm" | "reject" | null>(null);
  const stock = useMemo(
    () => availableStock(myProducts, deal.product, deal.unit),
    [myProducts, deal.product, deal.unit]
  );
  const requestedQty = Number(qty) || 0;
  const checkingStock = isOpenRfq(deal);
  const stockError =
    !checkingStock || productsLoading
      ? null
      : stockShortfallMessage({
          requestedQty,
          availableQty: stock.quantity,
          label: stock.label,
          unitLabel: stock.unitLabel,
        });

  if (!session) return null;

  return (
    <>
      <form
        className="mt-3 grid grid-cols-3 gap-2 max-sm:grid-cols-1"
        onSubmit={async (e) => {
          e.preventDefault();
          if (loading || !pickup || stockError) return;
          setLoading("confirm");
          try {
            if (isOpenRfq(deal)) {
              await createOffer({
                id: deal.id,
                body: {
                  quantity: Number(qty) || 0,
                  unitPrice: Number(price) || 0,
                  pickupLocation: pickup,
                },
              }).unwrap();
              onConfirmed?.();
            } else if (isApiDeal(deal)) {
              await confirmApiDeal({
                id: deal.id,
                body: {
                  confirmedQty: Number(qty) || 0,
                  offerPrice: Number(price) || 0,
                  pickupLocation: pickup,
                },
              }).unwrap();
              onConfirmed?.();
            } else {
              await waitForAction();
              confirmDealQuantity({
                dealId: deal.id,
                supplierEmail: session.email,
                supplierName: session.businessName,
                supplierUserId: session.userId,
                confirmedQty: Number(qty) || 0,
                offerPrice: Number(price) || 0,
                pickupLocation: pickup,
              });
            }
          } catch (err) {
            await showError(formatApiError(err), {
              title: "Could not confirm deal",
            });
          } finally {
            setLoading(null);
          }
        }}
      >
        <Field label="Available qty">
          <input
            className={fieldClass}
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            disabled={Boolean(loading)}
            aria-label="Confirm available quantity"
          />
          {stockError ? (
            <p className="m-0 mt-1.5 text-[0.6875rem] text-[#b91c1c]">
              {stockError}
            </p>
          ) : checkingStock && !productsLoading ? (
            <p className="m-0 mt-1.5 text-[0.6875rem] text-soko-muted">
              You have {stock.quantity} {stock.unitLabel} of {stock.label}.
            </p>
          ) : null}
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
            className={`${fieldClass} bg-soko-slate text-soko-ink`}
            value={meLoading ? "Loading business location…" : pickup || "—"}
            readOnly
            disabled
            aria-label="Pickup location, same as business location"
          />
          {!meLoading && !pickup ? (
            <p className="m-0 mt-1.5 text-[0.6875rem] text-soko-muted">
              Add a business location on your account before confirming.
            </p>
          ) : null}
        </Field>
        <div className="col-span-full flex flex-wrap gap-2">
          <button
            type="submit"
            className={btn.sellCompact}
            disabled={
              Boolean(loading) || meLoading || !pickup || Boolean(stockError)
            }
          >
            {loading === "confirm" ? (
              <ButtonLoader label="Confirming…" />
            ) : (
              "Confirm available"
            )}
          </button>
          {allowReject ? (
            <button
              type="button"
              className={btn.outline}
              disabled={Boolean(loading)}
              onClick={async () => {
                if (loading) return;
                setLoading("reject");
                try {
                  if (isApiDeal(deal)) {
                    await rejectApiDeal(deal.id).unwrap();
                  } else {
                    await waitForAction();
                    rejectDeal({
                      dealId: deal.id,
                      supplierEmail: session.email,
                      supplierName: session.businessName,
                      supplierUserId: session.userId,
                    });
                  }
                } catch (err) {
                  await showError(formatApiError(err), {
                    title: "Could not reject deal",
                  });
                } finally {
                  setLoading(null);
                }
              }}
            >
              {loading === "reject" ? (
                <ButtonLoader label="Rejecting…" />
              ) : (
                "Reject"
              )}
            </button>
          ) : null}
        </div>
      </form>
      {dialog}
    </>
  );
}
