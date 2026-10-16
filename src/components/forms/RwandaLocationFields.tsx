"use client";

import { useMemo } from "react";
import { rwandaLocation } from "@devrw/rwanda-location";
import { Field, fieldClass } from "@/components/marketplace/uiBits";

export type RwandaLocationValue = {
  province: string;
  district: string;
  sector?: string;
  cell?: string;
  village?: string;
};

type Props = {
  value: Partial<RwandaLocationValue> | null | undefined;
  onChange: (next: RwandaLocationValue) => void;
  disabled?: boolean;
  required?: boolean;
};

function matchName<T extends { name: string }>(
  items: T[],
  name: string | null | undefined
): T | undefined {
  if (!name) return undefined;
  const needle = name.trim().toLowerCase();
  return items.find((item) => item.name.toLowerCase() === needle);
}

export function formatRwandaLocation(
  location:
    | {
        province?: string | null;
        district?: string | null;
        sector?: string | null;
        cell?: string | null;
        village?: string | null;
        address?: string | null;
      }
    | null
    | undefined
) {
  if (!location) return "—";
  const parts = [
    location.village,
    location.cell,
    location.sector,
    location.district,
    location.province,
  ].filter((part): part is string => Boolean(part));
  if (!parts.length) return "—";
  return parts.join(", ");
}

export function RwandaLocationFields({
  value,
  onChange,
  disabled = false,
  required = false,
}: Props) {
  const provinces = useMemo(() => rwandaLocation.getProvinces(), []);

  const province = matchName(provinces, value?.province) ?? null;
  const districts = useMemo(
    () => (province ? rwandaLocation.getDistricts(province.code) : []),
    [province]
  );
  const district = matchName(districts, value?.district) ?? null;
  const sectors = useMemo(
    () => (district ? rwandaLocation.getSectors(district.code) : []),
    [district]
  );
  const sector = matchName(sectors, value?.sector) ?? null;
  const cells = useMemo(
    () => (sector ? rwandaLocation.getCells(sector.code) : []),
    [sector]
  );
  const cell = matchName(cells, value?.cell) ?? null;
  const villages = useMemo(
    () => (cell ? rwandaLocation.getVillages(cell.code) : []),
    [cell]
  );
  const village = matchName(villages, value?.village) ?? null;

  const emit = (next: Partial<RwandaLocationValue>) => {
    onChange({
      province: next.province ?? "",
      district: next.district ?? "",
      sector: next.sector,
      cell: next.cell,
      village: next.village,
    });
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={`Province${required ? " *" : ""}`}>
        <select
          className={`${fieldClass} disabled:opacity-60`}
          value={province?.code ?? ""}
          disabled={disabled}
          required={required}
          onChange={(e) => {
            const code = Number(e.target.value);
            const selected = provinces.find((p) => p.code === code);
            emit({
              province: selected?.name ?? "",
              district: "",
              sector: undefined,
              cell: undefined,
              village: undefined,
            });
          }}
        >
          <option value="">Select province</option>
          {provinces.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label={`District${required ? " *" : ""}`}>
        <select
          className={`${fieldClass} disabled:opacity-60`}
          value={district?.code ?? ""}
          disabled={disabled || !province}
          required={required}
          onChange={(e) => {
            const code = Number(e.target.value);
            const selected = districts.find((d) => d.code === code);
            emit({
              province: province?.name ?? "",
              district: selected?.name ?? "",
              sector: undefined,
              cell: undefined,
              village: undefined,
            });
          }}
        >
          <option value="">Select district</option>
          {districts.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Sector">
        <select
          className={`${fieldClass} disabled:opacity-60`}
          value={sector?.code ?? ""}
          disabled={disabled || !district}
          onChange={(e) => {
            const code = e.target.value;
            const selected = sectors.find((s) => s.code === code);
            emit({
              province: province?.name ?? "",
              district: district?.name ?? "",
              sector: selected?.name,
              cell: undefined,
              village: undefined,
            });
          }}
        >
          <option value="">Select sector</option>
          {sectors.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Cell">
        <select
          className={`${fieldClass} disabled:opacity-60`}
          value={cell?.code ?? ""}
          disabled={disabled || !sector}
          onChange={(e) => {
            const code = Number(e.target.value);
            const selected = cells.find((c) => c.code === code);
            emit({
              province: province?.name ?? "",
              district: district?.name ?? "",
              sector: sector?.name,
              cell: selected?.name,
              village: undefined,
            });
          }}
        >
          <option value="">Select cell</option>
          {cells.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Village">
        <select
          className={`${fieldClass} disabled:opacity-60`}
          value={village?.code ?? ""}
          disabled={disabled || !cell}
          onChange={(e) => {
            const code = Number(e.target.value);
            const selected = villages.find((v) => v.code === code);
            emit({
              province: province?.name ?? "",
              district: district?.name ?? "",
              sector: sector?.name,
              cell: cell?.name,
              village: selected?.name,
            });
          }}
        >
          <option value="">Select village</option>
          {villages.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
