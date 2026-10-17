"use client";

import { use } from "react";
import { SellerStockPage } from "@/components/marketplace/SellerStockPage";

export default function AggregatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <SellerStockPage kind="aggregators" slug={decodeURIComponent(slug)} />;
}
