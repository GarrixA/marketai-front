"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { formatRwf } from "@/lib/marketplaceStore";
import { useListAllDealsQuery } from "@/store/actions/deals";
import type { AdminDeal, ApiDealStatus } from "@/types/deal";

const STATUSES: ApiDealStatus[] = [
  "REQUESTED",
  "CONFIRMED",
  "PAID",
  "TRANSPORT_REQUESTED",
  "TRANSPORT_QUOTED",
  "TRANSPORT_ACCEPTED",
  "PACKAGING_REQUESTED",
  "IN_TRANSIT",
  "DELIVERY_PENDING",
  "DELIVERED",
  "REJECTED",
];

function statusLabel(status: string) {
  switch (status) {
    case "TRANSPORT_REQUESTED":
      return "Transport requested";
    case "TRANSPORT_QUOTED":
      return "Price proposed";
    case "TRANSPORT_ACCEPTED":
      return "Delivery booked";
    case "PACKAGING_REQUESTED":
      return "Confirm packaging";
    case "IN_TRANSIT":
      return "In transit";
    case "DELIVERY_PENDING":
      return "Confirm delivery";
    case "DELIVERED":
      return "Delivered";
    default:
      return status.replaceAll("_", " ");
  }
}

function dealUnits(deal: AdminDeal) {
  return deal.status === "REQUESTED" || deal.status === "REJECTED"
    ? deal.quantity
    : (deal.confirmedQty ?? deal.quantity);
}

function dealValue(deal: AdminDeal) {
  if (deal.payment) return deal.payment.amount;
  if (deal.status === "REJECTED") return 0;
  if (deal.status === "CONFIRMED" || deal.status === "PAID") {
    return dealUnits(deal) * (deal.offerPrice ?? deal.targetPrice);
  }
  return deal.quantity * deal.targetPrice;
}

function statusClass(status: string) {
  if (
    status === "CONFIRMED" ||
    status === "PAID" ||
    status === "TRANSPORT_ACCEPTED"
  ) {
    return "bg-[#e8f5ee] text-[#166534]";
  }
  if (status === "REJECTED") return "bg-[#fde8e8] text-[#b42318]";
  if (status === "TRANSPORT_QUOTED" || status === "TRANSPORT_REQUESTED") {
    return "bg-[#eef2ff] text-[#3730a3]";
  }
  return "bg-[#fff4e5] text-[#c2410c]";
}

function formatWhen(value: string) {
  try {
    return new Date(value).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-[0.5625rem] font-bold tracking-wide uppercase ${statusClass(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "—";
}

function formatDay(value: string | null | undefined) {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3.5">
      <p className="m-0 text-[0.5625rem] font-bold tracking-[0.08em] text-soko-muted uppercase">
        {label}
      </p>
      <p className="m-0 mt-1 font-display text-[0.95rem] font-bold tracking-tight text-soko-ink">
        {value}
      </p>
    </div>
  );
}

function PartyCard({
  role,
  name,
  detail,
  email,
  roles,
  avatarUrl,
}: {
  role: string;
  name: string;
  detail?: string | null;
  email?: string | null;
  roles: string[];
  avatarUrl?: string | null;
}) {
  const showDetail = detail && detail.trim() !== name.trim();
  const photo = resolveMediaUrl(avatarUrl);
  return (
    <div className="rounded-xl border border-soko-line bg-white p-3.5">
      <p className="m-0 text-[0.5625rem] font-bold tracking-[0.08em] text-soko-muted uppercase">
        {role}
      </p>
      <div className="mt-2.5 flex items-center gap-3">
        {photo ? (
          <img
            src={photo}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-soko-slate font-display text-xs font-bold text-soko-navy">
            {initials(name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="m-0 truncate text-sm font-bold text-soko-ink">{name}</p>
          {showDetail ? (
            <p className="m-0 truncate text-[0.6875rem] text-soko-muted">
              {detail}
            </p>
          ) : null}
          <p className="m-0 truncate text-[0.6875rem] text-soko-muted">
            {email || "—"}
          </p>
        </div>
      </div>
      {roles.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {roles.map((item) => (
            <span
              key={item}
              className="rounded-md bg-soko-slate px-2 py-0.5 text-[0.5625rem] font-bold tracking-wide text-soko-navy uppercase"
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DealDetailsDialog({
  deal,
  onClose,
}: {
  deal: AdminDeal;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const title = deal.grade
    ? `${deal.productName} · ${deal.grade}`
    : deal.productName;

  return (
    <div
      className="fixed inset-0 z-130 grid place-items-center overflow-y-auto bg-soko-navy/72 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="deal-details-title"
        className="relative my-auto w-full max-w-160 overflow-hidden rounded-2.5 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative border-b border-soko-line bg-white px-5 py-5 sm:px-6">
          <button
            type="button"
            className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full border border-soko-line bg-white text-soko-muted hover:text-soko-navy"
            onClick={onClose}
            aria-label="Close deal details"
          >
            <Icon name="close" size={16} />
          </button>
          <p className="m-0 text-[0.5625rem] font-bold tracking-[0.12em] text-soko-muted uppercase">
            Deal preview
          </p>
          <h3
            id="deal-details-title"
            className="m-0 mt-1.5 pr-10 font-display text-[1.35rem] leading-tight font-bold tracking-tight text-soko-ink"
          >
            {title}
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill status={deal.status} />
            <span className="text-[0.6875rem] text-soko-muted">
              Needed {formatDay(deal.requiredDate)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 border-b border-soko-line sm:grid-cols-4">
          <Metric
            label="Quantity"
            value={`${dealUnits(deal)} ${deal.unit.toLowerCase()}`}
          />
          <Metric label="Value" value={formatRwf(dealValue(deal))} />
          <Metric label="Target" value={`${formatRwf(deal.targetPrice)}`} />
          <Metric
            label="Offer"
            value={deal.offerPrice != null ? formatRwf(deal.offerPrice) : "—"}
          />
        </div>

        <div className="space-y-4 bg-soko-slate/60 p-4 sm:p-5">
          {deal.transportFee != null ||
          deal.transportOfferedFee != null ||
          deal.status.startsWith("TRANSPORT") ||
          deal.status === "PACKAGING_REQUESTED" ||
          deal.status === "IN_TRANSIT" ||
          deal.status === "DELIVERY_PENDING" ||
          deal.status === "DELIVERED" ? (
            <div className="rounded-xl border border-soko-line bg-white px-4 py-3">
              <p className="m-0 text-[0.5625rem] font-bold tracking-[0.08em] text-soko-muted uppercase">
                Delivery
              </p>
              <p className="m-0 mt-1 text-sm leading-snug text-soko-ink">
                {statusLabel(deal.status)}
                {deal.transportFee != null
                  ? ` · ${formatRwf(deal.transportFee)}`
                  : deal.transportOfferedFee != null
                    ? ` · ${formatRwf(deal.transportOfferedFee)}`
                    : " · price not set"}
                {deal.logisticsName ? ` · ${deal.logisticsName}` : ""}
              </p>
            </div>
          ) : null}

          {deal.sellerPayout != null ? (
            <div className="rounded-xl border border-soko-line bg-white px-4 py-3">
              <p className="m-0 text-[0.5625rem] font-bold tracking-[0.08em] text-soko-muted uppercase">
                Settlement
              </p>
              <p className="m-0 mt-1 text-sm leading-snug text-soko-ink">
                Platform fee {formatRwf(deal.platformFee ?? 0)} · Seller{" "}
                {formatRwf(deal.sellerPayout)} · Deliverer{" "}
                {formatRwf(deal.deliveryPayout ?? 0)}
              </p>
            </div>
          ) : null}

          {deal.payment ? (
            <div className="rounded-xl border border-soko-line bg-white px-4 py-3">
              <p className="m-0 text-[0.5625rem] font-bold tracking-[0.08em] text-soko-muted uppercase">
                Payment
              </p>
              <p className="m-0 mt-1 text-sm leading-snug text-soko-ink">
                {deal.payment.method === "CARD" ? "Card" : "Mobile money"}{" "}
                {deal.payment.account || "—"} · {formatRwf(deal.payment.amount)}{" "}
                · {deal.payment.status.toLowerCase()}
                {deal.payment.releaseStatus === "RELEASED"
                  ? " · released"
                  : " · held until delivery is complete"}
              </p>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <PartyCard
              role="Buyer"
              name={deal.buyerName}
              detail={deal.buyerBusiness}
              email={deal.buyerEmail}
              roles={deal.buyerRoles}
              avatarUrl={deal.buyerAvatarUrl}
            />
            <PartyCard
              role="Supplier"
              name={deal.supplierName || "Unassigned"}
              email={deal.supplierEmail}
              roles={deal.supplierRoles}
              avatarUrl={deal.supplierAvatarUrl}
            />
          </div>

          <div className="rounded-xl border border-soko-line bg-white px-4 py-4">
            <p className="m-0 mb-3 text-[0.5625rem] font-bold tracking-[0.08em] text-soko-muted uppercase">
              Route
            </p>
            <div className="flex gap-3">
              <div className="flex flex-col items-center pt-1" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-soko-navy" />
                <span className="my-1 w-px flex-1 bg-soko-line" />
                <span className="h-2.5 w-2.5 rounded-full border-2 border-soko-navy bg-white" />
              </div>
              <div className="min-w-0 flex-1 space-y-4">
                <div>
                  <p className="m-0 text-[0.5625rem] font-bold tracking-[0.08em] text-soko-muted uppercase">
                    Pickup
                  </p>
                  <p className="m-0 mt-0.5 text-sm leading-snug text-soko-ink">
                    {deal.pickupLocation || "Not set"}
                  </p>
                </div>
                <div>
                  <p className="m-0 text-[0.5625rem] font-bold tracking-[0.08em] text-soko-muted uppercase">
                    Delivery
                  </p>
                  <p className="m-0 mt-0.5 text-sm leading-snug text-soko-ink">
                    {deal.deliveryLocation || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 px-1 text-[0.6875rem] text-soko-muted">
            <span>Opened {formatWhen(deal.createdAt)}</span>
            <span>Updated {formatWhen(deal.updatedAt)}</span>
            {deal.confirmedQty != null ? (
              <span>
                Confirmed {deal.confirmedQty} of {deal.quantity}
              </span>
            ) : null}
          </div>

          {deal.notes ? (
            <div className="rounded-xl border border-soko-line bg-white px-4 py-3">
              <p className="m-0 text-[0.5625rem] font-bold tracking-[0.08em] text-soko-muted uppercase">
                Notes
              </p>
              <p className="m-0 mt-1 text-sm leading-snug text-soko-ink">
                {deal.notes}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AdminDeals() {
  const {
    data: deals = [],
    isLoading,
    isError,
  } = useListAllDealsQuery(undefined, {
    pollingInterval: 8_000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ApiDealStatus | "ALL">("ALL");
  const [openDeal, setOpenDeal] = useState<AdminDeal | null>(null);

  const totals = useMemo(() => {
    const byStatus = Object.fromEntries(
      STATUSES.map((item) => [
        item,
        deals.filter((deal) => deal.status === item),
      ])
    ) as Record<ApiDealStatus, AdminDeal[]>;
    return {
      total: deals.length,
      requested: byStatus.REQUESTED.length,
      confirmed: byStatus.CONFIRMED.length,
      rejected: byStatus.REJECTED.length,
      units: deals.reduce((sum, deal) => sum + dealUnits(deal), 0),
      value: deals.reduce((sum, deal) => sum + dealValue(deal), 0),
    };
  }, [deals]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return deals.filter((deal) => {
      if (status !== "ALL" && deal.status !== status) return false;
      if (!q) return true;
      return [
        deal.productName,
        deal.grade,
        deal.status,
        deal.buyerName,
        deal.buyerBusiness,
        deal.buyerEmail,
        deal.supplierName,
        deal.supplierEmail,
        deal.deliveryLocation,
        deal.pickupLocation,
        ...deal.buyerRoles,
        ...deal.supplierRoles,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [deals, query, status]);

  const cards = [
    ["Total deals", String(totals.total)],
    ["Requested", String(totals.requested)],
    ["Confirmed", String(totals.confirmed)],
    ["Rejected", String(totals.rejected)],
    ["Units", totals.units.toLocaleString("en-RW")],
    ["Open value", formatRwf(totals.value)],
  ];

  return (
    <div className="flex flex-col gap-4">
      <section className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map(([label, value]) => (
          <div
            key={label}
            className="rounded-1.75 border border-soko-line bg-white px-4 py-3.5"
          >
            <p className="m-0 text-[0.5625rem] font-bold tracking-[0.08em] text-soko-muted uppercase">
              {label}
            </p>
            <p className="m-0 mt-1 font-display text-xl font-bold tracking-tight text-soko-ink">
              {isLoading ? "—" : value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-1.75 border border-soko-line bg-white p-5 shadow-[0_1px_2px_rgba(13,27,42,0.04)]">
        <div className="mb-4">
          <h2 className="m-0 mb-0.5 font-display text-[1rem] font-bold tracking-tight text-soko-ink">
            All deals
          </h2>
          <p className="m-0 text-[0.6875rem] text-soko-muted">
            Open a deal to see parties, pricing, and route.
          </p>
        </div>

        {isError ? (
          <p className="m-0 text-xs text-soko-muted">
            Could not load marketplace deals. Refresh and try again.
          </p>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search product, party, or location"
                className="block w-full rounded-1.25 border border-soko-line bg-white px-3 py-2 text-xs outline-soko-navy"
                aria-label="Search deals"
              />
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as ApiDealStatus | "ALL")
                }
                className="rounded-1.25 border border-soko-line bg-white px-3 py-2 text-xs outline-soko-navy sm:w-44"
                aria-label="Filter by status"
              >
                <option value="ALL">All statuses</option>
                {STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {statusLabel(item)}
                  </option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <p className="m-0 text-xs text-soko-muted">Loading deals…</p>
            ) : visible.length === 0 ? (
              <p className="m-0 text-xs text-soko-muted">
                {deals.length === 0
                  ? "No deals in the marketplace yet."
                  : "No deals match this search."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-soko-line text-[0.5625rem] tracking-wide text-soko-muted uppercase">
                      <th className="px-2 py-2.5 font-bold">Opened</th>
                      <th className="px-2 py-2.5 font-bold">Product</th>
                      <th className="px-2 py-2.5 font-bold">Status</th>
                      <th className="px-2 py-2.5 font-bold">Buyer</th>
                      <th className="px-2 py-2.5 font-bold">Supplier</th>
                      <th className="px-2 py-2.5 font-bold">Value</th>
                      <th className="px-2 py-2.5 text-right font-bold">
                        <span className="sr-only">View</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((deal) => (
                      <tr
                        key={deal.id}
                        className="border-b border-soko-line align-middle"
                      >
                        <td className="px-2 py-3 text-[0.625rem] whitespace-nowrap text-soko-muted">
                          {formatWhen(deal.createdAt)}
                        </td>
                        <td className="px-2 py-3 text-[0.6875rem] font-bold text-soko-ink">
                          {deal.productName}
                          {deal.grade ? ` · ${deal.grade}` : ""}
                        </td>
                        <td className="px-2 py-3">
                          <StatusPill status={deal.status} />
                        </td>
                        <td className="px-2 py-3 text-[0.6875rem]">
                          {deal.buyerBusiness || deal.buyerName}
                        </td>
                        <td className="px-2 py-3 text-[0.6875rem]">
                          {deal.supplierName || "—"}
                        </td>
                        <td className="px-2 py-3 text-[0.6875rem] whitespace-nowrap">
                          {formatRwf(dealValue(deal))}
                        </td>
                        <td className="px-2 py-3 text-right">
                          <button
                            type="button"
                            className="inline-grid h-8 w-8 place-items-center rounded-lg border border-soko-line bg-white text-soko-muted transition-colors hover:border-soko-navy hover:text-soko-navy"
                            aria-label={`View ${deal.productName}`}
                            onClick={() => setOpenDeal(deal)}
                          >
                            <Icon name="eye" size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      {openDeal ? (
        <DealDetailsDialog deal={openDeal} onClose={() => setOpenDeal(null)} />
      ) : null}
    </div>
  );
}
