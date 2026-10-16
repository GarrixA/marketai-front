"use client";

import { useState } from "react";
import {
  formatRwandaLocation,
  RwandaLocationFields,
  type RwandaLocationValue,
} from "@/components/forms/RwandaLocationFields";
import { Field, fieldClass } from "@/components/marketplace/uiBits";
import { btn } from "@/lib/ui";

export type DeliveryAddressValue = RwandaLocationValue & {
  hood?: string;
  latitude?: string;
  longitude?: string;
};

type Props = {
  value: Partial<DeliveryAddressValue> | null | undefined;
  onChange: (next: DeliveryAddressValue) => void;
  disabled?: boolean;
  required?: boolean;
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
    location.latitude != null && location.longitude != null
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

export function DeliveryAddressFields({
  value,
  onChange,
  disabled = false,
  required = false,
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
    onChange({ ...current, ...patch });
  };

  const getMyCoordinates = () => {
    if (disabled || geoBusy) return;
    setGeoError(null);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Geolocation is not supported in this browser.");
      return;
    }

    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        emit({
          latitude: roundCoord(position.coords.latitude),
          longitude: roundCoord(position.coords.longitude),
        });
        setGeoBusy(false);
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
        <Field label="Latitude (optional)">
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
          />
        </Field>
        <Field label="Longitude (optional)">
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
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`${btn.outline} text-[0.6875rem]`}
          onClick={getMyCoordinates}
          disabled={disabled || geoBusy}
        >
          {geoBusy ? "Getting coordinates…" : "Get my coordinates"}
        </button>
        {geoError ? (
          <p className="m-0 text-[0.6875rem] text-[#b42318]">{geoError}</p>
        ) : null}
      </div>
    </div>
  );
}
