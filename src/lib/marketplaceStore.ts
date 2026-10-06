import type {
  Deal,
  InventoryItem,
  MarketplaceState,
  SellerRole,
  TransportQuote,
} from "@/lib/marketplaceTypes";

const STORAGE_KEY = "soko_marketplace_demo_v4";

const SUPPLIER = {
  ownerEmail: "supplier@soko.rw",
  ownerName: "Musanze Growers Co-op",
  ownerRole: "supplier" as const,
  trades: 186,
  completionRate: 98.1,
  rating: 99.2,
  responseMins: 15,
};

const AGGREGATOR = {
  ownerEmail: "aggregator@soko.rw",
  ownerName: "Northern Egg Hub",
  ownerRole: "aggregator" as const,
  trades: 412,
  completionRate: 99.0,
  rating: 99.4,
  responseMins: 12,
};

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

type SeedListing = {
  ownerEmail: string;
  ownerName: string;
  ownerRole: SellerRole;
  product: string;
  grade: string;
  quantity: number;
  pricePerUnit: number;
  location: string;
  paymentMethod: string;
  minOrder: number;
  trades: number;
  completionRate: number;
  rating: number;
  responseMins: number;
};

/** All listings belong only to the demo supplier or aggregator accounts. */
const SEED_LISTINGS: SeedListing[] = [
  // Supplier — Musanze Growers Co-op (15)
  {
    ...SUPPLIER,
    product: "Fresh eggs",
    grade: "Large",
    quantity: 500,
    pricePerUnit: 4200,
    location: "Musanze Main Farm",
    paymentMethod: "MTN MoMo",
    minOrder: 20,
  },
  {
    ...SUPPLIER,
    product: "Fresh eggs",
    grade: "Medium",
    quantity: 280,
    pricePerUnit: 3800,
    location: "Musanze Main Farm",
    paymentMethod: "Bank transfer",
    minOrder: 15,
  },
  {
    ...SUPPLIER,
    product: "Fresh eggs",
    grade: "Small",
    quantity: 160,
    pricePerUnit: 3400,
    location: "Musanze Main Farm",
    paymentMethod: "MTN MoMo",
    minOrder: 10,
  },
  {
    ...SUPPLIER,
    product: "Fresh eggs",
    grade: "Large",
    quantity: 320,
    pricePerUnit: 4150,
    location: "Burera collection point",
    paymentMethod: "MTN MoMo",
    minOrder: 25,
  },
  {
    ...SUPPLIER,
    product: "Fresh eggs",
    grade: "Medium",
    quantity: 410,
    pricePerUnit: 3720,
    location: "Gicumbi collection point",
    paymentMethod: "Bank transfer",
    minOrder: 20,
  },
  {
    ...SUPPLIER,
    product: "Fresh eggs",
    grade: "Large",
    quantity: 260,
    pricePerUnit: 4300,
    location: "Rwamagana collection point",
    paymentMethod: "MTN MoMo",
    minOrder: 15,
  },
  {
    ...SUPPLIER,
    product: "Fresh eggs",
    grade: "Organic Large",
    quantity: 140,
    pricePerUnit: 5100,
    location: "Huye partner farm",
    paymentMethod: "Bank transfer",
    minOrder: 10,
  },
  {
    ...SUPPLIER,
    product: "Fresh eggs",
    grade: "Large",
    quantity: 380,
    pricePerUnit: 4050,
    location: "Nyagatare partner farm",
    paymentMethod: "Airtel Money",
    minOrder: 20,
  },
  {
    ...SUPPLIER,
    product: "Fresh eggs",
    grade: "Medium",
    quantity: 210,
    pricePerUnit: 3650,
    location: "Rubavu partner farm",
    paymentMethod: "MTN MoMo",
    minOrder: 12,
  },
  {
    ...SUPPLIER,
    product: "Fresh eggs",
    grade: "Free-range",
    quantity: 120,
    pricePerUnit: 5600,
    location: "Ngoma partner farm",
    paymentMethod: "Bank transfer",
    minOrder: 8,
  },
  {
    ...SUPPLIER,
    product: "Fresh eggs",
    grade: "Large",
    quantity: 295,
    pricePerUnit: 4180,
    location: "Volcano Valley site",
    paymentMethod: "MTN MoMo",
    minOrder: 18,
  },
  {
    ...SUPPLIER,
    product: "Fresh eggs",
    grade: "Medium",
    quantity: 180,
    pricePerUnit: 4000,
    location: "Kicukiro packing shed",
    paymentMethod: "MTN MoMo",
    minOrder: 10,
  },
  {
    ...SUPPLIER,
    product: "Fresh eggs",
    grade: "Large",
    quantity: 240,
    pricePerUnit: 4090,
    location: "Rulindo site",
    paymentMethod: "MTN MoMo",
    minOrder: 16,
  },
  {
    ...SUPPLIER,
    product: "Fresh eggs",
    grade: "Small",
    quantity: 155,
    pricePerUnit: 3280,
    location: "Nyamasheke site",
    paymentMethod: "MTN MoMo",
    minOrder: 10,
  },
  {
    ...SUPPLIER,
    product: "Fresh eggs",
    grade: "Medium",
    quantity: 230,
    pricePerUnit: 3760,
    location: "Muhanga site",
    paymentMethod: "MTN MoMo",
    minOrder: 15,
  },
  // Aggregator — Northern Egg Hub (15)
  {
    ...AGGREGATOR,
    product: "Fresh eggs",
    grade: "Large",
    quantity: 1200,
    pricePerUnit: 4100,
    location: "Musanze Aggregator Depot",
    paymentMethod: "MTN MoMo",
    minOrder: 50,
  },
  {
    ...AGGREGATOR,
    product: "Fresh eggs",
    grade: "Mixed",
    quantity: 800,
    pricePerUnit: 3950,
    location: "Musanze Aggregator Depot",
    paymentMethod: "Airtel Money",
    minOrder: 40,
  },
  {
    ...AGGREGATOR,
    product: "Fresh eggs",
    grade: "Large",
    quantity: 950,
    pricePerUnit: 4250,
    location: "Gasabo Hub yard",
    paymentMethod: "Card / MoMo",
    minOrder: 30,
  },
  {
    ...AGGREGATOR,
    product: "Fresh eggs",
    grade: "Medium",
    quantity: 640,
    pricePerUnit: 3900,
    location: "Gasabo Hub yard",
    paymentMethod: "MTN MoMo",
    minOrder: 30,
  },
  {
    ...AGGREGATOR,
    product: "Fresh eggs",
    grade: "Large",
    quantity: 1100,
    pricePerUnit: 4080,
    location: "Kayonza Hub yard",
    paymentMethod: "MTN MoMo",
    minOrder: 60,
  },
  {
    ...AGGREGATOR,
    product: "Fresh eggs",
    grade: "Small",
    quantity: 470,
    pricePerUnit: 3350,
    location: "Kayonza Hub yard",
    paymentMethod: "Bank transfer",
    minOrder: 40,
  },
  {
    ...AGGREGATOR,
    product: "Fresh eggs",
    grade: "Large",
    quantity: 730,
    pricePerUnit: 4120,
    location: "Nyanza Hub yard",
    paymentMethod: "Airtel Money",
    minOrder: 35,
  },
  {
    ...AGGREGATOR,
    product: "Fresh eggs",
    grade: "Medium",
    quantity: 510,
    pricePerUnit: 3780,
    location: "Nyanza Hub yard",
    paymentMethod: "MTN MoMo",
    minOrder: 35,
  },
  {
    ...AGGREGATOR,
    product: "Fresh eggs",
    grade: "Large",
    quantity: 880,
    pricePerUnit: 4060,
    location: "Karongi Hub yard",
    paymentMethod: "MTN MoMo",
    minOrder: 45,
  },
  {
    ...AGGREGATOR,
    product: "Fresh eggs",
    grade: "Mixed",
    quantity: 620,
    pricePerUnit: 3880,
    location: "Karongi Hub yard",
    paymentMethod: "Airtel Money",
    minOrder: 40,
  },
  {
    ...AGGREGATOR,
    product: "Fresh eggs",
    grade: "Large",
    quantity: 1020,
    pricePerUnit: 4110,
    location: "Musanze Town depot",
    paymentMethod: "Card / MoMo",
    minOrder: 55,
  },
  {
    ...AGGREGATOR,
    product: "Fresh eggs",
    grade: "Organic Large",
    quantity: 210,
    pricePerUnit: 5350,
    location: "Musanze Town depot",
    paymentMethod: "Bank transfer",
    minOrder: 20,
  },
  {
    ...AGGREGATOR,
    product: "Fresh eggs",
    grade: "Medium",
    quantity: 350,
    pricePerUnit: 3680,
    location: "Gatsibo Hub yard",
    paymentMethod: "Bank transfer",
    minOrder: 25,
  },
  {
    ...AGGREGATOR,
    product: "Fresh eggs",
    grade: "Large",
    quantity: 275,
    pricePerUnit: 4140,
    location: "Bugesera Hub yard",
    paymentMethod: "Bank transfer",
    minOrder: 20,
  },
  {
    ...AGGREGATOR,
    product: "Fresh eggs",
    grade: "Large",
    quantity: 190,
    pricePerUnit: 4220,
    location: "Kamonyi Hub yard",
    paymentMethod: "MTN MoMo",
    minOrder: 12,
  },
];

export const seedMarketplace = (): MarketplaceState => ({
  inventory: SEED_LISTINGS.map((row, i) => ({
    id: `inv-${i + 1}`,
    unit: "trays",
    ...row,
  })),
  deals: [
    {
      id: "deal-1",
      buyerEmail: "buyer@soko.rw",
      buyerName: "Aline Kabera",
      buyerBusiness: "Kigali Fresh Foods",
      product: "Fresh eggs · Large",
      quantity: 300,
      unit: "trays",
      deliveryLocation: "Kigali",
      requiredDate: "2026-10-12",
      targetPrice: 4000,
      notes: "Weekly supply preferred",
      status: "requested",
      transportQuotes: [],
      createdAt: "2026-10-05T08:00:00.000Z",
    },
    {
      id: "deal-2",
      buyerEmail: "aggregator@soko.rw",
      buyerName: "Eric Mugisha",
      buyerBusiness: "Northern Egg Hub",
      product: "Fresh eggs · Medium",
      quantity: 150,
      unit: "trays",
      deliveryLocation: "Musanze Aggregator Depot",
      requiredDate: "2026-10-10",
      targetPrice: 3700,
      notes: "Buying to restock depot",
      status: "confirmed",
      supplierEmail: "supplier@soko.rw",
      supplierName: "Musanze Growers Co-op",
      confirmedQty: 150,
      offerPrice: 3750,
      pickupLocation: "Musanze",
      transportQuotes: [],
      createdAt: "2026-10-04T10:30:00.000Z",
    },
  ],
});

type Listener = () => void;

let memoryState: MarketplaceState | null = null;
const listeners = new Set<Listener>();

function readState(): MarketplaceState {
  if (typeof window === "undefined") {
    return seedMarketplace();
  }
  if (memoryState) return memoryState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      memoryState = JSON.parse(raw) as MarketplaceState;
      return memoryState;
    }
  } catch {
    /* fall through */
  }
  memoryState = seedMarketplace();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
  return memoryState;
}

function writeState(next: MarketplaceState) {
  memoryState = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

export function subscribeMarketplace(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getMarketplaceState(): MarketplaceState {
  return readState();
}

export function resetMarketplace() {
  writeState(seedMarketplace());
}

export function formatRwf(amount: number) {
  return `RWF ${amount.toLocaleString("en-RW")}`;
}

export function dealStatusLabel(status: Deal["status"]) {
  switch (status) {
    case "requested":
      return "Awaiting supplier";
    case "confirmed":
      return "Quantity confirmed";
    case "paid":
      return "Paid";
    case "transport_open":
      return "Transport requested";
    case "transport_quoted":
      return "Transport quoted";
    case "transport_accepted":
      return "Transport booked";
    default:
      return status;
  }
}

export function createBuyRequest(input: {
  buyerEmail: string;
  buyerName: string;
  buyerBusiness: string;
  product: string;
  quantity: number;
  unit: string;
  deliveryLocation: string;
  requiredDate: string;
  targetPrice: number;
  notes: string;
  listingId?: string;
  supplierEmail?: string;
  supplierName?: string;
}) {
  const state = readState();
  const deal: Deal = {
    id: uid("deal"),
    ...input,
    status: "requested",
    transportQuotes: [],
    createdAt: new Date().toISOString(),
  };
  writeState({ ...state, deals: [deal, ...state.deals] });
  return deal;
}

export function createBuyFromListing(input: {
  listingId: string;
  quantity: number;
  buyerEmail: string;
  buyerName: string;
  buyerBusiness: string;
  deliveryLocation: string;
}) {
  const state = readState();
  const listing = state.inventory.find((i) => i.id === input.listingId);
  if (!listing) return null;

  const qty = Math.min(
    Math.max(input.quantity, listing.minOrder),
    listing.quantity
  );

  const deal: Deal = {
    id: uid("deal"),
    buyerEmail: input.buyerEmail,
    buyerName: input.buyerName,
    buyerBusiness: input.buyerBusiness,
    product: `${listing.product} · ${listing.grade}`,
    quantity: qty,
    unit: listing.unit,
    deliveryLocation: input.deliveryLocation,
    requiredDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    targetPrice: listing.pricePerUnit,
    notes: `Buy from listing ${listing.id}`,
    status: "requested",
    listingId: listing.id,
    supplierEmail: listing.ownerEmail,
    supplierName: listing.ownerName,
    pickupLocation: listing.location,
    transportQuotes: [],
    createdAt: new Date().toISOString(),
  };

  writeState({ ...state, deals: [deal, ...state.deals] });
  return deal;
}

export function confirmDealQuantity(input: {
  dealId: string;
  supplierEmail: string;
  supplierName: string;
  confirmedQty: number;
  offerPrice: number;
  pickupLocation: string;
}) {
  const state = readState();
  writeState({
    ...state,
    deals: state.deals.map((d) =>
      d.id === input.dealId
        ? {
            ...d,
            status: "confirmed",
            supplierEmail: input.supplierEmail,
            supplierName: input.supplierName,
            confirmedQty: input.confirmedQty,
            offerPrice: input.offerPrice,
            pickupLocation: input.pickupLocation,
          }
        : d
    ),
  });
}

export function payDeal(dealId: string) {
  const state = readState();
  const deal = state.deals.find((d) => d.id === dealId);
  if (!deal || deal.status !== "confirmed" || !deal.offerPrice || !deal.confirmedQty) {
    return;
  }

  const paidAmount = deal.offerPrice * deal.confirmedQty;
  const inventory = state.inventory.map((item) => {
    if (deal.listingId && item.id === deal.listingId) {
      return {
        ...item,
        quantity: Math.max(0, item.quantity - (deal.confirmedQty ?? 0)),
      };
    }
    if (
      !deal.listingId &&
      deal.supplierEmail &&
      item.ownerEmail === deal.supplierEmail &&
      deal.product.toLowerCase().includes(item.grade.toLowerCase())
    ) {
      return {
        ...item,
        quantity: Math.max(0, item.quantity - (deal.confirmedQty ?? 0)),
      };
    }
    return item;
  });

  writeState({
    inventory,
    deals: state.deals.map((d) =>
      d.id === dealId
        ? {
            ...d,
            status: "paid",
            paidAmount,
            paidAt: new Date().toISOString(),
          }
        : d
    ),
  });
}

export function requestTransport(dealId: string) {
  const state = readState();
  writeState({
    ...state,
    deals: state.deals.map((d) =>
      d.id === dealId && d.status === "paid"
        ? { ...d, status: "transport_open" }
        : d
    ),
  });
}

export function quoteTransport(input: {
  dealId: string;
  logisticsEmail: string;
  logisticsName: string;
  fee: number;
  note: string;
}) {
  const state = readState();
  const quote: TransportQuote = {
    logisticsEmail: input.logisticsEmail,
    logisticsName: input.logisticsName,
    fee: input.fee,
    note: input.note,
    quotedAt: new Date().toISOString(),
  };
  writeState({
    ...state,
    deals: state.deals.map((d) =>
      d.id === input.dealId
        ? {
            ...d,
            status: "transport_quoted",
            transportQuotes: [
              ...d.transportQuotes.filter(
                (q) => q.logisticsEmail !== input.logisticsEmail
              ),
              quote,
            ],
          }
        : d
    ),
  });
}

export function acceptTransportQuote(dealId: string, logisticsEmail: string) {
  const state = readState();
  writeState({
    ...state,
    deals: state.deals.map((d) => {
      if (d.id !== dealId) return d;
      const quote = d.transportQuotes.find((q) => q.logisticsEmail === logisticsEmail);
      if (!quote) return d;
      return {
        ...d,
        status: "transport_accepted",
        transportFee: quote.fee,
        acceptedQuoteId: logisticsEmail,
      };
    }),
  });
}

export function upsertInventory(
  item: Omit<InventoryItem, "id"> & { id?: string }
) {
  const state = readState();
  if (item.id) {
    writeState({
      ...state,
      inventory: state.inventory.map((row) =>
        row.id === item.id ? { ...row, ...item, id: item.id } : row
      ),
    });
    return;
  }
  writeState({
    ...state,
    inventory: [
      {
        ...item,
        id: uid("inv"),
      },
      ...state.inventory,
    ],
  });
}

export function removeInventory(id: string) {
  const state = readState();
  writeState({
    ...state,
    inventory: state.inventory.filter((row) => row.id !== id),
  });
}
