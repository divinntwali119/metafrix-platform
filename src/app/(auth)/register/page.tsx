"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, User } from "lucide-react";
import { useAfriHubStore } from "@/lib/store";
import { BrandMark } from "@/components/layout/BrandMark";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAfriHubStore();
  const [formData, setFormData] = useState({
    name: "Nouveau Développeur",
    username: "dev_afrique",
    email: "dev@metafrix.dev",
    password: "Password123!",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login(formData.email);
      setIsLoading(false);
      router.push("/dashboard");
    }, 600);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#111113] border border-[#27272A] p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center">
            <BrandMark size={56} className="h-14 w-14" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Rejoindre MetafriX
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1.5">
            Créez votre profil de développeur et publiez vos premiers projets
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Nom complet
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-[#A1A1AA]" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full rounded-xl bg-[#18181B] border border-[#27272A] pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#A1A1AA] focus:border-[#6366F1] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Nom d&apos;utilisateur (@username)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-[#A1A1AA]">
                @
              </span>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="w-full rounded-xl bg-[#18181B] border border-[#27272A] pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#A1A1AA] focus:border-[#6366F1] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Adresse e-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#A1A1AA]" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full rounded-xl bg-[#18181B] border border-[#27272A] pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#A1A1AA] focus:border-[#6366F1] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#A1A1AA]" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="w-full rounded-xl bg-[#18181B] border border-[#27272A] pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#A1A1AA] focus:border-[#6366F1] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#6366F1] py-2.5 px-4 text-sm font-semibold text-white shadow-md hover:bg-[#4F46E5] focus:outline-none transition-all disabled:opacity-50 mt-6"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Création en cours...
              </span>
            ) : (
              <>
                <span>Créer mon compte</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-[#A1A1AA]">
          Déjà inscrit ?{" "}
          <Link href="/login" className="font-medium text-[#818CF8] hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
