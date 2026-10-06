"use client";

import { SellOffersPageContent } from "@/components/dashboard/DashboardPages";
import { RolePage } from "@/components/dashboard/RolePage";

export default function DashboardSellOffersPage() {
  return (
    <RolePage section="Sell Offers">
      {() => <SellOffersPageContent />}
    </RolePage>
  );
}
