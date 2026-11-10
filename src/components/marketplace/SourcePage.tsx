"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import useTranslation from "next-translate/useTranslation";
import { PublicNav, SiteFooter } from "@/lib/ui";
import { ProductMarketPanel } from "@/components/marketplace/ProductMarketPanel";
import { MarketplaceProvider } from "@/components/marketplace/MarketplaceProvider";
import { SourceSectionHeaderSkeleton } from "@/components/marketplace/MarketplaceSkeletons";
import {
  getSessionSnapshot,
  subscribeSession,
  type DashboardRole,
} from "@/lib/session";
import { useListAvailableProductsQuery } from "@/store/actions/products";

const sectionKicker =
  "text-[0.6875rem] font-extrabold tracking-[0.1375rem] text-soko-green-2 uppercase";

function translationReady(t: (key: string) => string, key: string): boolean {
  const value = t(key);
  return Boolean(value) && value !== key && !value.startsWith(`${key}.`);
}

function SourceContent() {
  const { t } = useTranslation("suppliers");
  const router = useRouter();
  const session = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    () => null
  );
  const { isLoading: productsLoading } = useListAvailableProductsQuery({
    excludeOwn: true,
  });

  const role: DashboardRole | null = session?.role ?? null;
  const headerReady =
    translationReady(t, "sectionEyebrow") &&
    translationReady(t, "sectionTitle") &&
    translationReady(t, "sectionDescription");
  const showHeaderSkeleton = !headerReady || productsLoading;

  return (
    <div className="min-h-screen bg-soko-slate">
      <PublicNav
        onLogin={() => router.push("/?auth=login")}
        onHome={() => router.push("/")}
      />

      <main className="mx-auto max-w-310 px-6 pt-10 pb-22.5 max-md:pt-8 max-sm:pt-6">
        {showHeaderSkeleton ? (
          <SourceSectionHeaderSkeleton />
        ) : (
          <div className="mb-7.5">
            <span className={sectionKicker}>{t("sectionEyebrow")}</span>
            <h1 className="my-2 font-display text-4xl leading-tight font-bold tracking-[-0.09375rem] text-soko-ink max-sm:text-[2rem]">
              {t("sectionTitle")}
            </h1>
            <p className="m-0 max-w-xl text-soko-muted">
              {t("sectionDescription")}
            </p>
          </div>
        )}

        <ProductMarketPanel
          role={role}
          initialMode="buy"
          showToolbar={false}
          showStockSummary={false}
          showModeToggle={false}
        />
      </main>

      <SiteFooter onHome={() => router.push("/")} />
    </div>
  );
}

export default function SourcePage() {
  return (
    <MarketplaceProvider>
      <SourceContent />
    </MarketplaceProvider>
  );
}
