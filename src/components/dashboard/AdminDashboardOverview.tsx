"use client";

import { Icon, btn } from "@/lib/ui";

export function AdminDashboardOverview() {
  return (
    <div className="grid grid-cols-[1.9fr_0.85fr] gap-4.25 max-md:grid-cols-1">
      <section className="rounded-1.75 border border-[#ddded9] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="m-0 mb-0.5 font-display text-[0.9375rem] font-bold">
              Marketplace operations
            </h2>
            <p className="m-0 text-[0.625rem] text-soko-muted">
              Transactions requiring team attention.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 border-0 bg-transparent text-[0.625rem] font-bold text-soko-green">
            Open operations <Icon name="arrow" size={15} />
          </button>
        </div>
        <div className="mb-5.5 grid grid-cols-4 gap-2 max-sm:grid-cols-2">
          {[
            ["12", "Pending verifications", "users"],
            ["4", "Flagged listings", "listings"],
            ["3", "Open disputes", "orders"],
            ["8", "Payment reviews", "payments"],
          ].map((x) => (
            <div key={x[1]} className="bg-[#f4f5f0] p-3.5">
              <strong className="block font-display text-xl font-bold">
                {x[0]}
              </strong>
              <span className="my-1 block text-[0.5625rem]">{x[1]}</span>
              <small className="flex items-center gap-0.5 text-[0.5rem] text-soko-green">
                Review {x[2]} <Icon name="arrow" size={13} />
              </small>
            </div>
          ))}
        </div>
        <div className="border-t border-[#e7e6e0] pt-4.25">
          <div className="flex justify-between">
            <div>
              <strong className="block text-[0.6875rem]">Transaction value</strong>
              <span className="block text-[0.5rem] text-soko-muted">
                Last 7 days
              </span>
            </div>
            <b className="text-[0.9375rem]">
              RWF 24.6M{" "}
              <small className="text-soko-green-2">+18.4%</small>
            </b>
          </div>
          <div className="mt-3.75 flex h-35 items-end gap-3.5">
            {[40, 56, 48, 72, 61, 88, 78].map((n, i) => (
              <div
                key={i}
                className="flex h-full flex-1 flex-col justify-end text-center"
              >
                <i
                  className={`block rounded-t-0.75 ${i === 5 ? "bg-soko-green" : "bg-[#7a8fa3]"}`}
                  style={{ height: `${n}%` }}
                />
                <span className="mt-1 text-[0.4375rem] text-soko-muted">
                  {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="rounded-1.75 border border-[#ddded9] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="m-0 mb-0.5 font-display text-[0.9375rem] font-bold">
              Verification queue
            </h2>
            <p className="m-0 text-[0.625rem] text-soko-muted">12 pending reviews</p>
          </div>
        </div>
        {["Mukamana Farms", "Eastern Grain Hub", "Nyungwe Produce"].map(
          (n, i) => (
            <div
              className="flex items-center gap-2 border-b border-[#ecebe6] py-3.25"
              key={n}
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#e8ecf0] text-[0.5rem] font-extrabold text-soko-green">
                {n.slice(0, 2).toUpperCase()}
              </span>
              <div className="flex-1">
                <strong className="block text-[0.625rem]">{n}</strong>
                <small className="block text-[0.5rem] text-soko-muted">
                  {
                    [
                      "Supplier · Musanze",
                      "Aggregator · Rwamagana",
                      "Supplier · Rusizi",
                    ][i]
                  }
                </small>
              </div>
              <button className="border-0 bg-transparent text-[0.5625rem] font-bold text-soko-green">
                Review
              </button>
            </div>
          )
        )}
        <button className={`${btn.outlineFull} mt-4`}>
          View verification queue
        </button>
      </section>
    </div>
  );
}
