"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  FolderGit2,
  MapPin,
  Search,
  Users,
  UserRoundSearch,
  X,
} from "lucide-react";
import { useAfriHubStore } from "@/lib/store";
import { ProfileGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { MemberCover } from "@/components/social/MemberCover";
import { formatNumber } from "@/lib/utils";
import type { User } from "@/types";

const skillOptions = [
  "Toutes",
  "TypeScript",
  "Python",
  "Go",
  "React",
  "DevOps",
  "Machine Learning",
  "Fintech",
];

export default function DevelopersPage() {
  const { users, currentUser, toggleFollowUser, hasHydrated } = useAfriHubStore();
  const [search, setSearch] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("Toutes");
  const normalizedSearch = search.trim().toLowerCase();

  const filteredUsers = users.filter((user) => {
    const searchableFields = [
      user.name,
      user.username,
      user.bio,
      user.location ?? "",
      ...user.skills,
      ...user.technologies,
    ];
    const matchesSearch =
      !normalizedSearch ||
      searchableFields.some((field) => field.toLowerCase().includes(normalizedSearch));

    const matchesSkill =
      selectedSkill === "Toutes" ||
      user.skills.some((s) => s.toLowerCase().includes(selectedSkill.toLowerCase())) ||
      user.technologies.some((t) => t.toLowerCase().includes(selectedSkill.toLowerCase()));

    return matchesSearch && matchesSkill;
  });
  const expertiseCount = new Set(
    users.flatMap((user) => [...user.skills, ...user.technologies])
  ).size;
  const contributionCount = users.reduce(
    (total, user) => total + user.contributionsCount,
    0
  );
  const metrics = [
    { label: "Développeurs", value: hasHydrated ? formatNumber(users.length) : "—" },
    { label: "Expertises", value: hasHydrated ? formatNumber(expertiseCount) : "—" },
    {
      label: "Contributions",
      value: hasHydrated ? formatNumber(contributionCount) : "—",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:space-y-10 sm:px-6 sm:py-8 lg:px-8">
      <section
        aria-labelledby="developers-title"
        className="relative px-1 py-5 sm:px-2 sm:py-7"
        style={{
          backgroundImage:
            "linear-gradient(90deg, var(--background) 0%, color-mix(in srgb, var(--background) 82%, transparent) 55%, color-mix(in srgb, var(--background) 42%, transparent) 100%), url('/metafrix-dashboard-waves.svg')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="max-w-3xl">
          <h1
            id="developers-title"
            className="text-3xl font-bold leading-tight tracking-tight text-(--primary-text) sm:text-4xl"
          >
            Les talents qui font avancer le numérique.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-(--secondary-text) sm:text-base">
            Rencontrez les développeurs, créateurs et experts qui construisent des
            produits utiles en Afrique et au-delà.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <Link
            href="#annuaire"
            className="ui-button ui-button-primary min-h-10 w-fit rounded-lg px-4 text-xs sm:text-sm"
          >
            Explorer l&apos;annuaire
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </Link>
          <dl className="grid grid-cols-3 gap-3 pt-1 sm:min-w-80 sm:gap-5 sm:pl-6 sm:pt-0">
            {metrics.map((metric) => (
              <div key={metric.label} className="min-w-0">
                <dt className="truncate text-[10px] text-(--secondary-text) sm:text-xs">
                  {metric.label}
                </dt>
                <dd className="mt-1 text-base font-semibold tracking-tight text-(--primary-text) sm:text-lg">
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section
        id="annuaire"
        aria-labelledby="directory-title"
        className="scroll-mt-24 space-y-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="directory-title"
              className="text-xl font-bold tracking-tight text-(--primary-text) sm:text-2xl"
            >
              Trouvez votre prochaine collaboration
            </h2>
            <p className="mt-1 text-xs text-(--secondary-text) sm:text-sm">
              Recherchez un profil par nom, expertise ou ville.
            </p>
          </div>
        </div>

        <div className="ui-panel space-y-4 p-4 sm:p-5">
          <div className="relative">
            <label htmlFor="developer-search" className="sr-only">
              Rechercher un développeur
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-(--secondary-text)"
              aria-hidden="true"
            />
            <input
              id="developer-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom, expertise ou ville…"
              className="ui-field h-11 w-full rounded-lg pl-10 pr-10 text-sm outline-none transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Effacer la recherche"
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-(--secondary-text) transition-colors hover:bg-(--muted) hover:text-(--primary-text)"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-medium text-(--secondary-text)">
              Filtrer par expertise
            </p>
            <div
              role="group"
              aria-label="Filtrer par expertise"
              className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none"
            >
              {skillOptions.map((skill) => {
                const isSelected = selectedSkill === skill;
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => setSelectedSkill(skill)}
                    aria-pressed={isSelected}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                      isSelected
                        ? "border-(--accent) bg-(--muted) text-(--accent)"
                        : "border-(--border) text-(--secondary-text) hover:border-(--secondary-text) hover:text-(--primary-text)"
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex min-h-6 flex-wrap items-center justify-between gap-2 text-xs text-(--secondary-text)">
          {hasHydrated ? (
            <p role="status" aria-live="polite">
              <span className="font-semibold text-(--primary-text)">
                {filteredUsers.length}
              </span>{" "}
              {filteredUsers.length > 1 ? "développeurs trouvés" : "développeur trouvé"}
            </p>
          ) : (
            <p>Chargement des profils…</p>
          )}
          {(search || selectedSkill !== "Toutes") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedSkill("Toutes");
              }}
              className="font-medium text-(--accent) transition-colors hover:underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>

        {!hasHydrated ? (
          <div role="status" aria-label="Chargement des profils" aria-busy="true">
            <ProfileGridSkeleton />
            <span className="sr-only">Chargement des développeurs…</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={<UserRoundSearch className="h-5 w-5" />}
            title="Aucun développeur trouvé"
            description="Essayez un autre terme de recherche ou une autre expertise."
            action={(search || selectedSkill !== "Toutes") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedSkill("Toutes");
                }}
                className="text-xs font-medium text-(--accent) hover:underline"
              >
                Effacer les filtres
              </button>
            )}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredUsers.map((user) => (
              <DeveloperCard
                key={user.id}
                user={user}
                currentUserId={currentUser.id}
                onToggleFollow={toggleFollowUser}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DeveloperCard({
  user,
  currentUserId,
  onToggleFollow,
}: {
  user: User;
  currentUserId: string;
  onToggleFollow: (userId: string) => void;
}) {
  const isCurrentUser = user.id === currentUserId;

  return (
    <article className="ui-panel group flex min-h-76 flex-col overflow-hidden transition-colors hover:border-(--secondary-text)">
      <MemberCover className="h-20 w-full shrink-0">
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/25" />
      </MemberCover>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Link
            href={`/developers/${user.username}`}
            aria-label={`Voir le profil de ${user.name}`}
            className="shrink-0 rounded-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatar}
              alt=""
              loading="lazy"
              className="ui-avatar h-14 w-14 border border-(--border) object-cover object-center transition-opacity group-hover:opacity-90"
            />
          </Link>

          {!isCurrentUser && (
            <button
              type="button"
              onClick={() => onToggleFollow(user.id)}
              aria-pressed={Boolean(user.isFollowed)}
              aria-label={`${user.isFollowed ? "Ne plus suivre" : "Suivre"} ${user.name}`}
              className={`min-h-9 rounded-full px-3 text-xs font-semibold transition-colors ${
                user.isFollowed
                  ? "border border-(--border) bg-(--muted) text-(--primary-text) hover:border-(--danger) hover:text-(--danger)"
                  : "bg-(--action) text-white hover:bg-(--action-hover)"
              }`}
            >
              {user.isFollowed ? "Abonné" : "Suivre"}
            </button>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-(--primary-text)">
            <Link
              href={`/developers/${user.username}`}
              className="transition-colors hover:text-(--accent)"
            >
              {user.name}
            </Link>
          </h3>
          <p className="truncate text-xs text-(--secondary-text)">@{user.username}</p>
        </div>

        {user.location && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-(--secondary-text)">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-(--accent-secondary)" aria-hidden="true" />
            <span className="truncate">{user.location}</span>
          </p>
        )}

        <p className="mt-3 min-h-10 line-clamp-2 text-xs leading-relaxed text-(--primary-text)/80">
          {user.bio}
        </p>

        <div className="mt-3 flex min-h-6 flex-wrap content-start gap-1.5">
          {user.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-(--border) px-2.5 py-1 text-[10px] leading-none text-(--secondary-text)"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-(--border) pt-3 text-[11px] text-(--secondary-text)">
          <span className="flex min-w-0 items-center gap-1.5">
            <FolderGit2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{formatNumber(user.repositoriesCount)} dépôts</span>
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{formatNumber(user.followersCount)} abonnés</span>
          </span>
        </div>
      </div>
    </article>
  );
}
