"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Globe, MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAfriHubStore } from "@/lib/store";

export default function NewOrganizationPage() {
  const router = useRouter();
  const { currentUser, organizations, addOrganization } = useAfriHubStore();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("Kigali, Rwanda");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    const normalizedSlug = slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    if (
      !normalizedSlug ||
      organizations.some((org) => org.slug.toLowerCase() === normalizedSlug)
    ) {
      return;
    }

    const newOrg = addOrganization({
      name: name.trim(),
      slug: normalizedSlug,
      description:
        description.trim() || "Collectif panafricain d'ingénieurs logiciels.",
      avatar:
        "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=150&auto=format&fit=crop&q=80",
      website: website.trim() || "https://metafrix.dev",
      location: location.trim(),
      membersCount: 1,
      repositoriesCount: 0,
      repositoryIds: [],
      createdAt: new Date().toISOString(),
      members: [
        {
          user: currentUser,
          role: "owner" as const,
        },
      ],
    });
    router.push(`/organizations/${newOrg.slug}`);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        href="/organizations"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A1A1AA] hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour aux organisations
      </Link>

      <div className="rounded-2xl bg-[#111113] border border-[#27272A] p-6 sm:p-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <Building2 className="h-4 w-4" />
            <span>Nouveau Collectif</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Créer une organisation
          </h1>
          <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">
            Rassemblez vos collaborateurs sous un espace partagé avec gestion des rôles
            et dépôts d&apos;équipe.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {organizations.some((org) => org.slug.toLowerCase() === slug.trim().toLowerCase()) && (
            <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
              Cet identifiant est déjà utilisé ou invalide. Choisissez-en un autre.
            </p>
          )}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Nom de l&apos;organisation <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="ex: Nairobi AI Collective"
              value={name}
              onChange={handleNameChange}
              className="w-full rounded-xl bg-[#18181B] border border-[#27272A] px-3.5 py-2.5 text-xs text-white placeholder-[#A1A1AA] focus:border-[#6366F1] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Identifiant / Slug <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center rounded-xl bg-[#18181B] border border-[#27272A] px-3.5 py-2.5">
              <span className="text-xs text-[#A1A1AA] font-mono mr-1">metafrix.dev/</span>
              <input
                type="text"
                required
                placeholder="nairobi-ai"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder-[#A1A1AA] focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Description de la mission
            </label>
            <textarea
              rows={3}
              placeholder="Que développe ou recherche votre organisation ?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl bg-[#18181B] border border-[#27272A] px-3.5 py-2.5 text-xs text-white placeholder-[#A1A1AA] focus:border-[#6366F1] focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Site Web officiel
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A1A1AA]" />
                <input
                  type="url"
                  placeholder="https://example.africa"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full rounded-xl bg-[#18181B] border border-[#27272A] pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-[#A1A1AA] focus:border-[#6366F1] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Ville & Pays principal
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A1A1AA]" />
                <input
                  type="text"
                  placeholder="Lagos, Nigeria"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl bg-[#18181B] border border-[#27272A] pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-[#A1A1AA] focus:border-[#6366F1] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#27272A] flex justify-end gap-3">
            <Link
              href="/organizations"
              className="px-4 py-2.5 rounded-xl border border-[#27272A] text-xs font-semibold text-zinc-300 hover:bg-[#18181B] transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#6366F1] text-xs font-semibold text-white hover:bg-[#4F46E5] transition-all shadow"
            >
              Créer l&apos;organisation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
