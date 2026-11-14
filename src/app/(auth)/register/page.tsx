"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, Lock, Mail, User } from "lucide-react";

import { AuthFooter } from "@/components/auth/AuthFooter";
import { BrandMark } from "@/components/layout/BrandMark";
import { authService, type RegisterPayload } from "@/services/auth.service";

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterPayload>({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [verificationPending, setVerificationPending] = useState(false);
  const [emailSent, setEmailSent] = useState(true);
  const [resendMessage, setResendMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const result = await authService.register({
        ...formData,
        name: formData.name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
      });
      setEmailSent(result.email_sent);
      setVerificationPending(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "La création du compte a échoué. Réessayez.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async () => {
    setIsResending(true);
    setResendMessage("");
    setError("");
    try {
      const result = await authService.resendVerificationEmail(formData.email.trim());
      setResendMessage(result.detail);
      setEmailSent(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Envoi impossible. Réessayez.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-page flex min-h-dvh flex-col items-center justify-center px-4 py-8 sm:px-6">
      <main className="auth-card w-full max-w-md rounded-2xl bg-[#111113] p-6 sm:p-8">
        <Link href="/login" className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-[#A1A1AA] transition-colors hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Autres options de connexion
        </Link>

        {verificationPending ? (
          <section className="py-3 text-center" aria-live="polite">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Vérifiez votre boîte e-mail</h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#A1A1AA]">
              {emailSent ? "Un lien de confirmation a été envoyé à " : "Le compte a été créé, mais l’envoi du lien a échoué pour "}
              <span className="font-medium text-white">{formData.email}</span>
              {emailSent ? ". Confirmez votre adresse avant de vous connecter." : ". Vérifiez la configuration e-mail du serveur puis demandez un nouvel envoi."}
            </p>
            {!emailSent && <p role="alert" className="mt-4 rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-left text-xs leading-relaxed text-amber-200">Aucune session n’est ouverte tant que l’adresse n’est pas confirmée.</p>}
            {resendMessage && (
              <p role="status" className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-left text-xs text-emerald-200">
                {resendMessage}
              </p>
            )}
            {error && (
              <p role="alert" className="mt-4 rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-left text-xs text-rose-200">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={resendVerification}
              disabled={isResending}
              className="mt-5 min-h-11 w-full rounded-lg border border-[#3a3e46] bg-[#191c21] px-4 text-sm font-semibold text-white transition-colors hover:border-[#8976F2]/60 hover:bg-[#21252c] disabled:opacity-60"
            >
              {isResending ? "Envoi en cours…" : "Renvoyer le lien de confirmation"}
            </button>
            <Link href="/login/email" className="mt-4 inline-block text-sm font-medium text-[#b6a7ff] hover:text-white hover:underline">
              Aller à la connexion
            </Link>
          </section>
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
                <BrandMark size={48} className="h-12 w-12" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Créer votre compte</h1>
              <p className="mt-2 text-sm text-[#A1A1AA]">Un profil pour vos projets et votre communauté.</p>
            </div>

            {error && (
              <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="register-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-300">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-[#A1A1AA]" aria-hidden="true" />
                  <input id="register-name" type="text" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} autoComplete="name" minLength={2} maxLength={150} required className="auth-field w-full rounded-lg bg-[#18181B] py-3 pl-10 pr-4 text-sm text-white" />
                </div>
              </div>
              <div>
                <label htmlFor="register-username" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-300">Nom d’utilisateur</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-sm font-semibold text-[#A1A1AA]" aria-hidden="true">@</span>
                  <input id="register-username" type="text" value={formData.username} onChange={(event) => setFormData({ ...formData, username: event.target.value })} autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={3} maxLength={150} required className="auth-field w-full rounded-lg bg-[#18181B] py-3 pl-9 pr-4 text-sm text-white" />
                </div>
              </div>
              <div>
                <label htmlFor="register-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-300">Adresse e-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#A1A1AA]" aria-hidden="true" />
                  <input id="register-email" type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={254} required className="auth-field w-full rounded-lg bg-[#18181B] py-3 pl-10 pr-4 text-sm text-white" />
                </div>
              </div>
              <div>
                <label htmlFor="register-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-300">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#A1A1AA]" aria-hidden="true" />
                  <input id="register-password" type="password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} autoComplete="new-password" minLength={10} maxLength={128} required className="auth-field w-full rounded-lg bg-[#18181B] py-3 pl-10 pr-4 text-sm text-white" />
                </div>
                <p className="mt-1.5 text-xs text-[#8b929d]">Au moins 10 caractères. Les règles complètes sont vérifiées côté serveur.</p>
              </div>
              <button type="submit" disabled={isLoading} className="mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#8976F2] px-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#7562DD] disabled:pointer-events-none disabled:opacity-60">
                {isLoading ? <span className="auth-spinner" aria-hidden="true" /> : null}
                {isLoading ? "Création du compte…" : "S’inscrire avec une adresse e-mail"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#A1A1AA]">
              Déjà inscrit ? <Link href="/login/email" className="font-medium text-[#b6a7ff] hover:text-white hover:underline">Se connecter</Link>
            </p>
          </>
        )}
      </main>
      <AuthFooter />
    </div>
  );
}
