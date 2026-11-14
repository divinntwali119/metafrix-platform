"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, ArrowRight, LoaderCircle } from "lucide-react";

import { AuthFooter } from "@/components/auth/AuthFooter";
import { BrandMark } from "@/components/layout/BrandMark";

type OAuthProvider = "google" | "microsoft";

const oauthErrorMessages: Record<string, string> = {
  provider_not_configured: "Ce fournisseur n’est pas encore configuré sur le serveur.",
  oauth_unavailable: "La connexion sécurisée est temporairement indisponible.",
  provider_cancelled: "La connexion a été annulée. Vous pouvez réessayer.",
  oauth_invalid_state: "La demande de connexion a expiré. Relancez la connexion.",
  account_exists: "Un compte utilise déjà cette adresse. Connectez-vous par e-mail.",
  email_verification: "Consultez votre boîte e-mail pour confirmer votre adresse avant de continuer.",
  oauth_failed: "La connexion au fournisseur a échoué. Réessayez ou connectez-vous par e-mail.",
  provider_not_supported: "Ce fournisseur de connexion n’est pas pris en charge.",
};

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.15v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.15a11 11 0 0 0 0 9.88l3.69-2.84Z" />
      <path fill="#EA4335" d="M12 5.36c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.01 14.97 1 12 1a11 11 0 0 0-9.85 6.06l3.69 2.84C6.71 7.29 9.14 5.36 12 5.36Z" />
    </svg>
  );
}

function MicrosoftLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
      <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
      <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
      <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
    </svg>
  );
}

export function LoginOptions({ oauthError }: { oauthError: string }) {
  const [startingProvider, setStartingProvider] = useState<OAuthProvider | null>(null);

  return (
    <div className="auth-page flex min-h-dvh flex-col items-center justify-center px-4 py-8 sm:px-6">
      <main className="auth-card w-full max-w-md rounded-2xl bg-[#111113] p-6 sm:p-8">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
            <BrandMark size={48} className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.7rem]">
            Bienvenue sur MetafriX
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[#A1A1AA]">
            Connectez-vous ou créez un compte pour continuer.
          </p>
        </div>

        {oauthError && (
          <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{oauthErrorMessages[oauthError] || oauthErrorMessages.oauth_failed}</span>
          </div>
        )}

        <div className="space-y-3">
          <form action="/api/auth/oauth/google" method="get" onSubmit={() => setStartingProvider("google")}>
            <button
              type="submit"
              aria-disabled={startingProvider !== null}
              disabled={startingProvider !== null}
              className="auth-provider-button flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-white px-4 text-sm font-semibold text-[#202124] transition-all hover:-translate-y-0.5 hover:bg-[#f4f4f4] hover:shadow-md aria-disabled:pointer-events-none aria-disabled:opacity-70"
            >
              {startingProvider === "google" ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <GoogleLogo />}
              Continuer avec Google
            </button>
          </form>
          <form action="/api/auth/oauth/microsoft" method="get" onSubmit={() => setStartingProvider("microsoft")}>
            <button
              type="submit"
              aria-disabled={startingProvider !== null}
              disabled={startingProvider !== null}
              className="auth-provider-button flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-white px-4 text-sm font-semibold text-[#202124] transition-all hover:-translate-y-0.5 hover:bg-[#f4f4f4] hover:shadow-md aria-disabled:pointer-events-none aria-disabled:opacity-70"
            >
              {startingProvider === "microsoft" ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <MicrosoftLogo />}
              Continuer avec Microsoft
            </button>
          </form>
        </div>

        <div className="my-6 flex items-center gap-4" aria-hidden="true">
          <span className="h-px flex-1 bg-[#2d3137]" />
          <span className="text-[11px] font-semibold tracking-[0.18em] text-[#777d87]">OU</span>
          <span className="h-px flex-1 bg-[#2d3137]" />
        </div>

        <div className="space-y-3">
          <Link
            href="/register"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#8976F2] px-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#7562DD] hover:shadow-lg hover:shadow-[#8976F2]/15"
          >
            S’inscrire avec une adresse e-mail
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/login/email"
            className="flex min-h-12 w-full items-center justify-center rounded-lg border border-[#3a3e46] bg-[#191c21] px-4 text-sm font-semibold text-[#e6edf3] transition-all hover:-translate-y-0.5 hover:border-[#8976F2]/60 hover:bg-[#21252c]"
          >
            Se connecter avec une adresse e-mail
          </Link>
        </div>
      </main>
      <AuthFooter />
    </div>
  );
}
