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
  Copy,
  Check,
  Download,
} from "lucide-react";
import { Repository } from "@/types";
import { useAfriHubStore } from "@/lib/store";
import { mockCommits } from "@/lib/mock-data";

interface RepoHeaderProps {
  repository: Repository;
}

export function RepoHeader({ repository }: RepoHeaderProps) {
  const pathname = usePathname();
  const { toggleStarRepo, issues, pullRequests } = useAfriHubStore();
  const [showCloneDropdown, setShowCloneDropdown] = useState(false);
  const [cloneMode, setCloneMode] = useState<"https" | "ssh">("https");
  const [copied, setCopied] = useState(false);

  const basePath = `/${repository.owner.username}/${repository.name}`;

  const cloneUrl =
    cloneMode === "https"
      ? `https://metafrix.dev/${repository.owner.username}/${repository.name}.git`
      : `git@metafrix.dev:${repository.owner.username}/${repository.name}.git`;
  const repoIssues = issues.filter((issue) => issue.repositoryId === repository.id);
  const repoPullRequests = pullRequests.filter(
    (pullRequest) => pullRequest.repositoryId === repository.id
  );
  const commitCount = mockCommits.filter((commit) => commit.repositoryId === repository.id).length;

  const tabs = [
    { label: "Code", href: basePath, icon: Code2, count: null },
    { label: "Commits", href: `${basePath}/commits`, icon: GitCommit, count: commitCount },
    { label: "Issues", href: `${basePath}/issues`, icon: CircleDot, count: repoIssues.filter((issue) => issue.status === "open").length },
    { label: "Pull Requests", href: `${basePath}/pulls`, icon: GitPullRequest, count: repoPullRequests.filter((pullRequest) => pullRequest.status === "open").length },
    { label: "Paramètres", href: `${basePath}/settings`, icon: Settings, count: null },
  ];

  const copyCloneUrl = () => {
    navigator.clipboard.writeText(cloneUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="border-b border-[#30363d] bg-[#0d1117]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-0">
        {/* Top Info Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <FolderGit2 className="h-5 w-5 text-[#8b949e]" />
            <Link
              href={`/developers/${repository.owner.username}`}
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
            <button type="button" className="ui-button ui-button-secondary px-3 py-1.5 text-xs">
              <Eye className="h-3.5 w-3.5" />
              <span>Suivre ({repository.watchersCount})</span>
            </button>

            {/* Fork */}
            <button type="button" className="ui-button ui-button-secondary px-3 py-1.5 text-xs">
              <GitFork className="h-3.5 w-3.5" />
              <span>Fork ({repository.forksCount})</span>
            </button>

            {/* Star */}
            <button
              type="button"
              onClick={() => toggleStarRepo(repository.id)}
              className="ui-button ui-button-secondary px-3 py-1.5 text-xs"
            >
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>Star ({repository.starsCount})</span>
            </button>

            {/* Code / Clone Dropdown */}
            <div className="relative">
              <button
                type="button"
                aria-expanded={showCloneDropdown}
                aria-haspopup="true"
                onClick={() => setShowCloneDropdown(!showCloneDropdown)}
                className="ui-button ui-button-primary px-3.5 py-1.5 text-xs"
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>Code</span>
              </button>

              {showCloneDropdown && (
                <div
                  role="dialog"
                  aria-label="Cloner ou télécharger le dépôt"
                  className="ui-menu absolute right-0 z-30 mt-2 w-80 p-4 text-xs animate-in fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-3 flex items-center gap-2 border-b border-[#30363d] pb-2">
                    <button
                      type="button"
                      aria-pressed={cloneMode === "https"}
                      onClick={() => setCloneMode("https")}
                      className={`font-semibold pb-1 border-b-2 transition-all ${
                        cloneMode === "https"
                          ? "border-[#2f81f7] text-[#e6edf3]"
                          : "border-transparent text-[#8b949e] hover:text-[#e6edf3]"
                      }`}
                    >
                      HTTPS
                    </button>
                    <button
                      type="button"
                      aria-pressed={cloneMode === "ssh"}
                      onClick={() => setCloneMode("ssh")}
                      className={`font-semibold pb-1 border-b-2 transition-all ${
                        cloneMode === "ssh"
                          ? "border-[#2f81f7] text-[#e6edf3]"
                          : "border-transparent text-[#8b949e] hover:text-[#e6edf3]"
                      }`}
                    >
                      SSH
                    </button>
                  </div>

                  <div className="ui-field flex items-center gap-1.5 p-1.5">
                    <input
                      type="text"
                      aria-label="URL de clonage"
                      readOnly
                      value={cloneUrl}
                      className="bg-transparent text-[11px] font-mono text-zinc-300 w-full outline-none select-all"
                    />
                    <button
                      type="button"
                      aria-label={copied ? "URL copiée" : "Copier l’URL"}
                      onClick={copyCloneUrl}
                      className="ui-button ui-button-quiet shrink-0 p-1.5"
                      title="Copier l'URL"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="mt-3 border-t border-[#30363d] pt-3">
                    <a
                      href={`https://metafrix.dev/archive/${repository.name}.zip`}
                      className="flex items-center gap-2 py-1 text-[#c9d1d9] transition-colors hover:text-[#e6edf3]"
                    >
                      <Download className="h-3.5 w-3.5 text-[#8b949e]" />
                      <span>Télécharger le code ZIP</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

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
