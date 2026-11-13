"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, AlertCircle } from "lucide-react";
import { useAfriHubStore } from "@/lib/store";
import { BrandMark } from "@/components/layout/BrandMark";
import { authService } from "@/services/auth.service";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAfriHubStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Veuillez renseigner votre adresse e-mail.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { user } = await authService.login({ email: email.trim(), password });
      login(user);
      router.push("/dashboard");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Connexion impossible. Réessayez."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page flex min-h-dvh items-center justify-center px-4 py-4 sm:px-6">
      <div className="auth-card w-full max-w-sm rounded-2xl bg-[#111113] p-6 sm:p-7">
        {/* Header */}
        <div className="mb-5 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center">
            <BrandMark size={48} className="h-12 w-12" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Connexion à MetafriX
          </h1>
          <p className="mt-1.5 text-xs text-[#A1A1AA]">
            Accédez à vos dépôts Git et à votre réseau de développeurs
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-500/10 p-2.5 text-sm text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Adresse e-mail ou nom d&apos;utilisateur
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#A1A1AA]" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                placeholder="nom@domaine.com ou nom d’utilisateur"
                required
                className="auth-field w-full rounded-lg bg-[#18181B] py-2 pl-10 pr-4 text-sm text-white placeholder-[#A1A1AA] transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Mot de passe
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#818CF8] hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#A1A1AA]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                autoComplete="current-password"
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
                Connexion en cours...
              </span>
            ) : (
              <>
                <span>Se connecter</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-5 text-center text-xs text-[#A1A1AA]">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-medium text-[#818CF8] hover:underline">
            Créer un compte MetafriX
          </Link>
        </p>
      </div>
    </div>
  );
}
