"use client";

import type { ReactNode } from "react";
import type { Deal } from "@/lib/marketplaceTypes";
import { dealStatusLabel } from "@/lib/marketplaceStore";

const tone: Record<Deal["status"], string> = {
  requested: "bg-[#fbebd8] text-[#9a5b18]",
  confirmed: "bg-[#e8eef8] text-[#2f4f8a]",
  rejected: "bg-[#fde8e8] text-[#b42318]",
  paid: "bg-[#e8edf3] text-[#3a5166]",
  transport_open: "bg-[#f3ece2] text-[#7a5a2a]",
  transport_quoted: "bg-[#e8eef8] text-[#2f4f8a]",
  transport_accepted: "bg-[#e8edf3] text-[#3a5166]",
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
    <section className="rounded-1.75 border border-[#ddded9] bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 mb-0.5 font-display text-[0.9375rem] font-bold">
            {title}
          </h2>
          {subtitle ? (
            <p className="m-0 text-[0.625rem] text-soko-muted">{subtitle}</p>
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
    <p className="m-0 rounded-1.25 bg-[#f5f5f1] px-4 py-8 text-center text-xs text-soko-muted">
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
  "block w-full rounded-1.25 border border-[#d8d9d3] bg-white p-2.75 text-xs outline-soko-green";
