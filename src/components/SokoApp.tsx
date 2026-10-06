"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Icon,
  PublicNav,
  SearchBar,
  SiteFooter,
  btn,
} from "@/lib/ui";
import { LoginModal } from "@/components/LoginModal";
import { ProductCard } from "@/components/ProductCard";
import {
  MarketplaceProvider,
  useMarketplace,
} from "@/components/marketplace/MarketplaceProvider";
import type { MockUser } from "@/lib/mockUsers";
import {
  inventoryToProductListings,
  type ProductListing,
} from "@/lib/listings";
import {
  EMPTY_SEARCH_FILTERS,
  hasActiveSearchFilters,
  searchListings,
  type ListingSearchFilters,
} from "@/lib/searchListings";
import { setSession } from "@/lib/session";

const photos = {
  hero: "/soko-eggs-hero.jpg",
};

const PAGE_SIZE = 6;

const sectionKicker =
  "text-[0.6875rem] font-extrabold tracking-[0.1375rem] text-soko-green-2 uppercase";

function Marketplace({
  onLogin,
  onHome,
}: {
  onLogin: () => void;
  onHome: () => void;
}) {
  const { inventory } = useMarketplace();
  const listings = useMemo(
    () => inventoryToProductListings(inventory),
    [inventory]
  );
  const [detailItem, setDetailItem] = useState<ProductListing | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [filters, setFilters] = useState<ListingSearchFilters>(
    EMPTY_SEARCH_FILTERS
  );

  const filteredListings = useMemo(
    () => searchListings(listings, filters),
    [listings, filters]
  );

  const totalTrays = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const avgPrice =
    inventory.length === 0
      ? 0
      : Math.round(
          inventory.reduce((sum, item) => sum + item.pricePerUnit, 0) /
            inventory.length
        );
  const sellerCount = new Set(inventory.map((item) => item.ownerEmail)).size;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters]);

  const visibleListings = filteredListings.slice(0, visibleCount);
  const hasMore = visibleCount < filteredListings.length;
  const searching = hasActiveSearchFilters(filters);

  return (
    <div>
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      >
        <img
          src={photos.hero}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_46%]"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,27,19,0.91),rgba(16,36,27,0.68)_48%,rgba(10,29,21,0.16)),linear-gradient(transparent_60%,rgba(9,28,20,0.45))]"
        />
      </div>

      <PublicNav onLogin={onLogin} onHome={onHome} />

      <main className="relative">
        <section className="relative z-1 px-0 pt-12 pb-28 text-white max-md:pt-8 max-md:pb-32 max-sm:pt-6 max-sm:pb-28">
          <div className="relative mx-auto flex max-w-310 items-end justify-between gap-8 px-6 max-md:items-start">
            <div className="w-162.5 max-w-full max-md:w-full">
              <span className="flex items-center gap-2 text-[0.6875rem] font-extrabold tracking-[0.1375rem] text-soko-lime">
                <span
                  className="h-px w-6.5 shrink-0 bg-soko-lime"
                  aria-hidden="true"
                />
                <span>Rwanda&apos;s trusted supply marketplace</span>
              </span>
              <h1 className="mt-5 mb-5 font-display text-[3.875rem] leading-[1.12] font-bold tracking-[-0.04em] max-md:text-[3rem] max-sm:text-[2.375rem]">
                Reliable supply.
                <br />
                <em className="text-soko-lime not-italic">Fairer trade.</em>
              </h1>
              <p className="max-w-155 text-lg leading-relaxed text-[#d5dae0] max-sm:text-[0.9375rem]">
                Discover verified suppliers, compare prices, place orders, and
                coordinate delivery—all in one trusted marketplace.
              </p>
              <div className="mt-7.5 flex flex-wrap gap-6 text-xs text-[#c5ccd4]">
                <span className="flex items-center gap-1.5">
                  <Icon
                    name="check"
                    className="rounded-full bg-[#4a5d70] p-0.5"
                  />
                  Verified sellers
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon
                    name="check"
                    className="rounded-full bg-[#4a5d70] p-0.5"
                  />
                  Protected payments
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon
                    name="check"
                    className="rounded-full bg-[#4a5d70] p-0.5"
                  />
                  Tracked delivery
                </span>
              </div>
            </div>
            <div className="w-82.5 shrink-0 rounded-lg border border-white/20 bg-[#0d161cdb] p-5 backdrop-blur-[2.5] max-md:hidden">
              <div className="flex justify-between text-[0.625rem] font-extrabold tracking-[0.10625rem] text-[#aeb6c0] uppercase">
                <span>MARKET PULSE</span>
                <span className="text-[#e8dcc8] normal-case">
                  <i
                    className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#e8dcc8]"
                    aria-hidden="true"
                  />
                  LIVE
                </span>
              </div>
              <div className="border-b border-[#3d4a58] py-5 pb-4.5">
                <strong className="block font-display text-4xl font-bold">
                  {totalTrays.toLocaleString("en-RW")}
                </strong>
                <span className="text-[0.8125rem] text-[#b4bcc6]">
                  trays available today
                </span>
              </div>
              <div className="grid grid-cols-2 py-4.25">
                <div className="border-r border-[#3d4a58]">
                  <small className="block text-[0.5rem] tracking-wide text-[#8a93a0] uppercase">
                    AVG. PRICE
                  </small>
                  <b className="my-1 block text-sm">
                    RWF {avgPrice.toLocaleString("en-RW")}
                  </b>
                  <span className="block text-[0.625rem] text-[#e8dcc8]">
                    Per tray
                  </span>
                </div>
                <div className="pl-4.25">
                  <small className="block text-[0.5rem] tracking-wide text-[#8a93a0] uppercase">
                    ACTIVE SELLERS
                  </small>
                  <b className="my-1 block text-sm">{sellerCount} verified</b>
                  <span className="block text-[0.625rem] text-[#9aa3ad]">
                    Supplier + aggregator
                  </span>
                </div>
              </div>
              <div className="flex justify-between border-t border-[#3d4a58] pt-3.75 text-xs">
                <span className="flex gap-2">
                  <Icon name="truck" size={17} />
                  31 deliveries in transit
                </span>
                <Icon name="chevron" size={16} />
              </div>
            </div>
          </div>
        </section>

        <div className="sticky top-19 z-40">
          <div className="mx-auto max-w-298">
            <SearchBar
              value={filters}
              onChange={setFilters}
              onSearch={setFilters}
            />
          </div>
        </div>

        <div className="relative z-2 bg-soko-page">
          <section
            className="mx-auto max-w-310 px-6 pt-14 pb-22.5 max-md:pt-12 max-sm:pt-10"
            id="marketplace"
          >
            <div className="mb-7.5 flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
              <div>
                <span className={sectionKicker}>AVAILABLE NOW</span>
                <h2 className="my-2 font-display text-4xl leading-tight font-bold tracking-[-0.09375rem]">
                  {searching
                    ? "Matching listings"
                    : "Fresh from verified suppliers"}
                </h2>
                <p className="m-0 text-soko-muted">
                  {searching
                    ? `${filteredListings.length} result${filteredListings.length === 1 ? "" : "s"} ranked by relevance.`
                    : "Live inventory, clear pricing, and suppliers you can trust."}
                </p>
              </div>
              {searching && (
                <button
                  type="button"
                  className={`${btn.text} px-0 text-soko-green`}
                  onClick={() => setFilters(EMPTY_SEARCH_FILTERS)}
                >
                  Clear search
                </button>
              )}
            </div>
            {filteredListings.length === 0 ? (
              <div className="rounded-lg border border-[#dfe1d9] bg-white px-6 py-16 text-center">
                <h3 className="font-display text-xl font-bold">
                  No listings matched
                </h3>
                <p className="mx-auto mt-2 max-w-105 text-sm text-soko-muted">
                  Try a broader product name, another district, or clear one of
                  the filters.
                </p>
                <button
                  type="button"
                  className={`${btn.outline} mt-5`}
                  onClick={() => setFilters(EMPTY_SEARCH_FILTERS)}
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-5 max-md:grid-cols-1">
                  {visibleListings.map((item) => (
                    <ProductCard
                      key={item.id ?? `${item.supplier}-${item.name}-${item.location}`}
                      item={item}
                      onView={() => setDetailItem(item)}
                    />
                  ))}
                </div>
                <div className="mt-8 flex flex-col items-center gap-3 border border-[#dfe1d9] px-5 py-5 text-[0.6875rem] text-[#627067]">
                  <span className="flex items-center gap-1.5">
                    <Icon name="check" />
                    Showing {visibleListings.length} of {filteredListings.length}{" "}
                    verified listings
                  </span>
                  {hasMore && (
                    <button
                      type="button"
                      className={btn.outline}
                      onClick={() =>
                        setVisibleCount((count) =>
                          Math.min(count + PAGE_SIZE, filteredListings.length)
                        )
                      }
                    >
                      Load more <Icon name="arrow" size={16} />
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <SiteFooter onHome={onHome} />

      {detailItem && (
        <ListingDetail
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onOrder={onLogin}
        />
      )}
    </div>
  );
}

function ListingDetail({
  item,
  onClose,
  onOrder,
}: {
  item: ProductListing;
  onClose: () => void;
  onOrder: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-100 grid place-items-center bg-[#08141cb8] p-6 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-152.5 overflow-auto rounded-2.5 bg-white px-10.5 py-13 max-md:max-h-[95vh] max-md:px-6.25 max-md:py-8.75"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute top-4 right-4 z-2 grid h-9 w-9 place-items-center rounded-full border border-[#ddd] bg-white"
          onClick={onClose}
          aria-label="Close listing"
        >
          <Icon name="close" />
        </button>
        <span className={sectionKicker}>VERIFIED SUPPLY</span>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded bg-[#eef1f4] px-2.25 py-1.5 text-[0.5625rem] font-extrabold tracking-wide text-soko-green uppercase">
            {item.category ?? "Fresh supply"}
          </span>
          <span className="rounded bg-[#f5f5f0] px-2.25 py-1.5 text-[0.5625rem] font-extrabold text-soko-muted">
            Quantity verified today
          </span>
        </div>
        <h2 className="my-2 font-display text-[1.875rem] font-bold">
          {item.name}
        </h2>
        <p className="flex items-center gap-2 text-[0.8125rem]">
          <span className="inline-grid h-4.25 w-4.25 place-items-center rounded-full bg-soko-green text-white">
            <Icon name="check" size={12} />
          </span>
          {item.supplier}{" "}
          <span className="ml-auto flex items-center gap-1">
            <Icon
              name="star"
              size={14}
              className="fill-[#e3a13e] stroke-[#e3a13e]"
            />
            {item.rating}
          </span>
        </p>
        <div className="my-5 border-y border-[#e5e3dc] py-5.5">
          <strong className="block font-display text-[1.5625rem] font-extrabold">
            RWF {item.price}
          </strong>
          <span className="block text-xs text-soko-muted">
            per unit · bulk ready
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3.75">
          <div className="bg-[#f5f5f0] p-3.25">
            <small className="block text-[0.5rem] tracking-wide text-soko-muted uppercase">
              AVAILABLE
            </small>
            <strong className="mt-1 block text-xs">{item.qty}</strong>
          </div>
          <div className="bg-[#f5f5f0] p-3.25">
            <small className="block text-[0.5rem] tracking-wide text-soko-muted uppercase">
              MINIMUM ORDER
            </small>
            <strong className="mt-1 block text-xs">{item.min}</strong>
          </div>
          <div className="bg-[#f5f5f0] p-3.25">
            <small className="block text-[0.5rem] tracking-wide text-soko-muted uppercase">
              LOCATION
            </small>
            <strong className="mt-1 block text-xs">{item.location}</strong>
          </div>
          <div className="bg-[#f5f5f0] p-3.25">
            <small className="block text-[0.5rem] tracking-wide text-soko-muted uppercase">
              FULFILMENT
            </small>
            <strong className="mt-1 block text-xs">Delivery or pickup</strong>
          </div>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-soko-muted">
          Quality-checked stock from verified suppliers. Orders placed before
          12:00 can be dispatched the same business day.
        </p>
        <label className="mt-5 block text-[0.6875rem] font-bold">
          Order quantity{" "}
          <div className="mt-1.5 flex">
            <button
              type="button"
              className="h-9.5 w-9.5 border border-[#d8d9d4] bg-white text-center"
            >
              −
            </button>
            <input
              className="h-9.5 w-9.5 border border-[#d8d9d4] bg-white text-center"
              defaultValue="50"
            />
            <button
              type="button"
              className="h-9.5 w-9.5 border border-[#d8d9d4] bg-white text-center"
            >
              +
            </button>
            <span className="ml-2 self-center text-soko-muted">units</span>
          </div>
        </label>
        <div className="flex justify-between py-4.5 text-[0.8125rem]">
          <span>Estimated product total</span>
          <strong>RWF 490,000</strong>
        </div>
        <button
          type="button"
          className={`${btn.buyCompact} w-full sm:px-5.5 sm:py-3.5`}
          onClick={onOrder}
        >
          Add to order <Icon name="arrow" />
        </button>
      </div>
    </div>
  );
}



export default function SokoApp() {
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);

  const completeLogin = (user: MockUser) => {
    setSession({
      role: user.role,
      name: user.name,
      email: user.email,
      businessName: user.businessName,
    });
    setLoginOpen(false);
    router.push("/dashboard");
  };

  return (
    <MarketplaceProvider>
      <>
        <Marketplace
          onLogin={() => setLoginOpen(true)}
          onHome={() => router.push("/")}
        />
        {loginOpen && (
          <LoginModal
            onClose={() => setLoginOpen(false)}
            onSuccess={completeLogin}
          />
        )}
      </>
    </MarketplaceProvider>
  );
}
