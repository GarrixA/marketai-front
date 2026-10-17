"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ListingDetail } from "@/components/SokoApp";
import { SellerProfileView } from "@/components/marketplace/SellerCatalogDialog";
import { BuyQtyModal } from "@/components/marketplace/ProductMarketPanel";
import {
  TradeResultModal,
  type TradeResult,
} from "@/components/marketplace/TradeResultModal";
import { formatRwandaLocation } from "@/components/forms/RwandaLocationFields";
import { useAppDialog } from "@/hooks/useAppDialog";
import {
  marketplaceProductToListing,
  type ProductListing,
} from "@/lib/listings";
import { formatRwf } from "@/lib/marketplaceStore";
import {
  groupProductsBySeller,
  sellerPath,
  type SellerOffer,
} from "@/lib/sellerOffers";
import { getSession, type UserSession } from "@/lib/session";
import { Icon, PublicNav, SiteFooter, btn } from "@/lib/ui";
import { useCreateDealMutation } from "@/store/actions/deals";
import { useGetSellerBySlugQuery } from "@/store/actions/products";
import type { MarketplaceProduct, ProductOwner } from "@/types/product";

function offerFromOwner(
  owner: ProductOwner,
  products: MarketplaceProduct[]
): SellerOffer {
  const grouped = groupProductsBySeller(
    products.map((product) => ({
      ...product,
      owner: product.owner ?? owner,
      ownerId: product.ownerId ?? owner.id,
    }))
  );
  if (grouped[0]) return { ...grouped[0], slug: owner.slug || grouped[0].slug };

  const location = formatRwandaLocation(owner.location);
  return {
    id: owner.id,
    slug: owner.slug?.trim() || "",
    name: owner.name,
    role: owner.role,
    avatarUrl: owner.avatarUrl ?? null,
    bio: owner.bio?.trim() || null,
    ratingAverage: Number(owner.ratingAverage ?? 0),
    ratingCount: Number(owner.ratingCount ?? 0),
    verificationStatus: owner.verificationStatus ?? null,
    deliveryCapability: Boolean(owner.deliveryCapability),
    location: location === "—" ? "Location TBD" : location,
    products: [],
    trayQuantity: 0,
    eggQuantity: 0,
    averageTrayPrice: null,
    listingCount: 0,
  };
}

export function SellerStockPage({
  kind,
  slug,
}: {
  kind: "suppliers" | "aggregators";
  slug: string;
}) {
  const router = useRouter();
  const { dialog, showError, showSuccess } = useAppDialog();
  const { data, isLoading, isError } = useGetSellerBySlugQuery(slug);
  const [createDeal] = useCreateDealMutation();
  const [session, setSession] = useState<UserSession | null>(null);
  const [buying, setBuying] = useState<MarketplaceProduct | null>(null);
  const [detailItem, setDetailItem] = useState<ProductListing | null>(null);
  const [tradeResult, setTradeResult] = useState<TradeResult | null>(null);

  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    window.addEventListener("soko-session", sync);
    return () => window.removeEventListener("soko-session", sync);
  }, []);

  const seller = useMemo(
    () => (data ? offerFromOwner(data.owner, data.products) : null),
    [data]
  );

  useEffect(() => {
    if (!data?.owner?.slug) return;
    const path = sellerPath({
      role: data.owner.role,
      slug: data.owner.slug,
      name: data.owner.name,
    });
    if (path !== `/${kind}/${slug}`) router.replace(path);
  }, [data, kind, slug, router]);

  const canBuy =
    session?.role === "buyer" ||
    session?.role === "aggregator" ||
    session?.role === "admin";

  return (
    <div className="min-h-screen bg-soko-slate">
      {dialog}
      <PublicNav
        onLogin={() => router.push("/?auth=login")}
        onHome={() => router.push("/")}
      />
      <main className="mx-auto max-w-220 px-4 py-8 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center gap-4 text-sm">
          <Link href="/" className={`${btn.text} px-0 text-soko-navy`}>
            Marketplace
          </Link>
          {session ? (
            <Link
              href="/dashboard/products"
              className={`${btn.text} px-0 text-soko-muted`}
            >
              Your products
            </Link>
          ) : null}
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-soko-line bg-white px-6 py-16 text-center text-sm text-soko-muted">
            Loading seller…
          </div>
        ) : isError || !seller ? (
          <div className="rounded-2xl border border-soko-line bg-white px-6 py-16 text-center">
            <h1 className="font-display text-2xl font-bold">
              Seller not found
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-soko-muted">
              This supplier or aggregator link does not match a seller with a
              public profile.
            </p>
            <Link href="/" className={`${btn.outline} mt-5`}>
              Back to marketplace <Icon name="arrow" size={16} />
            </Link>
          </div>
        ) : (
          <SellerProfileView
            seller={seller}
            actionLabel={canBuy ? "Buy" : "View listing"}
            onSelect={(product) => {
              if (canBuy) {
                setBuying(product);
                return;
              }
              setDetailItem(marketplaceProductToListing(product));
            }}
          />
        )}
      </main>
      <SiteFooter onHome={() => router.push("/")} />

      {detailItem ? (
        <ListingDetail
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onOrder={() => router.push("/?auth=login")}
        />
      ) : null}

      {buying ? (
        <BuyQtyModal
          product={buying}
          onClose={() => setBuying(null)}
          showError={showError}
          showSuccess={showSuccess}
          onConfirm={async (qty, delivery) => {
            const product = buying;
            const deal = await createDeal({
              productId: product.id,
              quantity: qty,
              deliveryLocation: delivery,
            }).unwrap();
            setBuying(null);
            const productLabel = deal.grade
              ? `${deal.productName} · ${deal.grade}`
              : deal.productName;
            setTradeResult({
              kind: "buy",
              title: "Buy request sent",
              message:
                "The seller was notified on Deals. They will confirm available quantity before payment.",
              details: [
                productLabel,
                `${deal.quantity} ${deal.unit.toLowerCase()} · ${formatRwf(deal.targetPrice)} / ${deal.unit.toLowerCase()}`,
                `Delivery to ${deal.deliveryLocation}`,
                deal.supplierName ? `Seller ${deal.supplierName}` : "",
              ].filter(Boolean),
            });
          }}
        />
      ) : null}

      <TradeResultModal
        result={tradeResult}
        onClose={() => setTradeResult(null)}
      />
    </div>
  );
}
