import { NextResponse } from "next/server";

import { authCookieSecure } from "@/lib/server/backend-proxy";
import { readServerSecret } from "@/lib/server/secrets";
import {
  createPkceChallenge,
  createRandomOAuthValue,
  getAppBaseUrl,
  getOAuthProviderConfig,
  isOAuthProvider,
} from "@/lib/server/oauth";

interface RouteContext {
  params: Promise<{ provider: string }>;
}

const OAUTH_COOKIE_MAX_AGE = 10 * 60;

function redirectToLogin(request: Request, error: string, provider?: string) {
  const baseUrl = process.env.APP_BASE_URL || new URL(request.url).origin;
  const destination = new URL("/login", baseUrl);
  destination.searchParams.set("authError", error);
  if (provider) destination.searchParams.set("provider", provider);
  return NextResponse.redirect(destination);
}

export async function GET(request: Request, { params }: RouteContext) {
  const { provider: providerParam } = await params;
  if (!isOAuthProvider(providerParam)) {
    return redirectToLogin(request, "provider_not_supported");
  }

  const config = getOAuthProviderConfig(providerParam);
  if (!config) {
    return redirectToLogin(request, "provider_not_configured", providerParam);
  }
  if (!readServerSecret("AUTH_EXCHANGE_SECRET")) {
    return redirectToLogin(request, "oauth_unavailable");
  }

  let redirectUri: string;
  try {
    redirectUri = new URL(`/api/auth/oauth/${providerParam}/callback`, getAppBaseUrl()).toString();
  } catch {
    return redirectToLogin(request, "oauth_unavailable");
  }

  const state = createRandomOAuthValue();
  const nonce = createRandomOAuthValue();
  const codeVerifier = createRandomOAuthValue();
  const authorizationUrl = new URL(config.authorizationEndpoint);
  authorizationUrl.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    response_mode: "query",
    scope: config.scope,
    state,
    nonce,
    code_challenge: createPkceChallenge(codeVerifier),
    code_challenge_method: "S256",
  }).toString();

  const response = NextResponse.redirect(authorizationUrl);
  const cookieOptions = {
    httpOnly: true,
    secure: authCookieSecure(),
    sameSite: "lax" as const,
    path: `/api/auth/oauth/${providerParam}/callback`,
    maxAge: OAUTH_COOKIE_MAX_AGE,
  };
  response.cookies.set(`metafrix_oauth_${providerParam}_state`, state, cookieOptions);
  response.cookies.set(`metafrix_oauth_${providerParam}_nonce`, nonce, cookieOptions);
  response.cookies.set(`metafrix_oauth_${providerParam}_verifier`, codeVerifier, cookieOptions);
  return response;
}