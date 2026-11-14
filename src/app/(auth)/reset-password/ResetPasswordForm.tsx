"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Lock } from "lucide-react";

import { AuthFooter } from "@/components/auth/AuthFooter";
import { BrandMark } from "@/components/layout/BrandMark";
import { authService } from "@/services/auth.service";

export function ResetPasswordForm({ uid, token }: { uid: string; token: string }) {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!uid || !token) {
      setError("Le lien de réinitialisation est incomplet ou invalide.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.confirmPasswordReset(uid, token, password);
      setIsComplete(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Le lien est invalide ou expiré.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page flex min-h-dvh flex-col items-center justify-center px-4 py-8 sm:px-6">
      <main className="auth-card w-full max-w-md rounded-2xl bg-[#111113] p-6 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center"><BrandMark size={48} className="h-12 w-12" /></div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Nouveau mot de passe</h1>
          <p className="mt-2 text-sm text-[#A1A1AA]">Choisissez un nouveau mot de passe pour votre compte.</p>
        </div>

        {error && <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{error}</span></div>}
        {isComplete ? (
          <div role="status" className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-4 text-center text-sm text-emerald-200">
            <CheckCircle2 className="mx-auto mb-2 h-5 w-5" aria-hidden="true" />
            Votre mot de passe a été modifié. Toutes les sessions existantes sont révoquées; reconnectez-vous.
            <Link href="/login/email" className="mt-4 flex min-h-11 items-center justify-center rounded-lg bg-[#8976F2] px-4 font-semibold text-white transition-colors hover:bg-[#7562DD]">Se connecter</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-300">Nouveau mot de passe</label>
              <div className="relative"><Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#A1A1AA]" aria-hidden="true" /><input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={10} maxLength={128} required className="auth-field w-full rounded-lg bg-[#18181B] py-3 pl-10 pr-4 text-sm text-white" /></div>
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-300">Confirmer le mot de passe</label>
              <div className="relative"><Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#A1A1AA]" aria-hidden="true" /><input id="confirm-password" type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} autoComplete="new-password" minLength={10} maxLength={128} required className="auth-field w-full rounded-lg bg-[#18181B] py-3 pl-10 pr-4 text-sm text-white" /></div>
            </div>
            <p className="text-xs text-[#8b929d]">Minimum 10 caractères; les règles de sécurité sont validées par le serveur.</p>
            <button type="submit" disabled={isLoading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#8976F2] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#7562DD] disabled:opacity-60">
              {isLoading ? <span className="auth-spinner" aria-hidden="true" /> : null}
              {isLoading ? "Modification en cours…" : "Réinitialiser le mot de passe"}
            </button>
          </form>
        )}
      </main>
      <AuthFooter />
    </div>
  );
}