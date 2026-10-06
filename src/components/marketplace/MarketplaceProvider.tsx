"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getMarketplaceState,
  subscribeMarketplace,
} from "@/lib/marketplaceStore";
import type { MarketplaceState } from "@/lib/marketplaceTypes";

const MarketplaceContext = createContext<MarketplaceState | null>(null);

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MarketplaceState>(() => getMarketplaceState());

  useEffect(() => {
    setState(getMarketplaceState());
    return subscribeMarketplace(() => setState(getMarketplaceState()));
  }, []);

  return (
    <MarketplaceContext.Provider value={state}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const ctx = useContext(MarketplaceContext);
  if (!ctx) {
    throw new Error("useMarketplace must be used within MarketplaceProvider");
  }
  return ctx;
}
