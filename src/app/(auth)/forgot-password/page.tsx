"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from "lucide-react";

import { AuthFooter } from "@/components/auth/AuthFooter";
import { BrandMark } from "@/components/layout/BrandMark";
import { authService } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await authService.requestPasswordReset(email.trim());
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "La demande n’a pas abouti. Réessayez.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page flex min-h-dvh flex-col items-center justify-center px-4 py-8 sm:px-6">
      <main className="auth-card w-full max-w-md rounded-2xl bg-[#111113] p-6 sm:p-8">
        <Link href="/login/email" className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-[#A1A1AA] transition-colors hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Retour à la connexion
        </Link>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center"><BrandMark size={48} className="h-12 w-12" /></div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Mot de passe oublié ?</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">Saisissez l’adresse e-mail de votre compte. Si elle correspond à un compte confirmé, un lien de réinitialisation vous sera envoyé.</p>
        </div>

        {error && <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{error}</span></div>}
        {submitted ? (
          <div role="status" className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm leading-relaxed text-emerald-200">
            <CheckCircle2 className="mb-2 h-5 w-5" aria-hidden="true" />
            Si un compte confirmé correspond à cette adresse, un e-mail de réinitialisation vient d’être envoyé.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="reset-request-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-300">Adresse e-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#A1A1AA]" aria-hidden="true" />
                <input id="reset-request-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" autoCapitalize="none" required maxLength={254} className="auth-field w-full rounded-lg bg-[#18181B] py-3 pl-10 pr-4 text-sm text-white" />
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#8976F2] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#7562DD] disabled:opacity-60">
              {isLoading ? <span className="auth-spinner" aria-hidden="true" /> : null}
              {isLoading ? "Envoi en cours…" : "Envoyer le lien de réinitialisation"}
            </button>
          </form>
        )}
      </main>
      <AuthFooter />
    </div>
  );
}