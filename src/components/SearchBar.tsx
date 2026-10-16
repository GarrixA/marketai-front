"use client";

import { FormEvent, useState } from "react";
import { Icon } from "@/components/Icon";
import { btn } from "@/lib/ui";
import {
  EMPTY_SEARCH_FILTERS,
  SEARCH_CATEGORIES,
  type ListingSearchFilters,
  type QuantityFilter,
} from "@/lib/searchListings";

type SearchBarProps = {
  value?: ListingSearchFilters;
  onChange?: (filters: ListingSearchFilters) => void;
  onSearch?: (filters: ListingSearchFilters) => void;
};

export function SearchBar({ value, onChange, onSearch }: SearchBarProps = {}) {
  const [internal, setInternal] =
    useState<ListingSearchFilters>(EMPTY_SEARCH_FILTERS);
  const filters = value ?? internal;

  const update = (patch: Partial<ListingSearchFilters>) => {
    const next = { ...filters, ...patch };
    if (value === undefined) setInternal(next);
    onChange?.(next);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSearch?.(filters);
    document.getElementById("marketplace")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <form
      onSubmit={submit}
      className="grid grid-cols-[1.45fr_1fr_0.85fr_0.85fr_auto] gap-0 rounded-lg border border-soko-line bg-white p-3.5 text-soko-ink max-md:grid-cols-2 max-md:gap-3 max-sm:grid-cols-1"
    >
      <label className="border-r border-soko-line px-4.5 py-0.5 max-md:rounded-md max-md:border-0 max-md:bg-soko-slate max-md:p-3 max-sm:col-span-full">
        <span className="mb-2 block text-[0.625rem] font-extrabold tracking-[0.05rem] text-soko-muted uppercase">
          What are you looking for?
        </span>
        <div className="flex items-center gap-2">
          <Icon name="search" className="text-soko-navy" />
          <input
            value={filters.query}
            onChange={(e) => update({ query: e.target.value })}
            className="w-full border-0 bg-transparent text-[0.8125rem] text-soko-ink outline-none"
            placeholder="Eggs, grades, suppliers…"
            aria-label="Search eggs and suppliers"
          />
        </div>
      </label>
      <label className="border-r border-soko-line px-4.5 py-0.5 max-md:rounded-md max-md:border-0 max-md:bg-soko-slate max-md:p-3">
        <span className="mb-2 block text-[0.625rem] font-extrabold tracking-[0.05rem] text-soko-muted uppercase">
          Delivery location
        </span>
        <div className="flex items-center gap-2">
          <Icon name="pin" className="text-soko-navy" />
          <input
            value={filters.location}
            onChange={(e) => update({ location: e.target.value })}
            className="w-full border-0 bg-transparent text-[0.8125rem] text-soko-ink outline-none"
            placeholder="Kigali, Musanze..."
            aria-label="Delivery location"
          />
        </div>
      </label>
      <label className="border-r border-soko-line px-4.5 py-0.5 max-md:hidden max-md:rounded-md max-md:border-0 max-md:bg-soko-slate max-md:p-3 max-sm:hidden">
        <span className="mb-2 block text-[0.625rem] font-extrabold tracking-[0.05rem] text-soko-muted uppercase">
          Quantity
        </span>
        <select
          value={filters.quantity}
          onChange={(e) =>
            update({ quantity: e.target.value as QuantityFilter })
          }
          className="w-full border-0 bg-transparent text-[0.8125rem] text-soko-ink outline-none"
          aria-label="Order quantity"
        >
          <option value="">Any size</option>
          <option value="10-50">10–50 units</option>
          <option value="50-200">50–200 units</option>
          <option value="200+">200+ units</option>
        </select>
      </label>
      <label className="border-r border-soko-line px-4.5 py-0.5 max-md:hidden max-sm:hidden">
        <span className="mb-2 block text-[0.625rem] font-extrabold tracking-[0.05rem] text-soko-muted uppercase">
          Category
        </span>
        <select
          value={filters.category || "Any category"}
          onChange={(e) => update({ category: e.target.value })}
          className="w-full border-0 bg-transparent text-[0.8125rem] text-soko-ink outline-none"
          aria-label="Product category"
        >
          {SEARCH_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className={`${btn.search} max-md:justify-center max-md:px-3.5 max-md:py-3.5`}
      >
        <Icon name="search" />
        Search marketplace
      </button>
    </form>
  );
}
