"use client";

import { ActionButton, Icon, btn } from "@/lib/ui";
import { UserAvatar } from "@/components/UserAvatar";
import { VerifiedBadge } from "@/components/marketplace/VerifiedBadge";
import { formatRwandaLocation } from "@/components/forms/RwandaLocationFields";
import { productImageSrc } from "@/lib/productImage";
import { roleLabel, type SellerOffer } from "@/lib/sellerOffers";
import type { MarketplaceProduct } from "@/types/product";

function plural(unit: string, count: number) {
  const base = unit.toLowerCase();
  if (count === 1) return base;
  return base.endsWith("s") ? base : `${base}s`;
}

export function SellerProfileView({
  seller,
  onSelect,
  actionLabel = "View listing",
}: {
  seller: SellerOffer;
  onSelect: (product: MarketplaceProduct) => void;
  actionLabel?: string;
}) {
  const role = roleLabel(seller.role);
  const isBuy = actionLabel.toLowerCase() === "buy";

  return (
    <div className="overflow-hidden rounded-2xl border border-soko-line bg-soko-slate">
      <div className="relative border-b border-soko-line bg-white px-5 py-5 text-soko-ink sm:px-7">
        <div className="flex items-start gap-4">
          <UserAvatar
            name={seller.name}
            avatarUrl={seller.avatarUrl}
            size="lg"
          />
          <div className="min-w-0">
            <span className="flex items-center gap-1.5 text-[0.625rem] font-extrabold tracking-[0.12em] text-soko-muted uppercase">
              {role}
              {seller.verificationStatus === "VERIFIED" ? (
                <VerifiedBadge size={16} />
              ) : null}
            </span>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
              {seller.name}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-soko-muted">
              <Icon name="pin" size={14} />
              {seller.location}
            </p>
            {seller.bio ? (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-soko-muted">
                {seller.bio}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-lg">
          <div className="rounded-lg bg-soko-slate px-3 py-2">
            <small className="block text-[0.5rem] font-extrabold tracking-wider text-soko-muted uppercase">
              Trays
            </small>
            <strong className="mt-0.5 block text-sm">
              {seller.trayQuantity.toLocaleString("en-RW")}
            </strong>
          </div>
          <div className="rounded-lg bg-soko-slate px-3 py-2">
            <small className="block text-[0.5rem] font-extrabold tracking-wider text-soko-muted uppercase">
              Eggs
            </small>
            <strong className="mt-0.5 block text-sm">
              {seller.eggQuantity.toLocaleString("en-RW")}
            </strong>
          </div>
          <div className="rounded-lg bg-soko-slate px-3 py-2">
            <small className="block text-[0.5rem] font-extrabold tracking-wider text-soko-muted uppercase">
              Avg. tray
            </small>
            <strong className="mt-0.5 block text-sm">
              {seller.averageTrayPrice
                ? `RWF ${seller.averageTrayPrice.toLocaleString("en-RW")}`
                : "—"}
            </strong>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-6">
        <p className="mb-3 text-xs font-bold tracking-wide text-soko-muted uppercase">
          {seller.listingCount} listing{seller.listingCount === 1 ? "" : "s"}
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {seller.products.map((product) => {
            const unit = product.unit.toLowerCase();
            const price = Number(product.price) || 0;
            const location = formatRwandaLocation(product.location);
            return (
              <article
                key={product.id}
                className="flex h-full flex-col overflow-hidden rounded-1.75 border border-soko-line bg-white"
              >
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
                        {[
                          product.category?.name ?? "Uncategorized",
                          product.grade,
                          product.size,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#dcfce7] px-2 py-0.75 text-[0.5rem] font-bold tracking-wide text-[#16a34a] uppercase">
                      {product.sellMode === "LOT" ? "Whole lot" : "By unit"}
                    </span>
                  </div>

                  <p className="m-0 mb-1 font-display text-[1.0625rem] font-bold sm:text-[1.125rem]">
                    {price > 0 ? (
                      <>
                        {price.toLocaleString("en-RW")}{" "}
                        <span className="text-[0.75rem] font-semibold text-soko-muted">
                          RWF / {unit}
                        </span>
                      </>
                    ) : (
                      "Ask seller"
                    )}
                  </p>
                  <p className="m-0 mb-1 text-[0.625rem] text-soko-ink sm:text-[0.6875rem]">
                    {product.sellMode === "LOT"
                      ? `Lot of ${product.availableQuantity.toLocaleString("en-RW")} ${plural(unit, product.availableQuantity)}`
                      : `${product.availableQuantity.toLocaleString("en-RW")} ${plural(unit, product.availableQuantity)} available`}
                    {(product.minQuantity ?? 1) > 1
                      ? ` · min ${product.minQuantity}`
                      : ""}
                  </p>
                  <p className="m-0 mb-3 line-clamp-2 flex items-start gap-1 text-[0.5625rem] text-soko-muted sm:text-[0.625rem]">
                    <Icon name="pin" size={13} className="mt-0.5 shrink-0" />
                    <span>{location}</span>
                  </p>
                  <div className="mt-auto">
                    {isBuy ? (
                      <ActionButton
                        variant="buy"
                        size="sm"
                        fullWidth
                        onClick={() => onSelect(product)}
                      >
                        {actionLabel}
                      </ActionButton>
                    ) : (
                      <button
                        type="button"
                        className={`${btn.outline} w-full justify-center py-2 text-xs`}
                        onClick={() => onSelect(product)}
                      >
                        {actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
