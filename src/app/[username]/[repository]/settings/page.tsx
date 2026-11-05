"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check } from "lucide-react";
import { RepoHeader } from "@/components/repository/RepoHeader";
import { RepositoryNotFound } from "@/components/repository/RepositoryNotFound";
import { useAfriHubStore } from "@/lib/store";

interface PageProps {
  params: Promise<{
    username: string;
    repository: string;
  }>;
}

export default function RepoSettingsPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { username, repository: repoName } = resolvedParams;
  const { repositories, deleteRepository } = useAfriHubStore();

  const repo =
    repositories.find(
      (r) =>
        r.name.toLowerCase() === repoName.toLowerCase() &&
        r.owner.username.toLowerCase() === username.toLowerCase()
    );

  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [description, setDescription] = useState(repo?.description || "");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleDelete = () => {
    if (!repo) return;
    if (confirmDeleteText !== repo.name) return;
    deleteRepository(repo.id);
    router.push("/dashboard");
  };

  if (!repo) {
    return <RepositoryNotFound username={username} repository={repoName} />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <RepoHeader repository={repo} />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-xl font-bold text-white">Paramètres du dépôt</h1>
          <p className="text-xs text-[#A1A1AA] mt-1">
            Gérez les paramètres généraux, la visibilité et la zone de danger de votre projet.
          </p>
        </div>

        {/* General Settings */}
        <div className="ui-panel space-y-4 p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-white">Informations générales</h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Nom du dépôt
              </label>
              <input
                type="text"
                defaultValue={repo.name}
                className="ui-field w-full px-3.5 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="ui-field w-full p-3 text-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {saveSuccess && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <Check className="h-4 w-4" /> Modifications enregistrées
                </span>
              )}
              <button
                type="submit"
                className="ui-button ui-button-primary ml-auto px-4 py-2 text-xs"
              >
                Sauvegarder
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
            La suppression d&apos;un dépôt Git est irréversible. Toutes les branches,
            fichiers, commits, issues et discussions associées seront définitivement effacés.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-600/40 text-xs font-semibold hover:bg-rose-600 hover:text-white transition-all"
            >
              Supprimer ce dépôt
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-[#111113] border border-rose-500/30 space-y-3">
              <p className="text-xs text-white">
                Veuillez taper <strong className="text-rose-400 font-mono">{repo.name}</strong> pour confirmer :
              </p>
              <input
                type="text"
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                placeholder={repo.name}
                className="w-full rounded-lg bg-[#18181B] border border-[#27272A] px-3 py-1.5 text-xs text-white font-mono outline-none"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDelete}
                  disabled={confirmDeleteText !== repo.name}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-40 transition-all"
                >
                  Je comprends les conséquences, supprimer définitivement
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-xs text-[#A1A1AA] hover:text-white"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
