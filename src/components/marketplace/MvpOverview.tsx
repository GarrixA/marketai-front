"use client";

import { Icon, btn } from "@/lib/ui";
import { formatRwf, resetMarketplace } from "@/lib/marketplaceStore";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import { Panel, StatusBadge } from "@/components/marketplace/uiBits";
import type { DashboardRole } from "@/lib/session";
import { getSession } from "@/lib/session";

const loopSteps = [
  "Discover",
  "Request",
  "Confirm",
  "Pay",
  "Transport",
  "Quote",
] as const;

export function MvpOverview({
  role,
  onGo,
}: {
  role: DashboardRole;
  onGo: (section: string) => void;
}) {
  const { deals, inventory } = useMarketplace();
  const session = getSession();
  const email = session?.email ?? "";

  const myBuy = deals.filter((d) => d.buyerEmail === email);
  const mySupply = deals.filter((d) => d.supplierEmail === email);
  const openRequests = deals.filter((d) => d.status === "requested");
  const paidDeals = deals.filter((d) =>
    ["paid", "transport_open", "transport_quoted", "transport_accepted"].includes(
      d.status
    )
  );
  const paidNotices = mySupply.filter((d) =>
    ["paid", "transport_open", "transport_quoted"].includes(d.status)
  );
  const transportOpen = deals.filter(
    (d) => d.status === "transport_open" || d.status === "transport_quoted"
  );
  const myStock = inventory.filter((i) => i.ownerEmail === email);
  const stockTrays = myStock.reduce((sum, i) => sum + i.quantity, 0);
  const marketTrays = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const avgPrice =
    inventory.length === 0
      ? 0
      : Math.round(
          inventory.reduce((s, i) => s + i.pricePerUnit, 0) / inventory.length
        );
  const gmv = paidDeals.reduce((s, d) => s + (d.paidAmount ?? 0), 0);
  const supplierListings = inventory.filter((i) => i.ownerRole === "supplier");
  const aggregatorListings = inventory.filter(
    (i) => i.ownerRole === "aggregator"
  );

  const metrics =
    role === "buyer"
      ? [
          ["Products live", String(inventory.length), "Suppliers + aggregators"],
          ["My requests", String(myBuy.length), "Open and in progress"],
          [
            "Ready to pay",
            String(myBuy.filter((d) => d.status === "confirmed").length),
            "Quantity confirmed",
          ],
          ["Spent", formatRwf(myBuy.reduce((s, d) => s + (d.paidAmount ?? 0), 0)), "Paid deals"],
        ]
      : role === "logistics"
        ? [
            ["Open jobs", String(transportOpen.length), "Need a quote"],
            [
              "My quotes",
              String(
                deals.filter((d) =>
                  d.transportQuotes.some((q) => q.logisticsEmail === email)
                ).length
              ),
              "Submitted",
            ],
            [
              "Booked",
              String(
                deals.filter(
                  (d) =>
                    d.status === "transport_accepted" &&
                    d.acceptedQuoteId === email
                ).length
              ),
              "Accepted by supplier",
            ],
            ["Market trays", marketTrays.toLocaleString(), "Moving through Soko"],
          ]
        : role === "admin"
          ? [
              ["Listings", String(inventory.length), "Active products"],
              ["Supply trays", marketTrays.toLocaleString(), "Across Rwanda"],
              ["Avg tray price", formatRwf(avgPrice), "All grades"],
              ["GMV paid", formatRwf(gmv), "Completed payments"],
            ]
          : role === "aggregator"
            ? [
                ["My stock", stockTrays.toLocaleString(), `${myStock.length} lots`],
                [
                  "Buy-side open",
                  String(myBuy.filter((d) => d.status !== "transport_accepted").length),
                  "Sourcing deals",
                ],
                ["Sell notices", String(paidNotices.length), "Payment received"],
                [
                  "Market to buy",
                  String(inventory.filter((i) => i.ownerEmail !== email).length),
                  "Available listings",
                ],
              ]
            : [
                ["My stock", stockTrays.toLocaleString(), `${myStock.length} lots`],
                ["Open requests", String(openRequests.length), "Need confirmation"],
                ["Payment notices", String(paidNotices.length), "Ready for transport"],
                ["Avg list price", formatRwf(avgPrice), "Marketplace"],
              ];

  const analyticsRows = [
    ["Total products", String(inventory.length)],
    ["Supplier listings", String(supplierListings.length)],
    ["Aggregator listings", String(aggregatorListings.length)],
    ["Total trays available", marketTrays.toLocaleString()],
    ["Average price / tray", formatRwf(avgPrice)],
    ["Active deals", String(deals.length)],
    ["Paid transactions", String(paidDeals.length)],
    ["Gross paid value", formatRwf(gmv)],
  ];

  const shortcuts =
    role === "buyer"
      ? [
          ["Products", "Buy from suppliers and aggregators"],
          ["Buy Requests", "Publish custom RFQs"],
          ["Deals", "Pay confirmed quantities"],
        ]
      : role === "aggregator"
        ? [
            ["Products", "Toggle Buy / Sell market view"],
            ["Buy Requests", "Source stock from farms"],
            ["Deals", "Confirm, collect payment, book transport"],
          ]
        : role === "supplier"
          ? [
              ["Products", "Manage your sell listings"],
              ["Buy Requests", "Confirm available quantity"],
              ["Deals", "Payment notices & transport"],
            ]
          : role === "logistics"
            ? [["Transport", "Accept notices and send your fee"]]
            : [
                ["Products", "Browse all listings"],
                ["Deals", "Monitor marketplace bargains"],
              ];

  return (
    <div className="space-y-4.25">
      <div className="grid grid-cols-4 gap-3.25 max-md:grid-cols-2 max-sm:grid-cols-1">
        {metrics.map((m, i) => (
          <div
            key={m[0]}
            className="relative rounded-1.75 border border-[#ddded9] bg-white p-4.5"
          >
            <span className="absolute top-4 right-4 rounded-1.25 bg-[#eef1f4] p-1.75 text-soko-green">
              <Icon name={["box", "card", "truck", "chart"][i]} />
            </span>
            <small className="block text-[0.625rem] text-soko-muted">{m[0]}</small>
            <strong className="my-2 block font-display text-[1.4375rem] font-bold">
              {m[1]}
            </strong>
            <p className="m-0 text-[0.5625rem] text-soko-green-2">{m[2]}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1.35fr_1fr] gap-4.25 max-md:grid-cols-1">
        <Panel
          title="Marketplace analytics"
          subtitle="Supply, listings, and transaction health."
          action={
            <button
              type="button"
              className={`${btn.outline} text-[0.6875rem]`}
              onClick={() => resetMarketplace()}
            >
              Reset demo data
            </button>
          }
        >
          <div className="grid grid-cols-2 gap-x-6 gap-y-0 max-sm:grid-cols-1">
            {analyticsRows.map(([label, value]) => (
              <p
                key={label}
                className="m-0 flex items-center justify-between border-b border-[#ecebe6] py-2.5 text-[0.6875rem]"
              >
                <span className="text-soko-muted">{label}</span>
                <strong>{value}</strong>
              </p>
            ))}
          </div>
          <div className="mt-4">
            <p className="mb-2 text-[0.5625rem] font-bold tracking-wide text-soko-muted uppercase">
              Supply mix
            </p>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-[#e8ebe6]">
              <span
                className="bg-soko-green"
                style={{
                  width: `${
                    inventory.length
                      ? (supplierListings.length / inventory.length) * 100
                      : 0
                  }%`,
                }}
              />
              <span
                className="bg-[#c4a574]"
                style={{
                  width: `${
                    inventory.length
                      ? (aggregatorListings.length / inventory.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <div className="mt-2 flex gap-4 text-[0.5625rem] text-soko-muted">
              <span>
                <i className="mr-1 inline-block h-2 w-2 rounded-sm bg-soko-green" />
                Suppliers {supplierListings.length}
              </span>
              <span>
                <i className="mr-1 inline-block h-2 w-2 rounded-sm bg-[#c4a574]" />
                Aggregators {aggregatorListings.length}
              </span>
            </div>
          </div>
        </Panel>

        <div className="space-y-4.25">
          <Panel
            title="MVP loop"
            subtitle="Discover → order → pay → deliver."
          >
            <div className="flex flex-wrap gap-2">
              {loopSteps.map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="rounded-full bg-[#eef1f4] px-2.5 py-1 text-[0.5625rem] font-bold text-soko-green">
                    {i + 1}. {step}
                  </span>
                  {i < loopSteps.length - 1 ? (
                    <Icon name="arrow" size={12} className="text-soko-muted" />
                  ) : null}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Go to workspace" subtitle="Jump into the flows you need.">
            <div className="grid gap-2">
              {shortcuts.map(([section, hint]) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => onGo(section)}
                  className="flex items-center justify-between rounded-1.25 border border-[#e5e4df] bg-[#fbfaf7] px-3.5 py-3 text-left hover:border-soko-green"
                >
                  <span>
                    <strong className="block text-[0.8125rem]">{section}</strong>
                    <small className="text-[0.5625rem] text-soko-muted">
                      {hint}
                    </small>
                  </span>
                  <Icon name="chevron" />
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Panel title="Live deals" subtitle="Shared across demo accounts.">
        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
          {deals.slice(0, 4).map((deal) => (
            <div
              key={deal.id}
              className="flex items-start justify-between gap-2 rounded-1.25 border border-[#e5e4df] px-3.5 py-3"
            >
              <div>
                <strong className="block text-[0.6875rem]">{deal.product}</strong>
                <small className="text-[0.5rem] text-soko-muted">
                  {deal.buyerBusiness} · {deal.quantity} trays
                </small>
              </div>
              <StatusBadge status={deal.status} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
