"use client";

import { use, useState } from "react";
import { GitCommit, Copy, Check } from "lucide-react";
import { RepoHeader } from "@/components/repository/RepoHeader";
import { RepositoryNotFound } from "@/components/repository/RepositoryNotFound";
import { useAfriHubStore } from "@/lib/store";
import { mockCommits } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{
    username: string;
    repository: string;
  }>;
}

export default function CommitsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { username, repository: repoName } = resolvedParams;
  const { repositories } = useAfriHubStore();

  const repo =
    repositories.find(
      (r) =>
        r.name.toLowerCase() === repoName.toLowerCase() &&
        r.owner.username.toLowerCase() === username.toLowerCase()
    );

  return repo ? (
    <RepositoryCommitsContent repo={repo} />
  ) : (
    <RepositoryNotFound username={username} repository={repoName} />
  );
}

function RepositoryCommitsContent({
  repo,
}: {
  repo: import("@/types").Repository;
}) {
  const [copiedSha, setCopiedSha] = useState<string | null>(null);
  const repoCommits = mockCommits.filter((commit) => commit.repositoryId === repo.id);

  const handleCopySha = (sha: string) => {
    navigator.clipboard.writeText(sha).then(() => {
      setCopiedSha(sha);
      setTimeout(() => setCopiedSha(null), 2000);
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#09090B]">
      <RepoHeader repository={repo} />

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCommit className="h-5 w-5 text-[#8b949e]" />
            <h1 className="text-lg font-bold text-white">
              Historique des commits sur <span className="font-mono text-[#58a6ff]">{repo.defaultBranch}</span>
            </h1>
          </div>
          <span className="text-xs text-[#8b949e]">{repoCommits.length} commits au total</span>
        </div>

        {/* Commits List */}
        <div className="rounded-2xl bg-[#111113] border border-[#27272A] overflow-hidden divide-y divide-[#27272A]/50">
          {repoCommits.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <GitCommit className="mx-auto h-8 w-8 text-[#8b949e]" aria-hidden="true" />
              <h2 className="mt-3 text-sm font-semibold text-[#e6edf3]">Aucun commit</h2>
              <p className="mt-1 text-xs text-[#8b949e]">L&apos;historique des modifications apparaîtra ici.</p>
            </div>
          ) : repoCommits.map((commit) => (
            <div
              key={commit.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#18181B] transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={commit.author.avatar}
                  alt={commit.author.name}
                  className="ui-avatar mt-0.5 h-8 w-8 shrink-0 rounded-full border border-[#27272A] object-cover"
                />
                <div>
                  <h3 className="text-sm font-semibold text-white hover:text-[#818CF8] cursor-pointer">
                    {commit.message}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#A1A1AA] mt-1">
                    <span className="font-medium text-zinc-300">
                      {commit.author.name}
                    </span>
                    <span>a commité {formatDate(commit.date)}</span>
                  </div>
                </div>
              </div>

              {/* Stats & Short SHA */}
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                {commit.stats && (
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="text-emerald-400">+{commit.stats.additions}</span>
                    <span className="text-rose-400">-{commit.stats.deletions}</span>
                  </div>
                )}

                <div className="flex items-center rounded-lg bg-[#18181B] border border-[#27272A] px-2.5 py-1 text-xs font-mono text-zinc-300">
                  <span className="text-[#818CF8]">{commit.shortSha}</span>
                  <button
                    type="button"
                    aria-label={copiedSha === commit.id ? "Hash copié" : "Copier le hash complet"}
                    onClick={() => handleCopySha(commit.id)}
                    className="ml-2 text-[#A1A1AA] hover:text-white"
                    title="Copier le hash complet"
                  >
                    {copiedSha === commit.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
