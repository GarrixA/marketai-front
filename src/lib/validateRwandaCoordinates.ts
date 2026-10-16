import { placeNamesMatch } from "@/lib/deliveryAddress";

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

const VILLAGE_BOUNDARY_QUERY =
  "https://geodata.rw/server/rest/services/village_boundary/FeatureServer/2/query";

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

  const checks: Array<[string, string | null | undefined, string | null]> = [
    ["province", input.province, lookup.province],
    ["district", input.district, lookup.district],
    ["sector", input.sector, lookup.sector],
    ["cell", input.cell, lookup.cell],
    ["village", input.village, lookup.village],
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
      message: `Coordinates match ${[
        lookup.village,
        lookup.cell,
        lookup.sector,
        lookup.district,
      ]
        .filter(Boolean)
        .join(", ")}.`,
    };
  }

  return {
    ok: false,
    lookup,
    mismatches,
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
