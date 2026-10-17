export type EggTypeSource = {
  name: string;
  grade?: string | null;
  size?: string | null;
  unit: string;
  availableQuantity: number;
  isAvailable?: boolean;
  isActive?: boolean;
};

/** Grade and size together, for example "A · Large". */
export function eggTypeLabel(product: {
  name: string;
  grade?: string | null;
  size?: string | null;
}) {
  const grade = product.grade?.trim() ?? "";
  const size = product.size?.trim() ?? "";
  if (grade && size && grade.toLowerCase() !== size.toLowerCase()) {
    return `${grade} · ${size}`;
  }
  if (grade) return grade;
  if (size) return size;
  return product.name.trim() || "Eggs";
}

export function productMatchesRequest(
  requestProduct: string,
  product: { name: string; grade?: string | null; size?: string | null }
) {
  const request = requestProduct.trim().toLowerCase();
  if (!request) return false;

  const label = eggTypeLabel(product).toLowerCase();
  const name = product.name.trim().toLowerCase();
  const grade = (product.grade ?? "").trim().toLowerCase();
  const size = (product.size ?? "").trim().toLowerCase();

  if (request === label || request === name) return true;
  if (grade && request === `fresh eggs · ${grade}`) return true;
  if (size && !grade && request === `fresh eggs · ${size}`) return true;

  const parts = request
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 2) {
    const [left, right] = parts;
    if (left === "fresh eggs") {
      return right === grade || right === label;
    }
    const traits = new Set([grade, size].filter(Boolean));
    return traits.has(left) && traits.has(right);
  }

  return request === grade || request === size;
}

function unitsMatch(productUnit: string, requestUnit: string) {
  const left = productUnit.trim().toLowerCase();
  const right = requestUnit.trim().toLowerCase().replace(/s$/, "");
  const normalized = left.replace(/s$/, "");
  return (
    normalized === right ||
    left.startsWith(right) ||
    right.startsWith(normalized)
  );
}

export function availableStock(
  products: EggTypeSource[],
  requestProduct: string,
  requestUnit: string
) {
  const matches = products.filter(
    (product) =>
      product.isActive !== false &&
      product.isAvailable !== false &&
      productMatchesRequest(requestProduct, product) &&
      unitsMatch(product.unit, requestUnit)
  );
  const quantity = matches.reduce(
    (sum, product) => sum + Number(product.availableQuantity || 0),
    0
  );
  return {
    quantity,
    label: matches[0]
      ? eggTypeLabel(matches[0])
      : requestProduct.trim() || "this type",
    unitLabel: requestUnit.trim().toLowerCase() || "units",
  };
}

export function stockShortfallMessage(input: {
  requestedQty: number;
  availableQty: number;
  label: string;
  unitLabel: string;
}) {
  if (input.requestedQty <= input.availableQty) return null;
  if (input.availableQty <= 0) {
    return `You have no ${input.label} in stock. Increase your stock before selling.`;
  }
  return `You have ${input.availableQty} ${input.unitLabel} of ${input.label}. Increase your stock before selling ${input.requestedQty}.`;
}

export type EggTypeGroup<T extends EggTypeSource> = {
  label: string;
  unit: string;
  quantity: number;
  products: T[];
};

export function groupByEggType<T extends EggTypeSource>(products: T[]) {
  const groups = new Map<string, EggTypeGroup<T>>();
  for (const product of products) {
    const label = eggTypeLabel(product);
    const key = `${label}|${product.unit}`;
    const existing = groups.get(key);
    if (existing) {
      existing.quantity += Number(product.availableQuantity || 0);
      existing.products.push(product);
    } else {
      groups.set(key, {
        label,
        unit: product.unit,
        quantity: Number(product.availableQuantity || 0),
        products: [product],
      });
    }
  }
  return Array.from(groups.values());
}
