"use client";

import { useEffect } from "react";
import { useAfriHubStore } from "@/lib/store";
import { authService } from "@/services/auth.service";
import { repositoryService } from "@/services/repository.service";

export function StoreHydration() {
  useEffect(() => {
    let active = true;
    let repositoriesLoadedFor: string | null = null;
    const unsubscribe = useAfriHubStore.subscribe((state) => {
      if (!state.isAuthenticated) {
        repositoriesLoadedFor = null;
        return;
      }

      const userId = state.currentUser.id;
      if (repositoriesLoadedFor === userId) return;
      repositoriesLoadedFor = userId;
      void repositoryService
        .getRepositories()
        .then((repositories) => {
          const currentState = useAfriHubStore.getState();
          if (active && currentState.isAuthenticated && currentState.currentUser.id === userId) {
            currentState.replaceRepositories(repositories);
          }
        })
        .catch(() => {
          // Keep the authenticated shell usable if repository listing is temporarily unavailable.
        });
    });

    void (async () => {
      try {
        if (!useAfriHubStore.getState().hasHydrated) {
          await useAfriHubStore.persist.rehydrate();
        }
        const user = await authService.getCurrentUser();
        if (active) useAfriHubStore.getState().login(user);
      } catch {
        if (active) useAfriHubStore.getState().logout();
      } finally {
        if (active) useAfriHubStore.getState().setAuthLoading(false);
      }
    })();

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return null;
}