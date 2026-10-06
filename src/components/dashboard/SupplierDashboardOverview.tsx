"use client";

import { OrderOverviewPanel } from "@/components/dashboard/OrderOverviewPanel";

export function SupplierDashboardOverview() {
  return <OrderOverviewPanel supplier={true} />;
}
