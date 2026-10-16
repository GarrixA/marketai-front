"use client";

import { MvpOverview } from "@/components/marketplace/MvpOverview";
import { BuyRequestsPanel } from "@/components/marketplace/BuyRequestsPanel";
import { AdminDeals } from "@/components/dashboard/AdminDeals";
import { DealsPanel } from "@/components/marketplace/DealsPanel";
import { AdminProducts } from "@/components/dashboard/AdminProducts";
import { ProductMarketPanel } from "@/components/marketplace/ProductMarketPanel";
import { SellOffersPanel } from "@/components/marketplace/SellOffersPanel";
import { TransportJobsPanel } from "@/components/marketplace/TransportJobsPanel";
import {
  BuyerOrdersPanel,
  SupplierSalesPanel,
} from "@/components/marketplace/PurchaseTracking";
import type { DashboardRole } from "@/lib/session";

export function OverviewPageContent({ role }: { role: DashboardRole }) {
  if (role === "logistics") return <TransportJobsPanel />;
  return <MvpOverview role={role} />;
}

export function ProductsPageContent({ role }: { role: DashboardRole }) {
  if (role === "admin") return <AdminProducts />;
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
  if (role === "admin") return <AdminDeals />;
  if (role === "buyer") return <DealsPanel perspective="buyer" />;
  if (role === "aggregator") {
    return (
      <div className="space-y-4.25">
        <DealsPanel perspective="buyer" />
        <DealsPanel perspective="supplier" />
      </div>
    );
  }
  return <DealsPanel perspective="supplier" />;
}

export function OrdersPageContent({ role }: { role: DashboardRole }) {
  if (role === "aggregator") {
    return (
      <div className="space-y-4.25">
        <SupplierSalesPanel />
        <BuyerOrdersPanel />
      </div>
    );
  }
  return <BuyerOrdersPanel />;
}

export function SalesPageContent() {
  return <SupplierSalesPanel />;
}

export function TransportPageContent() {
  return <TransportJobsPanel />;
}
