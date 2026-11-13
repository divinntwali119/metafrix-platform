"use client";

import { use, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { RepoHeader } from "@/components/repository/RepoHeader";
import { RepositoryNotFound } from "@/components/repository/RepositoryNotFound";
import { RepositoryUnavailable } from "@/components/repository/RepositoryUnavailable";
import { useRepository } from "@/hooks/useRepository";
import { useAfriHubStore } from "@/lib/store";
import { repositoryService } from "@/services/repository.service";
import type { Repository } from "@/types";

interface PageProps {
  params: Promise<{
    username: string;
    repository: string;
  }>;
}

export default function RepoSettingsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { username, repository: repoName } = resolvedParams;
  const { repository: repo, isLoading, error } = useRepository(username, repoName);
  const { currentUser, isAuthenticated, authLoading } = useAfriHubStore();
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (isLoading || authLoading) {
    return <div role="status" className="mx-auto max-w-5xl px-4 py-16 text-sm text-[#A1A1AA]">Chargement des paramètres…</div>;
  }

  if (!repo && error) return <RepositoryUnavailable message={error} />;
  if (!repo) {
    return <RepositoryNotFound username={username} repository={repoName} />;
  }

  const isOwner = isDemoMode
    ? repo.owner.username.toLowerCase() === currentUser.username.toLowerCase()
    : isAuthenticated && String(repo.owner.id) === String(currentUser.id);
  if (!isOwner) {
    return <RepositoryNotFound username={username} repository={repoName} />;
  }

  return <RepositorySettingsForm repository={repo} isDemoMode={isDemoMode} />;
}

function RepositorySettingsForm({
  repository,
  isDemoMode,
}: {
  repository: Repository;
  isDemoMode: boolean;
}) {
  const upsertRepository = useAfriHubStore((state) => state.upsertRepository);
  const [description, setDescription] = useState(repository.description || "");
  const [isPrivate, setIsPrivate] = useState(repository.isPrivate);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [requestError, setRequestError] = useState("");

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setRequestError("");
    try {
      const updatedRepository = isDemoMode
        ? { ...repository, description, isPrivate }
        : await repositoryService.updateRepository(repository.id, { description, isPrivate });
      upsertRepository(updatedRepository);
      setSaveSuccess(true);
      window.setTimeout(() => setSaveSuccess(false), 2500);
    } catch {
      setRequestError("Les paramètres n’ont pas pu être enregistrés. Réessayez plus tard.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <RepoHeader repository={repository} />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-xl font-bold text-white">Paramètres du dépôt</h1>
          <p className="text-xs text-[#A1A1AA] mt-1">
            Modifiez la description et la visibilité de votre dépôt.
          </p>
        </div>

        {/* General Settings */}
        <div className="ui-panel space-y-4 p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-white">Informations générales</h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="repository-name" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Nom du dépôt
              </label>
              <input
                id="repository-name"
                type="text"
                value={repository.name}
                readOnly
                className="ui-field w-full cursor-not-allowed px-3.5 py-2 text-xs opacity-70"
              />
              <p className="mt-1.5 text-xs text-[#A1A1AA]">Le renommage du dépôt Git n’est pas encore pris en charge.</p>
            </div>

            <div>
              <label htmlFor="repository-description" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                id="repository-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="ui-field w-full p-3 text-xs"
              />
            </div>

            <div>
              <label htmlFor="repository-visibility" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Visibilité
              </label>
              <select
                id="repository-visibility"
                value={isPrivate ? "private" : "public"}
                onChange={(event) => setIsPrivate(event.target.value === "private")}
                className="ui-field w-full px-3.5 py-2 text-xs"
              >
                <option value="public">Public</option>
                <option value="private">Privé</option>
              </select>
            </div>

            {isDemoMode && <p className="text-xs text-amber-300">Mode démo : les changements ne sont pas enregistrés sur le serveur.</p>}
            {requestError && <p role="alert" className="text-xs text-rose-300">{requestError}</p>}

            <div className="flex items-center justify-between pt-2">
              {saveSuccess && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <Check className="h-4 w-4" /> Modifications enregistrées
                </span>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="ui-button ui-button-primary ml-auto px-4 py-2 text-xs disabled:opacity-60"
              >
                {isSaving ? "Enregistrement…" : "Sauvegarder"}
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl bg-rose-950/20 border border-rose-500/30 p-6 space-y-4">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-sm font-semibold text-white">Zone de danger</h2>
          </div>

          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            La suppression n’est pas encore disponible. Elle doit supprimer de façon
            coordonnée les enregistrements, le dépôt Git et les données associées.
          </p>

          <button
            type="button"
            disabled
            title="La suppression sécurisée du dépôt Git n’est pas encore implémentée."
            className="cursor-not-allowed rounded-xl border border-rose-600/40 bg-rose-600/10 px-4 py-2 text-xs font-semibold text-rose-300 opacity-60"
          >
            Suppression indisponible
          </button>
        </div>
      </div>
    </div>
  );
}
