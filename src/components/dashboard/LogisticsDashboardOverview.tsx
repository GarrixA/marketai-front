"use client";

import { Icon, btn } from "@/lib/ui";

export function LogisticsDashboardOverview() {
  return (
    <div className="grid grid-cols-[1.9fr_0.85fr] gap-4.25 max-md:grid-cols-1">
      <section className="rounded-1.75 border border-[#ddded9] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="m-0 mb-0.5 font-display text-[0.9375rem] font-bold">
              Available delivery jobs
            </h2>
            <p className="m-0 text-[0.625rem] text-soko-muted">
              Matched to your route and vehicle capacity.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 border-0 bg-transparent text-[0.625rem] font-bold text-soko-green">
            View all jobs <Icon name="arrow" size={15} />
          </button>
        </div>
        {[
          ["Musanze", "Kigali", "50 crates", "RWF 18,500", "82 km"],
          ["Rwamagana", "Kicukiro", "120 bags", "RWF 24,000", "61 km"],
        ].map((job) => (
          <div
            className="grid grid-cols-[auto_1fr_auto_1fr_1fr_1fr_1fr_auto] items-center gap-3.5 border-t border-[#e5e4df] px-0.5 py-4.25 max-md:grid-cols-[auto_1fr_auto_1fr] max-md:[&>b]:hidden max-md:[&>div:nth-of-type(n+3)]:hidden"
            key={job[0]}
          >
            <span className="rounded-1.25 bg-[#e8ecf0] p-2 text-soko-green">
              <Icon name="truck" />
            </span>
            <div>
              <small className="block text-[0.4375rem] tracking-wide text-soko-muted uppercase">
                PICKUP
              </small>
              <strong className="mt-0.5 block text-[0.6875rem]">{job[0]}</strong>
            </div>
            <Icon name="arrow" />
            <div>
              <small className="block text-[0.4375rem] tracking-wide text-soko-muted uppercase">
                DESTINATION
              </small>
              <strong className="mt-0.5 block text-[0.6875rem]">{job[1]}</strong>
            </div>
            <div>
              <small className="block text-[0.4375rem] tracking-wide text-soko-muted uppercase">
                LOAD
              </small>
              <strong className="mt-0.5 block text-[0.6875rem]">{job[2]}</strong>
            </div>
            <div>
              <small className="block text-[0.4375rem] tracking-wide text-soko-muted uppercase">
                DISTANCE
              </small>
              <strong className="mt-0.5 block text-[0.6875rem]">{job[4]}</strong>
            </div>
            <b className="text-[0.6875rem]">{job[3]}</b>
            <button className={btn.primaryCompact}>Accept job</button>
          </div>
        ))}
      </section>
      <section className="rounded-1.75 border border-[#ddded9] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="m-0 mb-0.5 font-display text-[0.9375rem] font-bold">
              Active delivery
            </h2>
            <p className="m-0 text-[0.625rem] text-soko-muted">#DLV-0289</p>
          </div>
          <span className="inline-flex! rounded-xl px-2 py-1 text-[0.5625rem]! font-bold text-[#3a5166] bg-[#e8edf3]">
            On time
          </span>
        </div>
        <div className="flex items-center justify-between bg-[#edf1ea] p-4.5 text-[0.625rem] font-bold">
          <span>Musanze</span>
          <div className="mx-2 flex flex-1 items-center">
            <i className="h-1.75 w-1.75 rounded-full bg-soko-green" />
            <hr className="flex-1 border-0 border-t border-dashed border-soko-green" />
            <i className="h-1.75 w-1.75 rounded-full bg-soko-green" />
          </div>
          <span>Kigali</span>
        </div>
        <div>
          <p className="flex justify-between border-b border-[#e8e7e2] py-2.5 text-[0.625rem]">
            <span className="text-soko-muted">Current status</span>
            <strong>In transit</strong>
          </p>
          <p className="flex justify-between border-b border-[#e8e7e2] py-2.5 text-[0.625rem]">
            <span className="text-soko-muted">Est. arrival</span>
            <strong>14:30 today</strong>
          </p>
          <p className="flex justify-between border-b border-[#e8e7e2] py-2.5 text-[0.625rem]">
            <span className="text-soko-muted">Proof required</span>
            <strong>OTP + photo</strong>
          </p>
        </div>
        <button className={`${btn.primaryFull} mt-4`}>Update status</button>
      </section>
    </div>
  );
}
