"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  FolderGit2,
  Globe,
  Plus,
  MapPin,
  Star,
  Trash2,
} from "lucide-react";
import { useAfriHubStore } from "@/lib/store";
import { AvatarImage } from "@/components/ui/AvatarImage";
import { socialService } from "@/services/social.service";
import { repositoryService } from "@/services/repository.service";
import { getApiErrorMessage } from "@/lib/api-error";
import type { Organization, Repository } from "@/types";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function OrganizationDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;
  const { organizations, repositories, currentUser, isAuthenticated, authLoading } = useAfriHubStore();
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const [apiOrganization, setApiOrganization] = useState<(Organization & {
    repositories?: Repository[];
    isMember?: boolean;
    viewerRole?: string | null;
  }) | null>(null);
  const [ownedRepositories, setOwnedRepositories] = useState<Repository[]>([]);
  const [loadedOrganizationKey, setLoadedOrganizationKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRepositoryId, setSelectedRepositoryId] = useState("");
  const [apiError, setApiError] = useState("");
  const organizationKey = `${slug.toLowerCase()}:${isAuthenticated ? currentUser.id : "anonymous"}`;
  const isLoading = !isDemoMode && (authLoading || loadedOrganizationKey !== organizationKey);

  const loadOrganization = async () => {
    const organization = await socialService.getOrganization(slug);
    setApiOrganization(organization);
  };

  useEffect(() => {
    if (isDemoMode) return;
    let active = true;
    if (authLoading) return () => { active = false; };
    void Promise.all([
      socialService.getOrganization(slug),
      isAuthenticated ? repositoryService.getRepositories({ owner: currentUser.username }) : Promise.resolve([]),
    ]).then(([organization, userRepositories]) => {
      if (!active) return;
      setApiOrganization(organization);
      setOwnedRepositories(userRepositories.filter((repository) => !repository.isPrivate));
      setLoadedOrganizationKey(organizationKey);
    }).catch((error: unknown) => {
      if (active) {
        setApiError(getApiErrorMessage(error, "L’organisation n’a pas pu être chargée."));
        setLoadedOrganizationKey(organizationKey);
      }
    }).finally(() => {
      if (active) setLoadedOrganizationKey(organizationKey);
    });
    return () => { active = false; };
  }, [authLoading, currentUser.id, currentUser.username, isAuthenticated, isDemoMode, slug, organizationKey]);

  const handleMembership = async (action: "join" | "leave") => {
    setApiError("");
    setIsSaving(true);
    try {
      if (action === "join") await socialService.joinOrganization(slug);
      else await socialService.leaveOrganization(slug);
      await loadOrganization();
    } catch (error) {
      setApiError(getApiErrorMessage(error, "La demande de modification des membres a échoué."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRepository = async () => {
    if (!selectedRepositoryId) return;
    setApiError("");
    setIsSaving(true);
    try {
      await socialService.addOrganizationRepository(slug, selectedRepositoryId);
      setSelectedRepositoryId("");
      await loadOrganization();
    } catch (error) {
      setApiError(getApiErrorMessage(error, "Le dépôt n’a pas pu être associé."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleMemberRole = async (userId: string, role: "admin" | "member") => {
    setApiError("");
    try {
      await socialService.setOrganizationMemberRole(slug, userId, role);
      await loadOrganization();
    } catch (error) {
      setApiError(getApiErrorMessage(error, "Le rôle du membre n’a pas pu être modifié."));
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setApiError("");
    try {
      await socialService.removeOrganizationMember(slug, userId);
      await loadOrganization();
    } catch (error) {
      setApiError(getApiErrorMessage(error, "Le membre n’a pas pu être retiré."));
    }
  };

  const handleRemoveRepository = async (repositoryId: string) => {
    setApiError("");
    try {
      await socialService.removeOrganizationRepository(slug, repositoryId);
      await loadOrganization();
    } catch (error) {
      setApiError(getApiErrorMessage(error, "Le dépôt n’a pas pu être retiré de l’organisation."));
    }
  };

  const org = isDemoMode
    ? organizations.find((o) => o.slug.toLowerCase() === slug.toLowerCase())
    : apiOrganization?.slug.toLowerCase() === slug.toLowerCase() ? apiOrganization : null;

  if (isLoading) {
    return <div className="mx-auto max-w-7xl space-y-4 px-4 py-8" role="status" aria-busy="true"><div className="h-36 animate-pulse rounded-2xl bg-(--muted)" /><div className="h-64 animate-pulse rounded-2xl bg-(--muted)" /><span className="sr-only">Chargement de l’organisation…</span></div>;
  }

  if (!org || (apiError && !apiOrganization)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-white">{apiError ? "Chargement impossible" : "Organisation introuvable"}</h1>
        <p className="mt-2 text-sm text-[#A1A1AA]">
          {apiError || "Cette organisation n’existe pas ou a été supprimée."}
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

  const orgRepos = isDemoMode
    ? repositories.filter((repo) => repo.organizationId === org.id || org.repositoryIds?.includes(repo.id))
    : apiOrganization?.repositories || [];
  const members = org.members || [];
  const viewerRole = isDemoMode ? null : apiOrganization?.viewerRole;
  const canManage = viewerRole === "owner" || viewerRole === "admin";
  const isMember = isDemoMode
    ? members.some(({ user }) => user.id === currentUser.id)
    : Boolean(apiOrganization?.isMember);
  const availableRepositories = ownedRepositories.filter((repository) => !org.repositoryIds?.includes(repository.id));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Organization Header */}
      <div className="rounded-2xl bg-[#111113] border border-[#27272A] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <AvatarImage
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
                {org.website && <a
                  href={org.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[#818CF8] hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {org.website.replace(/^https?:\/\//, "")}
                </a>}
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

          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            {!isDemoMode && !isMember && isAuthenticated && (
              <button
                type="button"
                onClick={() => void handleMembership("join")}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2 text-xs font-semibold text-white shadow transition-all hover:bg-[#4F46E5] disabled:opacity-60"
              >
                <Users className="h-4 w-4" /> Rejoindre l’organisation
              </button>
            )}
            {!isDemoMode && isMember && viewerRole !== "owner" && (
              <button
                type="button"
                onClick={() => void handleMembership("leave")}
                disabled={isSaving}
                className="rounded-xl border border-[#27272A] px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-[#18181B] disabled:opacity-60"
              >
                Quitter l’organisation
              </button>
            )}
            {(isDemoMode || canManage) && <Link
              href={`/new?organization=${encodeURIComponent(org.slug)}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2 text-xs font-semibold text-white shadow transition-all hover:bg-[#4F46E5]"
            >
              <Plus className="h-4 w-4" /> Créer et associer un dépôt public
            </Link>}
            {!isDemoMode && canManage && (
              <div className="flex flex-wrap gap-2">
                {availableRepositories.length > 0 ? (
                  <>
                    <label className="sr-only" htmlFor="organization-repository">Dépôt public à associer</label>
                    <select
                      id="organization-repository"
                      value={selectedRepositoryId}
                      onChange={(event) => setSelectedRepositoryId(event.target.value)}
                      className="max-w-56 rounded-lg border border-[#27272A] bg-[#18181B] px-3 py-2 text-xs text-white"
                    >
                      <option value="">Associer un dépôt public…</option>
                      {availableRepositories.map((repository) => (
                        <option key={repository.id} value={repository.id}>{repository.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => void handleAddRepository()}
                      disabled={!selectedRepositoryId || isSaving}
                      className="rounded-lg bg-[#6366F1] px-3 py-2 text-xs font-semibold text-white hover:bg-[#4F46E5] disabled:opacity-50"
                    >Associer</button>
                  </>
                ) : <Link href="/new" className="text-xs font-medium text-[#818CF8] hover:underline">Créer un dépôt public avant de l’associer</Link>}
              </div>
            )}
            {!isDemoMode && !isAuthenticated && !authLoading && (
              <Link href="/login" className="text-xs font-medium text-[#818CF8] hover:underline">Connectez-vous pour rejoindre</Link>
            )}
          </div>
        </div>
      </div>

      {apiError && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300" role="alert">{apiError}</p>}

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
              <article
                key={repo.id}
                className="flex flex-col justify-between rounded-2xl border border-[#27272A] bg-[#111113] p-5 transition-all hover:border-[#6366F1]/50"
              >
                <Link href={`/${repo.owner.username}/${repo.name}`} className="block">
                  <h3 className="truncate text-sm font-semibold text-white">{repo.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-[#A1A1AA]">{repo.description}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-[#27272A] pt-4 text-xs text-[#A1A1AA]">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: repo.languageColor }} />
                      {repo.language}
                    </span>
                    <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" aria-hidden="true" />{repo.starsCount}</span>
                  </div>
                </Link>
                {!isDemoMode && canManage && (
                  <button
                    type="button"
                    onClick={() => void handleRemoveRepository(repo.id)}
                    className="mt-3 inline-flex w-fit items-center gap-1.5 text-[11px] font-medium text-red-300 hover:text-red-200"
                  ><Trash2 className="h-3.5 w-3.5" /> Retirer de l’organisation</button>
                )}
              </article>
            ))}
          </div>
          {orgRepos.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#27272A] px-6 py-10 text-center">
              <FolderGit2 className="mx-auto h-7 w-7 text-[#A1A1AA]" />
              <p className="mt-3 text-xs text-[#A1A1AA]">
                Aucun dépôt associé à cette organisation pour le moment.
              </p>
              {!isDemoMode && canManage && availableRepositories.length === 0 && (
                <Link href={`/new?organization=${encodeURIComponent(org.slug)}`} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#6366F1] px-3 py-2 text-xs font-semibold text-white hover:bg-[#4F46E5]">
                  <Plus className="h-3.5 w-3.5" /> Créer et associer un dépôt public
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Members & Roles (1 col) */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-[#111113] border border-[#27272A] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" />
              Membres & Rôles ({members.length})
            </h2>

            <div className="space-y-3">
              {members.map(({ user, role }) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-2 rounded-xl border border-[#27272A] bg-[#18181B] p-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/developers/${user.username}`} className="flex min-w-0 items-center gap-2.5">
                    <AvatarImage
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
                    >{role}</span>
                  </div>
                  {!isDemoMode && canManage && role !== "owner" && (
                    <div className="flex items-center justify-end gap-2 border-t border-[#27272A] pt-2">
                      <label className="sr-only" htmlFor={`role-${user.id}`}>Rôle de {user.name}</label>
                      <select
                        id={`role-${user.id}`}
                        value={role}
                        onChange={(event) => void handleMemberRole(user.id, event.target.value as "admin" | "member")}
                        className="rounded-md border border-[#27272A] bg-[#111113] px-2 py-1 text-[10px] text-zinc-300"
                      >
                        <option value="member">Membre</option>
                        {viewerRole === "owner" && <option value="admin">Administrateur</option>}
                      </select>
                      {(viewerRole === "owner" || role === "member") && (
                        <button
                          type="button"
                          onClick={() => void handleRemoveMember(user.id)}
                          title={`Retirer ${user.name}`}
                          aria-label={`Retirer ${user.name} de l’organisation`}
                          className="grid h-7 w-7 place-items-center rounded-md text-[#f85149] hover:bg-[#f85149]/10"
                        ><Trash2 className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
