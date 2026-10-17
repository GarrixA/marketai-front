"use client";

import { use } from "react";
import { SellerStockPage } from "@/components/marketplace/SellerStockPage";

export default function SupplierPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <SellerStockPage kind="suppliers" slug={decodeURIComponent(slug)} />;
}
