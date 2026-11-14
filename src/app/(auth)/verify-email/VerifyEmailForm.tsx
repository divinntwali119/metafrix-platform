"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";

import { AuthFooter } from "@/components/auth/AuthFooter";
import { BrandMark } from "@/components/layout/BrandMark";
import { authService } from "@/services/auth.service";

export function VerifyEmailForm({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(token ? "idle" : "error");
  const [message, setMessage] = useState(token ? "Confirmez votre adresse pour activer votre compte." : "Le lien de confirmation est incomplet ou invalide.");
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const verify = async () => {
    if (!token || status === "loading") return;
    setStatus("loading");
    try {
      const result = await authService.verifyEmail(token);
      setStatus("success");
      setMessage(result.detail);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Le lien est invalide ou expiré.");
    }
  };

  const resend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsResending(true);
    setResendMessage("");
    try {
      const result = await authService.resendVerificationEmail(email.trim());
      setResendMessage(result.detail);
    } catch (error) {
      setResendMessage(error instanceof Error ? error.message : "Envoi impossible. Réessayez.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-page flex min-h-dvh flex-col items-center justify-center px-4 py-8 sm:px-6">
      <main className="auth-card w-full max-w-md rounded-2xl bg-[#111113] p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
          <BrandMark size={48} className="h-12 w-12" />
        </div>
        <div className={`mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full ${status === "error" ? "bg-rose-500/10 text-rose-300" : "bg-emerald-500/10 text-emerald-300"}`}>
          {status === "loading" ? <span className="auth-spinner" aria-hidden="true" /> : status === "success" ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : status === "error" ? <AlertCircle className="h-5 w-5" aria-hidden="true" /> : <Mail className="h-5 w-5" aria-hidden="true" />}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Confirmation de votre adresse</h1>
        <p role={status === "error" ? "alert" : "status"} className="mt-3 text-sm leading-relaxed text-[#A1A1AA]">{message}</p>

        {status === "success" ? (
          <Link href="/login/email" className="mt-6 flex min-h-12 items-center justify-center rounded-lg bg-[#8976F2] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#7562DD]">
            Se connecter
          </Link>
        ) : status === "idle" || status === "loading" ? (
          <button type="button" onClick={verify} disabled={status === "loading"} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#8976F2] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#7562DD] disabled:opacity-60">
            {status === "loading" ? <span className="auth-spinner" aria-hidden="true" /> : null}
            {status === "loading" ? "Confirmation en cours…" : "Confirmer mon adresse e-mail"}
          </button>
        ) : (
          <form onSubmit={resend} className="mt-6 space-y-3 text-left">
            <label htmlFor="verify-email-address" className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">Adresse e-mail du compte</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#A1A1AA]" aria-hidden="true" />
              <input id="verify-email-address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required maxLength={254} className="auth-field w-full rounded-lg bg-[#18181B] py-3 pl-10 pr-4 text-sm text-white" />
            </div>
            <button type="submit" disabled={isResending} className="flex min-h-11 w-full items-center justify-center rounded-lg border border-[#3a3e46] bg-[#191c21] px-4 text-sm font-semibold text-white transition-colors hover:border-[#8976F2]/60 disabled:opacity-60">
              {isResending ? "Envoi en cours…" : "Renvoyer le lien de confirmation"}
            </button>
            {resendMessage && <p role="status" className="text-xs leading-relaxed text-[#A1A1AA]">{resendMessage}</p>}
          </form>
        )}
        <Link href="/login" className="mt-5 inline-block text-xs font-medium text-[#b6a7ff] hover:text-white hover:underline">Retour aux options de connexion</Link>
      </main>
      <AuthFooter />
    </div>
  );
}