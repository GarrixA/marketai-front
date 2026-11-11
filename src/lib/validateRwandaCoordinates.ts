import {
  normalizePlaceName,
  placeNamesExact,
  placeNamesMatch,
} from "@/lib/deliveryAddress";

export type RwandaAdminLookup = {
  province: string | null;
  district: string | null;
  sector: string | null;
  cell: string | null;
  village: string | null;
};

export type CoordinateVillageCheck = {
  ok: boolean;
  lookup: RwandaAdminLookup | null;
  mismatches: string[];
  message: string;
};

export type VillageDeliveryPoint = {
  latitude: number;
  longitude: number;
  source: "road" | "centroid";
  village: string;
};

type VillageAdminFilter = {
  village: string;
  province?: string | null;
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
};

const VILLAGE_BOUNDARY_QUERY =
  "https://geodata.rw/server/rest/services/village_boundary/FeatureServer/2/query";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

function sqlString(value: string) {
  return value.replace(/'/g, "''");
}

/** UI labels → geodata.rw province spellings (exact UPPER match). */
function geodataProvinceAliases(province?: string | null): string[] {
  if (!province?.trim()) return [];
  const n = normalizePlaceName(province);
  if (n.includes("kigali")) {
    return ["City of Kigali", "Kigali", "KIGALI"];
  }
  if (n.includes("east")) {
    return ["Eastern Province", "East", "EAST"];
  }
  if (n.includes("west")) {
    return ["Western Province", "West", "WEST"];
  }
  if (n.includes("north")) {
    return ["Northern Province", "North", "NORTH"];
  }
  if (n.includes("south")) {
    return ["Southern Province", "South", "SOUTH"];
  }
  return [province.trim()];
}

function buildVillageWhere(input: VillageAdminFilter) {
  const parts = [`UPPER(village)=UPPER('${sqlString(input.village.trim())}')`];
  if (input.district?.trim()) {
    parts.push(`UPPER(district)=UPPER('${sqlString(input.district.trim())}')`);
  }
  if (input.sector?.trim()) {
    parts.push(`UPPER(sector)=UPPER('${sqlString(input.sector.trim())}')`);
  }
  if (input.cell?.trim()) {
    parts.push(`UPPER(cell)=UPPER('${sqlString(input.cell.trim())}')`);
  }
  const provinceAliases = geodataProvinceAliases(input.province);
  if (provinceAliases.length === 1) {
    parts.push(`UPPER(province)=UPPER('${sqlString(provinceAliases[0])}')`);
  } else if (provinceAliases.length > 1) {
    parts.push(
      `(${provinceAliases
        .map((alias) => `UPPER(province)=UPPER('${sqlString(alias)}')`)
        .join(" OR ")})`
    );
  }
  return parts.join(" AND ");
}

function featureMatchesAdmin(
  attrs: Record<string, string | null | undefined> | undefined,
  input: VillageAdminFilter
) {
  if (!attrs) return false;
  if (!placeNamesExact(attrs.village, input.village)) return false;
  if (
    input.district?.trim() &&
    !placeNamesMatch(input.district, attrs.district)
  ) {
    return false;
  }
  if (input.sector?.trim() && !placeNamesMatch(input.sector, attrs.sector)) {
    return false;
  }
  if (input.cell?.trim() && !placeNamesMatch(input.cell, attrs.cell)) {
    return false;
  }
  if (
    input.province?.trim() &&
    !placeNamesMatch(input.province, attrs.province)
  ) {
    return false;
  }
  return true;
}

function hasAdminScope(input: VillageAdminFilter) {
  return Boolean(
    input.province?.trim() ||
    input.district?.trim() ||
    input.sector?.trim() ||
    input.cell?.trim()
  );
}

export async function lookupVillageByCoordinates(
  latitude: number,
  longitude: number
): Promise<RwandaAdminLookup | null> {
  const geometry = JSON.stringify({
    x: longitude,
    y: latitude,
    spatialReference: { wkid: 4326 },
  });

  const params = new URLSearchParams({
    geometry,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "village,province,district,sector,cell",
    returnGeometry: "false",
    f: "json",
  });

  const response = await fetch(
    `${VILLAGE_BOUNDARY_QUERY}?${params.toString()}`
  );
  if (!response.ok) {
    throw new Error(
      "Could not look up coordinates against Rwanda village boundaries."
    );
  }

  const data = (await response.json()) as {
    error?: { message?: string };
    features?: Array<{
      attributes?: Record<string, string | null>;
    }>;
  };

  if (data.error?.message) {
    throw new Error(data.error.message);
  }

  const attrs = data.features?.[0]?.attributes;
  if (!attrs) return null;

  return {
    province: attrs.province ?? null,
    district: attrs.district ?? null,
    sector: attrs.sector ?? null,
    cell: attrs.cell ?? null,
    village: attrs.village ?? null,
  };
}

export async function validateCoordinatesAgainstAddress(input: {
  latitude: number;
  longitude: number;
  province?: string | null;
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
}): Promise<CoordinateVillageCheck> {
  const lookup = await lookupVillageByCoordinates(
    input.latitude,
    input.longitude
  );

  if (!lookup) {
    return {
      ok: false,
      lookup: null,
      mismatches: ["location"],
      message:
        "Those coordinates do not fall inside a known Rwanda village boundary.",
    };
  }

  if (!input.village?.trim()) {
    return {
      ok: false,
      lookup,
      mismatches: ["village"],
      message:
        "Select a village, then validate that the coordinates belong to it.",
    };
  }

  // Village must match exactly — coordinates must sit inside that village.
  if (!placeNamesExact(input.village, lookup.village)) {
    return {
      ok: false,
      lookup,
      mismatches: ["village"],
      message: `Coordinates belong to ${[
        lookup.village,
        lookup.cell,
        lookup.sector,
        lookup.district,
      ]
        .filter(Boolean)
        .join(", ")}, not the selected village “${input.village.trim()}”.`,
    };
  }

  const checks: Array<[string, string | null | undefined, string | null]> = [
    ["province", input.province, lookup.province],
    ["district", input.district, lookup.district],
    ["sector", input.sector, lookup.sector],
    ["cell", input.cell, lookup.cell],
  ];

  const mismatches = checks
    .filter(
      ([, selected, found]) =>
        Boolean(selected?.trim()) && !placeNamesMatch(selected, found)
    )
    .map(([label]) => label);

  if (mismatches.length === 0) {
    return {
      ok: true,
      lookup,
      mismatches: [],
      message: `Validated: coordinates belong to village ${lookup.village}${
        lookup.cell ? ` (${lookup.cell})` : ""
      }.`,
    };
  }

  return {
    ok: false,
    lookup,
    mismatches: ["village", ...mismatches],
    message: `Coordinates look like ${[
      lookup.village,
      lookup.cell,
      lookup.sector,
      lookup.district,
      lookup.province,
    ]
      .filter(Boolean)
      .join(
        ", "
      )}, which does not match your selected ${mismatches.join(", ")}.`,
  };
}

async function fetchVillageCentroid(input: VillageAdminFilter): Promise<{
  latitude: number;
  longitude: number;
  village: string;
  lookup: RwandaAdminLookup;
} | null> {
  const params = new URLSearchParams({
    where: buildVillageWhere(input),
    outFields: "village,province,district,sector,cell",
    returnGeometry: "false",
    returnCentroid: "true",
    outSR: "4326",
    resultRecordCount: "10",
    f: "json",
  });

  const response = await fetch(
    `${VILLAGE_BOUNDARY_QUERY}?${params.toString()}`
  );
  if (!response.ok) {
    throw new Error("Could not look up the selected village boundary.");
  }

  const data = (await response.json()) as {
    error?: { message?: string };
    features?: Array<{
      attributes?: Record<string, string | null>;
      centroid?: { x: number; y: number };
    }>;
  };

  if (data.error?.message) throw new Error(data.error.message);

  const feature =
    data.features?.find((row) => featureMatchesAdmin(row.attributes, input)) ??
    null;

  const centroid = feature?.centroid;
  if (
    !feature ||
    !centroid ||
    !Number.isFinite(centroid.x) ||
    !Number.isFinite(centroid.y)
  ) {
    return null;
  }

  const attrs = feature.attributes ?? {};
  return {
    latitude: centroid.y,
    longitude: centroid.x,
    village: attrs.village?.trim() || input.village.trim(),
    lookup: {
      province: attrs.province ?? null,
      district: attrs.district ?? null,
      sector: attrs.sector ?? null,
      cell: attrs.cell ?? null,
      village: attrs.village ?? null,
    },
  };
}

async function findRoadPointNear(
  latitude: number,
  longitude: number,
  input: VillageAdminFilter
): Promise<{ latitude: number; longitude: number } | null> {
  const query = `
[out:json][timeout:15];
way["highway"~"primary|secondary|tertiary|residential|unclassified|service|living_street"](around:900,${latitude},${longitude});
out geom 8;
`.trim();

  try {
    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      elements?: Array<{
        type: string;
        geometry?: Array<{ lat: number; lon: number }>;
      }>;
    };

    const candidates =
      data.elements
        ?.flatMap((element) => element.geometry ?? [])
        .filter(
          (point) => Number.isFinite(point.lat) && Number.isFinite(point.lon)
        ) ?? [];

    if (!candidates.length) return null;

    // Prefer a mid-segment road point, then verify it still sits in the village.
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    for (const point of shuffled.slice(0, 12)) {
      const lookup = await lookupVillageByCoordinates(point.lat, point.lon);
      if (
        lookup &&
        featureMatchesAdmin(
          {
            village: lookup.village,
            province: lookup.province,
            district: lookup.district,
            sector: lookup.sector,
            cell: lookup.cell,
          },
          input
        )
      ) {
        return { latitude: point.lat, longitude: point.lon };
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Pick delivery coordinates inside the selected village.
 * Prefers a nearby road point when Overpass finds one; otherwise uses the village centroid.
 */
export async function pickDeliveryPointInVillage(
  input: VillageAdminFilter
): Promise<VillageDeliveryPoint> {
  if (!input.village?.trim()) {
    throw new Error("Select a village before confirming delivery.");
  }

  const centroid = await fetchVillageCentroid(input);
  if (!centroid) {
    // Only fall back to village name alone when no admin hierarchy was chosen.
    // Ambiguous names like Itaba must not jump provinces.
    if (hasAdminScope(input)) {
      const selected = [
        input.village,
        input.cell,
        input.sector,
        input.district,
        input.province,
      ]
        .filter((part) => Boolean(part?.trim()))
        .join(", ");
      throw new Error(
        `Could not find map boundaries for “${selected}”. Check the selected province, district, sector, cell, and village.`
      );
    }

    const loose = await fetchVillageCentroid({ village: input.village });
    if (!loose) {
      throw new Error(
        `Could not find map boundaries for village “${input.village.trim()}”.`
      );
    }
    const road = await findRoadPointNear(loose.latitude, loose.longitude, {
      village: input.village,
    });
    if (road) {
      return { ...road, source: "road", village: loose.village };
    }
    return {
      latitude: loose.latitude,
      longitude: loose.longitude,
      source: "centroid",
      village: loose.village,
    };
  }

  const road = await findRoadPointNear(
    centroid.latitude,
    centroid.longitude,
    input
  );
  if (road) {
    return { ...road, source: "road", village: centroid.village };
  }

  // Tiny jitter so repeated confirms are not identical pins on the exact centroid.
  const jitterLat = (Math.random() - 0.5) * 0.0008;
  const jitterLng = (Math.random() - 0.5) * 0.0008;
  return {
    latitude: centroid.latitude + jitterLat,
    longitude: centroid.longitude + jitterLng,
    source: "centroid",
    village: centroid.village,
  };
}

/** True when the mismatch is specifically about the selected village. */
export function isVillageMismatch(result: CoordinateVillageCheck) {
  return result.mismatches.includes("village") && Boolean(result.message);
}
