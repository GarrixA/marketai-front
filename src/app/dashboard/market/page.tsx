"use client";

import { MarketPageContent } from "@/components/dashboard/DashboardPages";
import { RolePage } from "@/components/dashboard/RolePage";

export default function DashboardMarketPage() {
  return (
    <RolePage section="Market">
      {(role) => <MarketPageContent role={role} />}
    </RolePage>
  );
}
