import type { ComponentType } from "react";
import type { DashboardRole } from "@/lib/session";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { AggregatorDashboard } from "@/components/dashboard/AggregatorDashboard";
import { BuyerDashboard } from "@/components/dashboard/BuyerDashboard";
import { LogisticsDashboard } from "@/components/dashboard/LogisticsDashboard";
import { SupplierDashboard } from "@/components/dashboard/SupplierDashboard";

export const dashboardByRole: Record<DashboardRole, ComponentType> = {
  buyer: BuyerDashboard,
  supplier: SupplierDashboard,
  aggregator: AggregatorDashboard,
  logistics: LogisticsDashboard,
  admin: AdminDashboard,
};
