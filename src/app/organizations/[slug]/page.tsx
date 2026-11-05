"use client";

import { use } from "react";
import Link from "next/link";
import {
  Users,
  FolderGit2,
  Globe,
  Plus,
  MapPin,
  Star,
} from "lucide-react";
import { useAfriHubStore } from "@/lib/store";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function OrganizationDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;
  const { organizations, repositories } = useAfriHubStore();

  const org =
    organizations.find((o) => o.slug.toLowerCase() === slug.toLowerCase());

  if (!org) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-white">Organisation introuvable</h1>
        <p className="mt-2 text-sm text-[#A1A1AA]">
          Cette organisation n&apos;existe pas ou a été supprimée.
        </p>
        <Link
          href="/organizations"
          className="mt-5 inline-flex rounded-xl bg-[#6366F1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4F46E5]"
        >
          Retour aux organisations
        </Link>
      </div>
    );
  }

  const orgRepos = repositories.filter(
    (repo) => repo.organizationId === org.id || org.repositoryIds?.includes(repo.id)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Organization Header */}
      <div className="rounded-2xl bg-[#111113] border border-[#27272A] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={org.avatar}
              alt={org.name}
              className="ui-avatar h-20 w-20 shrink-0 rounded-full border border-[#27272A] object-cover shadow-md"
            />
            <div>
              <h1 className="text-2xl font-bold text-white">{org.name}</h1>
              <p className="text-xs text-[#A1A1AA] font-mono">@{org.slug}</p>
              <p className="text-xs sm:text-sm text-zinc-300 mt-2 max-w-2xl leading-relaxed">
                {org.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-[#A1A1AA] mt-3">
                <a
                  href={org.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[#818CF8] hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {org.website.replace(/^https?:\/\//, "")}
                </a>
                {org.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {org.location}
                  </span>
                )}
                <span>Fondé en {new Date(org.createdAt).getFullYear()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/new?organization=${encodeURIComponent(org.slug)}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6366F1] text-white text-xs sm:text-sm font-semibold hover:bg-[#4F46E5] shadow transition-all"
            >
              <Plus className="h-4 w-4" />
              Nouveau dépôt d&apos;organisation
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Shared Repositories (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FolderGit2 className="h-4 w-4 text-[#818CF8]" />
              Dépôts de l&apos;organisation ({org.repositoriesCount})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orgRepos.map((repo) => (
              <Link
                key={repo.id}
                href={`/${repo.owner.username}/${repo.name}`}
                className="p-5 rounded-2xl bg-[#111113] border border-[#27272A] hover:border-[#6366F1]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-sm font-semibold text-white truncate">
                    {repo.name}
                  </h3>
                  <p className="text-xs text-[#A1A1AA] line-clamp-2 mt-1">
                    {repo.description}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-[#A1A1AA] pt-4 mt-4 border-t border-[#27272A]">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: repo.languageColor }}
                    />
                    {repo.language}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5" aria-hidden="true" />
                    {repo.starsCount}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {orgRepos.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#27272A] px-6 py-10 text-center">
              <FolderGit2 className="mx-auto h-7 w-7 text-[#A1A1AA]" />
              <p className="mt-3 text-xs text-[#A1A1AA]">
                Aucun dépôt associé à cette organisation pour le moment.
              </p>
              <Link
                href={`/new?organization=${encodeURIComponent(org.slug)}`}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#6366F1] px-3 py-2 text-xs font-semibold text-white hover:bg-[#4F46E5]"
              >
                <Plus className="h-3.5 w-3.5" />
                Créer le premier dépôt
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Members & Roles (1 col) */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-[#111113] border border-[#27272A] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" />
              Membres & Rôles ({org.members.length})
            </h2>

            <div className="space-y-3">
              {org.members.map(({ user, role }) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#18181B] border border-[#27272A]"
                >
                  <Link
                    href={`/developers/${user.username}`}
                    className="flex items-center gap-2.5 min-w-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="ui-avatar h-8 w-8 shrink-0 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-[#A1A1AA]">@{user.username}</p>
                    </div>
                  </Link>

                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase ${
                      role === "owner"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : role === "admin"
                        ? "bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/40"
                        : "bg-[#27272A] text-zinc-400"
                    }`}
                  >
                    {role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
