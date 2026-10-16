"use client";

import { SalesPageContent } from "@/components/dashboard/DashboardPages";
import { RolePage } from "@/components/dashboard/RolePage";

export default function DashboardSalesPage() {
  return <RolePage section="Sales">{() => <SalesPageContent />}</RolePage>;
}
