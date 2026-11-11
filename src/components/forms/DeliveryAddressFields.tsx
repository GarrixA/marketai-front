"use client";

import { useEffect, useRef, useState } from "react";
import {
  formatRwandaLocation,
  RwandaLocationFields,
  type RwandaLocationValue,
} from "@/components/forms/RwandaLocationFields";
import { Field, fieldClass } from "@/components/marketplace/uiBits";
import { ButtonLoader } from "@/components/ActionLoader";
import { VillageDeliveryConfirmDialog } from "@/components/support/VillageDeliveryConfirmDialog";
import {
  addressValidationKey,
  placeNamesExact,
  placeNamesMatch,
} from "@/lib/deliveryAddress";
import { resolveRwandaLocationSelects } from "@/lib/resolveRwandaLocation";
import {
  lookupVillageByCoordinates,
  pickDeliveryPointInVillage,
  validateCoordinatesAgainstAddress,
} from "@/lib/validateRwandaCoordinates";
import { btn } from "@/lib/ui";

export type DeliveryAddressValue = RwandaLocationValue & {
  hood?: string;
  latitude?: string;
  longitude?: string;
};

type AddressPurpose = "delivery" | "pickup" | "both";

type Props = {
  value: Partial<DeliveryAddressValue> | null | undefined;
  onChange: (next: DeliveryAddressValue) => void;
  disabled?: boolean;
  required?: boolean;
  /** Show Validate address and report whether coords belong to the village. */
  requireValidation?: boolean;
  validated?: boolean;
  onValidatedChange?: (validated: boolean) => void;
  /** Wording for validate / confirm actions. */
  purpose?: AddressPurpose;
};

export function emptyDeliveryAddress(): DeliveryAddressValue {
  return {
    province: "",
    district: "",
    hood: "",
    latitude: "",
    longitude: "",
  };
}

export function deliveryAddressFromLocation(
  location:
    | {
        province?: string | null;
        district?: string | null;
        sector?: string | null;
        cell?: string | null;
        village?: string | null;
        hood?: string | null;
        latitude?: number | string | null;
        longitude?: number | string | null;
      }
    | null
    | undefined
): DeliveryAddressValue {
  if (!location) return emptyDeliveryAddress();
  return {
    province: location.province ?? "",
    district: location.district ?? "",
    sector: location.sector ?? undefined,
    cell: location.cell ?? undefined,
    village: location.village ?? undefined,
    hood: location.hood ?? "",
    latitude:
      location.latitude != null && location.latitude !== ""
        ? String(location.latitude)
        : "",
    longitude:
      location.longitude != null && location.longitude !== ""
        ? String(location.longitude)
        : "",
  };
}

export function formatDeliveryAddress(
  location:
    | {
        province?: string | null;
        district?: string | null;
        sector?: string | null;
        cell?: string | null;
        village?: string | null;
        hood?: string | null;
        latitude?: number | string | null;
        longitude?: number | string | null;
      }
    | null
    | undefined
) {
  const base = formatRwandaLocation(location);
  if (!location) return base;
  const extras = [
    location.hood,
    location.latitude != null &&
    location.latitude !== "" &&
    location.longitude != null &&
    location.longitude !== ""
      ? `${location.latitude}, ${location.longitude}`
      : null,
  ].filter(Boolean);
  if (!extras.length) return base;
  if (base === "—") return extras.join(" · ");
  return `${base} · ${extras.join(" · ")}`;
}

function roundCoord(value: number) {
  return value.toFixed(7);
}

function addressPatchFromLookup(
  lookup: {
    province?: string | null;
    district?: string | null;
    sector?: string | null;
    cell?: string | null;
    village?: string | null;
  },
  coords?: { latitude: string; longitude: string }
): Partial<DeliveryAddressValue> {
  const resolved = resolveRwandaLocationSelects(lookup);
  if (resolved?.province && resolved.district) {
    return { ...resolved, ...coords };
  }
  return {
    province: lookup.province ?? "",
    district: lookup.district ?? "",
    sector: lookup.sector ?? undefined,
    cell: lookup.cell ?? undefined,
    village: lookup.village ?? undefined,
    ...coords,
  };
}

/** Validate that GPS coordinates sit inside the selected village boundary. */
export function AddressValidationControls({
  address,
  disabled = false,
  validated = false,
  onValidatedChange,
  onCoordinatesChange,
  onResolvedAddress,
  purpose = "delivery",
}: {
  address: DeliveryAddressValue;
  disabled?: boolean;
  validated?: boolean;
  onValidatedChange?: (validated: boolean) => void;
  /** @deprecated Prefer onResolvedAddress so province→village stay in sync with GPS. */
  onCoordinatesChange?: (coords: {
    latitude: string;
    longitude: string;
  }) => void;
  onResolvedAddress?: (patch: Partial<DeliveryAddressValue>) => void;
  purpose?: AddressPurpose;
}) {
  const [busy, setBusy] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [mismatchOpen, setMismatchOpen] = useState(false);
  const [mismatchMessage, setMismatchMessage] = useState("");
  const skipNextReset = useRef(false);
  const key = addressValidationKey(address);
  const villageName = address.village?.trim() || "the selected village";
  const selectedAddressLabel = formatRwandaLocation(address);
  const delivered = validated || ok;

  useEffect(() => {
    if (skipNextReset.current) {
      skipNextReset.current = false;
      return;
    }
    setMessage(null);
    setOk(false);
    setMismatchOpen(false);
    onValidatedChange?.(false);
    // Only reset when the address fingerprint changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const applyResolved = (patch: Partial<DeliveryAddressValue>) => {
    skipNextReset.current = true;
    if (onResolvedAddress) {
      onResolvedAddress(patch);
      return;
    }
    if (patch.latitude != null && patch.longitude != null) {
      onCoordinatesChange?.({
        latitude: patch.latitude,
        longitude: patch.longitude,
      });
    }
  };

  const markDelivered = (village: string) => {
    setOk(true);
    setMessage(
      purpose === "pickup"
        ? `Pickup confirmed in ${village}.`
        : purpose === "both"
          ? `Delivery / pickup confirmed in ${village}.`
          : `You will be delivered in ${village}.`
    );
    onValidatedChange?.(true);
  };

  const openConfirmModal = (reason: string) => {
    setMismatchMessage(reason);
    setMismatchOpen(true);
    setOk(false);
    setMessage(null);
    onValidatedChange?.(false);
  };

  const validate = async () => {
    if (disabled || busy || confirmBusy) return;
    setMessage(null);
    setOk(false);
    onValidatedChange?.(false);

    if (!address.village?.trim()) {
      setMessage("Select a village before validating the address.");
      return;
    }

    const lat = address.latitude?.trim() ? Number(address.latitude) : NaN;
    const lng = address.longitude?.trim() ? Number(address.longitude) : NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      openConfirmModal(
        purpose === "pickup"
          ? "No valid latitude and longitude yet. Confirm pickup in this village and we will set coordinates inside it, or use Get my current address first."
          : purpose === "both"
            ? "No valid latitude and longitude yet. Confirm this village for delivery / pickup and we will set coordinates inside it, or use Get my current address first."
            : "No valid latitude and longitude yet. Confirm delivery in this village and we will set coordinates inside it, or use Get my current address first."
      );
      return;
    }

    setBusy(true);
    try {
      const result = await validateCoordinatesAgainstAddress({
        latitude: lat,
        longitude: lng,
        province: address.province,
        district: address.district,
        sector: address.sector,
        cell: address.cell,
        village: address.village,
      });
      if (result.ok && result.lookup) {
        // Keep dropdowns aligned with the GPS village so Save does not re-fail.
        applyResolved(
          addressPatchFromLookup(result.lookup, {
            latitude: roundCoord(lat),
            longitude: roundCoord(lng),
          })
        );
        markDelivered(result.lookup.village?.trim() || address.village.trim());
        return;
      }
      // Coords belong elsewhere (or failed lookup) — confirm using the selected path.
      const foundLabel = result.lookup
        ? formatRwandaLocation(result.lookup)
        : null;
      const selectedLabel =
        selectedAddressLabel !== "—"
          ? selectedAddressLabel
          : address.village.trim();
      openConfirmModal(
        foundLabel
          ? `Current coordinates are in ${foundLabel}, which is not your selected ${selectedLabel}. Confirm to move the pin into your selected address.`
          : result.message ||
              "Coordinates do not match the selected address. Confirm to set the pin inside your selected village."
      );
    } catch {
      openConfirmModal(
        purpose === "pickup"
          ? "Village boundary lookup failed. Confirm pickup in this village and we will set coordinates inside it, or try again."
          : "Village boundary lookup failed. Confirm delivery in this village and we will set coordinates inside it, or try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmVillageDelivery = async () => {
    if (confirmBusy || !address.village?.trim()) return;
    setConfirmBusy(true);
    try {
      const selected = {
        village: address.village,
        province: address.province,
        district: address.district,
        sector: address.sector,
        cell: address.cell,
      };
      const point = await pickDeliveryPointInVillage(selected);
      const latitude = roundCoord(point.latitude);
      const longitude = roundCoord(point.longitude);
      const lookup = await lookupVillageByCoordinates(
        point.latitude,
        point.longitude
      );
      const matchesSelected = Boolean(
        lookup &&
        placeNamesExact(lookup.village, selected.village) &&
        (!selected.province?.trim() ||
          placeNamesMatch(selected.province, lookup.province)) &&
        (!selected.district?.trim() ||
          placeNamesMatch(selected.district, lookup.district)) &&
        (!selected.sector?.trim() ||
          placeNamesMatch(selected.sector, lookup.sector)) &&
        (!selected.cell?.trim() || placeNamesMatch(selected.cell, lookup.cell))
      );

      // Keep the user's selected hierarchy; only sync dropdowns from GPS when
      // the point truly sits in that same village admin path.
      applyResolved(
        matchesSelected && lookup
          ? addressPatchFromLookup(lookup, { latitude, longitude })
          : { latitude, longitude }
      );
      setMismatchOpen(false);
      markDelivered(
        point.village?.trim() ||
          lookup?.village?.trim() ||
          address.village.trim()
      );
    } catch (err) {
      setMismatchOpen(false);
      setOk(false);
      setMessage(
        err instanceof Error
          ? err.message
          : "Could not set coordinates inside the selected village."
      );
      onValidatedChange?.(false);
    } finally {
      setConfirmBusy(false);
    }
  };

  return (
    <>
      <div className="rounded-1.25 border border-soko-line bg-[#f9fafb] px-3 py-3">
        {delivered ? (
          <p className="m-0 text-[0.75rem] font-semibold text-[#027a48]">
            {message ||
              (purpose === "pickup"
                ? `Pickup confirmed in ${villageName}.`
                : purpose === "both"
                  ? `Delivery / pickup confirmed in ${villageName}.`
                  : `You will be delivered in ${villageName}.`)}
          </p>
        ) : (
          <>
            <p className="m-0 text-[0.6875rem] text-soko-muted">
              {purpose === "pickup"
                ? "Validate that your coordinates match the selected village, or confirm pickup there if they differ."
                : purpose === "both"
                  ? "Validate that your coordinates match the selected village, or confirm this delivery / pickup location if they differ."
                  : "Validate that your coordinates match the selected village, or confirm delivery there if they differ."}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={`${btn.outline} text-[0.6875rem]`}
                onClick={() => void validate()}
                disabled={disabled || busy || confirmBusy}
              >
                {busy ? (
                  <ButtonLoader label="Validating…" />
                ) : (
                  "Validate address"
                )}
              </button>
              <span className="text-[0.6875rem] text-soko-muted">
                Not validated yet
              </span>
            </div>
            {message ? (
              <p className="m-0 mt-2 text-[0.6875rem] text-[#b42318]">
                {message}
              </p>
            ) : null}
          </>
        )}
      </div>

      <VillageDeliveryConfirmDialog
        open={mismatchOpen}
        villageName={villageName}
        selectedAddressLabel={
          selectedAddressLabel !== "—" ? selectedAddressLabel : villageName
        }
        mismatchMessage={mismatchMessage}
        busy={confirmBusy}
        purpose={purpose}
        onCancel={() => setMismatchOpen(false)}
        onConfirm={() => void confirmVillageDelivery()}
      />
    </>
  );
}

export function DeliveryAddressFields({
  value,
  onChange,
  disabled = false,
  required = false,
  requireValidation = false,
  validated = false,
  onValidatedChange,
  purpose = "delivery",
}: Props) {
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const current: DeliveryAddressValue = {
    province: value?.province ?? "",
    district: value?.district ?? "",
    sector: value?.sector,
    cell: value?.cell,
    village: value?.village,
    hood: value?.hood ?? "",
    latitude: value?.latitude ?? "",
    longitude: value?.longitude ?? "",
  };

  const emit = (patch: Partial<DeliveryAddressValue>) => {
    onValidatedChange?.(false);
    onChange({ ...current, ...patch });
  };

  const getMyCurrentAddress = () => {
    if (disabled || geoBusy) return;
    setGeoError(null);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Geolocation is not supported in this browser.");
      return;
    }

    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = roundCoord(position.coords.latitude);
        const longitude = roundCoord(position.coords.longitude);
        const lat = Number(latitude);
        const lng = Number(longitude);

        try {
          const lookup = await lookupVillageByCoordinates(lat, lng);
          const resolved = lookup ? resolveRwandaLocationSelects(lookup) : null;

          if (resolved?.province && resolved.district) {
            emit({
              ...resolved,
              latitude,
              longitude,
            });
            if (resolved.village) {
              setGeoError(null);
            } else {
              setGeoError(
                "Location found. Confirm sector, cell, and village if any are still empty."
              );
            }
          } else if (lookup?.province || lookup?.district) {
            // Fallback to raw lookup names if cascade mapping failed.
            emit({
              province: lookup.province ?? "",
              district: lookup.district ?? "",
              sector: lookup.sector ?? undefined,
              cell: lookup.cell ?? undefined,
              village: lookup.village ?? undefined,
              latitude,
              longitude,
            });
            setGeoError(
              "Coordinates saved. Some dropdowns may need a manual selection."
            );
          } else {
            emit({ latitude, longitude });
            setGeoError(
              "Coordinates saved. Select province and district if they were not filled automatically."
            );
          }
        } catch {
          emit({ latitude, longitude });
          setGeoError(
            "Coordinates saved, but address lookup failed. Select your location manually."
          );
        } finally {
          setGeoBusy(false);
        }
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied. Allow location access and try again."
            : error.code === error.POSITION_UNAVAILABLE
              ? "Location unavailable. Try again outdoors or check device settings."
              : "Timed out while getting your location. Try again.";
        setGeoError(message);
        setGeoBusy(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`${btn.outline} text-[0.6875rem]`}
          onClick={getMyCurrentAddress}
          disabled={disabled || geoBusy}
        >
          {geoBusy ? "Getting current address…" : "Get my current address"}
        </button>
        {geoError ? (
          <p className="m-0 text-[0.6875rem] text-[#b42318]">{geoError}</p>
        ) : null}
      </div>

      <RwandaLocationFields
        value={value}
        onChange={(next) => emit(next)}
        disabled={disabled}
        required={required}
      />

      <Field label="Hood (optional)">
        <input
          className={`${fieldClass} disabled:opacity-60`}
          value={value?.hood ?? ""}
          onChange={(e) => emit({ hood: e.target.value })}
          placeholder="Neighborhood / hood"
          disabled={disabled}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label={
            requireValidation ? "Latitude (required)" : "Latitude (optional)"
          }
        >
          <input
            className={`${fieldClass} disabled:opacity-60`}
            type="number"
            step="any"
            min={-90}
            max={90}
            value={value?.latitude ?? ""}
            onChange={(e) => emit({ latitude: e.target.value })}
            placeholder="-1.9536000"
            disabled={disabled}
            required={requireValidation}
          />
        </Field>
        <Field
          label={
            requireValidation ? "Longitude (required)" : "Longitude (optional)"
          }
        >
          <input
            className={`${fieldClass} disabled:opacity-60`}
            type="number"
            step="any"
            min={-180}
            max={180}
            value={value?.longitude ?? ""}
            onChange={(e) => emit({ longitude: e.target.value })}
            placeholder="30.0605000"
            disabled={disabled}
            required={requireValidation}
          />
        </Field>
      </div>

      {requireValidation ? (
        <AddressValidationControls
          address={current}
          disabled={disabled}
          validated={validated}
          purpose={purpose}
          onValidatedChange={onValidatedChange}
          onResolvedAddress={(patch) => {
            // Do not clear validation here — markDelivered follows immediately.
            onChange({ ...current, ...patch });
          }}
        />
      ) : null}
    </div>
  );
}
