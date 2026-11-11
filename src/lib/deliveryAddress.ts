import type { MeLocation, MeResponse, RwandaLocationInput } from "@/types/auth";
import type { DeliveryAddressValue } from "@/components/forms/DeliveryAddressFields";

export function hasDeliveryAddress(
  location: MeLocation | DeliveryAddressValue | null | undefined
): boolean {
  if (!location) return false;
  return Boolean(location.province?.trim() && location.district?.trim());
}

/** Build the API location payload, including optional GPS coordinates. */
export function deliveryAddressToApiPayload(
  address: DeliveryAddressValue
): RwandaLocationInput {
  const latitude = address.latitude?.trim()
    ? Number(address.latitude)
    : undefined;
  const longitude = address.longitude?.trim()
    ? Number(address.longitude)
    : undefined;
  return {
    province: address.province,
    district: address.district,
    sector: address.sector,
    cell: address.cell,
    village: address.village,
    hood: address.hood?.trim() || undefined,
    latitude:
      latitude !== undefined && Number.isFinite(latitude)
        ? latitude
        : undefined,
    longitude:
      longitude !== undefined && Number.isFinite(longitude)
        ? longitude
        : undefined,
  };
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

/** Exact admin-name match after normalizing spelling noise. */
export function placeNamesExact(
  a: string | null | undefined,
  b: string | null | undefined
) {
  const left = normalizePlaceName(a);
  const right = normalizePlaceName(b);
  if (!left || !right) return false;
  return left === right;
}

/** Stable key so validation resets when address or coordinates change. */
export function addressValidationKey(
  address: DeliveryAddressValue | null | undefined
) {
  if (!address) return "";
  return [
    address.province,
    address.district,
    address.sector,
    address.cell,
    address.village,
    address.latitude,
    address.longitude,
  ]
    .map((part) => (part ?? "").trim().toLowerCase())
    .join("|");
}
