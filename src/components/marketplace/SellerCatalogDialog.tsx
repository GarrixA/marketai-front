"use client";

import { Icon } from "@/components/Icon";
import { UserAvatar } from "@/components/UserAvatar";
import { VerifiedBadge } from "@/components/marketplace/VerifiedBadge";
import { formatRwandaLocation } from "@/components/forms/RwandaLocationFields";
import { productImageSrc } from "@/lib/productImage";
import { roleLabel, type SellerOffer } from "@/lib/sellerOffers";
import { btn } from "@/lib/ui";
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
        <ul className="grid gap-3">
          {seller.products.map((product) => {
            const unit = product.unit.toLowerCase();
            const price = Number(product.price) || 0;
            return (
              <li
                key={product.id}
                className="flex flex-col gap-3 rounded-xl border border-soko-line bg-white p-3 sm:flex-row sm:items-center"
              >
                <img
                  src={productImageSrc(product.imageUrl)}
                  alt=""
                  className="h-20 w-full rounded-lg object-cover object-[center_46%] sm:h-16 sm:w-24 sm:shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm text-soko-ink">
                    {product.name}
                    {product.grade ? ` · ${product.grade}` : ""}
                  </strong>
                  <p className="mt-1 text-xs text-soko-muted">
                    {product.availableQuantity.toLocaleString("en-RW")}{" "}
                    {plural(unit, product.availableQuantity)} available
                    {(product.minQuantity ?? 1) > 1
                      ? ` · min ${product.minQuantity}`
                      : ""}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[0.6875rem] text-soko-muted">
                    <Icon name="pin" size={12} />
                    {formatRwandaLocation(product.location)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <strong className="font-display text-sm font-extrabold text-soko-ink">
                    {price > 0
                      ? `RWF ${price.toLocaleString("en-RW")} / ${unit}`
                      : "Ask seller"}
                  </strong>
                  <button
                    type="button"
                    className={`${btn.outline} py-2 text-xs`}
                    onClick={() => onSelect(product)}
                  >
                    {actionLabel}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
