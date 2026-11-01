"use client";

import useTranslation from "next-translate/useTranslation";
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
  const { t } = useTranslation("dashboard");
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
            [
              t("listings"),
              dash(String(liveProducts.length)),
              t("activeProducts"),
            ],
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
                t("listings"),
                dash(String(liveProducts.length)),
                t("activeProducts"),
              ],
              [
                t("supplyQuantity"),
                dash(marketTrays.toLocaleString("en-RW")),
                t("acrossListings"),
              ],
              [
                t("averageListPrice"),
                dash(formatRwf(avgPrice)),
                t("liveCatalog"),
              ],
              [
                t("confirmedValue"),
                dash(formatRwf(confirmedTotal), dealsLoading),
                t("agreedDeals"),
              ],
            ]
          : role === "aggregator"
            ? [
                [
                  t("myStock"),
                  dash(myDbTrays.toLocaleString("en-RW")),
                  t("lots", { count: myDbStock.length }),
                ],
                [
                  t("buyRequests"),
                  dash(
                    String(
                      myDeals.filter((d) => d.status !== "REJECTED").length
                    ),
                    dealsLoading
                  ),
                  t("sourcingDeals"),
                ],
                [
                  t("sellNotices"),
                  dash(
                    String(
                      incomingDeals.filter((d) => d.status === "REQUESTED")
                        .length
                    ),
                    dealsLoading
                  ),
                  t("needConfirmation"),
                ],
                [
                  t("marketToBuy"),
                  dash(
                    String(
                      liveProducts.filter((p) => p.ownerId !== session?.userId)
                        .length
                    )
                  ),
                  t("availableListings"),
                ],
              ]
            : [
                [
                  t("myStock"),
                  dash(myDbTrays.toLocaleString("en-RW")),
                  t("lots", { count: myDbStock.length }),
                ],
                [
                  "Open requests",
                  dash(String(requestedDeals.length), dealsLoading),
                  t("needConfirmation"),
                ],
                [
                  "Confirmed",
                  dash(String(confirmedDeals.length), dealsLoading),
                  "Quantity agreed",
                ],
                [
                  t("averageListPrice"),
                  dash(formatRwf(avgPrice)),
                  "Marketplace",
                ],
              ];

  const analyticsRows = [
    [t("totalProducts"), dash(String(liveProducts.length))],
    [t("supplierListings"), dash(String(supplierListings.length))],
    [t("aggregatorListings"), dash(String(aggregatorListings.length))],
    [t("quantityAvailable"), dash(marketTrays.toLocaleString("en-RW"))],
    [t("averagePrice"), dash(formatRwf(avgPrice))],
    [t("activeDeals"), dash(String(activeDeals.length), dealsLoading)],
    [t("confirmedDeals"), dash(String(confirmedDeals.length), dealsLoading)],
    [t("confirmedValue"), dash(formatRwf(confirmedTotal), dealsLoading)],
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
        <Panel title={t("thisYear")} subtitle={t("yearlyActivityDescription")}>
          <SupplyOverviewChart
            loading={productsLoading || dealsLoading}
            series={[
              {
                name: t("listingsChartLabel"),
                dates: products.map((product) => product.createdAt),
              },
              ...(role === "logistics"
                ? []
                : [
                    {
                      name: t("dealsChartLabel"),
                      dates: deals.map((deal) => deal.createdAt),
                    },
                  ]),
            ]}
          />
        </Panel>

        <Panel
          title={t("marketplaceAnalytics")}
          subtitle={t("analyticsDescription")}
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
