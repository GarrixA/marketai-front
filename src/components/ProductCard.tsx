"use client";

import { Icon } from "@/components/Icon";
import type { ProductListing } from "@/lib/listings";
import { productImageSrc } from "@/lib/productImage";
import { btn } from "@/lib/ui";

type ProductCardProps = {
  item: ProductListing;
  onView?: () => void;
  actionLabel?: string;
  className?: string;
};

function unitLabel(unit: string | undefined, count: number) {
  const base = unit ?? "unit";
  if (count === 1) return base;
  return base.endsWith("s") ? base : `${base}s`;
}

export function ProductCard({
  item,
  onView,
  actionLabel = "View listing",
  className = "",
}: ProductCardProps) {
  const unit = item.priceUnit ?? "unit";
  const qtyLabel = `${item.qtyValue.toLocaleString("en-RW")} ${unitLabel(unit, item.qtyValue)}`;
  const image = productImageSrc(item.image);

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-lg border border-soko-line bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_13px_30px_rgba(13,27,42,0.1)] ${className}`}
    >
      <img
        src={image}
        alt={item.name}
        className="h-40 w-full object-cover object-[center_46%]"
      />
      <div className="flex flex-1 flex-col p-4.75">
        <div className="flex items-start justify-between gap-3">
          <p className="flex min-w-0 items-center gap-1.5 text-[0.8125rem]">
            <span className="inline-grid h-4.25 w-4.25 shrink-0 place-items-center rounded-full bg-soko-navy text-white">
              <Icon name="check" size={12} />
            </span>
            <span className="truncate font-medium">{item.supplier}</span>
          </p>
          <span className="shrink-0 rounded bg-soko-slate px-2.25 py-1.5 text-[0.5625rem] font-extrabold text-soko-muted">
            Delivery available
          </span>
        </div>

        <h3 className="mt-3.5 font-display text-lg font-bold">{qtyLabel}</h3>

        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-soko-muted">
          <Icon name="pin" size={14} />
          {item.location}
        </p>

        <div className="mt-auto mt-3.5 flex items-baseline justify-between gap-3 border-t border-soko-line pt-3.5">
          {item.priceValue > 0 ? (
            <strong className="font-display text-[1.0625rem] font-extrabold">
              RWF {item.price}/{unit}
            </strong>
          ) : (
            <strong className="font-display text-[1.0625rem] font-extrabold">
              Ask seller
            </strong>
          )}
          <small className="shrink-0 text-[0.6875rem] text-soko-muted">
            Min. {item.min}
          </small>
        </div>

        {onView && (
          <button
            type="button"
            className={`${btn.outline} mt-3.5 w-full justify-center py-2.5`}
            onClick={onView}
          >
            {actionLabel} <Icon name="arrow" size={16} />
          </button>
        )}
      </div>
    </article>
  );
}
