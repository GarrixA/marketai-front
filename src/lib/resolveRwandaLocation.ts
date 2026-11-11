import { rwandaLocation } from "@devrw/rwanda-location";
import { normalizePlaceName, placeNamesMatch } from "@/lib/deliveryAddress";
import type { RwandaLocationValue } from "@/components/forms/RwandaLocationFields";

type Named = { name: string; code: string | number };

function matchNamed<T extends Named>(
  items: T[],
  name: string | null | undefined
): T | undefined {
  if (!name?.trim()) return undefined;
  const needle = normalizePlaceName(name);
  return (
    items.find((item) => normalizePlaceName(item.name) === needle) ??
    items.find((item) => placeNamesMatch(item.name, name))
  );
}

/** Map geodata province labels onto @devrw/rwanda-location names. */
function mapProvinceName(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const n = normalizePlaceName(raw);
  if (n.includes("kigali")) return "KIGALI";
  if (n.includes("south")) return "SOUTH";
  if (n.includes("west")) return "WEST";
  if (n.includes("north")) return "NORTH";
  if (n.includes("east")) return "EAST";
  return raw.trim();
}

/**
 * Resolve a geodata/admin lookup into exact select option names so
 * province → village dropdowns fill correctly.
 */
export function resolveRwandaLocationSelects(input: {
  province?: string | null;
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
}): RwandaLocationValue | null {
  const provinces = rwandaLocation.getProvinces();
  const provinceName = mapProvinceName(input.province) ?? input.province;
  const province = matchNamed(provinces, provinceName);
  if (!province) return null;

  const districts = rwandaLocation.getDistricts(province.code);
  const district = matchNamed(districts, input.district);
  if (!district) {
    return { province: province.name, district: "" };
  }

  const sectors = rwandaLocation.getSectors(district.code);
  const sector = matchNamed(sectors, input.sector);
  if (!sector) {
    return {
      province: province.name,
      district: district.name,
    };
  }

  const cells = rwandaLocation.getCells(sector.code);
  const cell = matchNamed(cells, input.cell);
  if (!cell) {
    return {
      province: province.name,
      district: district.name,
      sector: sector.name,
    };
  }

  const villages = rwandaLocation.getVillages(cell.code);
  const village = matchNamed(villages, input.village);

  return {
    province: province.name,
    district: district.name,
    sector: sector.name,
    cell: cell.name,
    village: village?.name,
  };
}
