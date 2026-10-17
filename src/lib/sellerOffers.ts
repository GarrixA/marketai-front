import { formatRwandaLocation } from "@/components/forms/RwandaLocationFields";
import { slugify } from "@/lib/slug";
import type { MarketplaceProduct, ProductOwner } from "@/types/product";

export type SellerOffer = {
  id: string;
  slug: string;
  name: string;
  role: ProductOwner["role"];
  avatarUrl: string | null;
  bio: string | null;
  ratingAverage: number;
  ratingCount: number;
  verificationStatus: string | null;
  deliveryCapability: boolean;
  location: string;
  products: MarketplaceProduct[];
  trayQuantity: number;
  eggQuantity: number;
  averageTrayPrice: number | null;
  listingCount: number;
};

function availableProducts(products: MarketplaceProduct[]) {
  return products.filter(
    (product) => product.isAvailable && product.availableQuantity > 0
  );
}

function sellerLocation(products: MarketplaceProduct[]) {
  const ownerLocation = products.find((product) => product.owner?.location)
    ?.owner?.location;
  const fromOwner = formatRwandaLocation(ownerLocation);
  if (fromOwner !== "—") return fromOwner;

  for (const product of products) {
    const label = formatRwandaLocation(product.location);
    if (label !== "—") return label;
  }
  return "Location TBD";
}

function trayStats(products: MarketplaceProduct[]) {
  let trayQuantity = 0;
  let trayValue = 0;
  let eggQuantity = 0;

  for (const product of products) {
    const qty = Number(product.availableQuantity) || 0;
    const price = Number(product.price) || 0;
    if (product.unit === "TRAY") {
      trayQuantity += qty;
      if (price > 0) trayValue += price * qty;
    } else if (product.unit === "PIECE") {
      eggQuantity += qty;
    }
  }

  return {
    trayQuantity,
    eggQuantity,
    averageTrayPrice:
      trayQuantity > 0 && trayValue > 0
        ? Math.round(trayValue / trayQuantity)
        : null,
  };
}

export function groupProductsBySeller(
  products: MarketplaceProduct[]
): SellerOffer[] {
  const groups = new Map<string, MarketplaceProduct[]>();

  for (const product of availableProducts(products)) {
    const id = product.ownerId ?? product.owner?.id;
    if (!id) continue;
    const current = groups.get(id) ?? [];
    current.push(product);
    groups.set(id, current);
  }

  return Array.from(groups.entries())
    .map(([id, sellerProducts]) => {
      const owner = sellerProducts.find((product) => product.owner)?.owner;
      const stats = trayStats(sellerProducts);
      const name = owner?.name?.trim() || "Seller";
      return {
        id,
        slug: owner?.slug?.trim() || slugify(name),
        name,
        role: owner?.role ?? null,
        avatarUrl: owner?.avatarUrl ?? null,
        bio: owner?.bio?.trim() || null,
        ratingAverage: Number(owner?.ratingAverage ?? 0),
        ratingCount: Number(owner?.ratingCount ?? 0),
        verificationStatus: owner?.verificationStatus ?? null,
        deliveryCapability: Boolean(owner?.deliveryCapability),
        location: sellerLocation(sellerProducts),
        products: [...sellerProducts].sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
        listingCount: sellerProducts.length,
        ...stats,
      };
    })
    .sort((a, b) => {
      if (b.trayQuantity !== a.trayQuantity) {
        return b.trayQuantity - a.trayQuantity;
      }
      return a.name.localeCompare(b.name);
    });
}

export function sellersMatchingProducts(
  sellers: SellerOffer[],
  matchedProducts: MarketplaceProduct[]
): SellerOffer[] {
  const ids = new Set(
    matchedProducts
      .map((product) => product.ownerId ?? product.owner?.id)
      .filter((id): id is string => Boolean(id))
  );
  return sellers.filter((seller) => ids.has(seller.id));
}

export function roleLabel(role: ProductOwner["role"]) {
  if (role === "aggregator") return "Aggregator";
  if (role === "supplier") return "Supplier";
  return "Seller";
}

export function sellerPath(seller: {
  role: ProductOwner["role"];
  slug?: string | null;
  name: string;
}) {
  const slug = seller.slug?.trim() || slugify(seller.name);
  const section = seller.role === "aggregator" ? "aggregators" : "suppliers";
  return `/${section}/${slug}`;
}
