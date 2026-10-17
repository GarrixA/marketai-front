"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { UserAvatar } from "@/components/UserAvatar";
import { VerifiedBadge } from "@/components/marketplace/VerifiedBadge";
import { roleLabel, sellerPath, type SellerOffer } from "@/lib/sellerOffers";

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg bg-soko-slate px-3 py-2.5">
      <small className="block text-[0.5rem] font-extrabold tracking-[0.08em] text-soko-muted uppercase">
        {label}
      </small>
      <strong className="mt-1 block font-display text-[1.05rem] leading-none font-bold text-soko-ink">
        {value}
      </strong>
      {hint ? (
        <span className="mt-1 block text-[0.625rem] text-soko-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function SellerOfferCard({ seller }: { seller: SellerOffer }) {
  const verified = seller.verificationStatus === "VERIFIED";
  const role = roleLabel(seller.role);

  return (
    <Link
      href={sellerPath(seller)}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-soko-line bg-white text-left shadow-[0_1px_0_rgba(13,27,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(13,27,42,0.1)]"
    >
      <span className="flex flex-1 flex-col p-4.5">
        <span className="flex items-start gap-3">
          <UserAvatar
            name={seller.name}
            avatarUrl={seller.avatarUrl}
            size="lg"
          />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-[0.5625rem] font-extrabold tracking-wide uppercase ${
                  seller.role === "aggregator"
                    ? "bg-[#fff1e6] text-[#c2410c]"
                    : "bg-[#e8f6ee] text-[#166534]"
                }`}
              >
                {role}
              </span>
              {verified ? <VerifiedBadge /> : null}
            </span>
            <strong className="mt-1.5 block truncate font-display text-lg leading-tight font-bold text-soko-ink">
              {seller.name}
            </strong>
            <span className="mt-1 flex items-center gap-1 text-xs text-soko-muted">
              <Icon name="pin" size={13} />
              <span className="truncate">{seller.location}</span>
            </span>
          </span>
        </span>

        {seller.bio ? (
          <span className="mt-3 line-clamp-2 text-[0.8125rem] leading-relaxed text-soko-muted">
            {seller.bio}
          </span>
        ) : (
          <span className="mt-3 text-[0.8125rem] leading-relaxed text-soko-muted">
            {seller.listingCount} live listing
            {seller.listingCount === 1 ? "" : "s"} from this{" "}
            {role.toLowerCase()}.
          </span>
        )}

        {seller.ratingCount > 0 ? (
          <span className="mt-2 inline-flex items-center gap-1 text-xs text-soko-ink">
            <Icon name="star" size={13} />
            {seller.ratingAverage.toFixed(1)}
            <span className="text-soko-muted">
              · {seller.ratingCount} review
              {seller.ratingCount === 1 ? "" : "s"}
            </span>
          </span>
        ) : null}

        <span className="mt-4 grid grid-cols-2 gap-2">
          <Stat
            label="Trays"
            value={seller.trayQuantity.toLocaleString("en-RW")}
            hint="available"
          />
          <Stat
            label="Eggs"
            value={seller.eggQuantity.toLocaleString("en-RW")}
            hint="pieces"
          />
        </span>

        <span className="mt-3 flex items-end justify-between gap-3 border-t border-soko-line pt-3">
          <span>
            <small className="block text-[0.5rem] font-extrabold tracking-[0.08em] text-soko-muted uppercase">
              Avg. tray price
            </small>
            <strong className="mt-0.5 block font-display text-[1.05rem] font-extrabold text-soko-ink">
              {seller.averageTrayPrice
                ? `RWF ${seller.averageTrayPrice.toLocaleString("en-RW")}`
                : "—"}
            </strong>
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-soko-navy group-hover:underline">
            View stock
            <Icon name="arrow" size={14} />
          </span>
        </span>
      </span>
    </Link>
  );
}
