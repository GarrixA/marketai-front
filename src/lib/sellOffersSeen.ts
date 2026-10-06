const SEEN_KEY = "soko_sell_offers_seen_v1";
const SEED_BASELINE = "2026-10-01T09:00:00.000Z";

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeSellOffersSeen(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SEEN_KEY, JSON.stringify(map));
  notify();
}

export function getSellOffersSeenAt(email: string): string | null {
  return readMap()[email] ?? null;
}

export function markSellOffersSeen(email: string, at = new Date().toISOString()) {
  const map = readMap();
  map[email] = at;
  writeMap(map);
}

export function countNewSellOffers(
  offers: { ownerEmail: string; publishedAt?: string }[],
  viewerEmail: string
) {
  const baseline = getSellOffersSeenAt(viewerEmail) ?? SEED_BASELINE;
  return offers.filter((item) => {
    if (item.ownerEmail === viewerEmail) return false;
    if (!item.publishedAt) return false;
    return item.publishedAt > baseline;
  }).length;
}
