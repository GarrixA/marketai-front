import type { ProductListing } from "@/lib/listings";

export type QuantityFilter = "" | "10-50" | "50-200" | "200+";

export type ListingSearchFilters = {
  query: string;
  location: string;
  quantity: QuantityFilter;
  category: string;
};

export const EMPTY_SEARCH_FILTERS: ListingSearchFilters = {
  query: "",
  location: "",
  quantity: "",
  category: "",
};

export const SEARCH_CATEGORIES = [
  "Any category",
  "Eggs",
  "Specialty eggs",
] as const;

const SYNONYMS: Record<string, string[]> = {
  egg: ["eggs", "tray", "trays", "poultry", "layers"],
  eggs: ["egg", "tray", "trays", "poultry", "layers"],
  tray: ["trays", "egg", "eggs"],
  trays: ["tray", "egg", "eggs"],
  large: ["eggs", "grade"],
  medium: ["eggs", "grade"],
  small: ["eggs", "grade"],
  organic: ["specialty", "eggs", "free-range"],
  "free-range": ["organic", "specialty", "eggs"],
  specialty: ["organic", "free-range", "eggs"],
  musanze: ["growers", "hub", "depot"],
  aggregator: ["hub", "depot", "northern"],
  supplier: ["farm", "growers", "co-op", "coop"],
  maize: ["corn", "grain", "grains", "yellow"],
  corn: ["maize", "grain", "grains"],
  grain: ["maize", "corn", "rice", "paddy", "grains"],
  grains: ["maize", "corn", "rice", "paddy", "grain"],
  vegetable: ["produce", "vegetables", "veggies", "greens", "lettuce", "tomato"],
  vegetables: ["produce", "vegetable", "veggies", "greens", "lettuce", "tomato"],
  veggies: ["produce", "vegetable", "vegetables", "greens"],
  produce: ["vegetable", "vegetables", "veggies", "greens", "fresh", "lettuce", "potato", "tomato"],
  tomato: ["tomatoes", "produce", "roma"],
  tomatoes: ["tomato", "produce", "roma"],
  banana: ["bananas", "fruit", "cavendish"],
  bananas: ["banana", "fruit", "cavendish"],
  avocado: ["avocados", "fruit", "hass"],
  avocados: ["avocado", "fruit", "hass"],
  fruit: ["banana", "bananas", "avocado", "avocados", "cavendish", "hass"],
  bean: ["beans", "pulses", "pulse"],
  beans: ["bean", "pulses", "pulse", "red"],
  pulse: ["pulses", "bean", "beans"],
  pulses: ["pulse", "bean", "beans"],
  potato: ["potatoes", "irish", "produce"],
  potatoes: ["potato", "irish", "produce"],
  rice: ["paddy", "grain", "grains"],
  paddy: ["rice", "grain", "grains"],
  lettuce: ["greens", "greenhouse", "produce", "vegetables"],
  greens: ["lettuce", "produce", "vegetables"],
  dry: ["packed", "goods", "dry goods"],
  logistics: ["crates", "pallets", "warehouse", "delivery"],
  crates: ["pallets", "logistics", "warehouse"],
  pallets: ["crates", "logistics", "warehouse"],
  warehouse: ["logistics", "crates", "pallets"],
  kigali: ["gasabo", "kicukiro", "nyarugenge"],
  gasabo: ["kigali"],
  kicukiro: ["kigali"],
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9+\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length > 1);
}

function expandToken(token: string): string[] {
  const related = SYNONYMS[token] ?? [];
  return [token, ...related];
}

function scoreField(field: string, tokens: string[]): number {
  const normalizedField = normalize(field);
  if (!normalizedField || tokens.length === 0) return 0;

  let score = 0;
  for (const token of tokens) {
    const variants = expandToken(token);
    let best = 0;
    for (const variant of variants) {
      if (normalizedField === variant) best = Math.max(best, 12);
      else if (normalizedField.startsWith(variant)) best = Math.max(best, 9);
      else if (normalizedField.includes(` ${variant} `) || normalizedField.includes(` ${variant}`)) {
        best = Math.max(best, 7);
      } else if (normalizedField.includes(variant)) best = Math.max(best, 5);
      else if (variant.includes(normalizedField) && normalizedField.length > 2) {
        best = Math.max(best, 3);
      }
    }
    if (best === 0) return 0;
    score += best;
  }
  return score;
}

function parseAvailableUnits(qty: string): number {
  const match = qty.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function matchesQuantity(item: ProductListing, quantity: QuantityFilter): boolean {
  if (!quantity) return true;
  const available = parseAvailableUnits(item.qty);
  const minimum = parseAvailableUnits(item.min);

  switch (quantity) {
    case "10-50":
      return minimum <= 50 && available >= 10;
    case "50-200":
      return minimum <= 200 && available >= 50;
    case "200+":
      return available >= 200;
    default:
      return true;
  }
}

function matchesCategory(item: ProductListing, category: string): boolean {
  if (!category || category === "Any category") return true;
  return normalize(item.category ?? "") === normalize(category);
}

function matchesLocation(item: ProductListing, location: string): boolean {
  const tokens = tokenize(location);
  if (tokens.length === 0) return true;
  return scoreField(item.location, tokens) > 0;
}

function scoreListing(item: ProductListing, query: string): number {
  const tokens = tokenize(query);
  if (tokens.length === 0) return 1;

  const nameScore = scoreField(item.name, tokens) * 3;
  const supplierScore = scoreField(item.supplier, tokens) * 2;
  const categoryScore = scoreField(item.category ?? "", tokens) * 2.5;
  const locationScore = scoreField(item.location, tokens) * 1.5;
  const qtyScore = scoreField(item.qty, tokens);
  const minScore = scoreField(item.min, tokens);
  const haystackScore = scoreField(
    `${item.name} ${item.supplier} ${item.category ?? ""} ${item.location}`,
    tokens
  );

  const total =
    nameScore +
    supplierScore +
    categoryScore +
    locationScore +
    qtyScore +
    minScore +
    haystackScore;

  return total;
}

export function searchListings(
  items: ProductListing[],
  filters: ListingSearchFilters
): ProductListing[] {
  const filtered = items.filter((item) => {
    if (!matchesLocation(item, filters.location)) return false;
    if (!matchesQuantity(item, filters.quantity)) return false;
    if (!matchesCategory(item, filters.category)) return false;

    const queryTokens = tokenize(filters.query);
    if (queryTokens.length === 0) return true;
    return scoreListing(item, filters.query) > 0;
  });

  return filtered.sort((a, b) => {
    const scoreDiff =
      scoreListing(b, filters.query) - scoreListing(a, filters.query);
    if (scoreDiff !== 0) return scoreDiff;
    return Number(b.rating) - Number(a.rating);
  });
}

export function hasActiveSearchFilters(filters: ListingSearchFilters): boolean {
  return Boolean(
    filters.query.trim() ||
      filters.location.trim() ||
      filters.quantity ||
      (filters.category && filters.category !== "Any category")
  );
}
