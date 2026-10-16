import type { MeLocation, MeResponse } from "@/types/auth";
import type { DeliveryAddressValue } from "@/components/forms/DeliveryAddressFields";

export function hasDeliveryAddress(
  location: MeLocation | DeliveryAddressValue | null | undefined
): boolean {
  if (!location) return false;
  return Boolean(location.province?.trim() && location.district?.trim());
}

export function profileHasDeliveryAddress(me: MeResponse | null | undefined) {
  return hasDeliveryAddress(me?.profile?.location ?? null);
}

/** Same address the account page shows as Business location. */
export function resolveBusinessLocation(me: MeResponse | null | undefined) {
  const aggregator = me?.aggregatorProfile;
  if (aggregator && !aggregator.useMarketplaceLocation) {
    return hasDeliveryAddress(aggregator.location) ? aggregator.location : null;
  }
  if (hasDeliveryAddress(me?.profile?.location)) {
    return me?.profile?.location ?? null;
  }
  return null;
}

export function formatBusinessLocation(me: MeResponse | null | undefined) {
  const location = resolveBusinessLocation(me);
  if (!location) return "";
  const parts = [
    location.village,
    location.cell,
    location.sector,
    location.district,
    location.province,
  ].filter((part): part is string => Boolean(part?.trim()));
  if (!parts.length) return "";
  const extras = [
    location.hood?.trim(),
    location.latitude != null && location.longitude != null
      ? `${location.latitude}, ${location.longitude}`
      : null,
  ].filter((part): part is string => Boolean(part));
  if (!extras.length) return parts.join(", ");
  return `${parts.join(", ")} · ${extras.join(" · ")}`;
}

export function normalizePlaceName(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/city of\s+/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function placeNamesMatch(
  a: string | null | undefined,
  b: string | null | undefined
) {
  const left = normalizePlaceName(a);
  const right = normalizePlaceName(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}
