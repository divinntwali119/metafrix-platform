"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, User, AlertCircle } from "lucide-react";
import { useAfriHubStore } from "@/lib/store";
import { BrandMark } from "@/components/layout/BrandMark";
import { authService } from "@/services/auth.service";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAfriHubStore();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const { user } = await authService.register({
        ...formData,
        name: formData.name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
      });
      login(user);
      router.push("/dashboard");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "La création du compte a échoué. Réessayez."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page flex min-h-dvh items-center justify-center px-4 py-4 sm:px-6">
      <div className="auth-card w-full max-w-sm rounded-2xl bg-[#111113] p-5 sm:p-6">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center">
            <BrandMark size={44} className="h-11 w-11" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Rejoindre MetafriX
          </h1>
          <p className="mt-1.5 text-xs text-[#A1A1AA]">
            Créez votre profil de développeur et publiez vos premiers projets
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg bg-rose-500/10 p-2.5 text-sm text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Nom complet
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-[#A1A1AA]" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoComplete="name"
                minLength={2}
                maxLength={150}
                required
                className="auth-field w-full rounded-lg bg-[#18181B] py-2 pl-10 pr-4 text-sm text-white placeholder-[#A1A1AA] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
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
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                minLength={3}
                maxLength={150}
                required
                className="auth-field w-full rounded-lg bg-[#18181B] py-2 pl-9 pr-4 text-sm text-white placeholder-[#A1A1AA] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Adresse e-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#A1A1AA]" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                autoComplete="email"
                maxLength={254}
                required
                className="auth-field w-full rounded-lg bg-[#18181B] py-2 pl-10 pr-4 text-sm text-white placeholder-[#A1A1AA] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#A1A1AA]" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                autoComplete="new-password"
                minLength={10}
                maxLength={128}
                required
                className="auth-field w-full rounded-lg bg-[#18181B] py-2 pl-10 pr-4 text-sm text-white placeholder-[#A1A1AA] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-[#6366F1] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#4F46E5] disabled:opacity-50"
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

        <p className="mt-5 text-center text-xs text-[#A1A1AA]">
          Déjà inscrit ?{" "}
          <Link href="/login" className="font-medium text-[#818CF8] hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
