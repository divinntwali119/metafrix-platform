import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  authCookieSecure,
  forwardedClientIp,
  requestBackend,
  setAuthCookies,
} from "@/lib/server/backend-proxy";
import {
  exchangeOAuthCode,
  getAppBaseUrl,
  getOAuthProviderConfig,
  isOAuthProvider,
  verifyOAuthIdToken,
} from "@/lib/server/oauth";
import { readServerSecret } from "@/lib/server/secrets";

interface RouteContext {
  params: Promise<{ provider: string }>;
}

function equalSecurely(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function clearOAuthCookies(response: NextResponse, provider: string): void {
  const path = `/api/auth/oauth/${provider}/callback`;
  for (const suffix of ["state", "nonce", "verifier"]) {
    response.cookies.set(`metafrix_oauth_${provider}_${suffix}`, "", {
      httpOnly: true,
      secure: authCookieSecure(),
      sameSite: "lax",
      path,
      maxAge: 0,
    });
  }
}

function loginRedirect(request: Request, error: string, provider?: string): NextResponse {
  const baseUrl = process.env.APP_BASE_URL || new URL(request.url).origin;
  const destination = new URL("/login", baseUrl);
  destination.searchParams.set("authError", error);
  if (provider) destination.searchParams.set("provider", provider);
  const response = NextResponse.redirect(destination);
  if (provider && isOAuthProvider(provider)) clearOAuthCookies(response, provider);
  return response;
}

export async function GET(request: Request, { params }: RouteContext) {
  const { provider: providerParam } = await params;
  if (!isOAuthProvider(providerParam)) {
    return loginRedirect(request, "provider_not_supported");
  }

  const config = getOAuthProviderConfig(providerParam);
  const authExchangeSecret = readServerSecret("AUTH_EXCHANGE_SECRET");
  if (!config || !authExchangeSecret) {
    return loginRedirect(request, "oauth_unavailable", providerParam);
  }

  const url = new URL(request.url);
  if (url.searchParams.has("error")) {
    return loginRedirect(request, "provider_cancelled", providerParam);
  }

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(`metafrix_oauth_${providerParam}_state`)?.value;
  const expectedNonce = cookieStore.get(`metafrix_oauth_${providerParam}_nonce`)?.value;
  const codeVerifier = cookieStore.get(`metafrix_oauth_${providerParam}_verifier`)?.value;

  if (
    !code || !returnedState || !expectedState || !expectedNonce || !codeVerifier ||
    !equalSecurely(returnedState, expectedState)
  ) {
    return loginRedirect(request, "oauth_invalid_state", providerParam);
  }

  try {
    const redirectUri = new URL(
      `/api/auth/oauth/${providerParam}/callback`,
      getAppBaseUrl(),
    ).toString();
    const providerTokens = await exchangeOAuthCode(config, code, redirectUri, codeVerifier);
    const identity = await verifyOAuthIdToken(
      config,
      providerTokens.idToken,
      expectedNonce,
      providerTokens.accessToken,
    );
    const backendResponse = await requestBackend("auth/oauth/exchange/", {
      method: "POST",
      body: JSON.stringify({
        provider: identity.provider,
        subject: identity.subject,
        email: identity.email,
        email_verified: identity.emailVerified,
        name: identity.name,
      }),
      extraHeaders: { "X-Auth-Exchange-Key": authExchangeSecret },
      clientIp: forwardedClientIp(request),
    });
    const responseData = await backendResponse.json().catch(() => ({})) as {
      access?: string;
      refresh?: string;
      verification_required?: boolean;
      code?: string;
    };

    if (backendResponse.status === 202 && responseData.verification_required) {
      return loginRedirect(request, "email_verification", providerParam);
    }
    if (backendResponse.status === 409 && responseData.code === "account_exists") {
      return loginRedirect(request, "account_exists", providerParam);
    }
    if (!backendResponse.ok || !responseData.access || !responseData.refresh) {
      return loginRedirect(request, "oauth_failed", providerParam);
    }

    const response = NextResponse.redirect(new URL("/dashboard", getAppBaseUrl()));
    setAuthCookies(response, {
      access: responseData.access,
      refresh: responseData.refresh,
    });
    clearOAuthCookies(response, providerParam);
    return response;
  } catch {
    return loginRedirect(request, "oauth_failed", providerParam);
  }
}