"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getMarketplaceState,
  getServerMarketplaceState,
  MARKETPLACE_STORAGE_KEY,
  reloadMarketplaceFromStorage,
  subscribeMarketplace,
} from "@/lib/marketplaceStore";
import type { MarketplaceState } from "@/lib/marketplaceTypes";

const MarketplaceContext = createContext<MarketplaceState | null>(null);

function subscribe(onStoreChange: () => void) {
  const unsub = subscribeMarketplace(onStoreChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== MARKETPLACE_STORAGE_KEY) return;
    reloadMarketplaceFromStorage();
    onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    unsub();
    window.removeEventListener("storage", onStorage);
  };
}

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(
    subscribe,
    getMarketplaceState,
    getServerMarketplaceState
  );

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
