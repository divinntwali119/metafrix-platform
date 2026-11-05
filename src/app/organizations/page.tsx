"use client";

import { useState } from "react";
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

type OrganizationFilter = "all" | "mine";
type OrganizationSort = "recent" | "name";

export default function OrganizationsPage() {
  const { organizations, currentUser } = useAfriHubStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<OrganizationFilter>("all");
  const [sort, setSort] = useState<OrganizationSort>("recent");
  const normalizedSearch = search.trim().toLocaleLowerCase();

  const filteredOrganizations = organizations
    .filter((organization) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          organization.name,
          organization.slug,
          organization.description,
          organization.location || "",
        ].some((value) => value.toLocaleLowerCase().includes(normalizedSearch));
      const isMember = organization.members.some(
        ({ user }) => user.id === currentUser.id
      );

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
              {filteredOrganizations.length}
            </span>{" "}
            {filteredOrganizations.length === 1 ? "organisation" : "organisations"}
          </p>
        </section>

        {filteredOrganizations.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {filteredOrganizations.map((organization) => (
              <Link
                key={organization.id}
                href={`/organizations/${organization.slug}`}
                className="group flex h-full min-w-0 flex-col rounded-xl border border-(--border) bg-(--card) p-4 transition-colors hover:border-(--accent-border) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) sm:p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-(--border) bg-(--muted)">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
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
      </div>
    </div>
  );
}