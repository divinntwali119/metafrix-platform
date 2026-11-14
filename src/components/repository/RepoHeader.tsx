"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderGit2,
  Star,
  GitFork,
  Eye,
  Code2,
  GitCommit,
  CircleDot,
  GitPullRequest,
  Settings,
} from "lucide-react";
import { Repository } from "@/types";
import { useAfriHubStore } from "@/lib/store";
import { repositoryService } from "@/services/repository.service";

interface RepoHeaderProps {
  repository: Repository;
}

export function RepoHeader({ repository }: RepoHeaderProps) {
  const pathname = usePathname();
  const { currentUser, isAuthenticated, toggleStarRepo } = useAfriHubStore();
  const [interaction, setInteraction] = useState<{
    repositoryId: string;
    isStarred: boolean;
    starsCount: number;
    isWatching: boolean;
    watchersCount: number;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState<"star" | "watch" | null>(null);
  const [actionError, setActionError] = useState("");

  const basePath = `/${repository.owner.username}/${repository.name}`;
  const ownerHref = isAuthenticated && repository.owner.id === currentUser.id
    ? "/dashboard"
    : `/developers/${encodeURIComponent(repository.owner.username)}`;
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const currentInteraction = interaction?.repositoryId === repository.id ? interaction : null;
  const isStarred = currentInteraction?.isStarred ?? repository.isStarred ?? false;
  const starsCount = currentInteraction?.starsCount ?? repository.starsCount;
  const isWatching = currentInteraction?.isWatching ?? repository.isWatching ?? false;
  const watchersCount = currentInteraction?.watchersCount ?? repository.watchersCount;

  const tabs = [
    { label: "Code", href: basePath, icon: Code2, count: null },
    { label: "Commits", href: `${basePath}/commits`, icon: GitCommit, count: null },
    { label: "Issues", href: `${basePath}/issues`, icon: CircleDot, count: repository.issuesCount },
    { label: "Pull Requests", href: `${basePath}/pulls`, icon: GitPullRequest, count: repository.pullsCount },
    { label: "Paramètres", href: `${basePath}/settings`, icon: Settings, count: null },
  ];

  const updateRelation = async (relation: "star" | "watch") => {
    if (isUpdating) return;
    setActionError("");
    setIsUpdating(relation);
    const nextStarred = relation === "star" ? !isStarred : isStarred;
    const nextWatching = relation === "watch" ? !isWatching : isWatching;
    try {
      const starResult = relation === "star"
        ? isDemoMode
          ? { isStarred: nextStarred, starsCount: Math.max(0, starsCount + (nextStarred ? 1 : -1)) }
          : await repositoryService.setRepositoryStarred(repository.id, nextStarred)
        : { isStarred: nextStarred, starsCount };
      const watchResult = relation === "watch"
        ? isDemoMode
          ? { isWatching: nextWatching, watchersCount: Math.max(0, watchersCount + (nextWatching ? 1 : -1)) }
          : await repositoryService.setRepositoryWatching(repository.id, nextWatching)
        : { isWatching: nextWatching, watchersCount };

      if (isDemoMode && relation === "star") toggleStarRepo(repository.id);
      setInteraction({
        repositoryId: repository.id,
        isStarred: starResult.isStarred,
        starsCount: starResult.starsCount,
        isWatching: watchResult.isWatching,
        watchersCount: watchResult.watchersCount,
      });
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      setActionError(
        status === 401
          ? "Connectez-vous pour suivre ou étoiler ce dépôt."
          : "Cette action est temporairement indisponible.",
      );
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="border-b border-[#30363d] bg-[#0d1117]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-0">
        {/* Top Info Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <FolderGit2 className="h-5 w-5 text-[#8b949e]" />
            <Link
              href={ownerHref}
              className="text-base font-medium text-[#2f81f7] hover:underline"
            >
              {repository.owner.username}
            </Link>
            <span className="text-[#A1A1AA]">/</span>
            <Link
              href={basePath}
              className="text-base font-semibold text-[#e6edf3] hover:underline"
            >
              {repository.name}
            </Link>
            <span className="ui-badge">
              {repository.isPrivate ? "Privé" : "Public"}
            </span>
          </div>

          {/* Action buttons: Watch, Fork, Star, Code Clone */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Watch */}
            <button
              type="button"
              aria-pressed={isWatching}
              disabled={isUpdating !== null}
              onClick={() => void updateRelation("watch")}
              className="ui-button ui-button-secondary px-3 py-1.5 text-xs disabled:opacity-60"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{isWatching ? "Ne plus suivre" : "Suivre"} ({watchersCount})</span>
            </button>

            {/* Fork */}
            <button
              type="button"
              disabled
              title="Le fork Git n’est pas encore disponible."
              className="ui-button ui-button-secondary cursor-not-allowed px-3 py-1.5 text-xs opacity-60"
            >
              <GitFork className="h-3.5 w-3.5" />
              <span>Fork ({repository.forksCount})</span>
            </button>

            {/* Star */}
            <button
              type="button"
              aria-pressed={isStarred}
              disabled={isUpdating !== null}
              onClick={() => void updateRelation("star")}
              className="ui-button ui-button-secondary px-3 py-1.5 text-xs disabled:opacity-60"
            >
              <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-current" : ""}`} />
              <span>{isStarred ? "Étoilé" : "Ajouter étoile"} ({starsCount})</span>
            </button>

            <button
              type="button"
              disabled
              title="Le clonage Git et le téléchargement ZIP ne sont pas encore disponibles."
              className="ui-button ui-button-primary cursor-not-allowed px-3.5 py-1.5 text-xs opacity-60"
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Git bientôt</span>
            </button>
          </div>
        </div>
        {actionError && <p role="alert" className="pb-3 text-xs text-rose-300">{actionError}</p>}

        {/* Tab Navigation */}
        <nav aria-label="Navigation du dépôt" className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              tab.label === "Code"
                ? pathname === basePath
                : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.label}
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? "border-[#2f81f7] text-[#e6edf3]"
                    : "border-transparent text-[#8b949e] hover:border-[#30363d] hover:text-[#e6edf3]"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className="ui-badge rounded-full px-1.5 py-0.2 text-[10px]">
                    {tab.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
