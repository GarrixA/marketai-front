"use client";

import { OrderOverviewPanel } from "@/components/dashboard/OrderOverviewPanel";

export function BuyerDashboardOverview() {
  return <OrderOverviewPanel supplier={false} />;
}
