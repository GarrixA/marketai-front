"use client";

import { formatRwf } from "@/lib/marketplaceStore";
import {
  liveDealListOptions,
  useListLogisticsIncomeQuery,
} from "@/store/actions/deals";
import { EmptyState, Panel } from "@/components/marketplace/uiBits";

export function LogisticsIncome() {
  const { data, isLoading, isError } = useListLogisticsIncomeQuery(
    undefined,
    liveDealListOptions
  );
  const entries = data?.entries ?? [];

  return (
    <div className="space-y-4.25">
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <Summary
          label="Delivery income"
          value={isLoading ? "…" : formatRwf(data?.total ?? 0)}
          hint="Credited when the buyer confirms delivery"
        />
        <Summary
          label="Completed deliveries"
          value={isLoading ? "…" : String(data?.count ?? 0)}
          hint="Fees already released to you"
        />
      </div>

      <Panel
        title="Income"
        subtitle="Each row is the delivery fee from a confirmed drop-off. The platform fee and the seller payout are settled separately."
      >
        {isLoading && entries.length === 0 ? (
          <EmptyState message="Loading income…" />
        ) : isError && entries.length === 0 ? (
          <EmptyState message="Income could not be loaded. Refresh the page to try again." />
        ) : entries.length === 0 ? (
          <EmptyState message="Delivery fees show up here after a buyer confirms they received the goods." />
        ) : (
          <div className="flex flex-col">
            {entries.map((entry) => (
              <article
                key={entry.dealId}
                className="flex flex-wrap items-start justify-between gap-3 border-b border-soko-line py-3.5 last:border-b-0"
              >
                <div className="min-w-0">
                  <strong className="block text-[0.8125rem]">
                    {entry.productName}
                  </strong>
                  <small className="mt-1 block text-[0.6875rem] leading-snug text-soko-muted">
                    {entry.buyerName}
                    <span className="mt-0.5 block">
                      {entry.pickupLocation || "Pickup not set"} →{" "}
                      {entry.deliveryLocation}
                    </span>
                  </small>
                </div>
                <div className="text-right">
                  <b className="block text-[0.875rem]">
                    {formatRwf(entry.amount)}
                  </b>
                  <small className="text-[0.625rem] text-soko-muted">
                    {new Date(entry.paidAt).toLocaleString()}
                  </small>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Summary({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-1.75 border border-soko-line bg-white p-4.5">
      <small className="block text-[0.625rem] text-soko-muted">{label}</small>
      <strong className="my-2 block font-display text-[1.4375rem] font-bold">
        {value}
      </strong>
      <p className="m-0 text-[0.5625rem] text-soko-green-2">{hint}</p>
    </div>
  );
}
