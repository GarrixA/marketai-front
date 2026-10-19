"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, btn } from "@/lib/ui";
import { createBuyFromListing, formatRwf } from "@/lib/marketplaceStore";
import { waitForAction } from "@/lib/actionDelay";
import { formatApiError } from "@/lib/apiError";
import {
  hasDeliveryAddress,
  profileHasDeliveryAddress,
} from "@/lib/deliveryAddress";
// import { validateCoordinatesAgainstAddress } from "@/lib/validateRwandaCoordinates";
import { CoordinateMismatchDialog } from "@/components/support/CoordinateMismatchDialog";
import {
  SupportTicketModal,
  type SupportTicketPrefill,
} from "@/components/support/SupportTicketModal";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import {
  EmptyState,
  Field,
  Panel,
  fieldClass,
} from "@/components/marketplace/uiBits";
import {
  TradeResultModal,
  type TradeResult,
} from "@/components/marketplace/TradeResultModal";
import { ActionOverlay, ButtonLoader } from "@/components/ActionLoader";
import {
  DeliveryAddressFields,
  deliveryAddressFromLocation,
  emptyDeliveryAddress,
  formatDeliveryAddress,
  type DeliveryAddressValue,
} from "@/components/forms/DeliveryAddressFields";
import { useAppDialog } from "@/hooks/useAppDialog";
import { markSellOffersSeen } from "@/lib/sellOffersSeen";
import { getSession } from "@/lib/session";
import { authService } from "@/services/auth.service";
import type { MeResponse } from "@/types/auth";
import type { SellOffer } from "@/lib/marketplaceTypes";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function toLocationPayload(address: DeliveryAddressValue) {
  // const latitude = address.latitude?.trim()
  //   ? Number(address.latitude)
  //   : undefined;
  // const longitude = address.longitude?.trim()
  //   ? Number(address.longitude)
  //   : undefined;
  return {
    province: address.province,
    district: address.district,
    sector: address.sector,
    cell: address.cell,
    village: address.village,
    hood: address.hood?.trim() || undefined,
    // latitude:
    //   latitude !== undefined && Number.isFinite(latitude)
    //     ? latitude
    //     : undefined,
    // longitude:
    //   longitude !== undefined && Number.isFinite(longitude)
    //     ? longitude
    //     : undefined,
  };
}

function BuyOfferModal({
  offer,
  onClose,
  onConfirm,
  showError,
  showSuccess,
}: {
  offer: SellOffer;
  onClose: () => void;
  onConfirm: (qty: number, delivery: string) => void | Promise<void>;
  showError: ReturnType<typeof useAppDialog>["showError"];
  showSuccess: ReturnType<typeof useAppDialog>["showSuccess"];
}) {
  const router = useRouter();
  const [qty, setQty] = useState(String(offer.minOrder));
  const [loading, setLoading] = useState(false);
  const [meLoading, setMeLoading] = useState(true);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [addressMode, setAddressMode] = useState<"saved" | "new">("saved");
  const [newAddress, setNewAddress] = useState<DeliveryAddressValue>(
    emptyDeliveryAddress()
  );
  const [saveNewToProfile, setSaveNewToProfile] = useState(true);
  const [mismatchOpen, setMismatchOpen] = useState(false);
  const [mismatchMessage] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpPrefill] = useState<SupportTicketPrefill | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setMeLoading(true);
      try {
        const data = await authService.getMe();
        if (cancelled) return;
        setMe(data);
        setAddressMode(profileHasDeliveryAddress(data) ? "saved" : "new");
      } catch (err) {
        if (!cancelled) {
          await showError(formatApiError(err), {
            title: "Could not load delivery address",
          });
        }
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showError]);

  const savedAddress = me?.profile?.location ?? null;
  const hasSaved = profileHasDeliveryAddress(me);
  const activeAddress: DeliveryAddressValue =
    addressMode === "saved" && hasSaved
      ? deliveryAddressFromLocation(savedAddress)
      : newAddress;

  const validateActiveCoordinates = async () => {
    // Coordinates ignored for now.
    return true;
    // const lat = activeAddress.latitude?.trim()
    //   ? Number(activeAddress.latitude)
    //   : NaN;
    // const lng = activeAddress.longitude?.trim()
    //   ? Number(activeAddress.longitude)
    //   : NaN;
    // if (!Number.isFinite(lat) || !Number.isFinite(lng)) return true;
    // if (!activeAddress.village?.trim()) return true;
    //
    // try {
    //   const result = await validateCoordinatesAgainstAddress({
    //     latitude: lat,
    //     longitude: lng,
    //     province: activeAddress.province,
    //     district: activeAddress.district,
    //     sector: activeAddress.sector,
    //     cell: activeAddress.cell,
    //     village: activeAddress.village,
    //   });
    //   if (result.ok) return true;
    //   setMismatchMessage(
    //     `${result.message} Fix the address, or request help from admin.`
    //   );
    //   setHelpPrefill({
    //     category: "LOCATION_MISMATCH",
    //     subject: "Delivery coordinates do not match selected village",
    //     message:
    //       "My GPS coordinates do not match the village I selected. Please help me correct my delivery address.",
    //     context: {
    //       summary: result.message,
    //       selectedAddress: activeAddress,
    //       lookup: result.lookup,
    //       mismatches: result.mismatches,
    //     },
    //   });
    //   setMismatchOpen(true);
    //   return false;
    // } catch {
    //   setMismatchMessage(
    //     "Village boundary lookup failed. Fix the address, or request help from admin."
    //   );
    //   setHelpPrefill({
    //     category: "LOCATION_MISMATCH",
    //     subject: "Could not verify delivery coordinates",
    //     message:
    //       "Village boundary lookup failed while checking my delivery coordinates. Please help me verify my address.",
    //     context: {
    //       summary: "Village boundary lookup failed.",
    //       selectedAddress: activeAddress,
    //       latitude: lat,
    //       longitude: lng,
    //     },
    //   });
    //   setMismatchOpen(true);
    //   return false;
    // }
  };

  return (
    <div className="fixed inset-0 z-100 grid place-items-center overflow-y-auto bg-soko-navy/72 p-4 backdrop-blur-sm sm:p-6">
      <div className="relative my-auto w-full max-w-125 rounded-2.5 bg-white px-5 py-6 sm:px-7">
        {loading || meLoading ? (
          <ActionOverlay
            label={meLoading ? "Loading address…" : "Sending buy request…"}
          />
        ) : null}
        <button
          type="button"
          className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full border border-soko-line bg-white disabled:opacity-50"
          onClick={onClose}
          disabled={loading}
          aria-label="Close buy modal"
        >
          <Icon name="close" size={16} />
        </button>
        <h3 className="m-0 pr-8 font-display text-[1.125rem] font-bold">
          Buy from {offer.ownerName}
        </h3>
        <p className="mt-1 mb-4 text-[0.625rem] text-soko-muted">
          {offer.product} · {offer.grade} · {formatRwf(offer.pricePerUnit)}/tray
        </p>

        {!meLoading && !hasSaved ? (
          <div className="mb-4 rounded-1.25 border border-soko-line bg-soko-slate px-3.5 py-3">
            <p className="m-0 text-[0.75rem] font-bold text-soko-ink">
              Delivery address required
            </p>
            <p className="m-0 mt-1 text-[0.6875rem] text-soko-muted">
              Add a delivery address below to place this buy request.
            </p>
            <button
              type="button"
              className={`${btn.text} mt-2 px-0 text-[0.6875rem]`}
              onClick={() => router.push("/dashboard/account")}
            >
              Open Account settings
            </button>
          </div>
        ) : null}

        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (loading || meLoading) return;

            if (!hasDeliveryAddress(activeAddress)) {
              await showError(
                "Select a province and district for the delivery address.",
                { title: "Delivery address required" }
              );
              return;
            }

            const coordsOk = await validateActiveCoordinates();
            if (!coordsOk) return;

            setLoading(true);
            try {
              if (addressMode === "new" && saveNewToProfile) {
                const updated = await authService.updateMeProfile({
                  location: toLocationPayload(activeAddress),
                });
                setMe(updated);
              }
              await waitForAction();
              await onConfirm(
                Number(qty) || offer.minOrder,
                formatDeliveryAddress(activeAddress)
              );
            } catch (err) {
              await showError(formatApiError(err), {
                title: "Could not send buy request",
              });
            } finally {
              setLoading(false);
            }
          }}
        >
          <Field label="Quantity (trays)">
            <input
              className={fieldClass}
              type="number"
              min={offer.minOrder}
              max={offer.quantity}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              required
              disabled={loading}
            />
          </Field>

          {hasSaved ? (
            <div className="grid gap-2">
              <p className="m-0 text-[0.625rem] font-bold tracking-wide text-soko-muted uppercase">
                Delivery address
              </p>
              <label className="flex items-start gap-2 rounded-1.25 border border-soko-line px-3 py-2.5 text-xs">
                <input
                  type="radio"
                  className="mt-0.5"
                  name="sell-delivery-mode"
                  checked={addressMode === "saved"}
                  onChange={() => setAddressMode("saved")}
                  disabled={loading}
                />
                <span>
                  <strong className="block">Use my saved address</strong>
                  <span className="mt-0.5 block text-soko-muted">
                    {formatDeliveryAddress(savedAddress)}
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 rounded-1.25 border border-soko-line px-3 py-2.5 text-xs">
                <input
                  type="radio"
                  className="mt-0.5"
                  name="sell-delivery-mode"
                  checked={addressMode === "new"}
                  onChange={() => setAddressMode("new")}
                  disabled={loading}
                />
                <span>
                  <strong className="block">Use a different address</strong>
                  <span className="mt-0.5 block text-soko-muted">
                    Enter a new delivery location for this order.
                  </span>
                </span>
              </label>
            </div>
          ) : null}

          {addressMode === "new" || !hasSaved ? (
            <div className="rounded-1.25 border border-soko-line p-3">
              <DeliveryAddressFields
                value={newAddress}
                onChange={setNewAddress}
                disabled={loading}
                required
              />
              <label className="mt-3 flex items-center gap-2 text-xs text-soko-ink">
                <input
                  type="checkbox"
                  checked={saveNewToProfile}
                  onChange={(e) => setSaveNewToProfile(e.target.checked)}
                  disabled={loading}
                />
                Save this as my delivery address
              </label>
            </div>
          ) : null}

          <p className="m-0 text-[0.625rem] text-soko-muted">
            Estimated total{" "}
            <b className="text-soko-ink">
              {formatRwf((Number(qty) || 0) * offer.pricePerUnit)}
            </b>
          </p>
          <button
            type="submit"
            className={`${btn.buyCompact} w-full sm:px-5.5 sm:py-3.5`}
            disabled={loading || meLoading}
          >
            {loading ? (
              <ButtonLoader label="Sending…" />
            ) : (
              <>
                Send buy request <Icon name="arrow" />
              </>
            )}
          </button>
        </form>

        <CoordinateMismatchDialog
          open={mismatchOpen}
          message={mismatchMessage}
          onClose={() => setMismatchOpen(false)}
          onFixAddress={() => {
            setMismatchOpen(false);
            setAddressMode("new");
            if (hasSaved) {
              setNewAddress(deliveryAddressFromLocation(savedAddress));
            }
          }}
          onRequestHelp={() => {
            setMismatchOpen(false);
            setHelpOpen(true);
          }}
        />

        <SupportTicketModal
          open={helpOpen}
          onClose={() => setHelpOpen(false)}
          me={me}
          prefill={helpPrefill}
          onSubmitted={(ticketNumber) => {
            void showSuccess(`Support ticket ${ticketNumber} sent to admin.`, {
              title: "Help requested",
            });
          }}
          onError={(message) => {
            void showError(message, { title: "Could not send ticket" });
          }}
        />
      </div>
    </div>
  );
}

export function SellOffersPanel() {
  const { sellOffers } = useMarketplace();
  const session = getSession();
  const { dialog, showError, showSuccess } = useAppDialog();
  const email = session?.email ?? "";
  const [roleFilter, setRoleFilter] = useState<
    "all" | "supplier" | "aggregator"
  >("all");
  const [buying, setBuying] = useState<SellOffer | null>(null);
  const [tradeResult, setTradeResult] = useState<TradeResult | null>(null);

  useEffect(() => {
    if (!email) return;
    markSellOffersSeen(email);
  }, [email, sellOffers.length]);

  const offers = useMemo(() => {
    return sellOffers
      .filter((item) => item.ownerEmail !== email)
      .filter((item) =>
        roleFilter === "all" ? true : item.ownerRole === roleFilter
      )
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }, [sellOffers, email, roleFilter]);

  return (
    <>
      <div className="space-y-4">
        <Panel
          title="Confirmed sell offers"
          subtitle="Only products a supplier or aggregator confirmed with Sell → Confirm sell order."
          action={
            <div className="inline-flex rounded-full bg-soko-slate p-1">
              {(
                [
                  ["all", "All"],
                  ["supplier", "Suppliers"],
                  ["aggregator", "Aggregators"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRoleFilter(value)}
                  className={`rounded-full border-0 px-3.5 py-1.5 text-[0.6875rem] font-bold ${
                    roleFilter === value
                      ? "bg-soko-navy text-white"
                      : "bg-transparent text-soko-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        >
          {offers.length === 0 ? (
            <EmptyState message="No confirmed sell offers yet. When a seller confirms Sell, it appears here." />
          ) : (
            <div className="flex flex-col gap-3">
              {offers.map((item) => (
                <article
                  key={item.id}
                  className="rounded-1.25 border border-soko-line px-3.5 py-3.5"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="relative grid h-9 w-9 place-items-center rounded-full bg-soko-slate text-[0.6875rem] font-extrabold text-soko-navy">
                        {initials(item.ownerName)}
                      </span>
                      <div>
                        <strong className="block text-[0.8125rem]">
                          {item.ownerName}
                        </strong>
                        <small className="text-[0.5625rem] text-soko-muted">
                          {item.product} · {item.grade}
                        </small>
                      </div>
                    </div>
                    <span className="rounded-full bg-soko-slate px-2 py-0.75 text-[0.5rem] font-bold tracking-wide text-soko-navy uppercase">
                      {item.ownerRole}
                    </span>
                  </div>

                  <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <p className="m-0 font-display text-[1.125rem] font-bold">
                        {formatRwf(item.pricePerUnit)}
                        <span className="text-[0.6875rem] font-semibold text-soko-muted">
                          {" "}
                          / tray
                        </span>
                      </p>
                      <p className="m-0 mt-1 text-[0.625rem] text-soko-muted">
                        {item.quantity} trays available · Min {item.minOrder} ·{" "}
                        {item.location}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={btn.buySm}
                      onClick={() => setBuying(item)}
                    >
                      Buy
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {buying ? (
        <BuyOfferModal
          offer={buying}
          onClose={() => setBuying(null)}
          showError={showError}
          showSuccess={showSuccess}
          onConfirm={async (qty, delivery) => {
            if (!session) return;
            const deal = createBuyFromListing({
              listingId: buying.listingId,
              quantity: qty,
              buyerEmail: session.email,
              buyerName: session.name,
              buyerBusiness: session.businessName,
              deliveryLocation: delivery,
            });
            setBuying(null);
            if (!deal) return;
            setTradeResult({
              kind: "buy",
              title: "Buy request sent",
              message:
                "The seller can confirm or reject this request from Deals.",
              details: [
                `${deal.product}`,
                `${deal.quantity} trays · ${formatRwf(deal.targetPrice)}/tray`,
                `Delivery to ${deal.deliveryLocation}`,
                deal.supplierName ? `Seller ${deal.supplierName}` : "",
              ].filter(Boolean),
            });
          }}
        />
      ) : null}

      <TradeResultModal
        result={tradeResult}
        onClose={() => setTradeResult(null)}
      />
      {dialog}
    </>
  );
}
