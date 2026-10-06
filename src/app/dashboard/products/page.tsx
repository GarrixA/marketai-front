"use client";

import { ProductsPageContent } from "@/components/dashboard/DashboardPages";
import { RolePage } from "@/components/dashboard/RolePage";

export default function DashboardProductsPage() {
  return (
    <RolePage section="Products">
      {(role) => <ProductsPageContent role={role} />}
    </RolePage>
  );
}
