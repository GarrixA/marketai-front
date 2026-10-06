"use client";

import { MvpOverview } from "@/components/marketplace/MvpOverview";
import { BuyRequestsPanel } from "@/components/marketplace/BuyRequestsPanel";
import { DealsPanel } from "@/components/marketplace/DealsPanel";
import { ProductMarketPanel } from "@/components/marketplace/ProductMarketPanel";
import { SellOffersPanel } from "@/components/marketplace/SellOffersPanel";
import { TransportJobsPanel } from "@/components/marketplace/TransportJobsPanel";
import type { DashboardRole } from "@/lib/session";
import { pathForSection } from "@/lib/dashboardNav";
import { useRouter } from "next/navigation";

export function OverviewPageContent({ role }: { role: DashboardRole }) {
  const router = useRouter();
  return (
    <MvpOverview
      role={role}
      onGo={(section) => router.push(pathForSection(section))}
    />
  );
}

export function ProductsPageContent({ role }: { role: DashboardRole }) {
  return <ProductMarketPanel role={role} />;
}

export function SellOffersPageContent() {
  return <SellOffersPanel />;
}

export function BuyRequestsPageContent({ role }: { role: DashboardRole }) {
  return (
    <div className="space-y-4.25">
      {(role === "buyer" || role === "aggregator") && (
        <BuyRequestsPanel mode="mine" />
      )}
      {(role === "supplier" || role === "aggregator" || role === "admin") && (
        <BuyRequestsPanel mode="incoming" />
      )}
    </div>
  );
}

export function DealsPageContent({ role }: { role: DashboardRole }) {
  if (role === "buyer") return <DealsPanel perspective="buyer" />;
  if (role === "admin" || role === "aggregator") {
    return (
      <div className="space-y-4.25">
        <DealsPanel perspective="buyer" />
        <DealsPanel perspective="supplier" />
      </div>
    );
  }
  return <DealsPanel perspective="supplier" />;
}

export function TransportPageContent() {
  return <TransportJobsPanel />;
}
