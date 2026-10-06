"use client";

import { Icon } from "@/components/Icon";
import { btn } from "@/lib/ui";
import type { ProductListing } from "@/lib/listings";

type ProductCardProps = {
  item: ProductListing;
  onView?: () => void;
  actionLabel?: string;
  className?: string;
};

export function ProductCard({
  item,
  onView,
  actionLabel = "View listing",
  className = "",
}: ProductCardProps) {
  return (
    <article
      className={`flex flex-col rounded-lg border border-[#e0ded7] bg-white p-4.75 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_13px_30px_rgba(31,51,42,0.1)] ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-[#eef1f4] px-2.25 py-1.5 text-[0.5625rem] font-extrabold tracking-wide text-soko-green uppercase">
            {item.category ?? "Fresh supply"}
          </span>
          <span className="rounded bg-[#f5f5f0] px-2.25 py-1.5 text-[0.5625rem] font-extrabold text-soko-muted">
            Delivery available
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs text-soko-ink">
          <Icon
            name="star"
            size={14}
            className="fill-[#e3a13e] stroke-[#e3a13e]"
          />
          {item.rating}
        </span>
      </div>

      <h3 className="mt-3.5 font-display text-lg font-bold">{item.name}</h3>

      <p className="mt-2 flex items-center gap-1.5 text-[0.8125rem]">
        <span className="inline-grid h-4.25 w-4.25 place-items-center rounded-full bg-soko-green text-white">
          <Icon name="check" size={12} />
        </span>
        {item.supplier}
      </p>

      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-soko-muted">
        <Icon name="pin" size={14} />
        {item.location} · {item.qty} available
      </p>

      <div className="mt-auto flex items-end justify-between border-t border-[#e7e5df] pt-3.5 mt-3.5">
        <div>
          <strong className="font-display text-[1.0625rem] font-extrabold">
            RWF {item.price}
          </strong>
          <span className="text-[0.6875rem] text-soko-muted"> per unit</span>
        </div>
        <small className="text-[0.6875rem] text-soko-muted">Min. {item.min}</small>
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
    </article>
  );
}
