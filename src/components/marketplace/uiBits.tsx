"use client";

import type { ReactNode } from "react";
import type { Deal } from "@/lib/marketplaceTypes";
import { dealStatusLabel } from "@/lib/marketplaceStore";

const tone: Record<Deal["status"], string> = {
  requested: "bg-[#fff4e5] text-soko-cta-hover",
  confirmed: "bg-soko-slate text-soko-navy",
  rejected: "bg-[#fde8e8] text-[#b42318]",
  paid: "bg-soko-slate text-soko-green-2",
  transport_open: "bg-[#fff4e5] text-soko-cta-hover",
  transport_quoted: "bg-soko-slate text-soko-navy",
  transport_accepted: "bg-soko-slate text-soko-green-2",
  packaging_requested: "bg-[#fff4e5] text-soko-cta-hover",
  in_transit: "bg-soko-slate text-soko-navy",
  delivery_pending: "bg-[#fff4e5] text-soko-cta-hover",
  delivered: "bg-soko-slate text-soko-green-2",
};

export function StatusBadge({ status }: { status: Deal["status"] }) {
  return (
    <span
      className={`inline-flex rounded-xl px-2 py-1 text-[0.5625rem] font-bold ${tone[status]}`}
    >
      {dealStatusLabel(status)}
    </span>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-1.75 border border-soko-line bg-white p-5 shadow-[0_1px_2px_rgba(13,27,42,0.04)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="m-0 mb-0.5 font-display text-[1rem] font-bold tracking-tight text-soko-ink">
            {title}
          </h2>
          {subtitle ? (
            <p className="m-0 text-[0.6875rem] leading-snug text-soko-muted">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="m-0 rounded-1.25 bg-soko-slate px-4 py-8 text-center text-xs text-soko-muted">
      {message}
    </p>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-[0.625rem] font-bold">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export const fieldClass =
  "block w-full rounded-1.25 border border-soko-line bg-white p-2.75 text-xs outline-soko-navy";
