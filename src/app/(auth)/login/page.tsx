"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { useAfriHubStore } from "@/lib/store";
import { BrandMark } from "@/components/layout/BrandMark";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAfriHubStore();
  const [email, setEmail] = useState("divin@metafrix.dev");
  const [password, setPassword] = useState("••••••••••••");
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

    // Simulate API call
    setTimeout(() => {
      login(email);
      setIsLoading(false);
      router.push("/dashboard");
    }, 600);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#111113] border border-[#27272A] p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center">
            <BrandMark size={56} className="h-14 w-14" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Connexion à MetafriX
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1.5">
            Accédez à vos dépôts Git et à votre réseau de développeurs
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Adresse e-mail ou nom d&apos;utilisateur
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#A1A1AA]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@domaine.com"
                required
                className="w-full rounded-xl bg-[#18181B] border border-[#27272A] pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#A1A1AA] focus:border-[#6366F1] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
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

        {/* Demo Credentials hint */}
        <div className="mt-6 p-3 rounded-xl bg-[#18181B] border border-[#27272A] text-xs text-[#A1A1AA] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Compte démo pré-rempli pour tester immédiatement.</span>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-[#A1A1AA]">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-medium text-[#818CF8] hover:underline">
            Créer un compte MetafriX
          </Link>
        </p>
      </div>
    </div>
  );
}
