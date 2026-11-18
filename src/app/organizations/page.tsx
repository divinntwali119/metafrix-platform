"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpDown,
  Building2,
  FolderGit2,
  MapPin,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import { useAfriHubStore } from "@/lib/store";
import { AvatarImage } from "@/components/ui/AvatarImage";
import { socialService } from "@/services/social.service";
import { getApiErrorMessage } from "@/lib/api-error";
import type { Organization } from "@/types";

type OrganizationFilter = "all" | "mine";
type OrganizationSort = "recent" | "name";

export default function OrganizationsPage() {
  const { organizations, currentUser, isAuthenticated, authLoading } = useAfriHubStore();
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<OrganizationFilter>("all");
  const [sort, setSort] = useState<OrganizationSort>("recent");
  const [apiOrganizations, setApiOrganizations] = useState<Organization[]>([]);
  const [resultCount, setResultCount] = useState(0);
  const [loadedQueryKey, setLoadedQueryKey] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [requestError, setRequestError] = useState<{ key: string; message: string } | null>(null);
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const queryKey = `${normalizedSearch}|${filter}|${sort}|${isAuthenticated ? currentUser.id : "anonymous"}`;
  const requiresMineAuth = !isDemoMode && filter === "mine" && !isAuthenticated && !authLoading;
  const isLoading = !isDemoMode && (authLoading || (!requiresMineAuth && loadedQueryKey !== queryKey));
  const apiError = requiresMineAuth
    ? "Connectez-vous pour afficher vos organisations."
    : requestError?.key === queryKey ? requestError.message : "";

  useEffect(() => {
    if (isDemoMode) return;
    let active = true;
    if (authLoading) return () => { active = false; };
    const timer = window.setTimeout(() => {
      if (filter === "mine" && !isAuthenticated) {
        return;
      }
      void socialService.getOrganizations({
        search: search.trim() || undefined,
        mine: filter === "mine" || undefined,
        sort,
        page: 1,
        page_size: 24,
      }).then((response) => {
        if (!active) return;
        setApiOrganizations(response.results);
        setResultCount(response.count);
        setHasMore(Boolean(response.next));
        setPage(1);
        setLoadedQueryKey(queryKey);
      }).catch((error: unknown) => {
        if (active) {
          setRequestError({ key: queryKey, message: getApiErrorMessage(error, "Les organisations n’ont pas pu être chargées.") });
          setLoadedQueryKey(queryKey);
        }
      });
    }, 200);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [authLoading, filter, isAuthenticated, isDemoMode, search, sort, queryKey]);

  const loadMore = async () => {
    if (isDemoMode || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const response = await socialService.getOrganizations({
        search: search.trim() || undefined,
        mine: filter === "mine" || undefined,
        sort,
        page: page + 1,
        page_size: 24,
      });
      setApiOrganizations((items) => [...items, ...response.results]);
      setHasMore(Boolean(response.next));
      setPage((current) => current + 1);
    } catch (error) {
      setRequestError({ key: queryKey, message: getApiErrorMessage(error, "Impossible de charger d’autres organisations.") });
    } finally {
      setIsLoadingMore(false);
    }
  };

  const sourceOrganizations = isDemoMode ? organizations : apiOrganizations;

  const filteredOrganizations = sourceOrganizations
    .filter((organization) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          organization.name,
          organization.slug,
          organization.description,
          organization.location || "",
        ].some((value) => value.toLocaleLowerCase().includes(normalizedSearch));
      const isMember = isDemoMode
        ? organization.members?.some(({ user }) => user.id === currentUser.id)
        : organization.isMember;

      return matchesSearch && (filter === "all" || isMember);
    })
    .sort((first, second) => {
      if (sort === "name") {
        return first.name.localeCompare(second.name, "fr");
      }
      return Date.parse(second.createdAt) - Date.parse(first.createdAt);
    });

  const clearFilters = () => {
    setSearch("");
    setFilter("all");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:px-8">
      <div className="space-y-7 sm:space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-(--accent)">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              <span>Organisations</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-(--primary-text) sm:text-3xl">
              Des équipes qui construisent ensemble
            </h1>
            <p className="text-sm leading-relaxed text-(--secondary-text)">
              Découvrez les collectifs et les entreprises qui font grandir la tech
              africaine.
            </p>
          </div>

          <Link
            href="/organizations/new"
            className="inline-flex min-h-10 w-fit shrink-0 items-center justify-center gap-2 rounded-lg bg-(--action) px-4 text-sm font-semibold text-white transition-colors hover:bg-(--action-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Créer une organisation
          </Link>
        </header>

        <section aria-label="Rechercher et filtrer les organisations" className="space-y-4">
          <div className="relative max-w-xl">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-(--secondary-text)"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher par nom, mission ou lieu…"
              aria-label="Rechercher une organisation"
              className="h-11 w-full rounded-lg border border-(--border) bg-(--card) py-2 pl-10 pr-10 text-sm text-(--primary-text) outline-none transition-colors placeholder:text-(--secondary-text) focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/20"
            />
            {search && (
              <button
                type="button"
                aria-label="Effacer la recherche"
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-(--secondary-text) transition-colors hover:bg-(--muted) hover:text-(--primary-text)"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les organisations">
              {([
                ["all", "Toutes"],
                ["mine", "Mes organisations"],
              ] as const).map(([id, label]) => {
                const isActive = filter === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setFilter(id)}
                    className={`inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) ${
                      isActive
                        ? "border-(--accent) bg-(--muted) text-(--accent)"
                        : "border-(--border) text-(--secondary-text) hover:border-(--secondary-text) hover:text-(--primary-text)"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <label className="flex min-h-9 w-fit items-center gap-2 text-xs text-(--secondary-text)">
              <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Trier</span>
              <select
                aria-label="Trier les organisations"
                value={sort}
                onChange={(event) => setSort(event.target.value as OrganizationSort)}
                className="rounded-md border border-(--border) bg-(--card) px-2.5 py-1.5 text-xs text-(--primary-text) outline-none focus:border-(--accent)"
              >
                <option value="recent">Plus récentes</option>
                <option value="name">Nom (A–Z)</option>
              </select>
            </label>
          </div>

          <p className="text-xs text-(--secondary-text)" role="status" aria-live="polite">
            <span className="font-semibold text-(--primary-text)">
              {isDemoMode ? filteredOrganizations.length : resultCount}
            </span>{" "}
            {filteredOrganizations.length === 1 ? "organisation" : "organisations"}
          </p>
        </section>

        {!isDemoMode && isLoading ? (
          <div className="space-y-3" role="status" aria-busy="true">
            <div className="h-28 animate-pulse rounded-xl bg-(--muted)" />
            <div className="h-28 animate-pulse rounded-xl bg-(--muted)" />
            <span className="sr-only">Chargement des organisations…</span>
          </div>
        ) : filteredOrganizations.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {filteredOrganizations.map((organization) => (
              <Link
                key={organization.id}
                href={`/organizations/${organization.slug}`}
                className="group flex h-full min-w-0 flex-col rounded-xl border border-(--border) bg-(--card) p-4 transition-colors hover:border-(--accent-border) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) sm:p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-(--border) bg-(--muted)">
                    <AvatarImage
                      src={organization.avatar}
                      alt={organization.name}
                      loading="lazy"
                      className="ui-avatar h-full w-full object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-(--primary-text) transition-colors group-hover:text-(--accent) sm:text-base">
                      {organization.name}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-(--secondary-text)">
                      @{organization.slug}
                    </span>
                  </span>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-(--secondary-text) transition-transform group-hover:translate-x-0.5 group-hover:text-(--accent)"
                    aria-hidden="true"
                  />
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-(--secondary-text)">
                  {organization.description}
                </p>

                <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-5 text-xs text-(--secondary-text)">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-(--accent-secondary)" aria-hidden="true" />
                    <span className="font-medium text-(--primary-text)">{organization.membersCount}</span>
                    {organization.membersCount === 1 ? "membre" : "membres"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <FolderGit2 className="h-3.5 w-3.5 text-(--accent)" aria-hidden="true" />
                    <span className="font-medium text-(--primary-text)">{organization.repositoriesCount}</span>
                    {organization.repositoriesCount === 1 ? "dépôt" : "dépôts"}
                  </span>
                  {organization.location && (
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{organization.location}</span>
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center sm:py-16">
            <Building2 className="mx-auto h-7 w-7 text-(--secondary-text)" aria-hidden="true" />
            <h2 className="mt-3 text-sm font-semibold text-(--primary-text)">
              {filter === "mine" && !normalizedSearch
                ? "Aucune organisation pour le moment"
                : "Aucune organisation trouvée"}
            </h2>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-(--secondary-text)">
              {filter === "mine" && !normalizedSearch
                ? "Les organisations dont vous êtes membre apparaîtront ici."
                : "Essayez un autre nom, une autre mission ou un autre lieu."}
            </p>
            {(normalizedSearch || filter !== "all") && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex min-h-9 items-center rounded-lg border border-(--border) px-3 text-xs font-medium text-(--primary-text) transition-colors hover:bg-(--muted) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        )}
        {apiError && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300" role="alert">{apiError}</p>}
        {!isDemoMode && hasMore && (
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={isLoadingMore}
            className="w-full rounded-lg border border-(--border) px-4 py-2.5 text-sm text-(--primary-text) hover:bg-(--muted) disabled:opacity-60"
          >
            {isLoadingMore ? "Chargement…" : "Afficher plus d’organisations"}
          </button>
        )}
      </div>
    </div>
  );
}