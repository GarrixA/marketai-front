"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton, ActionToggle, Icon, btn } from "@/lib/ui";
import { EmptyState, Field, fieldClass } from "@/components/marketplace/uiBits";
import { ProductFormModal } from "@/components/marketplace/ProductFormModal";
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
import { formatRwandaLocation } from "@/components/forms/RwandaLocationFields";
import { waitForAction } from "@/lib/actionDelay";
import { formatApiError } from "@/lib/apiError";
import {
  hasDeliveryAddress,
  profileHasDeliveryAddress,
} from "@/lib/deliveryAddress";
import { formatRwf } from "@/lib/marketplaceStore";
import { groupByEggType } from "@/lib/eggType";
import { productImageSrc } from "@/lib/productImage";
import {
  groupProductsBySeller,
  sellersMatchingProducts,
} from "@/lib/sellerOffers";
import { SellerOfferCard } from "@/components/marketplace/SellerOfferCard";
import { validateCoordinatesAgainstAddress } from "@/lib/validateRwandaCoordinates";
import { useCreateDealMutation } from "@/store/actions/deals";
import { CoordinateMismatchDialog } from "@/components/support/CoordinateMismatchDialog";
import {
  SupportTicketModal,
  type SupportTicketPrefill,
} from "@/components/support/SupportTicketModal";
import { useAppDialog } from "@/hooks/useAppDialog";
import { getSession, type DashboardRole } from "@/lib/session";
import { authService } from "@/services/auth.service";
import type { MeResponse } from "@/types/auth";
import type { MarketplaceProduct } from "@/types/product";
import {
  useDeleteProductMutation,
  useListAvailableProductsQuery,
  useListMyProductsQuery,
} from "@/store/actions/products";

type MarketMode = "buy" | "sell";

function SellProductCard({
  product,
  onEdit,
  onSell,
  onDelete,
}: {
  product: MarketplaceProduct;
  onEdit: () => void;
  onSell: () => void;
  onDelete: () => void;
}) {
  const locationLabel = formatRwandaLocation(product.location);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-1.75 border border-soko-line bg-white">
      <img
        src={productImageSrc(product.imageUrl)}
        alt={product.name}
        className="h-36 w-full object-cover object-[center_46%]"
      />
      <div className="flex flex-1 flex-col px-3 py-3.5 sm:px-4.5 sm:py-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <strong className="block truncate text-[0.8125rem] sm:text-[0.875rem]">
              {product.name}
            </strong>
            <small className="text-[0.5625rem] text-soko-muted sm:text-[0.625rem]">
              {product.category?.name ?? "Uncategorized"}
              {product.grade ? ` · ${product.grade}` : ""}
              {product.size ? ` · ${product.size}` : ""}
            </small>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.75 text-[0.5rem] font-bold tracking-wide uppercase ${
              product.isAvailable
                ? "bg-[#dcfce7] text-[#16a34a]"
                : "bg-soko-slate text-soko-muted"
            }`}
          >
            {product.isAvailable ? "Available" : "Unavailable"}
          </span>
        </div>

        <p className="m-0 mb-1 font-display text-[1.0625rem] font-bold sm:text-[1.125rem]">
          {Number(product.price || 0).toLocaleString("en-RW")}{" "}
          <span className="text-[0.75rem] font-semibold text-soko-muted">
            RWF / {product.unit.toLowerCase()}
          </span>
        </p>
        <p className="m-0 mb-1 text-[0.625rem] text-soko-ink sm:text-[0.6875rem]">
          Available{" "}
          <b className="text-soko-ink">
            {product.availableQuantity} {product.unit}
          </b>
        </p>
        <p className="m-0 mb-3 line-clamp-2 flex items-start gap-1 text-[0.5625rem] text-soko-muted sm:text-[0.625rem]">
          <Icon name="pin" size={13} className="mt-0.5 shrink-0" />
          <span>
            {locationLabel}
            {product.useMarketplaceLocation ? " · profile location" : ""}
          </span>
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
          <ActionButton variant="remove" size="sm" onClick={onDelete}>
            Remove
          </ActionButton>
          <ActionButton variant="edit" size="sm" onClick={onEdit}>
            Edit
          </ActionButton>
          {product.isAvailable ? (
            <ActionButton variant="sell" size="sm" onClick={onSell}>
              Sell
            </ActionButton>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function EggTypeStockCard({
  label,
  quantity,
  unit,
  listings,
}: {
  label: string;
  quantity: number;
  unit: string;
  listings: number;
}) {
  const unitLabel = unit.toLowerCase().replace(/s$/, "");
  return (
    <article className="relative rounded-1.75 border border-soko-line bg-white p-4.5">
      <span className="absolute top-4 right-4 rounded-1.25 bg-soko-slate p-1.75 text-soko-navy">
        <Icon name="box" />
      </span>
      <small className="block pr-10 text-[0.625rem] text-soko-muted">
        {label}
      </small>
      <strong className="my-2 block font-display text-[1.4375rem] font-bold">
        {quantity.toLocaleString("en-RW")}
      </strong>
      <p className="m-0 text-[0.5625rem] text-soko-green-2">
        {listings === 1
          ? `1 listing · ${unitLabel}`
          : `${listings} listings · ${unitLabel}`}
      </p>
    </article>
  );
}

function toLocationPayload(address: DeliveryAddressValue) {
  const latitude = address.latitude?.trim()
    ? Number(address.latitude)
    : undefined;
  const longitude = address.longitude?.trim()
    ? Number(address.longitude)
    : undefined;
  return {
    province: address.province,
    district: address.district,
    sector: address.sector,
    cell: address.cell,
    village: address.village,
    hood: address.hood?.trim() || undefined,
    latitude:
      latitude !== undefined && Number.isFinite(latitude)
        ? latitude
        : undefined,
    longitude:
      longitude !== undefined && Number.isFinite(longitude)
        ? longitude
        : undefined,
  };
}

export function BuyQtyModal({
  product,
  onClose,
  onConfirm,
  showError,
  showSuccess,
}: {
  product: MarketplaceProduct;
  onClose: () => void;
  onConfirm: (
    qty: number,
    deliveryLabel: string,
    address: DeliveryAddressValue
  ) => void | Promise<void>;
  showError: ReturnType<typeof useAppDialog>["showError"];
  showSuccess: ReturnType<typeof useAppDialog>["showSuccess"];
}) {
  const router = useRouter();
  const sellsAsLot = product.sellMode === "LOT";
  const minQty = sellsAsLot
    ? Math.max(1, product.availableQuantity)
    : Math.max(1, product.minQuantity ?? 1);
  const [qty, setQty] = useState(String(minQty));
  const [loading, setLoading] = useState(false);
  const [meLoading, setMeLoading] = useState(true);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [addressMode, setAddressMode] = useState<"saved" | "new">("saved");
  const [newAddress, setNewAddress] = useState<DeliveryAddressValue>(
    emptyDeliveryAddress()
  );
  const [saveNewToProfile, setSaveNewToProfile] = useState(true);
  const [mismatchOpen, setMismatchOpen] = useState(false);
  const [mismatchMessage, setMismatchMessage] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpPrefill, setHelpPrefill] = useState<SupportTicketPrefill | null>(
    null
  );
  const ownerName = product.owner?.name ?? "Seller";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setMeLoading(true);
      try {
        const data = await authService.getMe();
        if (cancelled) return;
        setMe(data);
        if (profileHasDeliveryAddress(data)) {
          setAddressMode("saved");
        } else {
          setAddressMode("new");
        }
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
    const lat = activeAddress.latitude?.trim()
      ? Number(activeAddress.latitude)
      : NaN;
    const lng = activeAddress.longitude?.trim()
      ? Number(activeAddress.longitude)
      : NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return true;
    }
    if (!activeAddress.village?.trim()) {
      return true;
    }

    try {
      const result = await validateCoordinatesAgainstAddress({
        latitude: lat,
        longitude: lng,
        province: activeAddress.province,
        district: activeAddress.district,
        sector: activeAddress.sector,
        cell: activeAddress.cell,
        village: activeAddress.village,
      });
      if (result.ok) return true;
      setMismatchMessage(
        `${result.message} Fix the address, or request help from admin.`
      );
      setHelpPrefill({
        category: "LOCATION_MISMATCH",
        subject: "Delivery coordinates do not match selected village",
        message:
          "My GPS coordinates do not match the village I selected. Please help me correct my delivery address.",
        context: {
          summary: result.message,
          selectedAddress: activeAddress,
          lookup: result.lookup,
          mismatches: result.mismatches,
        },
      });
      setMismatchOpen(true);
      return false;
    } catch {
      setMismatchMessage(
        "Village boundary lookup failed. Fix the address, or request help from admin."
      );
      setHelpPrefill({
        category: "LOCATION_MISMATCH",
        subject: "Could not verify delivery coordinates",
        message:
          "Village boundary lookup failed while checking my delivery coordinates. Please help me verify my address.",
        context: {
          summary: "Village boundary lookup failed.",
          selectedAddress: activeAddress,
          latitude: lat,
          longitude: lng,
        },
      });
      setMismatchOpen(true);
      return false;
    }
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
          Buy from {ownerName}
        </h3>
        <p className="mt-1 mb-4 text-[0.625rem] text-soko-muted">
          {product.description?.trim() || product.name}
          {product.grade ? ` · ${product.grade}` : ""} ·{" "}
          {product.availableQuantity} {product.unit} available
        </p>

        {!meLoading && !hasSaved ? (
          <div className="mb-4 rounded-1.25 border border-soko-line bg-soko-slate px-3.5 py-3">
            <p className="m-0 text-[0.75rem] font-bold text-soko-ink">
              Delivery address required
            </p>
            <p className="m-0 mt-1 text-[0.6875rem] text-soko-muted">
              Add a delivery address below to place this buy request, or manage
              it anytime in Account.
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

            const qtyValue = sellsAsLot
              ? product.availableQuantity
              : Number(qty) || minQty;
            if (!sellsAsLot && qtyValue < minQty) {
              await showError(`Minimum order is ${minQty} ${product.unit}.`, {
                title: "Quantity too low",
              });
              return;
            }
            if (!sellsAsLot && qtyValue > product.availableQuantity) {
              await showError(
                `Only ${product.availableQuantity} ${product.unit.toLowerCase()} are listed.`,
                { title: "Quantity too high" }
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
                qtyValue,
                formatDeliveryAddress(activeAddress),
                activeAddress
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
          {sellsAsLot ? (
            <p className="m-0 text-[0.75rem] text-soko-ink">
              Sold as one lot of{" "}
              <b>
                {product.availableQuantity} {product.unit.toLowerCase()}
              </b>
              .
            </p>
          ) : (
            <Field label={`Quantity (${product.unit.toLowerCase()})`}>
              <input
                className={fieldClass}
                type="number"
                min={minQty}
                max={product.availableQuantity}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
                disabled={loading}
              />
            </Field>
          )}

          {hasSaved ? (
            <div className="grid gap-2">
              <p className="m-0 text-[0.625rem] font-bold tracking-wide text-soko-muted uppercase">
                Delivery address
              </p>
              <label className="flex items-start gap-2 rounded-1.25 border border-soko-line px-3 py-2.5 text-xs">
                <input
                  type="radio"
                  className="mt-0.5"
                  name="delivery-mode"
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
                  name="delivery-mode"
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
              <p className="m-0 mb-2 text-[0.625rem] font-bold tracking-wide text-soko-muted uppercase">
                {hasSaved ? "New delivery address" : "Add delivery address"}
              </p>
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

export function ProductMarketPanel({ role }: { role: DashboardRole }) {
  const session = getSession();
  const { dialog, showError, showSuccess, confirm } = useAppDialog();
  const canManage = role === "supplier" || role === "aggregator";
  const canBuy = role === "buyer" || role === "aggregator" || role === "admin";

  const { data: myProducts = [], isLoading: myProductsLoading } =
    useListMyProductsQuery(undefined, {
      skip: !canManage,
      refetchOnMountOrArgChange: true,
    });
  const { data: availableProducts = [], isLoading: availableLoading } =
    useListAvailableProductsQuery(
      { excludeOwn: true },
      { skip: !canBuy, refetchOnMountOrArgChange: true }
    );
  const [deleteProduct] = useDeleteProductMutation();
  const [createDeal] = useCreateDealMutation();

  const defaultMode: MarketMode =
    role === "supplier" || role === "aggregator" ? "sell" : "buy";
  const [mode, setMode] = useState<MarketMode>(defaultMode);
  const [gradeFilter, setGradeFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formIntent, setFormIntent] = useState<"edit" | "sell">("edit");
  const [editingProduct, setEditingProduct] =
    useState<MarketplaceProduct | null>(null);
  const [buying, setBuying] = useState<MarketplaceProduct | null>(null);
  const [tradeResult, setTradeResult] = useState<TradeResult | null>(null);

  const showToggle = role === "aggregator";
  const activeMode: MarketMode = showToggle
    ? mode
    : role === "supplier"
      ? "sell"
      : "buy";

  const buyList = useMemo(() => {
    let rows = availableProducts.filter(
      (p) => p.isAvailable && p.availableQuantity > 0
    );

    if (gradeFilter !== "All") {
      rows = rows.filter((p) => (p.grade ?? "") === gradeFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q) ||
          (p.owner?.name ?? "").toLowerCase().includes(q) ||
          (p.grade ?? "").toLowerCase().includes(q) ||
          formatRwandaLocation(p.location).toLowerCase().includes(q) ||
          (p.category?.name ?? "").toLowerCase().includes(q)
      );
    }
    return rows;
  }, [availableProducts, gradeFilter, query]);

  const sellerOffers = useMemo(
    () =>
      groupProductsBySeller(
        availableProducts.filter(
          (product) => product.isAvailable && product.availableQuantity > 0
        )
      ),
    [availableProducts]
  );
  const visibleSellers = useMemo(
    () => sellersMatchingProducts(sellerOffers, buyList),
    [sellerOffers, buyList]
  );

  const sellList = useMemo(() => {
    let rows = [...myProducts];
    if (gradeFilter !== "All") {
      rows = rows.filter((p) => (p.grade ?? "") === gradeFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.grade ?? "").toLowerCase().includes(q) ||
          formatRwandaLocation(p.location).toLowerCase().includes(q) ||
          (p.category?.name ?? "").toLowerCase().includes(q)
      );
    }
    return rows;
  }, [myProducts, gradeFilter, query]);

  const grades = useMemo(() => {
    const source = activeMode === "sell" ? myProducts : availableProducts;
    const set = new Set(
      source.map((p) => p.grade).filter((g): g is string => Boolean(g))
    );
    return ["All", ...Array.from(set)];
  }, [activeMode, myProducts, availableProducts]);

  const eggTypes = useMemo(() => groupByEggType(myProducts), [myProducts]);
  const listCount =
    activeMode === "sell" ? sellList.length : visibleSellers.length;
  const listNoun =
    activeMode === "sell"
      ? `product${listCount === 1 ? "" : "s"}`
      : `seller${listCount === 1 ? "" : "s"}`;

  const openEdit = (product: MarketplaceProduct) => {
    setFormIntent("edit");
    setEditingProduct(product);
    setFormOpen(true);
  };

  const openSell = (product: MarketplaceProduct) => {
    setFormIntent("sell");
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleDelete = async (product: MarketplaceProduct) => {
    const ok = await confirm({
      title: "Remove product",
      message: `Remove “${product.name}” from your sell listings?`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteProduct(product.id).unwrap();
    } catch (err) {
      await showError(formatApiError(err));
    }
  };

  return (
    <div className="space-y-4">
      {dialog}
      {canManage && eggTypes.length > 0 ? (
        <div className="grid grid-cols-4 gap-3.25 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {eggTypes.map((group) => (
            <EggTypeStockCard
              key={`${group.label}-${group.unit}`}
              label={group.label}
              quantity={group.quantity}
              unit={group.unit}
              listings={group.products.length}
            />
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        {showToggle ? (
          <ActionToggle
            value={mode}
            onChange={setMode}
            options={[
              {
                value: "buy",
                label: "Buy",
                icon: "cart",
                activeVariant: "buy",
              },
              {
                value: "sell",
                label: "Sell",
                icon: "tag",
                activeVariant: "sell",
              },
            ]}
          />
        ) : (
          <ActionButton
            variant={role === "supplier" ? "sell" : "buy"}
            size="sm"
            shape="pill"
            icon={role === "supplier" ? "tag" : "cart"}
            className="pointer-events-none"
            tabIndex={-1}
          >
            {role === "supplier" ? "Your sell listings" : "Buy from market"}
          </ActionButton>
        )}

        <span className="ml-auto rounded-full border border-soko-line bg-white px-3 py-1.5 text-[0.6875rem] font-bold">
          RWF
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          className={`${fieldClass} max-w-55`}
          placeholder={
            activeMode === "sell"
              ? "Search your products…"
              : "Search seller, egg grade, location…"
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className={fieldClass}
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
        >
          {grades.map((g) => (
            <option key={g} value={g}>
              {g === "All" ? "All grades" : g}
            </option>
          ))}
        </select>
        <span className="self-center text-[0.625rem] text-soko-muted">
          {listCount} {listNoun}
        </span>
      </div>

      {activeMode === "sell" ? (
        myProductsLoading ? (
          <EmptyState message="Loading your sell listings…" />
        ) : sellList.length === 0 ? (
          <EmptyState message="No sell listings yet. Use List for sale to publish stock." />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {sellList.map((product) => (
              <SellProductCard
                key={product.id}
                product={product}
                onEdit={() => openEdit(product)}
                onSell={() => openSell(product)}
                onDelete={() => {
                  void handleDelete(product);
                }}
              />
            ))}
          </div>
        )
      ) : availableLoading ? (
        <EmptyState message="Loading products to buy…" />
      ) : visibleSellers.length === 0 ? (
        <EmptyState message="No sellers with stock to buy right now." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleSellers.map((seller) => (
            <SellerOfferCard key={seller.id} seller={seller} />
          ))}
        </div>
      )}

      {canManage ? (
        <ProductFormModal
          key={`${editingProduct?.id ?? "new"}-${formIntent}`}
          open={formOpen}
          product={editingProduct}
          intent={formIntent}
          onClose={() => {
            setFormOpen(false);
            setEditingProduct(null);
            setFormIntent("edit");
          }}
          onSuccess={(saved, isUpdate) => {
            const confirmedSell = formIntent === "sell";
            setTradeResult({
              kind: "sell",
              title: confirmedSell
                ? "Sell confirmed"
                : isUpdate
                  ? "Product updated"
                  : "Listed for sale",
              message: confirmedSell
                ? saved.sellMode === "LOT"
                  ? "One buyer can purchase the full quantity at this price."
                  : "Buyers can take part of this quantity. Unsold stock stays listed."
                : isUpdate
                  ? "Your product changes are live on the sell tab."
                  : "Your product is now visible on your sell tab.",
              details: [
                `${saved.name}${saved.grade ? ` · ${saved.grade}` : ""}`,
                `${Number(saved.price || 0).toLocaleString("en-RW")} RWF / ${saved.unit.toLowerCase()}`,
                `${saved.availableQuantity} ${saved.unit}`,
                formatRwandaLocation(saved.location),
              ],
            });
          }}
        />
      ) : null}

      {buying ? (
        <BuyQtyModal
          product={buying}
          onClose={() => setBuying(null)}
          showError={showError}
          showSuccess={showSuccess}
          onConfirm={async (qty, delivery) => {
            if (!session) return;
            const product = buying;
            const ownerId = product.ownerId ?? product.owner?.id;
            if (!ownerId) {
              await showError(
                "This listing has no seller account attached. Try another product.",
                { title: "Could not send buy request" }
              );
              return;
            }

            const deal = await createDeal({
              productId: product.id,
              quantity: qty,
              deliveryLocation: delivery,
            }).unwrap();

            setBuying(null);
            const productLabel = deal.grade
              ? `${deal.productName} · ${deal.grade}`
              : deal.productName;
            setTradeResult({
              kind: "buy",
              title: "Buy request sent",
              message:
                "The seller was notified on Deals. They will confirm available quantity before payment.",
              details: [
                productLabel,
                `${deal.quantity} ${deal.unit.toLowerCase()} · ${formatRwf(deal.targetPrice)} / ${deal.unit.toLowerCase()}`,
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
    </div>
  );
}
