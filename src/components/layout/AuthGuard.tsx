"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { LoadingScreen } from "@/components/layout/LoadingScreen";
import { useAfriHubStore } from "@/lib/store";

const publicPrefixes = ["/login", "/register", "/about", "/developers"];
const privateTopLevelRoutes = new Set([
  "dashboard",
  "feed",
  "messages",
  "new",
  "notifications",
  "organizations",
  "settings",
]);

export function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasHydrated, authLoading, isAuthenticated } = useAfriHubStore();
  const pathSegments = pathname.split("/").filter(Boolean);
  const isRepositoryRoute =
    pathSegments.length >= 2 && !privateTopLevelRoutes.has(pathSegments[0]);
  const isPublicRoute = publicPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  ) || isRepositoryRoute;

  useEffect(() => {
    if (!isPublicRoute && hasHydrated && !authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, hasHydrated, isAuthenticated, isPublicRoute, router]);

  if (!isPublicRoute && (!hasHydrated || authLoading || !isAuthenticated)) {
    return <LoadingScreen />;
  }

  return children;
}