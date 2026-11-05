"use client";

import { use, useState } from "react";
import { GitPullRequest, GitMerge, Plus, Eye, Code, X } from "lucide-react";
import { RepoHeader } from "@/components/repository/RepoHeader";
import { RepositoryNotFound } from "@/components/repository/RepositoryNotFound";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAfriHubStore } from "@/lib/store";
import { mockCodeDiff } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import type { Repository } from "@/types";

interface PageProps {
  params: Promise<{
    username: string;
    repository: string;
  }>;
}

export default function PullRequestsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { username, repository: repoName } = resolvedParams;
  const { repositories } = useAfriHubStore();

  const repo = repositories.find(
    (item) =>
      item.name.toLowerCase() === repoName.toLowerCase() &&
      item.owner.username.toLowerCase() === username.toLowerCase()
  );

  if (!repo) {
    return <RepositoryNotFound username={username} repository={repoName} />;
  }

  return <PullRequestsContent repository={repo} />;
}

function PullRequestsContent({ repository }: { repository: Repository }) {
  const { pullRequests, addPullRequest } = useAfriHubStore();
  const [activeFilter, setActiveFilter] = useState<"open" | "merged">("open");
  const [showNewModal, setShowNewModal] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sourceBranch, setSourceBranch] = useState("feature/new-feature");
  const [selectedPRId, setSelectedPRId] = useState<string | null>(null);

  const repoPullRequests = pullRequests.filter(
    (pullRequest) => pullRequest.repositoryId === repository.id
  );
  const openPRs = repoPullRequests.filter((pullRequest) => pullRequest.status === "open");
  const mergedPRs = repoPullRequests.filter((pullRequest) => pullRequest.status === "merged");
  const filteredPullRequests = repoPullRequests.filter(
    (pullRequest) => pullRequest.status === activeFilter
  );

  const handleCreatePR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addPullRequest({
      repositoryId: repository.id,
      title: title.trim(),
      body: body.trim(),
      sourceBranch,
      targetBranch: repository.defaultBranch,
    });

    setTitle("");
    setBody("");
    setActiveFilter("open");
    setShowNewModal(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <RepoHeader repository={repository} />

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveFilter("open");
                setSelectedPRId(null);
              }}
              aria-pressed={activeFilter === "open"}
              className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeFilter === "open"
                  ? "border-[#238636]/50 bg-[#238636]/10 text-[#3fb950]"
                  : "border-transparent text-[#8b949e] hover:text-[#e6edf3]"
              }`}
            >
              <GitPullRequest className="h-3.5 w-3.5" />
              <span>{openPRs.length} Ouvertes</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveFilter("merged");
                setSelectedPRId(null);
              }}
              aria-pressed={activeFilter === "merged"}
              className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeFilter === "merged"
                  ? "border-[#a371f7]/50 bg-[#a371f7]/10 text-[#d2a8ff]"
                  : "border-transparent text-[#8b949e] hover:text-[#e6edf3]"
              }`}
            >
              <GitMerge className="h-3.5 w-3.5" />
              <span>{mergedPRs.length} Fusionnées</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="ui-button ui-button-primary self-start px-4 py-2 text-xs sm:self-auto sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvelle Pull Request</span>
          </button>
        </div>

        {/* Modal New PR */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
            <div role="dialog" aria-modal="true" aria-labelledby="new-pr-title" className="ui-panel max-h-[calc(100dvh-2rem)] w-full max-w-lg space-y-4 overflow-y-auto p-5 shadow-2xl sm:p-6">
              <div className="flex items-center justify-between">
                <h2 id="new-pr-title" className="text-base font-bold text-white">Ouvrir une Pull Request</h2>
                <button
                  type="button"
                  aria-label="Fermer la fenêtre"
                  onClick={() => setShowNewModal(false)}
                  className="p-1 rounded text-[#A1A1AA] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreatePR} className="space-y-4">
                <div className="ui-field flex items-center gap-2 p-2.5 text-xs font-mono">
                  <span className="text-zinc-400">base:</span>
                  <span className="font-semibold text-white">{repository.defaultBranch}</span>
                  <span className="text-[#A1A1AA]">←</span>
                  <span className="text-zinc-400">compare:</span>
                  <input
                    type="text"
                    value={sourceBranch}
                    onChange={(e) => setSourceBranch(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent font-semibold text-[#3fb950] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="feat: ajout d'une fonctionnalité"
                    required
                    className="ui-field w-full px-3.5 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                    Description des changements
                  </label>
                  <textarea
                    rows={4}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Expliquez vos modifications et les tests effectués..."
                    required
                    className="ui-field w-full p-3 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#27272A]">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="ui-button ui-button-secondary px-4 py-2 text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="ui-button ui-button-primary px-4 py-2 text-xs"
                  >
                    Créer la Pull Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Selected PR Diff View */}
        {selectedPRId && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#111113] border border-[#27272A]">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-[#818CF8]" />
                <span className="text-xs font-semibold text-white">
                  Comparaison des différences de code (Diff)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPRId(null)}
                className="text-xs text-[#818CF8] hover:underline"
              >
                Fermer l&apos;inspecteur
              </button>
            </div>

            {mockCodeDiff.map((diff) => (
              <div
                key={diff.filename}
                className="rounded-2xl bg-[#0c0c0e] border border-[#27272A] overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#18181B] border-b border-[#27272A] text-xs font-mono">
                  <span className="text-white font-medium">{diff.filename}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">+{diff.additions}</span>
                    <span className="text-rose-400">-{diff.deletions}</span>
                  </div>
                </div>

                {/* Diff Lines Table */}
                <div className="overflow-x-auto p-2 text-xs font-mono leading-relaxed">
                  <table className="w-full border-collapse">
                    <tbody>
                      {diff.hunks[0].lines.map((line, idx) => (
                        <tr
                          key={idx}
                          className={`${
                            line.type === "add"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : line.type === "delete"
                              ? "bg-rose-500/15 text-rose-300 line-through"
                              : "text-zinc-400"
                          }`}
                        >
                          <td className="w-10 select-none pr-3 text-right text-zinc-600 text-[11px]">
                            {line.oldLineNumber || " "}
                          </td>
                          <td className="w-10 select-none pr-3 text-right text-zinc-600 text-[11px]">
                            {line.newLineNumber || " "}
                          </td>
                          <td className="w-6 select-none text-center">
                            {line.type === "add" ? "+" : line.type === "delete" ? "-" : " "}
                          </td>
                          <td className="whitespace-pre py-0.5">{line.content}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pull Requests List Table */}
        <div className="ui-panel divide-y divide-[#27272A]/50 overflow-hidden">
          {filteredPullRequests.length === 0 ? (
            <EmptyState
              className="min-h-0 rounded-none border-0 bg-transparent py-12"
              icon={<GitPullRequest className="h-5 w-5" />}
              title={`Aucune pull request ${activeFilter === "open" ? "ouverte" : "fusionnée"}`}
              description={
                activeFilter === "open"
                  ? "Les propositions de modification de ce dépôt apparaîtront ici."
                  : "Les pull requests fusionnées apparaîtront ici."
              }
            />
          ) : filteredPullRequests.map((pr) => (
            <div
              key={pr.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#18181B] transition-colors"
            >
              <div className="flex items-start gap-3">
                {pr.status === "open" ? (
                  <GitPullRequest className="h-4 w-4 text-emerald-400 mt-1 shrink-0" />
                ) : (
                  <GitMerge className="h-4 w-4 text-purple-400 mt-1 shrink-0" />
                )}

                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedPRId(pr.id)}
                    className="text-left text-sm font-semibold text-white hover:text-[#818CF8]"
                  >
                    {pr.title}
                  </button>

                  <div className="flex items-center gap-2 text-xs text-[#A1A1AA] mt-1.5 flex-wrap">
                    <span>#{pr.number}</span>
                    <span>ouvert {formatDate(pr.createdAt)} par</span>
                    <span className="font-semibold text-zinc-300">
                      {pr.author.username}
                    </span>
                    <span className="rounded bg-[#18181B] px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 border border-[#27272A]">
                      {pr.sourceBranch} → {pr.targetBranch}
                    </span>
                  </div>
                </div>
              </div>

              {/* View Diff Button & Stats */}
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <div className="text-xs font-mono text-right">
                  <span className="text-emerald-400">+{pr.additions}</span>{" "}
                  <span className="text-rose-400">-{pr.deletions}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPRId(pr.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] border border-[#27272A] text-xs font-medium text-zinc-300 hover:text-white hover:bg-[#27272A] transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Voir le Diff</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
