"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { formatRwandaLocation } from "@/components/forms/RwandaLocationFields";
import { formatRwf } from "@/lib/marketplaceStore";
import { useListAllProductsQuery } from "@/store/actions/products";
import type { MarketplaceProduct } from "@/types/product";

type ListingStatus = "AVAILABLE" | "UNAVAILABLE";

function listingStatus(product: MarketplaceProduct): ListingStatus {
  return product.isActive && product.isAvailable ? "AVAILABLE" : "UNAVAILABLE";
}

function listedValue(product: MarketplaceProduct) {
  return Number(product.price || 0) * (product.availableQuantity || 0);
}

function statusClass(status: ListingStatus) {
  if (status === "AVAILABLE") return "bg-[#e8f5ee] text-[#166534]";
  return "bg-soko-slate text-soko-muted";
}

function formatWhen(value: string) {
  try {
    return new Date(value).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function StatusPill({ status }: { status: ListingStatus }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-[0.5625rem] font-bold tracking-wide uppercase ${statusClass(status)}`}
    >
      {status}
    </span>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "—";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3.5">
      <p className="m-0 text-[0.5625rem] font-bold tracking-[0.08em] text-soko-muted uppercase">
        {label}
      </p>
      <p className="m-0 mt-1 font-display text-[0.95rem] font-bold tracking-tight text-soko-ink">
        {value}
      </p>
    </div>
  );
}

function ProductDetailsDialog({
  product,
  onClose,
}: {
  product: MarketplaceProduct;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const title = product.grade
    ? `${product.name} · ${product.grade}`
    : product.name;
  const seller = product.owner?.name || "Seller";
  const role = product.owner?.role;
  const status = listingStatus(product);

  return (
    <div
      className="fixed inset-0 z-130 grid place-items-center overflow-y-auto bg-soko-navy/72 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-details-title"
        className="relative my-auto w-full max-w-160 overflow-hidden rounded-2.5 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative border-b border-soko-line bg-white px-5 py-5 sm:px-6">
          <button
            type="button"
            className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full border border-soko-line bg-white text-soko-muted hover:text-soko-navy"
            onClick={onClose}
            aria-label="Close product details"
          >
            <Icon name="close" size={16} />
          </button>
          <p className="m-0 text-[0.5625rem] font-bold tracking-[0.12em] text-soko-muted uppercase">
            Product preview
          </p>
          <h3
            id="product-details-title"
            className="m-0 mt-1.5 pr-10 font-display text-[1.35rem] leading-tight font-bold tracking-tight text-soko-ink"
          >
            {title}
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill status={status} />
            <span className="text-[0.6875rem] text-soko-muted">
              Listed {formatWhen(product.createdAt)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 border-b border-soko-line sm:grid-cols-4">
          <Metric
            label="Quantity"
            value={`${product.availableQuantity} ${product.unit.toLowerCase()}`}
          />
          <Metric
            label="Listed value"
            value={formatRwf(listedValue(product))}
          />
          <Metric label="Price" value={formatRwf(Number(product.price || 0))} />
          <Metric
            label="Minimum"
            value={`${product.minQuantity} ${product.unit.toLowerCase()}`}
          />
        </div>

        <div className="space-y-4 bg-soko-slate/60 p-4 sm:p-5">
          <div className="rounded-xl border border-soko-line bg-white p-3.5">
            <p className="m-0 text-[0.5625rem] font-bold tracking-[0.08em] text-soko-muted uppercase">
              Seller
            </p>
            <div className="mt-2.5 flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-soko-slate font-display text-xs font-bold text-soko-navy">
                {initials(seller)}
              </span>
              <div className="min-w-0">
                <p className="m-0 truncate text-sm font-bold text-soko-ink">
                  {seller}
                </p>
                <p className="m-0 truncate text-[0.6875rem] text-soko-muted capitalize">
                  {role || "Seller"}
                  {product.category?.name ? ` · ${product.category.name}` : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-soko-line bg-white px-4 py-3">
            <p className="m-0 text-[0.5625rem] font-bold tracking-[0.08em] text-soko-muted uppercase">
              Location
            </p>
            <p className="m-0 mt-1 text-sm leading-snug text-soko-ink">
              {formatRwandaLocation(product.location)}
            </p>
          </div>

          {product.description ? (
            <div className="rounded-xl border border-soko-line bg-white px-4 py-3">
              <p className="m-0 text-[0.5625rem] font-bold tracking-[0.08em] text-soko-muted uppercase">
                Description
              </p>
              <p className="m-0 mt-1 text-sm leading-snug text-soko-ink">
                {product.description}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AdminProducts() {
  const { data: products = [], isLoading, isError } = useListAllProductsQuery();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ListingStatus | "ALL">("ALL");
  const [openProduct, setOpenProduct] = useState<MarketplaceProduct | null>(
    null
  );

  const totals = useMemo(() => {
    const available = products.filter(
      (product) => listingStatus(product) === "AVAILABLE"
    );
    const unavailable = products.length - available.length;
    return {
      total: products.length,
      available: available.length,
      unavailable,
      suppliers: products.filter(
        (product) => product.owner?.role === "supplier"
      ).length,
      aggregators: products.filter(
        (product) => product.owner?.role === "aggregator"
      ).length,
      value: products.reduce((sum, product) => sum + listedValue(product), 0),
    };
  }, [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      if (status !== "ALL" && listingStatus(product) !== status) return false;
      if (!q) return true;
      return [
        product.name,
        product.grade,
        product.size,
        product.owner?.name,
        product.owner?.role,
        product.category?.name,
        formatRwandaLocation(product.location),
        listingStatus(product),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [products, query, status]);

  const cards = [
    ["Total products", String(totals.total)],
    ["Available", String(totals.available)],
    ["Unavailable", String(totals.unavailable)],
    ["Suppliers", String(totals.suppliers)],
    ["Aggregators", String(totals.aggregators)],
    ["Listed value", formatRwf(totals.value)],
  ];

  return (
    <div className="flex flex-col gap-4">
      <section className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map(([label, value]) => (
          <div
            key={label}
            className="rounded-1.75 border border-soko-line bg-white px-4 py-3.5"
          >
            <p className="m-0 text-[0.5625rem] font-bold tracking-[0.08em] text-soko-muted uppercase">
              {label}
            </p>
            <p className="m-0 mt-1 font-display text-xl font-bold tracking-tight text-soko-ink">
              {isLoading ? "—" : value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-1.75 border border-soko-line bg-white p-5 shadow-[0_1px_2px_rgba(13,27,42,0.04)]">
        <div className="mb-4">
          <h2 className="m-0 mb-0.5 font-display text-[1rem] font-bold tracking-tight text-soko-ink">
            All products
          </h2>
          <p className="m-0 text-[0.6875rem] text-soko-muted">
            Open a listing to see the seller, price, and location.
          </p>
        </div>

        {isError ? (
          <p className="m-0 text-xs text-soko-muted">
            Could not load marketplace products. Refresh and try again.
          </p>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search product, seller, or location"
                className="block w-full rounded-1.25 border border-soko-line bg-white px-3 py-2 text-xs outline-soko-navy"
                aria-label="Search products"
              />
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ListingStatus | "ALL")
                }
                className="rounded-1.25 border border-soko-line bg-white px-3 py-2 text-xs outline-soko-navy sm:w-44"
                aria-label="Filter by status"
              >
                <option value="ALL">All statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </select>
            </div>

            {isLoading ? (
              <p className="m-0 text-xs text-soko-muted">Loading products…</p>
            ) : visible.length === 0 ? (
              <p className="m-0 text-xs text-soko-muted">
                {products.length === 0
                  ? "No products in the marketplace yet."
                  : "No products match this search."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-soko-line text-[0.5625rem] tracking-wide text-soko-muted uppercase">
                      <th className="px-2 py-2.5 font-bold">Listed</th>
                      <th className="px-2 py-2.5 font-bold">Product</th>
                      <th className="px-2 py-2.5 font-bold">Status</th>
                      <th className="px-2 py-2.5 font-bold">Seller</th>
                      <th className="px-2 py-2.5 font-bold">Quantity</th>
                      <th className="px-2 py-2.5 font-bold">Value</th>
                      <th className="px-2 py-2.5 text-right font-bold">
                        <span className="sr-only">View</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-soko-line align-middle"
                      >
                        <td className="px-2 py-3 text-[0.625rem] whitespace-nowrap text-soko-muted">
                          {formatWhen(product.createdAt)}
                        </td>
                        <td className="px-2 py-3 text-[0.6875rem] font-bold text-soko-ink">
                          {product.name}
                          {product.grade ? ` · ${product.grade}` : ""}
                        </td>
                        <td className="px-2 py-3">
                          <StatusPill status={listingStatus(product)} />
                        </td>
                        <td className="px-2 py-3 text-[0.6875rem]">
                          {product.owner?.name || "—"}
                          {product.owner?.role ? (
                            <span className="mt-0.5 block text-[0.5625rem] text-soko-muted capitalize">
                              {product.owner.role}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-2 py-3 text-[0.6875rem] whitespace-nowrap">
                          {product.availableQuantity}{" "}
                          {product.unit.toLowerCase()}
                        </td>
                        <td className="px-2 py-3 text-[0.6875rem] whitespace-nowrap">
                          {formatRwf(listedValue(product))}
                        </td>
                        <td className="px-2 py-3 text-right">
                          <button
                            type="button"
                            className="inline-grid h-8 w-8 place-items-center rounded-lg border border-soko-line bg-white text-soko-muted transition-colors hover:border-soko-navy hover:text-soko-navy"
                            aria-label={`View ${product.name}`}
                            onClick={() => setOpenProduct(product)}
                          >
                            <Icon name="eye" size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      {openProduct ? (
        <ProductDetailsDialog
          product={openProduct}
          onClose={() => setOpenProduct(null)}
        />
      ) : null}
    </div>
  );
}
