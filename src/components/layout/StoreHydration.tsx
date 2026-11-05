"use client";

import { useEffect } from "react";
import { useAfriHubStore } from "@/lib/store";

export function StoreHydration() {
  useEffect(() => {
    if (!useAfriHubStore.getState().hasHydrated) {
      void useAfriHubStore.persist.rehydrate();
    }
  }, []);

  return null;
}