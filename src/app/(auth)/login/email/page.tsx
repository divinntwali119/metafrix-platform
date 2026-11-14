"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2, Lock, Mail } from "lucide-react";

import { AuthFooter } from "@/components/auth/AuthFooter";
import { BrandMark } from "@/components/layout/BrandMark";
import { useAfriHubStore } from "@/lib/store";
import { authService } from "@/services/auth.service";

export default function EmailLoginPage() {
  const router = useRouter();
  const { login } = useAfriHubStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [canResendVerification, setCanResendVerification] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setVerificationMessage("");
    setCanResendVerification(false);
    setIsLoading(true);
    try {
      const { user } = await authService.login({ email: email.trim(), password });
      login(user);
      router.push("/dashboard");
    } catch (requestError) {
      const message = requestError instanceof Error
        ? requestError.message
        : "Connexion impossible. Réessayez.";
      setError(message);
      setCanResendVerification(message.toLocaleLowerCase("fr").includes("confirmez votre adresse e-mail"));
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async () => {
    setIsResending(true);
    setError("");
    try {
      const result = await authService.resendVerificationEmail(email.trim());
      setVerificationMessage(result.detail);
      setCanResendVerification(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Envoi impossible. Réessayez.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-page flex min-h-dvh flex-col items-center justify-center px-4 py-8 sm:px-6">
      <main className="auth-card w-full max-w-md rounded-2xl bg-[#111113] p-6 sm:p-8">
        <div className="mb-7 text-center">
          <Link href="/login" className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-[#A1A1AA] transition-colors hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Autres options de connexion
          </Link>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
            <BrandMark size={48} className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Se connecter par e-mail</h1>
          <p className="mt-2 text-sm text-[#A1A1AA]">Retrouvez votre espace MetafriX.</p>
        </div>

        {error && (
          <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        {verificationMessage && (
          <div role="status" className="mb-4 flex items-start gap-2.5 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{verificationMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Adresse e-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#A1A1AA]" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={254}
                placeholder="nom@domaine.com"
                required
                className="auth-field w-full rounded-lg bg-[#18181B] py-3 pl-10 pr-4 text-sm text-white placeholder-[#A1A1AA]"
              />
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Mot de passe
              </label>
              <Link href="/forgot-password" className="text-xs text-[#b6a7ff] transition-colors hover:text-white hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#A1A1AA]" aria-hidden="true" />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="auth-field w-full rounded-lg bg-[#18181B] py-3 pl-10 pr-4 text-sm text-white placeholder-[#A1A1AA]"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#8976F2] px-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#7562DD] disabled:pointer-events-none disabled:opacity-60"
          >
            {isLoading ? <span className="auth-spinner" aria-hidden="true" /> : null}
            {isLoading ? "Connexion en cours…" : "Se connecter"}
          </button>
          {canResendVerification && (
            <button
              type="button"
              onClick={resendVerification}
              disabled={isResending || !email.trim()}
              className="w-full text-center text-xs font-medium text-[#b6a7ff] hover:text-white hover:underline disabled:opacity-50"
            >
              {isResending ? "Envoi en cours…" : "Renvoyer le lien de confirmation"}
            </button>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-[#A1A1AA]">
          Nouveau sur MetafriX ?{" "}
          <Link href="/register" className="font-medium text-[#b6a7ff] hover:text-white hover:underline">
            Créer un compte
          </Link>
        </p>
      </main>
      <AuthFooter />
    </div>
  );
}
