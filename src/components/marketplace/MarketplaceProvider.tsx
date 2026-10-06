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
  MARKETPLACE_STORAGE_KEY,
  reloadMarketplaceFromStorage,
  seedMarketplace,
  subscribeMarketplace,
} from "@/lib/marketplaceStore";
import type { MarketplaceState } from "@/lib/marketplaceTypes";

const MarketplaceContext = createContext<MarketplaceState | null>(null);

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MarketplaceState>(() =>
    typeof window === "undefined" ? seedMarketplace() : getMarketplaceState()
  );

  useEffect(() => {
    setState(getMarketplaceState());
    const unsub = subscribeMarketplace(() => setState(getMarketplaceState()));
    const onStorage = (event: StorageEvent) => {
      if (event.key !== MARKETPLACE_STORAGE_KEY) return;
      setState(reloadMarketplaceFromStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      unsub();
      window.removeEventListener("storage", onStorage);
    };
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
