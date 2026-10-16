"use client";

import { EmptyState, Panel } from "@/components/marketplace/uiBits";
import { useListSupportTicketsQuery } from "@/store/actions/support";
import { SUPPORT_CATEGORY_OPTIONS } from "@/types/support";

function categoryLabel(value: string) {
  return (
    SUPPORT_CATEGORY_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}

export function SupportTicketsPanel() {
  const { data: tickets = [], isLoading } = useListSupportTicketsQuery();

  return (
    <Panel
      title="Support tickets"
      subtitle="Requests submitted by buyers and sellers."
    >
      {isLoading ? (
        <p className="m-0 text-sm text-soko-muted">Loading tickets…</p>
      ) : tickets.length === 0 ? (
        <EmptyState message="No support tickets yet." />
      ) : (
        <div className="flex flex-col gap-3">
          {tickets.map((ticket) => (
            <article
              key={ticket.id}
              className="rounded-1.25 border border-soko-line px-3.5 py-3.5"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <strong className="block text-[0.8125rem]">
                    {ticket.ticketNumber} · {ticket.subject}
                  </strong>
                  <small className="text-[0.5625rem] text-soko-muted">
                    {ticket.userName} · {ticket.userEmail}
                    {ticket.userPhone ? ` · ${ticket.userPhone}` : ""}
                  </small>
                </div>
                <span className="shrink-0 rounded-full bg-soko-slate px-2 py-0.75 text-[0.5rem] font-bold tracking-wide text-soko-navy uppercase">
                  {ticket.status.replaceAll("_", " ")}
                </span>
              </div>
              <p className="m-0 text-[0.6875rem] text-soko-muted">
                {categoryLabel(ticket.category)}
              </p>
              <p className="m-0 mt-2 text-[0.75rem] text-soko-ink">
                {ticket.message}
              </p>
              {ticket.context &&
              typeof ticket.context === "object" &&
              "summary" in ticket.context ? (
                <p className="m-0 mt-2 rounded bg-soko-slate px-2.5 py-2 text-[0.6875rem] text-soko-muted">
                  {String(
                    (ticket.context as { summary?: unknown }).summary ?? ""
                  )}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}
