"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  formatRwandaLocation,
  RwandaLocationFields,
  type RwandaLocationValue,
} from "@/components/forms/RwandaLocationFields";
import { ActionOverlay, ButtonLoader } from "@/components/ActionLoader";
import { Field, fieldClass } from "@/components/marketplace/uiBits";
import { formatApiError } from "@/lib/apiError";
import { Icon, btn } from "@/lib/ui";
import { authService } from "@/services/auth.service";
import {
  useCreateProductMutation,
  useRequestSellMutation,
  useUpdateProductMutation,
} from "@/store/actions/products";
import type { MeResponse } from "@/types/auth";
import type {
  CreateProductRequest,
  MarketplaceProduct,
  ProductPriceUnit,
} from "@/types/product";

const UNIT_OPTIONS: { value: ProductPriceUnit; label: string }[] = [
  { value: "TRAY", label: "Tray" },
  { value: "PIECE", label: "Piece" },
];

const GRADE_OPTIONS = [
  "Large",
  "Medium",
  "Small",
  "Mixed",
  "Organic Large",
  "Free-range",
] as const;

type FormState = {
  description: string;
  grade: string;
  unit: ProductPriceUnit;
  price: string;
  isAvailable: boolean;
  availableQuantity: string;
  minQuantity: string;
  useMarketplaceLocation: boolean;
  location: RwandaLocationValue;
};

function toPriceUnit(unit: string): ProductPriceUnit {
  return unit === "PIECE" ? "PIECE" : "TRAY";
}

function emptyForm(): FormState {
  return {
    description: "",
    grade: "Large",
    unit: "TRAY",
    price: "500",
    isAvailable: true,
    availableQuantity: "0",
    minQuantity: "1",
    useMarketplaceLocation: true,
    location: { province: "", district: "" },
  };
}

function formFromProduct(product: MarketplaceProduct): FormState {
  return {
    description: product.description ?? "",
    grade: product.grade ?? "Large",
    unit: toPriceUnit(product.unit),
    price: String(product.price ?? 0),
    isAvailable: product.isAvailable,
    availableQuantity: String(product.availableQuantity ?? 0),
    minQuantity: String(product.minQuantity ?? 1),
    useMarketplaceLocation: product.useMarketplaceLocation,
    location: product.location
      ? {
          province: product.location.province ?? "",
          district: product.location.district ?? "",
          sector: product.location.sector ?? undefined,
          cell: product.location.cell ?? undefined,
          village: product.location.village ?? undefined,
        }
      : { province: "", district: "" },
  };
}

type ProductFormModalProps = {
  open: boolean;
  product?: MarketplaceProduct | null;
  /** Sell confirms quantity and price. Edit opens the full product form. */
  intent?: "edit" | "sell";
  onClose: () => void;
  onSuccess?: (product: MarketplaceProduct, isUpdate: boolean) => void;
};

export function ProductFormModal({
  open,
  product = null,
  intent = "edit",
  onClose,
  onSuccess,
}: ProductFormModalProps) {
  const [createProduct, createState] = useCreateProductMutation();
  const [updateProduct, updateState] = useUpdateProductMutation();
  const [requestSell, requestSellState] = useRequestSellMutation();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [form, setForm] = useState<FormState>(() =>
    product ? formFromProduct(product) : emptyForm()
  );
  const [sellMode, setSellMode] = useState<"LOT" | "UNIT">("UNIT");
  const [error, setError] = useState<string | null>(null);
  const mode = !product ? "create" : intent === "sell" ? "sell" : "edit";
  const formKey = open ? `${product?.id ?? "create"}:${mode}` : "closed";
  const [formSession, setFormSession] = useState(formKey);

  if (formSession !== formKey) {
    setFormSession(formKey);
    if (open) {
      setForm(product ? formFromProduct(product) : emptyForm());
      setError(null);
    }
  }

  const busy =
    createState.isLoading ||
    updateState.isLoading ||
    requestSellState.isLoading;
  const isUpdate = Boolean(product);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    authService
      .getMe()
      .then((data) => {
        if (!cancelled) setMe(data);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const marketplaceLocationLabel = formatRwandaLocation(me?.profile?.location);
  const hasMarketplaceLocation = Boolean(me?.profile?.locationId);

  const gradeChoices = GRADE_OPTIONS.includes(
    form.grade as (typeof GRADE_OPTIONS)[number]
  )
    ? [...GRADE_OPTIONS]
    : form.grade
      ? [form.grade, ...GRADE_OPTIONS]
      : [...GRADE_OPTIONS];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);

    const description = form.description.trim();
    if (mode !== "sell" && !description) {
      setError("Description is required.");
      return;
    }
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid price (RWF).");
      return;
    }
    const availableQuantity = Number(form.availableQuantity) || 0;
    const minQuantity =
      mode === "sell" && sellMode === "LOT"
        ? availableQuantity
        : Number(form.minQuantity) || 0;
    if (!Number.isFinite(minQuantity) || minQuantity < 1) {
      setError("Minimum quantity must be at least 1.");
      return;
    }
    if (mode === "sell" && availableQuantity < 1) {
      setError("Enter a quantity of at least 1.");
      return;
    }
    if (availableQuantity > 0 && minQuantity > availableQuantity) {
      setError("Minimum quantity cannot exceed available quantity.");
      return;
    }
    if (
      mode !== "sell" &&
      form.useMarketplaceLocation &&
      !hasMarketplaceLocation
    ) {
      setError(
        "Set a profile / delivery location in Account first, or choose a different location."
      );
      return;
    }
    if (
      mode !== "sell" &&
      !form.useMarketplaceLocation &&
      (!form.location.province || !form.location.district)
    ) {
      setError("Select a province and district for the product location.");
      return;
    }

    const payload: CreateProductRequest =
      mode === "sell"
        ? {
            unit: form.unit,
            price,
            isAvailable: true,
            availableQuantity,
            minQuantity,
          }
        : {
            description,
            grade: form.grade.trim() || undefined,
            unit: form.unit,
            price,
            isAvailable: form.isAvailable,
            availableQuantity,
            minQuantity,
            useMarketplaceLocation: form.useMarketplaceLocation,
            location: form.useMarketplaceLocation
              ? undefined
              : {
                  province: form.location.province,
                  district: form.location.district,
                  sector: form.location.sector,
                  cell: form.location.cell,
                  village: form.location.village,
                },
          };

    try {
      const saved =
        mode === "sell" && product
          ? await requestSell({
              id: product.id,
              body: {
                unit: form.unit,
                price,
                availableQuantity,
                minQuantity,
                sellMode,
              },
            }).unwrap()
          : product
            ? await updateProduct({ id: product.id, body: payload }).unwrap()
            : await createProduct(payload).unwrap();
      onClose();
      onSuccess?.(saved, isUpdate);
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  if (mode === "sell" && product) {
    return (
      <div className="fixed inset-0 z-100 grid place-items-center overflow-y-auto bg-soko-navy/72 p-4 backdrop-blur-sm sm:p-6">
        <div className="relative my-auto w-full max-w-110 overflow-auto rounded-2.5 bg-white px-5 py-6 sm:px-8 sm:py-7">
          {busy ? <ActionOverlay label="Confirming sell…" /> : null}
          <button
            type="button"
            className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full border border-soko-line bg-white disabled:opacity-50 sm:top-4 sm:right-4"
            onClick={onClose}
            disabled={busy}
            aria-label="Close sell form"
          >
            <Icon name="close" />
          </button>
          <h2 className="m-0 pr-10 font-display text-[1.25rem] font-bold sm:text-[1.375rem]">
            Confirm sell order
          </h2>
          <p className="mt-1 mb-1 text-sm font-bold text-soko-ink">
            {product.name}
            {product.grade ? ` · ${product.grade}` : ""}
          </p>
          <p className="mt-0 mb-5 text-[0.6875rem] text-soko-muted">
            Choose whether one buyer takes the whole quantity, or buyers can
            take part of it.
          </p>
          <form className="grid gap-3" onSubmit={submit}>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["LOT", "Sell the lot", "One buyer takes the full quantity."],
                  [
                    "UNIT",
                    "Sell by unit",
                    "Buyers choose how many. The rest stays listed.",
                  ],
                ] as const
              ).map(([value, label, hint]) => {
                const selected = sellMode === value;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={busy}
                    onClick={() => setSellMode(value)}
                    className={`rounded-1.25 border px-3 py-2.5 text-left ${
                      selected
                        ? "border-soko-navy bg-soko-slate"
                        : "border-soko-line bg-white"
                    }`}
                  >
                    <span className="block text-[0.75rem] font-bold text-soko-ink">
                      {label}
                    </span>
                    <span className="mt-1 block text-[0.625rem] leading-snug text-soko-muted">
                      {hint}
                    </span>
                  </button>
                );
              })}
            </div>
            <Field label="Price (RWF)">
              <input
                className={fieldClass}
                type="number"
                min={0}
                step="1"
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, price: e.target.value }))
                }
                required
                disabled={busy}
              />
            </Field>
            <Field label={`Quantity (${form.unit.toLowerCase()})`}>
              <input
                className={fieldClass}
                type="number"
                min={0}
                value={form.availableQuantity}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    availableQuantity: e.target.value,
                  }))
                }
                required
                disabled={busy}
              />
            </Field>
            {sellMode === "UNIT" ? (
              <Field label="Minimum order">
                <input
                  className={fieldClass}
                  type="number"
                  min={1}
                  value={form.minQuantity}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      minQuantity: e.target.value,
                    }))
                  }
                  required
                  disabled={busy}
                />
              </Field>
            ) : (
              <p className="m-0 text-[0.6875rem] text-soko-muted">
                The buyer purchases this entire quantity. They cannot take part
                of it.
              </p>
            )}
            {error ? (
              <p className="m-0 text-[0.6875rem] text-[#b42318]">{error}</p>
            ) : null}
            <div className="mt-1 flex gap-2">
              <button
                type="submit"
                className={`${btn.sellCompact} min-w-0 flex-1 sm:px-5.5 sm:py-3.5`}
                disabled={busy}
              >
                {busy ? (
                  <ButtonLoader label="Saving…" />
                ) : (
                  <>
                    Confirm sell <Icon name="arrow" />
                  </>
                )}
              </button>
              <button
                type="button"
                className={`${btn.outline} shrink-0 px-3.5 py-2.75 text-sm`}
                onClick={onClose}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-100 grid place-items-center overflow-y-auto bg-soko-navy/72 p-4 backdrop-blur-sm sm:p-6">
      <div className="relative my-auto max-h-[min(94vh,100%)] w-full max-w-140 overflow-auto rounded-2.5 bg-white px-5 py-6 sm:px-8 sm:py-7">
        {busy ? <ActionOverlay label="Saving product…" /> : null}
        <button
          type="button"
          className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full border border-soko-line bg-white disabled:opacity-50 sm:top-4 sm:right-4"
          onClick={onClose}
          disabled={busy}
          aria-label="Close product form"
        >
          <Icon name="close" />
        </button>

        <h2 className="m-0 pr-10 font-display text-[1.25rem] font-bold sm:text-[1.375rem]">
          {isUpdate ? "Edit product" : "List product for sale"}
        </h2>
        <p className="mt-1 mb-5 text-[0.6875rem] text-soko-muted">
          Mark availability and where buyers can find this product.
        </p>

        <form
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          onSubmit={submit}
        >
          <div className="grid grid-cols-3 gap-2 sm:col-span-2 sm:gap-3">
            <Field label="Grade">
              <select
                className={fieldClass}
                value={form.grade}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, grade: e.target.value }))
                }
                disabled={busy}
              >
                {gradeChoices.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Price (RWF)">
              <input
                className={fieldClass}
                type="number"
                min={0}
                step="1"
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, price: e.target.value }))
                }
                placeholder="500"
                required
                disabled={busy}
              />
            </Field>

            <Field label="Unit">
              <select
                className={fieldClass}
                value={form.unit}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    unit: e.target.value as ProductPriceUnit,
                  }))
                }
                required
                disabled={busy}
                aria-label="Price unit"
              >
                {UNIT_OPTIONS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Available quantity">
            <input
              className={fieldClass}
              type="number"
              min={0}
              value={form.availableQuantity}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  availableQuantity: e.target.value,
                }))
              }
              required
              disabled={busy}
            />
          </Field>

          <Field label="Min quantity">
            <input
              className={fieldClass}
              type="number"
              min={1}
              value={form.minQuantity}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  minQuantity: e.target.value,
                }))
              }
              required
              disabled={busy}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea
                className={`${fieldClass} min-h-20 resize-y`}
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Shown on the marketplace listing"
                required
                disabled={busy}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-xs text-soko-ink sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  isAvailable: e.target.checked,
                }))
              }
              disabled={busy}
            />
            Mark as available
          </label>

          <label className="flex items-start gap-2 text-xs text-soko-ink sm:col-span-2">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={form.useMarketplaceLocation}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  useMarketplaceLocation: e.target.checked,
                }))
              }
              disabled={busy}
            />
            <span>
              Use my profile / delivery location
              {form.useMarketplaceLocation ? (
                <span className="mt-1 block text-soko-muted">
                  {marketplaceLocationLabel}
                </span>
              ) : null}
            </span>
          </label>

          {!form.useMarketplaceLocation ? (
            <div className="sm:col-span-2">
              <p className="m-0 mb-2 text-[0.625rem] font-bold tracking-wide text-soko-muted uppercase">
                Product location
              </p>
              <RwandaLocationFields
                value={form.location}
                onChange={(location) =>
                  setForm((prev) => ({ ...prev, location }))
                }
                disabled={busy}
                required
              />
            </div>
          ) : null}

          {error ? (
            <p className="m-0 text-[0.6875rem] text-[#b42318] sm:col-span-2">
              {error}
            </p>
          ) : null}

          <div className="mt-1 flex gap-2 sm:col-span-2">
            <button
              type="submit"
              className={`${btn.sellCompact} min-w-0 flex-1 sm:px-5.5 sm:py-3.5`}
              disabled={busy}
            >
              {busy ? (
                <ButtonLoader label="Saving…" />
              ) : (
                <>
                  {isUpdate ? "Save changes" : "List for sale"}{" "}
                  <Icon name="arrow" />
                </>
              )}
            </button>
            <button
              type="button"
              className={`${btn.outline} shrink-0 px-3.5 py-2.75 text-sm sm:min-w-28 sm:px-4.5`}
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function canListProduct(role: string) {
  return role === "supplier" || role === "aggregator";
}
