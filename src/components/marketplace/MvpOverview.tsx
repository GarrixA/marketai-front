"use client";

import { Icon } from "@/lib/ui";
import { formatRwf } from "@/lib/marketplaceStore";
import { Panel } from "@/components/marketplace/uiBits";
import { SupplyOverviewChart } from "@/components/marketplace/SupplyOverviewChart";
import type { DashboardRole } from "@/lib/session";
import { getSession } from "@/lib/session";
import { useListAvailableProductsQuery } from "@/store/actions/products";
import {
  liveDealListOptions,
  useListAllDealsQuery,
  useListIncomingDealsQuery,
  useListMyDealsQuery,
} from "@/store/actions/deals";
import type { ApiDeal } from "@/types/deal";

function confirmedValue(deal: ApiDeal) {
  if (deal.status !== "CONFIRMED") return 0;
  const qty = deal.confirmedQty ?? deal.quantity;
  const price = deal.offerPrice ?? deal.targetPrice;
  return qty * price;
}

export function MvpOverview({ role }: { role: DashboardRole }) {
  const session = getSession();
  const { data: products = [], isLoading: productsLoading } =
    useListAvailableProductsQuery();

  const isAdmin = role === "admin";
  const canBuy = role === "buyer" || role === "aggregator";
  const canSell = role === "supplier" || role === "aggregator";

  const { data: allDeals = [], isLoading: allDealsLoading } =
    useListAllDealsQuery(undefined, {
      ...liveDealListOptions,
      skip: !isAdmin,
    });
  const { data: myDeals = [], isLoading: myDealsLoading } = useListMyDealsQuery(
    undefined,
    { ...liveDealListOptions, skip: isAdmin || !canBuy }
  );
  const { data: incomingDeals = [], isLoading: incomingLoading } =
    useListIncomingDealsQuery(undefined, {
      ...liveDealListOptions,
      skip: isAdmin || !canSell,
    });

  const deals: ApiDeal[] = isAdmin ? allDeals : [...myDeals, ...incomingDeals];
  const dealsLoading = isAdmin
    ? allDealsLoading
    : (canBuy && myDealsLoading) || (canSell && incomingLoading);

  const liveProducts = products.filter(
    (p) => p.isAvailable && p.availableQuantity > 0
  );
  const marketTrays = liveProducts.reduce(
    (sum, p) => sum + (p.availableQuantity || 0),
    0
  );
  const avgPrice =
    liveProducts.length === 0
      ? 0
      : Math.round(
          liveProducts.reduce((s, p) => s + Number(p.price || 0), 0) /
            liveProducts.length
        );
  const supplierListings = liveProducts.filter(
    (p) => p.owner?.role === "supplier"
  );
  const aggregatorListings = liveProducts.filter(
    (p) => p.owner?.role === "aggregator"
  );
  const myDbStock = liveProducts.filter(
    (p) => p.ownerId && session?.userId && p.ownerId === session.userId
  );
  const myDbTrays = myDbStock.reduce(
    (sum, p) => sum + (p.availableQuantity || 0),
    0
  );

  const activeDeals = deals.filter((d) => d.status !== "REJECTED");
  const confirmedDeals = deals.filter((d) => d.status === "CONFIRMED");
  const confirmedTotal = confirmedDeals.reduce(
    (sum, deal) => sum + confirmedValue(deal),
    0
  );
  const requestedDeals = deals.filter((d) => d.status === "REQUESTED");

  const dash = (value: string, loading = productsLoading) =>
    loading ? "…" : value;

  const metrics =
    role === "buyer"
      ? [
          [
            "Products live",
            dash(String(liveProducts.length)),
            "Suppliers + aggregators",
          ],
          [
            "My requests",
            dash(String(myDeals.length), dealsLoading),
            "Open and in progress",
          ],
          [
            "Confirmed",
            dash(
              String(myDeals.filter((d) => d.status === "CONFIRMED").length),
              dealsLoading
            ),
            "Quantity agreed",
          ],
          [
            "Committed",
            dash(
              formatRwf(myDeals.reduce((s, d) => s + confirmedValue(d), 0)),
              dealsLoading
            ),
            "Confirmed deal value",
          ],
        ]
      : role === "logistics"
        ? [
            ["Listings", dash(String(liveProducts.length)), "Active products"],
            [
              "Supplier lots",
              dash(String(supplierListings.length)),
              "On the market",
            ],
            [
              "Aggregator lots",
              dash(String(aggregatorListings.length)),
              "On the market",
            ],
            [
              "Market quantity",
              dash(marketTrays.toLocaleString("en-RW")),
              "Available now",
            ],
          ]
        : role === "admin"
          ? [
              [
                "Listings",
                dash(String(liveProducts.length)),
                "Active products",
              ],
              [
                "Supply quantity",
                dash(marketTrays.toLocaleString("en-RW")),
                "Across listings",
              ],
              ["Avg list price", dash(formatRwf(avgPrice)), "Live catalog"],
              [
                "Confirmed value",
                dash(formatRwf(confirmedTotal), dealsLoading),
                "Agreed deals",
              ],
            ]
          : role === "aggregator"
            ? [
                [
                  "My stock",
                  dash(myDbTrays.toLocaleString("en-RW")),
                  `${myDbStock.length} lots`,
                ],
                [
                  "Buy requests",
                  dash(
                    String(
                      myDeals.filter((d) => d.status !== "REJECTED").length
                    ),
                    dealsLoading
                  ),
                  "Sourcing deals",
                ],
                [
                  "Sell notices",
                  dash(
                    String(
                      incomingDeals.filter((d) => d.status === "REQUESTED")
                        .length
                    ),
                    dealsLoading
                  ),
                  "Need confirmation",
                ],
                [
                  "Market to buy",
                  dash(
                    String(
                      liveProducts.filter((p) => p.ownerId !== session?.userId)
                        .length
                    )
                  ),
                  "Available listings",
                ],
              ]
            : [
                [
                  "My stock",
                  dash(myDbTrays.toLocaleString("en-RW")),
                  `${myDbStock.length} lots`,
                ],
                [
                  "Open requests",
                  dash(String(requestedDeals.length), dealsLoading),
                  "Need confirmation",
                ],
                [
                  "Confirmed",
                  dash(String(confirmedDeals.length), dealsLoading),
                  "Quantity agreed",
                ],
                ["Avg list price", dash(formatRwf(avgPrice)), "Marketplace"],
              ];

  const analyticsRows = [
    ["Total products", dash(String(liveProducts.length))],
    ["Supplier listings", dash(String(supplierListings.length))],
    ["Aggregator listings", dash(String(aggregatorListings.length))],
    ["Quantity available", dash(marketTrays.toLocaleString("en-RW"))],
    ["Average price", dash(formatRwf(avgPrice))],
    ["Active deals", dash(String(activeDeals.length), dealsLoading)],
    ["Confirmed deals", dash(String(confirmedDeals.length), dealsLoading)],
    ["Confirmed value", dash(formatRwf(confirmedTotal), dealsLoading)],
  ];

  return (
    <div className="space-y-4.25">
      <div className="grid grid-cols-4 gap-3.25 max-md:grid-cols-2 max-sm:grid-cols-1">
        {metrics.map((m, i) => (
          <div
            key={m[0]}
            className="relative rounded-1.75 border border-soko-line bg-white p-4.5"
          >
            <span className="absolute top-4 right-4 rounded-1.25 bg-soko-slate p-1.75 text-soko-navy">
              <Icon name={["box", "card", "truck", "chart"][i]} />
            </span>
            <small className="block text-[0.625rem] text-soko-muted">
              {m[0]}
            </small>
            <strong className="my-2 block font-display text-[1.4375rem] font-bold">
              {m[1]}
            </strong>
            <p className="m-0 text-[0.5625rem] text-soko-green-2">{m[2]}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1.7fr_0.9fr] gap-4.25 max-md:grid-cols-1">
        <Panel
          title="This year"
          subtitle="Listings and deals opened each month, from live records."
        >
          <SupplyOverviewChart
            loading={productsLoading || dealsLoading}
            series={[
              {
                name: "Listings",
                dates: products.map((product) => product.createdAt),
              },
              ...(role === "logistics"
                ? []
                : [
                    {
                      name: "Deals",
                      dates: deals.map((deal) => deal.createdAt),
                    },
                  ]),
            ]}
          />
        </Panel>

        <Panel
          title="Marketplace analytics"
          subtitle="Live figures from the product catalog and deals."
        >
          <div className="grid grid-cols-1 gap-x-6 gap-y-0">
            {analyticsRows.map(([label, value]) => (
              <p
                key={label}
                className="m-0 flex items-center justify-between border-b border-soko-line py-2.5 text-[0.6875rem] last:border-b-0"
              >
                <span className="text-soko-muted">{label}</span>
                <strong>{value}</strong>
              </p>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
