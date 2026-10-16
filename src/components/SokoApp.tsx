"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon, PublicNav, SearchBar, SiteFooter, btn } from "@/lib/ui";
import { ClaimRoleModal } from "@/components/ClaimRoleModal";
import { LoginModal } from "@/components/LoginModal";
import { RegisterModal } from "@/components/RegisterModal";
import { ProductCard } from "@/components/ProductCard";
import { MarketplaceProvider } from "@/components/marketplace/MarketplaceProvider";
import {
  marketplaceProductsToListings,
  type ProductListing,
} from "@/lib/listings";
import {
  EMPTY_SEARCH_FILTERS,
  hasActiveSearchFilters,
  searchListings,
  type ListingSearchFilters,
} from "@/lib/searchListings";
import { productImageSrc } from "@/lib/productImage";
import { setSession, type UserSession } from "@/lib/session";
import { useListAvailableProductsQuery } from "@/store/actions/products";

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
  const { data: products = [], isLoading: productsLoading } =
    useListAvailableProductsQuery();
  const listings = useMemo(
    () => marketplaceProductsToListings(products),
    [products]
  );
  const [detailItem, setDetailItem] = useState<ProductListing | null>(null);
  const [filters, setFilters] =
    useState<ListingSearchFilters>(EMPTY_SEARCH_FILTERS);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [pagedFilters, setPagedFilters] = useState(filters);

  if (pagedFilters !== filters) {
    setPagedFilters(filters);
    setVisibleCount(PAGE_SIZE);
  }

  const filteredListings = useMemo(
    () => searchListings(listings, filters),
    [listings, filters]
  );

  const totalTrays = products.reduce(
    (sum, item) => sum + (item.availableQuantity || 0),
    0
  );
  const sellerCount = new Set(
    products.map((item) => item.ownerId).filter(Boolean)
  ).size;

  const visibleListings = filteredListings.slice(0, visibleCount);
  const hasMore = visibleCount < filteredListings.length;
  const searching = hasActiveSearchFilters(filters);

  return (
    <div>
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <img
          src={photos.hero}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_46%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,27,42,0.92),rgba(19,25,33,0.72)_48%,rgba(13,27,42,0.18)),linear-gradient(transparent_60%,rgba(13,27,42,0.5))]" />
      </div>

      <PublicNav onLogin={onLogin} onHome={onHome} />

      <main className="relative">
        <section className="relative z-1 px-0 pt-12 pb-28 text-white max-md:pt-8 max-md:pb-32 max-sm:pt-6 max-sm:pb-28">
          <div className="relative mx-auto flex max-w-310 items-end justify-between gap-8 px-6 max-md:items-start">
            <div className="w-162.5 max-w-full max-md:w-full">
              <span className="flex items-center gap-2 text-[0.6875rem] font-extrabold tracking-[0.1375rem] text-soko-on-dark">
                <span
                  className="h-px w-6.5 shrink-0 bg-soko-on-dark"
                  aria-hidden="true"
                />
                <span>Rwanda&apos;s trusted supply marketplace</span>
              </span>
              <h1 className="mt-5 mb-5 font-display text-[3.875rem] leading-[1.12] font-bold tracking-[-0.04em] max-md:text-[3rem] max-sm:text-[2.375rem]">
                Reliable supply.
                <br />
                <em className="text-soko-on-dark not-italic">Fairer trade.</em>
              </h1>
              <p className="max-w-155 text-lg leading-relaxed text-soko-on-dark max-sm:text-[0.9375rem]">
                Discover verified suppliers, compare prices, place orders, and
                coordinate delivery—all in one trusted marketplace.
              </p>
              <div className="mt-7.5 flex flex-wrap gap-6 text-xs text-soko-on-dark">
                <span className="flex items-center gap-1.5">
                  <Icon
                    name="check"
                    className="rounded-full bg-soko-green-2 p-0.5"
                  />
                  Verified sellers
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon
                    name="check"
                    className="rounded-full bg-soko-green-2 p-0.5"
                  />
                  Protected payments
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon
                    name="check"
                    className="rounded-full bg-soko-green-2 p-0.5"
                  />
                  Tracked delivery
                </span>
              </div>
            </div>
            <div className="w-82.5 shrink-0 rounded-lg border border-soko-line bg-white p-5 text-soko-ink shadow-lg max-md:hidden">
              <div className="flex justify-between text-[0.625rem] font-extrabold tracking-[0.10625rem] text-soko-muted uppercase">
                <span>MARKET PULSE</span>
                <span className="text-[#F07500] normal-case">
                  <i
                    className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#F07500]"
                    aria-hidden="true"
                  />
                  LIVE
                </span>
              </div>
              <div className="border-b border-soko-line py-5 pb-4.5">
                <strong className="block font-display text-4xl font-bold text-soko-ink">
                  {totalTrays.toLocaleString("en-RW")}
                </strong>
                <span className="text-[0.8125rem] text-soko-muted">
                  units available today
                </span>
              </div>
              <div className="grid grid-cols-2 py-4.25">
                <div className="border-r border-soko-line">
                  <small className="block text-[0.5rem] tracking-wide text-soko-muted uppercase">
                    LISTINGS
                  </small>
                  <b className="my-1 block text-sm text-soko-ink">
                    {listings.length}
                  </b>
                  <span className="block text-[0.625rem] text-[#F07500]">
                    Available now
                  </span>
                </div>
                <div className="pl-4.25">
                  <small className="block text-[0.5rem] tracking-wide text-soko-muted uppercase">
                    ACTIVE SELLERS
                  </small>
                  <b className="my-1 block text-sm text-soko-ink">
                    {sellerCount} verified
                  </b>
                  <span className="block text-[0.625rem] text-soko-muted">
                    Supplier + aggregator
                  </span>
                </div>
              </div>
              <div className="flex justify-between border-t border-soko-line pt-3.75 text-xs text-soko-ink">
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

        <div className="relative z-2 bg-soko-slate">
          <section
            className="mx-auto max-w-310 px-6 pt-14 pb-22.5 max-md:pt-12 max-sm:pt-10"
            id="marketplace"
          >
            <div className="mb-7.5 flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
              <div>
                <span className={sectionKicker}>AVAILABLE NOW</span>
                <h2 className="my-2 font-display text-4xl leading-tight font-bold tracking-[-0.09375rem] text-soko-ink">
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
                  className={`${btn.text} px-0 text-soko-navy`}
                  onClick={() => setFilters(EMPTY_SEARCH_FILTERS)}
                >
                  Clear search
                </button>
              )}
            </div>
            {productsLoading ? (
              <div className="rounded-lg border border-soko-line bg-white px-6 py-16 text-center text-sm text-soko-muted">
                Loading available products…
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="rounded-lg border border-soko-line bg-white px-6 py-16 text-center">
                <h3 className="font-display text-xl font-bold">
                  {searching ? "No listings matched" : "No products available"}
                </h3>
                <p className="mx-auto mt-2 max-w-105 text-sm text-soko-muted">
                  {searching
                    ? "Try a broader product name, another district, or clear one of the filters."
                    : "Sellers haven’t listed available stock yet. Check back soon."}
                </p>
                {searching ? (
                  <button
                    type="button"
                    className={`${btn.outline} mt-5`}
                    onClick={() => setFilters(EMPTY_SEARCH_FILTERS)}
                  >
                    Reset filters
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-5 max-md:grid-cols-1">
                  {visibleListings.map((item) => (
                    <ProductCard
                      key={
                        item.id ??
                        `${item.supplier}-${item.name}-${item.location}`
                      }
                      item={item}
                      onView={() => setDetailItem(item)}
                    />
                  ))}
                </div>
                <div className="mt-8 flex flex-col items-center gap-3 border border-soko-line bg-white px-5 py-5 text-[0.6875rem] text-soko-muted">
                  <span className="flex items-center gap-1.5">
                    <Icon name="check" />
                    Showing {visibleListings.length} of{" "}
                    {filteredListings.length} verified listings
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
          key={detailItem.id ?? detailItem.name}
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onOrder={onLogin}
        />
      )}
    </div>
  );
}

function pluralUnit(unit: string, count: number) {
  if (count === 1) return unit;
  return unit.endsWith("s") ? unit : `${unit}s`;
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
  const minQty = Math.max(1, item.minValue || 1);
  const maxQty = Math.max(minQty, item.qtyValue || minQty);
  const unitLabel = item.priceUnit ?? "unit";
  const qtyTitle = `${item.qtyValue.toLocaleString("en-RW")} ${pluralUnit(unitLabel, item.qtyValue)}`;
  const [quantity, setQuantity] = useState(minQty);

  const clampQuantity = (value: number) =>
    Math.min(maxQty, Math.max(minQty, value));

  const estimatedTotal =
    item.priceValue > 0 ? item.priceValue * quantity : null;

  return (
    <div
      className="fixed inset-0 z-100 grid place-items-center bg-soko-navy/72 p-6 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-152.5 overflow-auto rounded-2.5 bg-white px-10.5 py-13 max-md:max-h-[95vh] max-md:px-6.25 max-md:py-8.75"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute top-4 right-4 z-2 grid h-9 w-9 place-items-center rounded-full border border-soko-line bg-white"
          onClick={onClose}
          aria-label="Close listing"
        >
          <Icon name="close" />
        </button>
        <img
          src={productImageSrc(item.image)}
          alt={item.name}
          className="mb-5 h-48 w-full rounded-xl object-cover object-[center_46%]"
        />
        <span className={sectionKicker}>VERIFIED SUPPLY</span>
        <div className="mt-3 flex items-start justify-between gap-3 pr-10">
          <p className="flex min-w-0 items-center gap-1.5 text-[0.8125rem]">
            <span className="inline-grid h-4.25 w-4.25 shrink-0 place-items-center rounded-full bg-soko-navy text-white">
              <Icon name="check" size={12} />
            </span>
            <span className="truncate font-medium">{item.supplier}</span>
          </p>
          <span className="shrink-0 rounded bg-soko-slate px-2.25 py-1.5 text-[0.5625rem] font-extrabold text-soko-muted">
            Delivery available
          </span>
        </div>
        <h2 className="mt-4 mb-2 font-display text-[1.875rem] font-bold text-soko-ink">
          {qtyTitle}
        </h2>
        {item.name ? (
          <p className="m-0 text-sm leading-relaxed text-soko-muted">
            {item.name}
          </p>
        ) : null}
        <div className="my-5 flex items-baseline justify-between gap-3 border-y border-soko-line py-5.5">
          <strong className="font-display text-[1.5625rem] font-extrabold">
            {item.priceValue > 0
              ? `RWF ${item.price}/${unitLabel}`
              : "Ask seller"}
          </strong>
          <small className="shrink-0 text-xs text-soko-muted">
            Min. {item.min}
          </small>
        </div>
        <div className="grid grid-cols-2 gap-3.75">
          <div className="bg-soko-slate p-3.25">
            <small className="block text-[0.5rem] tracking-wide text-soko-muted uppercase">
              LOCATION
            </small>
            <strong className="mt-1 block text-xs">{item.location}</strong>
          </div>
          <div className="bg-soko-slate p-3.25">
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
              className="h-9.5 w-9.5 border border-soko-line bg-white text-center disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => setQuantity((q) => clampQuantity(q - 1))}
              disabled={quantity <= minQty}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <input
              className="h-9.5 w-14 border border-soko-line bg-white text-center"
              type="number"
              min={minQty}
              max={maxQty}
              value={quantity}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (!Number.isFinite(next)) return;
                setQuantity(clampQuantity(next));
              }}
              aria-label="Order quantity"
            />
            <button
              type="button"
              className="h-9.5 w-9.5 border border-soko-line bg-white text-center disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => setQuantity((q) => clampQuantity(q + 1))}
              disabled={quantity >= maxQty}
              aria-label="Increase quantity"
            >
              +
            </button>
            <span className="ml-2 self-center text-soko-muted">
              {pluralUnit(unitLabel, quantity)}
            </span>
          </div>
        </label>
        <div className="flex justify-between py-4.5 text-[0.8125rem]">
          <span>Estimated product total</span>
          <strong>
            {estimatedTotal !== null
              ? `RWF ${estimatedTotal.toLocaleString("en-RW")}`
              : "Price on request"}
          </strong>
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

type AuthModal = "login" | "register" | "claim-role" | null;

type ClaimRoleTarget = {
  userId: string;
  email: string;
};

function authFromSearch(params: { get: (key: string) => string | null }): {
  key: string;
  modal: AuthModal;
  claim: ClaimRoleTarget | null;
} {
  const auth = params.get("auth");
  const userId = params.get("userId");
  const email = params.get("email");
  const key = `${auth ?? ""}|${userId ?? ""}|${email ?? ""}`;
  if (auth === "login") return { key, modal: "login", claim: null };
  if (auth === "register") return { key, modal: "register", claim: null };
  if (auth === "claim-role" && userId && email) {
    return { key, modal: "claim-role", claim: { userId, email } };
  }
  return { key, modal: null, claim: null };
}

export default function SokoApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlAuth = authFromSearch(searchParams);
  const [authModal, setAuthModal] = useState<AuthModal>(urlAuth.modal);
  const [claimTarget, setClaimTarget] = useState<ClaimRoleTarget | null>(
    urlAuth.claim
  );
  const [authKey, setAuthKey] = useState(urlAuth.key);

  if (authKey !== urlAuth.key) {
    setAuthKey(urlAuth.key);
    setAuthModal(urlAuth.modal);
    setClaimTarget(urlAuth.claim);
  }

  const completeLogin = (session: UserSession) => {
    setSession(session);
    setAuthModal(null);
    setClaimTarget(null);
    router.push("/dashboard");
  };

  const closeAuthModal = () => {
    setAuthModal(null);
    setClaimTarget(null);
    if (searchParams.get("auth")) {
      router.replace("/");
    }
  };

  const openClaimRole = (details: ClaimRoleTarget) => {
    setClaimTarget(details);
    setAuthModal("claim-role");
  };

  return (
    <MarketplaceProvider>
      <>
        <Marketplace
          onLogin={() => setAuthModal("login")}
          onHome={() => router.push("/")}
        />
        {authModal === "login" ? (
          <LoginModal
            onClose={closeAuthModal}
            onSuccess={completeLogin}
            onSwitchToRegister={() => setAuthModal("register")}
            onNeedRole={openClaimRole}
            onNeedVerifyEmail={() => {
              // User must use the emailed verify link; keep them informed via popup already shown.
            }}
          />
        ) : null}
        {authModal === "register" ? (
          <RegisterModal
            onClose={closeAuthModal}
            onSwitchToLogin={() => setAuthModal("login")}
          />
        ) : null}
        {authModal === "claim-role" && claimTarget ? (
          <ClaimRoleModal
            userId={claimTarget.userId}
            email={claimTarget.email}
            onClose={closeAuthModal}
            onSuccess={() => {
              setClaimTarget(null);
              setAuthModal("login");
              router.replace("/?auth=login");
            }}
          />
        ) : null}
      </>
    </MarketplaceProvider>
  );
}
