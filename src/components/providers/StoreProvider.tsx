"use client";

import { useEffect, type ReactNode } from "react";
import { Provider } from "react-redux";
import { getStoredToken } from "@/lib/session";
import { store } from "@/store/page";
import { setToken } from "@/store/reducer/app";

function TokenHydrator({ children }: { children: ReactNode }) {
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      store.dispatch(setToken(token));
    }
  }, []);

  return children;
}

export default function StoreProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <TokenHydrator>{children}</TokenHydrator>
    </Provider>
  );
}
