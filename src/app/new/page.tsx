"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { FolderGit2, ArrowRight, Lock, Globe, AlertCircle } from "lucide-react";
import { useAfriHubStore } from "@/lib/store";

interface PageProps {
  searchParams: Promise<{ organization?: string }>;
}

export default function NewRepositoryPage({ searchParams }: PageProps) {
  const router = useRouter();
  const { organization: organizationSlug } = use(searchParams);
  const { currentUser, organizations, repositories, addRepository, addOrganizationRepository } = useAfriHubStore();
  const organization = organizations.find((org) => org.slug === organizationSlug);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [language, setLanguage] = useState("TypeScript");
  const [topics, setTopics] = useState("fintech, open-source, africa");
  const [addReadme, setAddReadme] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Veuillez renseigner un nom de dépôt.");
      return;
    }

    const formattedName = name.trim().toLowerCase().replace(/\s+/g, "-");

    if (
      organization &&
      repositories.some(
        (repo) =>
          organization.repositoryIds?.includes(repo.id) &&
          repo.name.toLowerCase() === formattedName.toLowerCase()
      )
    ) {
      setError("Ce dépôt existe déjà dans cette organisation.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const newRepo = addRepository({
      name: formattedName,
      organizationId: organization?.id,
      description: description.trim(),
      isPrivate,
      defaultBranch: "main",
      language,
      languageColor: language === "TypeScript" ? "#3178c6" : language === "Python" ? "#3572A5" : "#00ADD8",
      size: "1.2 MB",
      license: "MIT",
      topics: topics.split(",").map((t) => t.trim()).filter(Boolean),
    });

    if (organization) {
      addOrganizationRepository(organization.id, newRepo.id);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      router.push(`/${newRepo.owner.username}/${newRepo.name}`);
    }, 400);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-2xl bg-[#111113] border border-[#27272A] p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 pb-6 border-b border-[#27272A]">
          <div className="p-3 rounded-xl bg-[#6366F1]/10 text-[#818CF8] border border-[#6366F1]/20">
            <FolderGit2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {organization ? `Nouveau dépôt pour ${organization.name}` : "Créer un nouveau dépôt Git"}
            </h1>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Un dépôt contient tous les fichiers de votre projet ainsi que son historique de versions.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Owner & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                {organization ? "Organisation" : "Propriétaire"}
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#18181B] border border-[#27272A] text-xs text-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={organization?.avatar || currentUser.avatar}
                  alt={organization?.name || currentUser.name}
                  className="ui-avatar h-5 w-5 rounded-full object-cover"
                />
                <span className="font-semibold">{organization?.name || currentUser.username}</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Nom du dépôt *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="mon-super-projet"
                required
                className="w-full rounded-xl bg-[#18181B] border border-[#27272A] px-4 py-2.5 text-xs text-white placeholder-[#A1A1AA] focus:border-[#6366F1] focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Description (facultatif)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brève description de la finalité de ce dépôt..."
              className="w-full rounded-xl bg-[#18181B] border border-[#27272A] px-4 py-2.5 text-xs text-white placeholder-[#A1A1AA] focus:border-[#6366F1] focus:outline-none"
            />
          </div>

          {/* Language & Topics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Langage principal
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-xl bg-[#18181B] border border-[#27272A] px-4 py-2.5 text-xs text-white focus:border-[#6366F1] focus:outline-none"
              >
                <option value="TypeScript">TypeScript</option>
                <option value="Python">Python</option>
                <option value="Go">Go</option>
                <option value="Rust">Rust</option>
                <option value="PHP">PHP</option>
                <option value="Java">Java</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Mots-clés (séparés par virgules)
              </label>
              <input
                type="text"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                placeholder="ai, payment, nextjs"
                className="w-full rounded-xl bg-[#18181B] border border-[#27272A] px-4 py-2.5 text-xs text-white placeholder-[#A1A1AA] focus:border-[#6366F1] focus:outline-none"
              />
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Visibilité
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => setIsPrivate(false)}
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  !isPrivate
                    ? "bg-[#6366F1]/10 border-[#6366F1] text-white"
                    : "bg-[#18181B] border-[#27272A] text-[#A1A1AA]"
                }`}
              >
                <Globe className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-white block">Public</span>
                  <span className="text-[11px] text-[#A1A1AA]">
                    Accessible par tous sur MetafriX et dans le réseau mondial.
                  </span>
                </div>
              </label>

              <label
                onClick={() => setIsPrivate(true)}
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  isPrivate
                    ? "bg-[#6366F1]/10 border-[#6366F1] text-white"
                    : "bg-[#18181B] border-[#27272A] text-[#A1A1AA]"
                }`}
              >
                <Lock className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-white block">Privé</span>
                  <span className="text-[11px] text-[#A1A1AA]">
                    Vous choisissez explicitement qui peut voir et collaborer.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Checkbox initialize with README */}
          <div className="flex items-center gap-2.5 pt-2">
            <input
              type="checkbox"
              id="readme"
              checked={addReadme}
              onChange={(e) => setAddReadme(e.target.checked)}
              className="rounded bg-[#18181B] border-[#27272A] text-[#6366F1] focus:ring-0"
            />
            <label htmlFor="readme" className="text-xs text-zinc-300 cursor-pointer">
              Initialiser ce dépôt avec un fichier <strong>README.md</strong>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-[#27272A] flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-[#6366F1] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md hover:bg-[#4F46E5] transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Création du dépôt..." : "Créer le dépôt"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
