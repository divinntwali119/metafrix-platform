"use client";

import { use, useState } from "react";
import { CircleDot, CheckCircle2, MessageSquare, Plus, X } from "lucide-react";
import { RepoHeader } from "@/components/repository/RepoHeader";
import { RepositoryNotFound } from "@/components/repository/RepositoryNotFound";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAfriHubStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{
    username: string;
    repository: string;
  }>;
}

export default function IssuesPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { username, repository: repoName } = resolvedParams;
  const { repositories, issues, addIssue } = useAfriHubStore();

  const repo =
    repositories.find(
      (r) =>
        r.name.toLowerCase() === repoName.toLowerCase() &&
        r.owner.username.toLowerCase() === username.toLowerCase()
    );

  const [filter, setFilter] = useState<"open" | "closed">("open");
  const [showNewModal, setShowNewModal] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [label, setLabel] = useState("enhancement");

  const repoIssues = issues.filter((issue) => {
    return issue.repositoryId === repo?.id;
  });
  const filteredIssues = repoIssues.filter((issue) => issue.status === filter);
  const openCount = repoIssues.filter((issue) => issue.status === "open").length;
  const closedCount = repoIssues.filter((issue) => issue.status === "closed").length;

  if (!repo) {
    return <RepositoryNotFound username={username} repository={repoName} />;
  }

  const handleCreateIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addIssue({
      repositoryId: repo.id,
      title: title.trim(),
      body: body.trim(),
      labels: [
        {
          name: label,
          color: label === "bug" ? "#ef4444" : label === "enhancement" ? "#6366f1" : "#10b981",
        },
      ],
    });

    setTitle("");
    setBody("");
    setFilter("open");
    setShowNewModal(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <RepoHeader repository={repo} />

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Top bar with Open/Closed count and New Issue button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter("open")}
              aria-pressed={filter === "open"}
              className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === "open"
                  ? "border-[#238636]/50 bg-[#238636]/10 text-[#3fb950]"
                  : "border-transparent text-[#8b949e] hover:text-[#e6edf3]"
              }`}
            >
              <CircleDot className="h-3.5 w-3.5" />
              <span>{openCount} Ouvertes</span>
            </button>

            <button
              type="button"
              onClick={() => setFilter("closed")}
              aria-pressed={filter === "closed"}
              className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === "closed"
                  ? "border-[#a371f7]/50 bg-[#a371f7]/10 text-[#d2a8ff]"
                  : "border-transparent text-[#8b949e] hover:text-[#e6edf3]"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{closedCount} Fermées</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="ui-button ui-button-primary self-start px-4 py-2 text-xs sm:self-auto sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvelle Issue</span>
          </button>
        </div>

        {/* Modal New Issue */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
            <div role="dialog" aria-modal="true" aria-labelledby="new-issue-title" className="ui-panel max-h-[calc(100dvh-2rem)] w-full max-w-lg space-y-4 overflow-y-auto p-5 shadow-2xl sm:p-6">
              <div className="flex items-center justify-between">
                <h2 id="new-issue-title" className="text-base font-bold text-white">Créer une issue</h2>
                <button
                  type="button"
                  aria-label="Fermer la fenêtre"
                  onClick={() => setShowNewModal(false)}
                  className="p-1 rounded text-[#A1A1AA] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateIssue} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Erreur lors de l'appel au webhook Wave"
                    required
                    className="ui-field w-full px-3.5 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                    Description détaillée
                  </label>
                  <textarea
                    rows={4}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Décrivez le problème ou l'amélioration souhaitée..."
                    required
                    className="ui-field w-full p-3 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                    Label
                  </label>
                  <select
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="ui-field w-full px-3 py-2 text-xs"
                  >
                    <option value="bug">bug (anomalie)</option>
                    <option value="enhancement">enhancement (amélioration)</option>
                    <option value="documentation">documentation</option>
                  </select>
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
                    Soumettre l&apos;issue
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Issues List Table */}
        <div className="ui-panel divide-y divide-[#30363d] overflow-hidden">
          {filteredIssues.length === 0 ? (
            <EmptyState
              className="min-h-0 rounded-none border-0 bg-transparent py-12"
              icon={<CircleDot className="h-5 w-5" />}
              title={`Aucune issue ${filter === "open" ? "ouverte" : "fermée"}`}
              description={
                filter === "open"
                  ? "Créez une issue pour suivre un problème ou une amélioration."
                  : "Les issues fermées apparaîtront ici."
              }
            />
          ) : filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-[#18181B] transition-colors"
            >
              <div className="flex items-start gap-3">
                {issue.status === "open" ? (
                  <CircleDot className="h-4 w-4 text-emerald-400 mt-1 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-purple-400 mt-1 shrink-0" />
                )}

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-white hover:text-[#818CF8] cursor-pointer">
                      {issue.title}
                    </h3>
                    {issue.labels.map((lbl) => (
                      <span
                        key={lbl.name}
                        className="rounded-full px-2 py-0.2 text-[10px] font-semibold border"
                        style={{
                          backgroundColor: `${lbl.color}15`,
                          borderColor: `${lbl.color}40`,
                          color: lbl.color,
                        }}
                      >
                        {lbl.name}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-[#A1A1AA] mt-1 line-clamp-1">
                    {issue.body}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-[#A1A1AA] mt-2">
                    <span>#{issue.number}</span>
                    <span>ouvert {formatDate(issue.createdAt)} par</span>
                    <span className="font-semibold text-zinc-300">
                      {issue.author.username}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comments & Assignees */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-1 text-xs text-[#A1A1AA]">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>{issue.commentsCount}</span>
                </div>
                {issue.assignees && issue.assignees.length > 0 && (
                  <div className="flex -space-x-1.5">
                    {issue.assignees.map((assignee) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={assignee.id}
                        src={assignee.avatar}
                        alt={assignee.name}
                        className="ui-avatar h-6 w-6 rounded-full border border-[#111113] object-cover"
                        title={`Assigné à ${assignee.name}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
