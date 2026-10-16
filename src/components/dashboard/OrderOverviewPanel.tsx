"use client";

import { Icon, btn } from "@/lib/ui";

export function OrderOverviewPanel({ supplier }: { supplier: boolean }) {
  return (
    <div className="grid grid-cols-[1.9fr_0.85fr] gap-4.25 max-md:grid-cols-1">
      <section className="rounded-1.75 border border-soko-line bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="m-0 mb-0.5 font-display text-[0.9375rem] font-bold">
              {supplier ? "Orders requiring action" : "Recent orders"}
            </h2>
            <p className="m-0 text-[0.625rem] text-soko-muted">
              {supplier
                ? "Review and confirm new buyer orders."
                : "Track payments, fulfilment, and delivery."}
            </p>
          </div>
          <button className="inline-flex items-center gap-2 border-0 bg-transparent text-[0.625rem] font-bold text-soko-navy">
            View all <Icon name="arrow" size={15} />
          </button>
        </div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[0.6875rem]">
            <thead>
              <tr>
                <th className="border-b border-soko-line px-2.75 py-2.75 text-left text-[0.5rem] tracking-wide text-soko-muted uppercase">
                  ORDER
                </th>
                <th className="border-b border-soko-line px-2.75 py-2.75 text-left text-[0.5rem] tracking-wide text-soko-muted uppercase">
                  {supplier ? "BUYER" : "SUPPLIER"}
                </th>
                <th className="border-b border-soko-line px-2.75 py-2.75 text-left text-[0.5rem] tracking-wide text-soko-muted uppercase">
                  PRODUCT
                </th>
                <th className="border-b border-soko-line px-2.75 py-2.75 text-left text-[0.5rem] tracking-wide text-soko-muted uppercase">
                  AMOUNT
                </th>
                <th className="border-b border-soko-line px-2.75 py-2.75 text-left text-[0.5rem] tracking-wide text-soko-muted uppercase">
                  STATUS
                </th>
                <th className="border-b border-soko-line px-2.75 py-2.75" />
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-soko-line px-2.75 py-3.75">
                  <b className="block">#SOK-10245</b>
                  <small className="mt-0.5 block text-[0.5625rem] text-soko-muted">
                    Today, 09:42
                  </small>
                </td>
                <td className="border-b border-soko-line px-2.75 py-3.75">
                  {supplier ? "Kigali Fresh Foods" : "Musanze Growers"}
                  <small className="mt-0.5 block text-[0.5625rem] text-soko-muted">
                    Verified business
                  </small>
                </td>
                <td className="border-b border-soko-line px-2.75 py-3.75">
                  Fresh eggs · Large
                  <small className="mt-0.5 block text-[0.5625rem] text-soko-muted">
                    50 trays
                  </small>
                </td>
                <td className="border-b border-soko-line px-2.75 py-3.75">
                  <b>RWF 490,000</b>
                </td>
                <td className="border-b border-soko-line px-2.75 py-3.75">
                  <span className="inline-flex! rounded-xl px-2 py-1 text-[0.5625rem]! font-bold text-soko-cta-hover bg-[#fff4e5]">
                    {supplier ? "Review order" : "In transit"}
                  </span>
                </td>
                <td className="border-b border-soko-line px-2.75 py-3.75">
                  <Icon name="chevron" />
                </td>
              </tr>
              <tr>
                <td className="border-b border-soko-line px-2.75 py-3.75">
                  <b className="block">#SOK-10231</b>
                  <small className="mt-0.5 block text-[0.5625rem] text-soko-muted">
                    Yesterday
                  </small>
                </td>
                <td className="border-b border-soko-line px-2.75 py-3.75">
                  {supplier ? "Serena Hotel" : "Huye Harvest"}
                  <small className="mt-0.5 block text-[0.5625rem] text-soko-muted">
                    Verified business
                  </small>
                </td>
                <td className="border-b border-soko-line px-2.75 py-3.75">
                  Fresh eggs · Medium
                  <small className="mt-0.5 block text-[0.5625rem] text-soko-muted">
                    100 trays
                  </small>
                </td>
                <td className="border-b border-soko-line px-2.75 py-3.75">
                  <b>RWF 890,000</b>
                </td>
                <td className="border-b border-soko-line px-2.75 py-3.75">
                  <span className="inline-flex! rounded-xl px-2 py-1 text-[0.5625rem]! font-bold text-soko-green-2 bg-soko-slate">
                    {supplier ? "Preparing" : "Confirmed"}
                  </span>
                </td>
                <td className="border-b border-soko-line px-2.75 py-3.75">
                  <Icon name="chevron" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section className="rounded-1.75 border border-soko-line bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="m-0 mb-0.5 font-display text-[0.9375rem] font-bold">
              Live order
            </h2>
            <p className="m-0 text-[0.625rem] text-soko-muted">#SOK-10245</p>
          </div>
          <span className="inline-flex! rounded-xl px-2 py-1 text-[0.5625rem]! font-bold text-soko-cta-hover bg-[#fff4e5]">
            In transit
          </span>
        </div>
        <div className="my-1 mb-4.25">
          {[
            "Order confirmed",
            "Payment received",
            "Preparing",
            "Dispatched",
            "In transit",
            "Delivered",
            "Confirmed",
            "Rated",
          ].map((s, i) => (
            <div className="relative flex min-h-9.5 gap-2.5" key={s}>
              <span
                className={`z-1 grid h-4.25 w-4.25 place-items-center rounded-full border ${
                  i < 4
                    ? "border-soko-navy bg-soko-navy text-white"
                    : i === 4
                      ? "border-4 border-soko-cta bg-soko-navy"
                      : "border-soko-line bg-white"
                }`}
              >
                {i < 4 ? <Icon name="check" size={13} /> : ""}
              </span>
              {i < 7 && (
                <span
                  className="absolute top-4.25 left-2 h-5.5 w-px bg-soko-line"
                  aria-hidden="true"
                />
              )}
              <p className="m-0">
                <strong className="block text-[0.625rem]">{s}</strong>
                {i === 4 && (
                  <small className="mt-0.5 block text-[0.5rem] text-soko-cta-hover">
                    Estimated 14:30 today
                  </small>
                )}
              </p>
            </div>
          ))}
        </div>
        <button className={btn.outlineFull}>
          Track delivery <Icon name="arrow" size={16} />
        </button>
      </section>
    </div>
  );
}
